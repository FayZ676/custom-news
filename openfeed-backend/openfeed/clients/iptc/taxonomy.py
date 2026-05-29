import json
import logging
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)


_URI_PREFIX = "http://cv.iptc.org/newscodes/mediatopic/"
_DEFAULT_TAXONOMY_PATH = Path(__file__).parent / "taxonomy.json"


def _uri_to_qcode(uri: str) -> str:
    return "medtop:" + uri.removeprefix(_URI_PREFIX)


@dataclass(frozen=True)
class TaxonomyNode:
    medtop_id: str
    name: str
    definition: str
    parent_id: str | None
    ancestors: tuple[str, ...]  # ordered root → self, inclusive
    depth: int  # 0 for root nodes


Taxonomy = dict[str, TaxonomyNode]


def load_taxonomy(path: Path | str = _DEFAULT_TAXONOMY_PATH) -> Taxonomy:
    """Parse the IPTC JSON-LD file into an in-memory dict.

    Ancestor chains are pre-computed once so no traversal is needed at query time.
    """
    data = json.loads(Path(path).read_text(encoding="utf-8"))

    # First pass: collect raw fields for every concept
    raw: dict[str, tuple[str, str, str | None]] = {}
    for concept in data["conceptSet"]:
        qcode: str = concept["qcode"]
        name: str = concept.get("prefLabel", {}).get("en-US", "")
        definition: str = concept.get("definition", {}).get("en-US", "")
        broader = concept.get("broader", [])
        parent_id: str | None = _uri_to_qcode(broader[0]) if broader else None
        raw[qcode] = (name, definition, parent_id)

    # Second pass: compute ancestor chains by walking parent pointers
    def _ancestors(medtop_id: str) -> tuple[str, ...]:
        chain: list[str] = []
        current: str | None = medtop_id
        seen: set[str] = set()
        while current is not None and current not in seen:
            seen.add(current)
            chain.append(current)
            current = raw[current][2]
        return tuple(reversed(chain))

    return {
        qcode: TaxonomyNode(
            medtop_id=qcode,
            name=name,
            definition=definition,
            parent_id=parent_id,
            ancestors=_ancestors(qcode),
            depth=len(_ancestors(qcode)) - 1,
        )
        for qcode, (name, definition, parent_id) in raw.items()
    }


def get_root_ids(taxonomy: Taxonomy) -> list[str]:
    """Return all top-level medtop_ids (nodes with no parent), sorted."""
    return sorted(
        node.medtop_id for node in taxonomy.values() if node.parent_id is None
    )


def get_subtree(medtop_id: str, taxonomy: Taxonomy) -> list[str]:
    """Return the given node plus all its descendants, sorted by medtop_id."""
    return sorted(
        node.medtop_id for node in taxonomy.values() if medtop_id in node.ancestors
    )


def render_prompt_tree(
    medtop_ids: list[str],
    taxonomy: Taxonomy,
    max_depth: int | None = None,
) -> str:
    """Render a set of taxonomy nodes as an indented plain-text tree.

    Indentation is relative to the shallowest node in the provided set,
    so a Pass 2 subtree starting at depth 1 renders from indent 0.

    If *max_depth* is given, only nodes at or above that depth are rendered.

    Example output:
        11000000 (politics) — Local, regional, national...
          20000574 (election) — The process by which people vote...
            20000579 (national elections) — ...
    """
    nodes = [
        taxonomy[mid]
        for mid in medtop_ids
        if mid in taxonomy and (max_depth is None or taxonomy[mid].depth <= max_depth)
    ]
    if not nodes:
        return ""

    min_depth = min(n.depth for n in nodes)
    nodes.sort(key=lambda n: n.ancestors)

    lines: list[str] = []
    for node in nodes:
        indent = "  " * (node.depth - min_depth)
        defn = f" — {node.definition}" if node.definition else ""
        bare_id = node.medtop_id.removeprefix("medtop:")
        lines.append(f"{indent}{bare_id} ({node.name}){defn}")

    return "\n".join(lines)
