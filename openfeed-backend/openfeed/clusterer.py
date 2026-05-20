from datetime import datetime, timezone
from itertools import combinations
from typing import Callable
from uuid import UUID

from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import connected_components

from openfeed.database_models import PublicGlobalArticles, PublicGlobalStories
from openfeed.utils.bayesian import Belief, Likelihood, update_all
from openfeed.utils.math import cosine_similarity as _cosine_similarity


# Base rate: fraction of article pairs that describe the same event.
# Low because articles span many unrelated topics.
PRIOR: Belief = {  ## TODO: Verify and/or tune these values
    "same_event": 0.03,
    "diff_event": 0.97,
}


# ---------------------------------------------------------------------------
# Feature extractors — pure functions on article fields
# ---------------------------------------------------------------------------


def _jaccard_similarity(a: frozenset[str], b: frozenset[str]) -> float:
    if not a and not b:
        return 0.0
    return len(a & b) / len(a | b)


def _hours_between(a: datetime, b: datetime) -> float:
    a_utc = a.replace(tzinfo=timezone.utc) if a.tzinfo is None else a
    b_utc = b.replace(tzinfo=timezone.utc) if b.tzinfo is None else b
    return abs((a_utc - b_utc).total_seconds()) / 3600


def _normalized_entities(article: PublicGlobalArticles) -> frozenset[str]:
    return frozenset(e.lower().strip() for e in article.summary_entities)


# ---------------------------------------------------------------------------
# Likelihood functions — each answers:
# "Given this feature value, how likely is same_event vs diff_event?"
# Buckets are tunable — refine against labeled pairs.
# ---------------------------------------------------------------------------


def _embedding_likelihood(similarity: float) -> Likelihood:
    if similarity > 0.85:
        bucket = "high"
    elif similarity > 0.60:
        bucket = "mid"
    else:
        bucket = "low"

    rates = {
        "high": {"same_event": 0.90, "diff_event": 0.20},
        "mid": {"same_event": 0.40, "diff_event": 0.30},
        "low": {"same_event": 0.05, "diff_event": 0.80},
    }[bucket]

    return lambda hypothesis: rates[hypothesis]


def _entity_likelihood(jaccard: float) -> Likelihood:
    if jaccard > 0.30:
        bucket = "high"
    elif jaccard > 0.10:
        bucket = "mid"
    else:
        bucket = "low"

    rates = {
        "high": {"same_event": 0.85, "diff_event": 0.10},
        "mid": {"same_event": 0.50, "diff_event": 0.30},
        "low": {"same_event": 0.10, "diff_event": 0.70},
    }[bucket]

    return lambda hypothesis: rates[hypothesis]


def _time_likelihood(hours: float) -> Likelihood:
    if hours < 6:
        bucket = "close"
    elif hours < 48:
        bucket = "mid"
    else:
        bucket = "far"

    rates = {
        "close": {"same_event": 0.80, "diff_event": 0.30},
        "mid": {"same_event": 0.50, "diff_event": 0.40},
        "far": {"same_event": 0.20, "diff_event": 0.55},
    }[bucket]

    return lambda hypothesis: rates[hypothesis]


# ---------------------------------------------------------------------------
# Pair scorer — composes all three signals via sequential Bayesian update
# ---------------------------------------------------------------------------


def score_pair(a: PublicGlobalArticles, b: PublicGlobalArticles) -> float:
    """
    Returns P(same_event | embedding, entities, time).
    Returns 0.0 if either article is missing embeddings.
    """
    if not a.summary_embeddings or not b.summary_embeddings:
        return 0.0

    likelihoods = [
        _embedding_likelihood(
            _cosine_similarity(a.summary_embeddings, b.summary_embeddings)
        ),
        _entity_likelihood(
            _jaccard_similarity(_normalized_entities(a), _normalized_entities(b))
        ),
        _time_likelihood(_hours_between(a.published_at, b.published_at)),
    ]
    return update_all(PRIOR, likelihoods)["same_event"]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def cluster_articles(
    articles: list[PublicGlobalArticles],
    threshold: float = 0.35,
    pair_scorer: Callable[
        [PublicGlobalArticles, PublicGlobalArticles], float
    ] = score_pair,
) -> list[list[PublicGlobalArticles]]:
    """
    Clusters articles by same-event probability.

    Articles are expected to already be pre-filtered to the relevant time window
    (e.g. via get_recent_global_articles). All pairs are scored directly.

    1. Score:      compute P(same_event) for each candidate pair via pair_scorer.
    2. Graph:      build sparse adjacency from pairs that exceed threshold.
    3. Components: find connected components via scipy (fast, vectorized).
    """
    if len(articles) < 2:
        return []

    candidates = list(combinations(articles, 2))
    id_to_idx = {a.id: i for i, a in enumerate(articles)}
    n = len(articles)

    rows: list[int] = []
    cols: list[int] = []
    for a, b in candidates:
        if pair_scorer(a, b) >= threshold:
            i, j = id_to_idx[a.id], id_to_idx[b.id]
            rows.extend([i, j])
            cols.extend([j, i])

    adjacency = csr_matrix(
        ([1] * len(rows), (rows, cols)) if rows else ([], ([], [])),
        shape=(n, n),
    )
    _n_components, labels = connected_components(adjacency, directed=False)

    clusters: dict[int, list[PublicGlobalArticles]] = {}
    for article, label in zip(articles, labels):
        clusters.setdefault(label, []).append(article)

    return list(clusters.values())


def deduplicate_clusters(
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

    return new_clusters, matched_clusters
