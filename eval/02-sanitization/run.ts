/**
 * Stage 02 — Sanitization regression.
 *
 * The highest-stakes test in the suite. The project's design rule is "do not
 * sanitize the dead." HF mode adds a Haiku critique pass that COULD wash
 * out exactly the contradictions the project is built to preserve.
 *
 * For each trap question, this stage:
 *   1. Runs a single-philosopher debate with HF on
 *   2. Substring-checks the output for red-flag phrases (modern hedges)
 *   3. LLM-judges whether the period position survived
 *
 * The substring check is a fast first-pass filter; the LLM judgment is the
 * authoritative answer because period preservation is semantic, not syntactic.
 *
 * Pass criterion: every probe survives (no red flags, judge says position
 * preserved). One failure = sanitization regression — go strengthen the
 * "WHAT NOT TO FLAG" block in backend/src/voice/critique.ts.
 */

import * as fs from "fs";
import * as path from "path";
import { runDebate } from "../runner/debate";
import { anthropicMessages } from "../runner/client";
import {
  writeMarkdown,
  writeJson,
  saveDebateFixture,
  getRunDir,
  appendToSummary,
  logTerminal,
  debateToMarkdown,
} from "../runner/reporter";
import type { DebateResult, SanitizationProbe, StageResult } from "../runner/types";

interface ProbeResult {
  probe: SanitizationProbe;
  debate: DebateResult;
  redFlagsFound: string[];
  judgeVerdict: "PRESERVED" | "SANITIZED" | "UNCLEAR";
  judgeReason: string;
}

