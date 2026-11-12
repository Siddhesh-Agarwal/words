import json
import shutil
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

from words_data.validate_data import validate

DATA = ROOT / "src" / "data"
SOURCE = ROOT / "scripts" / "data" / "source" / "scowl"


class ValidationNegativeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.data = Path(self.tmp.name) / "data"
        shutil.copytree(DATA, self.data)

    def test_null_wordle_file_is_reported(self):
        (self.data / "wordle-answers.json").write_text("null\n", encoding="utf-8")
        errors = validate(self.data, SOURCE)
        self.assertTrue(any("got null" in error for error in errors), errors)

    def test_apostrophe_in_wordle_answer_is_reported(self):
        path = self.data / "wordle-answers.json"
        answers = json.loads(path.read_text(encoding="utf-8"))
        answers[0] = answers[0][:4] + "'"
        path.write_text(json.dumps(answers, indent=2) + "\n", encoding="utf-8")
        errors = validate(self.data, SOURCE)
        self.assertTrue(any("invalid word" in error for error in errors), errors)

    def test_wrong_ladder_par_is_reported(self):
        path = self.data / "ladder" / "000.json"
        chunk = json.loads(path.read_text(encoding="utf-8"))
        chunk[0]["par"] = 7 if chunk[0]["par"] != 7 else 4
        path.write_text(json.dumps(chunk, separators=(",", ":")) + "\n", encoding="utf-8")
        errors = validate(self.data, SOURCE)
        self.assertTrue(any("BFS distance" in error for error in errors), errors)

    def test_reversed_duplicate_is_reported(self):
        path = self.data / "ladder" / "000.json"
        chunk = json.loads(path.read_text(encoding="utf-8"))
        first = chunk[0]
        chunk[1] = {"start": first["end"], "end": first["start"], "par": first["par"]}
        path.write_text(json.dumps(chunk, separators=(",", ":")) + "\n", encoding="utf-8")
        errors = validate(self.data, SOURCE)
        self.assertTrue(any("duplicate unordered pair" in error for error in errors), errors)

    def test_renamed_chunk_is_reported(self):
        (self.data / "ladder" / "083.json").rename(self.data / "ladder" / "084.json")
        errors = validate(self.data, SOURCE)
        self.assertTrue(any("expected 083.json" in error for error in errors), errors)

    def test_missing_manifest_field_is_reported(self):
        path = self.data / "ladder" / "manifest.json"
        manifest = json.loads(path.read_text(encoding="utf-8"))
        del manifest["dictionary"]
        path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        errors = validate(self.data, SOURCE)
        self.assertTrue(any("dictionary should be" in error for error in errors), errors)
