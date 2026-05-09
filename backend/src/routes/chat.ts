import { Router, Request, Response } from "express";

const router = Router();

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-4-6";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: ClaudeMessage[];
  system?: string;
  maxTokens?: number;
  model?: string;
}

/**
 * POST /api/chat
 *
 * Proxies a request to the Anthropic Messages API.
 * The API key is read from the environment (ANTHROPIC_API_KEY) and never
 * exposed to the browser.
 *
 * Body: { messages, system?, maxTokens?, model? }
 * Response: { text: string }  — the concatenated text content from the response
 */
router.post("/", async (req: Request, res: Response) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured on the server" });
  }

  const { messages, system, maxTokens, model } = req.body as ChatRequestBody;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages must be a non-empty array" });
  }

  const payload: Record<string, unknown> = {
    model: model || DEFAULT_MODEL,
    max_tokens: maxTokens || 8192,
    messages,
  };
  if (system) {
    payload.system = system;
  }

  let anthropicRes: Response;
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

export default router;
