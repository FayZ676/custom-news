import re
from uuid import UUID
from itertools import combinations
from typing import Callable
from datetime import datetime, timezone

import nltk
from nltk.corpus import stopwords as _nltk_stopwords


from openfeed.database_models import PublicGlobalArticles, PublicGlobalStories
from openfeed.utils.bayesian import Belief, Likelihood, update_all
from openfeed.utils.math import cosine_similarity as _cosine_similarity


nltk.download("stopwords", quiet=True)


# Base rate: fraction of article pairs that describe the same event.
# Low because articles span many unrelated topics.
PRIOR: Belief = {  ## TODO: Verify and/or tune these values
    "same_event": 0.30,
    "diff_event": 0.70,
}


_STOPWORDS: frozenset[str] = frozenset(_nltk_stopwords.words("english"))


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


def _keyword_tokens(article: PublicGlobalArticles) -> frozenset[str]:
    """Lowercase word tokens from title + summary, stopwords removed."""
    text = " ".join(filter(None, [article.title, article.summary]))
    tokens = re.findall(r"[a-z]{3,}", text.lower())
    return frozenset(t for t in tokens if t not in _STOPWORDS)


def _overlap_coefficient(a: frozenset[str], b: frozenset[str]) -> float:
    """Overlap coefficient: |A∩B| / min(|A|, |B|).

    Preferred over Jaccard for short-vs-long text pairs because it doesn't
    penalise a short headline that is a topical subset of a longer article.
    """
    if not a or not b:
        return 0.0
    return len(a & b) / min(len(a), len(b))


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


def _keyword_likelihood(overlap: float) -> Likelihood:
    if overlap > 0.40:
        bucket = "high"
    elif overlap > 0.15:
        bucket = "mid"
    else:
        bucket = "low"

    rates = {
        "high": {"same_event": 0.80, "diff_event": 0.15},
        "mid": {"same_event": 0.45, "diff_event": 0.30},
        "low": {"same_event": 0.10, "diff_event": 0.65},
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
        _keyword_likelihood(
            _overlap_coefficient(_keyword_tokens(a), _keyword_tokens(b))
        ),
        _time_likelihood(_hours_between(a.published_at, b.published_at)),
    ]

    entities_a = _normalized_entities(a)
    entities_b = _normalized_entities(b)

    # Only apply entity signal when both articles have extracted entities.
    # Absence of entity data is missing information, not evidence against a match.
    if entities_a and entities_b:
        likelihoods.append(
            _entity_likelihood(_jaccard_similarity(entities_a, entities_b))
        )

    return update_all(PRIOR, likelihoods)["same_event"]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def cluster_articles(
    articles: list[PublicGlobalArticles],
    threshold: float = 0.30,
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

    # Pre-compute all pair scores once.
    scores: dict[tuple[UUID, UUID], float] = {}
    for a, b in combinations(articles, 2):
        s = pair_scorer(a, b)
        scores[(a.id, b.id)] = s
        scores[(b.id, a.id)] = s

    def _all_pairs_exceed_threshold(
        candidate: PublicGlobalArticles,
        cluster: list[PublicGlobalArticles],
    ) -> bool:
        """Complete-linkage check: candidate must score >= threshold against
        every existing member of the cluster, not just one."""
        return all(
            scores.get((candidate.id, member.id), 0.0) >= threshold
            for member in cluster
        )

    clusters: list[list[PublicGlobalArticles]] = []
    for article in articles:
        merged = False
        for cluster in clusters:
            if _all_pairs_exceed_threshold(article, cluster):
                cluster.append(article)
                merged = True
                break
        if not merged:
            clusters.append([article])

    return clusters


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
