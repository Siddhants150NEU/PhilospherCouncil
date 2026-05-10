# Stage 06 — LLM Judge

Reads the fixtures from stages 02 and 03, scores each turn 1–5 on four
authenticity axes via Haiku.

## Rubric

| Axis | What it scores |
|---|---|
| **A** Period vocabulary | absence of modern jargon ("process", "journey", "growth", "boundaries") |
| **B** Documented positions | presence of philosopher's actual views, including offensive/contradictory ones |
| **C** Absence of AI register | no "great question", "I hear you", structured headers |
| **D** Characteristic cadence | rhythm, sentence length, signature devices (Nietzschean aphorism, Hemingway terseness) |

The full rubric prompt lives in `rubric.ts`. Modify there to tune scoring.

## Pass criterion

HF on average total ≥ HF off average total. A regression (HF on < HF off)
is a **real signal** that the critique pass is making things worse net.

Pay particular attention to **axis B**: high scores on A/C/D with a low B
mean the model sounds plausible but is sanitizing the actual person — see
stage 02 for the regression test.

## Cost

~50 turns × ~1k input + 200 output Haiku ≈ **$0.05** per run.

## Depends on

`make eval-ab` (and ideally `make eval-sanitization`) must have run first.

## Run

```bash
make eval-llm-judge
```
