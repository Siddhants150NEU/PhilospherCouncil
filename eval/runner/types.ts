/**
 * Shared types across all eval stages.
 */

export interface DebateTurn {
  philosopher: string;
  text: string;
  anachronismFlag?: boolean;
  criticNotes?: string[];
}

export interface RetrievalHit {
  text: string;
  work: string;
  score: number;
}

export interface DebateResult {
  question: string;
  philosophers: string[];
  highFidelity: boolean;
  turns: DebateTurn[];
  durationMs: number;
  retrievalHits: Record<string, number>; // count per philosopher
  retrievalDurationMs: number;
  chatDurationMs: number;
  refineDurationMs: number;
  // Approximate cost in USD; non-authoritative — Anthropic counts tokens, not us.
  estimatedCostUsd: number;
  errors: string[];
}

export interface StageResult {
  stage: string;
  passed: boolean;
  summary: string; // one-liner for terminal + SUMMARY.md
  detailsPath: string; // path to per-stage markdown report
  jsonPath: string; // path to per-stage JSON dump
  durationMs: number;
  approxCostUsd: number;
}

export interface DiagnosticQuestion {
  id: string;
  question: string;
  philosophers: string[];
  // Free-text intent shown in reports; helps the human reader know what to look for.
  intent: string;
}

export interface SanitizationProbe extends DiagnosticQuestion {
  // The position/contradiction/period view the philosopher is supposed to retain.
  // The LLM judge in stage 02 explicitly checks for survival of this position.
  mustSurvive: string;
  // Optional: substrings that, if present, are red flags (modern caveats, balanced register).
  redFlagPhrases?: string[];
}
