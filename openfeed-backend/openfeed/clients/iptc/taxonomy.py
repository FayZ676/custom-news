import csv
import json
import logging
import re
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


_MEDTOP_ROOT_LEGACY_RE = re.compile(r"^medtop:(\d{2})0{6}$")
_MEDTOP_ROOT_SHORT_RE = re.compile(r"^medtop:(\d{1,2})$")
_ROOT_NUMERIC_RE = re.compile(r"^(\d{1,2})$")
_ROOT_NUMERIC_LEGACY_RE = re.compile(r"^(\d{2})0{6}$")


def normalize_medtop_id(value: str) -> str:
    """Normalize known root MedTop IDs to the short canonical form.

    Canonical root format is plain `NN` (01..17). Legacy root IDs such as
    `medtop:01000000` and `medtop:01` are mapped to `01`.
    """
    topic_id = value.strip()
    if not topic_id:
        return topic_id

    lowered = topic_id.lower()

    if match := _MEDTOP_ROOT_LEGACY_RE.fullmatch(lowered):
        return f"{int(match.group(1)):02d}"

    if match := _MEDTOP_ROOT_SHORT_RE.fullmatch(lowered):
        return f"{int(match.group(1)):02d}"

    if match := _ROOT_NUMERIC_LEGACY_RE.fullmatch(topic_id):
        return f"{int(match.group(1)):02d}"

    if match := _ROOT_NUMERIC_RE.fullmatch(topic_id):
        return f"{int(match.group(1)):02d}"

    return lowered


def load_taxonomy(
    path: Path = _DEFAULT_TOPICS_PATH,
    embeddings_path: Path = _DEFAULT_EMBEDDINGS_PATH,
) -> Taxonomy:
    """Parse the flat topic CSV file into an in-memory taxonomy dict."""
    raw: dict[str, tuple[str, str]] = {}
    with path.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            medtop_id = normalize_medtop_id(row.get("medtop_id") or "")
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
    embeddings = {normalize_medtop_id(k): tuple(v) for k, v in raw_emb.items()}

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
