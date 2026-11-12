from pathlib import Path

from words_data.lib.jsonio import dumps
from words_data.lib.seed import shuffled
from words_data.lib.words import load_pool, words_at_most

ANSWER_MAX_SIZE = 35
GUESS_MAX_SIZE = 80
ANSWER_SEED = "words:v1:wordle:answers"


def build(source_dir: Path, *, minify: bool = False) -> dict[Path, str]:
    pool = load_pool(source_dir / "words-5.tsv", 5)
    answers = shuffled(words_at_most(pool, ANSWER_MAX_SIZE), ANSWER_SEED)
    guesses = words_at_most(pool, GUESS_MAX_SIZE)
    return {
        Path("wordle-answers.json"): dumps(answers, compact=minify),
        Path("wordle-guesses.json"): dumps(guesses, compact=minify),
    }
