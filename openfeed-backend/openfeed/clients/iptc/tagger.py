from collections.abc import Callable
from math import prod

from rapidfuzz import fuzz

from openfeed.clients.iptc.taxonomy import load_taxonomy, Taxonomy, TaxonomyNode
from openfeed.clients.openai_client.client import OpenAIClient

# Swappable type contracts:
#   SimilarityFn: (term, text) -> 0.0..1.0
#   SignalFn:     (term, term_vec, node) -> 0.0..1.0  — unified signal contract
#   ScoringFn:   (similarity, node_depth, term_position) -> score contribution
SimilarityFn = Callable[[str, str], float]
SignalFn = Callable[[str, list[float], "TaxonomyNode"], float]
ScoringFn = Callable[[float, int, int], float]


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


class Tagger:
    def __init__(self):
        self.taxonomy: Taxonomy = load_taxonomy()
        self.signals: list[SignalFn] = [fuzzy_signal, cosine_signal]
        self.scoring_fn: ScoringFn = lambda similarity, _depth, position: similarity / (
            position + 1
        )

    def search_taxonomy(self, key_terms: list[str]) -> list[TaxonomyNode]:
        """Return closest topic per term, unioned in key_terms order."""
        if not key_terms:
            return []

        nodes = list(self.taxonomy.values())
        term_vectors = OpenAIClient().embed(key_terms).embeddings
        result_by_id: dict[str, TaxonomyNode] = {}
        for term, term_vec in zip(key_terms, term_vectors):
            node = self._search_single_term(term, term_vec, nodes)
            if node is not None:
                result_by_id[node.medtop_id] = node
        return list(result_by_id.values())

    def _search_single_term(
        self, term: str, term_vec: list[float], nodes: list[TaxonomyNode]
    ) -> TaxonomyNode | None:
        """Return the single closest topic for a term across all configured topics."""
        if not nodes:
            return None

        best_node = max(
            nodes,
            key=lambda node: self.scoring_fn(
                prod(signal(term, term_vec, node) for signal in self.signals),
                node.depth,
                0,
            ),
        )
        return best_node
