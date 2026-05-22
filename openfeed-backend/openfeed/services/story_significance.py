import math
import datetime

from pydantic import BaseModel

from openfeed.database_models import PublicGlobalArticles

# Half-life as a fraction of the clustering window (50% → same decay shape regardless of window size)
_HALF_LIFE_FRACTION: float = 0.5

# Maximum fraction of the remaining headroom (1 - mean_sig) that full coverage
# can add. Significance is always the floor — coverage can only push the score
# upward toward 1.0, never drag it down.
_COVERAGE_WEIGHT: float = 0.2

# Article count at which the coverage bonus is considered saturated (scores ≥ this
# count are treated as equivalent). Prevents a flood of low-quality articles from
# inflating the score beyond what a genuinely well-covered story deserves.
_COVERAGE_MAX_ARTICLES: int = 20


class StorySignificance(BaseModel):
    score: float
    velocity: float


def compute_story_significance(
    articles: list[PublicGlobalArticles],
    now: datetime.datetime,
    window_hours: float,
) -> StorySignificance:
    """
    Score  = mean_sig + (1 - mean_sig) × w_c × normalised_coverage  → [0, 1]
    Significance is the floor; coverage can only push the score upward.

    Velocity = mean(decay_weight) - neutral_baseline
    Positive when articles are front-loaded toward now (breaking/rising),
    negative when back-loaded toward the window edge (fading).
    """
    if not articles:
        return StorySignificance(score=0.0, velocity=0.0)

    scores = [
        a.significance_score for a in articles if a.significance_score is not None
    ]
    if scores:
        mean_sig = sum(scores) / len(scores)
        normalised_coverage = math.log(1 + len(scores)) / math.log(
            1 + _COVERAGE_MAX_ARTICLES
        )
        score = mean_sig + (1 - mean_sig) * _COVERAGE_WEIGHT * normalised_coverage
    else:
        score = 0.0

    decay = math.log(2) / (window_hours * _HALF_LIFE_FRACTION)
    neutral_baseline = (1 - math.exp(-decay * window_hours)) / (decay * window_hours)

    def age_hours(article: PublicGlobalArticles) -> float:
        delta = now - article.published_at
        return max(delta.total_seconds() / 3600, 0.0)

    weights = [math.exp(-decay * age_hours(a)) for a in articles]
    velocity = (sum(weights) / len(weights)) - neutral_baseline

    return StorySignificance(score=score, velocity=velocity)
