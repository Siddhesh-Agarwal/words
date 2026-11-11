from pathlib import Path

from scripts.lib.jsonio import load_json
from scripts.lib.quotes import tier_counts, validate_entries, validate_output

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
