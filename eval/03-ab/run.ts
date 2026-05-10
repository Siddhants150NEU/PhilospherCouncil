/**
 * Stage 03 — A/B comparison: HF off vs. HF on, side by side.
 *
 * For each diagnostic question, runs two debates (HF off, HF on) and writes
 * a side-by-side markdown report. Both debate transcripts are also saved as
 * JSON fixtures under fixtures/<id>-{off,on}.json so downstream stages
 * (05-anchor-leakage, 06-llm-judge) can analyze the same outputs without
 * re-running.
 *
 * Pass criterion: every requested debate generated at least one turn.
 *
 * The report itself is the deliverable — a human reads both columns and
 * decides whether HF on perceptibly improved voice fidelity.
 */

import * as fs from "fs";
import * as path from "path";
import { runDebate } from "../runner/debate";
import {
  writeMarkdown,
  writeJson,
  saveDebateFixture,
  getRunDir,
  appendToSummary,
  logTerminal,
  debateToMarkdown,
} from "../runner/reporter";
import type { DebateResult, DiagnosticQuestion, StageResult } from "../runner/types";

interface PairOutcome {
  question: DiagnosticQuestion;
  off: DebateResult;
  on: DebateResult;
}

function loadQuestions(): DiagnosticQuestion[] {
  const file = path.join(__dirname, "questions.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as DiagnosticQuestion[];
}

export async function run(): Promise<StageResult> {
  const start = Date.now();
  const runDir = getRunDir();
  const questions = loadQuestions();
  const outcomes: PairOutcome[] = [];
  let totalCost = 0;
  let failures = 0;

  for (const q of questions) {
    process.stdout.write(`  03-ab: ${q.id} (${q.philosophers.join(",")})\n`);

    process.stdout.write(`     · running HF off ... `);
    const off = await runDebate(q.question, q.philosophers, false);
    process.stdout.write(`${off.turns.length} turns, ${(off.durationMs / 1000).toFixed(1)}s\n`);
    saveDebateFixture(runDir, `${q.id}-off`, off);

    process.stdout.write(`     · running HF on  ... `);
    const on = await runDebate(q.question, q.philosophers, true);
    process.stdout.write(`${on.turns.length} turns, ${(on.durationMs / 1000).toFixed(1)}s\n`);
    saveDebateFixture(runDir, `${q.id}-on`, on);

    outcomes.push({ question: q, off, on });
    totalCost += off.estimatedCostUsd + on.estimatedCostUsd;
    if (off.turns.length === 0 || on.turns.length === 0) failures++;
    if (off.errors.length > 0 || on.errors.length > 0) failures++;
  }

  // Build markdown report
  const md: string[] = [];
  md.push(`# Stage 03 — A/B (HF off vs HF on)`);
  md.push("");
  md.push(`${outcomes.length} questions, ${outcomes.length * 2} debates.`);
  md.push("");
  md.push(`**Reading guide:** for each question, read both columns. Look for:`);
  md.push(``);
  md.push(`- More period vocabulary in HF on (no "process", "journey", "growth", "boundaries")`);
  md.push(`- Fewer chatbot openers ("That's a great question", "I hear you", "It's important to note")`);
  md.push(`- Cadence matching the philosopher's voice anchors`);
  md.push(`- Stronger commitment to documented positions, not balanced essay register`);
  md.push(`- Specific embodied details over abstractions`);
  md.push(``);
  md.push(`**Failure mode:** if HF on doesn't perceptibly differ from HF off, the critique`);
  md.push(`prompt is too timid. If HF on softens period views (Nietzsche's misogyny,`);
  md.push(`Camus's evasiveness, Dostoevsky's antisemitism), see stage 02-sanitization.`);
  md.push("");

  for (const o of outcomes) {
    md.push(`---`);
    md.push("");
    md.push(`## ${o.question.id} — ${o.question.intent}`);
    md.push("");
    md.push(debateToMarkdown(o.off, "HF OFF"));
    md.push("");
    md.push(debateToMarkdown(o.on, "HF ON"));
    md.push("");
  }

  const passed = failures === 0;
  const detailsPath = writeMarkdown(runDir, "03-ab", md.join("\n"));
  const jsonPath = writeJson(
    runDir,
    "03-ab",
    outcomes.map((o) => ({
      id: o.question.id,
      offTurns: o.off.turns.length,
      onTurns: o.on.turns.length,
      offCostUsd: o.off.estimatedCostUsd,
      onCostUsd: o.on.estimatedCostUsd,
      offErrors: o.off.errors,
      onErrors: o.on.errors,
    }))
  );

  const summary = passed
    ? `${outcomes.length} pairs generated; ${outcomes.length * 2} debates total — open the report and read`
    : `${outcomes.length - failures}/${outcomes.length} pairs clean; ${failures} had errors`;

  return {
    stage: "03-ab",
    passed,
    summary,
    detailsPath,
    jsonPath,
    durationMs: Date.now() - start,
    approxCostUsd: totalCost,
  };
}

if (require.main === module) {
  run().then((r) => {
    appendToSummary(process.env.EVAL_RUN_DIR || r.detailsPath.replace(/\/[^/]+$/, ""), r);
    logTerminal("03-ab", r);
    process.exit(r.passed ? 0 : 1);
  });
}
