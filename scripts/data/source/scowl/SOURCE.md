# SCOWL source pools

- Source: SCOWL 2020.12.07
- URL: https://downloads.sourceforge.net/project/wordlist/SCOWL/2020.12.07/scowl-2020.12.07.tar.gz
- SHA-256: 5587667caa20c4891390c2d42dbb4d5c4c3f41bee77af1457ece3ba23fb859cc
- Licence: see `Copyright` in this directory.
- Import: `python3 scripts/import_scowl.py --tarball <scowl-2020.12.07.tar.gz>`
- Format: `word<TAB>minimum SCOWL size`, lowercase ASCII `a-z`, no apostrophes or accents.
- Sizes read: 10, 20, 35, 40, 50, 55, 60, 70, 80. Lower is more common.
- Counts after taboo filtering: 3-letter: 1123, 4-letter: 4847, 5-letter: 10938. Removed 21 taboo words.
- Do not edit these files by hand; rerun the importer.
