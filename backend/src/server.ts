import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import chatRouter from "./routes/chat";
import storageRouter from "./routes/storage";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);
const NODE_ENV = process.env.NODE_ENV || "development";

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    // Allow the frontend to load from the same origin in production
    contentSecurityPolicy: false,
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
// In development the Vite dev server runs on a different port; allow it.
// In production the frontend is served from the same origin so CORS is
// only needed for potential external clients.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server, same-origin)
      if (!origin) return callback(null, true);
      if (NODE_ENV === "development") return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/chat", chatRouter);
app.use("/api/storage", storageRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: NODE_ENV });
});

// ── Serve built frontend in production ───────────────────────────────────────
if (NODE_ENV === "production") {
  // In Docker: __dirname = /app/dist, so ../frontend/dist = /app/frontend/dist
  // In local dev (ts-node): __dirname = backend/src, so ../../frontend/dist is correct
  const frontendDist = process.env.FRONTEND_DIST
    ? process.env.FRONTEND_DIST
    : path.join(__dirname, "..", "frontend", "dist");
  app.use(express.static(frontendDist));
  // SPA fallback — any non-API route returns index.html
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[council-api] listening on http://0.0.0.0:${PORT} (${NODE_ENV})`);
});

export default app;
