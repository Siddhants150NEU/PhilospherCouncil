/**
 * In-memory cosine retrieval over corpus_chunks.
 *
 * Strategy: lazy-load all rows for a philosopher into a process-level cache
 * on first use, then brute-force cosine similarity in a tight loop. At the
 * project's scale (≤5k chunks per philosopher × 384 dims from the local
 * MiniLM encoder) this is sub-10ms and avoids pulling in a vector-DB
 * dependency.
 *
 * Cache invalidation: never. Process restart re-reads. Acceptable because the
 * corpus is updated offline via the ingestion script and the backend is a
 * single Express instance.
 */

import { corpus as db } from "../db";
import { bufferToEmbedding } from "./embed";

interface CachedChunk {
  text: string;
  work: string;
  vec: Float32Array;
}

const cache = new Map<string, CachedChunk[]>();

function loadPhilosopher(philosopher: string): CachedChunk[] {
  const cached = cache.get(philosopher);
  if (cached) return cached;
  const rows = db.listByPhilosopher(philosopher);
  const chunks: CachedChunk[] = rows.map((r) => ({
    text: r.text,
    work: r.work,
    vec: bufferToEmbedding(r.embedding),
  }));
  cache.set(philosopher, chunks);
  return chunks;
}

/**
 * Compute cosine similarity between two Float32Array vectors.
 * Assumes equal length; caller guarantees this (both come from the same MiniLM encoder).
 */
function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const n = a.length;
  for (let i = 0; i < n; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface RetrievalHit {
  text: string;
  work: string;
  score: number;
}

/**
 * Top-k cosine retrieval for a philosopher. Returns [] if the corpus has no
 * rows for that philosopher (graceful degradation — caller treats this as
 * "no prior writing available, skip the retrieval block").
 */
export function retrieve(
  philosopher: string,
  queryEmbedding: Float32Array,
  k: number
): RetrievalHit[] {
  const chunks = loadPhilosopher(philosopher);
  if (chunks.length === 0) return [];

  // Score every chunk
  const scored: RetrievalHit[] = new Array(chunks.length);
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    scored[i] = { text: c.text, work: c.work, score: cosine(queryEmbedding, c.vec) };
  }

  // Partial sort — for small k just sort the whole array
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

/** Test-only / future: clear the cache. Not exposed via HTTP. */
export function _clearCache(): void {
  cache.clear();
}
