import re
from collections.abc import Mapping, Sequence
from typing import Any

from words_data.lib.seed import shuffled

CATEGORIES = {"quote", "proverb", "tech"}
ALLOWED_CHARS = set(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ .,;:'\"!?()-"
)
ID_RE = re.compile(r"^q[0-9]{4}$")
NORMALIZATION = str.maketrans(
    {
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2013": "-",
        "\u2014": "-",
        "\u2026": "...",
        "\u00a0": " ",
    }
)


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.translate(NORMALIZATION)).strip()


def distinct_letter_count(text: str) -> int:
    return len({char.lower() for char in text if char.isascii() and char.isalpha()})


def validate_entry(entry: Mapping[str, Any], *, require_source: bool) -> list[str]:
    errors: list[str] = []
    allowed_keys = {"id", "text", "attribution", "category"}
    if require_source:
        allowed_keys.add("source")
    unknown = set(entry) - allowed_keys
    if unknown:
        errors.append(f"unknown fields: {sorted(unknown)}")

    quote_id = entry.get("id")
    if not isinstance(quote_id, str) or ID_RE.fullmatch(quote_id) is None:
        errors.append("id must match qNNNN")

    text = entry.get("text")
    if not isinstance(text, str):
        errors.append("text must be a string")
    else:
        normalized = normalize_text(text)
        if not 40 <= len(normalized) <= 120:
            errors.append(f"text length {len(normalized)} is outside 40-120")
        distinct = distinct_letter_count(normalized)
        if distinct < 15:
            errors.append(f"text has only {distinct} distinct letters")
        for index, char in enumerate(normalized):
            if char not in ALLOWED_CHARS:
                errors.append(f"text has disallowed character {char!r} at index {index}")
                break

    category = entry.get("category")
    if category not in CATEGORIES:
        errors.append(f"category must be one of {sorted(CATEGORIES)}")

    if "attribution" not in entry:
        errors.append("attribution is required (use null for proverbs)")
    attribution = entry.get("attribution")
    if attribution is not None:
        if not isinstance(attribution, str) or not attribution.strip():
            errors.append("attribution must be null or a non-empty string")
    elif category in {"quote", "tech"}:
        errors.append("quote and tech entries need an attribution")

    if require_source:
        source = entry.get("source")
        if not isinstance(source, str) or not source.strip():
            errors.append("source must be a non-empty string")
    elif "source" in entry:
        errors.append("output entries must not contain source")

    return errors


def validate_entries(entries: Sequence[Mapping[str, Any]], *, require_source: bool) -> list[str]:
    if not isinstance(entries, list):
        return ["entries must be a list"]
    errors: list[str] = []
    seen_ids: set[str] = set()
    seen_texts: set[str] = set()
    for index, entry in enumerate(entries):
        if not isinstance(entry, Mapping):
            errors.append(f"entry {index}: must be an object")
            continue
        entry_errors = validate_entry(entry, require_source=require_source)
        prefix = entry.get("id") if isinstance(entry.get("id"), str) else f"entry {index}"
        errors.extend(f"{prefix}: {error}" for error in entry_errors)

        quote_id = entry.get("id")
        if isinstance(quote_id, str):
            if quote_id in seen_ids:
                errors.append(f"{prefix}: duplicate id")
            seen_ids.add(quote_id)

        text = entry.get("text")
        if isinstance(text, str):
            normalized = normalize_text(text).casefold()
            if normalized in seen_texts:
                errors.append(f"{prefix}: duplicate text")
            seen_texts.add(normalized)
    return errors


def prepare_quotes(raw: Sequence[Mapping[str, Any]], seed_label: str) -> list[dict[str, Any]]:
    errors = validate_entries(raw, require_source=True)
    if errors:
        raise ValueError("\n".join(errors))
    prepared = [
        {
            "id": entry["id"],
            "text": normalize_text(entry["text"]),
            "attribution": entry.get("attribution"),
            "category": entry["category"],
        }
        for entry in raw
    ]
    return shuffled(prepared, seed_label)


def validate_output(entries: Sequence[Mapping[str, Any]]) -> list[str]:
    errors = validate_entries(entries, require_source=False)
    for index, entry in enumerate(entries):
        text = entry.get("text") if isinstance(entry, Mapping) else None
        if isinstance(text, str) and normalize_text(text) != text:
            errors.append(f"entry {index}: text is not normalized")
        if isinstance(entry, Mapping) and set(entry) != {"id", "text", "attribution", "category"}:
            errors.append(f"entry {index}: output shape must be id, text, attribution, category")
    return errors


def tier_counts(entries: Sequence[Mapping[str, Any]]) -> dict[str, int]:
    counts = {"short": 0, "medium": 0, "long": 0}
    for entry in entries:
        if not isinstance(entry, Mapping):
            continue
        text = entry.get("text", "")
        if not isinstance(text, str):
            continue
        if len(text) < 60:
            counts["short"] += 1
        elif len(text) < 88:
            counts["medium"] += 1
        else:
            counts["long"] += 1
    return counts
