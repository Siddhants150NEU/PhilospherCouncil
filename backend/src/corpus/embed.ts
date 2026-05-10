/**
 * Local sentence-embedding wrapper using Transformers.js.
 *
 * Single source of truth for the embedding shape used both by the offline
 * ingestion script and by the live /api/retrieve route. Runs entirely
 * in-process on CPU — no API keys, no network calls after the first model
 * download, no rate limits.
 *
 * Model: Xenova/all-MiniLM-L6-v2 — 384-dim, ~25MB ONNX weights.
 *        Mean pooling + L2 normalize, matching sentence-transformers' canonical
 *        post-processing. The pipeline option block is mandatory; without it
 *        you get per-token hidden states, not sentence embeddings, and cosine
 *        rankings become meaningless.
 *
 * Cache: model weights cache to $HF_HOME (or ./.cache/huggingface by default).
 *        First run downloads from huggingface.co; subsequent runs are offline.
 */

import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

export const EMBEDDING_DIM = 384; // all-MiniLM-L6-v2 hidden size

// Module-scoped lazy initializer. Pipeline construction is async (downloads
// model on first call); we cache the Promise itself so concurrent callers
// share one initialization instead of racing to load N copies.
let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", MODEL_ID) as Promise<FeatureExtractionPipeline>;
  }
  return extractorPromise;
}

// One-time L2-norm sanity check on the very first batch — protects against
// future regression where {pooling, normalize} options accidentally drop.
let normSanityChecked = false;

/**
 * Embed a list of strings via the local MiniLM model. Returns one
 * Float32Array(384) per input, preserving input order.
 *
 * The `inputType` parameter is preserved for forward compatibility with
 * asymmetric encoders (e.g. bge-m3) but is ignored by MiniLM — both document
 * and query texts go through the same encoder with mean pooling + L2 normalize.
 */
export async function embedTexts(
  texts: string[],
  _inputType: "document" | "query" = "document"
): Promise<Float32Array[]> {
  if (texts.length === 0) return [];

  const extractor = await getExtractor();

  const batchSize = parseInt(process.env.EMBED_BATCH_SIZE || "32", 10) || 32;
  const out: Float32Array[] = new Array(texts.length);

  for (let start = 0; start < texts.length; start += batchSize) {
    const batch = texts.slice(start, start + batchSize);

    // Mandatory: pooling=mean folds the seq_len dim into a single vector;
    // normalize=true L2-normalizes so cosine reduces to a dot product.
    const tensor = await extractor(batch, { pooling: "mean", normalize: true });

    // Defensive: confirm Tensor shape is [batch, EMBEDDING_DIM]. Fails loudly
    // if the Transformers.js API ever changes output shape conventions.
    if (tensor.dims.length !== 2 || tensor.dims[0] !== batch.length || tensor.dims[1] !== EMBEDDING_DIM) {
      throw new Error(
        `Unexpected tensor shape ${JSON.stringify(tensor.dims)} for batch of ${batch.length}; expected [${batch.length}, ${EMBEDDING_DIM}]`
      );
    }

    const flat = tensor.data as Float32Array;

    if (!normSanityChecked) {
      normSanityChecked = true;
      let sumSquares = 0;
      for (let i = 0; i < EMBEDDING_DIM; i++) sumSquares += flat[i] * flat[i];
      const norm = Math.sqrt(sumSquares);
      const ok = Math.abs(norm - 1) < 1e-3;
      process.stderr.write(
        `  [embed] first vector L2 norm: ${norm.toFixed(4)} ${ok ? "✓" : "✗ (expected 1.0 — pooling or normalize regressed)"}\n`
      );
    }

    for (let i = 0; i < batch.length; i++) {
      // Slice into a per-row Float32Array view. Float32Array(buffer, offset, length)
      // requires 4-byte alignment of `offset`; since flat.buffer is fresh and
      // EMBEDDING_DIM*4 is a multiple of 4, alignment is guaranteed.
      const rowOffset = flat.byteOffset + i * EMBEDDING_DIM * 4;
      out[start + i] = new Float32Array(flat.buffer, rowOffset, EMBEDDING_DIM).slice();
    }
  }

  return out;
}

/**
 * Convert a Float32Array embedding to a Buffer for SQLite BLOB storage.
 * Dimension-agnostic — works for any vector length.
 */
export function embeddingToBuffer(vec: Float32Array): Buffer {
  return Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength);
}

/**
 * Convert a SQLite BLOB back into a Float32Array.
 * Allocates a fresh aligned ArrayBuffer and copies — Buffer.buffer is not
 * guaranteed to be 4-byte aligned for direct Float32Array reinterpretation.
 */
export function bufferToEmbedding(buf: Buffer): Float32Array {
  const ab = new ArrayBuffer(buf.byteLength);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.byteLength; i++) view[i] = buf[i];
  return new Float32Array(ab);
}
