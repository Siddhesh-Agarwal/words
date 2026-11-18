# Contributing

Development guide for `words`. The live site is at <https://words.siddhesh.cc/>.

## Prerequisites

- Node.js 22.12+ and pnpm
- Python 3.12+ and uv for data generation and validation

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
uv run --project scripts words-data check
```

## Site metadata and static assets

The head in `index.html` defines the title, description, canonical URL, robots directives, Open Graph and Twitter cards, JSON-LD website data, and theme color. Social previews use `public/og.png`.

`public/` contains the static assets copied verbatim into `dist/`:

- Favicons and touch icons: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, and the Android Chrome icons.
- `site.webmanifest` for installable browser metadata.
- `robots.txt`, which points crawlers to `sitemap.xml`.
- `sitemap.xml` for search engines and `sitemap.html` for people. The HTML version is linked from the site footer and is a standalone page rather than an XSLT-styled XML file, since browser XSLT support is being removed. The production site serves it at `/sitemap`.
- `about.txt` with the CC-BY attribution for the Twemoji-derived icon.

When adding or renaming a route, update both `sitemap.xml` and `sitemap.html`.

## Data pipeline

The Python project lives entirely in `scripts/`: `pyproject.toml`, `uv.lock`, and the `words_data` package. Nothing Python-related sits at the repository root, so Cloudflare never tries to install Python during deployment. Run the commands below from the repo root (or `cd scripts` and drop `--project scripts`); it is intentionally separate from `package.json`.

```sh
uv sync --project scripts
uv run --project scripts words-data --help
uv run --project scripts words-data check       # drift, data shapes, quote rules, Python tests
uv run --project scripts words-data generate    # rewrite committed datasets
```

Other useful commands:

```sh
uv run --project scripts words-data generate --only wordle
uv run --project scripts words-data generate --only ladder
uv run --project scripts words-data generate --only crypto
uv run --project scripts words-data validate-data
uv run --project scripts words-data validate-quotes
uv run --project scripts words-data test
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

- Puzzle numbers use the **UTC date**, so the puzzle changes at **00:00 UTC** for every player.
- `puzzleNo = (UTC date - game EPOCH)`, so puzzle **#0** lands on the game's launch date.
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
public/          favicons, manifest, OG image, sitemap.xml, sitemap.html, robots.txt
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

## Deployment

The production site is live at <https://words.siddhesh.cc/>.

`pnpm build` produces a fully static SPA in `dist/`. Deploy it to any static host with an SPA fallback to `index.html`. Everything in `public/` is copied into `dist/` unchanged.

Public endpoints:

- Site: <https://words.siddhesh.cc/>
- XML sitemap: <https://words.siddhesh.cc/sitemap.xml>
- Human-readable sitemap: <https://words.siddhesh.cc/sitemap>
- Robots: <https://words.siddhesh.cc/robots.txt>

Word Ladder chunks are emitted as separate assets and loaded on demand, so the initial page does not download the whole ladder schedule. Do not eagerly import `src/data/ladder/` or Vite will bundle every chunk.

## Related docs

- [`scripts/README.md`](scripts/README.md) — generators, validation, source data, and licensing.
- [`AGENTS.md`](AGENTS.md) — repository conventions for coding agents.
