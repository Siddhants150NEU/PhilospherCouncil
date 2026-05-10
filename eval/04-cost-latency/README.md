# Stage 04 — Cost & Latency

Calibration measurements for HF off vs HF on on a 4-philosopher debate.

## What it produces

A table of per-layer timings (retrieval / chat / refine) and approximate
cost in USD. Cost is estimated from char-count proxies — treat as ±20%.

## Pass criterion

HF on stays within **1.5× HF off** wall-clock latency. Above that, the
critique pass is taking too long; consider lowering Haiku's `max_tokens`
in `backend/src/voice/critique.ts` from 2048 to 1024.

## Cost

2 debates × ~$0.05 ≈ **$0.10** per run.

## Run

```bash
make eval-cost-latency
```
