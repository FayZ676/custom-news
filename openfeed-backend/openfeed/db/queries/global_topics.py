from openfeed.db.client import Client
from openfeed.db.models import PublicGlobalTopics
from openfeed.db.utils import paginated_query


def get_global_topics(db: Client) -> list[PublicGlobalTopics]:
    topics = [
        PublicGlobalTopics.model_validate(row)
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
            -topic.significance_score,
            topic.id,
        ),
    )
