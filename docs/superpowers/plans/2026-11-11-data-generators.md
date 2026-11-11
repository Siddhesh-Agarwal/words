# Data Generators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and validate deterministic, committed JSON for Wordle, Word Ladder, and Cryptogram from SCOWL 2020.12.07.

**Architecture:** A one-time importer converts the pinned SCOWL tarball into compact tiered TSVs. Pure-Python generators read those pools and emit committed JSON. Wordle emits two lists; Ladder emits a dictionary, manifest, and 84 ten-year chunks covering all valid pairs; Cryptogram validates and shuffles an authored quote source. A driver supports write and drift-check modes, and validators re-check every invariant.

**Tech Stack:** Python 3 standard library, JSON, unittest, pnpm scripts, Vite/React repo unchanged.

**Spec:** `docs/superpowers/specs/2026-11-11-data-generators-design.md`

## Global Constraints

- No new dependencies; Python standard library only.
- No network calls in generators or validators.
- Every generated JSON file is committed.
- Static site: no backend, no SSR, no runtime API calls.
- Seed labels are exactly `words:v1:wordle:answers`, `words:v1:ladder:pairs`, `words:v1:cryptogram:quotes`.
- Ladder pairs use `par` = number of single-letter changes, range 4-7.
- Do not change puzzle selection or data ordering casually; flag it if required.
- Run `pnpm run lint` and `pnpm run build` before claiming completion. There is no `pnpm test` in this repo yet.

## Review Focus

- A word containing an apostrophe, accent, uppercase letter, or non-ASCII character must never enter a word pool.
- A ladder pair whose BFS distance differs from its recorded `par` must fail validation.
- A duplicated ladder pair, including a reversed pair, must fail validation.
- A quote with digits, curly punctuation, fewer than 15 distinct letters, or a duplicate normalized text must fail validation.
- A source or seed change must surface as deterministic drift, not silently reorder data.

---

### Task 1: Seed, JSON, and word-pool helpers

**Files:**
- Create: `scripts/lib/__init__.py`
- Create: `scripts/lib/seed.py`
- Create: `scripts/lib/jsonio.py`
- Create: `scripts/lib/words.py`
- Create: `scripts/tests/__init__.py`
- Create: `scripts/tests/test_seed.py`
- Create: `scripts/tests/test_words.py`

**Interfaces:**
- Produces: `Mulberry32(seed: int).next() -> float`
- Produces: `seed_from_label(label: str) -> int`
- Produces: `shuffled(items: Sequence[T], label: str) -> list[T]`
- Produces: `dumps(data: Any, *, compact: bool = False) -> str`
- Produces: `write_text(path: Path, text: str) -> None`
- Produces: `check_text(path: Path, text: str) -> bool`
- Produces: `load_pool(path: Path, length: int) -> dict[str, int]`
- Produces: `words_at_most(pool: Mapping[str, int], max_size: int) -> list[str]`
- Produces: `load_taboo(path: Path) -> set[str]`

- [ ] **Step 1: Write failing tests for the PRNG, shuffle, JSON, and pool loader**

`test_seed.py`:
```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from lib.seed import Mulberry32, seed_from_label, shuffled

def test_mulberry32_matches_js():
    rng = Mulberry32(12345)
    assert [rng.next() for _ in range(3)] == [0.33290840918289125, 0.73709917999752, 0.257149966666475]

def test_seed_from_label_is_stable():
    assert seed_from_label("words:v1:test") == seed_from_label("words:v1:test")
    assert seed_from_label("a") != seed_from_label("b")

def test_shuffle_is_deterministic_and_complete():
    items = list("abcdefghij")
    a = shuffled(items, "words:v1:test")
    b = shuffled(items, "words:v1:test")
    assert a == b
    assert sorted(a) == sorted(items)
    assert a != items
```

