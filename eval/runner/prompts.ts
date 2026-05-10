/**
 * Extract per-philosopher character prompts from frontend/src/App.tsx.
 *
 * The prompts are the source of truth for character voice; the eval suite
 * needs them to assemble the system prompt the same way the frontend's
 * startDebate() does. Rather than duplicate them, we read the frontend file
 * directly at runtime and parse out the ALL_PHILOSOPHERS entries.
 *
 * If frontend/src/App.tsx is moved or the ALL_PHILOSOPHERS shape changes,
 * this extractor breaks loudly with a clear error.
 */

import * as fs from "fs";
import * as path from "path";

export interface Philosopher {
  key: string;
  name: string;
  era: string;
  prompt: string;
}

const APP_TSX_PATH = path.join(__dirname, "..", "..", "frontend", "src", "App.tsx");

const EXPECTED_KEYS = [
  "camus",
  "kafka",
  "dostoevsky",
  "hemingway",
  "thompson",
  "socrates",
  "nietzsche",
  "jung",
  "carlin",
  "twain",
  "austen",
  "plath",
  "freud",
];

let cached: Record<string, Philosopher> | null = null;

export function loadPhilosophers(): Record<string, Philosopher> {
  if (cached) return cached;

  if (!fs.existsSync(APP_TSX_PATH)) {
    throw new Error(`Cannot find frontend App.tsx at ${APP_TSX_PATH}`);
  }
  const src = fs.readFileSync(APP_TSX_PATH, "utf8");

  // Find the ALL_PHILOSOPHERS block.
  const blockStart = src.indexOf("const ALL_PHILOSOPHERS = {");
  if (blockStart < 0) {
    throw new Error("Could not locate `const ALL_PHILOSOPHERS = {` in App.tsx");
  }
  // Find the matching closing brace at top level.
  // Simpler: take everything from blockStart to the line "};" that follows.
  const blockEnd = src.indexOf("\n};", blockStart);
  if (blockEnd < 0) {
    throw new Error("Could not locate end of ALL_PHILOSOPHERS block");
  }
  const block = src.slice(blockStart, blockEnd);

  // Per-entry regex: matches `key: { name:"…", era:"…", … prompt:`…` … }`.
  // The prompt is a backtick-delimited template literal; we capture greedily
  // up to the next backtick. The prompts in App.tsx don't contain backticks
  // or ${} interpolations, so a non-greedy match against the next backtick
  // is correct.
  const entryRx =
    /(\w+):\s*\{\s*name\s*:\s*"([^"]+)"\s*,\s*era\s*:\s*"([^"]+)"[\s\S]*?prompt\s*:\s*`([\s\S]*?)`\s*\}/g;

  const out: Record<string, Philosopher> = {};
  let m: RegExpExecArray | null;
  while ((m = entryRx.exec(block)) !== null) {
    const [, key, name, era, prompt] = m;
    out[key] = { key, name, era, prompt };
  }

  // Verify all expected keys are present so a parse drift fails loudly.
  const missing = EXPECTED_KEYS.filter((k) => !out[k]);
  if (missing.length > 0) {
    throw new Error(
      `prompts.ts extractor missed philosopher keys: ${missing.join(", ")}. ` +
        `frontend/src/App.tsx ALL_PHILOSOPHERS shape may have changed; update the regex.`
    );
  }

  cached = out;
  return out;
}

export function getPhilosopher(key: string): Philosopher {
  const all = loadPhilosophers();
  const p = all[key];
  if (!p) throw new Error(`Unknown philosopher key: ${key}`);
  return p;
}

export function listPhilosopherKeys(): string[] {
  return Object.keys(loadPhilosophers());
}
