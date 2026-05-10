.PHONY: help dev install stop build clean fetch fetch-list fetch-one ingest ingest-dry ingest-one wipe-corpus typecheck smoke eval eval-clean eval-mechanical eval-sanitization eval-ab eval-cost-latency eval-anchor-leakage eval-llm-judge docker docker-stop docker-logs docker-rebuild

# ── Help (default target) ─────────────────────────────────────────────────────

help:
	@echo ""
	@echo "  The Philosophical Council — make targets"
	@echo ""
	@echo "  Setup"
	@echo "    install         Install backend + frontend deps (creates .env if missing)"
	@echo ""
	@echo "  Local development"
	@echo "    dev             Run backend (3001) + frontend (5173). Ctrl+C stops both."
	@echo "    stop            Kill any leftover ts-node-dev / vite processes"
	@echo "    typecheck       Run tsc --noEmit on backend and frontend"
	@echo "    build           Compile backend (dist/) + build frontend (dist/)"
	@echo "    clean           Remove backend/dist, frontend/dist, and node_modules"
	@echo ""
	@echo "  Corpus / RAG"
	@echo "    fetch           Download all PD works from Project Gutenberg into corpus/"
	@echo "    fetch-list      Print the manifest (no network calls)"
	@echo "    fetch-one PH=<key>"
	@echo "                    Download one philosopher (e.g. PH=nietzsche)"
	@echo "    ingest          Embed all corpus/<philosopher>/*.txt locally and upsert"
	@echo "    ingest-dry      Chunk and report only — no embedding, no DB writes"
	@echo "    ingest-one PH=<key>"
	@echo "                    Ingest one philosopher (e.g. PH=nietzsche)"
	@echo "    wipe-corpus     Delete all corpus_chunks rows (required before changing"
	@echo "                    embedding model). corpus/*.txt files are NOT touched."
	@echo ""
	@echo "  Smoke tests (require dev servers running)"
	@echo "    smoke           curl /api/health, /api/retrieve, /api/refine"
	@echo ""
	@echo "  Evaluation suite (require 'make dev' running)"
	@echo "    eval                  Run all 6 stages (~\$$0.50–\$$1.00, ~5–8 min)"
	@echo "    eval-mechanical       Stage 01: API plumbing checks (cheap, fast)"
	@echo "    eval-sanitization     Stage 02: trap questions — period views must survive HF"
	@echo "    eval-ab               Stage 03: HF off vs on, side-by-side; generates fixtures"
	@echo "    eval-cost-latency     Stage 04: per-debate timing + cost"
	@echo "    eval-anchor-leakage   Stage 05: verbatim-quote detection (free, reads fixtures)"
	@echo "    eval-llm-judge        Stage 06: 4-axis authenticity scoring (reads fixtures)"
	@echo "    eval-clean            Delete all eval/output/ runs"
	@echo ""
	@echo "  Docker"
	@echo "    docker          Build + run the production image (port 3001)"
	@echo "    docker-stop     Stop the container (preserves data volume)"
	@echo "    docker-logs     Tail container logs"
	@echo "    docker-rebuild  Force-rebuild the image"
	@echo ""

# ── First-time setup ──────────────────────────────────────────────────────────

.env:
	@cp .env.example .env
	@echo ""
	@echo "  .env created — open it and set ANTHROPIC_API_KEY, then run 'make dev' again."
	@echo ""
	@exit 1

install: .env
	cd backend && npm install
	cd frontend && npm install

# ── Local development ─────────────────────────────────────────────────────────
# Starts both servers. Ctrl+C stops both.

dev: install
	@echo ""
	@echo "  Backend  → http://localhost:3001"
	@echo "  Frontend → http://localhost:5173"
	@echo ""
	@echo "  Ctrl+C stops both."
	@echo ""
	@trap 'pkill -f "ts-node-dev" 2>/dev/null; pkill -f "vite" 2>/dev/null; exit 0' INT TERM EXIT; \
	(set -a; . ./.env; set +a; cd backend && npm run dev) & \
	(cd frontend && npm run dev); \
	wait

stop:
	@pkill -f "ts-node-dev" 2>/dev/null && echo "Backend stopped." || echo "Backend was not running."
	@pkill -f "vite" 2>/dev/null && echo "Frontend stopped." || echo "Frontend was not running."

