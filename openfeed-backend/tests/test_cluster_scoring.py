import uuid
import datetime
from datetime import timezone

import pytest

from openfeed.services.cluster_scoring import score_cluster
from openfeed.database_models import PublicGlobalArticles


def _make_articles(n: int, now: datetime.datetime) -> list[PublicGlobalArticles]:
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
            created_at=now,
            published_at=now,
        )
        for i in range(n)
    ]


def test__score_cluster_larger_cluster_scores_higher():
    now = datetime.datetime.now(timezone.utc)
    small = _make_articles(2, now)
    large = _make_articles(10, now)

    assert (
        score_cluster(large, topic_impact=1.0).score
        > score_cluster(small, topic_impact=1.0).score
    )


def test__score_cluster_higher_topic_impact_scores_higher():
    now = datetime.datetime.now(timezone.utc)
    articles = _make_articles(5, now)

    assert (
        score_cluster(articles, topic_impact=1.8).score
        > score_cluster(articles, topic_impact=0.2).score
    )


def test__score_cluster_topic_impact_clamped_at_minimum():
    now = datetime.datetime.now(timezone.utc)
    articles = _make_articles(5, now)

    assert score_cluster(articles, topic_impact=0.0).score == pytest.approx(
        score_cluster(articles, topic_impact=0.1).score
    )


def test__score_cluster_topic_impact_clamped_at_maximum():
    now = datetime.datetime.now(timezone.utc)
    articles = _make_articles(5, now)

    assert score_cluster(articles, topic_impact=99.0).score == pytest.approx(
        score_cluster(articles, topic_impact=2.0).score
    )


@pytest.mark.parametrize("n,impact", [(1, 0.5), (5, 1.0), (20, 2.0)])
def test__score_cluster_velocity_within_bounds(n: int, impact: float):
    now = datetime.datetime.now(timezone.utc)
    result = score_cluster(_make_articles(n, now), topic_impact=impact)

    assert -1.0 <= result.velocity <= 1.0


def test__score_cluster_empty_articles_returns_zero():
    result = score_cluster([], topic_impact=1.0)

    assert result.score == 0.0
    assert result.velocity == 0.0


def test__score_cluster_newer_cluster_has_higher_velocity_than_older():
    now = datetime.datetime.now(timezone.utc)
    old = now - datetime.timedelta(hours=48)

    newer_small = _make_articles(3, now)
    older_large = _make_articles(10, old)

    velocity_newer = score_cluster(newer_small, topic_impact=1.0).velocity
    velocity_older = score_cluster(older_large, topic_impact=1.0).velocity

    assert velocity_newer > velocity_older, (
        "A smaller cluster of newer articles should have higher velocity "
        "than a larger cluster of older articles"
    )


def test__score_cluster_same_spacing_newer_cluster_has_higher_velocity():
    now = datetime.datetime.now(timezone.utc)
    newer = [
        _make_articles(1, now - datetime.timedelta(hours=h))[0] for h in range(0, 10, 2)
    ]
    older = [
        _make_articles(1, now - datetime.timedelta(hours=h))[0]
        for h in range(48, 58, 2)
    ]

    velocity_newer = score_cluster(newer, topic_impact=1.0).velocity
    velocity_older = score_cluster(older, topic_impact=1.0).velocity

    assert velocity_newer > velocity_older, (
        "Clusters with identical internal spacing should have higher velocity "
        "when anchored closer to now"
    )
