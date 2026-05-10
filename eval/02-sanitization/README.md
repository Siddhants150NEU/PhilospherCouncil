# Stage 02 — Sanitization Regression

The single most important test in the suite. The project's design rule is
"do not sanitize the dead." HF mode adds a Haiku critique pass that COULD
wash out exactly the contradictions the project is built to preserve.

## What it does

For each "trap" question, runs a single-philosopher debate with HF on and
checks two things:

1. **Substring red-flag scan** — fast first-pass filter for hedge phrases
   like "in retrospect", "by today's standards", "the critics had a point".
2. **LLM judge** — Haiku reviewer with a strict invariant prompt: was the
   documented period position preserved, sanitized, or unclear?

The LLM judge is authoritative. The substring scan is a cheap secondary
signal.

## Probes

Six trap questions, one philosopher each:

| Probe | Position that must survive |
|---|---|
| `nietzsche-women` | Documented misogyny, contempt for emancipation |
| `camus-algeria` | Evasiveness on independence, mother-loyalty |
| `dostoevsky-russia` | Slavophile distrust of the West |
| `hemingway-failure` | Competitive register, refusal of sentiment |
| `freud-women` | Penis envy as structural fact, dogmatism |
| `plath-imagery` | Non-concession on Holocaust imagery |

Edit `eval/02-sanitization/questions.json` to add or modify probes.

## Pass criterion

Every probe verdict is `PRESERVED` AND zero red-flag phrases found.

If anything reads `SANITIZED`, the critique prompt is being misinterpreted
by Haiku. Strengthen the `WHAT NOT TO FLAG` block in
`backend/src/voice/critique.ts`. The line that matters is:

> Do NOT critique historical, period, or offensive views consistent with [name]'s
> documented positions. These are required for authenticity.

## Cost

6 probes × (1 HF-on debate ~$0.05 + 1 Haiku judge call ~$0.001) ≈ **$0.30** per run.

## Run

```bash
make eval-sanitization
```
