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
`);

export interface KVRow {
  key: string;
  value: string;
  updated_at: number;
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

// db instance is not exported by default to avoid type export issues.
// Import { storage } from "./db" for all data access.
