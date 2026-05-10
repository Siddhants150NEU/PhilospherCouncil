/**
 * Run a full debate end-to-end via the backend API.
 *
 * Mirrors frontend/src/App.tsx startDebate() orchestration:
 *   1. /api/retrieve  → top-k corpus chunks per selected philosopher
 *   2. assemble system prompt = per-philosopher prompts + voiceBlocks
 *   3. /api/chat     → JSON array of turns from Sonnet
 *   4. /api/refine   → per-turn anachronism check + optional critique pass
 *
 * Returns a DebateResult with timing, retrieval counts, errors, and rough
 * cost estimate. Errors are captured (not thrown) so the eval pipeline
 * can keep going even if one debate fails.
 */

import { retrieve, chat, refine, RetrieveResponse } from "./client";
import { loadPhilosophers } from "./prompts";
import type { DebateResult, DebateTurn } from "./types";

// Mirror App.tsx tokenBudget(). Scales response budget with council size.
function tokenBudget(councilSize: number): number {
  const turns = councilSize >= 10 ? 5 : councilSize >= 7 ? 6 : Math.min(councilSize + 2, 8);
  return Math.min(turns * 700 + 800, 8192);
}

// Mirror App.tsx classifyQuestion() — used in buildDebatePrompt.
function classifyQuestion(q: string): "light" | "deep" {
  return /(eat|food|fries|pizza|burger|snack|drink|coffee|movie|show|music|game|sport|travel|vacation|sleep|pet|fashion|buy|gift|hobby)/i.test(
    q
  )
    ? "light"
    : "deep";
}

// Mirror App.tsx buildDebatePrompt(). Builds the user-message content.
function buildDebatePrompt(problem: string, history: DebateTurn[], selected: string[]): string {
  const all = loadPhilosophers();
  const names = selected.map((k) => all[k].name).join(", ");
  const tone =
    classifyQuestion(problem) === "light"
      ? "TONE: Light fun question. Playful, witty, in character but enjoying it. 1-3 sentences per turn."
      : "TONE: Serious question. Go deep. Be personal. 2-4 sentences per turn.";
  const hist =
    history.length === 0
      ? "(Opening round)"
      : history
          .map((h) => (h.philosopher === "user" ? "VISITOR: " + h.text : h.philosopher.toUpperCase() + ": " + h.text))
          .join("\n");
  const count = selected.length >= 10 ? 5 : selected.length >= 7 ? 6 : Math.min(selected.length + 2, 8);
  return (
    names +
    ' are reacting to: "' +
    problem +
    '"\n\n' +
    tone +
    "\n\nExchange:\n" +
    hist +
    "\n\nStay in character. Engage with prior exchanges. Generate " +
    count +
    " turns.\n\nReturn ONLY JSON array:\n[{\"philosopher\":\"" +
    selected[0] +
    '","text":"..."},...]\nUse only: ' +
    selected.join(", ") +
    "."
  );
}

/**
 * Rough cost estimator. Uses approximate token counts from the eval suite's
 * own measurements; not authoritative — the real bill comes from Anthropic.
 *
 * Sonnet 4.6 input: $3 / 1M tokens. Output: $15 / 1M tokens. (Approximate.)
 * Haiku 4.5 input: $1 / 1M. Output: $5 / 1M.
 */
function estimateCostUsd(opts: {
  sonnetInputTokens: number;
  sonnetOutputTokens: number;
  haikuInputTokens: number;
  haikuOutputTokens: number;
}): number {
  const sonnetCost = (opts.sonnetInputTokens / 1e6) * 3 + (opts.sonnetOutputTokens / 1e6) * 15;
  const haikuCost = (opts.haikuInputTokens / 1e6) * 1 + (opts.haikuOutputTokens / 1e6) * 5;
  return sonnetCost + haikuCost;
}

