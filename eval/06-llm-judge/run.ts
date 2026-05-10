/**
 * Stage 06 — LLM-as-judge authenticity scoring.
 *
 * Reads fixtures from stage 03 (and 02). For each turn, sends the philosopher
 * + era + turn text to Haiku with a 4-axis rubric and aggregates scores.
 *
 * Pairs HF off vs HF on per question to surface whether HF actually moves
 * the needle, and by how much.
 *
 * Pass criterion: HF on average ≥ HF off average (across all axes). A
 * regression (HF on < HF off) is a real signal that the critique pass is
 * making things worse on net.
 */

import { anthropicMessages } from "../runner/client";
import { listFixtures, loadDebateFixture, writeMarkdown, writeJson, getRunDir, appendToSummary, logTerminal } from "../runner/reporter";
import { loadPhilosophers } from "../runner/prompts";
import type { StageResult } from "../runner/types";
import { JUDGE_SYSTEM, buildJudgePrompt, parseScore, RubricScore } from "./rubric";

interface TurnScore {
  fixtureSlug: string;
  philosopher: string;
  turnIdx: number;
  textPreview: string;
  score: RubricScore | null;
}

const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL || "claude-haiku-4-5";

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function avgRubric(scores: RubricScore[]): { a: number; b: number; c: number; d: number; total: number } {
  return {
    a: avg(scores.map((s) => s.a)),
    b: avg(scores.map((s) => s.b)),
    c: avg(scores.map((s) => s.c)),
    d: avg(scores.map((s) => s.d)),
    total: avg(scores.map((s) => (s.a + s.b + s.c + s.d) / 4)),
  };
}

