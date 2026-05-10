/**
 * Offline corpus ingestion script.
 *
 * Walks /corpus/<philosopher>/<work>.txt, chunks each file at ~400 tokens
 * with ~50 token overlap (paragraph → sentence → character fallback), embeds
 * each chunk via the local MiniLM model, and upserts into the corpus_chunks
 * SQLite table.
 *
 * Embeddings run entirely on CPU in-process. No API keys, no rate limits,
 * no network after the first model download. Full corpus ingestion takes
 * ~10-30 minutes wall-clock depending on hardware.
 *
 * Resume-safe: by default, chunks already in the DB for a given (philosopher,
 * work, chunk_idx) are skipped, so re-running after a Ctrl+C or crash picks
 * up where it left off. Pass --force to re-embed every chunk.
 *
 * Run from the backend/ directory:
 *   npm run ingest                                    # all philosophers (resume-safe)
 *   npm run ingest -- --philosopher=nietzsche         # one philosopher only
 *   npm run ingest -- --dry-run                       # chunk + report, don't embed
 *   npm run ingest -- --force                         # re-embed even existing chunks
 *
 * Tunables (.env):
 *   EMBED_BATCH_SIZE=32   # texts per inference batch — raise for more throughput
 *                         # if you have RAM, lower if the model is OOM-ing
 *   HF_HOME=...           # where to cache the ONNX weights (default ./.cache/huggingface)
 */

import * as fs from "fs";
import * as path from "path";
import Database from "better-sqlite3";
import { encode, decode } from "gpt-tokenizer";
import { corpus } from "../src/db";
import { embedTexts, embeddingToBuffer, EMBEDDING_DIM } from "../src/corpus/embed";

// Default corpus root: <repo>/corpus
const CORPUS_ROOT = process.env.CORPUS_ROOT || path.join(__dirname, "..", "..", "corpus");
const CHUNK_TOKENS = 400;
const CHUNK_OVERLAP = 50;
const EMBED_BATCH = parseInt(process.env.EMBED_BATCH_SIZE || "32", 10) || 32;

interface CLIArgs {
  philosopher?: string;
  dryRun: boolean;
  force: boolean;
}

function parseArgs(): CLIArgs {
  const args: CLIArgs = { dryRun: false, force: false };
  for (const a of process.argv.slice(2)) {
    if (a.startsWith("--philosopher=")) args.philosopher = a.split("=")[1];
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--force") args.force = true;
  }
  return args;
}

/**
 * Refuse to write into a corpus_chunks table that contains rows with a
 * different embedding dimension than this build expects (e.g., 512-byte rows
 * left over from a previous Voyage-era ingestion). Mixed-dim tables crash
 * cosine() at retrieval time. Hard fail with a clear remediation message.
 */
function assertNoDimMismatch(): void {
  const dataDir = process.env.DATA_DIR || path.join(__dirname, "..", "data");
  const dbPath = path.join(dataDir, "council.db");
  if (!fs.existsSync(dbPath)) return;
  const probe = new Database(dbPath, { readonly: true });
  try {
    // Look for ANY row whose embedding length doesn't match the current dim.
    // Sampling LIMIT 1 unconditionally would miss mixed-dim tables where the
    // first row happens to be valid.
    const expected = EMBEDDING_DIM * 4;
    const bad = probe
      .prepare<[number], { len: number; n: number }>(
        "SELECT length(embedding) AS len, COUNT(*) AS n FROM corpus_chunks WHERE length(embedding) != ? GROUP BY length(embedding) LIMIT 1"
      )
      .get(expected);
    if (bad) {
      console.error(
        `[ingest] ERROR: corpus_chunks contains ${bad.n} row(s) at ${bad.len / 4}-dim, this build expects ${EMBEDDING_DIM}-dim.`
      );
      console.error(`[ingest] Run 'make wipe-corpus' first, then re-run ingest.`);
      process.exit(1);
    }
  } finally {
    probe.close();
  }
}

