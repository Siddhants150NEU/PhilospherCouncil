.PHONY: dev install stop docker docker-stop

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

# ── Docker (production) ───────────────────────────────────────────────────────

docker: .env
	docker-compose up --build

docker-stop:
	docker-compose down