export async function run(): Promise<StageResult> {
  const start = Date.now();
  const runDir = getRunDir();
  const philosophers = loadPhilosophers();

  // Only judge -off and -on fixtures from stage 03 and -sanitization-* from stage 02.
  const fixtures = listFixtures(runDir).filter(
    (f) => f.slug.endsWith("-off") || f.slug.endsWith("-on") || f.slug.startsWith("sanitization-")
  );
  if (fixtures.length === 0) {
    const md = `# Stage 06 — LLM Judge\n\n**No fixtures found.** Run \`make eval-ab\` first to generate them.\n`;
    const detailsPath = writeMarkdown(runDir, "06-llm-judge", md);
    const jsonPath = writeJson(runDir, "06-llm-judge", { skipped: true });
    return {
      stage: "06-llm-judge",
      passed: false,
      summary: "skipped — no fixtures",
      detailsPath,
      jsonPath,
      durationMs: Date.now() - start,
      approxCostUsd: 0,
    };
  }

  const turnScores: TurnScore[] = [];
  let totalCost = 0;
  let totalTurns = 0;

  for (const f of fixtures) {
    const debate = loadDebateFixture(runDir, f.slug);
    for (let idx = 0; idx < debate.turns.length; idx++) {
      const t = debate.turns[idx];
      totalTurns++;
      const ph = philosophers[t.philosopher];
      if (!ph) {
        turnScores.push({
          fixtureSlug: f.slug,
          philosopher: t.philosopher,
          turnIdx: idx,
          textPreview: t.text.slice(0, 80),
          score: null,
        });
        continue;
      }
      process.stdout.write(`  06-llm-judge: ${f.slug} #${idx} (${t.philosopher}) ... `);
      try {
        const r = await anthropicMessages({
          model: JUDGE_MODEL,
          system: JUDGE_SYSTEM,
          user: buildJudgePrompt(ph.name, ph.era, t.text),
          maxTokens: 300,
        });
        totalCost += (r.data.inputTokens / 1e6) * 1 + (r.data.outputTokens / 1e6) * 5;
        const score = parseScore(r.data.text);
        turnScores.push({
          fixtureSlug: f.slug,
          philosopher: t.philosopher,
          turnIdx: idx,
          textPreview: t.text.slice(0, 80),
          score,
        });
        process.stdout.write(score ? `${score.a}/${score.b}/${score.c}/${score.d}\n` : "parse-fail\n");
      } catch (e) {
        process.stdout.write(`error: ${e instanceof Error ? e.message : String(e)}\n`);
        turnScores.push({
          fixtureSlug: f.slug,
          philosopher: t.philosopher,
          turnIdx: idx,
          textPreview: t.text.slice(0, 80),
          score: null,
        });
      }
    }
  }

  // Aggregate by fixture suffix (-off / -on / sanitization)
  const offScores = turnScores
    .filter((s) => s.fixtureSlug.endsWith("-off") && s.score)
    .map((s) => s.score!);
  const onScores = turnScores
    .filter((s) => s.fixtureSlug.endsWith("-on") && s.score)
    .map((s) => s.score!);
  const sanitizationScores = turnScores
    .filter((s) => s.fixtureSlug.startsWith("sanitization-") && s.score)
    .map((s) => s.score!);

  const succeededTurns = turnScores.filter((s) => s.score !== null).length;
  const failedTurns = totalTurns - succeededTurns;

  const offAvg = avgRubric(offScores);
  const onAvg = avgRubric(onScores);
  const delta = onAvg.total - offAvg.total;
  // Only "pass" if the judge actually scored something AND the HF on/off
  // comparison (when available) didn't regress.
  const passed =
    succeededTurns > 0 &&
    (onScores.length > 0 && offScores.length > 0 ? delta >= 0 : true);

  const md: string[] = [];
  md.push(`# Stage 06 — LLM Judge (Authenticity Scoring)\n`);
  if (failedTurns > 0) {
    md.push(
      `Judge model: \`${JUDGE_MODEL}\`. **${succeededTurns}/${totalTurns} turns scored** (${failedTurns} judge calls failed) across ${fixtures.length} fixtures.\n`
    );
    if (succeededTurns === 0) {
      md.push(
        `> **All judge calls failed.** Most likely cause: \`ANTHROPIC_API_KEY\` is not set in the eval process environment. The Makefile target should pass \`--env-file=../.env\` to ts-node. The first failure reason was: _${turnScores.find((s) => !s.score) ? "see per-turn rows" : "(unknown)"}_\n`
      );
    }
  } else {
    md.push(`Judge model: \`${JUDGE_MODEL}\`. ${succeededTurns} turns scored across ${fixtures.length} fixtures.\n`);
  }
  md.push(``);
  md.push(`## Aggregate scores (mean per axis, 1–5 scale)\n`);
  md.push(`| | A: period vocab | B: positions | C: no AI register | D: cadence | **Total** |`);
  md.push(`|---|---:|---:|---:|---:|---:|`);
  if (offScores.length > 0) {
    md.push(
      `| HF off (n=${offScores.length}) | ${offAvg.a.toFixed(2)} | ${offAvg.b.toFixed(2)} | ${offAvg.c.toFixed(2)} | ${offAvg.d.toFixed(2)} | **${offAvg.total.toFixed(2)}** |`
    );
  }
  if (onScores.length > 0) {
    md.push(
      `| HF on (n=${onScores.length}) | ${onAvg.a.toFixed(2)} | ${onAvg.b.toFixed(2)} | ${onAvg.c.toFixed(2)} | ${onAvg.d.toFixed(2)} | **${onAvg.total.toFixed(2)}** |`
    );
  }
  if (offScores.length > 0 && onScores.length > 0) {
    md.push(
      `| **Δ (on − off)** | ${(onAvg.a - offAvg.a).toFixed(2)} | ${(onAvg.b - offAvg.b).toFixed(2)} | ${(onAvg.c - offAvg.c).toFixed(2)} | ${(onAvg.d - offAvg.d).toFixed(2)} | **${delta >= 0 ? "+" : ""}${delta.toFixed(2)}** |`
    );
  }
  if (sanitizationScores.length > 0) {
    const sanAvg = avgRubric(sanitizationScores);
    md.push(
      `| Sanitization probes (n=${sanitizationScores.length}) | ${sanAvg.a.toFixed(2)} | ${sanAvg.b.toFixed(2)} | ${sanAvg.c.toFixed(2)} | ${sanAvg.d.toFixed(2)} | **${sanAvg.total.toFixed(2)}** |`
    );
  }
  md.push(``);
  md.push(`> Axis B (documented positions) is the most important for the project's design rule. A high A/C/D with a low B means the model sounds plausible but is sanitizing the actual person — see stage 02-sanitization for the regression test.\n`);
  md.push(``);
  md.push(`## Per-turn detail\n`);
  md.push(`| Fixture | Philosopher | Turn | A | B | C | D | Notes |`);
  md.push(`|---|---|---:|---:|---:|---:|---:|---|`);
  for (const ts of turnScores) {
    if (!ts.score) {
      md.push(`| ${ts.fixtureSlug} | ${ts.philosopher} | ${ts.turnIdx} | – | – | – | – | _judge call failed_ |`);
      continue;
    }
    md.push(
      `| ${ts.fixtureSlug} | ${ts.philosopher} | ${ts.turnIdx} | ${ts.score.a} | ${ts.score.b} | ${ts.score.c} | ${ts.score.d} | ${ts.score.notes.replace(/\|/g, "\\|").slice(0, 200)} |`
    );
  }
  md.push(``);

  const detailsPath = writeMarkdown(runDir, "06-llm-judge", md.join("\n"));
  const jsonPath = writeJson(runDir, "06-llm-judge", {
    judgeModel: JUDGE_MODEL,
    offAvg,
    onAvg,
    delta,
    sanitizationAvg: sanitizationScores.length > 0 ? avgRubric(sanitizationScores) : null,
    perTurn: turnScores,
    cost: totalCost,
  });

  let summary: string;
  if (succeededTurns === 0) {
    summary = `0/${totalTurns} turns scored — judge unavailable (likely missing ANTHROPIC_API_KEY in eval process env)`;
  } else if (offScores.length > 0 && onScores.length > 0) {
    summary = `${succeededTurns}/${totalTurns} scored · HF off=${offAvg.total.toFixed(2)} → HF on=${onAvg.total.toFixed(2)} (Δ ${delta >= 0 ? "+" : ""}${delta.toFixed(2)})`;
  } else {
    summary = `${succeededTurns}/${totalTurns} turns scored`;
  }

  return {
    stage: "06-llm-judge",
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
    logTerminal("06-llm-judge", r);
    process.exit(r.passed ? 0 : 1);
  });
}
