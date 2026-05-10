# `corpus/` — Source Texts for RAG

This directory holds the raw text the ingestion script reads. The layout is:

```
corpus/
├── camus/
│   ├── stranger.txt          (fair-use excerpts — see Copyright below)
│   └── myth-of-sisyphus.txt
├── nietzsche/
│   ├── zarathustra.txt       (Project Gutenberg, public domain)
│   ├── beyond-good-and-evil.txt
│   └── gay-science.txt
├── kafka/
│   ├── trial.txt             (Muir / Mitchell / Wyllie translations vary in PD status)
│   └── metamorphosis.txt
└── …
```

One subdirectory per philosopher key (must match the key in `frontend/src/App.tsx`'s `ALL_PHILOSOPHERS`). One `.txt` file per work. UTF-8.

## Running the ingestion

From the repo root:

```bash
cd backend
npm run ingest                              # all philosophers
npm run ingest -- --philosopher=nietzsche   # one philosopher only
npm run ingest -- --dry-run                 # chunk + report, don't embed
```

No API key needed — embeddings run locally via Transformers.js (`Xenova/all-MiniLM-L6-v2`, 384-dim). The script chunks at ~400 tokens with ~50 token overlap, embeds each chunk on CPU, and upserts into `corpus_chunks` in the same SQLite DB the app uses (`backend/data/council.db`). On first run the model auto-downloads (~25MB) and caches under `$HF_HOME` (default `./.cache/huggingface`).

The script is **idempotent** — re-running over the same files re-embeds and replaces rows. If you change a file, just re-run.

## Copyright guidance per philosopher

The project is non-commercial and the per-debate retrieval pulls only short top-k passages, but the underlying text needs to be PD or fair-use to be safely committable.

| Philosopher | Status | Sources to use |
|---|---|---|
| **Socrates (via Plato)** | Public domain | Jowett translations on [Project Gutenberg](https://www.gutenberg.org/) — Apology, Meno, Symposium, Phaedo, Republic |
| **Austen** | Public domain | Project Gutenberg — Pride and Prejudice, Emma, Persuasion, Mansfield Park, S&S, Northanger Abbey, plus letters |
| **Twain** | Public domain | Project Gutenberg — Huck Finn, Tom Sawyer, Letters from the Earth, Innocents Abroad, autobiography |
| **Dostoevsky** | PD originals; English varies | Constance Garnett translations are PD; Pevear/Volokhonsky are NOT |
| **Nietzsche** | Public domain | Project Gutenberg — Thomas Common / Helen Zimmern translations |
| **Kafka** | Originals PD (post-2024) | Muir translations may still be in copyright in the US; Standard Ebooks has PD-checked editions |
| **Freud** | Most works PD; Strachey translation NOT | Use Brill / Riviere translations from Project Gutenberg where available |
| **Jung** | Mixed | Early works often PD; *Memories Dreams Reflections* and *The Red Book* are NOT — use only short fair-use quotes |
| **Camus** | In copyright | Use only ~30 short fair-use excerpts (≤100 words each), attributed in the file |
| **Hemingway** | In copyright | Same — short fair-use excerpts |
| **Plath** | In copyright | Same — short fair-use excerpts |
| **Thompson** | In copyright | Same — short fair-use excerpts |
| **Carlin** | Spoken-word in copyright | Use only short fair-use transcript excerpts |

For the in-copyright authors, treat each `.txt` as a curated list of public-quotable passages with attribution comments at the top of the file. **Do not commit raw scraped books.**

## What's NOT here

- The script does not download anything. You provide the text files.
- The script does not enforce copyright; the responsibility is on the corpus curator (you).
- Large-scale `.txt` dumps from Gutenberg are committable for PD authors but consider keeping them in a separate branch or an unmounted `corpus-large/` if size becomes an issue (`.gitignore` can be tightened later).

## Layout for in-copyright philosophers

For Camus / Hemingway / Plath / Thompson / Carlin / late Jung, structure each `.txt` as:

```
[Source: Albert Camus, "The Myth of Sisyphus" (1942), p. 3 — Vintage 1991 edition]
There is but one truly serious philosophical problem, and that is suicide. Judging
whether life is or is not worth living amounts to answering the fundamental
question of philosophy.

[Source: Camus, Nobel acceptance speech, Stockholm, 10 December 1957]
Each generation doubtless feels called upon to reform the world. Mine knows that
it will not reform it, but its task is perhaps even greater. It consists in
preventing the world from destroying itself.

…
```

The ingestion script chunks at ~400 tokens and will split passages but keeps the bracketed source line attached to the surrounding paragraph, which gives the retrieval block useful provenance even though the model doesn't quote it back to the user.
