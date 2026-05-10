/**
 * Project Gutenberg corpus fetcher.
 *
 * Pulls public-domain works for each philosopher from Project Gutenberg,
 * strips the standard PG license boilerplate, and writes plain UTF-8 .txt
 * files to corpus/<philosopher>/<slug>.txt — exactly the layout that
 * `npm run ingest` then reads.
 *
 * Idempotent: existing files are skipped unless --force is passed.
 *
 * Run from backend/:
 *   npm run fetch-corpus                          # all PD philosophers
 *   npm run fetch-corpus -- --philosopher=austen  # one philosopher
 *   npm run fetch-corpus -- --force               # re-download everything
 *   npm run fetch-corpus -- --list                # print manifest, fetch nothing
 *
 * Copyright note — only authors whose translations or original works are in
 * verified public domain (Gutenberg) are listed below. Six of the council
 * are still in copyright in life+70 jurisdictions and need hand-curated
 * fair-use excerpts instead. They are listed in STILL_IN_COPYRIGHT for
 * documentation purposes only; the script never tries to fetch them.
 *
 *   STILL IN COPYRIGHT (US/EU, as of 2026):
 *     Camus     — d. 1960 → PD ~2031
 *     Hemingway — d. 1961 → PD ~2032
 *     Jung      — d. 1961 → PD ~2032 (some early works PD)
 *     Plath     — d. 1963 → PD ~2034
 *     Thompson  — d. 2005 → PD ~2076
 *     Carlin    — d. 2008 → PD ~2079
 *
 * For those six, write your own short fair-use excerpts into
 *   corpus/<philosopher>/_fair-use.txt
 * and run `npm run ingest` — the ingestion pipeline treats them identically.
 */

import * as fs from "fs";
import * as path from "path";

const CORPUS_ROOT = path.join(__dirname, "..", "..", "corpus");
const FETCH_DELAY_MS = 1500; // be polite to Gutenberg
const FETCH_TIMEOUT_MS = 30_000;

interface Work {
  title: string;
  slug: string; // becomes filename without .txt
  gutenbergId: number;
  translator?: string; // attribution for translated works
  note?: string; // any caveats
}

/**
 * Curated manifest. IDs are Project Gutenberg ebook numbers; the script
 * tries multiple URL templates per ID since Gutenberg's plain-text URL
 * scheme has varied over the years.
 *
 * Selection criteria: works directly relevant to each philosopher's voice
 * as encoded in the project's character prompts (see ALL_PHILOSOPHERS in
 * frontend/src/App.tsx). Translations chosen because the translator is
 * verified PD on Gutenberg. Updates welcome.
 */
