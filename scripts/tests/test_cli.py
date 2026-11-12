import tempfile
import unittest
from pathlib import Path

from typer.testing import CliRunner

from words_data.cli import app

runner = CliRunner()


class CliTests(unittest.TestCase):
    def test_help_lists_every_command(self):
        result = runner.invoke(app, ["--help"])
        self.assertEqual(result.exit_code, 0, result.output)
        for command in (
            "import-scowl",
            "generate",
            "validate-data",
            "validate-quotes",
            "test",
            "check",
        ):
            self.assertIn(command, result.output)

    def test_generate_check(self):
        result = runner.invoke(app, ["generate", "--check"])
        self.assertEqual(result.exit_code, 0, result.output)
        self.assertIn("data is up to date", result.output)

    def test_validate_data(self):
        result = runner.invoke(app, ["validate-data"])
        self.assertEqual(result.exit_code, 0, result.output)
        self.assertIn("data ok:", result.output)

    def test_validate_quotes(self):
        result = runner.invoke(app, ["validate-quotes"])
        self.assertEqual(result.exit_code, 0, result.output)
        self.assertIn("quotes ok", result.output)

    def test_generate_minify_writes_single_line_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = runner.invoke(
                app,
                ["generate", "--only", "wordle", "--minify", "--data-dir", tmp],
            )
            self.assertEqual(result.exit_code, 0, result.output)
            for name in ("wordle-answers.json", "wordle-guesses.json"):
                text = (Path(tmp) / name).read_text(encoding="utf-8")
                self.assertEqual(text.count("\n"), 1)
                self.assertNotIn("  ", text)

            check = runner.invoke(
                app,
                ["generate", "--only", "wordle", "--check", "--minify", "--data-dir", tmp],
            )
            self.assertEqual(check.exit_code, 0, check.output)
            self.assertIn("data is up to date", check.output)

            unminified = runner.invoke(
                app,
                ["generate", "--only", "wordle", "--check", "--data-dir", tmp],
            )
            self.assertEqual(unminified.exit_code, 1)
