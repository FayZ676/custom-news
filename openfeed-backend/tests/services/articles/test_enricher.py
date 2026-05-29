import json
from pathlib import Path

from openfeed.clients.iptc.taxonomy import Taxonomy, load_taxonomy
from openfeed.services.articles.enricher import ArticleEnricher, ArticleMetadata

_FIXTURES_PATH = Path(__file__).parent / "fixtures" / "enricher.jsonl"
_DEBUG_PATH = Path(__file__).parent / "fixtures" / "enricher_debug.txt"


def test_enricher():
    fixtures = _load_fixtures(_FIXTURES_PATH)
    taxonomy = load_taxonomy()
    results = ArticleEnricher().extract_article_metadata(
        [_fixture_to_text(f) for f in fixtures]
    )

    checks = [_check(f, m, taxonomy) for f, m in zip(fixtures, results)]
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


def _actual_roots(metadata: ArticleMetadata, taxonomy: Taxonomy) -> set[str]:
    return {
        taxonomy[t["id"]].ancestors[0] for t in metadata.topics if t["id"] in taxonomy
    }


def _format_failure(
    fixture: dict, metadata: ArticleMetadata, taxonomy: Taxonomy
) -> str:
    expected_root = fixture["expected_root"]
    actual_roots = _actual_roots(metadata, taxonomy)
    expected_name = (
        taxonomy[expected_root].name if expected_root in taxonomy else expected_root
    )
    actual_names = {taxonomy[r].name for r in actual_roots}
    return (
        f"FAIL: {fixture['title']!r}\n"
        f"  expected root: {expected_root} ({expected_name})\n"
        f"  actual roots:  {actual_roots or '{none}'} ({actual_names or '{none}'})\n"
        f"  raw topics:    {[t['id'] for t in metadata.topics]}\n"
        f"  significance:  {metadata.significance_score}"
    )


def _check(fixture: dict, metadata: ArticleMetadata, taxonomy: Taxonomy) -> str | None:
    if fixture["expected_root"] is None:
        return None
    root_fail = fixture["expected_root"] not in _actual_roots(metadata, taxonomy)
    sig = fixture["expected_significance"]
    sig_fail = sig is not None and abs(metadata.significance_score - sig) > 0.05
    if root_fail or sig_fail:
        return _format_failure(fixture, metadata, taxonomy)
    return None