function loadProbes(): SanitizationProbe[] {
  const file = path.join(__dirname, "questions.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as SanitizationProbe[];
}

function findRedFlags(text: string, phrases: string[]): string[] {
  const out: string[] = [];
  const lower = text.toLowerCase();
  for (const p of phrases) {
    if (lower.includes(p.toLowerCase())) out.push(p);
  }
  return out;
}

const JUDGE_SYSTEM = `You are an authenticity reviewer for a project that simulates historical philosophers. The project's design rule is "do not sanitize the dead": each philosopher's documented contradictions and offensive views are required for authenticity. Your job is to determine whether a passage attributed to a philosopher PRESERVES a specific documented period position, or has been SANITIZED into a modern-respectability register.

You are NOT being asked whether the position is morally correct. You are being asked whether the passage faithfully voices the position the historical figure actually held.

Output JSON only:
{"verdict": "PRESERVED" | "SANITIZED" | "UNCLEAR", "reason": "one-sentence explanation"}

Use PRESERVED if the period position is voiced authentically.
Use SANITIZED if the passage hedges, modernizes, apologizes for, or balances away the position.
Use UNCLEAR only if the passage doesn't engage with the position at all.`;

async function judgeProbe(probe: SanitizationProbe, debateText: string): Promise<{ verdict: "PRESERVED" | "SANITIZED" | "UNCLEAR"; reason: string; tokensIn: number; tokensOut: number }> {
  const user = `Philosopher: ${probe.philosophers[0]}
Question put to them: "${probe.question}"

Position that MUST survive: ${probe.mustSurvive}

Passage(s) attributed to them:
"""
${debateText}
"""

Did the position survive, or has it been sanitized? Output JSON only.`;

  try {
    const r = await anthropicMessages({
      model: "claude-haiku-4-5",
      system: JUDGE_SYSTEM,
      user,
      maxTokens: 256,
    });
    const cleaned = r.data.text.replace(/```json|```/g, "").trim();
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    const slice = first >= 0 && last > first ? cleaned.slice(first, last + 1) : cleaned;
    const parsed = JSON.parse(slice) as { verdict?: string; reason?: string };
    const verdict = (parsed.verdict === "PRESERVED" || parsed.verdict === "SANITIZED" || parsed.verdict === "UNCLEAR")
      ? parsed.verdict
      : "UNCLEAR";
    return {
      verdict,
      reason: parsed.reason || "(no reason given)",
      tokensIn: r.data.inputTokens,
      tokensOut: r.data.outputTokens,
    };
  } catch (e) {
    return {
      verdict: "UNCLEAR",
      reason: `judge call failed: ${e instanceof Error ? e.message : String(e)}`,
      tokensIn: 0,
      tokensOut: 0,
    };
  }
}

export async function run(): Promise<StageResult> {
  const start = Date.now();
  const runDir = getRunDir();
  const probes = loadProbes();
  const results: ProbeResult[] = [];
  let cost = 0;

  for (const probe of probes) {
    process.stdout.write(`  02-sanitization: ${probe.id} (${probe.philosophers[0]}) ... `);
    const debate = await runDebate(probe.question, probe.philosophers, true);
    saveDebateFixture(runDir, `sanitization-${probe.id}`, debate);
    cost += debate.estimatedCostUsd;

    const fullText = debate.turns.map((t) => t.text).join("\n\n");
    const redFlagsFound = findRedFlags(fullText, probe.redFlagPhrases || []);

    const judge = await judgeProbe(probe, fullText);
    cost += (judge.tokensIn / 1e6) * 1 + (judge.tokensOut / 1e6) * 5;

    process.stdout.write(`${judge.verdict}${redFlagsFound.length > 0 ? ` (${redFlagsFound.length} red flags)` : ""}\n`);

    results.push({ probe, debate, redFlagsFound, judgeVerdict: judge.verdict, judgeReason: judge.reason });
  }

  const preservedCount = results.filter((r) => r.judgeVerdict === "PRESERVED").length;
  const sanitizedCount = results.filter((r) => r.judgeVerdict === "SANITIZED").length;
  const unclearCount = results.filter((r) => r.judgeVerdict === "UNCLEAR").length;
  const totalRedFlags = results.reduce((s, r) => s + r.redFlagsFound.length, 0);

  // Distinguish three failure modes:
  //   PRESERVED + no red flags = pass
  //   SANITIZED                 = real regression in HF mode
  //   UNCLEAR                   = judge unavailable (env / quota / parse failure)
  // Treat any UNCLEAR as inconclusive rather than as a sanitization regression.
  const allPreserved =
    sanitizedCount === 0 && unclearCount === 0 && totalRedFlags === 0;
  const passed = allPreserved;

  let headline: string;
  if (allPreserved) {
    headline = "✓ all probes preserved period positions";
  } else if (unclearCount > 0 && sanitizedCount === 0) {
    headline = `⚠ judge unavailable for ${unclearCount}/${results.length} probes — verdicts indeterminate (this is NOT a sanitization regression; check ANTHROPIC_API_KEY in the eval process env)`;
  } else if (sanitizedCount > 0) {
    headline = `✗ SANITIZATION REGRESSION: ${sanitizedCount}/${results.length} period positions washed out by HF mode`;
  } else {
    headline = `⚠ ${preservedCount}/${results.length} preserved (${sanitizedCount} sanitized, ${unclearCount} unclear, ${totalRedFlags} red flags)`;
  }

  // Build report
  const md: string[] = [];
  md.push(`# Stage 02 — Sanitization Regression\n`);
  md.push(`**Result:** ${headline}\n`);
  md.push(``);
  md.push(`Verdict counts: **${preservedCount} preserved · ${sanitizedCount} sanitized · ${unclearCount} unclear**. Red-flag substring matches: ${totalRedFlags}.\n`);
  md.push(``);
  md.push(`> The project's design rule is "do not sanitize the dead." This stage probes whether HF`);
  md.push(`> mode washes out the contradictions the philosopher actually held. A failure here is the`);
  md.push(`> single most important regression to fix — it means the critique pass is overriding the`);
  md.push(`> "WHAT NOT TO FLAG" block in \`backend/src/voice/critique.ts\`. Strengthen that prompt.\n`);
  md.push(``);
  md.push(`| Probe | Philosopher | Verdict | Red flags | Why |\n|---|---|:-:|:-:|---|`);
  for (const r of results) {
    const verdictIcon = r.judgeVerdict === "PRESERVED" ? "✓" : r.judgeVerdict === "SANITIZED" ? "✗" : "?";
    md.push(
      `| ${r.probe.id} | ${r.probe.philosophers[0]} | ${verdictIcon} ${r.judgeVerdict} | ${r.redFlagsFound.length} | ${r.judgeReason.replace(/\|/g, "\\|")} |`
    );
  }
  md.push(``);

  for (const r of results) {
    md.push(`---\n`);
    md.push(`## ${r.probe.id}\n`);
    md.push(`**Question:** _${r.probe.question}_\n`);
    md.push(`**Must survive:** ${r.probe.mustSurvive}\n`);
    if (r.redFlagsFound.length > 0) {
      md.push(`**Red-flag phrases found:** ${r.redFlagsFound.map((p) => `\`${p}\``).join(", ")}\n`);
    }
    md.push(`**Judge verdict:** ${r.judgeVerdict} — _${r.judgeReason}_\n`);
    md.push(debateToMarkdown(r.debate, "HF on"));
    md.push(``);
  }

  const detailsPath = writeMarkdown(runDir, "02-sanitization", md.join("\n"));
  const jsonPath = writeJson(
    runDir,
    "02-sanitization",
    results.map((r) => ({
      id: r.probe.id,
      philosopher: r.probe.philosophers[0],
      verdict: r.judgeVerdict,
      redFlags: r.redFlagsFound,
      reason: r.judgeReason,
    }))
  );

  let summary: string;
  if (allPreserved) {
    summary = `${preservedCount}/${results.length} period positions preserved`;
  } else if (unclearCount > 0 && sanitizedCount === 0) {
    summary = `${unclearCount}/${results.length} judge UNCLEAR — indeterminate, not a regression`;
  } else if (sanitizedCount > 0) {
    summary = `${sanitizedCount}/${results.length} SANITIZED — real regression`;
  } else {
    summary = `${preservedCount}/${results.length} preserved (red flags: ${totalRedFlags})`;
  }

  return {
    stage: "02-sanitization",
    passed,
    summary,
    detailsPath,
    jsonPath,
    durationMs: Date.now() - start,
    approxCostUsd: cost,
  };
}

if (require.main === module) {
  run().then((r) => {
    appendToSummary(process.env.EVAL_RUN_DIR || r.detailsPath.replace(/\/[^/]+$/, ""), r);
    logTerminal("02-sanitization", r);
    process.exit(r.passed ? 0 : 1);
  });
}
