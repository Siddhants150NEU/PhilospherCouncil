import { Router, Request, Response } from "express";
import { embedTexts } from "../corpus/embed";
import { retrieve, RetrievalHit } from "../corpus/retrieve";

const router = Router();

interface RetrieveRequestBody {
  question: string;
  philosophers: string[];
  k?: number;
}

interface RetrieveResponseBody {
  results: Record<string, RetrievalHit[]>;
}

/**
 * POST /api/retrieve
 *
 * Embeds the user's question once via the local MiniLM embedder, then runs
 * in-memory cosine retrieval per requested philosopher.
 *
 * Body: { question, philosophers: string[], k?: number }
 * Response: { results: { [philosopherKey]: [{text, work, score}, ...] } }
 *
 * Empty corpora return [] for that philosopher (graceful — debate proceeds
 * without retrieval). Embedder failure (model load OOM, ONNX session error)
 * returns 502; frontend swallows it and also proceeds without retrieval.
 */
router.post("/", async (req: Request, res: Response) => {
  const { question, philosophers, k } = req.body as RetrieveRequestBody;

  if (typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({ error: "question must be a non-empty string" });
  }
  if (!Array.isArray(philosophers) || philosophers.length === 0) {
    return res.status(400).json({ error: "philosophers must be a non-empty array" });
  }

  const topK = typeof k === "number" && k > 0
    ? Math.floor(k)
    : parseInt(process.env.RAG_TOP_K || "3", 10) || 3;

  let queryVec: Float32Array;
  try {
    const vecs = await embedTexts([question.trim()], "query");
    queryVec = vecs[0];
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown embedding error";
    return res.status(502).json({ error: `Embedding failed: ${message}` });
  }

  const results: Record<string, RetrievalHit[]> = {};
  for (const ph of philosophers) {
    if (typeof ph !== "string") continue;
    results[ph] = retrieve(ph, queryVec, topK);
  }

  const body: RetrieveResponseBody = { results };
  return res.json(body);
});

export default router;
