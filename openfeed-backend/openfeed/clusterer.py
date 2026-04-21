import numpy as np
from pydantic import BaseModel
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import connected_components
from sklearn.metrics import pairwise_distances

from openfeed.openai_client import openai_client
from openfeed.database_models import PublicGlobalArticles


def cluster_articles(
    articles: list[PublicGlobalArticles],
    threshold: float = 0.3,
) -> list[list[PublicGlobalArticles]]:
    X = np.array([a.summary_embeddings for a in articles], dtype=np.float32)
    distances = pairwise_distances(X, metric="cosine")
    adjacency = csr_matrix(distances < threshold)
    _n_components, labels = connected_components(adjacency, directed=False)

    clusters: dict[int, list[PublicGlobalArticles]] = {}
    for article, label in zip(articles, labels):
        clusters.setdefault(label, []).append(article)

    return [arts for arts in clusters.values() if len(arts) >= 2]


def reduce_clusters(
    clusters: list[list[PublicGlobalArticles]], threshold: float = 0.7
) -> list[list[PublicGlobalArticles]]:
    # TODO: Paralellize
    return [
        cluster
        for cluster in clusters
        if score_cluster(["\n".join(article.summary or "" for article in cluster)])
        > threshold
    ]


def score_cluster(summaries: list[str]):
    class ClusterScoreResponse(BaseModel):
        score: float

    prompt = f"""You are evaluating the newsworthiness and societal importance of a news story cluster.

A cluster represents multiple articles covering the same news event or topic.

Rate the cluster's importance on a scale from 0.0 to 1.0 based on the following criteria:
- **Broad impact**: Does this affect a large number of people or industries?
- **Significance**: Is this a major development, breakthrough, or decision with lasting consequences?
- **Novelty**: Is this genuinely new and noteworthy, not routine or recurring?
- **Stakes**: Are there real-world consequences (security, finance, health, policy, etc.)?

Score guide:
- 0.8–1.0: Major world events, significant scientific/technological breakthroughs, large-scale security incidents, landmark legal/policy decisions
- 0.5–0.8: Meaningful industry developments, notable product launches with broad user impact, significant business moves
- 0.3–0.5: Niche tech news, minor product updates, stories affecting a small or specialized audience
- 0.0–0.3: Product deals, hardware reviews, opinion pieces, minor software updates, lifestyle tips

Articles in this cluster:
{"\n".join(s for s in summaries)}

Return a score (0.0–1.0) and a one-sentence reasoning."""

    return openai_client.generate_response(
        "gpt-5.4-nano",
        prompt,
        ClusterScoreResponse,
    ).score
