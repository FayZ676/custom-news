import csv
from pathlib import Path

import pytest

from openfeed.db.client import client
from openfeed.db.queries.global_article_metadata_options import (
    get_global_article_metadata_options,
)
from openfeed.services.articles.enricher import (
    ArticleEnricher,
    ArticleMetadata,
)

_FIXTURES_PATH = Path(__file__).parent / "fixtures" / "articles_enriched.csv"
_DEBUG_PATH = Path(__file__).parent / "fixtures" / "enricher_debug.txt"
_METADATA_OPTIONS = get_global_article_metadata_options(client())
_ALLOWED_TOPIC_IDS = {option.label for option in _METADATA_OPTIONS["topic"]}
_ALLOWED_TYPES = {option.label for option in _METADATA_OPTIONS["type"]}
_ALLOWED_COVERAGE = {option.label for option in _METADATA_OPTIONS["coverage"]}
_ALLOWED_DURATION = {option.label for option in _METADATA_OPTIONS["duration"]}
_ALLOWED_IMPACT = {option.label for option in _METADATA_OPTIONS["impact"]}


### private ###


def _load_fixtures(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as fixture_file:
        rows = csv.DictReader(fixture_file)
        return [
            {
                **row,
                "topic": row["topic"] or None,
                "type": row["type"] or None,
                "coverage": row["coverage"] or None,
                "duration": row["duration"] or None,
                "impact": row["impact"] or None,
            }
            for row in rows
        ]


def _fixture_to_text(fixture: dict) -> str:
    return "\n\n".join(filter(None, [fixture["title"], fixture["summary"]]))


def _format_failure(
    fixture: dict,
    metadata: ArticleMetadata,
    failures: dict[str, bool],
) -> str:
    fields = [
        ("topic", fixture.get("topic") or "*", metadata.topic),
        ("type", fixture.get("type") or "*", metadata.type),
        ("coverage", fixture.get("coverage") or "*", metadata.coverage),
        ("duration", fixture.get("duration") or "*", metadata.duration),
        ("impact", fixture.get("impact") or "*", metadata.impact),
    ]
    mismatch_lines = [
        f"  expected {name}: {expected}\n  received {name}: {received}\n"
        for name, expected, received in fields
        if failures[name]
    ]
    return f"FAIL: {fixture['title']!r}\n" + "".join(mismatch_lines)


def _matches_topic(expected: str | None, received: str) -> bool:
    return received == expected if expected else received in _ALLOWED_TOPIC_IDS


def _matches_expected(expected: str | None, received: str, allowed: set[str]) -> bool:
    return received == expected if expected else received in allowed


def _check(fixture: dict, metadata: ArticleMetadata) -> str | None:
    failures = {
        "topic": not _matches_topic(fixture.get("topic"), metadata.topic),
        "type": not _matches_expected(
            fixture.get("type"), metadata.type, _ALLOWED_TYPES
        ),
        "coverage": not _matches_expected(
            fixture.get("coverage"), metadata.coverage, _ALLOWED_COVERAGE
        ),
        "duration": not _matches_expected(
            fixture.get("duration"), metadata.duration, _ALLOWED_DURATION
        ),
        "impact": not _matches_expected(
            fixture.get("impact"),
            metadata.impact,
            _ALLOWED_IMPACT,
        ),
    }
    if any(failures.values()):
        return _format_failure(fixture, metadata, failures)
    return None


_FIXTURES = _load_fixtures(_FIXTURES_PATH)
_FIXTURE_TEXTS = [_fixture_to_text(f) for f in _FIXTURES]
_RESULTS = ArticleEnricher().enrich_articles(
    _FIXTURE_TEXTS,
    _METADATA_OPTIONS,
)
_CHECKS = [_check(f, m) for f, m in zip(_FIXTURES, _RESULTS)]


_DEBUG_PATH.write_text(
    "\n\n".join(
        c if c is not None else f"PASS: {f['title']!r}"
        for f, c in zip(_FIXTURES, _CHECKS)
    )
)


@pytest.mark.parametrize("check", _CHECKS, ids=[f["title"] for f in _FIXTURES])
def test_enricher(check: str | None):
    assert check is None, check
