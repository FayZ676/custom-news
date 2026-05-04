import math
import datetime

from pydantic import BaseModel

from openfeed.database_models import PublicGlobalArticles

# Half-life as a fraction of the clustering window (50% → same decay shape regardless of window size)
_HALF_LIFE_FRACTION: float = 0.5


class ClusterScore(BaseModel):
    score: float
    velocity: float


def score_cluster(
    articles: list[PublicGlobalArticles],
    now: datetime.datetime,
    window_hours: float,
) -> ClusterScore:
    """
    Cluster significance = mean(significance_score) * log(1 + size)

    - mean(significance_score): quality signal per article, assigned at ingestion.
    - log(1 + size):            coverage signal — how many sources picked this up?

    Velocity = mean(decay_weight) - neutral_baseline

    Each article is weighted by e^(-λ * age_hours), where λ = log(2) / half_life.
    The half-life is half the clustering window, so the decay shape is consistent
    regardless of the configured window size.

    Subtracting the neutral baseline (expected mean weight for articles spread
    uniformly over the window) centres the signal at zero:

      > 0  articles front-loaded toward now  → story is breaking / rising
      ≈ 0  articles uniformly spread         → story is steady
      < 0  articles back-loaded toward window edge → story is fading
    """
    if not articles:
        return ClusterScore(score=0.0, velocity=0.0)

    scores = [
        a.significance_score for a in articles if a.significance_score is not None
    ]
    score = (sum(scores) / len(scores)) * math.log(1 + len(scores)) if scores else 0.0

    decay = math.log(2) / (window_hours * _HALF_LIFE_FRACTION)
    neutral_baseline = (1 - math.exp(-decay * window_hours)) / (decay * window_hours)

    def age_hours(article: PublicGlobalArticles) -> float:
        delta = now - article.published_at
        return max(delta.total_seconds() / 3600, 0.0)

    weights = [math.exp(-decay * age_hours(a)) for a in articles]
    velocity = (sum(weights) / len(weights)) - neutral_baseline

    return ClusterScore(score=score, velocity=velocity)
