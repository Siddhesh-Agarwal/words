import re
from collections.abc import Mapping
from pathlib import Path

SCOWL_SIZES = (10, 20, 35, 40, 50, 55, 60, 70, 80)
WORD_LENGTHS = (3, 4, 5)

_WORD_RE = re.compile(r"^[a-z]+$")


def load_pool(path: Path, length: int) -> dict[str, int]:
    """Load a `word<TAB>minimum-size` pool and validate every line."""
    pool: dict[str, int] = {}
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line:
            raise ValueError(f"{path}:{line_number}: blank line")
        parts = line.split("\t")
        if len(parts) != 2:
            raise ValueError(f"{path}:{line_number}: expected word<TAB>size")
        word, size_text = parts
        if len(word) != length or _WORD_RE.fullmatch(word) is None:
            raise ValueError(f"{path}:{line_number}: invalid {length}-letter word {word!r}")
        size = int(size_text)
        if size not in SCOWL_SIZES:
            raise ValueError(f"{path}:{line_number}: unknown SCOWL size {size}")
        if word in pool:
            raise ValueError(f"{path}:{line_number}: duplicate word {word!r}")
        pool[word] = size
    return pool


def words_at_most(pool: Mapping[str, int], max_size: int) -> list[str]:
    return sorted(word for word, size in pool.items() if size <= max_size)


def load_taboo(path: Path) -> set[str]:
    return {
        line.strip().lower()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    }
