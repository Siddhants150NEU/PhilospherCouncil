# todo.md

Open work, captured from prior sessions. Grouped by priority and category.
Most-recent shipped work is at the bottom for context.

---

## Status snapshot

- **Eval suite**: shipped, 6 stages, baseline + 10 sanitization probes.
- **Last sanitization run**: 9/10 PRESERVED on the most recent runs (1 slip
  due to sampling variance). The 5 originally-SANITIZED probes
  (Hemingway, Freud, Jung, Carlin, Thompson) all now PRESERVE after the
  source-attributed prompt edits in `frontend/src/App.tsx` and
  matching anti-pattern strengthening in `backend/src/voice/anti-patterns.ts`.
- **Frontend**: Tailwind + EB Garamond + Inter + Material Symbols shipped.
  Greek temple ornaments (pediment, laurels, meander, columns, inscription)
  applied. Scaling/overflow at various zoom levels addressed.
- **Backend**: Voyage AI removed; local MiniLM via `@huggingface/transformers`.
  Seven PD philosophers fully ingested (~28k chunks). Six in-copyright
  philosophers have empty corpora pending curation.

---

## Now (highest leverage, smallest blast radius)

### 1. Run multi-trial sanitization to measure variance
Right now we run sanitization once per change and decide. With 10 probes ×
non-deterministic Sonnet, single runs have ~1 slip due to sampling, which
gets confused with regression. Run sanitization 3–5 times back-to-back on
the current prompts, record the per-probe PRESERVED rate (e.g., 5/5, 4/5,
3/5), and treat anything below 4/5 as a real failure mode worth fixing.

- Cost: ~$0.20 × 5 = ~$1.00.
- Command: loop `make eval-sanitization` 5×, aggregate verdicts.
- Output: a small Markdown table per-probe with rates.
- Could be wrapped as `make eval-sanitization-stability` (new target) that
  runs N=5 by default.

### 2. Plath prompt deepening (judge B=4.33, lowest)
Plath PRESERVED on baseline + mid-run but axis-B (documented positions)
runs ~0.4 below the council average. Failure mode noted in prior critic
notes: post-hoc apologia voice when defending Holocaust imagery (citing
critics instead of restating the position with the original defiance).

- Sources to consult: Heather Clark *Red Comet* (2020), Plath's unabridged
  journals (Hughes/Plath 2000 ed.), Strangeways defense (Indiana University
  Plath journal), Moment Magazine "Plath's Private Jewish Problem."
- Edit target: extend the `Do NOT` clause in `frontend/src/App.tsx`
  `ALL_PHILOSOPHERS.plath.prompt` and add 2 anti-patterns to
  `backend/src/voice/anti-patterns.ts` forbidding (a) naming critics, (b)
  meta-critical apologia framing.

### 3. Nietzsche prompt sharpening (judge B=4.73)
PRESERVED across most runs but variance is real — one run slipped to
SANITIZED on the `nietzsche-women` probe with "intellect-as-instrument-of-
instinct" elegant misogyny dressed up as compliment. Authentic Nietzsche
was more openly contemptuous, less courtly.

- Sources: SEP "Nietzsche," Sue Prideaux *I Am Dynamite* (2018), Walter
  Kaufmann editor's intros, the 1882 fragments to Lou Salomé.
- Edit target: add an anti-pattern forbidding courtly/elegant misogyny
  framing; require open contempt for emancipation as documented.

### 4. Reduced-motion media query for the `floatCard` animation
`character-card` runs `animation: floatCard 6s ease-in-out infinite` on
all 13 council cards perpetually. Battery drain on older devices and
accessibility issue for users with `prefers-reduced-motion: reduce`.

- Path: `frontend/src/index.css`, add a `@media (prefers-reduced-motion: reduce)`
  block that pauses or removes the animation.
- Effort: 5 minutes.

---

## Next (this scope but not urgent)

