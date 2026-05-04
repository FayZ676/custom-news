import uuid
import datetime
from datetime import timezone

import pytest

from openfeed.services.cluster_scoring import score_cluster
from openfeed.database_models import PublicGlobalArticles


def _make_articles(
    n: int, now: datetime.datetime, significance_score: float = 1.0
) -> list[PublicGlobalArticles]:
    """Create n brand-new articles all timestamped at `now`."""
    return [
        PublicGlobalArticles(
            id=uuid.uuid4(),
            title=f"Article {i}",
            url=f"https://example.com/{i}",
            feed_title="Test Feed",
            content=None,
            summary=f"Summary {i}",
            summary_embeddings=None,
            summary_entities=[],
            significance_score=significance_score,
            created_at=now,
            published_at=now,
        )
        for i in range(n)
    ]


def test__score_cluster_larger_cluster_scores_higher():
    now = datetime.datetime.now(timezone.utc)
    small = _make_articles(2, now)
    large = _make_articles(10, now)

    assert score_cluster(large).score > score_cluster(small).score


def test__score_cluster_higher_significance_scores_higher():
    now = datetime.datetime.now(timezone.utc)
    high = _make_articles(5, now, significance_score=0.9)
    low = _make_articles(5, now, significance_score=0.2)

    assert score_cluster(high).score > score_cluster(low).score


@pytest.mark.parametrize("n", [1, 5, 20])
def test__score_cluster_velocity_is_zero(n: int):
    now = datetime.datetime.now(timezone.utc)
    result = score_cluster(_make_articles(n, now))

    assert result.velocity == 0.0


def test__score_cluster_empty_articles_returns_zero():
    result = score_cluster([])

    assert result.score == 0.0
    assert result.velocity == 0.0
