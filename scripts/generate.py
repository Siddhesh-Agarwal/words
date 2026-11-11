import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from gen_cryptogram import build as build_cryptogram
from gen_ladder import build as build_ladder
from gen_wordle import build as build_wordle
from lib.jsonio import check_text, write_text

SOURCE_DIR = Path("scripts/data/source/scowl")
QUOTES_SOURCE = Path("scripts/data/quotes-source.json")
DATA_DIR = Path("src/data")


def _stale_chunks(data_dir: Path, expected: set[Path]) -> list[Path]:
    ladder_dir = data_dir / "ladder"
    if not ladder_dir.exists():
        return []
    return sorted(
        path
        for path in ladder_dir.glob("[0-9][0-9][0-9].json")
        if path.is_file() and path not in expected
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate all committed word-game data.")
    parser.add_argument("--only", choices=("all", "wordle", "ladder", "crypto"), default="all")
    parser.add_argument("--data-dir", type=Path, default=DATA_DIR)
    parser.add_argument("--source-dir", type=Path, default=SOURCE_DIR)
    parser.add_argument("--quotes-source", type=Path, default=QUOTES_SOURCE)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args(argv)

    files: dict[Path, str] = {}
    if args.only in {"all", "wordle"}:
        files.update(build_wordle(args.source_dir))
    if args.only in {"all", "ladder"}:
        files.update(build_ladder(args.source_dir))
    if args.only in {"all", "crypto"}:
        files.update(build_cryptogram(args.quotes_source))

    expected = {args.data_dir / path for path in files}
    stale = _stale_chunks(args.data_dir, expected) if args.only in {"all", "ladder"} else []

    if args.check:
        drift = [
            str(args.data_dir / path)
            for path, text in files.items()
            if not check_text(args.data_dir / path, text)
        ]
        drift.extend(str(path) for path in stale)
        if drift:
            print("drift: " + ", ".join(drift), file=sys.stderr)
            return 1
        print(f"data is up to date ({len(files)} files)")
        return 0

    for path, text in files.items():
        write_text(args.data_dir / path, text)
    for path in stale:
        path.unlink()
    print(f"wrote {len(files)} data files to {args.data_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