### 5. Comprehensive research pass on remaining 9 philosophers
Per the approved comprehensive-improvement plan: Camus, Kafka, Dostoevsky,
Twain, Austen, Socrates, Jung, Carlin, Thompson. All currently PRESERVE
but the comprehensive plan called for 5+ sources per philosopher and
source-attributed code comments. Three (Jung, Carlin, Thompson) already
have source-attribution comments from the SANITIZED-fix work. The other six
do not.

- Approach: same 5-step framework documented in the plan file at
  `/Users/siddhantsharma/.claude/plans/compressed-forging-manatee.md`.
- Effort: ~90 min/philosopher × 6 = ~9 hours.
- Run mid-eval check every 3 philosophers.

### 6. Corpus curation for the 6 in-copyright philosophers
Camus, Hemingway, Plath, Thompson, Carlin, late Jung have empty
`corpus_chunks` because their works are still in copyright. The original
plan called for hand-curated `_fair-use.txt` files (30 short excerpts ≤100
words each, attributed). Once these exist, the retrieval layer fires for
those philosophers too.

- Path: `corpus/<philosopher>/_fair-use.txt`. Re-run `make ingest` after.
- Effort: ~45 min/philosopher × 6 = ~4.5 hours of careful sourcing.

### 7. Critique-notes disclosure UI in the debate stage
HF mode generates `criticNotes` per turn and they're persisted in saved
debates, but the live UI doesn't surface them. The plan deferred this to
a follow-up. Worth doing: a small "View critic notes" disclosure under
each turn's dialogue bubble that expands to show the 1–3 noted
sanitization tells the Haiku judge caught.

- Path: `frontend/src/App.tsx`, debate dialogue bubble (look for
  `cur.criticNotes`).
- UX: small chevron + label, expands inline with the existing animation.

### 8. Stylometric authenticity scoring (README roadmap item #2)
Compare each generated turn against the philosopher's actual corpus
embedding distribution. Outliers flag drift. Mentioned but never
implemented; complements the LLM judge.

- Approach: average embedding of the corpus per philosopher; for each
  generated turn, compute cosine to the centroid; flag if below threshold.
- Path: `backend/src/voice/stylometric.ts` (new), plus a probe in
  `eval/06-llm-judge` or its own stage.

---

## Later (real but not blocking shipping)

### 9. Add Wittgenstein as a 14th philosopher
README explicitly calls for it. Early Wittgenstein (Tractatus, aphoristic
mysticism) and late Wittgenstein (Investigations, language games) are
philosophically incompatible — the prompt should pick one or hold the
contradiction.

- Edit: new entry in `ALL_PHILOSOPHERS` in `frontend/src/App.tsx`, new
  `WittgensteinBody` SVG component, new anchor + anti-pattern entries in
  `backend/src/voice/{anchors,anti-patterns}.ts`, sanitization + ab probes.

### 10. Public council pages (shareable links)
README roadmap. Currently debates live only in local SQLite. Sharing
means: persist a debate under a public URL with read-only access, with
optional opt-in by the visitor.

- Backend: `/api/share/:id` route, separate KV namespace or `share_id`
  column on debate records, anonymous read.
- Frontend: a "Share" Material icon next to PDF in the debate stage.

### 11. TTS audio rendering per philosopher (README roadmap)
Each philosopher voiced through an appropriate TTS preset. Anthropic
doesn't offer TTS so this needs ElevenLabs / OpenAI / similar. Out of
budget for free-tier users; gate behind a "Voiced Mode" toggle.

### 12. Self-host EB Garamond + Inter + Material Symbols
Currently loaded from Google Fonts CDN. Adds ~100ms RTT on first paint
and creates a runtime dependency on Google. Self-hosting cuts the first-
paint delay and improves privacy.

- Path: `frontend/public/fonts/`, swap the `<link>` in `index.html`,
  add `@font-face` declarations or use a `fontsource` package.

### 13. Test-framework decision
Currently zero tests. Eval suite handles end-to-end quality. Unit tests
for the regex extractor in `eval/runner/prompts.ts`, the anachronism
patterns, the cosine retrieval, and the chunking helper would catch
regressions on the data plane. Decision: do we adopt Vitest? Net cost
~3 hours scaffold + tests for the four most regression-prone modules.

