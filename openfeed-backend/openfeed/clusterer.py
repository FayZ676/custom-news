import math
import numpy as np
from uuid import UUID
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import connected_components
from sklearn.metrics import pairwise_distances

from openfeed.db.client import Client
from openfeed.db.global_stories import update_story_urls
from openfeed.database_models import PublicGlobalArticles, PublicGlobalStories


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
    clusters: list[list[PublicGlobalArticles]], threshold: float = 0.8
) -> list[list[PublicGlobalArticles]]:
    return [cluster for cluster in clusters if score_cluster(cluster) > threshold]


def deduplicate_clusters(
    db: Client,
    clusters: list[list[PublicGlobalArticles]],
    stories: list[PublicGlobalStories],
) -> tuple[list[list[PublicGlobalArticles]], dict[UUID, list[PublicGlobalArticles]]]:
    matched_clusters: dict[UUID, list[PublicGlobalArticles]] = {}
    new_clusters: list[list[PublicGlobalArticles]] = []
    for cluster in clusters:
        cluster_urls = {article.url for article in cluster}
        duplicate_story = next(
            (
                story
                for story in stories
                if set(story.related_articles_urls) <= cluster_urls
            ),
            None,
        )

        if duplicate_story is None:
            new_clusters.append(cluster)
        else:
            matched_clusters[duplicate_story.id] = cluster
            if cluster_urls > set(duplicate_story.related_articles_urls):
                update_story_urls(db, duplicate_story.id, list(cluster_urls))

    return new_clusters, matched_clusters


def score_cluster(articles: list[PublicGlobalArticles]) -> float:
    scores = [
        a.significance_score for a in articles if a.significance_score is not None
    ]
    if not scores:
        return 0.0
    return (sum(scores) / len(scores)) * math.log(1 + len(scores))
