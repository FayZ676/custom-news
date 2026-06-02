import csv
import json
import logging
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)


_DEFAULT_TOPICS_PATH = Path(__file__).parent / "topics.csv"
_DEFAULT_EMBEDDINGS_PATH = Path(__file__).parent / "taxonomy_embeddings.json"


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
    path: Path = _DEFAULT_TOPICS_PATH,
    embeddings_path: Path = _DEFAULT_EMBEDDINGS_PATH,
) -> Taxonomy:
    """Parse the flat topic CSV file into an in-memory taxonomy dict."""
    raw: dict[str, tuple[str, str]] = {}
    with path.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            medtop_id = (row.get("medtop_id") or "").strip()
            label = (row.get("label") or "").strip()
            description = (row.get("description") or "").strip()
            if not medtop_id:
                continue
            raw[medtop_id] = (label, description)

    if not raw:
        logger.warning("No topics loaded from %s", path)

    raw_emb: dict[str, list[float]] = json.loads(
        embeddings_path.read_text(encoding="utf-8")
    )
    embeddings = {k: tuple(v) for k, v in raw_emb.items()}

    return {
        medtop_id: TaxonomyNode(
            medtop_id=medtop_id,
            name=name,
            definition=definition,
            parent_id=None,
            ancestors=(medtop_id,),
            depth=0,
            embedding=embeddings.get(medtop_id, ()),
        )
        for medtop_id, (name, definition) in raw.items()
    }
