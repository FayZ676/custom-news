from typing import cast

from openfeed.db.client import Client
from openfeed.db.utils import paginated_query


def get_global_topics(db: Client) -> list[dict[str, str | float]]:
    topics = [
        {
            "id": cast(str, row["id"]),
            "name": cast(str, row["name"]),
            "description": cast(str, row["description"]),
            "significance_score": float(row["significance_score"]),
        }
        for page in paginated_query(
            db,
            "global_topics",
            select="id, name, description, significance_score",
        )
        for row in page
    ]
    return sorted(
        topics,
        key=lambda topic: (
            -float(topic["significance_score"]),
            cast(str, topic["id"]),
        ),
    )
