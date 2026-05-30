"""
Tagger tests driven by CSV case files under tests/iptc/cases/.
Each CSV covers one behavior group (see README). All share the same schema:

    terms,expected_ids

Both columns are pipe-separated lists. expected_ids may be empty (non-news cases).
The assertion is an ordered equality: search_taxonomy must return exactly the
expected IDs in the expected order — nothing more, nothing less.

To run a single group:
    pytest tests/iptc/test_tagger.py -k 01_exact_match
"""

import csv
from pathlib import Path

import pytest

from openfeed.clients.iptc.tagger import search_taxonomy
from openfeed.clients.iptc.taxonomy import Taxonomy, load_taxonomy

CASES_DIR = Path(__file__).parent / "cases"


@pytest.fixture(scope="module")
def taxonomy() -> Taxonomy:
    return load_taxonomy()


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


@pytest.mark.parametrize("terms,expected_ids", _cases())
def test_search_taxonomy(taxonomy, terms, expected_ids):
    assert search_taxonomy(terms, taxonomy) == expected_ids


@pytest.fixture(scope="module")
def isolation_results(taxonomy):
    return {
        "single": search_taxonomy(["armed conflict"], taxonomy),
        "combined": search_taxonomy(["armed conflict", "stock market crash"], taxonomy),
    }


def test_single_exact_match_is_sufficient(isolation_results):
    assert "medtop:20000056" in isolation_results["single"]


def test_adding_unrelated_term_preserves_existing_result(isolation_results):
    assert all(
        mid in isolation_results["combined"] for mid in isolation_results["single"]
    )
