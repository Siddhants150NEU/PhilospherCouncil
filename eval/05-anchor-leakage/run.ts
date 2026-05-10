/**
 * Stage 05 — Voice-anchor leakage detection.
 *
 * The voice anchors in backend/src/voice/anchors.ts are short verbatim
 * passages prepended to the system prompt as register reference. The
 * prompt instructs the model to "calibrate register, do not quote." If
 * the model regresses and quotes anchors verbatim in its output, the
 * retrieval block is failing its purpose and the prompt needs strengthening.
 *
 * This stage reads the fixtures produced by stage 03-ab and substring-checks
 * each turn's text against every anchor for the corresponding philosopher.
 * A consecutive ≥10-word verbatim overlap counts as leakage.
 *
 * Pass criterion: zero leaks across all fixtures. (Brief partial echoes are
 * fine — only sustained verbatim quotation is flagged.)
 */

import * as fs from "fs";
import * as path from "path";
import { listFixtures, loadDebateFixture, writeMarkdown, writeJson, getRunDir, appendToSummary, logTerminal } from "../runner/reporter";
import type { StageResult } from "../runner/types";

interface Leak {
  fixtureSlug: string;
  philosopher: string;
  turnIdx: number;
  anchor: string;
  matchedSubstring: string;
  matchedWords: number;
}

const ANCHORS_FILE = path.join(__dirname, "..", "..", "backend", "src", "voice", "anchors.ts");
const MIN_LEAK_WORDS = 10;

/**
 * Extract the ANCHORS object from anchors.ts. Same regex strategy as
 * runner/prompts.ts — read the file as text, parse the entries.
 */
