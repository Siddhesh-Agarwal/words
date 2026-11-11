import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib.jsonio import load_json
from lib.quotes import tier_counts, validate_entries, validate_output

MIN_QUOTES = 45
MIN_PER_TIER = 10


def _load_list(path: Path, label: str, errors: list[str]) -> list:
    try:
        data = load_json(path)
    except (OSError, ValueError) as exc:
        errors.append(f"{label}: {exc}")
        return []
    if not isinstance(data, list):
        errors.append(f"{label}: expected a list")
        return []
    return data


def validate_files(source: Path, output: Path) -> tuple[list[str], dict[str, int]]:
    errors: list[str] = []
    source_entries = _load_list(source, "source", errors)
    output_entries = _load_list(output, "output", errors)
    errors.extend(f"source: {error}" for error in validate_entries(source_entries, require_source=True))
    errors.extend(f"output: {error}" for error in validate_output(output_entries))

    if len(output_entries) < MIN_QUOTES:
        errors.append(f"output: only {len(output_entries)} quotes; need at least {MIN_QUOTES}")

    counts = tier_counts(output_entries)
    for tier, count in counts.items():
        if count < MIN_PER_TIER:
            errors.append(f"output: only {count} {tier} quotes; need at least {MIN_PER_TIER}")

    source_ids = {entry.get("id") for entry in source_entries if isinstance(entry, dict)}
    output_ids = {entry.get("id") for entry in output_entries if isinstance(entry, dict)}
    if source_ids != output_ids:
        errors.append("output ids do not match source ids")

    return errors, counts


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate the cryptogram quote source and generated pool.")
    parser.add_argument(
        "--source",
        type=Path,
        default=Path("scripts/data/quotes-source.json"),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("src/data/cryptogram-quotes.json"),
    )
    args = parser.parse_args(argv)

    errors, counts = validate_files(args.source, args.output)
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1
    print(f"quotes ok ({counts['short']} short, {counts['medium']} medium, {counts['long']} long)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