const MANIFEST: Record<string, Work[]> = {
  austen: [
    { title: "Pride and Prejudice", slug: "pride-and-prejudice", gutenbergId: 1342 },
    { title: "Emma", slug: "emma", gutenbergId: 158 },
    { title: "Persuasion", slug: "persuasion", gutenbergId: 105 },
    { title: "Sense and Sensibility", slug: "sense-and-sensibility", gutenbergId: 161 },
    { title: "Mansfield Park", slug: "mansfield-park", gutenbergId: 141 },
    { title: "Northanger Abbey", slug: "northanger-abbey", gutenbergId: 121 },
    { title: "Lady Susan", slug: "lady-susan", gutenbergId: 946 },
  ],

  twain: [
    { title: "Adventures of Huckleberry Finn", slug: "huckleberry-finn", gutenbergId: 76 },
    { title: "The Adventures of Tom Sawyer", slug: "tom-sawyer", gutenbergId: 74 },
    { title: "Life on the Mississippi", slug: "life-on-the-mississippi", gutenbergId: 245 },
    { title: "The Innocents Abroad", slug: "innocents-abroad", gutenbergId: 3176 },
    { title: "What Is Man? and Other Essays", slug: "what-is-man", gutenbergId: 70 },
    { title: "A Connecticut Yankee in King Arthur's Court", slug: "connecticut-yankee", gutenbergId: 86 },
    { title: "The Mysterious Stranger", slug: "mysterious-stranger", gutenbergId: 3186 },
  ],

  nietzsche: [
    { title: "Thus Spake Zarathustra", slug: "zarathustra", gutenbergId: 1998, translator: "Thomas Common" },
    { title: "Beyond Good and Evil", slug: "beyond-good-and-evil", gutenbergId: 4363, translator: "Helen Zimmern" },
    { title: "The Antichrist", slug: "antichrist", gutenbergId: 19322, translator: "H. L. Mencken" },
    { title: "Ecce Homo", slug: "ecce-homo", gutenbergId: 52190, translator: "Anthony M. Ludovici" },
    { title: "Human, All Too Human", slug: "human-all-too-human", gutenbergId: 38145, translator: "Helen Zimmern" },
    { title: "The Birth of Tragedy", slug: "birth-of-tragedy", gutenbergId: 51356, translator: "William Haussmann" },
    { title: "The Genealogy of Morals", slug: "genealogy-of-morals", gutenbergId: 52319, translator: "Horace B. Samuel" },
    { title: "The Twilight of the Idols", slug: "twilight-of-the-idols", gutenbergId: 52263, translator: "Anthony M. Ludovici" },
  ],

  dostoevsky: [
    { title: "Crime and Punishment", slug: "crime-and-punishment", gutenbergId: 2554, translator: "Constance Garnett" },
    { title: "The Brothers Karamazov", slug: "brothers-karamazov", gutenbergId: 28054, translator: "Constance Garnett" },
    { title: "Notes from the Underground", slug: "notes-from-underground", gutenbergId: 600, translator: "C. J. Hogarth" },
    { title: "The Idiot", slug: "the-idiot", gutenbergId: 2638, translator: "Eva Martin" },
    { title: "The Possessed (Demons)", slug: "demons", gutenbergId: 8117, translator: "Constance Garnett" },
    { title: "The Gambler", slug: "the-gambler", gutenbergId: 2197, translator: "C. J. Hogarth" },
    { title: "White Nights and Other Stories", slug: "white-nights", gutenbergId: 36034, translator: "Constance Garnett" },
  ],

  kafka: [
    {
      title: "The Metamorphosis",
      slug: "metamorphosis",
      gutenbergId: 5200,
      translator: "David Wyllie",
      note: "German original is PD globally; Wyllie translation is PD on Gutenberg.",
    },
    {
      title: "The Trial",
      slug: "the-trial",
      gutenbergId: 7849,
      translator: "David Wyllie",
      note: "Same — German original PD; Wyllie translation on Gutenberg.",
    },
  ],

  freud: [
    {
      title: "Dream Psychology: Psychoanalysis for Beginners",
      slug: "dream-psychology",
      gutenbergId: 15489,
      translator: "M. D. Eder",
    },
    {
      title: "Totem and Taboo",
      slug: "totem-and-taboo",
      gutenbergId: 41214,
      translator: "A. A. Brill",
    },
    {
      title: "Wit and Its Relation to the Unconscious",
      slug: "wit-and-the-unconscious",
      gutenbergId: 14674,
      translator: "A. A. Brill",
    },
    {
      title: "A General Introduction to Psychoanalysis",
      slug: "general-introduction",
      gutenbergId: 38219,
      translator: "G. Stanley Hall",
    },
    {
      title: "Three Contributions to the Theory of Sex",
      slug: "three-contributions",
      gutenbergId: 14969,
      translator: "A. A. Brill",
    },
  ],

  socrates: [
    // All Plato dialogues, Jowett translation — PD.
    { title: "Apology", slug: "apology", gutenbergId: 1656, translator: "Benjamin Jowett" },
    { title: "Crito", slug: "crito", gutenbergId: 1657, translator: "Benjamin Jowett" },
    { title: "Phaedo", slug: "phaedo", gutenbergId: 1658, translator: "Benjamin Jowett" },
    { title: "Meno", slug: "meno", gutenbergId: 1643, translator: "Benjamin Jowett" },
    { title: "Symposium", slug: "symposium", gutenbergId: 1600, translator: "Benjamin Jowett" },
    { title: "The Republic", slug: "republic", gutenbergId: 1497, translator: "Benjamin Jowett" },
    { title: "Gorgias", slug: "gorgias", gutenbergId: 1672, translator: "Benjamin Jowett" },
    { title: "Protagoras", slug: "protagoras", gutenbergId: 1591, translator: "Benjamin Jowett" },
    { title: "Phaedrus", slug: "phaedrus", gutenbergId: 1636, translator: "Benjamin Jowett" },
  ],
};

