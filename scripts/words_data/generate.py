from pathlib import Path

from words_data.gen_cryptogram import build as build_cryptogram
from words_data.gen_ladder import build as build_ladder
from words_data.gen_wordle import build as build_wordle
from words_data.lib.jsonio import check_text, write_text

VALID_ONLY = {"all", "wordle", "ladder", "crypto"}


def collect(
    only: str,
    source_dir: Path,
    quotes_source: Path,
    *,
    minify: bool = False,
) -> dict[Path, str]:
    if only not in VALID_ONLY:
        raise ValueError(f"unknown dataset {only!r}")
    files: dict[Path, str] = {}
    if only in {"all", "wordle"}:
        files.update(build_wordle(source_dir, minify=minify))
    if only in {"all", "ladder"}:
        files.update(build_ladder(source_dir, minify=minify))
    if only in {"all", "crypto"}:
        files.update(build_cryptogram(quotes_source, minify=minify))
    return files


def stale_chunks(data_dir: Path, expected: set[Path]) -> list[Path]:
    ladder_dir = data_dir / "ladder"
    if not ladder_dir.exists():
        return []
    return sorted(
        path
        for path in ladder_dir.glob("[0-9][0-9][0-9].json")
        if path.is_file() and path not in expected
    )


def check_files(files: dict[Path, str], data_dir: Path, only: str) -> list[str]:
    drift = [
        str(data_dir / path)
        for path, text in files.items()
        if not check_text(data_dir / path, text)
    ]
    if only in {"all", "ladder"}:
        expected = {data_dir / path for path in files}
        drift.extend(str(path) for path in stale_chunks(data_dir, expected))
    return drift


def write_files(files: dict[Path, str], data_dir: Path, only: str) -> None:
    for path, text in files.items():
        write_text(data_dir / path, text)
    if only in {"all", "ladder"}:
        expected = {data_dir / path for path in files}
        for path in stale_chunks(data_dir, expected):
            path.unlink()
