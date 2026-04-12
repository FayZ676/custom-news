import hdbscan
import numpy as np

from openfeed.database_models import PublicGlobalArticles


def cluster_articles(
    articles: list[PublicGlobalArticles],
) -> list[list[PublicGlobalArticles]]:
    embeddings = np.array([a.embeddings for a in articles], dtype=np.float32)
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    embeddings = embeddings / np.where(norms == 0, 1, norms)
    labels = hdbscan.HDBSCAN(
        min_cluster_size=3,
        min_samples=1,  # lower = more points absorbed into clusters
        cluster_selection_epsilon=0.15,  # merge clusters within this distance
        metric="euclidean",  # fine since you've already L2-normalized
    ).fit_predict(embeddings)

    clusters: dict[int, list[PublicGlobalArticles]] = {}
    for article, label in zip(articles, labels):
        clusters.setdefault(label, []).append(article)

    result: list[list[PublicGlobalArticles]] = []
    for label, group in sorted(clusters.items()):
        if label == -1:
            continue
        result.append(group)

    return result
