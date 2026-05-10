import { Router, Request, Response } from "express";
import { ANCHORS } from "../voice/anchors";
import { ANTI_PATTERNS } from "../voice/anti-patterns";

const router = Router();

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-4-6";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface RetrievalChunk {
  text: string;
  work?: string;
}

/**
 * voiceBlocks shape — keyed by philosopher slug. The frontend sends only
 * the per-question retrieval chunks (if any); the backend looks up the
 * static anchors and anti-patterns from its own modules so the frontend
 * doesn't need to ship that data.
 */
interface VoiceBlock {
  retrieval?: RetrievalChunk[];
}

interface ChatRequestBody {
  messages: ClaudeMessage[];
  system?: string;
  maxTokens?: number;
  model?: string;
  voiceBlocks?: Record<string, VoiceBlock>;
}

/**
 * POST /api/chat
 *
 * Proxies a request to the Anthropic Messages API. The API key is read from
 * ANTHROPIC_API_KEY and never exposed to the browser.
 *
 * Body: { messages, system?, maxTokens?, model?, voiceBlocks? }
 *
 * If voiceBlocks is provided, each per-philosopher block (voice anchors,
 * anti-patterns, retrieval chunks) is PREPENDED to the incoming `system`
 * string before the call. The existing `system` content is never edited —
 * preserving the verbatim "Do NOT …" clauses inside each ALL_PHILOSOPHERS
 * prompt. Old callers that don't supply voiceBlocks see identical behavior.
 *
 * Response: { text: string }
 */
router.post("/", async (req: Request, res: Response) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured on the server" });
  }

  const { messages, system, maxTokens, model, voiceBlocks } = req.body as ChatRequestBody;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages must be a non-empty array" });
  }

  const finalSystem = voiceBlocks
    ? assembleSystem(voiceBlocks, system || "")
    : system;

  const payload: Record<string, unknown> = {
    model: model || DEFAULT_MODEL,
    max_tokens: maxTokens || 8192,
    messages,
  };
  if (finalSystem) {
    payload.system = finalSystem;
  }

  try {
    const fetchRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify(payload),
    });

    const data = (await fetchRes.json()) as {
      error?: { message: string };
      content?: Array<{ type: string; text?: string }>;
    };

    if (data.error) {
      return res.status(502).json({ error: data.error.message });
    }

    const text = (data.content ?? [])
      .map((c) => (c.text ?? ""))
      .join("");

    return res.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown upstream error";
    return res.status(502).json({ error: `Anthropic API request failed: ${message}` });
  }
});

/**
 * Assemble the final system prompt from per-philosopher voiceBlocks plus the
 * caller's existing system string (which already contains the verbatim
 * ALL_PHILOSOPHERS prompts). The blocks are PREPENDED so the existing prompt
 * — including its trailing "Do NOT …" clauses — is preserved untouched.
 *
 * Token-budget mitigation for large councils:
 *   - council size ≥ 10: drop retrieval, keep only anchors per philosopher
 *   - council size ≥ 7:  drop retrieval, keep anchors + anti-patterns
 *   - otherwise:         keep all three layers
 *
 * The caps make the input prompt fit comfortably under Sonnet's input window
 * even when 13 philosophers are selected.
 */
function assembleSystem(
  voiceBlocks: Record<string, VoiceBlock>,
  existingSystem: string
): string {
  const keys = Object.keys(voiceBlocks);
  const tier = keys.length >= 10 ? "anchors-only" : keys.length >= 7 ? "no-retrieval" : "full";

  const sections: string[] = [];
  for (const k of keys) {
    const block = voiceBlocks[k] || {};
    const KEY = k.toUpperCase();
    const parts: string[] = [];
    parts.push(`=== ${KEY} ===`);

    const anchors = ANCHORS[k];
    if (anchors && anchors.length > 0) {
      parts.push(
        `${KEY} — VOICE ANCHORS (verbatim from their work; calibrate register, do not quote):`
      );
      parts.push(anchors.map((a) => `- "${a}"`).join("\n"));
    }

    if (tier !== "anchors-only") {
      const antis = ANTI_PATTERNS[k];
      if (antis && antis.length > 0) {
        parts.push(`${KEY} — WOULD NEVER:`);
        parts.push(antis.map((a) => `- ${a}`).join("\n"));
      }
    }

    if (
      tier === "full" &&
      block.retrieval &&
      block.retrieval.length > 0
    ) {
      parts.push(
        `${KEY} — FROM YOUR PRIOR WRITING ON THIS QUESTION (use as voice texture; do not quote literally unless directly relevant):`
      );
      parts.push(block.retrieval.map((r) => `- "${r.text}"`).join("\n"));
    }

    sections.push(parts.join("\n"));
  }

  return sections.join("\n\n") + "\n\n" + existingSystem;
}

export default router;
