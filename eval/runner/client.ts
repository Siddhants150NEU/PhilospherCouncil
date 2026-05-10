/**
 * HTTP wrappers for the running backend.
 *
 * All eval stages assume `make dev` is running at http://localhost:3001
 * (override via EVAL_BASE_URL). Each call also instruments timing so the
 * cost/latency stage can attribute time to layers.
 */

import type { RetrievalHit } from "./types";

const BASE_URL = process.env.EVAL_BASE_URL || "http://localhost:3001";

export interface TimedResult<T> {
  data: T;
  durationMs: number;
}

async function timed<T>(fn: () => Promise<T>): Promise<TimedResult<T>> {
  const start = Date.now();
  const data = await fn();
  return { data, durationMs: Date.now() - start };
}

export async function checkHealth(): Promise<boolean> {
  try {
    const r = await fetch(`${BASE_URL}/api/health`);
    if (!r.ok) return false;
    const data = (await r.json()) as { status?: string };
    return data.status === "ok";
  } catch {
    return false;
  }
}

export interface RetrieveResponse {
  results: Record<string, RetrievalHit[]>;
}

export async function retrieve(
  question: string,
  philosophers: string[],
  k = 3
): Promise<TimedResult<RetrieveResponse>> {
  return timed(async () => {
    const r = await fetch(`${BASE_URL}/api/retrieve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question, philosophers, k }),
    });
    const data = (await r.json()) as RetrieveResponse | { error?: string };
    if ((data as any).error) throw new Error(`/api/retrieve: ${(data as any).error}`);
    return data as RetrieveResponse;
  });
}

export interface ChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  system?: string;
  maxTokens?: number;
  voiceBlocks?: Record<string, { retrieval?: Array<{ text: string; work?: string }> }>;
}

export interface ChatResponse {
  text: string;
}

export async function chat(req: ChatRequest): Promise<TimedResult<ChatResponse>> {
  return timed(async () => {
    const r = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
    });
    const data = (await r.json()) as ChatResponse | { error?: string };
    if ((data as any).error) throw new Error(`/api/chat: ${(data as any).error}`);
    return data as ChatResponse;
  });
}

export interface RefineResponse {
  text: string;
  anachronismFlag: boolean;
  criticNotes?: string[];
}

export async function refine(
  philosopher: string,
  text: string,
  highFidelity: boolean
): Promise<TimedResult<RefineResponse>> {
  return timed(async () => {
    const r = await fetch(`${BASE_URL}/api/refine`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ philosopher, text, highFidelity }),
    });
    const data = (await r.json()) as RefineResponse | { error?: string };
    if ((data as any).error) throw new Error(`/api/refine: ${(data as any).error}`);
    return data as RefineResponse;
  });
}

/**
 * Direct Anthropic Messages API for the LLM-judge stage. Bypasses the
 * project's /api/chat to keep the judge stateless and configurable.
 */
export async function anthropicMessages(opts: {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
}): Promise<TimedResult<{ text: string; inputTokens: number; outputTokens: number }>> {
  return timed(async () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set in the environment");
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: opts.maxTokens,
        system: opts.system,
        messages: [{ role: "user", content: opts.user }],
      }),
    });
    const data = (await r.json()) as {
      content?: Array<{ text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
      error?: { message: string };
    };
    if (data.error) throw new Error(`Anthropic: ${data.error.message}`);
    const text = (data.content ?? []).map((c) => c.text ?? "").join("");
    return {
      text,
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    };
  });
}
