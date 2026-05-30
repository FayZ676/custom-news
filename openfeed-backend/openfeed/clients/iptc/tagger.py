from collections.abc import Callable

from rapidfuzz import fuzz

from openfeed.clients.iptc.taxonomy import Taxonomy, TaxonomyNode
from openfeed.clients.openai_client.client import OpenAIClient
from openfeed.utils.bayesian import Belief, Likelihood, update_all

# Swappable type contracts:
#   SimilarityFn: (term, text) -> 0.0..1.0
#   SignalFn:     (term, term_vec, node) -> 0.0..1.0  — unified signal contract
#   ScoringFn:   (similarity, node_depth, term_position) -> score contribution
SimilarityFn = Callable[[str, str], float]
SignalFn = Callable[[str, list[float], "TaxonomyNode"], float]
ScoringFn = Callable[[float, int, int], float]

# Small floor to prevent hard zeroing in Bayesian updates.
_EPSILON = 1e-6


def rapidfuzz_similarity(term: str, text: str) -> float:
    """Symmetric full-string similarity using rapidfuzz ratio (0.0–1.0)."""
    return fuzz.ratio(term.lower(), text.lower()) / 100.0


def _weighted_similarity(
    term: str,
    name: str,
    definition: str,
    similarity_fn: SimilarityFn = rapidfuzz_similarity,
) -> float:
    """Weighted similarity: 0.8 * name + 0.2 * definition (0.0–1.0)."""
    return 0.8 * similarity_fn(term, name) + 0.2 * similarity_fn(term, definition)


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Cosine similarity between two vectors (0.0–1.0 for non-negative embeddings)."""
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = sum(x * x for x in a) ** 0.5
    mag_b = sum(x * x for x in b) ** 0.5
    return dot / (mag_a * mag_b) if mag_a and mag_b else 0.0


def fuzzy_signal(term: str, _term_vec: list[float], node: "TaxonomyNode") -> float:
    """Fuzzy text signal: weighted similarity against node name + definition."""
    return _weighted_similarity(term, node.name, node.definition or "")


def cosine_signal(_term: str, term_vec: list[float], node: "TaxonomyNode") -> float:
    """Cosine embedding signal: similarity between term vector and node embedding."""
    return _cosine_similarity(term_vec, list(node.embedding))


def default_scoring(
    similarity: float, depth: int, position: int
) -> float:  # noqa: ARG001
    """Position-decayed score: similarity / (position + 1). Depth unused (natural tie-breaker)."""
    return similarity / (position + 1)


def _uniform_prior(nodes: list[TaxonomyNode]) -> Belief:
    p = 1.0 / len(nodes)
    return {node.medtop_id: p for node in nodes}


def _make_likelihood(scores: dict[str, float]) -> Likelihood:
    """Wrap a per-node score dict as a Likelihood, floored at epsilon."""
    return lambda medtop_id: max(_EPSILON, scores[medtop_id])


def _build_likelihoods(
    capped: list[str],
    nodes: list[TaxonomyNode],
    term_vecs: list[list[float]],
    signals: list[SignalFn],
    scoring_fn: ScoringFn,
) -> list[Likelihood]:
    """Return one likelihood per (term, signal) pair, shaped by scoring_fn."""
    return [
        _make_likelihood(
            {
                node.medtop_id: scoring_fn(signal(term, term_vec, node), node.depth, i)
                for node in nodes
            }
        )
        for i, (term, term_vec) in enumerate(zip(capped, term_vecs))
        for signal in signals
    ]


def _search_single_term(
    term: str,
    term_vec: list[float],
    nodes: list[TaxonomyNode],
    signals: list[SignalFn],
    scoring_fn: ScoringFn,
    threshold: float,
) -> list[str]:
    """Return medtop_ids above threshold for a single term, sorted by descending BF."""
    likelihoods = _build_likelihoods([term], nodes, [term_vec], signals, scoring_fn)
    posterior = update_all(_uniform_prior(nodes), likelihoods)
    n = len(nodes)
    return [
        mid
        for mid, p in sorted(posterior.items(), key=lambda x: x[1], reverse=True)
        if p * n >= threshold
    ]


def search_taxonomy(
    key_terms: list[str],
    taxonomy: Taxonomy,
    threshold: float = 10.0,
    max_terms: int = 8,
    signals: list[SignalFn] = [fuzzy_signal, cosine_signal],
    scoring_fn: ScoringFn = default_scoring,
) -> list[str]:
    """Return medtop_ids matched per-term, unioned in key_terms order (earliest match wins).

    Each term is scored independently against a uniform prior; nodes with Bayes factor
    (posterior * N) >= threshold are included. A BF of 10 means 10x more probable than chance.

    Args:
        key_terms:  Ordered key terms (most → least important).
        taxonomy:   Loaded IPTC taxonomy.
        threshold:  Minimum per-term Bayes factor to include a node.
        max_terms:  Maximum number of key terms to consider.
        signals:    Signal functions (term, term_vec, node) -> 0.0..1.0.
        scoring_fn: Scoring function (similarity, depth, position) -> score.
    """
    capped = key_terms[:max_terms]
    nodes = list(taxonomy.values())

    response = OpenAIClient().embed(list(capped))
    term_vecs = response.embeddings

    seen: set[str] = set()
    result: list[str] = []
    for term, term_vec in zip(capped, term_vecs):
        for mid in _search_single_term(
            term, term_vec, nodes, signals, scoring_fn, threshold
        ):
            if mid not in seen:
                seen.add(mid)
                result.append(mid)
    return result
