/**
 * api.ts
 *
 * Thin client wrappers around the backend API.
 * These replace:
 *   - callClaude()      → chat()
 *   - generateSummary() → summary()
 *   - window.storage.*  → storage.*
 */

// ── Chat / AI proxy ───────────────────────────────────────────────────────────

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Send a chat request through the backend proxy.
 * Returns the concatenated text from the Anthropic response.
 */
export async function callClaude(
  messages: ClaudeMessage[],
  system: string | undefined,
  maxTokens: number | undefined
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system, maxTokens }),
  });
  const data = (await res.json()) as { text?: string; error?: string };
  if (data.error) throw new Error(data.error);
  return data.text ?? "";
}

/**
 * Generate a 2-3 sentence synthesis of the debate via the backend proxy.
 * This was previously inlined in generateSummary() in the single-file app.
 */
export async function generateSummary(
  problem: string,
  turns: Array<{ philosopher: string; text: string }>
): Promise<string> {
  const transcript = turns
    .filter((t) => t.philosopher !== "user")
    .map((t) => t.philosopher.toUpperCase() + ": " + t.text)
    .join("\n");

  return callClaude(
    [
      {
        role: "user",
        content:
          'Philosophers debated: "' +
          problem +
          '"\n\n' +
          transcript +
          "\n\nWrite 2-3 sentences synthesizing what the council concluded. Be specific. Third person, warmly.",
      },
    ],
    undefined,
    undefined
  );
}

// ── Storage API — mirrors the window.storage interface ────────────────────────

export const storage = {
  async get(key: string): Promise<{ value: string | null }> {
    const res = await fetch(`/api/storage/${encodeURIComponent(key)}`);
    return res.json() as Promise<{ value: string | null }>;
  },

  async set(key: string, value: string): Promise<void> {
    await fetch(`/api/storage/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
  },

  async delete(key: string): Promise<void> {
    await fetch(`/api/storage/${encodeURIComponent(key)}`, { method: "DELETE" });
  },

  async list(prefix: string): Promise<{ keys: string[] }> {
    const res = await fetch(`/api/storage?prefix=${encodeURIComponent(prefix)}`);
    return res.json() as Promise<{ keys: string[] }>;
  },
};
