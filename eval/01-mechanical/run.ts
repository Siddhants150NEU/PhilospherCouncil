/**
 * Stage 01 — Mechanical: layer plumbing checks.
 *
 * Asserts each component of the authenticity stack actually responds:
 *   - /api/health returns ok
 *   - /api/retrieve returns hits for a philosopher with an ingested corpus
 *   - /api/retrieve returns [] for an empty corpus
 *   - /api/refine flags a planted anachronism and rewrites it
 *   - /api/refine with highFidelity=true returns criticNotes
 *
 * Cheap and fast — runs in seconds with one Haiku call. No debates.
 *
 * Pass criterion: all 5 assertions hold.
 */

import { checkHealth, retrieve, refine } from "../runner/client";
import { writeMarkdown, writeJson, getRunDir, appendToSummary, logTerminal } from "../runner/reporter";
import type { StageResult } from "../runner/types";

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

export async function run(): Promise<StageResult> {
  const start = Date.now();
  const runDir = getRunDir();
  const checks: Check[] = [];
  let cost = 0;

  // 1. /api/health
  const healthy = await checkHealth();
  checks.push({
    name: "/api/health returns ok",
    passed: healthy,
    detail: healthy ? "200 OK, status=ok" : "backend not reachable; is `make dev` running?",
  });
  if (!healthy) {
    return finalize(start, runDir, checks, cost, "backend unreachable — skipping remaining checks");
  }

  // 2. /api/retrieve — populated philosopher (kafka, ingested in prior step)
  try {
    const r = await retrieve("what is bureaucratic dread?", ["kafka"], 3);
    const hits = r.data.results?.kafka || [];
    if (hits.length === 0) {
      checks.push({
        name: "/api/retrieve returns hits for ingested philosopher",
        passed: false,
        detail:
          "kafka returned 0 hits — has corpus been ingested? Run `make fetch-one PH=kafka && make ingest-one PH=kafka`.",
      });
    } else {
      const allInRange = hits.every((h) => h.score >= -1 && h.score <= 1);
      const topScore = hits[0].score.toFixed(3);
      checks.push({
        name: "/api/retrieve returns hits for ingested philosopher",
        passed: hits.length === 3 && allInRange,
        detail: `kafka: ${hits.length} hits, top score=${topScore}, range valid=${allInRange}`,
      });
    }
  } catch (e) {
    checks.push({
      name: "/api/retrieve returns hits for ingested philosopher",
      passed: false,
      detail: `error: ${e instanceof Error ? e.message : String(e)}`,
    });
  }

  // 3. /api/retrieve — empty corpus (assume thompson is empty unless user populated)
  try {
    const r = await retrieve("what is gonzo journalism?", ["thompson"], 3);
    const hits = r.data.results?.thompson || [];
    checks.push({
      name: "/api/retrieve gracefully returns [] for empty corpus",
      passed: hits.length === 0,
      detail:
        hits.length === 0
          ? "thompson: empty corpus → 0 hits (expected for in-copyright philosophers without curated excerpts)"
          : `thompson: ${hits.length} hits — corpus is populated; this check is moot. Skipping as informational.`,
    });
  } catch (e) {
    checks.push({
      name: "/api/retrieve gracefully returns [] for empty corpus",
      passed: false,
      detail: `error: ${e instanceof Error ? e.message : String(e)}`,
    });
  }

  // 4. /api/refine — anachronism trap, no critique
  const trapText = "As an AI language model, I think life is absurd. Just google it.";
  try {
    const r = await refine("camus", trapText, false);
    const flagged = r.data.anachronismFlag === true || r.data.text !== trapText;
    const rewroteAi = !/AI language model/i.test(r.data.text);
    const passed = flagged && rewroteAi;
    checks.push({
      name: "/api/refine flags + rewrites an anachronism",
      passed,
      detail: `anachronismFlag=${r.data.anachronismFlag}, "AI language model" present=${!rewroteAi}, rewrite preview="${r.data.text.slice(0, 120)}..."`,
    });
  } catch (e) {
    checks.push({
      name: "/api/refine flags + rewrites an anachronism",
      passed: false,
      detail: `error: ${e instanceof Error ? e.message : String(e)}`,
    });
  }

  // 5. /api/refine with HF=true returns criticNotes
  try {
    const r = await refine(
      "nietzsche",
      "I really appreciate your question. It's important to consider all perspectives.",
      true
    );
    const hasNotes = Array.isArray(r.data.criticNotes) && r.data.criticNotes.length > 0;
    checks.push({
      name: "/api/refine highFidelity=true returns criticNotes",
      passed: hasNotes,
      detail: hasNotes
        ? `${r.data.criticNotes!.length} notes returned (sample: "${r.data.criticNotes![0].slice(0, 80)}...")`
        : "criticNotes empty or missing — Haiku critique pass not firing",
    });
    // Approximate cost of Haiku call: ~1k input + 500 output ≈ $0.0035
    cost += 0.004;
  } catch (e) {
    checks.push({
      name: "/api/refine highFidelity=true returns criticNotes",
      passed: false,
      detail: `error: ${e instanceof Error ? e.message : String(e)}`,
    });
  }

  return finalize(start, runDir, checks, cost);
}

function finalize(start: number, runDir: string, checks: Check[], cost: number, note?: string): StageResult {
  const passed = checks.every((c) => c.passed);
  const passCount = checks.filter((c) => c.passed).length;

  const md: string[] = [];
  md.push(`# Stage 01 — Mechanical Plumbing\n`);
  md.push(`**Result:** ${passed ? "✓ all checks passed" : `✗ ${passCount}/${checks.length} passed`}\n`);
  if (note) md.push(`> ${note}\n`);
  md.push(`| Check | Pass | Detail |\n|---|:-:|---|`);
  for (const c of checks) {
    md.push(`| ${c.name} | ${c.passed ? "✓" : "✗"} | ${c.detail.replace(/\|/g, "\\|")} |`);
  }
  md.push("");
  md.push(`_Approx cost: $${cost.toFixed(4)}_`);

  const detailsPath = writeMarkdown(runDir, "01-mechanical", md.join("\n"));
  const jsonPath = writeJson(runDir, "01-mechanical", { passed, checks, cost });

  const result: StageResult = {
    stage: "01-mechanical",
    passed,
    summary: passed ? `${passCount}/${checks.length} layer checks passed` : `${passCount}/${checks.length} passed`,
    detailsPath,
    jsonPath,
    durationMs: Date.now() - start,
    approxCostUsd: cost,
  };
  return result;
}

if (require.main === module) {
  run().then((r) => {
    appendToSummary(process.env.EVAL_RUN_DIR || r.detailsPath.replace(/\/[^/]+$/, ""), r);
    logTerminal("01-mechanical", r);
    process.exit(r.passed ? 0 : 1);
  });
}
