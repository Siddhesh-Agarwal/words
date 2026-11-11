import json
from pathlib import Path
from typing import Any


def dumps(data: Any, *, compact: bool = False) -> str:
    if compact:
        return json.dumps(data, separators=(",", ":"), ensure_ascii=True) + "\n"
    return json.dumps(data, indent=2, ensure_ascii=True) + "\n"


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def check_text(path: Path, text: str) -> bool:
    if not path.exists():
        return False
    return path.read_text(encoding="utf-8") == text
