# run.md — Operating the Philosophical Council

The README is the marketing page. This file is the runbook: how to install, run,
ingest, smoke-test, deploy, and debug the project after the authenticity-stack
PR (RAG + voice anchors + anti-patterns + anachronism guard + critique pass).

For architectural intent, see `CLAUDE.md` (overall) and
`/Users/siddhantsharma/.claude/plans/compressed-forging-manatee.md` (this PR).

---

## 1. Prerequisites

- Node.js 20 or newer (Node 18 will work for runtime but `node --env-file` is required by `npm run dev`).
- An Anthropic API key (`ANTHROPIC_API_KEY`).
- An internet connection on first ingest, so the local embedding model (`Xenova/all-MiniLM-L6-v2`, ~25MB) can download from huggingface.co. After that, retrieval is fully offline.
- macOS / Linux. The Makefile uses `pkill` and POSIX shell, which works on Windows via WSL.

## 2. First-time setup

```bash
make install
```

This:

1. Copies `.env.example` → `.env` if `.env` doesn't yet exist (and exits asking you to fill in keys).
2. Runs `npm install` in `backend/` and `frontend/`.

Edit `.env` and set:

```
ANTHROPIC_API_KEY=sk-ant-…       # required (debate generation, critique pass)
```

That's the only required key. Embeddings run locally via Transformers.js — no external service. Other vars (`PORT`, `RAG_TOP_K`, `HIGH_FIDELITY_CRITIC_MODEL`, `EMBED_BATCH_SIZE`, `HF_HOME`) have sensible defaults baked into the code; only override if you need to.

## 3. Day-to-day local dev

```bash
make dev
```

Starts both servers:

- backend → http://localhost:3001 (Express + SQLite)
- frontend → http://localhost:5173 (Vite, proxies `/api/*` to :3001)

Ctrl+C stops both. If something gets stuck:

```bash
make stop
```

To verify the codebase still type-checks after a change:

```bash
make typecheck
```

To produce a production build (used by Docker):

```bash
make build
```

## 4. Corpus ingestion (RAG)

The retrieval layer is opt-in: with no rows in `corpus_chunks`, `/api/retrieve` returns empty arrays for every philosopher and the debate proceeds without retrieval. To turn it on, drop text files into `corpus/<philosopher-key>/<work>.txt` and run the ingestion script.

### Layout

```
corpus/
├── nietzsche/
│   ├── zarathustra.txt        ← Project Gutenberg, full text OK
│   └── beyond-good-and-evil.txt
├── kafka/
│   └── trial.txt
└── camus/
    └── _fair-use.txt          ← short curated quotes only (still in copyright)
```

Subdirectory name = philosopher key (must match `ALL_PHILOSOPHERS` in `frontend/src/App.tsx`).
File name (without `.txt`) becomes the `work` field on each chunk.

See `corpus/README.md` for per-philosopher copyright guidance.

### Running

```bash
make ingest                    # all philosophers found in corpus/
make ingest-one PH=nietzsche   # one philosopher
make ingest-dry                # chunk + report, no embedding, no DB writes
make wipe-corpus               # delete all rows (e.g., before changing model)
```

The script is **resume-safe** — Ctrl+C and re-run any time; chunks already in the DB are skipped. Embedding runs entirely on CPU via Transformers.js, so cost is **$0** and a full ingestion of the eight public-domain corpora takes **~10–30 minutes** on a typical laptop.

Each run logs:

```
[ingest] philosophers: nietzsche
[ingest] nietzsche/zarathustra → 312 chunks (avg 387 tok)
  embedded 312/312 ✓
[ingest] nietzsche: total rows now = 312
[ingest] done
```

### Verifying the ingest

```bash
sqlite3 backend/data/council.db 'SELECT philosopher, COUNT(*) FROM corpus_chunks GROUP BY philosopher;'
```

## 5. Smoke testing the full stack

With `make dev` running in another terminal:

```bash
make smoke
```

Hits `/api/health`, `/api/retrieve`, and `/api/refine` and prints the responses.
Useful as a first check after any backend change.

For a full end-to-end (frontend interaction), see the verification list in the plan file:
`/Users/siddhantsharma/.claude/plans/compressed-forging-manatee.md`, section "Verification."

### Manual frontend checks worth doing

1. Open http://localhost:5173. The intro screen should now show a **"🔬 High-Fidelity Mode"** checkbox under the question textarea, defaulted **OFF**.
2. Pick 3 philosophers, ask a real question with toggle OFF — debate should generate normally; no console errors.
3. Same question with toggle ON — noticeably sharper voice (~3–5s extra wall-clock per debate).
4. **Anachronism trap:** ask "What do you think of TikTok?" — at least one philosopher's turn should either avoid the term entirely or render with a ⚠️ badge after one retry.
5. Save the debate, reopen from the Library, generate the PDF — the ⚠️ badge should NOT bleed into the printed transcript.

