import json
import unittest
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

from words_data.lib.quotes import tier_counts
from words_data.validate_data import validate

DATA = ROOT / "src" / "data"
SOURCE = ROOT / "scripts" / "data" / "source" / "scowl"


class CommittedDataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.errors = validate(DATA, SOURCE)
        cls.answers = json.loads((DATA / "wordle-answers.json").read_text(encoding="utf-8"))
        cls.guesses = json.loads((DATA / "wordle-guesses.json").read_text(encoding="utf-8"))
        cls.dictionary = json.loads((DATA / "ladder-dictionary.json").read_text(encoding="utf-8"))
        cls.manifest = json.loads((DATA / "ladder" / "manifest.json").read_text(encoding="utf-8"))
        cls.quotes = json.loads((DATA / "cryptogram-quotes.json").read_text(encoding="utf-8"))

    def test_validation_has_no_errors(self):
        self.assertEqual(self.errors, [])

    def test_wordle_counts(self):
        self.assertEqual(len(self.answers), 3416)
        self.assertEqual(len(self.guesses), 10938)

    def test_ladder_counts(self):
        chunks = sorted((DATA / "ladder").glob("[0-9][0-9][0-9].json"))
        self.assertEqual(len(self.dictionary), 2139)
        self.assertEqual(self.manifest["totalPairs"], 303316)
        self.assertEqual(self.manifest["chunkCount"], 84)
        self.assertEqual(len(chunks), 84)

    def test_quote_counts(self):
        self.assertEqual(len(self.quotes), 60)
        self.assertEqual(Counter(entry["category"] for entry in self.quotes), {"quote": 20, "proverb": 20, "tech": 20})
        self.assertEqual(tier_counts(self.quotes), {"short": 24, "medium": 23, "long": 13})