/**
 * Token-based chunking with paragraph-then-sentence boundaries.
 * Chunks are at most CHUNK_TOKENS tokens; consecutive chunks overlap by
 * CHUNK_OVERLAP tokens to preserve context across the seam.
 */
function chunkText(text: string): { text: string; tokenCount: number }[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  // Split on paragraph boundaries first
  const paragraphs = normalized.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  // Materialize a token stream with text mapping. We use a simple approach:
  // tokenize the entire normalized text once, then walk a sliding window over
  // tokens, decoding back to substrings via paragraph offsets. Simpler: chunk
  // paragraph by paragraph, splitting an over-long paragraph by sentences.
  const out: { text: string; tokenCount: number }[] = [];
  let buf: string[] = [];
  let bufTokens = 0;

  function flush() {
    if (buf.length === 0) return;
    const joined = buf.join("\n\n").trim();
    if (joined.length === 0) {
      buf = [];
      bufTokens = 0;
      return;
    }
    out.push({ text: joined, tokenCount: bufTokens });
    // Build overlap: keep the tail of the buffer worth ~CHUNK_OVERLAP tokens
    if (CHUNK_OVERLAP > 0 && bufTokens > CHUNK_OVERLAP) {
      // Walk backwards through paragraphs accumulating tokens until ≥ overlap
      const tail: string[] = [];
      let tailTokens = 0;
      for (let i = buf.length - 1; i >= 0 && tailTokens < CHUNK_OVERLAP; i--) {
        const t = countTokens(buf[i]);
        tail.unshift(buf[i]);
        tailTokens += t;
      }
      buf = tail;
      bufTokens = tailTokens;
    } else {
      buf = [];
      bufTokens = 0;
    }
  }

  for (const para of paragraphs) {
    const paraTokens = countTokens(para);

    if (paraTokens > CHUNK_TOKENS) {
      // Paragraph too big — fall back to sentence splits. Naive: split on
      // ". " / "! " / "? " — we don't need NLP-grade; we're targeting voice
      // texture, not search quality.
      flush();
      const sentences = para.split(/(?<=[.!?])\s+/);
      for (const sent of sentences) {
        const sentTokens = countTokens(sent);
        if (bufTokens + sentTokens > CHUNK_TOKENS && buf.length > 0) flush();
        if (sentTokens > CHUNK_TOKENS) {
          // Mega-sentence — character fallback
          const slices = sliceByTokens(sent, CHUNK_TOKENS, CHUNK_OVERLAP);
          for (const s of slices) out.push(s);
        } else {
          buf.push(sent);
          bufTokens += sentTokens;
        }
      }
      flush();
      continue;
    }

    if (bufTokens + paraTokens > CHUNK_TOKENS && buf.length > 0) {
      flush();
    }
    buf.push(para);
    bufTokens += paraTokens;
  }
  flush();

  return out;
}

function countTokens(text: string): number {
  // gpt-tokenizer's default cl100k_base tokenizer is not exact for Voyage,
  // but this is a chunking heuristic — exact fidelity isn't required.
  return encode(text).length;
}

function sliceByTokens(text: string, max: number, overlap: number): { text: string; tokenCount: number }[] {
  const tokens = encode(text);
  const out: { text: string; tokenCount: number }[] = [];
  let i = 0;
  while (i < tokens.length) {
    const slice = tokens.slice(i, i + max);
    const decoded = decode(slice);
    out.push({ text: decoded, tokenCount: slice.length });
    if (i + max >= tokens.length) break;
    i += Math.max(1, max - overlap);
  }
  return out;
}

function listWorkFiles(philosopherDir: string): string[] {
  if (!fs.existsSync(philosopherDir)) return [];
  return fs
    .readdirSync(philosopherDir)
    .filter((f) => f.endsWith(".txt"))
    .map((f) => path.join(philosopherDir, f));
}

function listPhilosophers(): string[] {
  if (!fs.existsSync(CORPUS_ROOT)) return [];
  return fs
    .readdirSync(CORPUS_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("_") && !e.name.startsWith("."))
    .map((e) => e.name);
}