export async function runDebate(
  question: string,
  philosophers: string[],
  highFidelity: boolean
): Promise<DebateResult> {
  const errors: string[] = [];
  const allPhilosophers = loadPhilosophers();
  const start = Date.now();

  // 1. Retrieval
  let retrievalResp: RetrieveResponse = { results: {} };
  let retrievalDurationMs = 0;
  try {
    const r = await retrieve(question, philosophers);
    retrievalResp = r.data;
    retrievalDurationMs = r.durationMs;
  } catch (e) {
    errors.push(`retrieve: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Voice blocks: only the retrieval per philosopher; backend looks up
  // anchors and anti-patterns from its own modules.
  const voiceBlocks: Record<string, { retrieval?: Array<{ text: string; work?: string }> }> = {};
  for (const k of philosophers) {
    const hits = retrievalResp.results?.[k] || [];
    voiceBlocks[k] = { retrieval: hits.map((h) => ({ text: h.text, work: h.work })) };
  }

  // 2. Assemble system prompt (mirror App.tsx:1274)
  const systemPrompt = philosophers
    .map((k) => k.toUpperCase() + ": " + allPhilosophers[k].prompt)
    .join("\n\n");

  // 3. Chat
  let chatText = "";
  let chatDurationMs = 0;
  try {
    const c = await chat({
      messages: [{ role: "user", content: buildDebatePrompt(question, [], philosophers) }],
      system: systemPrompt,
      maxTokens: tokenBudget(philosophers.length),
      voiceBlocks,
    });
    chatText = c.data.text;
    chatDurationMs = c.durationMs;
  } catch (e) {
    errors.push(`chat: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Parse the JSON array of turns
  let parsedTurns: DebateTurn[] = [];
  if (chatText) {
    try {
      const cleaned = chatText.replace(/```json|```/g, "").trim();
      const arr = JSON.parse(cleaned);
      if (Array.isArray(arr)) {
        parsedTurns = arr
          .filter((t: any) => t && typeof t.philosopher === "string" && typeof t.text === "string")
          .map((t: any) => ({ philosopher: t.philosopher, text: t.text }));
      } else {
        errors.push("chat: response was not a JSON array");
      }
    } catch (e) {
      errors.push(`chat parse: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 4. Refine each turn — parallelized via Promise.all (mirrors frontend
  //    behavior; serial loops on Haiku would push HF-on debates well past
  //    the 1.5× HF-off latency budget).
  const refineStart = Date.now();
  const refinedTurns: DebateTurn[] = await Promise.all(
    parsedTurns.map(async (t) => {
      if (!philosophers.includes(t.philosopher)) {
        // Out-of-council philosopher — keep as-is, don't refine.
        return t;
      }
      try {
        const r = await refine(t.philosopher, t.text, highFidelity);
        return {
          philosopher: t.philosopher,
          text: r.data.text,
          anachronismFlag: r.data.anachronismFlag,
          criticNotes: r.data.criticNotes,
        };
      } catch (e) {
        errors.push(`refine ${t.philosopher}: ${e instanceof Error ? e.message : String(e)}`);
        return t; // fall through with unrefined turn
      }
    })
  );
  const refineDurationMs = Date.now() - refineStart;

  // Rough cost estimation: count chars / 4 as token estimate.
  const sonnetInputApprox = Math.ceil(systemPrompt.length / 4);
  const sonnetOutputApprox = Math.ceil(chatText.length / 4);
  // Haiku is invoked once per turn ONLY when highFidelity=true; estimate
  // 1k input + 500 output per call.
  const haikuCalls = highFidelity ? refinedTurns.length : 0;
  const haikuInputApprox = haikuCalls * 1000;
  const haikuOutputApprox = haikuCalls * 500;

  const result: DebateResult = {
    question,
    philosophers,
    highFidelity,
    turns: refinedTurns,
    durationMs: Date.now() - start,
    retrievalHits: Object.fromEntries(philosophers.map((k) => [k, (retrievalResp.results?.[k] || []).length])),
    retrievalDurationMs,
    chatDurationMs,
    refineDurationMs,
    estimatedCostUsd: estimateCostUsd({
      sonnetInputTokens: sonnetInputApprox,
      sonnetOutputTokens: sonnetOutputApprox,
      haikuInputTokens: haikuInputApprox,
      haikuOutputTokens: haikuOutputApprox,
    }),
    errors,
  };

  return result;
}
