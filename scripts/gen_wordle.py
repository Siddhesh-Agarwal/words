from pathlib import Path

from scripts.lib.jsonio import dumps
from scripts.lib.seed import shuffled
from scripts.lib.words import load_pool, words_at_most

ANSWER_MAX_SIZE = 35
GUESS_MAX_SIZE = 80
ANSWER_SEED = "words:v1:wordle:answers"


def build(source_dir: Path) -> dict[Path, str]:
    pool = load_pool(source_dir / "words-5.tsv", 5)
    answers = shuffled(words_at_most(pool, ANSWER_MAX_SIZE), ANSWER_SEED)
    guesses = words_at_most(pool, GUESS_MAX_SIZE)
    return {
        Path("wordle-answers.json"): dumps(answers),
        Path("wordle-guesses.json"): dumps(guesses),
    }