typecheck:
	@echo "Backend tsc --noEmit"
	cd backend && ./node_modules/.bin/tsc --noEmit
	@echo "Frontend tsc --noEmit"
	cd frontend && ./node_modules/.bin/tsc --noEmit

build:
	cd backend && npm run build
	cd frontend && npm run build

clean:
	rm -rf backend/dist frontend/dist
	rm -rf backend/node_modules frontend/node_modules
	@echo "Cleaned. Run 'make install' to reinstall."

# ── Corpus / RAG ──────────────────────────────────────────────────────────────
# Embeddings run locally via Transformers.js (Xenova/all-MiniLM-L6-v2). No API
# key required. Fetching from Project Gutenberg also requires no key.

fetch:
	cd backend && npm run fetch-corpus

fetch-list:
	cd backend && npm run fetch-corpus -- --list

fetch-one:
	@if [ -z "$(PH)" ]; then \
		echo "  Usage: make fetch-one PH=<philosopher-key>"; \
		echo "  Example: make fetch-one PH=nietzsche"; \
		exit 1; \
	fi
	cd backend && npm run fetch-corpus -- --philosopher=$(PH)

ingest:
	cd backend && npm run ingest

ingest-dry:
	cd backend && npm run ingest -- --dry-run

ingest-one:
	@if [ -z "$(PH)" ]; then \
		echo "  Usage: make ingest-one PH=<philosopher-key>"; \
		echo "  Example: make ingest-one PH=nietzsche"; \
		exit 1; \
	fi
	cd backend && npm run ingest -- --philosopher=$(PH)

# Wipe all rows from corpus_chunks. Required before switching embedding models
# (incompatible vector dimensions would crash cosine similarity at retrieval).
# The corpus/<philosopher>/*.txt source files are NOT touched.
wipe-corpus:
	@echo "  Wiping all rows from corpus_chunks. corpus/*.txt files are untouched."
	@sqlite3 backend/data/council.db 'DELETE FROM corpus_chunks; VACUUM;'
	@echo "  Done. Run 'make ingest' to repopulate."

# ── Smoke tests (require 'make dev' running in another terminal) ──────────────

smoke:
	@echo "── /api/health ─────────────────────────────────────────────────────"
	@curl -s http://localhost:3001/api/health | head -c 200; echo ""
	@echo ""
	@echo "── /api/retrieve (empty corpus → empty arrays) ─────────────────────"
	@curl -s -X POST http://localhost:3001/api/retrieve \
		-H 'content-type: application/json' \
		-d '{"question":"what is meaning?","philosophers":["nietzsche","kafka"]}' \
		| head -c 400; echo ""
	@echo ""
	@echo "── /api/refine (anachronism trap) ──────────────────────────────────"
	@curl -s -X POST http://localhost:3001/api/refine \
		-H 'content-type: application/json' \
		-d '{"philosopher":"camus","text":"As an AI language model, I think life is absurd. Just google it.","highFidelity":false}' \
		| head -c 600; echo ""

# ── Evaluation suite ──────────────────────────────────────────────────────────
# Requires 'make dev' running in another terminal. Outputs go to eval/output/.

EVAL_RUNNER := cd backend && node --env-file=../.env ./node_modules/.bin/ts-node --transpile-only --project tsconfig.eval.json

eval:
	$(EVAL_RUNNER) ../eval/run-all.ts

eval-mechanical:
	$(EVAL_RUNNER) ../eval/01-mechanical/run.ts

eval-sanitization:
	$(EVAL_RUNNER) ../eval/02-sanitization/run.ts

eval-ab:
	$(EVAL_RUNNER) ../eval/03-ab/run.ts

eval-cost-latency:
	$(EVAL_RUNNER) ../eval/04-cost-latency/run.ts

eval-anchor-leakage:
	$(EVAL_RUNNER) ../eval/05-anchor-leakage/run.ts

eval-llm-judge:
	$(EVAL_RUNNER) ../eval/06-llm-judge/run.ts

eval-clean:
	rm -rf eval/output/*
	@echo "  eval/output/ cleared."

# ── Docker (production) ───────────────────────────────────────────────────────

docker: .env
	docker-compose up --build

docker-stop:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-rebuild:
	docker-compose build --no-cache
	docker-compose up -d
