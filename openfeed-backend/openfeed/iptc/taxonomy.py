import json
import logging
from dataclasses import dataclass
from pathlib import Path

from openfeed.clients.openai_client import OpenAIClient

logger = logging.getLogger(__name__)


_URI_PREFIX = "http://cv.iptc.org/newscodes/mediatopic/"
_DEFAULT_INDEX_PATH = Path(__file__).parent / "taxonomy-index.json"


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


@dataclass(frozen=True)
class TaxonomyIndex:
    """Mapping from medtop_id to its embedding vector."""

    vectors: dict[str, list[float]]

    def __contains__(self, medtop_id: str) -> bool:
        return medtop_id in self.vectors

    def __getitem__(self, medtop_id: str) -> list[float]:
        return self.vectors[medtop_id]


def load_taxonomy(path: Path | str) -> Taxonomy:
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


def render_prompt_tree(medtop_ids: list[str], taxonomy: Taxonomy) -> str:
    """Render a set of taxonomy nodes as an indented plain-text tree.

    Indentation is relative to the shallowest node in the provided set,
    so a Pass 2 subtree starting at depth 1 renders from indent 0.

    Example output:
        medtop:11000000 (politics) — Local, regional, national...
          medtop:20000574 (election) — The process by which people vote...
            medtop:20000579 (national elections) — ...
    """
    nodes = [taxonomy[mid] for mid in medtop_ids if mid in taxonomy]
    if not nodes:
        return ""

    min_depth = min(n.depth for n in nodes)
    nodes.sort(key=lambda n: n.ancestors)

    lines: list[str] = []
    for node in nodes:
        indent = "  " * (node.depth - min_depth)
        defn = f" — {node.definition}" if node.definition else ""
        lines.append(f"{indent}{node.medtop_id} ({node.name}){defn}")

    return "\n".join(lines)


def _node_text(node: TaxonomyNode) -> str:
    """Produce the text to embed for a single taxonomy node."""
    return f"{node.name} — {node.definition}" if node.definition else node.name


def build_taxonomy_index(taxonomy: Taxonomy, client: OpenAIClient) -> TaxonomyIndex:
    """Embed every taxonomy node and return a TaxonomyIndex."""
    medtop_ids = list(taxonomy.keys())
    texts = [_node_text(taxonomy[mid]) for mid in medtop_ids]

    logger.info("Building taxonomy index: embedding %d nodes …", len(texts))
    response = client.embed(texts)
    logger.info("Taxonomy index built with model %r", response.model)

    vectors = dict(zip(medtop_ids, response.embeddings))
    return TaxonomyIndex(vectors=vectors)


def save_taxonomy_index(
    index: TaxonomyIndex,
    path: Path | str = _DEFAULT_INDEX_PATH,
) -> None:
    """Serialise a TaxonomyIndex to a JSON file."""
    path = Path(path)
    path.write_text(json.dumps(index.vectors), encoding="utf-8")
    logger.info("Taxonomy index saved to %s (%d nodes)", path, len(index.vectors))


def load_taxonomy_index(
    path: Path | str = _DEFAULT_INDEX_PATH,
) -> TaxonomyIndex:
    """Load a TaxonomyIndex previously saved with save_taxonomy_index."""
    path = Path(path)
    vectors: dict[str, list[float]] = json.loads(path.read_text(encoding="utf-8"))
    logger.info("Taxonomy index loaded from %s (%d nodes)", path, len(vectors))
    return TaxonomyIndex(vectors=vectors)
