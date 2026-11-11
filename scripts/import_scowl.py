import hashlib
import re
import tarfile
from pathlib import Path

from scripts.lib.jsonio import write_text
from scripts.lib.words import SCOWL_SIZES, WORD_LENGTHS

SCOWL_VERSION = "2020.12.07"
SCOWL_URL = (
    "https://downloads.sourceforge.net/project/wordlist/SCOWL/"
    "2020.12.07/scowl-2020.12.07.tar.gz"
)
SCOWL_SHA256 = "5587667caa20c4891390c2d42dbb4d5c4c3f41bee77af1457ece3ba23fb859cc"
TABOO_MEMBERS = (
    "misc/offensive.1",
    "misc/offensive.2",
    "misc/profane.1",
    "misc/profane.3",
)
WORD_RE = re.compile(r"^[a-z]{3,5}$")


def _member_name(tar: tarfile.TarFile, suffix: str) -> tarfile.TarInfo:
    matches = [
        member
        for member in tar.getmembers()
        if member.isfile() and (member.name == suffix or member.name.endswith("/" + suffix))
    ]
    if not matches:
        raise ValueError(f"missing {suffix} in tarball")
    return min(matches, key=lambda member: len(Path(member.name).parts))


def _read_text(tar: tarfile.TarFile, member: tarfile.TarInfo) -> str:
    extracted = tar.extractfile(member)
    if extracted is None:
        raise ValueError(f"cannot read {member.name}")
    return extracted.read().decode("latin-1")


def build_source_files(tarball: Path, *, verify_checksum: bool = True) -> dict[str, str]:
    if verify_checksum:
        digest = hashlib.sha256(tarball.read_bytes()).hexdigest()
        if digest != SCOWL_SHA256:
            raise ValueError(f"SCOWL checksum mismatch: expected {SCOWL_SHA256}, got {digest}")

    pools: dict[int, dict[str, int]] = {length: {} for length in WORD_LENGTHS}
    taboo: set[str] = set()

    with tarfile.open(tarball, "r:gz") as tar:
        for size in SCOWL_SIZES:
            text = _read_text(tar, _member_name(tar, f"final/english-words.{size}"))
            for raw in text.splitlines():
                word = raw.strip()
                if WORD_RE.fullmatch(word) is None:
                    continue
                length = len(word)
                previous = pools[length].get(word)
                if previous is None or size < previous:
                    pools[length][word] = size

        for member_suffix in TABOO_MEMBERS:
            text = _read_text(tar, _member_name(tar, member_suffix))
            for raw in text.splitlines():
                word = raw.strip().lower()
                if word:
                    taboo.add(word)

        copyright_text = _read_text(tar, _member_name(tar, "Copyright"))
        if not copyright_text.endswith("\n"):
            copyright_text += "\n"

    removed = 0
    for pool in pools.values():
        for word in list(pool):
            if word in taboo:
                del pool[word]
                removed += 1

    files: dict[str, str] = {}
    for length in WORD_LENGTHS:
        lines = [f"{word}\t{size}" for word, size in sorted(pools[length].items())]
        files[f"words-{length}.tsv"] = "\n".join(lines) + ("\n" if lines else "")

    taboo_lines = sorted(taboo)
    files["taboo.txt"] = "\n".join(taboo_lines) + ("\n" if taboo_lines else "")
    files["Copyright"] = copyright_text

    counts = ", ".join(f"{length}-letter: {len(pools[length])}" for length in WORD_LENGTHS)
    files["SOURCE.md"] = (
        "# SCOWL source pools\n\n"
        f"- Source: SCOWL {SCOWL_VERSION}\n"
        f"- URL: {SCOWL_URL}\n"
        f"- SHA-256: {SCOWL_SHA256}\n"
        "- Licence: see `Copyright` in this directory.\n"
        "- Import: `uv run words-data import-scowl --tarball <scowl-2020.12.07.tar.gz>`\n"
        "- Format: `word<TAB>minimum SCOWL size`, lowercase ASCII `a-z`, "
        "no apostrophes or accents.\n"
        f"- Sizes read: {', '.join(str(size) for size in SCOWL_SIZES)}. "
        "Lower is more common.\n"
        f"- Counts after taboo filtering: {counts}. Removed {removed} taboo words.\n"
        "- Do not edit these files by hand; rerun the importer.\n"
    )
    return files


def import_scowl(tarball: Path, output_dir: Path, *, verify_checksum: bool = True) -> dict[str, str]:
    files = build_source_files(tarball, verify_checksum=verify_checksum)
    output_dir.mkdir(parents=True, exist_ok=True)
    for name, text in files.items():
        write_text(output_dir / name, text)
    return files