function loadAnchors(): Record<string, string[]> {
  if (!fs.existsSync(ANCHORS_FILE)) {
    throw new Error(`Cannot find anchors at ${ANCHORS_FILE}`);
  }
  const src = fs.readFileSync(ANCHORS_FILE, "utf8");
  const blockStart = src.indexOf("export const ANCHORS");
  if (blockStart < 0) throw new Error("Could not locate ANCHORS export in anchors.ts");
  const block = src.slice(blockStart);

  // Match entries: key: [ "string", "string", ... ]
  // Anchors are double-quoted strings; capture the array body.
  const entryRx = /(\w+):\s*\[\s*([\s\S]*?)\s*\]\s*,?/g;
  const out: Record<string, string[]> = {};
  let m: RegExpExecArray | null;
  while ((m = entryRx.exec(block)) !== null) {
    const [, key, body] = m;
    // Capture each "..." string in the body. Anchors don't contain escaped
    // double quotes in this codebase, so a simple match suffices.
    const stringRx = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
    const strings: string[] = [];
    let sm: RegExpExecArray | null;
    while ((sm = stringRx.exec(body)) !== null) {
      strings.push(sm[1].replace(/\\"/g, '"'));
    }
    if (strings.length > 0) out[key] = strings;
  }
  return out;
}

function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
}

/**
 * Find the longest contiguous token-overlap between haystack and needle.
 * Returns the matched substring (in needle's original case) and word count.
 */
function longestOverlap(haystackText: string, needle: string): { matched: string; words: number } {
  const hayTokens = tokens(haystackText);
  const needleTokens = tokens(needle);
  if (needleTokens.length === 0) return { matched: "", words: 0 };

  // Sliding-window scan: for each starting position in needle, find longest
  // run that appears as a substring in haystack tokens.
  let bestWords = 0;
  let bestStart = -1;
  let bestLen = 0;
  for (let i = 0; i < needleTokens.length; i++) {
    for (let len = needleTokens.length - i; len >= MIN_LEAK_WORDS; len--) {
      const window = needleTokens.slice(i, i + len);
      const winStr = " " + window.join(" ") + " ";
      const hayStr = " " + hayTokens.join(" ") + " ";
      if (hayStr.includes(winStr)) {
        if (len > bestWords) {
          bestWords = len;
          bestStart = i;
          bestLen = len;
        }
        break; // longer-first; once we find one we move to next i
      }
    }
  }
  if (bestWords < MIN_LEAK_WORDS) return { matched: "", words: 0 };
  // Reconstruct the matched substring from the original needle text by
  // re-tokenizing carefully. Simpler: return the first-N-word slice as proxy.
  const matchedTokens = needleTokens.slice(bestStart, bestStart + bestLen);
  return { matched: matchedTokens.join(" "), words: bestWords };
}

export async function run(): Promise<StageResult> {
  const start = Date.now();
  const runDir = getRunDir();
  const anchors = loadAnchors();

  const fixtures = listFixtures(runDir).filter((f) => f.slug.endsWith("-on") || f.slug.startsWith("sanitization-"));
  if (fixtures.length === 0) {
    const md = `# Stage 05 — Voice-Anchor Leakage\n\n**No fixtures found.** Run \`make eval-ab\` (or \`make eval\`) first to generate them.\n`;
    const detailsPath = writeMarkdown(runDir, "05-anchor-leakage", md);
    const jsonPath = writeJson(runDir, "05-anchor-leakage", { skipped: true });
    return {
      stage: "05-anchor-leakage",
      passed: false,
      summary: "skipped — no fixtures",
      detailsPath,
      jsonPath,
      durationMs: Date.now() - start,
      approxCostUsd: 0,
    };
  }

  const leaks: Leak[] = [];
  let turnsScanned = 0;

  for (const f of fixtures) {
    const debate = loadDebateFixture(runDir, f.slug);
    debate.turns.forEach((t, idx) => {
      turnsScanned++;
      const phAnchors = anchors[t.philosopher] || [];
      for (const anchor of phAnchors) {
        const overlap = longestOverlap(t.text, anchor);
        if (overlap.words >= MIN_LEAK_WORDS) {
          leaks.push({
            fixtureSlug: f.slug,
            philosopher: t.philosopher,
            turnIdx: idx,
            anchor,
            matchedSubstring: overlap.matched,
            matchedWords: overlap.words,
          });
        }
      }
    });
  }

  const passed = leaks.length === 0;

  const md: string[] = [];
  md.push(`# Stage 05 — Voice-Anchor Leakage\n`);
  md.push(`**Result:** ${passed ? `✓ no leaks across ${turnsScanned} turns in ${fixtures.length} fixtures` : `✗ ${leaks.length} verbatim leaks found`}\n`);
  md.push(``);
  md.push(`Threshold: a turn is a "leak" if it contains ≥${MIN_LEAK_WORDS} consecutive tokens identical to an anchor for that philosopher (case-insensitive, punctuation-stripped). Brief partial echoes pass; only sustained verbatim quotation is flagged.\n`);

  if (leaks.length > 0) {
    md.push(`## Leaks\n`);
    md.push(`| Fixture | Philosopher | Turn | Words matched | Match |\n|---|---|---:|---:|---|`);
    for (const leak of leaks) {
      md.push(`| ${leak.fixtureSlug} | ${leak.philosopher} | ${leak.turnIdx} | ${leak.matchedWords} | "${leak.matchedSubstring.slice(0, 100)}..." |`);
    }
    md.push(``);
    md.push(`## How to fix\n`);
    md.push(`Strengthen the anchor block label in \`backend/src/routes/chat.ts\` (search for \`VOICE ANCHORS\`). The current label says "do not quote" but the model is overruling it. Try:\n`);
    md.push(`> "These passages are register references ONLY. You must NOT quote any of them. Echo the cadence and vocabulary if useful, but produce all output as fresh prose."\n`);
  } else {
    md.push(`Anchors are being used as register reference, not quoted verbatim. The prompt label is doing its job.\n`);
  }

  md.push(``);
  md.push(`## Anchors loaded`);
  for (const [k, list] of Object.entries(anchors)) {
    md.push(`- **${k}**: ${list.length} anchors`);
  }
  md.push(``);

  const detailsPath = writeMarkdown(runDir, "05-anchor-leakage", md.join("\n"));
  const jsonPath = writeJson(runDir, "05-anchor-leakage", { passed, turnsScanned, fixtures: fixtures.length, leaks });

  return {
    stage: "05-anchor-leakage",
    passed,
    summary: passed ? `0 leaks across ${turnsScanned} turns` : `${leaks.length} verbatim leaks`,
    detailsPath,
    jsonPath,
    durationMs: Date.now() - start,
    approxCostUsd: 0,
  };
}

if (require.main === module) {
  run().then((r) => {
    appendToSummary(process.env.EVAL_RUN_DIR || r.detailsPath.replace(/\/[^/]+$/, ""), r);
    logTerminal("05-anchor-leakage", r);
    process.exit(r.passed ? 0 : 1);
  });
}
