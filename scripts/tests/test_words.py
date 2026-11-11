import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from lib.jsonio import dumps
from lib.words import load_pool, words_at_most


class WordPoolTests(unittest.TestCase):
    def test_dumps_pretty_and_compact(self):
        self.assertEqual(dumps(["a", "b"]), '[\n  "a",\n  "b"\n]\n')
        self.assertEqual(dumps(["a", "b"], compact=True), '["a","b"]\n')

    def test_load_pool_and_filter(self):
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "words-5.tsv"
            path.write_text("crane\t10\nslate\t35\nzzzzz\t80\n", encoding="utf-8")
            pool = load_pool(path, 5)
            self.assertEqual(pool, {"crane": 10, "slate": 35, "zzzzz": 80})
            self.assertEqual(words_at_most(pool, 35), ["crane", "slate"])
