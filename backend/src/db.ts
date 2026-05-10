import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Resolve database path: prefer DATA_DIR env var, otherwise use local ./data
const dataDir = process.env.DATA_DIR || path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, "council.db");

const db = new Database(dbPath);

// Enable WAL mode for better concurrency and crash safety
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Bootstrap schema — simple key/value store mirrors the window.storage API
db.exec(`
  CREATE TABLE IF NOT EXISTS kv_store (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch('now'))
  );

  CREATE TABLE IF NOT EXISTS corpus_chunks (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    philosopher   TEXT    NOT NULL,
    work          TEXT    NOT NULL,
    chunk_idx     INTEGER NOT NULL,
    text          TEXT    NOT NULL,
    token_count   INTEGER NOT NULL,
    embedding     BLOB    NOT NULL,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch('now')),
    UNIQUE(philosopher, work, chunk_idx)
  );

  CREATE INDEX IF NOT EXISTS idx_corpus_philosopher ON corpus_chunks(philosopher);
`);

export interface KVRow {
  key: string;
  value: string;
  updated_at: number;
}

export interface CorpusRow {
  id: number;
  philosopher: string;
  work: string;
  chunk_idx: number;
  text: string;
  token_count: number;
  embedding: Buffer;
  created_at: number;
}

const stmtGet = db.prepare<[string], KVRow>("SELECT * FROM kv_store WHERE key = ?");
const stmtSet = db.prepare<[string, string]>(
  "INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, unixepoch('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch('now')"
);
const stmtDelete = db.prepare<[string]>("DELETE FROM kv_store WHERE key = ?");
const stmtList = db.prepare<[string], KVRow>("SELECT * FROM kv_store WHERE key LIKE ? ORDER BY updated_at DESC");

export const storage = {
  get(key: string): KVRow | undefined {
    return stmtGet.get(key);
  },

  set(key: string, value: string): void {
    stmtSet.run(key, value);
  },

  delete(key: string): void {
    stmtDelete.run(key);
  },

  /**
   * List rows whose key starts with the given prefix.
   * Converts the prefix into a LIKE pattern (e.g. "debate:" → "debate:%").
   */
  list(prefix: string): KVRow[] {
    // Escape LIKE special characters in the prefix itself
    const escaped = prefix.replace(/[%_\\]/g, (c) => `\\${c}`);
    return stmtList.all(`${escaped}%`);
  },
};

// ── Corpus chunk store (for RAG over each philosopher's writings) ─────────────
const stmtCorpusUpsert = db.prepare<[string, string, number, string, number, Buffer]>(
  "INSERT INTO corpus_chunks (philosopher, work, chunk_idx, text, token_count, embedding) VALUES (?, ?, ?, ?, ?, ?) " +
  "ON CONFLICT(philosopher, work, chunk_idx) DO UPDATE SET text = excluded.text, token_count = excluded.token_count, embedding = excluded.embedding, created_at = unixepoch('now')"
);
const stmtCorpusListByPhilosopher = db.prepare<[string], CorpusRow>(
  "SELECT * FROM corpus_chunks WHERE philosopher = ?"
);
const stmtCorpusCountByPhilosopher = db.prepare<[string], { n: number }>(
  "SELECT COUNT(*) AS n FROM corpus_chunks WHERE philosopher = ?"
);
const stmtCorpusListIdxByWork = db.prepare<[string, string], { chunk_idx: number }>(
  "SELECT chunk_idx FROM corpus_chunks WHERE philosopher = ? AND work = ?"
);

export const corpus = {
  upsert(philosopher: string, work: string, chunkIdx: number, text: string, tokenCount: number, embedding: Buffer): void {
    stmtCorpusUpsert.run(philosopher, work, chunkIdx, text, tokenCount, embedding);
  },

  listByPhilosopher(philosopher: string): CorpusRow[] {
    return stmtCorpusListByPhilosopher.all(philosopher);
  },

  countByPhilosopher(philosopher: string): number {
    const row = stmtCorpusCountByPhilosopher.get(philosopher);
    return row ? row.n : 0;
  },

  /** Set of chunk_idx values already embedded for a (philosopher, work). */
  existingIdxSet(philosopher: string, work: string): Set<number> {
    const rows = stmtCorpusListIdxByWork.all(philosopher, work);
    return new Set(rows.map((r) => r.chunk_idx));
  },
};

// db instance is not exported by default to avoid type export issues.
// Import { storage, corpus } from "./db" for all data access.
