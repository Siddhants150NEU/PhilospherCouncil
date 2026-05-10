# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  Stage 1 — Build the Vite frontend                                          ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
FROM node:20.11-slim AS frontend-builder

WORKDIR /build/frontend

# Copy dependency manifests first to exploit layer caching
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --prefer-offline

# Copy the rest of the frontend source
COPY frontend/ ./

# Produce a static production build in /build/frontend/dist
RUN npm run build


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  Stage 2 — Build the TypeScript backend                                     ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
FROM node:20.11-slim AS backend-builder

WORKDIR /build/backend

COPY backend/package.json backend/package-lock.json* ./
# Install ALL deps (including dev) so tsc is available
RUN npm ci --prefer-offline

COPY backend/ ./
RUN npm run build


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  Stage 3 — Lean production image                                            ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
FROM node:20.11-slim AS production

# Security: run as non-root user (Debian-slim user-creation syntax)
RUN groupadd --system council && useradd --system --gid council council

WORKDIR /app

# Install only production dependencies for the backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev --prefer-offline

# Copy compiled backend JS from builder stage
COPY --from=backend-builder /build/backend/dist ./dist

# Copy built frontend static files where server.ts expects them:
# path.join(__dirname, "..", "..", "frontend", "dist")
# __dirname resolves to /app/dist at runtime, so two levels up = /app,
# and then frontend/dist = /app/frontend/dist
COPY --from=frontend-builder /build/frontend/dist ./frontend/dist

# Pre-download the local embedding model into the image so the container is
# offline-capable and the first /api/retrieve call has no cold-download stall.
# Cache lives in /app/.hf-cache (a layer in the image, not on the volume).
ENV HF_HOME=/app/.hf-cache
RUN mkdir -p /app/.hf-cache \
    && node -e "import('@huggingface/transformers').then(m => m.pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2')).then(()=>console.log('[prefetch] model cached'))"

# Create data directory and set permissions (covers .hf-cache too)
RUN mkdir -p /app/data && chown -R council:council /app

USER council

# Expose the API / static-file server port
EXPOSE 3001

# Health check — lightweight node-native HTTP probe (slim doesn't ship wget/curl)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data
ENV FRONTEND_DIST=/app/frontend/dist

CMD ["node", "dist/server.js"]
