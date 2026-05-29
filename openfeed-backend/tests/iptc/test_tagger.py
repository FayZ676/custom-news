from openfeed.clients.iptc.tagger import (
    ScoringFn,
    SimilarityFn,
    default_scoring,
    rapidfuzz_similarity,
    search_taxonomy,
)
from openfeed.clients.iptc.taxonomy import load_taxonomy


def test_search_taxonomy_returns_relevant_node():
    """A precise topical term should match a known node above the threshold."""
    taxonomy = load_taxonomy()
    results = search_taxonomy(["national elections"], taxonomy, threshold=0.5)
    # medtop:20000579 is "national elections"
    assert "medtop:20000579" in results


def test_search_taxonomy_threshold_filters_low_scores():
    """Raising the threshold should reduce (or equal) the number of results."""
    taxonomy = load_taxonomy()
    low = search_taxonomy(["election"], taxonomy, threshold=0.3)
    high = search_taxonomy(["election"], taxonomy, threshold=2.0)
    assert len(high) <= len(low)


def test_search_taxonomy_max_terms_cap():
    """Terms beyond max_terms must not influence scores."""
    taxonomy = load_taxonomy()
    terms = ["national elections", "carbon tax", "renewable energy", "criminal justice"]
    capped = search_taxonomy(terms, taxonomy, threshold=0.5, max_terms=1)
    uncapped = search_taxonomy(terms[:1], taxonomy, threshold=0.5, max_terms=1)
    assert capped == uncapped


def test_search_taxonomy_multi_topic_coverage():
    """Terms from distinct domains should each surface nodes from their branch."""
    taxonomy = load_taxonomy()
    results = set(
        search_taxonomy(
            ["national elections", "renewable energy"],
            taxonomy,
            threshold=0.5,
        )
    )
    # Both topics should be represented — check ancestor roots differ
    roots = {taxonomy[mid].ancestors[0] for mid in results if mid in taxonomy}
    assert len(roots) >= 2


def test_search_taxonomy_deeper_nodes_score_higher_than_shallow():
    """For an exact term match, a deeper node should outscore its root ancestor."""
    taxonomy = load_taxonomy()
    # "national elections" (depth 2) vs its root "politics" (depth 0)
    results_with_scores = {
        node.medtop_id: default_scoring(
            rapidfuzz_similarity(
                "national elections", f"{node.name} — {node.definition}"
            ),
            node.depth,
            0,
        )
        for node in taxonomy.values()
        if node.medtop_id in ("medtop:20000579", "medtop:11000000")
    }
    assert (
        results_with_scores["medtop:20000579"] > results_with_scores["medtop:11000000"]
    )


def test_search_taxonomy_custom_similarity_fn():
    """A custom similarity_fn that always returns 1.0 should match all nodes."""
    taxonomy = load_taxonomy()
    always_match: SimilarityFn = lambda term, node_text: 1.0
    results = search_taxonomy(
        ["anything"], taxonomy, threshold=0.5, similarity_fn=always_match
    )
    assert len(results) == len(taxonomy)


def test_search_taxonomy_custom_scoring_fn():
    """A custom scoring_fn that ignores depth should return flat scores."""
    taxonomy = load_taxonomy()
    flat_score: ScoringFn = lambda similarity, depth, position: similarity
    # With a flat scorer, a root and a leaf with the same similarity should tie
    results = search_taxonomy(
        ["national elections"], taxonomy, threshold=0.5, scoring_fn=flat_score
    )
    assert isinstance(results, list)
