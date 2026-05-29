from collections.abc import Callable

from rapidfuzz import fuzz

from openfeed.clients.iptc.taxonomy import Taxonomy, TaxonomyNode

# Swappable type contracts:
#   SimilarityFn:         (term, text) -> 0.0..1.0
#   WeightedSimilarityFn: (term, name, definition) -> 0.0..1.0
#   ScoringFn:            (similarity, node_depth, term_position) -> score contribution
SimilarityFn = Callable[[str, str], float]
WeightedSimilarityFn = Callable[[str, str, str], float]
ScoringFn = Callable[[float, int, int], float]


def rapidfuzz_similarity(term: str, text: str) -> float:
    """Symmetric full-string similarity using rapidfuzz ratio (0.0–1.0)."""

    return fuzz.ratio(term.lower(), text.lower()) / 100.0


def default_weighted_similarity(
    term: str,
    name: str,
    definition: str,
    similarity_fn: SimilarityFn = rapidfuzz_similarity,
) -> float:
    """Weighted similarity: 0.8 * name + 0.2 * definition (0.0–1.0)."""
    return 0.8 * similarity_fn(term, name) + 0.2 * similarity_fn(term, definition)


def default_scoring(
    similarity: float, depth: int, position: int
) -> float:  # noqa: ARG001
    """Position-decayed score: similarity / (position + 1). Depth unused (natural tie-breaker)."""
    return similarity / (position + 1)


def search_taxonomy(
    key_terms: list[str],
    taxonomy: Taxonomy,
    threshold: float = 0.8,
    max_terms: int = 8,
    weighted_similarity_fn: WeightedSimilarityFn = default_weighted_similarity,
    scoring_fn: ScoringFn = default_scoring,
) -> list[str]:
    """Return medtop_ids whose aggregate term score meets the threshold, sorted descending.

    Args:
        key_terms:              Ordered list of key terms (most → least important).
        taxonomy:               Loaded IPTC taxonomy.
        threshold:              Minimum aggregate score to include a node.
        max_terms:              Maximum number of key terms to consider.
        weighted_similarity_fn: Swappable (term, name, definition) -> 0.0..1.0 function.
        scoring_fn:             Swappable (similarity, depth, position) -> score function.
    """
    capped = key_terms[:max_terms]

    def _score(node: TaxonomyNode) -> float:
        name = node.name
        definition = node.definition or ""
        return sum(
            scoring_fn(
                weighted_similarity_fn(term, name, definition),
                node.depth,
                i,
            )
            for i, term in enumerate(capped)
        )

    scored = ((node.medtop_id, _score(node)) for node in taxonomy.values())
    return [
        mid
        for mid, score in sorted(scored, key=lambda x: x[1], reverse=True)
        if score >= threshold
    ]
