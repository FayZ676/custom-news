from pathlib import Path

from openfeed.iptc.taxonomy import (
    TaxonomyNode,
    Taxonomy,
    load_taxonomy,
    get_root_ids,
    get_subtree,
    render_prompt_tree,
)

# Loaded once at import time; the JSON file is committed alongside this package.
taxonomy: Taxonomy = load_taxonomy(Path(__file__).parent / "iptc-taxonomy.json")

__all__ = [
    "TaxonomyNode",
    "Taxonomy",
    "load_taxonomy",
    "get_root_ids",
    "get_subtree",
    "render_prompt_tree",
    "taxonomy",
]
