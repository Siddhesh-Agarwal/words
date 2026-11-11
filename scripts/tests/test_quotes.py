import json
import tempfile
import unittest
from pathlib import Path


from scripts.gen_cryptogram import build
from scripts.lib.quotes import (
    normalize_text,
    prepare_quotes,
    tier_counts,
    validate_entries,
    validate_output,
)
from scripts.validate_quotes import validate_files

VALID_QUOTE = {
    "id": "q0001",
    "text": "The only true wisdom is in knowing you know nothing.",
    "attribution": "Socrates",
    "category": "quote",
    "source": "Plato, Apology",
}
VALID_TECH = {
    "id": "q0002",
    "text": "The price of reliability is the pursuit of the utmost simplicity.",
    "attribution": "C. A. R. Hoare",
    "category": "tech",
    "source": "The Emperor's Old Clothes, 1980 Turing Award Lecture",
}
VALID_PROVERB = {
    "id": "q0003",
    "text": "A little knowledge is a dangerous thing.",
    "attribution": None,
    "category": "proverb",
    "source": "Traditional proverb",
}


class QuoteTextTests(unittest.TestCase):
    def test_normalizes_curly_punctuation_and_whitespace(self):
        self.assertEqual(
            normalize_text("“Don’t — stop…”"),
            '"Don\'t - stop..."',
        )
        self.assertEqual(normalize_text("  two   spaces  "), "two spaces")

    def test_valid_entries_pass(self):
        self.assertEqual(validate_entries([VALID_QUOTE, VALID_TECH, VALID_PROVERB], require_source=True), [])

    def test_rejects_short_text(self):
        bad = dict(VALID_QUOTE, text="Too short.")
        self.assertTrue(validate_entries([bad], require_source=True))

    def test_rejects_too_few_distinct_letters(self):
        bad = dict(VALID_QUOTE, text="a" * 40)
        errors = validate_entries([bad], require_source=True)
        self.assertTrue(any("distinct" in error for error in errors))

    def test_rejects_digits(self):
        bad = dict(VALID_QUOTE, text="There are 2 hard things in computer science.")
        errors = validate_entries([bad], require_source=True)
        self.assertTrue(any("character" in error for error in errors))

    def test_rejects_non_ascii(self):
        bad = dict(VALID_QUOTE, text="Simplicity is prerequisite for reliability ☃")
        errors = validate_entries([bad], require_source=True)
        self.assertTrue(any("character" in error for error in errors))

    def test_tech_requires_attribution_and_source(self):
        no_source = {key: value for key, value in VALID_TECH.items() if key != "source"}
        self.assertTrue(validate_entries([no_source], require_source=True))
        no_attribution = dict(VALID_TECH, attribution=None)
        self.assertTrue(validate_entries([no_attribution], require_source=True))

    def test_missing_attribution_key_is_rejected(self):
        bad = {key: value for key, value in VALID_PROVERB.items() if key != "attribution"}
        errors = validate_entries([bad], require_source=True)
        self.assertTrue(any("attribution is required" in error for error in errors))

    def test_rejects_non_ascii_quote_ids(self):
        bad = dict(VALID_QUOTE, id="q٠٠٠١")
        errors = validate_entries([bad], require_source=True)
        self.assertTrue(any("id must match" in error for error in errors))

    def test_rejects_duplicate_ids_and_texts(self):
        duplicate_id = dict(VALID_TECH, id=VALID_QUOTE["id"])
        self.assertTrue(validate_entries([VALID_QUOTE, duplicate_id], require_source=True))
        duplicate_text = dict(VALID_TECH, text=VALID_QUOTE["text"])
        errors = validate_entries([VALID_QUOTE, duplicate_text], require_source=True)
        self.assertTrue(any("duplicate text" in error for error in errors))


class QuoteOutputTests(unittest.TestCase):
    def test_prepare_strips_source_and_is_deterministic(self):
        first = prepare_quotes([VALID_QUOTE, VALID_TECH, VALID_PROVERB], "words:v1:test")
        second = prepare_quotes([VALID_QUOTE, VALID_TECH, VALID_PROVERB], "words:v1:test")
        self.assertEqual(first, second)
        for entry in first:
            self.assertEqual(set(entry), {"id", "text", "attribution", "category"})

    def test_output_validation_rejects_denormalized_text(self):
        output = prepare_quotes([VALID_QUOTE], "words:v1:test")
        output[0]["text"] = output[0]["text"].replace(" ", "  ")
        errors = validate_output(output)
        self.assertTrue(any("normalized" in error for error in errors))

    def test_tier_counts(self):
        entries = [
            {"text": "x" * 59},
            {"text": "x" * 60},
            {"text": "x" * 87},
            {"text": "x" * 88},
        ]
        self.assertEqual(tier_counts(entries), {"short": 1, "medium": 2, "long": 1})


class CryptogramGeneratorTests(unittest.TestCase):
    def test_validate_files_reports_malformed_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "source.json"
            output = Path(tmp) / "output.json"
            source.write_text("null\n", encoding="utf-8")
            output.write_text("null\n", encoding="utf-8")
            errors, counts = validate_files(source, output)
            self.assertTrue(any("expected a list" in error for error in errors), errors)
            self.assertEqual(counts, {"short": 0, "medium": 0, "long": 0})

    def test_build_strips_source_and_is_deterministic(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "quotes.json"
            source.write_text(
                json.dumps([VALID_QUOTE, VALID_TECH, VALID_PROVERB]),
                encoding="utf-8",
            )
            first = build(source)
            second = build(source)
            self.assertEqual(first, second)
            payload = json.loads(first[Path("cryptogram-quotes.json")])
            self.assertEqual(len(payload), 3)
            for entry in payload:
                self.assertEqual(set(entry), {"id", "text", "attribution", "category"})