async function ingestPhilosopher(philosopher: string, dryRun: boolean, force: boolean): Promise<void> {
  const dir = path.join(CORPUS_ROOT, philosopher);
  const files = listWorkFiles(dir);
  if (files.length === 0) {
    console.log(`[ingest] ${philosopher}: no .txt files in ${dir}`);
    return;
  }

  for (const file of files) {
    const work = path.basename(file, ".txt");
    const raw = fs.readFileSync(file, "utf8");
    const chunks = chunkText(raw);
    console.log(
      `[ingest] ${philosopher}/${work} → ${chunks.length} chunks` +
        (chunks.length > 0
          ? ` (avg ${Math.round(chunks.reduce((s, c) => s + c.tokenCount, 0) / chunks.length)} tok)`
          : "")
    );
    if (dryRun) continue;
    if (chunks.length === 0) continue;

    // Resume support: skip chunk indices already in the DB unless --force.
    const existing = force ? new Set<number>() : corpus.existingIdxSet(philosopher, work);
    const todo: Array<{ idx: number; text: string; tokenCount: number }> = [];
    for (let i = 0; i < chunks.length; i++) {
      if (existing.has(i)) continue;
      todo.push({ idx: i, text: chunks[i].text, tokenCount: chunks[i].tokenCount });
    }
    const skipped = chunks.length - todo.length;
    if (skipped > 0) {
      console.log(`  resume: ${skipped}/${chunks.length} chunks already embedded — skipping`);
    }
    if (todo.length === 0) continue;

    // Embed in batches. Local CPU inference — no rate limits, no throttle.
    let done = 0;
    for (let start = 0; start < todo.length; start += EMBED_BATCH) {
      const batch = todo.slice(start, start + EMBED_BATCH);
      const vecs = await embedTexts(batch.map((c) => c.text), "document");
      for (let i = 0; i < batch.length; i++) {
        corpus.upsert(
          philosopher,
          work,
          batch[i].idx,
          batch[i].text,
          batch[i].tokenCount,
          embeddingToBuffer(vecs[i])
        );
      }
      done += batch.length;
      process.stdout.write(`  embedded ${done}/${todo.length}\r`);
    }
    console.log(`  embedded ${done}/${todo.length} ✓`);
  }

  console.log(`[ingest] ${philosopher}: total rows now = ${corpus.countByPhilosopher(philosopher)}`);
}

async function main() {
  const args = parseArgs();
  if (!args.dryRun) assertNoDimMismatch();
  if (!fs.existsSync(CORPUS_ROOT)) {
    console.error(`[ingest] corpus root does not exist: ${CORPUS_ROOT}`);
    process.exit(1);
  }
  const targets = args.philosopher ? [args.philosopher] : listPhilosophers();
  if (targets.length === 0) {
    console.log(`[ingest] no philosopher subdirectories in ${CORPUS_ROOT}`);
    return;
  }
  console.log(
    `[ingest] philosophers: ${targets.join(", ")}${args.dryRun ? " (dry run — no embeddings, no DB writes)" : ""}`
  );
  if (!args.dryRun) {
    console.log(
      `[ingest] embedder=Xenova/all-MiniLM-L6-v2 (${EMBEDDING_DIM}-dim, local CPU), batch=${EMBED_BATCH}, mode=${args.force ? "force re-embed" : "resume (skip existing)"}`
    );
  }
  for (const ph of targets) {
    await ingestPhilosopher(ph, args.dryRun, args.force);
  }
  console.log("[ingest] done");
}

main().catch((err) => {
  console.error("[ingest] failed:", err);
  console.error("");
  console.error("The script is resume-safe — re-run any time and it will pick up at the");
  console.error("first un-embedded chunk. If the model failed to download on first run,");
  console.error("check internet connectivity and that $HF_HOME (default ./.cache/huggingface)");
  console.error("is writable.");
  process.exit(1);
});
