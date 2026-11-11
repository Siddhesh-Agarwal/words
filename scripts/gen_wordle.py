import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib.jsonio import check_text, dumps, write_text
from lib.seed import shuffled
from lib.words import load_pool, words_at_most

ANSWER_MAX_SIZE = 35
GUESS_MAX_SIZE = 80
ANSWER_SEED = "words:v1:wordle:answers"


def build(source_dir: Path) -> dict[Path, str]:
    pool = load_pool(source_dir / "words-5.tsv", 5)
    answers = shuffled(words_at_most(pool, ANSWER_MAX_SIZE), ANSWER_SEED)
    guesses = words_at_most(pool, GUESS_MAX_SIZE)
    return {
        Path("wordle-answers.json"): dumps(answers),
        Path("wordle-guesses.json"): dumps(guesses),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate Wordle answer and guess lists.")
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=Path("scripts/data/source/scowl"),
        help="directory containing words-5.tsv",
    )
    parser.add_argument("--output-dir", type=Path, default=Path("src/data"))
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args(argv)

    files = build(args.source_dir)
    if args.check:
        drift = [
            str(path)
            for path, text in files.items()
            if not check_text(args.output_dir / path, text)
        ]
        if drift:
            print("drift: " + ", ".join(drift), file=sys.stderr)
            return 1
        print("wordle data is up to date")
        return 0

    for path, text in files.items():
        write_text(args.output_dir / path, text)
    print(f"wrote {len(files)} wordle files to {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
