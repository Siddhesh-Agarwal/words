# Data Generators Design

**Status:** Approved 2026-11-11

## Intent

Produce committed, deterministic JSON for Wordle, Word Ladder, and Cryptogram from one permissively licensed source, with no runtime backend and no network at generation time.

## Source

SCOWL (SCOWLv1) 2020.12.07, MIT-like licence.

- Tarball: `https://downloads.sourceforge.net/project/wordlist/SCOWL/2020.12.07/scowl-2020.12.07.tar.gz`
- SHA-256: `5587667caa20c4891390c2d42dbb4d5c4c3f41bee77af1457ece3ba23fb859cc`
- One-time `uv run words-data import-scowl --tarball <path>` reads `final/english-words.{10,20,35,40,50,55,60,70,80}`, keeps lowercase `a-z` words of length 3-5, records each word's minimum SCOWL size, and drops SCOWL's `misc/offensive.*` and `profane.*` words.
- Output: `scripts/data/source/scowl/words-{3,4,5}.tsv` (`word<TAB>min-size`), `taboo.txt`, `Copyright`, `SOURCE.md`. The tarball itself is not committed.
- Verified counts: 3-letter 1,123; 4-letter 4,847; 5-letter 10,938.

## Outputs

### Wordle

- `src/data/wordle-answers.json` - 3,416 five-letter words from size <= 35, shuffled with seed `words:v1:wordle:answers`.
- `src/data/wordle-guesses.json` - 10,938 five-letter words from size <= 80, sorted. Answers are a subset by construction.

### Word Ladder

- `src/data/ladder-dictionary.json` - 2,139 four-letter words from size <= 50, largest connected component, sorted.
- `src/data/ladder/manifest.json` - version, dictionary path, chunk size, chunk count, total pairs, par range.
- `src/data/ladder/000.json` ... `083.json` - all 303,316 valid pairs, shuffled once with seed `words:v1:ladder:pairs`, split into 3,650-pair chunks (last chunk 366).
- Endpoints come from four-letter words of size <= 20 (880 words). Pairs are unordered and unique. `par` is the number of single-letter changes (edges), 4-7.
- Selection: `chunk = puzzleNo // 3650`, `index = puzzleNo % 3650`. No pair repeats until all 303,316 are used (~830 years).
- Bitmap: `chunks/{i:03d}.json` with `{"start": "...", "end": "...", "par": n}` objects, compact JSON.
- The dictionary is exactly the graph used to compute par.

### Cryptogram

- `src/data/cryptogram-quotes.json` - `{id, text, attribution, category}` objects, shuffled with seed `words:v1:cryptogram:quotes`.
- Target 60 quotes: 20 `quote`, 20 `proverb`, 20 `tech`.
- Length tiers for weekday difficulty: short `< 60`, medium `60-87`, long `>= 88`.
- Authored source: `scripts/data/quotes-source.json` with an additional `source` provenance field.
- Generator normalizes curly quotes, em dashes, ellipses, and whitespace; strips `source`; validates.
- `uv run words-data validate-quotes` enforces 40-120 chars, >= 15 distinct letters, ASCII letters plus basic punctuation, no digits, unique IDs/text, valid categories, and non-null attribution for `quote`/`tech`.
- Tech quotes are verified against primary sources; unverifiable quotes are omitted.

## Determinism

- Seed = first 32 bits of SHA-256 of `words:v1:{game}:{dataset}`.
- PRNG: mulberry32, shared with the JS convention. Shuffle: Fisher-Yates.
- Re-running produces byte-identical files.
- `uv run words-data generate --check` regenerates in memory and fails on drift.
- Changing the source version, filters, or a seed reorders every future puzzle; treat as a breaking change.

## Deployment

- Static assets on Cloudflare Pages. No backend, no SSR.
- Pages free limits: 20,000 files, 25 MiB/file, 500 builds/month; static requests free and unlimited.
- About 89 data files total; largest chunk ~138 KB. Well inside the limits.
- Client dynamically loads only the current decade's ladder chunk.

## Validation

- `uv run words-data validate-data` checks shapes, counts, uniqueness, `a-z`, answer subset, ladder connectivity and BFS par, and quote rules.
- Stdlib `unittest` tests cover the importer, PRNG determinism, graph/BFS, quote normalization, and committed data.
- Python 3; `ujson` is an optional build-time JSON reader with a stdlib fallback. No new app runtime dependencies.

## Non-goals

- UI, game logic, puzzle state, storage, sharing.
- Runtime cipher generation.
- Backend, SSR, accounts, leaderboards.
- Vitest setup (deferred until the UI test runner lands).
