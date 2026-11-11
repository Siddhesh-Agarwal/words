import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib.ladder import build_graph, largest_component, shortest_distances
from lib.quotes import tier_counts, validate_output
from lib.words import load_taboo

WORD_RE = re.compile(r"^[a-z]{5}$")
LADDER_RE = re.compile(r"^[a-z]{4}$")
MIN_ANSWERS = 2500
MAX_ANSWERS = 4000
MIN_GUESSES = 10000
MAX_GUESSES = 15000
MIN_DICTIONARY = 1500
MIN_PAIRS = 250000
MIN_QUOTES = 45
MIN_PER_TIER = 10
CHUNK_SIZE = 3650
MIN_PAR = 4
MAX_PAR = 7
MAX_ERRORS = 50


def _add(errors: list[str], message: str) -> None:
    if len(errors) < MAX_ERRORS:
        errors.append(message)
    elif len(errors) == MAX_ERRORS:
        errors.append("too many errors; stopping at 50")


def _load_json(path: Path, label: str, errors: list[str]) -> Any:
    if not path.exists():
        errors.append(f"{label}: missing {path}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"{label}: invalid JSON in {path}: {exc}")
        return None


def _check_word_list(entries: Any, label: str, pattern: re.Pattern[str], errors: list[str]) -> set[str]:
    if not isinstance(entries, list):
        errors.append(f"{label}: expected a list")
        return set()
    seen: set[str] = set()
    for index, word in enumerate(entries):
        if not isinstance(word, str) or pattern.fullmatch(word) is None:
            _add(errors, f"{label}[{index}]: invalid word {word!r}")
            continue
        if word in seen:
            _add(errors, f"{label}[{index}]: duplicate word {word!r}")
        seen.add(word)
    return seen


def validate_wordle(data_dir: Path, taboo: set[str], errors: list[str]) -> None:
    answers_raw = _load_json(data_dir / "wordle-answers.json", "wordle answers", errors)
    guesses_raw = _load_json(data_dir / "wordle-guesses.json", "wordle guesses", errors)
    if answers_raw is None or guesses_raw is None:
        return

    answers = _check_word_list(answers_raw, "wordle answers", WORD_RE, errors)
    guesses = _check_word_list(guesses_raw, "wordle guesses", WORD_RE, errors)

    if (
        isinstance(guesses_raw, list)
        and all(isinstance(word, str) for word in guesses_raw)
        and guesses_raw != sorted(guesses_raw)
    ):
        errors.append("wordle guesses: must be sorted")

    if not MIN_ANSWERS <= len(answers) <= MAX_ANSWERS:
        errors.append(f"wordle answers: {len(answers)} is outside {MIN_ANSWERS}-{MAX_ANSWERS}")
    if not MIN_GUESSES <= len(guesses) <= MAX_GUESSES:
        errors.append(f"wordle guesses: {len(guesses)} is outside {MIN_GUESSES}-{MAX_GUESSES}")

    missing = answers - guesses
    if missing:
        errors.append(f"wordle answers: {len(missing)} words are missing from guesses")

    bad_answers = answers & taboo
    if bad_answers:
        errors.append(f"wordle answers: {len(bad_answers)} taboo words")
    bad_guesses = guesses & taboo
    if bad_guesses:
        errors.append(f"wordle guesses: {len(bad_guesses)} taboo words")


def validate_ladder(data_dir: Path, errors: list[str]) -> None:
    dictionary_raw = _load_json(data_dir / "ladder-dictionary.json", "ladder dictionary", errors)
    manifest = _load_json(data_dir / "ladder" / "manifest.json", "ladder manifest", errors)
    if dictionary_raw is None or manifest is None:
        return

    dictionary = _check_word_list(dictionary_raw, "ladder dictionary", LADDER_RE, errors)
    if (
        isinstance(dictionary_raw, list)
        and all(isinstance(word, str) for word in dictionary_raw)
        and dictionary_raw != sorted(dictionary_raw)
    ):
        errors.append("ladder dictionary: must be sorted")
    if len(dictionary) < MIN_DICTIONARY:
        errors.append(f"ladder dictionary: {len(dictionary)} is below {MIN_DICTIONARY}")

    if not isinstance(manifest, dict):
        errors.append("ladder manifest: expected an object")
        return
    expected = {
        "version": 1,
        "chunkSize": CHUNK_SIZE,
        "length": 4,
        "parRange": [MIN_PAR, MAX_PAR],
    }
    for key, value in expected.items():
        if manifest.get(key) != value:
            errors.append(f"ladder manifest: {key} should be {value!r}, got {manifest.get(key)!r}")

    chunk_paths = sorted((data_dir / "ladder").glob("[0-9][0-9][0-9].json"))
    if not chunk_paths:
        errors.append("ladder chunks: no chunk files found")
        return
    if manifest.get("chunkCount") != len(chunk_paths):
        errors.append(f"ladder manifest: chunkCount {manifest.get('chunkCount')} != {len(chunk_paths)}")

    pairs: list[dict[str, Any]] = []
    for chunk_index, chunk_path in enumerate(chunk_paths):
        chunk = _load_json(chunk_path, f"ladder chunk {chunk_path.name}", errors)
        if chunk is None:
            continue
        if not isinstance(chunk, list):
            errors.append(f"ladder chunk {chunk_path.name}: expected a list")
            continue
        if chunk_index < len(chunk_paths) - 1 and len(chunk) != CHUNK_SIZE:
            errors.append(f"ladder chunk {chunk_path.name}: {len(chunk)} pairs, expected {CHUNK_SIZE}")
        if chunk_index == len(chunk_paths) - 1 and not 1 <= len(chunk) <= CHUNK_SIZE:
            errors.append(f"ladder chunk {chunk_path.name}: invalid final chunk size {len(chunk)}")
        for item in chunk:
            if not isinstance(item, dict):
                _add(errors, f"ladder chunk {chunk_path.name}: pair is not an object")
                continue
            pairs.append(item)

    total_pairs = manifest.get("totalPairs")
    if total_pairs != len(pairs):
        errors.append(f"ladder manifest: totalPairs {total_pairs} != {len(pairs)}")
    if len(pairs) < MIN_PAIRS:
        errors.append(f"ladder pairs: {len(pairs)} is below {MIN_PAIRS}")

    graph = build_graph(dictionary)
    component = largest_component(graph)
    if len(component) != len(dictionary):
        errors.append("ladder dictionary: not a single connected component")

    seen: set[tuple[str, str]] = set()
    distance_cache: dict[str, dict[str, int]] = {}
    for index, pair in enumerate(pairs):
        if len(errors) >= MAX_ERRORS:
            break
        if set(pair) != {"start", "end", "par"}:
            _add(errors, f"ladder pair {index}: expected start, end, par")
            continue
        start, end, par = pair["start"], pair["end"], pair["par"]
        if not isinstance(start, str) or not isinstance(end, str) or type(par) is not int:
            _add(errors, f"ladder pair {index}: invalid types")
            continue
        if start == end:
            _add(errors, f"ladder pair {index}: start equals end")
            continue
        if start not in dictionary or end not in dictionary:
            _add(errors, f"ladder pair {index}: endpoint is not in the dictionary")
            continue
        if not MIN_PAR <= par <= MAX_PAR:
            _add(errors, f"ladder pair {index}: par {par} is outside {MIN_PAR}-{MAX_PAR}")
            continue
        key = (min(start, end), max(start, end))
        if key in seen:
            _add(errors, f"ladder pair {index}: duplicate unordered pair")
            continue
        seen.add(key)

        if start not in distance_cache:
            distance_cache[start] = shortest_distances(graph, start, max_depth=MAX_PAR)
        if distance_cache[start].get(end) != par:
            _add(
                errors,
                f"ladder pair {index}: BFS distance {distance_cache[start].get(end)} != par {par}",
            )


def validate_crypto(data_dir: Path, errors: list[str]) -> None:
    quotes = _load_json(data_dir / "cryptogram-quotes.json", "cryptogram quotes", errors)
    if quotes is None:
        return
    errors.extend(f"cryptogram quotes: {error}" for error in validate_output(quotes))
    if not isinstance(quotes, list):
        return
    if len(quotes) < MIN_QUOTES:
        errors.append(f"cryptogram quotes: {len(quotes)} is below {MIN_QUOTES}")
    if not all(isinstance(entry, dict) for entry in quotes):
        return
    counts = tier_counts(quotes)
    for tier, count in counts.items():
        if count < MIN_PER_TIER:
            errors.append(f"cryptogram quotes: only {count} {tier} quotes; need {MIN_PER_TIER}")


def validate(data_dir: Path, source_dir: Path) -> list[str]:
    errors: list[str] = []
    taboo_path = source_dir / "taboo.txt"
    taboo = load_taboo(taboo_path) if taboo_path.exists() else set()
    if not taboo_path.exists():
        errors.append(f"source: missing {taboo_path}")
    validate_wordle(data_dir, taboo, errors)
    validate_ladder(data_dir, errors)
    validate_crypto(data_dir, errors)
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate all committed word-game data.")
    parser.add_argument("--data-dir", type=Path, default=Path("src/data"))
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=Path("scripts/data/source/scowl"),
    )
    args = parser.parse_args(argv)

    errors = validate(args.data_dir, args.source_dir)
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1

    answers = json.loads((args.data_dir / "wordle-answers.json").read_text(encoding="utf-8"))
    guesses = json.loads((args.data_dir / "wordle-guesses.json").read_text(encoding="utf-8"))
    dictionary = json.loads((args.data_dir / "ladder-dictionary.json").read_text(encoding="utf-8"))
    manifest = json.loads((args.data_dir / "ladder" / "manifest.json").read_text(encoding="utf-8"))
    quotes = json.loads((args.data_dir / "cryptogram-quotes.json").read_text(encoding="utf-8"))
    print(
        "data ok: "
        f"wordle {len(answers)} answers / {len(guesses)} guesses; "
        f"ladder {len(dictionary)} words / {manifest['totalPairs']} pairs; "
        f"quotes {len(quotes)} {tier_counts(quotes)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
