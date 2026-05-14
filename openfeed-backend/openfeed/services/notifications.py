import logging
from zoneinfo import ZoneInfo
from itertools import groupby
from datetime import datetime, timezone

from openfeed.config import settings
from openfeed.db.client import Client
from openfeed.db.global_emails import get_latest_email
from openfeed.db.global_settings import get_global_settings
from openfeed.db.user_settings import get_all_email_notification_users
from openfeed.db.user_articles import (
    UserArticleDetails,
    get_unread_user_article_details,
)
from openfeed.resend import (
    RawEmailInput,
    send_batch_raw_emails,
    _DIGEST_TEMPLATE_HTML,
)
from openfeed.database_models import PublicUserSettings

logger = logging.getLogger(__name__)


_CAUGHT_UP_HTML = (
    '<tr><td style="padding: 32px 0; text-align: center;">'
    '<p style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #1a1a1a;">You\'re all caught up &#10003;</p>'
    '<p style="margin: 0; font-size: 14px; color: #888;">No new articles since your last visit. Check back soon.</p>'
    "</td></tr>"
)


def notify_users(db: Client) -> None:
    """Send notifications to users whose local time is currently a notification hour."""
    users_to_notify = _get_users_to_notify(db, now_utc := datetime.now(timezone.utc))

    if not users_to_notify:
        logger.info("No users are in a notification window at this time, skipping.")
        return

    top_stories_email = get_latest_email(db)
    user_ids_emails = _fetch_user_emails(db, users_to_notify)
    timezone_by_email = {
        user_ids_emails[str(u.user_id)]: u.timezone for u in users_to_notify
    }
    articles_by_email = _group_details_by_email(
        get_unread_user_article_details(db, user_ids_emails)
    )
    send_batch_raw_emails(
        emails=list(
            map(
                lambda email: _build_raw_email(
                    email,
                    top_stories_email,
                    articles_by_email,
                    now_utc,
                    timezone_by_email[email],
                ),
                user_ids_emails.values(),
            )
        ),
        api_key=settings.resend_api_key,
        from_email=settings.resend_from_email,
    )
    logger.info("notify_users completed: %d emails sent", len(user_ids_emails))


def _build_raw_email(
    email: str,
    top_stories_email,
    articles_by_email: dict[str, list[UserArticleDetails]],
    now_utc: datetime,
    user_timezone: str,
) -> RawEmailInput:
    """Build a single RawEmailInput for a given recipient by rendering HTML locally."""
    local_date = now_utc.astimezone(ZoneInfo(user_timezone))
    edition = "Morning News" if local_date.hour < 12 else "Evening News"
    subject = f"The Latest Times — {edition}, {local_date.strftime('%B %-d')}"
    top_stories_html = top_stories_email.email_text if top_stories_email else ""
    interests_html = (
        _build_interests_summary_html(articles_by_email[email])
        if email in articles_by_email
        else _CAUGHT_UP_HTML
    )
    html = (
        _DIGEST_TEMPLATE_HTML.replace("{{{TOP_STORIES_SUMMARY}}}", top_stories_html)
        .replace("{{{INTERESTS_SUMMARY}}}", interests_html)
        .replace("{{{FEED_URL}}}", settings.frontend_url)
    )
    return RawEmailInput(to=email, subject=subject, html=html)


def _get_users_to_notify(db: Client, now_utc: datetime) -> list[PublicUserSettings]:
    global_settings = get_global_settings(db)
    return [
        u
        for u in get_all_email_notification_users(db)
        # if _is_in_notification_window(u, now_utc, global_settings.notification_hours)
    ]


def _is_in_notification_window(
    user, now_utc: datetime, notification_hours: list[int]
) -> bool:
    try:
        local_hour = now_utc.astimezone(ZoneInfo(user.timezone)).hour
        return local_hour in notification_hours
    except Exception:
        logger.warning(
            "Invalid timezone for user %s: %r, skipping.", user.user_id, user.timezone
        )
        return False


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


def _render_interest_row(interest: str, group) -> str:
    """Render a single interest row as an HTML string."""
    count = sum(1 for _ in group)
    article_label = "article" if count == 1 else "articles"
    return (
        f'<tr><td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0;">'
        f'<span style="font-size: 13px; font-weight: 600; color: #1a1a1a;">{interest}</span>'
        f'<span style="font-size: 13px; color: #888; margin-left: 8px;">{count} new {article_label}</span>'
        f"</td></tr>"
    )


def _build_interests_summary_html(details: list[UserArticleDetails]) -> str:
    """Build the HTML rows injected into the INTERESTS_SUMMARY template variable."""
    grouped = groupby(
        sorted(details, key=lambda d: d.interest),
        key=lambda d: d.interest,
    )
    return "".join(_render_interest_row(interest, group) for interest, group in grouped)


if __name__ == "__main__":
    from openfeed.db.client import client

    notify_users(client())
