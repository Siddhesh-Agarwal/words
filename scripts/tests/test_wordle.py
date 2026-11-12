import json
import tempfile
import unittest
from pathlib import Path


from words_data.gen_wordle import build


class WordleTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.source = Path(self.tmp.name)
        (self.source / "words-5.tsv").write_text(
            "crane\t10\n"
            "slate\t10\n"
            "audio\t10\n"
            "zebra\t35\n"
            "pious\t35\n"
            "fudge\t35\n"
            "aahed\t80\n"
            "aalii\t80\n",
            encoding="utf-8",
        )

    def test_minify_emits_one_line_json(self):
        files = build(self.source, minify=True)
        for text in files.values():
            self.assertEqual(text.count("\n"), 1)
            self.assertNotIn("  ", text)

    def test_build_is_deterministic_and_answers_are_a_subset(self):
        first = build(self.source)
        second = build(self.source)
        self.assertEqual(first, second)
        self.assertEqual(
            set(first),
            {Path("wordle-answers.json"), Path("wordle-guesses.json")},
        )

        answers = json.loads(first[Path("wordle-answers.json")])
        guesses = json.loads(first[Path("wordle-guesses.json")])
        self.assertEqual(set(answers), {"crane", "slate", "audio", "zebra", "pious", "fudge"})
        self.assertEqual(len(answers), 6)
        self.assertEqual(len(guesses), 8)
        self.assertTrue(set(answers) <= set(guesses))
        self.assertEqual(guesses, sorted(guesses))
        self.assertTrue(all(len(word) == 5 and word.islower() for word in guesses))
