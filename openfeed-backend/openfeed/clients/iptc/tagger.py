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
        self.threshold: float = 10.0
        self.signals: list[SignalFn] = [fuzzy_signal, cosine_signal]
        self.scoring_fn: ScoringFn = lambda similarity, _depth, position: similarity / (
            position + 1
        )

    def search_taxonomy(self, key_terms: list[str]) -> list[TaxonomyNode]:
        """Return taxonomy nodes matched per-term, unioned in key_terms order."""
        nodes = list(self.taxonomy.values())
        term_vectors = OpenAIClient().embed(key_terms).embeddings
        result_by_id: dict[str, TaxonomyNode] = {}
        for term, term_vec in zip(key_terms, term_vectors):
            for node in self._search_single_term(term, term_vec, nodes):
                result_by_id[node.medtop_id] = node
        return list(result_by_id.values())

    def _search_single_term(
        self, term: str, term_vec: list[float], nodes: list[TaxonomyNode]
    ) -> list[TaxonomyNode]:
        """Return nodes above threshold for a single term using branch-first ordering.

        Nodes are filtered by a direct score threshold relative to the candidate-set
        average. Branch-first ordering is applied after filtering: branches are
        ranked by their best node score, and within each branch nodes are ordered by
        score descending.
        """
        # Step 1: Score all candidates and keep nodes that clear the relative cutoff.
        scores = {
            node.medtop_id: prod(
                self.scoring_fn(signal(term, term_vec, node), node.depth, 0)
                for signal in self.signals
            )
            for node in nodes
        }
        minimum_score = (
            (sum(scores.values()) / len(scores)) * self.threshold if scores else 0.0
        )
        node_index = {node.medtop_id: i for i, node in enumerate(nodes)}
        ranked_nodes = sorted(
            ((node, scores[node.medtop_id]) for node in nodes),
            key=lambda item: (-item[1], node_index[item[0].medtop_id]),
        )
        passing = [node for node, score in ranked_nodes if score >= minimum_score]
        if not passing:
            return []

        # Step 2: Group passing nodes by root branch.
        passing_by_root: dict[str, list[tuple[TaxonomyNode, float]]] = {}
        for node in passing:
            rid = node.ancestors[0] if node.ancestors else node.medtop_id
            passing_by_root.setdefault(rid, []).append((node, scores[node.medtop_id]))

        # Step 3: Rank branches by their best global posterior, then emit nodes
        # within each branch ordered by score descending.
        ranked_branches = sorted(
            passing_by_root.values(),
            key=lambda branch: max(score for _, score in branch),
            reverse=True,
        )
        return [
            node
            for branch in ranked_branches
            for node, _ in sorted(branch, key=lambda x: x[1], reverse=True)
        ]