const STILL_IN_COPYRIGHT: Record<string, string> = {
  camus: "d. 1960 — PD circa 2031 (life+70). Curate fair-use excerpts manually.",
  hemingway: "d. 1961 — PD circa 2032. Curate fair-use excerpts manually.",
  jung: "d. 1961 — most works PD ~2032 (some pre-1929 PD now). Curate manually.",
  plath: "d. 1963 — PD circa 2034. Curate fair-use excerpts manually.",
  thompson: "d. 2005 — PD circa 2076. Curate fair-use excerpts manually.",
  carlin: "d. 2008 — PD circa 2079. Curate fair-use transcript excerpts manually.",
};

interface CLIArgs {
  force: boolean;
  list: boolean;
  philosopher?: string;
}

function parseArgs(): CLIArgs {
  const args: CLIArgs = { force: false, list: false };
  for (const a of process.argv.slice(2)) {
    if (a === "--force") args.force = true;
    else if (a === "--list") args.list = true;
    else if (a.startsWith("--philosopher=")) args.philosopher = a.split("=")[1];
  }
  return args;
}

/**
 * Try several URL templates for a Gutenberg ID. Returns the raw text on the
 * first successful 200, throws on full failure across all templates.
 */
async function fetchGutenberg(id: number): Promise<string> {
  const urls = [
    `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
    `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
    `https://www.gutenberg.org/files/${id}/${id}.txt`,
    `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`,
  ];

  let lastErr: string | undefined;
  for (const url of urls) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, {
        headers: {
          "User-Agent": "PhilosophicalCouncil-CorpusFetcher/1.0 (educational, non-commercial)",
          Accept: "text/plain, text/*",
        },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const text = await res.text();
        if (text.length > 0) return text;
        lastErr = `${url} → 200 but empty body`;
        continue;
      }
      lastErr = `${url} → ${res.status} ${res.statusText}`;
    } catch (err) {
      lastErr = `${url} → ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  throw new Error(`All Gutenberg URLs failed for #${id}. Last: ${lastErr}`);
}

/**
 * Strip the standard Project Gutenberg header and footer, leaving only
 * the body text. Tolerates the variations Gutenberg has used historically.
 */
function stripGutenbergBoilerplate(text: string): string {
  // Strip BOM
  text = text.replace(/^﻿/, "");
  // Normalize CRLF
  text = text.replace(/\r\n/g, "\n");

  // The start marker varies: "*** START OF THE PROJECT GUTENBERG EBOOK XYZ ***"
  // also "*** START OF THIS PROJECT GUTENBERG EBOOK …"
  const startRx =
    /^\*+\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*+[^\n]*\n/m;
  const startMatch = text.match(startRx);
  if (startMatch && typeof startMatch.index === "number") {
    text = text.slice(startMatch.index + startMatch[0].length);
  }

  const endRx = /^\*+\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/m;
  const endMatch = text.match(endRx);
  if (endMatch && typeof endMatch.index === "number") {
    text = text.slice(0, endMatch.index);
  }

  return text.trim();
}

function listManifest(): void {
  let totalWorks = 0;
  console.log("\n  Public-domain manifest (Project Gutenberg)\n");
  for (const [ph, works] of Object.entries(MANIFEST)) {
    console.log(`  ${ph}  (${works.length} works)`);
    for (const w of works) {
      const trans = w.translator ? ` — tr. ${w.translator}` : "";
      console.log(`    #${w.gutenbergId.toString().padStart(5)}  ${w.title}${trans}`);
    }
    totalWorks += works.length;
    console.log("");
  }
  console.log(`  Total: ${totalWorks} works across ${Object.keys(MANIFEST).length} philosophers.\n`);
  console.log("  Skipped (still in copyright as of 2026):");
  for (const [ph, reason] of Object.entries(STILL_IN_COPYRIGHT)) {
    console.log(`    ${ph}  ${reason}`);
  }
  console.log("");
}