`test_words.py`:
```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from lib.jsonio import dumps
from lib.words import load_pool, words_at_most

def test_dumps_pretty_and_compact():
    assert dumps(["a", "b"]) == '[\n  "a",\n  "b"\n]\n'
    assert dumps(["a", "b"], compact=True) == '["a","b"]\n'

def test_load_pool_and_filter(tmp_path):
    path = tmp_path / "words-5.tsv"
    path.write_text("crane\t10\nslate\t35\nzzzzz\t80\n", encoding="utf-8")
    pool = load_pool(path, 5)
    assert pool == {"crane": 10, "slate": 35, "zzzzz": 80}
    assert words_at_most(pool, 35) == ["crane", "slate"]
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest scripts/tests/test_seed.py scripts/tests/test_words.py -v`
Expected: FAIL with `ModuleNotFoundError` for `lib`.

- [ ] **Step 3: Implement the helpers**

`seed.py`: mulberry32 with 32-bit masking, SHA-256 seed label, Fisher-Yates using `int(rng.next() * (i + 1))`.
`jsonio.py`: `json.dumps(..., indent=2, ensure_ascii=True) + "\n"`; compact uses `separators=(",", ":")`.
`words.py`: parse tab-separated `word<TAB>size`; reject malformed lines, wrong length, non-`a-z`, or size outside `{10,20,35,40,50,55,60,70,80}`; reject duplicate words. `words_at_most` returns sorted words.

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest scripts/tests/test_seed.py scripts/tests/test_words.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib scripts/tests
git commit -m "core: add deterministic seed and word-pool helpers"
```

---

### Task 2: SCOWL importer and tiered source pools

**Files:**
- Create: `scripts/import_scowl.py`
- Create: `scripts/tests/test_import.py`
- Create: `scripts/data/source/scowl/words-3.tsv`, `words-4.tsv`, `words-5.tsv`, `taboo.txt`, `Copyright`, `SOURCE.md`

**Interfaces:**
- Consumes: `dumps`, `write_text`, `check_text`, `seed_from_label` from Task 1.
- Produces: `import_scowl(tarball: Path, output_dir: Path, *, verify_checksum: bool = True) -> dict[str, int]`
- Produces: `build_source_files(tarball: Path, *, verify_checksum: bool = True) -> dict[str, str]` keyed by filename.
- Produces CLI: `python3 scripts/import_scowl.py --tarball PATH [--check]`

- [ ] **Step 1: Write the failing importer test**

Create a temporary tarball with `pkg/final/english-words.10` (`cat`, `dog`, `toolong`, `Abc`, `can't`), `pkg/final/english-words.20` (`cat`, `bird`, `cafe\xe9`), `pkg/misc/offensive.1` (`dog`), and `pkg/Copyright` (`test licence`). Call `build_source_files(..., verify_checksum=False)` and assert:
```python
files["words-3.tsv"] == "bird\t20\ncat\t10\n"
"dog" not in files["words-3.tsv"]
files["taboo.txt"] == "dog\n"
files["Copyright"] == "test licence\n"
"words-4.tsv" in files and files["words-4.tsv"] == ""
```
Also assert `words-5.tsv` is empty and `SOURCE.md` mentions the pinned SHA.

- [ ] **Step 2: Run it to verify failure**

Run: `python3 -m unittest scripts/tests/test_import.py -v`
Expected: FAIL with missing module.

- [ ] **Step 3: Implement the importer**

- Constants: version, URL, SHA-256, sizes, lengths.
- `build_source_files`: verify SHA unless disabled; open tarball with `tarfile`; locate `final/english-words.{size}` members and the root `Copyright` and `misc/` taboo files; decode Latin-1; filter `^[a-z]{3,5}$`; keep minimum size per word; remove taboo; emit sorted TSVs, sorted taboo, verbatim Copyright, and deterministic `SOURCE.md` with counts.
- `import_scowl`: call `build_source_files`, write or compare (`--check`), create output dir.
- CLI: `--tarball` required, `--output-dir` default `scripts/data/source/scowl`, `--check`.

- [ ] **Step 4: Run the unit test**

Run: `python3 -m unittest scripts/tests/test_import.py -v`
Expected: PASS.

- [ ] **Step 5: Import the real pinned tarball**

Run:
```bash
python3 scripts/import_scowl.py --tarball /tmp/opencode/scowl-check/scowl.tar.gz
python3 scripts/import_scowl.py --tarball /tmp/opencode/scowl-check/scowl.tar.gz --check
```
Expected counts: 3-letter 1,123; 4-letter 4,847; 5-letter 10,938. `--check` exits 0.

- [ ] **Step 6: Commit**

