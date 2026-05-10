# Stage 05 — Voice-Anchor Leakage

Reads the fixtures from stage 03 (and 02) and substring-checks each turn
against the philosopher's voice anchors in `backend/src/voice/anchors.ts`.

## What "leakage" means

The voice anchors are short verbatim passages prepended to the system
prompt as register reference. The prompt instructs the model to "calibrate
register, do not quote." If the model regresses and quotes anchors verbatim
in its output (≥10 consecutive matching tokens), the anchor block is
counterproductive — the user is reading the model's words and finding
verbatim philosopher quotes, which the project explicitly does not want.

## Pass criterion

Zero leaks across all fixtures. Brief partial echoes of common phrases are
fine; only sustained verbatim quotation is flagged.

## Cost

$0 — pure substring analysis, no API calls.

## Depends on

`make eval-ab` (and ideally `make eval-sanitization`) must have run first
to populate `<run-dir>/fixtures/`.

## Run

```bash
make eval-anchor-leakage
```
