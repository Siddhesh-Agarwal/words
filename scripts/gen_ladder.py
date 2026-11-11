import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib.jsonio import check_text, dumps, write_text
from lib.ladder import (
    build_graph,
    candidate_pairs,
    chunked,
    largest_component,
)
from lib.seed import shuffled
from lib.words import load_pool, words_at_most

DICTIONARY_MAX_SIZE = 50
ENDPOINT_MAX_SIZE = 20
MIN_PAR = 4
MAX_PAR = 7
CHUNK_SIZE = 3650
PAIR_SEED = "words:v1:ladder:pairs"


def build(source_dir: Path) -> dict[Path, str]:
    pool = load_pool(source_dir / "words-4.tsv", 4)
    graph = build_graph(words_at_most(pool, DICTIONARY_MAX_SIZE))
    dictionary = sorted(largest_component(graph))
    endpoint_pool = set(words_at_most(pool, ENDPOINT_MAX_SIZE)) & set(dictionary)
    pairs = candidate_pairs(graph, endpoint_pool, MIN_PAR, MAX_PAR)
    ordered = shuffled(pairs, PAIR_SEED)
    chunks = chunked(ordered, CHUNK_SIZE)

    files: dict[Path, str] = {
        Path("ladder-dictionary.json"): dumps(dictionary),
        Path("ladder/manifest.json"): dumps(
            {
                "version": 1,
                "dictionary": "../ladder-dictionary.json",
                "chunkSize": CHUNK_SIZE,
                "chunkCount": len(chunks),
                "totalPairs": len(pairs),
                "parRange": [MIN_PAR, MAX_PAR],
                "length": 4,
                "endpointMaxSize": ENDPOINT_MAX_SIZE,
                "dictionaryMaxSize": DICTIONARY_MAX_SIZE,
                "seed": PAIR_SEED,
            }
        ),
    }
    for index, chunk in enumerate(chunks):
        payload = [
            {"start": start, "end": end, "par": par}
            for start, end, par in chunk
        ]
        files[Path("ladder") / f"{index:03d}.json"] = dumps(payload, compact=True)
    return files


def _chunk_paths(output_dir: Path) -> set[Path]:
    ladder_dir = output_dir / "ladder"
    if not ladder_dir.exists():
        return set()
    return {
        path
        for path in ladder_dir.glob("[0-9][0-9][0-9].json")
        if path.is_file()
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate the Word Ladder dictionary and pair schedule.")
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=Path("scripts/data/source/scowl"),
        help="directory containing words-4.tsv",
    )
    parser.add_argument("--output-dir", type=Path, default=Path("src/data"))
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args(argv)

    files = build(args.source_dir)
    expected = {args.output_dir / path for path in files}
    existing = _chunk_paths(args.output_dir)

    if args.check:
        drift = [
            str(args.output_dir / path)
            for path, text in files.items()
            if not check_text(args.output_dir / path, text)
        ]
        drift.extend(str(path) for path in sorted(existing - expected))
        if drift:
            print("drift: " + ", ".join(drift), file=sys.stderr)
            return 1
        print("ladder data is up to date")
        return 0

    for path, text in files.items():
        write_text(args.output_dir / path, text)
    for stale in sorted(existing - expected):
        stale.unlink()
    print(f"wrote {len(files)} ladder files to {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
