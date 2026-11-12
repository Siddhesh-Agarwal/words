import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


class ConsoleScriptTest(unittest.TestCase):
    """The installed `words-data` entry point must work from any directory.

    Regression: with pyproject.toml inside scripts/, hatchling packaged no code
    when the project root was itself the package, so the console script died
    with `ModuleNotFoundError` and could not be spawned at all.
    """

    def _run(self, argv: list[str], cwd: str) -> subprocess.CompletedProcess[str]:
        env = {**os.environ, "PYTHONPATH": ""}
        return subprocess.run(argv, cwd=cwd, capture_output=True, text=True, env=env)

    def test_console_script_runs_outside_the_project(self) -> None:
        console_script = Path(sys.executable).with_name("words-data")
        with tempfile.TemporaryDirectory() as tmp:
            result = self._run([str(console_script), "--help"], cwd=tmp)

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("words-data", result.stdout)

    def test_words_data_package_imports_without_project_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            result = self._run([sys.executable, "-c", "import words_data.cli"], cwd=tmp)

        self.assertEqual(result.returncode, 0, result.stderr)
