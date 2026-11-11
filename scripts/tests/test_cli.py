import unittest

from typer.testing import CliRunner

from scripts.cli import app

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
