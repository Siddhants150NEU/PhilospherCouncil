# Stage 01 — Mechanical Plumbing

Asserts each component of the authenticity stack actually responds. Five
binary checks, runs in seconds, costs about half a cent.

| Check | What it verifies |
|---|---|
| `/api/health` returns ok | Backend is up |
| `/api/retrieve` returns hits for `kafka` | Corpus ingested + cosine retrieval works |
| `/api/retrieve` returns `[]` for empty corpus | Graceful degradation when philosopher has no rows |
| `/api/refine` flags + rewrites planted anachronism | Anachronism guard wired correctly |
| `/api/refine` with `highFidelity=true` returns `criticNotes` | Haiku critique pass fires |

## Run

```bash
make eval-mechanical
```

Or as part of the full pipeline:

```bash
make eval
```

## Pass criterion

All five checks pass. If `/api/health` fails, the rest are skipped. If the
empty-corpus check returns hits (e.g. you populated `thompson` with fair-use
excerpts), it's reported as informational rather than failing.

## What failure means

- Health fail → `make dev` isn't running, or backend crashed.
- Retrieve hits = 0 → run `make fetch-one PH=kafka && make ingest-one PH=kafka` first.
- Refine doesn't rewrite the anachronism → check `backend/src/voice/anachronisms.ts` patterns.
- `criticNotes` empty → Haiku critique pass is failing silently. Check `backend/src/voice/critique.ts` and `HIGH_FIDELITY_CRITIC_MODEL` env.
