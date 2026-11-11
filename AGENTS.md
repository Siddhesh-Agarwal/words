# AGENTS.md

Guidance for AI coding agents working in this repository. Read fully before making changes.

## Project overview

`words` is a collection of daily word puzzles, hosted as a static site on a `words` subdomain of the owner's personal domain (siblings: atlasace, flaguess). Each game offers **one puzzle per day**, identical for every player, Wordle-style.

Games in scope:

1. **Wordle**: guess a 5-letter word in 6 tries.
2. **Word Ladder**: change one letter at a time to turn the start word into the end word.
3. **Cryptogram**: decode a substitution-cipher quote, proverb, or tech quote.

Non-goals: no backend, accounts, leaderboards, ads, or analytics that require consent banners. Do not add them unless asked.

## Hard constraints (decided by the owner)

- **Static site, no backend.** Everything runs in the browser.
- **Daily puzzle is client-side, seeded by the date.** Same date -> same puzzle for every player.
- **Frontend: React + Vite (TypeScript).**
- Build-time data generation is a **Python package** in `scripts/`, exposed as `uv run words-data`; its output is committed JSON in `src/data/`.

## Commands

```sh
pnpm install
pnpm run dev          # Vite dev server
pnpm run build        # vite build
pnpm run lint

uv sync
uv run words-data --help
uv run words-data check
```

Always run `pnpm run lint && pnpm run build` and `uv run words-data check` before considering a task done. `pnpm run test` is not configured yet; the Python suite is `uv run words-data test`.

## Shared conventions (apply to every game)

### Puzzle numbering and date
- `puzzleNo = floor((localMidnight(today) - EPOCH) / 86_400_000)`. `EPOCH` is a single constant in `core/date.ts` (set to the launch date).
- Use the **player's local date**, so the puzzle changes at their local midnight.
- Provide a dev-only override (`?puzzle=N`) for testing. Strip or disable it in production builds.
- Never call `new Date()` outside `core/date.ts`; inject the date so tests are deterministic.

### Seeding
- Seed = hash of `"{game}:{puzzleNo}"` -> `mulberry32`. Use seeded randomness only where runtime randomness is needed (e.g. the cryptogram cipher).
- For list-based picks (Wordle answer, ladder pair, quote), pre-shuffle the list once with a fixed seed at build time and index by `puzzleNo % list.length`. Do not use `puzzleNo % k` patterns that make categories predictable.

### Persistence (localStorage only)
- Keys: `words:v1:{game}:state` and `words:v1:{game}:stats`.
- Every read and write is wrapped in try/catch. The app must work when storage is unavailable or empty.
- Bump the version segment on any breaking schema change; never crash on old or corrupt data (discard it).
- Persist in-progress state so a refresh does not reset the day's game.
- Streak continues only if `lastPlayedPuzzleNo === today - 1`.

### Sharing
- Each game builds a plain-text result: title, puzzle number, result, and an emoji grid where applicable. No spoilers (never include the answer).
- Use `navigator.share` when available, otherwise copy to clipboard and show a toast.

### UX and accessibility
- Mobile-first, responsive; keyboard fully supported on desktop.
- Light and dark themes via CSS variables; respect `prefers-color-scheme`.
- Colorblind-safe palette option; never rely on color alone (use letter-state icons or patterns).
- ARIA labels for tiles and keys; announce guess results to screen readers.
- Respect `prefers-reduced-motion`.

## Game specs

### Wordle
- Two lists: **answers** (~2-3k common words) and **allowed guesses** (larger, ~10k+, superset of answers).
- Source lists from a permissively licensed dictionary (e.g. SCOWL/ENABLE). **Do not copy the NYT Wordle lists.**
- Answer list is shuffled once with a fixed seed; today's answer = `answers[puzzleNo % n]`.
- Standard feedback rules, including correct handling of duplicate letters (two-pass: greens first, then yellows limited by remaining letter counts). Cover this with unit tests.
- Optional hard mode toggle (must reuse revealed hints).
- Share format: emoji grid, e.g. `Wordle #12 4/6`.

### Word Ladder
- Fixed word length per puzzle (start with 4 letters; may extend to 3-5).
- `scripts/gen_ladder_pairs.py`:
  1. Bucket words by wildcard pattern (`c*t`) to build the adjacency graph.
  2. BFS from candidate starts to candidate ends.
  3. Keep pairs whose **shortest path is 4-7 steps** and whose endpoints are common words.
  4. Emit `{ start, end, par }` per day, shuffled with a fixed seed.
- Client validates each step: exactly one letter changed, result in the dictionary, no repeats. The client does not need the graph, only the dictionary and the daily `{start, end, par}`.
- Scoring: steps taken vs `par`. Share format: `Ladder #12 · 6 steps (par 5)`.
- Offer an "undo last step" action.

### Cryptogram
- Content: a **mix** of famous quotes (public-domain authors), proverbs/idioms, and tech/programming quotes.
- Data shape in `src/data/cryptogram-quotes.json`:
  ```json
  { "id": "q0042", "text": "...", "attribution": "Name or null", "category": "quote | proverb | tech" }
  ```
- Pool is shuffled once with a fixed seed; do not rotate categories by `puzzleNo % 3`.
- Cipher: seeded random substitution with **no fixed points** (no letter maps to itself). Preserve spaces and punctuation.
- Difficulty scales by weekday: Monday = short text + 3 pre-revealed letters; Sunday = long text, none revealed.
- Features: letter-frequency helper, limited hints (reveal one letter), win detection, attribution revealed after solving.
- `scripts/validate_quotes.py` must enforce: 40-120 chars, >= 15 distinct letters, ASCII letters plus basic punctuation (normalize curly quotes/em dashes), no duplicates. Fail the build on violations.
- **Tech quotes must be verified against a primary source.** Misattributed quotes are common; if unsure, set attribution to `null` or leave the quote out.

## Testing expectations

- Unit tests (Vitest) for: date -> puzzleNo, seeding determinism, Wordle duplicate-letter scoring, ladder step validation, cipher generation (no fixed points, round-trips), streak logic, storage failure fallbacks.
- Data tests: every Wordle answer is in the guess list; every ladder pair has a path of length `par`; every quote passes validation.
- Tests must not depend on the real current date.

## Code style

- TypeScript strict mode; no `any` without a comment explaining why.
- Function components and hooks; keep game logic in pure functions (testable without React), UI in components.
- Small, focused modules; shared logic lives in `src/core/`, not duplicated per game.
- No new runtime dependencies without a clear reason. Prefer the platform (Intl, Clipboard, Web Share) over libraries.

## Working agreement for agents

- Ask before: adding dependencies, changing storage schema, changing the puzzle-selection algorithm (it changes every player's puzzle), or adding any network call.
- Never change puzzle-selection logic or data ordering casually: it silently changes past and future puzzles. If required, flag it explicitly.
- Keep answers out of share text and out of logs.
- Prefer small, reviewable commits with the game name as prefix (`wordle:`, `ladder:`, `crypto:`, `core:`).

## Suggested build order

1. Scaffold (Vite + React + TS, router, theme, Shell) and `src/core/*` with tests.
2. Wordle end-to-end (exercises all shared pieces).
3. Word Ladder (+ Python generator).
4. Cryptogram (+ quote validator and quote pool).
5. Landing page, stats modal polish, accessibility pass, deploy.

## Open items

- Final subdomain/domain and deploy target (needs SPA fallback routing).
- `EPOCH` launch date.
- Word list source and licence confirmation.
