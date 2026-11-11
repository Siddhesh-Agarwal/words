from pathlib import Path

from scripts.lib.jsonio import dumps, load_json
from scripts.lib.quotes import prepare_quotes

QUOTE_SEED = "words:v1:cryptogram:quotes"


def build(source_path: Path) -> dict[Path, str]:
    raw = load_json(source_path)
    prepared = prepare_quotes(raw, QUOTE_SEED)
    return {Path("cryptogram-quotes.json"): dumps(prepared)}
