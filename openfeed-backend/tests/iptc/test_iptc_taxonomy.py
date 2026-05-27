from openfeed.clients.iptc.taxonomy import (
    load_taxonomy,
    get_root_ids,
    get_subtree,
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