## 6. Docker (production)

```bash
make docker          # build + run, foreground
make docker-stop     # stop, preserve data volume
make docker-logs     # tail logs
make docker-rebuild  # force --no-cache rebuild
```

The container exposes port **3001**, and persists SQLite to the named volume **`council-data`**. `docker compose down -v` wipes the volume (saved debates, profile, corpus chunks). `docker compose down` (without `-v`) preserves it.

## 7. Architecture in one diagram

```
┌─ Browser ───────────────────────────────────────────────────────────────┐
│  React 19 / Vite (5173 in dev, same-origin in prod)                     │
│  frontend/src/App.tsx                                                   │
│   ├─ retrieveContext()  ─► POST /api/retrieve                           │
│   ├─ callClaudeWithGuards() ─► POST /api/chat                           │
│   ├─ refineTurn()       ─► POST /api/refine (per turn, in parallel)     │
│   └─ storage.{get,set,delete,list} ─► /api/storage/*                    │
└─────────────────────────────────────────────────────────────────────────┘
                                │
┌─ Backend (Express, 3001) ─────────────────────────────────────────────┐
│                                                                       │
│   /api/chat       — proxies to Anthropic Sonnet 4.6                   │
│                     prepends per-philosopher voice blocks             │
│                     (ANCHORS + ANTI_PATTERNS + retrieval)             │
│                     to the system prompt.                             │
│                                                                       │
│   /api/retrieve   — embeds question via local MiniLM (Transformers.js), │
│                     brute-force cosine top-k from corpus_chunks.      │
│                                                                       │
│   /api/refine     — regex anachronism check (one retry on hit) +      │
│                     optional Haiku critique-and-rewrite pass when     │
│                     highFidelity=true.                                │
│                                                                       │
│   /api/storage/*  — KV proxy backed by SQLite (kv_store table).       │
│                                                                       │
│   /api/health     — { status:"ok", env }                              │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                │
┌─ SQLite (better-sqlite3, WAL) ────────────────────────────────────────┐
│   kv_store        — debates, profile, journal entries                 │
│   corpus_chunks   — RAG chunks with Float32Array embeddings as BLOBs  │
└───────────────────────────────────────────────────────────────────────┘
```

The only external service is **Anthropic** (debate generation, anachronism retry, critique). The API key lives in the backend's `process.env` only — never reaches the browser. Embeddings run locally in-process; the model file caches under `$HF_HOME` after the first download.

## 8. The five authenticity layers, briefly

When you start a debate, the system prompt the model sees is assembled like this, per selected philosopher:

```
=== NIETZSCHE ===

NIETZSCHE — VOICE ANCHORS (verbatim from their work; calibrate register, do not quote):
- "God is dead. God remains dead. And we have killed him."
- ...

NIETZSCHE — WOULD NEVER:
- appeal to consensus, kindness, or fairness as a virtue in itself
- ...

NIETZSCHE — FROM YOUR PRIOR WRITING ON THIS QUESTION (use as voice texture; do not quote literally unless directly relevant):
- "{retrieved chunk 1}"
- "{retrieved chunk 2}"
- "{retrieved chunk 3}"

NIETZSCHE: You are Friedrich Nietzsche — philologist, philosopher … (UNCHANGED, VERBATIM)
```

Token-budget tiers (in `backend/src/routes/chat.ts`):

| Council size | What gets prepended            |
|:-:|---|
| ≤ 6  | Anchors + anti-patterns + retrieval |
| 7–9  | Anchors + anti-patterns (no retrieval) |
| ≥ 10 | Anchors only |

Each turn is then post-processed in `/api/refine`:

1. Regex anachronism check (free, ~ms). If hit, one Sonnet retry asking for a rewrite without the offending terms.
2. If still hit, the turn renders with a `⚠️` badge — honestly surfacing what couldn't be cleaned, instead of silently mangling further.
3. If `highFidelity` is on, a Haiku critique-and-rewrite pass runs. The critic prompt explicitly forbids flagging period views — only modern register, modern concept use, AI tropes.

## 9. Cost & latency expectations

For a typical 6-turn debate with 5 philosophers selected:

|  | HF off | HF on |
|---|---|---|
| Cost | ~$0.040 | ~$0.046 (+15%) |
| Wall-clock | ~5–15s | ~8–20s |
| Calls | 1 local embed + 1 Sonnet + 6 regex (free) | + 6 Haiku rewrites |

One-time corpus ingestion: **$0** (local CPU inference). Wall-clock ~10–30 minutes for the eight public-domain corpora on a typical laptop.

## 10. Troubleshooting

### Embedding model fails to download on first ingest

The first `make ingest` (or first `/api/retrieve`) needs to download `Xenova/all-MiniLM-L6-v2` (~25MB) from huggingface.co. If you see a network error in the ingest banner:

