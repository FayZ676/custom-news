import logging
from itertools import groupby

from openfeed.config import settings
from openfeed.db.client import Client
from openfeed.db.user_settings import get_user_ids_for_frequency
from openfeed.db.user_articles import (
    UserArticleDetails,
    get_unread_user_article_details,
)
from openfeed.database_models import PublicEmailNotificationFrequency
from openfeed.resend import (
    TemplateEmailInput,
    send_batch_template_emails,
    NEW_ARTICLES_TEMPLATE_ALIAS,
    CAUGHT_UP_TEMPLATE_ALIAS,
)

logger = logging.getLogger(__name__)


def send_user_notifications(db: Client, frequency: PublicEmailNotificationFrequency):
    user_ids = get_user_ids_for_frequency(db, frequency)
    user_ids_emails: dict[str, str] = {
        id: db.auth.admin.get_user_by_id(id).user.email for id in user_ids
    }  # type: ignore
    user_article_details = get_unread_user_article_details(db, user_ids_emails)

    if not user_article_details:
        send_batch_template_emails(
            emails=[
                TemplateEmailInput(
                    to=email,
                    template_id=CAUGHT_UP_TEMPLATE_ALIAS,
                    variables={"FEED_URL": settings.frontend_url},
                )
                for email in user_ids_emails.values()
            ],
            api_key=settings.resend_api_key,
            from_email=settings.resend_from_email,
        )
        return

    user_article_details_map = {
        k: list(g)
        for k, g in groupby(
            sorted(user_article_details, key=lambda d: d.email),
            key=lambda d: d.email,
        )
    }
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
            for email, details in user_article_details_map.items()
        ],
        api_key=settings.resend_api_key,
        from_email=settings.resend_from_email,
    )


def _build_interests_summary_html(details: list[UserArticleDetails]) -> str:
    """Build the HTML rows injected into the INTERESTS_SUMMARY template variable."""
    details_per_interest = {
        k: list(g)
        for k, g in groupby(
            sorted(details, key=lambda d: d.interest),
            key=lambda d: d.interest,
        )
    }
    rows = ""
    for interest, group in details_per_interest.items():
        count = len(group)
        article_label = "article" if count == 1 else "articles"
        rows += (
            f'<tr><td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0;">'
            f'<span style="font-size: 13px; font-weight: 600; color: #1a1a1a;">{interest}</span>'
            f'<span style="font-size: 13px; color: #888; margin-left: 8px;">{count} new {article_label}</span>'
            f"</td></tr>"
        )
    return rows
