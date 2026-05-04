import math

from pydantic import BaseModel

from openfeed.database_models import PublicGlobalArticles


class ClusterScore(BaseModel):
    score: float
    velocity: float


def score_cluster(articles: list[PublicGlobalArticles]) -> ClusterScore:
    """
    Cluster significance = mean(significance_score) * log(1 + size)

    - mean(significance_score): quality signal per article, assigned at ingestion.
    - log(1 + size):            coverage signal — how many sources picked this up?
    """
    scores = [
        a.significance_score for a in articles if a.significance_score is not None
    ]
    if not scores:
        return ClusterScore(score=0.0, velocity=0.0)
    score = (sum(scores) / len(scores)) * math.log(1 + len(scores))
    return ClusterScore(score=score, velocity=0.0)