```bash
git add scripts/import_scowl.py scripts/tests/test_import.py scripts/data/source/scowl
git commit -m "core: vendor SCOWL tiered word pools"
```

---

### Task 3: Wordle generator and data

**Files:**
- Create: `scripts/gen_wordle.py`
- Create: `scripts/tests/test_wordle.py`
- Create: `src/data/wordle-answers.json`, `src/data/wordle-guesses.json`

**Interfaces:**
- Consumes: `load_pool`, `words_at_most`, `shuffled`, `dumps`.
- Produces: `build(source_dir: Path) -> dict[Path, str]` with keys `Path("wordle-answers.json")` and `Path("wordle-guesses.json")`.
- Produces CLI: `python3 scripts/gen_wordle.py [--check]`

- [ ] **Step 1: Write failing generator tests**

Using a temp `words-5.tsv` with at least 6 five-letter words across sizes 10 and 35, assert:
- answers and guesses parse as JSON lists;
- every answer is in guesses;
- answers are unique and all match `^[a-z]{5}$`;
- guesses are sorted;
- running `build` twice returns identical text.

- [ ] **Step 2: Run to verify failure**

Run: `python3 -m unittest scripts/tests/test_wordle.py -v`
Expected: FAIL.

- [ ] **Step 3: Implement `build`**

Answers = `shuffled(words_at_most(pool, 35), "words:v1:wordle:answers")`.
Guesses = `words_at_most(pool, 80)`.
Return `dumps` for both files. CLI writes to `src/data` or compares with `--check`.

- [ ] **Step 4: Generate real data and verify counts**

Run:
```bash
python3 scripts/gen_wordle.py
python3 scripts/gen_wordle.py --check
python3 - <<'PY'
import json
a=json.load(open("src/data/wordle-answers.json"))
g=json.load(open("src/data/wordle-guesses.json"))
assert len(a)==3416, len(a)
assert len(g)==10938, len(g)
assert set(a) <= set(g)
print("wordle ok", len(a), len(g))
PY
```

- [ ] **Step 5: Commit**

```bash
git add scripts/gen_wordle.py scripts/tests/test_wordle.py src/data/wordle-answers.json src/data/wordle-guesses.json
git commit -m "wordle: generate answer and guess lists"
```

---

### Task 4: Ladder graph, generator, and full pair schedule

**Files:**
- Create: `scripts/lib/ladder.py`
- Create: `scripts/gen_ladder.py`
- Create: `scripts/tests/test_ladder.py`
- Create: `src/data/ladder-dictionary.json`, `src/data/ladder/manifest.json`, `src/data/ladder/000.json` ... `083.json`

**Interfaces:**
- Consumes: `load_pool`, `words_at_most`, `shuffled`, `dumps`.
- Produces: `build_graph(words: Iterable[str]) -> dict[str, set[str]]`
- Produces: `largest_component(graph: Mapping[str, set[str]]) -> set[str]`
- Produces: `shortest_distances(graph: Mapping[str, set[str]], start: str, max_depth: int = 7) -> dict[str, int]`
- Produces: `candidate_pairs(graph, endpoints, min_par=4, max_par=7) -> list[tuple[str, str, int]]`
- Produces: `chunked(items: Sequence[T], size: int) -> list[list[T]]`
- Produces: `build(source_dir: Path) -> dict[Path, str]` with keys `ladder-dictionary.json`, `ladder/manifest.json`, and `ladder/NNN.json`.
- Produces CLI: `python3 scripts/gen_ladder.py [--check]`

- [ ] **Step 1: Write failing graph tests**

Use the chain `cat -> cot -> cog -> dog -> dig -> din -> don -> dot`. Assert:
- `shortest_distances(graph, "cat")["dot"] == 7`;
- `candidate_pairs(graph, {"cat", "dot"}) == [("cat", "dot", 7)]`;
- `largest_component` drops an isolated word;
- `chunked(list(range(10)), 3)` has sizes `[3, 3, 3, 1]`.

- [ ] **Step 2: Run to verify failure**

Run: `python3 -m unittest scripts/tests/test_ladder.py -v`
Expected: FAIL.

- [ ] **Step 3: Implement the graph helpers**

