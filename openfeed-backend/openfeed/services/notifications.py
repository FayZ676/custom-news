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
from openfeed.resend import EmailInput, send_batch_emails

logger = logging.getLogger(__name__)


def send_user_notifications(db: Client, frequency: PublicEmailNotificationFrequency):
    user_ids = get_user_ids_for_frequency(db, frequency)
    user_ids_emails: dict[str, str] = {
        id: db.auth.admin.get_user_by_id(id).user.email for id in user_ids
    }  # type: ignore
    user_article_details = get_unread_user_article_details(db, user_ids_emails)

    if not user_article_details:
        send_batch_emails(
            emails=[
                EmailInput(
                    to=email,
                    subject="You're all caught up",
                    html_body=_build_email_html_caught_up(settings.frontend_url),
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
    send_batch_emails(
        emails=[
            EmailInput(
                to=email,
                subject="You have new articles waiting",
                html_body=_build_email_html_01(details, settings.frontend_url),
            )
            for email, details in user_article_details_map.items()
        ],
        api_key=settings.resend_api_key,
        from_email=settings.resend_from_email,
    )


def _build_email_html_caught_up(feed_url: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>You're all caught up</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 32px 16px;">
            <table width="600" cellpadding="0" cellspacing="0" border="0"
                   style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

              <!-- Header -->
              <tr>
                <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: #1a1a1a;">Openfeed</span>
                </td>
              </tr>

              <!-- Message -->
              <tr>
                <td style="padding: 32px 32px 24px 32px; text-align: center;">
                  <p style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #1a1a1a;">You're all caught up &#10003;</p>
                  <p style="margin: 0; font-size: 14px; color: #888;">No new articles since your last visit. Check back soon.</p>
                </td>
              </tr>

              <!-- CTA -->
              <tr>
                <td style="padding: 8px 32px 32px 32px;" align="center">
                  <a href="{feed_url}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff;
                     text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 28px;
                     border-radius: 6px; letter-spacing: 0.01em;">
                    Go to Openfeed &rarr;
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 16px 32px 28px 32px; border-top: 1px solid #f0f0f0;">
                  <p style="margin: 0; font-size: 11px; color: #bbb; text-align: center;">
                    Sent by openfeed &mdash; <a href="#" style="color: #bbb;">unsubscribe</a>
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """


# TODO: Should abstract to Resend email template.
def _build_email_html_01(details: list[UserArticleDetails], feed_url: str) -> str:
    details_per_interest = {
        k: list(g)
        for k, g in groupby(
            sorted(details, key=lambda d: d.interest),
            key=lambda d: d.interest,
        )
    }

    sections_html = ""
    for interest, group in details_per_interest.items():
        count = len(group)
        article_label = "article" if count == 1 else "articles"

        sections_html += f"""
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0;">
            <span style="font-size: 13px; font-weight: 600; color: #1a1a1a;">{interest}</span>
            <span style="font-size: 13px; color: #888; margin-left: 8px;">{count} new {article_label}</span>
          </td>
        </tr>
        """

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Your openfeed digest</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 32px 16px;">
            <table width="600" cellpadding="0" cellspacing="0" border="0"
                   style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

              <!-- Header -->
              <tr>
                <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: #1a1a1a;">Openfeed</span>
                </td>
              </tr>

              <!-- Interest summary -->
              <tr>
                <td style="padding: 28px 32px 16px 32px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    {sections_html}
                  </table>
                </td>
              </tr>

              <!-- CTA -->
              <tr>
                <td style="padding: 8px 32px 32px 32px;" align="center">
                  <a href="{feed_url}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff;
                     text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 28px;
                     border-radius: 6px; letter-spacing: 0.01em;">
                    Go to Openfeed &rarr;
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 16px 32px 28px 32px; border-top: 1px solid #f0f0f0;">
                  <p style="margin: 0; font-size: 11px; color: #bbb; text-align: center;">
                    Sent by openfeed &mdash; <a href="#" style="color: #bbb;">unsubscribe</a>
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