1. Check internet connectivity to `huggingface.co`.
2. Check that `$HF_HOME` (default `./.cache/huggingface`) is writable.
3. Behind a corporate proxy? Set `HTTPS_PROXY` in `.env` so Node's fetch picks it up.
4. Once the model is cached, subsequent runs are fully offline.

### Ingest aborts with "existing corpus_chunks rows are N-dim"

You changed embedding models or migrated from a different embedder, leaving stale rows in the table with mismatched vector dimensions. Run `make wipe-corpus`, then re-run `make ingest`. The corpus/*.txt files are untouched.

### Debates are blank / never load

1. Open browser devtools → Network. Find the `/api/chat` request. Look at the JSON response.
2. If the response contains `error`, that's the upstream Anthropic error message. Most common: invalid `ANTHROPIC_API_KEY`, or model name out of date.
3. Confirm the model: `grep -n DEFAULT_MODEL backend/src/routes/chat.ts` — should be `claude-sonnet-4-6`.

### Anachronism flags appear too aggressively

Edit `backend/src/voice/anachronisms.ts`:

- Add the over-flagged term to that philosopher's `ALLOWLIST` entry, OR
- Remove it from `PER_PHILOSOPHER` if it isn't actually a tell.

The shared list (`SHARED_PATTERNS`) is for AI-assistant tropes only — be careful adding philosophy-relevant terms there.

### High-Fidelity Mode produces bland or oddly-worded rewrites

This is the highest-stakes module to debug. The critique system prompt is in `backend/src/voice/critique.ts`:

- If the critic is "fixing" period views (Nietzsche softer, Camus more progressive on Algeria, etc.), the **invariant block in the prompt** is being ignored. Re-read the `WHAT NOT TO FLAG` section of the prompt; consider strengthening it.
- If rewrites are dropping content, check the `Same length range` instruction near the end.
- If the critic is timing out, lower `max_tokens` from 2048 to 1024 (Haiku is fast, but Anthropic still has per-minute rate limits).

### "Can I see the critic's notes for a turn?"

They're persisted on each turn (`criticNotes: string[]`) but not rendered in the live UI. To inspect them, after saving a debate:

```bash
curl http://localhost:3001/api/storage/debate:<timestamp> | jq '.value | fromjson | .turns[] | {ph: .philosopher, notes: .criticNotes}'
```

A future PR can add a disclosure-triangle UI to surface these inline.

### `corpus_chunks` is taking up a lot of disk

Each row is ~400 tokens of text + a 4096-byte embedding BLOB + metadata. At ~5,000 rows the table is ~25 MB. Vacuuming reclaims space if you re-ingest a lot:

```bash
sqlite3 backend/data/council.db 'VACUUM;'
```

## 11. What's NOT here

- **No test framework.** Verification is manual; the `make smoke` target hits the three new routes.
- **No corpus content shipped.** Public-domain texts must be added by hand to `corpus/<philosopher>/`.
- **No critique-notes UI.** Notes are persisted on each turn but not surfaced. See "Can I see the critic's notes?" above.
- **No stylometric scoring.** README roadmap item #2 is intentionally out of scope for this PR.

## 12. File map (post-PR)

```
.env.example                       new RAG / High-Fidelity vars (gitignored locally)
Makefile                           help, dev, ingest{,-one,-dry}, smoke, docker
run.md                             this file
corpus/                            corpus dir (gitignored content; .gitkeep + README committed)
  └─ README.md                     copyright + sourcing guidance per philosopher

backend/
  ├─ package.json                  + gpt-tokenizer, ts-node devdep, ingest script
  ├─ scripts/
  │   └─ ingest-corpus.ts          chunk → embed → upsert
  └─ src/
      ├─ db.ts                     + corpus_chunks table + corpus export
      ├─ server.ts                 + /api/retrieve and /api/refine routers
      ├─ corpus/
      │   ├─ embed.ts              Local Transformers.js / MiniLM wrapper
      │   └─ retrieve.ts           in-memory cosine top-k
      ├─ voice/
      │   ├─ anchors.ts            ANCHORS + formatAnchorsBlock
      │   ├─ anti-patterns.ts      ANTI_PATTERNS + formatAntiPatternsBlock
      │   ├─ anachronisms.ts       SHARED_PATTERNS, PER_PHILOSOPHER, ALLOWLIST, checkAnachronisms
      │   └─ critique.ts           critiqueAndRewrite via Haiku
      └─ routes/
          ├─ chat.ts               + voiceBlocks prepend with token-budget tiers
          ├─ retrieve.ts           POST /api/retrieve
          ├─ refine.ts             POST /api/refine
          └─ storage.ts            unchanged

frontend/
  └─ src/
      ├─ api.ts                    + retrieveContext, callClaudeWithGuards, refineTurn
      └─ App.tsx                   + highFidelity state, toggle UI, refineTurns batching, ⚠️ badge
```

The legacy `philosophical-council.tsx` at the repo root is a frozen reference and was not touched.
