import uuid
import datetime
from datetime import timezone, timedelta

from openfeed.services.cluster_scoring import score_cluster
from openfeed.database_models import PublicGlobalArticles


def _make_article(
    published_at: datetime.datetime,
    significance_score: float = 1.0,
) -> PublicGlobalArticles:
    return PublicGlobalArticles(
        id=uuid.uuid4(),
        title="Article",
        url=f"https://example.com/{uuid.uuid4()}",
        feed_title="Test Feed",
        content=None,
        summary="Summary",
        summary_embeddings=None,
        summary_entities=[],
        significance_score=significance_score,
        created_at=published_at,
        published_at=published_at,
    )


def _make_articles(
    n: int,
    published_at: datetime.datetime,
    significance_score: float = 1.0,
) -> list[PublicGlobalArticles]:
    """Create n articles all published at the given timestamp."""
    return [_make_article(published_at, significance_score) for _ in range(n)]


_WINDOW_HOURS = 72.0


def test__score_cluster_larger_cluster_scores_higher():
    now = datetime.datetime.now(timezone.utc)
    small = _make_articles(2, now)
    large = _make_articles(10, now)

    assert (
        score_cluster(large, now, _WINDOW_HOURS).score
        > score_cluster(small, now, _WINDOW_HOURS).score
    )


def test__score_cluster_higher_significance_scores_higher():
    now = datetime.datetime.now(timezone.utc)
    high = _make_articles(5, now, significance_score=0.9)
    low = _make_articles(5, now, significance_score=0.2)

    assert (
        score_cluster(high, now, _WINDOW_HOURS).score
        > score_cluster(low, now, _WINDOW_HOURS).score
    )


def test__score_cluster_empty_articles_returns_zero():
    now = datetime.datetime.now(timezone.utc)
    result = score_cluster([], now, _WINDOW_HOURS)

    assert result.score == 0.0
    assert result.velocity == 0.0


def test__score_cluster_breaking_story_has_positive_velocity():
    """All articles just published → velocity well above neutral baseline."""
    now = datetime.datetime.now(timezone.utc)
    articles = _make_articles(5, now)

    assert score_cluster(articles, now, _WINDOW_HOURS).velocity > 0.0


def test__score_cluster_fading_story_has_negative_velocity():
    """All articles near the end of the 72h window → velocity below neutral baseline."""
    now = datetime.datetime.now(timezone.utc)
    articles = _make_articles(5, now - timedelta(hours=71))

    assert score_cluster(articles, now, _WINDOW_HOURS).velocity < 0.0


def test__score_cluster_velocity_breaking_greater_than_fading():
    now = datetime.datetime.now(timezone.utc)
    breaking = _make_articles(5, now)
    fading = _make_articles(5, now - timedelta(hours=71))

    assert (
        score_cluster(breaking, now, _WINDOW_HOURS).velocity
        > score_cluster(fading, now, _WINDOW_HOURS).velocity
    )
