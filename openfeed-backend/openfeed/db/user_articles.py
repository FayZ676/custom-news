import logging
from dataclasses import dataclass

from openfeed.db.client import Client
from openfeed.db.utils import paginated_query


logger = logging.getLogger(__name__)


@dataclass
class UserArticleDetails:
    user_id: str
    email: str
    title: str
    url: str
    interest: str
    interest_id: str


def batch_insert_user_articles(db: Client, scores: list[dict]):
    if scores:
        db.table("user_articles").upsert(
            scores,
            on_conflict="user_id,interest_id,article_id",
        ).execute()


def get_unread_user_article_details(db: Client, user_ids_emails: dict[str, str]):
    pages = paginated_query(
        db=db,
        table="user_articles",
        select="user_id, interest_id, is_read, global_articles(title, url), user_interests(query)",
        filters={
            "is_read": False,
        },
        in_filters={
            "user_id": list(user_ids_emails.keys()),
        },
    )
    return [
        UserArticleDetails(
            user_id=row["user_id"],
            email=user_ids_emails[str(row["user_id"])],
            title=row.get("global_articles", {}).get("title", ""),
            url=row.get("global_articles", {}).get("url", ""),
            interest=row.get("user_interests", {}).get("query", ""),
            interest_id=row["interest_id"],
        )
        for page in pages
        for row in page
    ]
