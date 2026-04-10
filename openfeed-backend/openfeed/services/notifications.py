import logging
from itertools import groupby
from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from openfeed.config import settings
from openfeed.db.client import Client
from openfeed.db.user_settings import get_all_email_notification_users
from openfeed.db.user_articles import (
    UserArticleDetails,
    get_unread_user_article_details,
)
from openfeed.resend import (
    TemplateEmailInput,
    send_batch_template_emails,
    NEW_ARTICLES_TEMPLATE_ALIAS,
    CAUGHT_UP_TEMPLATE_ALIAS,
)
from openfeed.database_models import PublicUserSettings

logger = logging.getLogger(__name__)


def send_user_notifications(db: Client) -> None:
    """Send notifications to users whose local time is currently a notification hour."""
    users_to_notify = _get_users_to_notify(db, datetime.now(timezone.utc))

    if not users_to_notify:
        logger.info("No users are in a notification window at this time, skipping.")
        return

    user_ids_emails = _fetch_user_emails(db, users_to_notify)
    articles_by_email = _group_details_by_email(
        get_unread_user_article_details(db, user_ids_emails)
    )

    caught_up_emails = [
        e for e in user_ids_emails.values() if e not in articles_by_email
    ]
    if caught_up_emails:
        _send_caught_up_emails(caught_up_emails)
    if articles_by_email:
        _send_new_articles_emails(articles_by_email)


def _is_in_notification_window(user: PublicUserSettings, now_utc: datetime) -> bool:
    """Return True if the user's local hour is a configured notification hour."""
    try:
        local_hour = now_utc.astimezone(ZoneInfo(user.timezone)).hour
        return local_hour in settings.notification_hours
    except ZoneInfoNotFoundError:
        logger.warning(
            "Unknown timezone '%s' for user %s, skipping.",
            user.timezone,
            user.user_id,
        )
        return False


def _get_users_to_notify(db: Client, now_utc: datetime) -> list[PublicUserSettings]:
    """Return all users whose local time currently falls in a notification window."""
    return [
        user
        for user in get_all_email_notification_users(db)
        if _is_in_notification_window(user, now_utc)
    ]


def _fetch_user_emails(db: Client, users: list[PublicUserSettings]) -> dict[str, str]:
    """Resolve each user's email address from the auth service, keyed by user_id."""
    return {
        str(user.user_id): db.auth.admin.get_user_by_id(str(user.user_id)).user.email  # type: ignore
        for user in users
    }


def _group_details_by_email(
    details: list[UserArticleDetails],
) -> dict[str, list[UserArticleDetails]]:
    """Group article details by recipient email address."""
    return {
        email: list(group)
        for email, group in groupby(
            sorted(details, key=lambda d: d.email),
            key=lambda d: d.email,
        )
    }


def _send_caught_up_emails(emails: list[str]) -> None:
    """Notify users who have no unread articles that they are all caught up."""
    send_batch_template_emails(
        emails=[
            TemplateEmailInput(
                to=email,
                template_id=CAUGHT_UP_TEMPLATE_ALIAS,
                variables={"FEED_URL": settings.frontend_url},
            )
            for email in emails
        ],
        api_key=settings.resend_api_key,
        from_email=settings.resend_from_email,
    )


def _send_new_articles_emails(
    articles_by_email: dict[str, list[UserArticleDetails]],
) -> None:
    """Send a personalised new-articles digest to each user with unread content."""
    send_batch_template_emails(
        emails=[
            TemplateEmailInput(
                to=email,
                template_id=NEW_ARTICLES_TEMPLATE_ALIAS,
                variables={
                    "INTERESTS_SUMMARY": _build_interests_summary_html(details),
                    "FEED_URL": settings.frontend_url,
                },
            )
            for email, details in articles_by_email.items()
        ],
        api_key=settings.resend_api_key,
        from_email=settings.resend_from_email,
    )


def _build_interests_summary_html(details: list[UserArticleDetails]) -> str:
    """Build the HTML rows injected into the INTERESTS_SUMMARY template variable."""
    rows = ""
    for interest, group in groupby(
        sorted(details, key=lambda d: d.interest),
        key=lambda d: d.interest,
    ):
        count = sum(1 for _ in group)
        article_label = "article" if count == 1 else "articles"
        rows += (
            f'<tr><td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0;">'
            f'<span style="font-size: 13px; font-weight: 600; color: #1a1a1a;">{interest}</span>'
            f'<span style="font-size: 13px; color: #888; margin-left: 8px;">{count} new {article_label}</span>'
            f"</td></tr>"
        )
    return rows
