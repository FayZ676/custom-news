from collections.abc import Callable

from openfeed.clients.iptc.taxonomy import Taxonomy, TaxonomyNode

# Swappable type contracts:
#   SimilarityFn: (term, node_text) -> 0.0..1.0
#   ScoringFn:    (similarity, node_depth, term_position) -> score contribution
SimilarityFn = Callable[[str, str], float]
ScoringFn = Callable[[float, int, int], float]


def _node_text(node: TaxonomyNode) -> str:
    return f"{node.name} — {node.definition}" if node.definition else node.name


def rapidfuzz_similarity(term: str, node_text: str) -> float:
    """Phrase-level similarity using rapidfuzz partial_ratio (0.0–1.0).

    partial_ratio finds the best matching window of the shorter string inside
    the longer one, rewarding exact or near-exact phrase matches over incidental
    word overlap.
    """
    from rapidfuzz import fuzz

    return fuzz.partial_ratio(term.lower(), node_text.lower()) / 100.0


def default_scoring(similarity: float, depth: int, position: int) -> float:
    """Position-weighted, depth-boosted score contribution.

    Earlier terms (lower position) carry more weight via harmonic decay.
    Deeper (more specific) nodes are boosted linearly by depth.
    """
    return (depth + 1) * similarity / (position + 1)


def search_taxonomy(
    key_terms: list[str],
    taxonomy: Taxonomy,
    threshold: float = 0.5,
    max_terms: int = 8,
    similarity_fn: SimilarityFn = rapidfuzz_similarity,
    scoring_fn: ScoringFn = default_scoring,
) -> list[str]:
    """Search the taxonomy for nodes matching the given key terms.

    Each term contributes independently to every node's score, so a secondary
    topic driven by a lower-ranked term still surfaces if its score clears the
    threshold on its own.

    Args:
        key_terms:     Ordered list of key terms (most → least important).
        taxonomy:      Loaded IPTC taxonomy.
        threshold:     Minimum aggregate score for a node to be included.
        max_terms:     Maximum number of key terms to consider.
        similarity_fn: Swappable (term, node_text) -> 0.0..1.0 function.
        scoring_fn:    Swappable (similarity, depth, position) -> score function.

    Returns:
        List of medtop_ids whose aggregate score meets the threshold,
        sorted descending by score.
    """
    capped = key_terms[:max_terms]

    def _score(node: TaxonomyNode) -> float:
        text = _node_text(node)
        return sum(
            scoring_fn(similarity_fn(term, text), node.depth, i)
            for i, term in enumerate(capped)
        )

    scored = ((node.medtop_id, _score(node)) for node in taxonomy.values())
    return [
        mid
        for mid, score in sorted(scored, key=lambda x: x[1], reverse=True)
        if score >= threshold
    ]
