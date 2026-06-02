import json
from pathlib import Path

from openfeed.services.articles.enricher import ArticleEnricher, ArticleMetadata

_FIXTURES_PATH = Path(__file__).parent / "fixtures" / "articles_enriched.jsonl"
_DEBUG_PATH = Path(__file__).parent / "fixtures" / "enricher_debug.txt"
_ALLOWED_TOPIC_IDS = {f"{i:02d}" for i in range(1, 18)}


def test_enricher():
    fixtures = _load_fixtures(_FIXTURES_PATH)
    results = ArticleEnricher().enrich_articles([_fixture_to_text(f) for f in fixtures])

    checks = [_check(f, m) for f, m in zip(fixtures, results)]
    failures = [c for c in checks if c is not None]

    _DEBUG_PATH.write_text(
        "\n\n".join(
            c if c is not None else f"PASS: {f['title']!r}"
            for f, c in zip(fixtures, checks)
        )
    )

    assert (
        not failures
    ), f"{len(failures)}/{len(fixtures)} fixture(s) failed — see {_DEBUG_PATH.name}"


### private ###


def _load_fixtures(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def _fixture_to_text(fixture: dict) -> str:
    return "\n\n".join(filter(None, [fixture["title"], fixture["summary"]]))


def _format_failure(fixture: dict, metadata: ArticleMetadata) -> str:
    invalid_topic_ids = [
        t["id"] for t in metadata.topics if t["id"] not in _ALLOWED_TOPIC_IDS
    ]
    duplicate_topic_ids = [
        topic_id
        for topic_id in {t["id"] for t in metadata.topics}
        if sum(1 for t in metadata.topics if t["id"] == topic_id) > 1
    ]
    return (
        f"FAIL: {fixture['title']!r}\n"
        f"  invalid topic ids: {invalid_topic_ids or '{none}'}\n"
        f"  duplicate topic ids: {duplicate_topic_ids or '{none}'}\n"
        f"  raw topics:    {[t['id'] for t in metadata.topics]}"
    )


def _check(fixture: dict, metadata: ArticleMetadata) -> str | None:
    invalid_ids = any(t["id"] not in _ALLOWED_TOPIC_IDS for t in metadata.topics)
    duplicate_ids = len({t["id"] for t in metadata.topics}) != len(metadata.topics)
    expected_topics = fixture.get("topics")
    topics_fail = ("topics" in fixture) and expected_topics != [
        t["id"] for t in metadata.topics
    ]
    if invalid_ids or duplicate_ids or topics_fail:
        return _format_failure(fixture, metadata)
    return None