async function fetchAndWrite(philosopher: string, work: Work, force: boolean): Promise<void> {
  const dir = path.join(CORPUS_ROOT, philosopher);
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, work.slug + ".txt");

  if (fs.existsSync(out) && !force) {
    console.log(`[fetch] ${philosopher}/${work.slug} — exists, skip (use --force to overwrite)`);
    return;
  }

  process.stdout.write(`[fetch] ${philosopher}/${work.slug} ← Gutenberg #${work.gutenbergId} … `);
  let raw: string;
  try {
    raw = await fetchGutenberg(work.gutenbergId);
  } catch (err) {
    console.log("FAIL");
    console.error(`         ${err instanceof Error ? err.message : err}`);
    return;
  }

  const cleaned = stripGutenbergBoilerplate(raw);
  if (cleaned.length < 1000) {
    console.log(`SUSPICIOUS (only ${cleaned.length} chars after stripping — Gutenberg layout may have changed)`);
  } else {
    console.log(`${cleaned.length.toLocaleString()} chars`);
  }

  const headerLines = [
    `[Source: ${work.title}]`,
    `[Project Gutenberg #${work.gutenbergId} — public domain]`,
  ];
  if (work.translator) headerLines.push(`[Translator: ${work.translator}]`);
  if (work.note) headerLines.push(`[Note: ${work.note}]`);
  const header = headerLines.join("\n") + "\n\n";

  fs.writeFileSync(out, header + cleaned, "utf8");
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const args = parseArgs();

  if (args.list) {
    listManifest();
    return;
  }

  fs.mkdirSync(CORPUS_ROOT, { recursive: true });

  const targets = Object.entries(MANIFEST).filter(
    ([ph]) => !args.philosopher || ph === args.philosopher
  );

  if (targets.length === 0) {
    if (args.philosopher && STILL_IN_COPYRIGHT[args.philosopher]) {
      console.error(
        `[fetch] ${args.philosopher} is still in copyright: ${STILL_IN_COPYRIGHT[args.philosopher]}`
      );
      console.error(`        Curate fair-use excerpts into corpus/${args.philosopher}/_fair-use.txt manually.`);
    } else {
      console.error(`[fetch] no manifest entry for philosopher "${args.philosopher}".`);
    }
    process.exit(1);
  }

  const totalWorks = targets.reduce((s, [, ws]) => s + ws.length, 0);
  console.log(
    `[fetch] Fetching ${totalWorks} works across ${targets.length} philosophers from Project Gutenberg.`
  );
  console.log(`[fetch] Polite delay between requests: ${FETCH_DELAY_MS}ms.`);
  if (!args.philosopher) {
    console.log(
      `[fetch] Skipping in-copyright philosophers: ${Object.keys(STILL_IN_COPYRIGHT).join(", ")}.`
    );
    console.log(`[fetch] (See corpus/README.md for the fair-use excerpt workflow for those.)`);
  }
  console.log("");

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const [philosopher, works] of targets) {
    for (const work of works) {
      const out = path.join(CORPUS_ROOT, philosopher, work.slug + ".txt");
      const wasExisting = fs.existsSync(out);
      try {
        await fetchAndWrite(philosopher, work, args.force);
        if (wasExisting && !args.force) skipped++;
        else if (fs.existsSync(out)) success++;
        else failed++;
      } catch {
        failed++;
      }
      await sleep(FETCH_DELAY_MS);
    }
  }

  console.log("");
  console.log(`[fetch] done. ${success} fetched, ${skipped} skipped (already exist), ${failed} failed.`);
  if (success > 0) {
    console.log("[fetch] Next step: cd backend && npm run ingest");
  }
}

main().catch((err) => {
  console.error("[fetch] aborted:", err);
  process.exit(1);
});
