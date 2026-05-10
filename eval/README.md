# `eval/` — Evaluation Suite

Six-stage harness for verifying that High-Fidelity Mode is doing what it's
supposed to: producing voice that sounds like the philosopher, **without**
sanitizing the contradictions the project is designed to preserve.

## Quick start

```bash
make dev           # in one terminal — eval suite needs the backend running
make eval          # in another terminal — runs all 6 stages
```

Costs ~$0.50–$1.00 and takes ~5–8 minutes. Outputs go to a fresh
`eval/output/<timestamp>/` directory; the `SUMMARY.md` inside it is the
single document you read.

## The six stages

| # | Stage | What it answers | Cost | Depends on |
|:-:|---|---|---:|---|
| 01 | **mechanical** | Are all the API layers wired correctly? | ~$0.005 | — |
| 02 | **sanitization** | Does HF mode preserve documented period views? | ~$0.30 | — |
| 03 | **ab** | Does HF on perceptibly differ from HF off? | ~$0.27 | — |
| 04 | **cost-latency** | What's the per-debate cost & latency delta? | ~$0.10 | — |
| 05 | **anchor-leakage** | Is the model quoting voice anchors verbatim? | $0 | 02, 03 fixtures |
| 06 | **llm-judge** | What does an automated rubric say? | ~$0.05 | 02, 03 fixtures |

Stages 03 and 02 generate JSON debate fixtures under `<run-dir>/fixtures/`
that stages 05 and 06 consume. The pipeline runs them in dependency order
automatically; standalone runs of 05/06 require fixtures to already exist.

## Folder layout

```
eval/
├── runner/                     shared infra (HTTP client, debate orchestration, reporter, type defs)
│   ├── client.ts               wrappers for /api/health, /api/retrieve, /api/chat, /api/refine
│   ├── debate.ts               full debate orchestration (mirrors frontend startDebate)
│   ├── prompts.ts              extracts ALL_PHILOSOPHERS prompts from frontend/src/App.tsx
│   ├── reporter.ts             markdown writers, fixture I/O, per-run output directory
│   └── types.ts
├── 01-mechanical/              API plumbing assertions
├── 02-sanitization/            trap questions probing period-view preservation
│   └── questions.json          edit to add/modify probes
├── 03-ab/                      side-by-side HF off vs on; generates shared fixtures
│   └── questions.json          edit to change diagnostic question set
├── 04-cost-latency/            per-debate timing + cost
├── 05-anchor-leakage/          verbatim-quote substring scan
├── 06-llm-judge/               4-axis authenticity rubric
│   └── rubric.ts               edit to tune scoring criteria
├── output/                     gitignored; timestamped run outputs
│   └── <YYYY-MM-DD-HHMMSS>/
│       ├── SUMMARY.md          aggregate report — start here
│       ├── 01-mechanical.md    per-stage reports
│       ├── 02-sanitization.md
│       ├── 03-ab.md
│       ├── 04-cost-latency.md
│       ├── 05-anchor-leakage.md
│       ├── 06-llm-judge.md
│       ├── 01-mechanical.json  per-stage machine-readable summaries
│       ├── … (one .json per stage)
│       └── fixtures/           debate transcripts (raw JSON)
│           ├── q1-suffering-off.json
│           ├── q1-suffering-on.json
│           └── …
├── run-all.ts                  pipeline orchestrator
└── README.md                   this file
```

## Reading the output

After `make eval` finishes, `cat eval/output/<latest>/SUMMARY.md` for the
overview table. Then drill into:

1. **`02-sanitization.md` first**. If any probe verdict is `SANITIZED`, fix
   that before anything else — it means HF mode is washing out the
   contradictions the project is designed to preserve.
2. **`03-ab.md` for qualitative judgment**. Read both columns side-by-side.
   If HF on doesn't perceptibly differ from HF off, the critique pass isn't
   strong enough.
3. **`06-llm-judge.md` for trend tracking**. Watch the Δ row of the
   aggregate scores table over multiple runs as you tune prompts.
4. The other three stages (01, 04, 05) are pass/fail and self-explanatory.

## Customizing

- **Add diagnostic questions**: edit `eval/03-ab/questions.json`.
- **Add sanitization probes**: edit `eval/02-sanitization/questions.json`.
- **Tune the judge rubric**: edit `eval/06-llm-judge/rubric.ts`.
- **Override base URL** (eg if backend runs on a non-default port):
  `EVAL_BASE_URL=http://localhost:4000 make eval`.
- **Override judge model** (eg use Sonnet for stricter scoring):
  `EVAL_JUDGE_MODEL=claude-sonnet-4-6 make eval-llm-judge`.

## What this suite cannot tell you

- It cannot rank prompts on philosophical depth or moral judgment.
- It cannot replace a human reading the transcript carefully.
- LLM-as-judge has known biases — treat axis-D (cadence) scores as
  approximate; humans are better at "does this sound like Hemingway."

The suite is a first-line filter: it catches mechanical regressions and
flags candidate sanitization failures, then hands the qualitative call to
you.

## Running a single stage

```bash
make eval-mechanical          # cheap, run anytime
make eval-ab                  # generates fixtures
make eval-anchor-leakage      # only if fixtures exist (no debates)
```

Standalone stage runs create their own timestamped output directory; the
pipeline (`make eval`) shares one directory across all six stages.
