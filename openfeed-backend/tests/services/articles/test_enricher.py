import json
from pathlib import Path

import pytest

from openfeed.db.client import client
from openfeed.db.queries.global_topics import get_global_topics
from openfeed.services.articles.enricher import ArticleEnricher, ArticleMetadata

_FIXTURES_PATH = Path(__file__).parent / "fixtures" / "articles_enriched.jsonl"
_DEBUG_PATH = Path(__file__).parent / "fixtures" / "enricher_debug.txt"
_TOPICS = get_global_topics(client())
_ALLOWED_TOPIC_IDS = {str(topic["id"]) for topic in _TOPICS}


### private ###


def _load_fixtures(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def _fixture_to_text(fixture: dict) -> str:
    return "\n\n".join(filter(None, [fixture["title"], fixture["summary"]]))


def _format_failure(fixture: dict, metadata: ArticleMetadata) -> str:
    expected_topic_ids = fixture.get("topics")
    received_topic_ids = [t["id"] for t in metadata.topics]
    return (
        f"FAIL: {fixture['title']!r}\n"
        f"  expected topics: {expected_topic_ids}\n"
        f"  received topics: {received_topic_ids}\n"
    )


def _check(fixture: dict, metadata: ArticleMetadata) -> str | None:
    invalid_ids = any(t["id"] not in _ALLOWED_TOPIC_IDS for t in metadata.topics)
    duplicate_ids = len({t["id"] for t in metadata.topics}) != len(metadata.topics)
    expected_topics = fixture.get("topics") or []
    received_topic_ids = [t["id"] for t in metadata.topics]
    topics_fail = ("topics" in fixture) and set(expected_topics) != set(
        received_topic_ids
    )
    if invalid_ids or duplicate_ids or topics_fail:
        return _format_failure(fixture, metadata)
    return None


_FIXTURES = _load_fixtures(_FIXTURES_PATH)
_FIXTURE_TEXTS = [_fixture_to_text(f) for f in _FIXTURES]
_RESULTS = ArticleEnricher().enrich_articles(_FIXTURE_TEXTS, _TOPICS)
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