Wildcard buckets for one-letter-change adjacency; BFS capped at `max_depth`; endpoints sorted; pairs emitted only when `start < end`; `par` is the BFS distance.

- [ ] **Step 4: Write and run the generator test**

Temp `words-4.tsv` with the 8-word chain, all at size 10. Assert `build` emits a dictionary of 8 words, a manifest with `totalPairs == 1` and `chunkCount == 1`, and one pair `{"start": "cat", "end": "dot", "par": 7}`. Assert two `build` calls are identical.

Run: `python3 -m unittest scripts/tests/test_ladder.py -v`
Expected: PASS.

- [ ] **Step 5: Generate real data and verify**

```bash
python3 scripts/gen_ladder.py
python3 scripts/gen_ladder.py --check
python3 - <<'PY'
import json, pathlib
d=json.load(open("src/data/ladder-dictionary.json"))
m=json.load(open("src/data/ladder/manifest.json"))
chunks=sorted(pathlib.Path("src/data/ladder").glob("[0-9][0-9][0-9].json"))
assert len(d)==2139, len(d)
assert m["totalPairs"]==303316, m["totalPairs"]
assert len(chunks)==84, len(chunks)
assert sum(len(json.load(open(p))) for p in chunks)==m["totalPairs"]
print("ladder ok", len(d), m["totalPairs"], len(chunks))
PY
```

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/ladder.py scripts/gen_ladder.py scripts/tests/test_ladder.py src/data/ladder-dictionary.json src/data/ladder
git commit -m "ladder: generate dictionary and full pair schedule"
```

---

### Task 5: Cryptogram quote library, pool, and validators

**Files:**
- Create: `scripts/lib/quotes.py`
- Create: `scripts/gen_cryptogram.py`
- Create: `scripts/validate_quotes.py`
- Create: `scripts/data/quotes-source.json`
- Create: `scripts/tests/test_quotes.py`
- Create: `src/data/cryptogram-quotes.json`

**Interfaces:**
- Consumes: `shuffled`, `dumps`.
- Produces: `normalize_text(text: str) -> str`
- Produces: `distinct_letter_count(text: str) -> int`
- Produces: `validate_entry(entry: Mapping[str, Any], *, require_source: bool) -> list[str]`
- Produces: `prepare_quotes(raw: list[dict[str, Any]], seed_label: str) -> list[dict[str, Any]]`
- Produces: `validate_output(entries: list[dict[str, Any]]) -> list[str]`
- Produces: `tier_counts(entries: list[dict[str, Any]]) -> dict[str, int]`
- Produces: `build(source_path: Path) -> dict[Path, str]`
- Produces CLI: `python3 scripts/gen_cryptogram.py [--check]`, `python3 scripts/validate_quotes.py`

- [ ] **Step 1: Write failing quote tests**

Assert:
- `normalize_text("“Don’t — stop…”") == '"Don\'t - stop..."'`;
- a valid 40-120 char quote with >= 15 distinct letters passes;
- a quote with a digit, curly punctuation left unnormalized, or `<15` distinct letters fails;
- a duplicate normalized text fails;
- `prepare_quotes` strips `source`, preserves IDs, and shuffles deterministically;
- `tier_counts` buckets `<60`, `60-87`, `>=88`.

- [ ] **Step 2: Run to verify failure**

Run: `python3 -m unittest scripts/tests/test_quotes.py -v`
Expected: FAIL.

- [ ] **Step 3: Implement the quote library**

Allowed characters: ASCII letters, space, and `. , ; : ' " ! ? ( ) -`. No digits. IDs match `^q\d{4}$`. Categories `quote`, `proverb`, `tech`. `quote`/`tech` require attribution; `proverb` may have `null`. Source entries require a non-empty `source`; output entries must not contain it. Duplicate detection uses normalized, case-folded text.

- [ ] **Step 4: Author 60 quote source entries**

`scripts/data/quotes-source.json` with 20 `quote`, 20 `proverb`, 20 `tech`, each with an ID, normalized text, attribution, category, and source. Tech entries cite a primary source (paper, book, or author archive). Proverbs use a traditional source note and `attribution: null`. Run `validate_quotes.py` and adjust until all pass and each length tier has at least 10 entries.

- [ ] **Step 5: Generate and validate**

