from pathlib import Path

from words_data.lib.jsonio import dumps
from words_data.lib.ladder import (
    build_graph,
    candidate_pairs,
    chunked,
    largest_component,
)
from words_data.lib.seed import shuffled
from words_data.lib.words import load_pool, words_at_most

DICTIONARY_MAX_SIZE = 50
ENDPOINT_MAX_SIZE = 20
MIN_PAR = 4
MAX_PAR = 7
CHUNK_SIZE = 3650
PAIR_SEED = "words:v1:ladder:pairs"


def build(source_dir: Path, *, minify: bool = False) -> dict[Path, str]:
    pool = load_pool(source_dir / "words-4.tsv", 4)
    graph = build_graph(words_at_most(pool, DICTIONARY_MAX_SIZE))
    dictionary = sorted(largest_component(graph))
    endpoint_pool = set(words_at_most(pool, ENDPOINT_MAX_SIZE)) & set(dictionary)
    pairs = candidate_pairs(graph, endpoint_pool, MIN_PAR, MAX_PAR)
    ordered = shuffled(pairs, PAIR_SEED)
    chunks = chunked(ordered, CHUNK_SIZE)

    files: dict[Path, str] = {
        Path("ladder-dictionary.json"): dumps(dictionary, compact=minify),
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
            },
            compact=minify,
        ),
    }
    for index, chunk in enumerate(chunks):
        payload = [
            {"start": start, "end": end, "par": par}
            for start, end, par in chunk
        ]
        files[Path("ladder") / f"{index:03d}.json"] = dumps(payload, compact=True)
    return files
