import json
from pathlib import Path
from typing import Any

try:
    import ujson as _json_reader
except ImportError:  # pragma: no cover - fallback for a bare Python install
    import json as _json_reader


def loads(data: str | bytes) -> Any:
    return _json_reader.loads(data)


def load_json(path: Path) -> Any:
    return loads(path.read_bytes())


def dumps(data: Any, *, compact: bool = False) -> str:
    if compact:
        return json.dumps(data, separators=(",", ":"), ensure_ascii=True) + "\n"
    return json.dumps(data, indent=2, ensure_ascii=True) + "\n"


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")


def check_text(path: Path, text: str) -> bool:
    if not path.exists():
        return False
    return path.read_bytes() == text.encode("utf-8")
