/**
 * Stage 04 — Cost & latency measurement.
 *
 * Runs one calibration question through both HF off and HF on, breaking
 * down per-layer timing (retrieval, chat, refine) and approximate cost.
 *
 * Sources of truth:
 *   - durations: measured directly via fetch wrapping
 *   - costs: estimated from char-count proxies (Anthropic counts tokens, not us)
 *
 * The cost numbers should be treated as ±20% — useful for relative comparison
 * (HF off vs on) but not authoritative for billing reconciliation. For real
 * numbers, check console.anthropic.com/usage after a run.
 *
 * Pass criterion: HF on stays within 50% of HF off latency.
 */

import { runDebate } from "../runner/debate";
import {
  writeMarkdown,
  writeJson,
  saveDebateFixture,
  getRunDir,
  appendToSummary,
  logTerminal,
} from "../runner/reporter";
import type { DebateResult, StageResult } from "../runner/types";

const CALIBRATION_QUESTION = {
  question: "What does it mean to live well in difficult times?",
  philosophers: ["nietzsche", "kafka", "camus", "freud"],
  // 4-philosopher council exercises typical batch refinement
};

function bucket(debate: DebateResult) {
  return {
    totalSec: debate.durationMs / 1000,
    retrievalSec: debate.retrievalDurationMs / 1000,
    chatSec: debate.chatDurationMs / 1000,
    refineSec: debate.refineDurationMs / 1000,
    turns: debate.turns.length,
    estUsd: debate.estimatedCostUsd,
    flaggedTurns: debate.turns.filter((t) => t.anachronismFlag).length,
    critiqueTurns: debate.turns.filter((t) => t.criticNotes && t.criticNotes.length > 0).length,
  };
}

export async function run(): Promise<StageResult> {
  const start = Date.now();
  const runDir = getRunDir();

  process.stdout.write(`  04-cost-latency: HF off ... `);
  const off = await runDebate(CALIBRATION_QUESTION.question, CALIBRATION_QUESTION.philosophers, false);
  process.stdout.write(`${off.turns.length} turns, ${(off.durationMs / 1000).toFixed(1)}s\n`);
  saveDebateFixture(runDir, "calibration-off", off);

  process.stdout.write(`  04-cost-latency: HF on  ... `);
  const on = await runDebate(CALIBRATION_QUESTION.question, CALIBRATION_QUESTION.philosophers, true);
  process.stdout.write(`${on.turns.length} turns, ${(on.durationMs / 1000).toFixed(1)}s\n`);
  saveDebateFixture(runDir, "calibration-on", on);

  const offB = bucket(off);
  const onB = bucket(on);

  const totalCost = off.estimatedCostUsd + on.estimatedCostUsd;
  const latencyRatio = onB.totalSec / offB.totalSec;
  const passed = latencyRatio <= 1.5 && off.turns.length > 0 && on.turns.length > 0;

  const md: string[] = [];
  md.push(`# Stage 04 — Cost & Latency\n`);
  md.push(`**Question:** _${CALIBRATION_QUESTION.question}_`);
  md.push(`**Council:** ${CALIBRATION_QUESTION.philosophers.join(", ")} (${CALIBRATION_QUESTION.philosophers.length} members)\n`);
  md.push(``);
  md.push(`| Metric | HF off | HF on | Δ |\n|---|---:|---:|---:|`);
  md.push(`| Total wall-clock (s) | ${offB.totalSec.toFixed(2)} | ${onB.totalSec.toFixed(2)} | ${(onB.totalSec - offB.totalSec).toFixed(2)} |`);
  md.push(`| Retrieval (s) | ${offB.retrievalSec.toFixed(3)} | ${onB.retrievalSec.toFixed(3)} | ${(onB.retrievalSec - offB.retrievalSec).toFixed(3)} |`);
  md.push(`| Chat /api/chat (s) | ${offB.chatSec.toFixed(2)} | ${onB.chatSec.toFixed(2)} | ${(onB.chatSec - offB.chatSec).toFixed(2)} |`);
  md.push(`| Refine /api/refine (s) | ${offB.refineSec.toFixed(2)} | ${onB.refineSec.toFixed(2)} | ${(onB.refineSec - offB.refineSec).toFixed(2)} |`);
  md.push(`| Turns generated | ${offB.turns} | ${onB.turns} | — |`);
  md.push(`| Anachronism flags | ${offB.flaggedTurns} | ${onB.flaggedTurns} | — |`);
  md.push(`| Turns with critic notes | ${offB.critiqueTurns} | ${onB.critiqueTurns} | — |`);
  md.push(`| Estimated cost (USD) | $${offB.estUsd.toFixed(4)} | $${onB.estUsd.toFixed(4)} | $${(onB.estUsd - offB.estUsd).toFixed(4)} |`);
  md.push(``);
  md.push(`**Latency ratio (on / off):** ${latencyRatio.toFixed(2)}× ${latencyRatio <= 1.5 ? "✓" : "⚠ above 1.5×"}`);
  md.push(``);
  md.push(`> Cost numbers are **estimates** based on char-count proxies (Anthropic bills by token). Treat as ±20%.`);
  md.push(`> For authoritative numbers, check https://console.anthropic.com/usage after a run.`);
  md.push(``);
  md.push(`---\n`);
  md.push(`## Decision support\n`);
  md.push(`HF on adds **${(onB.totalSec - offB.totalSec).toFixed(1)} seconds** and **$${(onB.estUsd - offB.estUsd).toFixed(4)}** per debate over HF off. If you can't perceive HF on as better in stage 03, this latency/cost is not worth paying — disable the toggle by default.\n`);

  const detailsPath = writeMarkdown(runDir, "04-cost-latency", md.join("\n"));
  const jsonPath = writeJson(runDir, "04-cost-latency", { off: offB, on: onB, latencyRatio, totalCost });

  return {
    stage: "04-cost-latency",
    passed,
    summary: `HF on +${(onB.totalSec - offB.totalSec).toFixed(1)}s (${latencyRatio.toFixed(2)}×), +$${(onB.estUsd - offB.estUsd).toFixed(4)}/debate`,
    detailsPath,
    jsonPath,
    durationMs: Date.now() - start,
    approxCostUsd: totalCost,
  };
}

if (require.main === module) {
  run().then((r) => {
    appendToSummary(process.env.EVAL_RUN_DIR || r.detailsPath.replace(/\/[^/]+$/, ""), r);
    logTerminal("04-cost-latency", r);
    process.exit(r.passed ? 0 : 1);
  });
}
