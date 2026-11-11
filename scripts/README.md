# Data generation

All game data is generated offline and committed under `src/data/`. There are no API or backend calls; the current ladder chunk is loaded as a static asset on demand.

## Source

SCOWL (SCOWLv1) 2020.12.07, MIT-like licence.

- Download: <https://downloads.sourceforge.net/project/wordlist/SCOWL/2020.12.07/scowl-2020.12.07.tar.gz>
- SHA-256: `5587667caa20c4891390c2d42dbb4d5c4c3f41bee77af1457ece3ba23fb859cc`
- The tarball is not committed. The tiered TSVs and `Copyright` are.

Import or refresh the source pools:

```sh
python3 scripts/import_scowl.py --tarball /path/to/scowl-2020.12.07.tar.gz
python3 scripts/import_scowl.py --tarball /path/to/scowl-2020.12.07.tar.gz --check
```

The importer reads `final/english-words.{10,20,35,40,50,55,60,70,80}`, keeps lowercase `a-z` words of length 3-5, records each word's minimum SCOWL size, and removes SCOWL's `misc/offensive.*` and `misc/profane.*` words. It writes:

```text
scripts/data/source/scowl/
  words-3.tsv       # word<TAB>minimum SCOWL size
  words-4.tsv
  words-5.tsv
  taboo.txt
  Copyright
  SOURCE.md
```

## Regenerate and validate

Install the build-time JSON reader (optional; the scripts fall back to the stdlib parser):

```sh
python3 -m pip install -r scripts/requirements.txt
```

```sh
python3 scripts/generate.py             # write all data
python3 scripts/generate.py --check     # fail if committed data has drifted
python3 scripts/validate_data.py        # shapes, counts, BFS par, quote rules
python3 scripts/validate_quotes.py      # quote source and output
python3 -m unittest discover -s scripts/tests -v
```

Or with pnpm:

```sh
pnpm generate:data
pnpm check:data
pnpm validate:data
pnpm validate:quotes
pnpm test:data
```

`generate.py --only wordle|ladder|crypto` regenerates one dataset. `--check` compares bytes and reports stale ladder chunks.

## Output

```text
src/data/
  wordle-answers.json           # 3,416 words, shuffled
  wordle-guesses.json           # 10,938 words, sorted; superset of answers
  ladder-dictionary.json        # 2,139 words, sorted, one connected component
  ladder/manifest.json
  ladder/000.json ... 083.json  # 303,316 pairs, 3,650 per chunk
  cryptogram-quotes.json        # 60 quotes, shuffled
```

### Word Ladder

- Dictionary: four-letter SCOWL words at size <= 50, largest connected component.
- Endpoints: four-letter words at size <= 20 (880 words).
- Pairs: every unordered endpoint pair whose shortest path is 4-7 single-letter changes. `par` is the number of changes (edges), not the number of words.
- Selection: `chunk = puzzleNo // 3650`, `index = puzzleNo % 3650`. No pair repeats until all 303,316 are used.
- The dictionary is exactly the graph used to compute `par`.

### Wordle

- Answers: size <= 35, shuffled with seed `words:v1:wordle:answers`.
- Guesses: size <= 80, sorted.
- Answers are a subset of guesses by construction.

## Determinism

- Seed label format: `words:v1:{game}:{dataset}`.
- Seed: first 32 bits of SHA-256, fed to mulberry32 and Fisher-Yates.
- Regeneration is byte-identical.
- Changing the source version, filters, or a seed reorders every future puzzle. Treat it as a breaking change and note it in the commit.

## Cryptogram quotes

The authored source is `scripts/data/quotes-source.json`:

```json
{
  "id": "q0001",
  "text": "The unexamined life is not worth living.",
  "attribution": "Socrates",
  "category": "quote",
  "source": "Plato, Apology 38a"
}
```

- `id` is stable and matches `qNNNN`.
- `text` must be 40-120 characters, contain at least 15 distinct letters, and use only ASCII letters plus `. , ; : ' " ! ? ( ) -`. Digits are rejected.
- Curly quotes, em dashes, en dashes, ellipses, and non-breaking spaces are normalized before validation.
- `category` is `quote`, `proverb`, or `tech`.
- `quote` and `tech` require an attribution. Proverbs may use `null`.
- `source` is required in the source file and stripped from the output. Tech entries need a primary source; if you cannot verify one, omit the quote.
- Length tiers: short `< 60`, medium `60-87`, long `>= 88`.
- Duplicate IDs and duplicate normalized texts fail validation.

To add a quote, append an entry with the next unused `qNNNN` ID, then run `generate.py --only crypto` and `validate_quotes.py`. Do not renumber existing IDs; they are stable puzzle identifiers.

**Adding a quote reshuffles the entire quote pool** because the shuffle is seeded from the list contents and order. That changes every future cryptogram puzzle date. If quotes will be added after launch, freeze or version the schedule first; do not treat it as an append-only data edit.

## Deployment

The data is static. On Cloudflare Pages, the 84 ladder chunks are ordinary assets; the client should load only the chunk for the current decade. No Functions, Workers, or database are needed.

The chunks live under `src/data`, not `public/`. Use a Vite dynamic import or `import.meta.glob` for the current chunk; a bare `fetch("/data/ladder/000.json")` will not find them. Do not eagerly import the whole ladder directory, or Vite will bundle all 12 MB.
