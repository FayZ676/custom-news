import uuid
import datetime
from datetime import timezone, timedelta

from openfeed.services.extraction import compute_significance_score
from openfeed.db.models import PublicGlobalArticles


def _make_article(
    published_at: datetime.datetime,
    significance_score: float = 1.0,
) -> PublicGlobalArticles:
    return PublicGlobalArticles(
        id=uuid.uuid4(),
        title="Article",
        url=f"https://example.com/{uuid.uuid4()}",
        feed_title="Test Feed",
        summary="Summary",
        summary_embeddings=None,
        summary_entities=[],
        significance_score=significance_score,
        created_at=published_at,
        published_at=published_at,
        image_url="",
    )


def _make_articles(
    n: int,
    published_at: datetime.datetime,
    significance_score: float = 1.0,
) -> list[PublicGlobalArticles]:
    """Create n articles all published at the given timestamp."""
    return [_make_article(published_at, significance_score) for _ in range(n)]


_WINDOW_HOURS = 72.0


def test__compute_significance_score_higher_significance_scores_higher():
    """Higher per-article significance should score higher, all else equal."""
    now = datetime.datetime.now(timezone.utc)
    high = _make_articles(5, now, significance_score=0.9)
    low = _make_articles(5, now, significance_score=0.2)

    assert (
        compute_significance_score(high, now, _WINDOW_HOURS).score
        > compute_significance_score(low, now, _WINDOW_HOURS).score
    )


def test__compute_significance_score_score_bounded_between_zero_and_one():
    """Score must always sit in [0, 1] regardless of cluster size or significance."""
    now = datetime.datetime.now(timezone.utc)
    for n in [1, 5, 20, 100]:
        for sig in [0.0, 0.5, 1.0]:
            result = compute_significance_score(
                _make_articles(n, now, sig), now, _WINDOW_HOURS
            )
            assert (
                0.0 <= result.score <= 1.0
            ), f"score {result.score} out of bounds for n={n}, sig={sig}"


def test__compute_significance_score_high_significance_single_article_beats_low_significance_flood():
    """A highly significant breaking story with one source should outrank a
    mediocre story that happened to get picked up by many outlets.
    """
    now = datetime.datetime.now(timezone.utc)
    important = _make_articles(1, now, significance_score=0.8)
    noise = _make_articles(20, now, significance_score=0.3)

    assert (
        compute_significance_score(important, now, _WINDOW_HOURS).score
        > compute_significance_score(noise, now, _WINDOW_HOURS).score
    )


def test__compute_significance_score_coverage_never_lowers_score():
    """Adding more articles to a cluster should never decrease its score."""
    now = datetime.datetime.now(timezone.utc)
    for sig in [0.0, 0.5, 1.0]:
        one = compute_significance_score(
            _make_articles(1, now, sig), now, _WINDOW_HOURS
        ).score
        many = compute_significance_score(
            _make_articles(10, now, sig), now, _WINDOW_HOURS
        ).score
        assert many >= one, f"score dropped from {one} to {many} for sig={sig}"


def test__compute_significance_score_empty_articles_returns_zero():
    now = datetime.datetime.now(timezone.utc)
    result = compute_significance_score([], now, _WINDOW_HOURS)

    assert result.score == 0.0
    assert result.velocity == 0.0


def test__compute_significance_score_breaking_story_has_positive_velocity():
    """All articles just published → velocity well above neutral baseline."""
    now = datetime.datetime.now(timezone.utc)
    articles = _make_articles(5, now)

    assert compute_significance_score(articles, now, _WINDOW_HOURS).velocity > 0.0


def test__compute_significance_score_fading_story_has_negative_velocity():
    """All articles near the end of the 72h window → velocity below neutral baseline."""
    now = datetime.datetime.now(timezone.utc)
    articles = _make_articles(5, now - timedelta(hours=71))

    assert compute_significance_score(articles, now, _WINDOW_HOURS).velocity < 0.0
