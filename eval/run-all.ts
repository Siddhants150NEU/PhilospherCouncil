/**
 * Single-execution pipeline: runs all six eval stages in dependency order
 * against the same timestamped output directory.
 *
 * Order matters: 03-ab generates fixtures that 05 and 06 consume. 02 also
 * saves fixtures (one per probe) that 05 and 06 pick up.
 *
 *   1. mechanical (cheap, fast)         — plumbing
 *   2. ab (debate fixtures)              — the bulk of cost
 *   3. sanitization (debate fixtures)    — highest-stakes regression
 *   4. cost-latency (calibration)        — per-debate timing
 *   5. anchor-leakage (substring scan)   — reads fixtures, no API calls
 *   6. llm-judge (scoring)               — reads fixtures, Haiku per turn
 *
 * Each stage is run in isolation: a stage failure logs but does not halt
 * the pipeline. The final exit code is non-zero iff any stage failed.
 *
 * Total cost: ~$0.50–$1.00 per full run depending on model behavior.
 */

import * as fs from "fs";
import * as path from "path";
import { checkHealth } from "./runner/client";
import { getRunDir, appendToSummary, logTerminal } from "./runner/reporter";
import type { StageResult } from "./runner/types";

import { run as runMechanical } from "./01-mechanical/run";
import { run as runSanitization } from "./02-sanitization/run";
import { run as runAb } from "./03-ab/run";
import { run as runCostLatency } from "./04-cost-latency/run";
import { run as runAnchorLeakage } from "./05-anchor-leakage/run";
import { run as runLlmJudge } from "./06-llm-judge/run";

interface StageDef {
  slug: string;
  fn: () => Promise<StageResult>;
}

// Order: 01 plumbing, 03 ab (generates fixtures), 02 sanitization (more fixtures),
// 04 cost-latency (independent), then 05/06 (consume fixtures).
const STAGES: StageDef[] = [
  { slug: "01-mechanical", fn: runMechanical },
  { slug: "03-ab", fn: runAb },
  { slug: "02-sanitization", fn: runSanitization },
  { slug: "04-cost-latency", fn: runCostLatency },
  { slug: "05-anchor-leakage", fn: runAnchorLeakage },
  { slug: "06-llm-judge", fn: runLlmJudge },
];

async function main() {
  // Pin a single run directory for the entire pipeline so all stages share
  // the same output folder and fixtures.
  const runDir = getRunDir();
  process.env.EVAL_RUN_DIR = runDir;

  process.stdout.write(`\n  ── eval pipeline ──\n`);
  process.stdout.write(`  output: ${runDir}\n\n`);

  // Pre-flight 1: backend must be reachable
  if (!(await checkHealth())) {
    process.stderr.write(`  ✗ backend not reachable at ${process.env.EVAL_BASE_URL || "http://localhost:3001"}.\n`);
    process.stderr.write(`    Start it with 'make dev' in another terminal, then re-run.\n\n`);
    process.exit(1);
  }
  process.stdout.write(`  ✓ backend reachable\n`);

  // Pre-flight 2: ANTHROPIC_API_KEY must be in the eval process env. Stages
  // 02 and 06 call Anthropic *directly* from this process (the LLM judge),
  // bypassing the backend. The backend has its own copy of the key from
  // make dev's --env-file flag; the eval process needs its own copy too,
  // loaded by the Makefile EVAL_RUNNER's --env-file=../.env. Fail fast here
  // so we don't burn 6 debates worth of cost only to discover the judge
  // can't score anything.
  if (!process.env.ANTHROPIC_API_KEY) {
    process.stderr.write(`  ✗ ANTHROPIC_API_KEY is not set in the eval process environment.\n`);
    process.stderr.write(`    Stages 02-sanitization and 06-llm-judge call Anthropic directly\n`);
    process.stderr.write(`    from the eval process and need the key locally — not just in the\n`);
    process.stderr.write(`    backend. Confirm the Makefile EVAL_RUNNER includes\n`);
    process.stderr.write(`    'node --env-file=../.env' before ts-node, then re-run.\n\n`);
    process.exit(1);
  }
  process.stdout.write(`  ✓ ANTHROPIC_API_KEY loaded\n\n`);

  // Initialize SUMMARY.md skeleton (appendToSummary creates it on first call)
  const results: StageResult[] = [];
  let totalCost = 0;
  const pipelineStart = Date.now();

  for (const stage of STAGES) {
    process.stdout.write(`\n  ── ${stage.slug} ──\n`);
    try {
      const r = await stage.fn();
      results.push(r);
      appendToSummary(runDir, r);
      logTerminal(stage.slug, r);
      totalCost += r.approxCostUsd;
    } catch (err) {
      // Stage hard-failed (uncaught exception). Record and continue.
      const msg = err instanceof Error ? err.message : String(err);
      const fakeResult: StageResult = {
        stage: stage.slug,
        passed: false,
        summary: `crashed: ${msg}`,
        detailsPath: path.join(runDir, `${stage.slug}.md`),
        jsonPath: path.join(runDir, `${stage.slug}.json`),
        durationMs: 0,
        approxCostUsd: 0,
      };
      // Write crash report
      fs.writeFileSync(
        fakeResult.detailsPath,
        `# Stage ${stage.slug} — CRASHED\n\n\`\`\`\n${err instanceof Error ? err.stack || err.message : String(err)}\n\`\`\`\n`
      );
      results.push(fakeResult);
      appendToSummary(runDir, fakeResult);
      logTerminal(stage.slug, fakeResult);
    }
  }

  // Final summary footer
  const allPassed = results.every((r) => r.passed);
  const passed = results.filter((r) => r.passed).length;
  const summaryFile = path.join(runDir, "SUMMARY.md");
  fs.appendFileSync(
    summaryFile,
    `\n## Pipeline result\n\n${allPassed ? "✓" : "✗"} ${passed}/${results.length} stages passed in ${(
      (Date.now() - pipelineStart) / 1000
    ).toFixed(1)}s. Approx total cost: $${totalCost.toFixed(4)}.\n\nOpen each stage's report linked above for details.\n`
  );

  process.stdout.write(`\n  ── pipeline complete ──\n`);
  process.stdout.write(
    `  ${allPassed ? "✓" : "✗"} ${passed}/${results.length} stages passed · ${((Date.now() - pipelineStart) / 1000).toFixed(1)}s · ~$${totalCost.toFixed(4)}\n`
  );
  process.stdout.write(`  open: ${summaryFile}\n\n`);

  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  process.stderr.write(`\n  pipeline crashed: ${err instanceof Error ? err.stack || err.message : String(err)}\n`);
  process.exit(2);
});
