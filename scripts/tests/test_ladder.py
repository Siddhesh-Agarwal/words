import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from gen_ladder import build
from lib.ladder import (
    build_graph,
    candidate_pairs,
    chunked,
    largest_component,
    shortest_distances,
)

CHAIN = ["aaaa", "aaab", "aabb", "abbb", "bbbb"]


class LadderGraphTests(unittest.TestCase):
    def setUp(self):
        self.graph = build_graph(CHAIN)

    def test_shortest_distance_is_four(self):
        distances = shortest_distances(self.graph, "aaaa")
        self.assertEqual(distances["bbbb"], 4)
        self.assertNotIn("cccc", distances)

    def test_candidate_pair_uses_par_four(self):
        self.assertEqual(
            candidate_pairs(self.graph, {"aaaa", "bbbb"}),
            [("aaaa", "bbbb", 4)],
        )

    def test_largest_component_drops_isolated_words(self):
        graph = build_graph(CHAIN + ["cccc"])
        self.assertEqual(largest_component(graph), set(CHAIN))

    def test_chunked_keeps_remainder(self):
        self.assertEqual([len(chunk) for chunk in chunked(list(range(10)), 3)], [3, 3, 3, 1])


class LadderGeneratorTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.source = Path(self.tmp.name)
        lines = "".join(f"{word}\t10\n" for word in CHAIN + ["cccc"])
        (self.source / "words-4.tsv").write_text(lines, encoding="utf-8")

    def test_build_is_deterministic(self):
        first = build(self.source)
        second = build(self.source)
        self.assertEqual(first, second)

    def test_build_emits_dictionary_manifest_and_one_pair(self):
        files = build(self.source)
        dictionary = json.loads(files[Path("ladder-dictionary.json")])
        manifest = json.loads(files[Path("ladder/manifest.json")])
        pairs = json.loads(files[Path("ladder/000.json")])

        self.assertEqual(dictionary, CHAIN)
        self.assertEqual(manifest["totalPairs"], 1)
        self.assertEqual(manifest["chunkCount"], 1)
        self.assertEqual(manifest["chunkSize"], 3650)
        self.assertEqual(pairs, [{"start": "aaaa", "end": "bbbb", "par": 4}])
