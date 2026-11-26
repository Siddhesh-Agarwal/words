# words

A small collection of daily word puzzles. One puzzle per game per day, identical for every player, with no backend, accounts, ads, or tracking.

**Live site:** <https://words.siddhesh.cc/>

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
- Python 3.12+ data pipeline exposed as a Typer CLI (`uv run --project scripts words-data`)

There is no runtime server and no database. All game data is generated offline and committed under `src/data/`.

## Sharing

Each game produces spoiler-free text:

```text
Wordle #12 4/6
Ladder #12 · 6 steps (par 5)
Cryptogram #12 · solved · 1 hint
```

The Web Share API is used when available, otherwise the result is copied to the clipboard with a toast.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for local setup, commands, project structure, data generation, and deployment.
