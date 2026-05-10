# Stage 03 — A/B (HF off vs HF on)

For each diagnostic question, runs the debate twice — once with High-Fidelity
Mode off, once on — and writes a side-by-side markdown report. Both
transcripts are also saved as JSON fixtures used by stages 05 and 06.

## What it produces

- `<run-dir>/03-ab.md` — side-by-side transcripts, your primary deliverable
- `<run-dir>/fixtures/<id>-off.json` — raw HF-off debate result
- `<run-dir>/fixtures/<id>-on.json` — raw HF-on debate result

The report tells you what to look for; you decide subjectively whether HF on
perceptibly improves voice fidelity.

## Cost

3 questions × 2 debates × ~$0.045 ≈ **$0.27** per run.

## Configure questions

Edit `eval/03-ab/questions.json`. Each entry needs `id`, `question`,
`philosophers`, `intent`. Stages 05 and 06 read the same fixtures so changing
this file changes their inputs too.

## Run

```bash
make eval-ab
```
