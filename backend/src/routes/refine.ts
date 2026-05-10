import { Router, Request, Response } from "express";
import { checkAnachronisms } from "../voice/anachronisms";
import { critiqueAndRewrite } from "../voice/critique";

const router = Router();

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";

interface RefineRequestBody {
  philosopher: string;
  text: string;
  highFidelity?: boolean;
}

interface RefineResponseBody {
  text: string;
  anachronismFlag: boolean;
  criticNotes?: string[];
}

/**
 * POST /api/refine
 *
 * Pipeline:
 *   1. Regex anachronism check on the input text. If matches found:
 *      a. One retry through Sonnet asking it to rewrite without the offending
 *         terms, preserving voice and content otherwise.
 *      b. Re-check the rewrite. Whatever the result, that's the "final" text
 *         for this stage. anachronismFlag is true iff the second draft still
 *         hits anachronism patterns.
 *   2. If highFidelity, run critiqueAndRewrite() (Haiku) on the final text.
 *
 * Both stages degrade gracefully — any failure in the retry or critique step
 * returns the original (or best-so-far) text rather than erroring the request.
 */
router.post("/", async (req: Request, res: Response) => {
  const { philosopher, text, highFidelity } = req.body as RefineRequestBody;

  if (typeof philosopher !== "string" || philosopher.trim().length === 0) {
    return res.status(400).json({ error: "philosopher must be a non-empty string" });
  }
  if (typeof text !== "string") {
    return res.status(400).json({ error: "text must be a string" });
  }

  let working = text;
  let anachronismFlag = false;

  // Stage 1: anachronism check + one retry
  const initialCheck = checkAnachronisms(working, philosopher);
  if (initialCheck.hits > 0) {
    const retried = await retryWithoutTerms(working, philosopher, initialCheck.matches);
    if (retried) {
      working = retried;
      const recheck = checkAnachronisms(working, philosopher);
      anachronismFlag = recheck.hits > 0;
    } else {
      // Retry itself failed — keep original, mark flag
      anachronismFlag = true;
    }
  }

  // Stage 2: optional critique pass
  let criticNotes: string[] | undefined;
  if (highFidelity) {
    const critique = await critiqueAndRewrite(working, philosopher);
    working = critique.rewrite;
    criticNotes = critique.critiques;
  }

  const body: RefineResponseBody = {
    text: working,
    anachronismFlag,
    ...(criticNotes ? { criticNotes } : {}),
  };
  return res.json(body);
});

/**
 * Single retry: ask Sonnet to rewrite the text without the offending terms.
 * Returns the rewritten text on success, or undefined on any failure
 * (caller treats undefined as "couldn't fix, mark the flag").
 */
async function retryWithoutTerms(
  text: string,
  philosopher: string,
  matches: string[]
): Promise<string | undefined> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return undefined;
  const model = process.env.ANACHRONISM_RETRY_MODEL || "claude-sonnet-4-6";

  const termsList = matches.map((m) => `"${m}"`).join(", ");
  const system =
    `You are rewriting a draft response attributed to ${philosopher} so it does not reference concepts, events, technology, or vocabulary that did not exist in their lifetime, or AI-assistant-style phrases.\n\n` +
    `Specifically, the draft mentions: ${termsList}. The rewrite must not contain any of those terms or close paraphrases of them.\n\n` +
    `Preserve the philosopher's voice and the substantive content of the response. Same length range. Period-appropriate vocabulary only. Output the rewrite directly with no preamble, no quotes, no explanation.`;

  try {
    const fetchRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: text }],
      }),
    });
    const data = (await fetchRes.json()) as {
      error?: { message: string };
      content?: Array<{ type: string; text?: string }>;
    };
    if (data.error) return undefined;
    const out = (data.content ?? [])
      .map((c) => c.text ?? "")
      .join("")
      .trim();
    return out.length > 0 ? out : undefined;
  } catch {
    return undefined;
  }
}

export default router;
