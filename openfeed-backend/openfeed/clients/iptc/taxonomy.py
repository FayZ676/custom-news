import json
import logging
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)


_URI_PREFIX = "http://cv.iptc.org/newscodes/mediatopic/"
_DEFAULT_TAXONOMY_PATH = Path(__file__).parent / "taxonomy.json"
_DEFAULT_EMBEDDINGS_PATH = Path(__file__).parent / "taxonomy_embeddings.json"


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
    embedding: tuple[
        float, ...
    ] = ()  # pre-computed; populated by load_taxonomy from taxonomy_embeddings.json


Taxonomy = dict[str, TaxonomyNode]


def load_taxonomy(
    path: Path = _DEFAULT_TAXONOMY_PATH,
    embeddings_path: Path = _DEFAULT_EMBEDDINGS_PATH,
) -> Taxonomy:
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

    embeddings: dict[str, tuple[float, ...]] = {}
    raw_emb: dict[str, list[float]] = json.loads(
        embeddings_path.read_text(encoding="utf-8")
    )
    embeddings = {k: tuple(v) for k, v in raw_emb.items()}

    return {
        qcode: TaxonomyNode(
            medtop_id=qcode,
            name=name,
            definition=definition,
            parent_id=parent_id,
            ancestors=_ancestors(qcode),
            depth=len(_ancestors(qcode)) - 1,
            embedding=embeddings.get(qcode, ()),
        )
        for qcode, (name, definition, parent_id) in raw.items()
    }
