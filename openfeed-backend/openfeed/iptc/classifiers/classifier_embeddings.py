"""Embedding-based IPTC classifier (flat cosine search, no LLM at classify time).

Requires a pre-built TaxonomyIndex from openfeed.iptc.taxonomy_index.
"""

import logging
from dataclasses import dataclass

from openfeed.iptc.taxonomy import Taxonomy, TaxonomyIndex
from openfeed.openai_client import OpenAIClient
from openfeed.utils.math import cosine_similarity

logger = logging.getLogger(__name__)

_FLAT_THRESHOLD = 0.25  # absolute floor — no node below this is ever admitted
_RELATIVE_FACTOR = 0.75  # nodes must also score >= top_score * factor


@dataclass(frozen=True)
class EmbeddingClassificationResult:
    """Extended result carrying the score metadata used for confidence decisions."""

    topics: list[str]
    top_score: float  # highest cosine score seen across all nodes
    num_roots: int  # number of distinct root branches admitted
    effective_threshold: float


def _score_all_nodes(
    article_vec: list[float],
    taxonomy: Taxonomy,
    index: TaxonomyIndex,
) -> list[tuple[str, float]]:
    """Return (medtop_id, score) for every indexed node, unsorted."""
    return [
        (mid, cosine_similarity(article_vec, index[mid]))
        for mid in index.vectors
        if mid in taxonomy
    ]


def _best_per_root(
    candidates: list[tuple[str, float]],
    taxonomy: Taxonomy,
) -> dict[str, tuple[str, float]]:
    """For each root branch, keep the highest-scoring node (deepest on tie)."""
    result: dict[str, tuple[str, float]] = {}
    for mid, score in candidates:
        root_id = taxonomy[mid].ancestors[0]
        if root_id not in result:
            result[root_id] = (mid, score)
        else:
            current_mid, current_score = result[root_id]
            if score > current_score or (
                score == current_score
                and taxonomy[mid].depth > taxonomy[current_mid].depth
            ):
                result[root_id] = (mid, score)
    return result


def classify_article_embeddings_full(
    text: str,
    taxonomy: Taxonomy,
    index: TaxonomyIndex,
    client: OpenAIClient,
    threshold: float = _FLAT_THRESHOLD,
    relative_factor: float = _RELATIVE_FACTOR,
) -> EmbeddingClassificationResult:
    """Classify and return full scoring metadata for confidence decisions.

    Flat search with a hybrid threshold: scores the article against all ~1,400
    taxonomy nodes, then applies ``max(threshold, top_score * relative_factor)``
    as the effective cutoff.  This adapts to each article's score distribution —
    a fixed absolute threshold would either miss low-signal articles or admit
    noise on high-signal ones.

    After thresholding, deduplicates by root branch — keeping the single
    highest-scoring (deepest on tie) node per branch.
    """
    response = client.embed([text])
    article_vec = response.embeddings[0]

    scored = _score_all_nodes(article_vec, taxonomy, index)
    if not scored:
        return EmbeddingClassificationResult(
            topics=[], top_score=0.0, num_roots=0, effective_threshold=0.0
        )

    top_score = max(s for _, s in scored)
    effective_threshold = max(threshold, top_score * relative_factor)

    candidates = [(mid, score) for mid, score in scored if score >= effective_threshold]

    if not candidates:
        logger.warning(
            "Embedding classifier: no node above effective threshold %.3f "
            "(floor=%.2f, top=%.3f, factor=%.2f) for text: %.80s",
            effective_threshold,
            threshold,
            top_score,
            relative_factor,
            text,
        )
        return EmbeddingClassificationResult(
            topics=[],
            top_score=top_score,
            num_roots=0,
            effective_threshold=effective_threshold,
        )

    best = _best_per_root(candidates, taxonomy)
    topics = [mid for mid, _ in best.values()]

    return EmbeddingClassificationResult(
        topics=topics,
        top_score=top_score,
        num_roots=len(best),
        effective_threshold=effective_threshold,
    )
