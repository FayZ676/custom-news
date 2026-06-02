"""
Tagger tests driven by CSV case files under tests/iptc/cases/.
Each CSV covers one behavior group (see README). All share the same schema:

    terms,expected_ids[,label]

Both primary columns are pipe-separated lists. expected_ids may be empty
(non-news cases). label is optional and used for readability only.
The assertion is an ordered equality: search_taxonomy must return exactly the
expected IDs in the expected order — nothing more, nothing less.

To run a single group:
    pytest tests/iptc/test_tagger.py -k 01_exact_match
"""

import csv
from pathlib import Path

import pytest

from openfeed.clients.iptc.tagger import Tagger
from openfeed.clients.iptc.taxonomy import Taxonomy

CASES_DIR = Path(__file__).parent / "cases"
TAGGER = Tagger()


def _parse(value: str) -> list[str]:
    return [v.strip() for v in value.split("|") if v.strip()]


def _cases() -> list[tuple]:
    cases = []
    for path in sorted(CASES_DIR.glob("*.csv")):
        for row in csv.DictReader(path.open()):
            cases.append(
                pytest.param(
                    _parse(row["terms"]),
                    _parse(row["expected_ids"]),
                    id=f"{path.stem}:{row['terms']}",
                )
            )
    return cases


def _format_ids(ids: list[str], taxonomy: Taxonomy) -> list[str]:
    return [
        f"{mid} ({taxonomy[mid].name})" if mid in taxonomy else f"{mid} (unknown)"
        for mid in ids
    ]


@pytest.mark.parametrize("terms,expected_ids", _cases())
def test_search_taxonomy(terms, expected_ids):
    actual_nodes = TAGGER.search_taxonomy(terms)
    actual_ids = [node.medtop_id for node in actual_nodes]
    assert actual_ids == expected_ids, (
        f"terms={terms}\n"
        f"expected={_format_ids(expected_ids, TAGGER.taxonomy)}\n"
        f"actual={_format_ids(actual_ids, TAGGER.taxonomy)}"
    )


def _isolation_results():
    return {
        "single": TAGGER.search_taxonomy(["armed conflict"]),
        "combined": TAGGER.search_taxonomy(["armed conflict", "stock market crash"]),
    }


def test_isolation_single_match():
    isolation_results = _isolation_results()
    assert "16" in {node.medtop_id for node in isolation_results["single"]}


def test_isolation_unrelated_term_preserved():
    isolation_results = _isolation_results()
    single_ids = {node.medtop_id for node in isolation_results["single"]}
    combined_ids = {node.medtop_id for node in isolation_results["combined"]}
    assert single_ids.issubset(combined_ids)
