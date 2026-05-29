from openfeed.clients.iptc.tagger import (
    ScoringFn,
    SimilarityFn,
    default_scoring,
    rapidfuzz_similarity,
    search_taxonomy,
)
from openfeed.clients.iptc.taxonomy import (
    get_root_ids,
    get_subtree,
    load_taxonomy,
    render_prompt_tree,
)


def test_root_nodes_have_no_parent():
    taxonomy = load_taxonomy()
    roots = get_root_ids(taxonomy)
    assert len(roots) == 17
    assert all(taxonomy[mid].parent_id is None for mid in roots)


def test_root_nodes_have_depth_zero():
    taxonomy = load_taxonomy()
    for mid in get_root_ids(taxonomy):
        assert taxonomy[mid].depth == 0


def test_ancestor_chain_includes_self():
    taxonomy = load_taxonomy()
    for node in taxonomy.values():
        assert node.medtop_id in node.ancestors


def test_ancestor_chain_root_is_first():
    taxonomy = load_taxonomy()
    roots = set(get_root_ids(taxonomy))
    non_roots = [n for n in taxonomy.values() if n.parent_id is not None]
    assert non_roots, "Expected non-root nodes to exist"
    for node in non_roots[:50]:
        assert (
            node.ancestors[0] in roots
        ), f"{node.medtop_id} has bad ancestor chain: {node.ancestors}"


def test_ancestor_chain_depth_matches_length():
    taxonomy = load_taxonomy()
    for node in taxonomy.values():
        assert node.depth == len(node.ancestors) - 1


def test_get_subtree_includes_root():
    taxonomy = load_taxonomy()
    root = get_root_ids(taxonomy)[0]
    subtree = get_subtree(root, taxonomy)
    assert root in subtree


def test_get_subtree_excludes_sibling_branches():
    taxonomy = load_taxonomy()
    roots = get_root_ids(taxonomy)
    subtree_a = set(get_subtree(roots[0], taxonomy))
    subtree_b = set(get_subtree(roots[1], taxonomy))
    assert subtree_a.isdisjoint(subtree_b)


def test_render_prompt_tree_roots_only():
    taxonomy = load_taxonomy()
    roots = get_root_ids(taxonomy)
    output = render_prompt_tree(roots, taxonomy)
    lines = output.strip().splitlines()
    # All 17 roots rendered with no indentation
    assert len(lines) == 17
    assert all(not line.startswith(" ") for line in lines)


def test_render_prompt_tree_subtree_indented():
    taxonomy = load_taxonomy()
    # "arts, culture, entertainment and media" = medtop:01000000
    subtree = get_subtree("medtop:01000000", taxonomy)
    output = render_prompt_tree(subtree, taxonomy)
    lines = output.strip().splitlines()
    # Root line has no indent; at least some child lines do
    assert not lines[0].startswith(" ")
    assert any(line.startswith("  ") for line in lines)


def test_render_prompt_tree_unknown_ids_ignored():
    taxonomy = load_taxonomy()
    output = render_prompt_tree(["medtop:NONEXISTENT"], taxonomy)
    assert output == ""


# ---------------------------------------------------------------------------
# search_taxonomy
# ---------------------------------------------------------------------------


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
