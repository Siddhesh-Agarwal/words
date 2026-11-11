# words

A small collection of daily word puzzles. One puzzle per game per day, identical for every player, with no backend, accounts, ads, or tracking.

## Games

| Game            | Goal                                                                  |
| --------------- | --------------------------------------------------------------------- |
| **Wordle**      | Guess a five-letter word in six tries.                                |
| **Word Ladder** | Change one letter at a time to turn the start word into the end word. |
| **Cryptogram**  | Decode a substitution-cipher quote, proverb, or tech quote.           |

Each game is playable end-to-end, with local stats, share text, help, keyboard support, light/dark themes, and a colorblind-safe palette.

## Stack

- React 19 + TypeScript + Vite
- TanStack Router (file-based routes)
- Tailwind CSS v4 with shadcn-style components
- TanStack Store for stats
- Vitest for unit tests
- Python 3.12+ data pipeline exposed as a Typer CLI (`uv run words-data`)

There is no runtime server and no database. All game data is generated offline and committed under `src/data/`.

## Getting started

```sh
pnpm install
pnpm dev
```

The dev server runs at <http://localhost:3000>.

The committed data is enough to run the site. Python is only needed to regenerate or validate datasets.

## Commands

| Command                | What it does                                                |
| ---------------------- | ----------------------------------------------------------- |
| `pnpm dev`             | Start the Vite dev server.                                  |
| `pnpm build`           | Build the static site into `dist/`.                         |
| `pnpm preview`         | Preview the production build.                               |
| `pnpm test`            | Run the Vitest suite once.                                  |
| `pnpm test:watch`      | Run Vitest in watch mode.                                   |
| `pnpm lint`            | Lint and apply safe Biome fixes.                            |
| `pnpm format`          | Format and apply fixes with Biome.                          |
| `pnpm check`           | Run Biome lint, format, and import organization with fixes. |
| `pnpm generate-routes` | Regenerate `src/routeTree.gen.ts`.                          |

Before considering a change done:

```sh
pnpm run lint && pnpm test && pnpm exec tsc --noEmit && pnpm run build
uv run words-data check
```

## Data pipeline

The Python package lives in `scripts/` and is configured by `pyproject.toml`. It is intentionally separate from `package.json`; all Python commands go through `uv`.

```sh
uv sync
uv run words-data --help
uv run words-data check       # drift, data shapes, quote rules, Python tests
uv run words-data generate    # rewrite committed datasets
```

Other useful commands:

```sh
uv run words-data generate --only wordle
uv run words-data generate --only ladder
uv run words-data generate --only crypto
uv run words-data validate-data
uv run words-data validate-quotes
uv run words-data test
```

Word lists come from **SCOWL 2020.12.07** (MIT-like licence). The pinned tarball is not committed, but the imported source pools, licence, and checksums are. Do not use the NYT Wordle lists.

Generated files:

```text
src/data/
  wordle-answers.json
  wordle-guesses.json
  ladder-dictionary.json
  ladder/manifest.json
  ladder/000.json ... 083.json   # 365 days per lazy-loaded chunk
  cryptogram-quotes.json
```

See [`scripts/README.md`](scripts/README.md) for the full generator, validation, source, and licensing details.

## Daily puzzle design

- Puzzle numbers use the **player's local date**, so the puzzle changes at local midnight.
- `puzzleNo = (local date - game EPOCH) + 1`, so puzzle **#1** lands on the game's launch date.
- Each game has its own epoch in `src/core/date.ts`; changing one does not shift the others.
- Puzzles are seeded from `{game}:{puzzleNo}` with a fixed hash and `mulberry32`, so every player gets the same puzzle.
- List-based content is shuffled once at build time and indexed by puzzle number.
- A dev-only `?puzzle=N` override is available in development builds for testing.
- Never call `new Date()` outside `src/core/date.ts`; inject dates so tests stay deterministic.

Cryptogram difficulty follows the weekday:

| Day             | Quote length | Pre-revealed letters |
| :-------------- | :----------: | :------------------: |
| Monday          |    Short     |          3           |
| Tuesday         |    Short     |          2           |
| Wednesday       |    Medium    |          1           |
| Thursday–Friday |    Medium    |          0           |
| Saturday–Sunday |     Long     |          0           |

In-progress state and stats persist in `localStorage` under:

```text
words:v1:{game}:state
words:v1:{game}:stats
```

Every read and write is guarded. Corrupt or missing data is discarded rather than crashing the game.

## Project layout

```text
src/
  core/          date math, seeded randomness, storage, sharing
  games/
    wordle/
    word-ladder/
    cryptogram/  each game owns its data loader, logic, state, and UI
  components/    shared card shell and UI primitives
  routes/        file-based TanStack Router routes
  data/          committed generated JSON
scripts/         Python generators, validators, and tests
```

Game rules and scoring live in pure functions, separate from React components, so they can be unit-tested directly.

## Sharing

Each game produces spoiler-free text:

```text
Wordle #12 4/6
Ladder #12 · 6 steps (par 5)
Cryptogram #12 · solved · 1 hint
```

The Web Share API is used when available, otherwise the result is copied to the clipboard with a toast.

## Deployment

`pnpm build` produces a fully static SPA in `dist/`. Host it on any static host with an SPA fallback to `index.html`.

Word Ladder chunks are emitted as separate assets and loaded on demand, so the initial page does not download the whole ladder schedule. Do not eagerly import `src/data/ladder/` or Vite will bundle every chunk.
