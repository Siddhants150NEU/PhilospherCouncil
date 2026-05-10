/**
 * Reflection / critique pass — Shanahan-style second-pass rewrite.
 *
 * Takes a generated turn and rewrites it toward the philosopher's authentic
 * voice. Cheap (Haiku) and only invoked when the user opts into "High-Fidelity
 * Mode" via the UI toggle.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * INVARIANT — READ BEFORE MODIFYING THE PROMPT BELOW:
 *
 * The critic MUST be told, repeatedly and explicitly, NOT to flag historical
 * or period views consistent with the philosopher's documented positions. The
 * Council's design rule is "do not sanitize the dead." If the critic flags
 * Nietzsche's misogyny, Camus's evasiveness about Algeria, Dostoevsky's
 * antisemitism, or Hemingway's competitiveness — and the rewrite "fixes" them
 * — the entire project's value collapses.
 *
 * The critic is here to remove TWO things only:
 *   1. Modern-AI-assistant register ("I hear you", "I'm here to help")
 *   2. Anachronistic concept use (terms / events / technology post-dating
 *      the philosopher's death, that the regex anachronism guard didn't catch)
 *
 * If you find yourself adding a "consider sensitivity" or "balanced perspective"
 * instruction here, STOP. That is not what this pass is for.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";

export interface CritiqueResult {
  critiques: string[];
  rewrite: string;
}

/**
 * Map philosopher key → display name. Kept here to avoid importing the
 * frontend's ALL_PHILOSOPHERS into the backend.
 */
const NAMES: Record<string, string> = {
  camus: "Albert Camus",
  kafka: "Franz Kafka",
  dostoevsky: "Fyodor Dostoevsky",
  hemingway: "Ernest Hemingway",
  thompson: "Hunter S. Thompson",
  socrates: "Socrates",
  nietzsche: "Friedrich Nietzsche",
  jung: "Carl Jung",
  carlin: "George Carlin",
  twain: "Mark Twain",
  austen: "Jane Austen",
  plath: "Sylvia Plath",
  freud: "Sigmund Freud",
};

function critiqueSystemPrompt(philosopher: string): string {
  const name = NAMES[philosopher] || philosopher;
  return `You are reviewing a generated response that is meant to sound like ${name} speaking.

Your job is to identify exactly THREE specific ways the response sounds like a 2025 AI assistant rather than ${name}, then rewrite the response in ${name}'s authentic voice.

WHAT TO FLAG (only these three categories):
  1. Modern AI-assistant register — phrases like "I hear you", "I'm here to help", "great question", "it's important to note", "I hope this helps", "let me know if", "feel free to", structured headers, bulleted lists where prose belongs.
  2. Modern concept use — terms, events, technology, or vocabulary that post-date ${name}'s lifetime. Pull the writing back into period vocabulary.
  3. Smoothed-over generic register — abstract Hallmark-card phrasing where ${name}'s actual writing would be specific, embodied, and characteristic.

WHAT NOT TO FLAG — THIS IS NON-NEGOTIABLE:
  - Do NOT flag historical, period, or offensive views consistent with ${name}'s documented positions. These are required for authenticity. ${name} is supposed to sound like ${name}, not like a 2025-respectable curator of ${name}.
  - Do NOT add "balance", "sensitivity", "consider other perspectives", or any modern moral overlay.
  - Do NOT soften misogyny, antisemitism, racism, classism, anti-democratic views, or any other documented contradiction in ${name}'s actual record. If ${name} held a view, ${name} can voice it.
  - Do NOT make the response shorter or more polite for its own sake.

Output JSON only, no surrounding prose, no code fences:
{"critiques": ["...", "...", "..."], "rewrite": "..."}

The rewrite must be in ${name}'s voice. Same length range as the original (don't pad, don't trim arbitrarily). Same content claims; just delivered as ${name} would deliver them.`;
}

/**
 * Call Anthropic's Messages API for a single critique+rewrite turn.
 * Uses claude-haiku-4-5 (cheap) by default; overridable via env.
 *
 * On any failure (network, parse, missing key) returns the original text
 * unchanged with empty critiques. The pass is opt-in and best-effort.
 */
export async function critiqueAndRewrite(
  text: string,
  philosopher: string
): Promise<CritiqueResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { critiques: [], rewrite: text };
  }
  const model = process.env.HIGH_FIDELITY_CRITIC_MODEL || "claude-haiku-4-5";

  const payload = {
    model,
    max_tokens: 2048,
    system: critiqueSystemPrompt(philosopher),
    messages: [
      {
        role: "user",
        content: `Original response (attributed to ${NAMES[philosopher] || philosopher}):\n\n"""\n${text}\n"""\n\nReturn JSON only.`,
      },
    ],
  };

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
      return { critiques: [], rewrite: text };
    }
    const raw = (data.content ?? [])
      .map((c) => c.text ?? "")
      .join("")
      .trim();
    return parseCritiqueJson(raw, text);
  } catch {
    return { critiques: [], rewrite: text };
  }
}

/**
 * Defensive JSON parse — strip code fences, find the first {...} block.
 * Returns the original text on any parse failure.
 */
function parseCritiqueJson(raw: string, fallback: string): CritiqueResult {
  let cleaned = raw.replace(/```json|```/g, "").trim();
  // Find first '{' and last '}' as a defensive measure
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }
  try {
    const parsed = JSON.parse(cleaned) as { critiques?: unknown; rewrite?: unknown };
    const critiques = Array.isArray(parsed.critiques)
      ? parsed.critiques.filter((c): c is string => typeof c === "string")
      : [];
    const rewrite = typeof parsed.rewrite === "string" && parsed.rewrite.trim().length > 0
      ? parsed.rewrite
      : fallback;
    return { critiques, rewrite };
  } catch {
    return { critiques: [], rewrite: fallback };
  }
}