```bash
python3 scripts/gen_cryptogram.py
python3 scripts/gen_cryptogram.py --check
python3 scripts/validate_quotes.py
```

Expected: 60 quotes, no errors, tier counts printed.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/quotes.py scripts/gen_cryptogram.py scripts/validate_quotes.py scripts/data/quotes-source.json scripts/tests/test_quotes.py src/data/cryptogram-quotes.json
git commit -m "crypto: add quote pool and validator"
```

---

### Task 6: Driver, whole-data validator, scripts, and docs

**Files:**
- Create: `scripts/generate.py`
- Create: `scripts/validate_data.py`
- Create: `scripts/tests/test_committed_data.py`
- Create: `scripts/README.md`
- Modify: `package.json`
- Modify: `biome.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `build` from `gen_wordle`, `gen_ladder`, `gen_cryptogram`; validation helpers from `lib`.
- Produces CLI: `python3 scripts/generate.py [--only all|wordle|ladder|crypto] [--check]`
- Produces CLI: `python3 scripts/validate_data.py`

- [ ] **Step 1: Write the failing committed-data test**

`test_committed_data.py` calls `validate_data.validate(Path("src/data"), Path("scripts/data/source/scowl"))` and asserts no errors. Add assertions for exact counts: Wordle 3,416/10,938, ladder dictionary 2,139, pairs 303,316, chunks 84, quotes 60.

- [ ] **Step 2: Implement `generate.py`**

Import the three `build` functions. Merge their `dict[Path, str]` outputs. In write mode create parents, write files, and remove stale `src/data/ladder/[0-9][0-9][0-9].json` not in the expected set. In `--check` mode compare bytes and report every drift, exiting 1.

- [ ] **Step 3: Implement `validate_data.py`**

Checks:
- Wordle: 5-letter `a-z`, unique, guesses sorted, answers subset, count ranges, no taboo.
- Ladder: dictionary 4-letter unique sorted and connected; manifest fields; chunk sizes; flatten pairs; unique unordered pairs; endpoints in dictionary; `4 <= par <= 7`; BFS distance equals `par` using cached distances per start.
- Quotes: `validate_output`, count >= 45, tier counts >= 10 each.
Print counts and all errors; exit 1 on errors.

- [ ] **Step 4: Wire scripts and config**

`package.json` add:
```json
"import:scowl": "python3 scripts/import_scowl.py",
"generate:data": "python3 scripts/generate.py",
"validate:data": "python3 scripts/validate_data.py",
"validate:quotes": "python3 scripts/validate_quotes.py",
"test:data": "python3 -m unittest discover -s scripts/tests -v",
"check:data": "python3 scripts/generate.py --check && python3 scripts/validate_data.py && python3 -m unittest discover -s scripts/tests"
```
`biome.json` add `"!**/src/data/**"` to `files.includes`.
`.gitignore` add `scowl-*.tar.gz` and `scowl-*/`.
`scripts/README.md` documents the source URL/SHA, import command, regenerate/check commands, output layout, seed policy, and quote source schema.

- [ ] **Step 5: Run the full pipeline**

```bash
python3 scripts/generate.py --check
python3 scripts/validate_data.py
python3 -m unittest discover -s scripts/tests -v
pnpm run lint
pnpm run build
```

Expected: all pass. If `pnpm run build` fails for pre-existing reasons, record the exact error and do not claim a successful build.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate.py scripts/validate_data.py scripts/tests/test_committed_data.py scripts/README.md package.json biome.json .gitignore
git commit -m "core: add data generation and validation pipeline"
```

---

### Task 7: Final verification

- [ ] **Step 1: Re-run every check from a clean state**

```bash
python3 scripts/import_scowl.py --tarball /tmp/opencode/scowl-check/scowl.tar.gz --check
python3 scripts/generate.py --check
python3 scripts/validate_data.py
python3 scripts/validate_quotes.py
python3 -m unittest discover -s scripts/tests -v
pnpm run lint
pnpm run build
```

- [ ] **Step 2: Inspect the diff**

Confirm no generated file contains an answer in share text, no source tarball was committed, and `src/data` totals match the manifest.

- [ ] **Step 3: Commit any fixes**

Use a game-prefixed commit message.
