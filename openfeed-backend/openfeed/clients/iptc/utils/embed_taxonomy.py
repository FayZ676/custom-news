"""Utility script: embed all IPTC taxonomy nodes and write taxonomy_embeddings.json.

Run once (or whenever taxonomy.json changes) from the repo root:

    python -m openfeed.clients.iptc.embed_taxonomy

Writes taxonomy_embeddings.json alongside taxonomy.json. load_taxonomy() picks
it up automatically on next load.
"""

import json

from openfeed.clients.iptc.taxonomy import _DEFAULT_TAXONOMY_PATH, load_taxonomy
from openfeed.clients.openai_client.client import OpenAIClient

_EMBEDDINGS_PATH = _DEFAULT_TAXONOMY_PATH.parent / "taxonomy_embeddings.json"


def main() -> None:
    taxonomy = load_taxonomy()
    nodes = list(taxonomy.values())
    node_texts = [
        f"{node.name}: {node.definition}".rstrip(": ") if node.definition else (node.name or node.medtop_id)
        for node in nodes
    ]

    print(f"Embedding {len(nodes)} taxonomy nodes…")
    response = OpenAIClient().embed(node_texts)

    embeddings = {node.medtop_id: vec for node, vec in zip(nodes, response.embeddings)}
    _EMBEDDINGS_PATH.write_text(json.dumps(embeddings), encoding="utf-8")
    print(f"Written to {_EMBEDDINGS_PATH}")


if __name__ == "__main__":
    main()
