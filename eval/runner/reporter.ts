/**
 * Per-run output directory + markdown writers.
 *
 * Each `make eval-*` invocation produces one timestamped subdirectory under
 * eval/output/<YYYYMMDD-HHMMSS>/ containing per-stage reports, raw debate
 * fixtures, and an aggregated SUMMARY.md.
 */

import * as fs from "fs";
import * as path from "path";
import type { DebateResult, StageResult } from "./types";

const OUTPUT_ROOT = path.join(__dirname, "..", "output");

/**
 * Resolve the active run directory. Honors EVAL_RUN_DIR if set (the pipeline
 * sets it so all stages write into the same timestamped subdir); otherwise
 * creates a fresh timestamped subdir for standalone stage runs.
 */
export function getRunDir(): string {
  const env = process.env.EVAL_RUN_DIR;
  if (env) {
    fs.mkdirSync(env, { recursive: true });
    return env;
  }
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dir = path.join(OUTPUT_ROOT, ts);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getFixturesDir(runDir: string): string {
  const dir = path.join(runDir, "fixtures");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function saveDebateFixture(runDir: string, slug: string, debate: DebateResult): string {
  const dir = getFixturesDir(runDir);
  const file = path.join(dir, `${slug}.json`);
  fs.writeFileSync(file, JSON.stringify(debate, null, 2));
  return file;
}

export function loadDebateFixture(runDir: string, slug: string): DebateResult {
  const file = path.join(runDir, "fixtures", `${slug}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing fixture: ${file}. Run stage 03-ab first.`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8")) as DebateResult;
}

export function listFixtures(runDir: string): { slug: string; path: string }[] {
  const dir = path.join(runDir, "fixtures");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ slug: f.replace(/\.json$/, ""), path: path.join(dir, f) }));
}

export function writeMarkdown(runDir: string, stageSlug: string, content: string): string {
  const file = path.join(runDir, `${stageSlug}.md`);
  fs.writeFileSync(file, content);
  return file;
}

export function writeJson(runDir: string, stageSlug: string, data: unknown): string {
  const file = path.join(runDir, `${stageSlug}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

/**
 * Render a debate result as a readable markdown transcript.
 */
export function debateToMarkdown(debate: DebateResult, heading: string): string {
  const lines: string[] = [];
  lines.push(`### ${heading}`);
  lines.push("");
  lines.push(`> *${debate.question}*`);
  lines.push("");
  lines.push(
    `_Council: ${debate.philosophers.join(", ")} · HF: **${debate.highFidelity ? "ON" : "off"}** · ${(
      debate.durationMs / 1000
    ).toFixed(1)}s · ~$${debate.estimatedCostUsd.toFixed(4)}_`
  );
  lines.push("");
  lines.push(
    `_Retrieval hits: ${Object.entries(debate.retrievalHits)
      .map(([k, n]) => `${k}=${n}`)
      .join(", ")}_`
  );
  lines.push("");
  if (debate.errors.length > 0) {
    lines.push(`**Errors:**`);
    for (const err of debate.errors) lines.push(`- ${err}`);
    lines.push("");
  }
  if (debate.turns.length === 0) {
    lines.push("_(no turns generated)_");
    return lines.join("\n");
  }
  for (const t of debate.turns) {
    const flags = [
      t.anachronismFlag ? "⚠️ anachronism flag" : "",
      t.criticNotes && t.criticNotes.length > 0 ? `🔬 critic noted ${t.criticNotes.length}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    lines.push(`**${t.philosopher.toUpperCase()}**${flags ? ` _(${flags})_` : ""}`);
    lines.push("");
    lines.push(t.text);
    lines.push("");
    if (t.criticNotes && t.criticNotes.length > 0) {
      lines.push(`<details><summary>critic notes</summary>`);
      lines.push("");
      for (const n of t.criticNotes) lines.push(`- ${n}`);
      lines.push("");
      lines.push(`</details>`);
      lines.push("");
    }
  }
  return lines.join("\n");
}

/**
 * Append a stage outcome to the run's SUMMARY.md (creates if missing).
 */
export function appendToSummary(runDir: string, result: StageResult): void {
  const file = path.join(runDir, "SUMMARY.md");
  const exists = fs.existsSync(file);
  const sections: string[] = [];
  if (!exists) {
    sections.push(`# Eval Run — ${path.basename(runDir)}`);
    sections.push("");
    sections.push(`Started ${new Date().toISOString()}`);
    sections.push("");
    sections.push(`| Stage | Pass | Summary | Time | Cost |`);
    sections.push(`|---|:-:|---|---:|---:|`);
  }
  sections.push(
    `| [${result.stage}](${path.relative(runDir, result.detailsPath)}) | ${result.passed ? "✓" : "✗"} | ${result.summary} | ${(
      result.durationMs / 1000
    ).toFixed(1)}s | $${result.approxCostUsd.toFixed(4)} |`
  );
  fs.appendFileSync(file, sections.join("\n") + "\n");
}

export function logTerminal(stage: string, result: StageResult): void {
  const status = result.passed ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
  process.stdout.write(
    `${status} ${stage.padEnd(22)} ${result.summary} (${(result.durationMs / 1000).toFixed(1)}s, $${result.approxCostUsd.toFixed(4)})\n`
  );
}
