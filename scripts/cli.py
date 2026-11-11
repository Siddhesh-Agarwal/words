import unittest
from enum import Enum
from pathlib import Path

import typer

from scripts.generate import check_files, collect, write_files
from scripts.import_scowl import build_source_files
from scripts.lib.jsonio import check_text, write_text
from scripts.validate_data import summary, validate
from scripts.validate_quotes import validate_files

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA_DIR = ROOT / "src" / "data"
DEFAULT_SOURCE_DIR = ROOT / "scripts" / "data" / "source" / "scowl"
DEFAULT_QUOTES_SOURCE = ROOT / "scripts" / "data" / "quotes-source.json"
DEFAULT_QUOTES_OUTPUT = DEFAULT_DATA_DIR / "cryptogram-quotes.json"

app = typer.Typer(no_args_is_help=True, help="Generate and validate the words game data.")


class Only(str, Enum):
    all = "all"
    wordle = "wordle"
    ladder = "ladder"
    crypto = "crypto"


def _fail(message: str) -> None:
    typer.secho(message, err=True, fg=typer.colors.RED)
    raise typer.Exit(1)


def _run_tests(verbose: bool) -> int:
    suite = unittest.TestLoader().discover(str(ROOT / "scripts" / "tests"))
    result = unittest.TextTestRunner(verbosity=2 if verbose else 1).run(suite)
    return 0 if result.wasSuccessful() else 1


@app.command("import-scowl")
def import_scowl_command(
    tarball: Path = typer.Option(
        ...,
        "--tarball",
        exists=True,
        dir_okay=False,
        readable=True,
        help="Path to scowl-2020.12.07.tar.gz.",
    ),
    output_dir: Path = typer.Option(DEFAULT_SOURCE_DIR, "--output-dir"),
    check: bool = typer.Option(False, "--check", help="Compare without writing."),
) -> None:
    """Import the pinned SCOWL tarball into tiered source pools."""
    try:
        files = build_source_files(tarball)
    except (OSError, ValueError) as exc:
        _fail(f"error: {exc}")

    if check:
        drift = [name for name, text in files.items() if not check_text(output_dir / name, text)]
        if drift:
            _fail("drift: " + ", ".join(drift))
        typer.echo("source pools are up to date")
        return

    for name, text in files.items():
        write_text(output_dir / name, text)
    typer.echo(f"wrote {len(files)} source files to {output_dir}")


@app.command()
def generate(
    only: Only = typer.Option(Only.all, "--only", case_sensitive=False),
    check: bool = typer.Option(False, "--check", help="Compare without writing."),
    minify: bool = typer.Option(False, "--minify", help="Write compact JSON with no indentation."),
    data_dir: Path = typer.Option(DEFAULT_DATA_DIR, "--data-dir"),
    source_dir: Path = typer.Option(DEFAULT_SOURCE_DIR, "--source-dir"),
    quotes_source: Path = typer.Option(DEFAULT_QUOTES_SOURCE, "--quotes-source"),
) -> None:
    """Generate the committed JSON datasets."""
    try:
        files = collect(only.value, source_dir, quotes_source, minify=minify)
    except (OSError, ValueError) as exc:
        _fail(f"error: {exc}")

    if check:
        drift = check_files(files, data_dir, only.value)
        if drift:
            _fail("drift: " + ", ".join(drift))
        typer.echo(f"data is up to date ({len(files)} files)")
        return

    write_files(files, data_dir, only.value)
    typer.echo(f"wrote {len(files)} data files to {data_dir}")


@app.command("validate-data")
def validate_data_command(
    data_dir: Path = typer.Option(DEFAULT_DATA_DIR, "--data-dir"),
    source_dir: Path = typer.Option(DEFAULT_SOURCE_DIR, "--source-dir"),
) -> None:
    """Validate counts, word shapes, BFS par, and the committed data contract."""
    errors = validate(data_dir, source_dir)
    if errors:
        for error in errors:
            typer.echo(error, err=True)
        raise typer.Exit(1)
    typer.echo(summary(data_dir))


@app.command("validate-quotes")
def validate_quotes_command(
    source: Path = typer.Option(DEFAULT_QUOTES_SOURCE, "--source"),
    output: Path = typer.Option(DEFAULT_QUOTES_OUTPUT, "--output"),
) -> None:
    """Validate the quote source and the generated quote pool."""
    errors, counts = validate_files(source, output)
    if errors:
        for error in errors:
            typer.echo(error, err=True)
        raise typer.Exit(1)
    typer.echo(f"quotes ok ({counts['short']} short, {counts['medium']} medium, {counts['long']} long)")


@app.command()
def test(verbose: bool = typer.Option(False, "--verbose", "-v")) -> None:
    """Run the Python data test suite."""
    raise typer.Exit(_run_tests(verbose))


@app.command()
def check(
    tarball: Path | None = typer.Option(
        None,
        "--tarball",
        exists=True,
        dir_okay=False,
        readable=True,
        help="Optionally verify the SCOWL source too.",
    ),
    data_dir: Path = typer.Option(DEFAULT_DATA_DIR, "--data-dir"),
    source_dir: Path = typer.Option(DEFAULT_SOURCE_DIR, "--source-dir"),
    quotes_source: Path = typer.Option(DEFAULT_QUOTES_SOURCE, "--quotes-source"),
    minify: bool = typer.Option(False, "--minify", help="Expect compact JSON formatting."),
    verbose: bool = typer.Option(False, "--verbose", "-v"),
) -> None:
    """Run drift, data, quote, and test checks without writing."""
    if tarball is not None:
        try:
            source_files = build_source_files(tarball)
        except (OSError, ValueError) as exc:
            _fail(f"error: {exc}")
        drift = [name for name, text in source_files.items() if not check_text(source_dir / name, text)]
        if drift:
            _fail("source drift: " + ", ".join(drift))
        typer.echo("source pools ok")

    try:
        files = collect("all", source_dir, quotes_source, minify=minify)
    except (OSError, ValueError) as exc:
        _fail(f"error: {exc}")
    drift = check_files(files, data_dir, "all")
    if drift:
        _fail("data drift: " + ", ".join(drift))
    typer.echo(f"generated data ok ({len(files)} files)")

    errors = validate(data_dir, source_dir)
    if errors:
        for error in errors:
            typer.echo(error, err=True)
        raise typer.Exit(1)
    typer.echo(summary(data_dir))

    errors, counts = validate_files(quotes_source, data_dir / "cryptogram-quotes.json")
    if errors:
        for error in errors:
            typer.echo(error, err=True)
        raise typer.Exit(1)
    typer.echo(f"quotes ok ({counts['short']} short, {counts['medium']} medium, {counts['long']} long)")

    if _run_tests(verbose) != 0:
        raise typer.Exit(1)
    typer.secho("all checks passed", fg=typer.colors.GREEN)


if __name__ == "__main__":
    app()
