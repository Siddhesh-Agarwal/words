import io
import tarfile
import tempfile
import unittest
from pathlib import Path


from scripts.import_scowl import build_source_files


def make_tarball(path: Path, files: dict[str, bytes]) -> None:
    with tarfile.open(path, "w:gz") as tar:
        for name, data in files.items():
            info = tarfile.TarInfo(name)
            info.size = len(data)
            tar.addfile(info, io.BytesIO(data))


class ImportScowlTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.tarball = Path(self.tmp.name) / "fake.tar.gz"
        make_tarball(
            self.tarball,
            {
                "pkg/final/english-words.10": b"cat\ndog\ntoolong\nAbc\ncan't\n",
                "pkg/final/english-words.20": "cat\nfox\nbird\ncafé\n".encode("latin-1"),
                "pkg/final/english-words.35": b"",
                "pkg/final/english-words.40": b"",
                "pkg/final/english-words.50": b"",
                "pkg/final/english-words.55": b"",
                "pkg/final/english-words.60": b"",
                "pkg/final/english-words.70": b"",
                "pkg/final/english-words.80": b"",
                "pkg/misc/offensive.1": b"dog\n",
                "pkg/misc/offensive.2": b"",
                "pkg/misc/profane.1": b"damn\n",
                "pkg/misc/profane.3": b"",
                "pkg/Copyright": b"test licence\n",
            },
        )
        self.files = build_source_files(self.tarball, verify_checksum=False)

    def test_words_are_filtered_and_deduplicated(self):
        self.assertEqual(self.files["words-3.tsv"], "cat\t10\nfox\t20\n")
        self.assertNotIn("dog", self.files["words-3.tsv"])
        self.assertEqual(self.files["words-4.tsv"], "bird\t20\n")
        self.assertEqual(self.files["words-5.tsv"], "")

    def test_taboo_and_copyright_are_written(self):
        self.assertEqual(self.files["taboo.txt"], "damn\ndog\n")
        self.assertEqual(self.files["Copyright"], "test licence\n")

    def test_source_notes_pin_the_checksum(self):
        self.assertIn("5587667caa20c4891390c2d42dbb4d5c4c3f41bee77af1457ece3ba23fb859cc", self.files["SOURCE.md"])
        self.assertIn("3-letter: 2", self.files["SOURCE.md"])