### 14. Trial-run averaging for the LLM judge
Stage 06's per-turn judge gives one score per turn. Running 3 trials per
turn and averaging cuts variance by ~√3 at 3× cost. Worth doing for the
"is HF on actually better than HF off" delta which currently sits at
~+0.07 — small enough that variance could explain it.

---

## Known issues / yak-shaves

### 15. Hemingway's slip pattern is a moving target
Three SANITIZATION modes caught and fixed so far:
1. Sentimental close ("they keep the bottom of the glass from being lonely").
2. Wise-observer-of-failure ("the talk was better talk").
3. Redemptive close after hard run.

Each fix forbids one path; the model occasionally finds another.
Net positive but the prompt is now ~2200 chars and may be approaching
diminishing returns. Consider a deeper prompt restructure rather than
continuing to append forbids.

### 16. `philosophical-council.tsx` at the repo root is stale
Legacy single-file reference from before the backend/frontend split.
Hasn't been touched in months. Either delete or note in `CLAUDE.md` more
prominently that it's frozen-reference-only. Currently a memory file
flags this but new contributors won't see that.

### 17. CLAUDE.md is out of date
Still describes the pre-PR single-file architecture. Update to reflect
the current `frontend/`+`backend/` split, the eval suite, the local
MiniLM embedder, and the temple-themed Tailwind frontend.

### 18. `.env.example` history concern
A real Anthropic key was once committed to `.env.example` before
`.env.example` was added to `.gitignore`. The current file uses
placeholders, but a git history audit would confirm whether any key
needs rotating.

---

## Out of scope (intentional)

- **Test framework introduction beyond eval suite** — eval is sufficient
  for end-to-end signal. Unit tests are deferred unless a regression
  motivates them.
- **Restructuring `ALL_PHILOSOPHERS` into a JSON file** — the regex
  extractor in `eval/runner/prompts.ts` tolerates the inline-in-App.tsx
  shape. Refactoring forces a frontend rebuild and breaks no one but
  costs review effort.
- **Anti-pattern catalog beyond ~12 items per philosopher** — diminishing
  returns and a Goodhart risk (over-fitting to specific phrases the
  judge happens to use).

---

## Recently shipped (for context — do not redo)

- Eval suite: 6 stages, 10 sanitization probes, judge scoring, anchor
  leakage scan, cost+latency calibration. `make eval` and `make eval-*`
  per-stage targets. Output to `eval/output/<timestamp>/`.
- Voyage AI → local MiniLM swap. Schema unchanged; all 13 prompts
  unchanged; eval suite updated to use the regex extractor on the
  current shape.
- Five SANITIZED prompts fixed with source-attributed code comments:
  Hemingway (Mary Dearborn, Iceberg theory), Freud (Peter Gay,
  Andreas-Salomé non-equality), Jung (Samuels, Jewish Currents,
  defensive 1933-39 posture), Carlin (Back in Town, Last Words),
  Thompson (Peter Richardson, the pivot-to-writing rule).
- Frontend rewrite: Tailwind + EB Garamond + Inter + Material Symbols.
  Pediment, laurels, Greek meander, marble grain, inscription text
  effect. Doric columns flanking the debate stage. Old gold gradient
  strip preserved under the main header. Three-column grid layout for
  headers so the brand stays centered without overflowing at zoom.

---

## How to pick the next task

1. If you have ~30 min: items 1, 4.
2. If you have ~2 hours: items 1 + 2 (or 1 + 3).
3. If you have a full day: items 5 (one philosopher batch) + 6 (a few
   fair-use files) + a fresh `make eval` run.
4. If you have a weekend: items 5 (whole batch) + 7 + 8.

Reference plan: `/Users/siddhantsharma/.claude/plans/compressed-forging-manatee.md`.
Latest baseline: `eval/output/baseline-pre-research/`.
Last verified-clean run: `eval/output/hemingway-v3-final/` (9/10 PRESERVED).
