import logging
from dataclasses import dataclass

from openfeed.db.client import Client
from openfeed.db.utils import paginated_query


logger = logging.getLogger(__name__)


@dataclass
class UserStoryDetails:
    user_id: str
    email: str
    headline: str
    url: str
    interest: str
    interest_id: str


# TODO: This needs a better name. Its not inserting stories, its upserting scores.
def batch_insert_user_stories(db: Client, scores: list[dict]):
    if scores:
        db.table("user_stories").upsert(
            scores,
            on_conflict="user_id,interest_id,story_id",
        ).execute()


def get_unread_user_story_details(db: Client, user_ids_emails: dict[str, str]):
    pages = paginated_query(
        db=db,
        table="user_stories",
        select="user_id, interest_id, is_read, global_stories(headline, related_articles_urls), user_interests(query)",
        filters={
            "is_read": False,
        },
        in_filters={
            "user_id": list(user_ids_emails.keys()),
        },
    )
    return [
        UserStoryDetails(
            user_id=row["user_id"],
            email=user_ids_emails[str(row["user_id"])],
            headline=row.get("global_stories", {}).get("headline", ""),
            url=(row.get("global_stories", {}).get("related_articles_urls") or [""])[0],
            interest=row.get("user_interests", {}).get("query", ""),
            interest_id=row["interest_id"],
        )
        for page in pages
        for row in page
    ]
