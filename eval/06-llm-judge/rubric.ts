/**
 * Authenticity rubric for the LLM judge.
 *
 * Four 1–5 axes, scored independently per turn. Mirrors what a human reader
 * is actually looking for when they ask "does this sound like the person?"
 *
 * Axis A — Period vocabulary: absence of modern terms the philosopher could
 *          not have used (no "process", "journey", "growth", "boundaries",
 *          "trauma", "feedback loop").
 * Axis B — Documented positions: presence of the philosopher's actual
 *          views, including offensive or contradictory ones. Period-appropriate
 *          claims, not modern-respectability rewrites.
 * Axis C — Absence of AI register: no "I hear you", "great question",
 *          "it's important to note", structured headers, bulleted lists where
 *          prose belongs.
 * Axis D — Characteristic cadence: rhythm, sentence length, signature
 *          devices (Nietzsche aphoristic, Kafka clerical, Hemingway terse,
 *          Dostoevsky em-dash overflow).
 *
 * Each axis 1=fails badly, 5=indistinguishable from authentic source.
 */

export const JUDGE_SYSTEM = `You are an authenticity reviewer for a project that simulates historical philosophers. Your job is to score how well a passage attributed to a philosopher captures their authentic voice.

You score on four 1-5 axes:

A — PERIOD VOCABULARY
   1: heavy modern jargon ("process", "journey", "growth", "boundaries", "trauma")
   3: mixed; some modern slips
   5: vocabulary indistinguishable from the philosopher's actual era

B — DOCUMENTED POSITIONS
   1: passage hedges, modernizes, or balances away the philosopher's documented views
   3: positions present but softened with caveats they would not have used
   5: positions voiced with the conviction and contradiction the philosopher actually held
   IMPORTANT: this includes offensive or controversial views the philosopher actually held. Do not penalize the passage for voicing those — penalize it for SANITIZING them.

C — ABSENCE OF AI REGISTER
   1: opens with "great question" / "I hear you" / structured bullet lists / "it's important to note"
   3: occasional modern-assistant phrasings
   5: zero AI-assistant tells

D — CHARACTERISTIC CADENCE
   1: bears no recognizable resemblance to the philosopher's prose rhythm
   3: hints of cadence
   5: rhythm, sentence length, and signature devices match

Output JSON only. No prose, no code fences, no preamble.

Schema:
{"a": <1-5>, "b": <1-5>, "c": <1-5>, "d": <1-5>, "notes": "<one sentence per axis explaining the score, separated by '; '>"}`;

export function buildJudgePrompt(philosopher: string, era: string, turnText: string): string {
  return `Philosopher: ${philosopher} (${era})

Passage attributed to them:
"""
${turnText}
"""

Score on the four axes (A period vocabulary, B documented positions, C absence of AI register, D characteristic cadence). Output JSON only.`;
}

export interface RubricScore {
  a: number; // period vocabulary
  b: number; // documented positions
  c: number; // absence of AI register
  d: number; // characteristic cadence
  notes: string;
}

export function parseScore(raw: string): RubricScore | null {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first < 0 || last <= first) return null;
  const slice = cleaned.slice(first, last + 1);
  try {
    const parsed = JSON.parse(slice) as Partial<RubricScore>;
    const clip = (n: unknown) => {
      const x = Number(n);
      if (!Number.isFinite(x)) return 0;
      return Math.max(1, Math.min(5, Math.round(x)));
    };
    return {
      a: clip(parsed.a),
      b: clip(parsed.b),
      c: clip(parsed.c),
      d: clip(parsed.d),
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
    };
  } catch {
    return null;
  }
}
