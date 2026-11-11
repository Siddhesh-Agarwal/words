import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib.jsonio import check_text, dumps, write_text
from lib.quotes import prepare_quotes, tier_counts

QUOTE_SEED = "words:v1:cryptogram:quotes"


def build(source_path: Path) -> dict[Path, str]:
    raw = json.loads(source_path.read_text(encoding="utf-8"))
    prepared = prepare_quotes(raw, QUOTE_SEED)
    return {Path("cryptogram-quotes.json"): dumps(prepared)}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate and shuffle the cryptogram quote pool.")
    parser.add_argument(
        "--source",
        type=Path,
        default=Path("scripts/data/quotes-source.json"),
        help="authored quote source with provenance",
    )
    parser.add_argument("--output-dir", type=Path, default=Path("src/data"))
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args(argv)

    files = build(args.source)
    if args.check:
        drift = [
            str(args.output_dir / path)
            for path, text in files.items()
            if not check_text(args.output_dir / path, text)
        ]
        if drift:
            print("drift: " + ", ".join(drift), file=sys.stderr)
            return 1
        payload = json.loads(next(iter(files.values())))
        print(f"cryptogram data is up to date ({len(payload)} quotes, {tier_counts(payload)})")
        return 0

    for path, text in files.items():
        write_text(args.output_dir / path, text)
    payload = json.loads(next(iter(files.values())))
    print(f"wrote {len(payload)} cryptogram quotes to {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
