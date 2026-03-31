import logging
import uuid

from openfeed.reranker import rerank
from openfeed.db.client import Client
from openfeed.database_models import PublicUserInterests
from openfeed.db.global_articles import query_global_articles, MAX_ARTICLES_PER_INTEREST
from openfeed.config import settings
from openfeed.resend import EmailInput, send_batch_emails, RESEND_BATCH_LIMIT

logger = logging.getLogger(__name__)


def _compose_email_body(interest_queries: list[str]) -> str:
    items = "".join(f"<li>{query}</li>" for query in interest_queries)
    return (
        "<p>Hi,</p>"
        "<p>Your feed has been updated with new articles for the following interests:</p>"
        f"<ul>{items}</ul>"
        "<p>Log in to check your updated feed.</p>"
    )


def _send_interest_update_emails(
    db: Client, user_updated_interests: dict[uuid.UUID, list[str]]
) -> None:
    if not settings.resend_api_key or not settings.resend_from_email:
        return

    email_inputs: list[EmailInput] = []
    for user_id, queries in user_updated_interests.items():
        try:
            user_response = db.auth.admin.get_user_by_id(str(user_id))
            email = user_response.user.email
            if not email:
                continue
            email_inputs.append(
                EmailInput(
                    to=email,
                    subject="Your interests have been updated",
                    body=_compose_email_body(queries),
                )
            )
        except Exception as e:
            logger.exception(
                "Failed to fetch email for user %s: %s",
                user_id,
                e,
            )

    for i in range(0, len(email_inputs), RESEND_BATCH_LIMIT):
        batch = email_inputs[i : i + RESEND_BATCH_LIMIT]
        try:
            send_batch_emails(batch, settings.resend_api_key, settings.resend_from_email)
        except Exception as e:
            logger.exception("Failed to send batch email notifications: %s", e)


def batch_insert_user_articles(db: Client, interests: list[PublicUserInterests]):
    all_scores: list[dict] = []
    user_updated_interests: dict[uuid.UUID, list[str]] = {}
    for interest in interests:
        try:
            candidates = query_global_articles(
                db, interest.embeddings, match_count=MAX_ARTICLES_PER_INTEREST * 2
            )

            if not candidates:
                continue

            reranked = rerank(interest.query, [c.document_text for c in candidates])
            top_reranked = sorted(
                reranked, key=lambda r: r.relevance_score, reverse=True
            )[:MAX_ARTICLES_PER_INTEREST]
            if top_reranked:
                all_scores.extend(
                    {
                        "user_id": str(interest.user_id),
                        "interest_id": str(interest.id),
                        "article_id": str(candidates[r.index].article_id),
                        "score": r.relevance_score,
                    }
                    for r in top_reranked
                )
                user_updated_interests.setdefault(interest.user_id, []).append(
                    interest.query
                )
        except (OSError, RuntimeError) as e:
            logger.exception(
                "Failed to query/rerank articles for interest %s (user %s): %s",
                interest.id,
                interest.user_id,
                e,
            )

    if all_scores:
        db.table("user_articles").upsert(
            all_scores,
            on_conflict="user_id,interest_id,article_id",
        ).execute()

    if user_updated_interests:
        _send_interest_update_emails(db, user_updated_interests)
