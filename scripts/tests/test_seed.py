import unittest
from pathlib import Path


from words_data.lib.seed import Mulberry32, seed_from_label, shuffled


class SeedTests(unittest.TestCase):
    def test_mulberry32_matches_js(self):
        rng = Mulberry32(12345)
        self.assertEqual(
            [rng.next() for _ in range(5)],
            [
                0.9797282677609473,
                0.3067522644996643,
                0.484205421525985,
                0.817934412509203,
                0.5094283693470061,
            ],
        )

    def test_seed_from_label_is_stable(self):
        self.assertEqual(seed_from_label("words:v1:test"), seed_from_label("words:v1:test"))
        self.assertNotEqual(seed_from_label("a"), seed_from_label("b"))

    def test_shuffle_is_deterministic_and_complete(self):
        items = list("abcdefghij")
        a = shuffled(items, "words:v1:test")
        b = shuffled(items, "words:v1:test")
        self.assertEqual(a, b)
        self.assertEqual(sorted(a), sorted(items))
        self.assertNotEqual(a, items)
