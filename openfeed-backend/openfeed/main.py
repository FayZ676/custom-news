import os
import logging
from typing import Optional
from itertools import groupby
from contextlib import asynccontextmanager

from fastapi.responses import Response
from fastapi import FastAPI, Depends, BackgroundTasks

from openfeed.models import Article
from openfeed.auth import verify_api_key
from openfeed.ingestion import get_articles
from openfeed.embeddings import embed_texts
from openfeed.db.client import Client, client
from openfeed.db.global_articles import (
    delete_global_articles,
    insert_global_articles,
    get_global_article_urls,
)
from openfeed.db.user_settings import get_user_ids_for_frequency
from openfeed.db.global_feeds import get_global_feeds
from openfeed.resend import EmailInput, send_batch_emails
from openfeed.db.user_interests import get_user_interests
from openfeed.database_models import PublicEmailNotificationFrequency
from openfeed.db.user_articles import (
    UserArticleDetails,
    batch_insert_user_articles,
    get_unread_user_article_details,
)


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)
db_client: Optional[Client] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_client
    db_client = client()
    yield


app = FastAPI(dependencies=[Depends(verify_api_key)], lifespan=lifespan)


def get_db() -> Client:
    assert db_client is not None, "db_client not initialized"
    return db_client


@app.post("/user/notifications", status_code=202)
def user_email_notifications_send(
    frequency: PublicEmailNotificationFrequency, background_tasks: BackgroundTasks
):
    background_tasks.add_task(_notify_users, frequency)
    return Response(status_code=202)


@app.post("/global/articles", status_code=202)
def global_articles_update(background_tasks: BackgroundTasks):
    logger.info("POST /global/articles - accepted, processing in background")
    background_tasks.add_task(_fetch_articles)
    return Response(status_code=202)


@app.delete("/global/articles", status_code=202)
def global_articles_delete():
    logger.info("DELETE /global/articles - deleting old articles")
    return delete_global_articles(get_db())


def _fetch_articles():
    seen_urls = set(get_global_article_urls(get_db()))
    feed_articles = (
        (feed.title, article)
        for feed in get_global_feeds(get_db())
        for article in get_articles(feed.url)
    )
    unique_found_articles: list[tuple[str, Article]] = []
    for feed_title, article in feed_articles:
        if article.link not in seen_urls:
            seen_urls.add(article.link)
            unique_found_articles.append((feed_title, article))

    article_embeddings = embed_texts(
        [str(article) for _, article in unique_found_articles]
    )
    articles = [
        article.to_db_schema(feed_title, article_embeddings.model, embedding)
        for (feed_title, article), embedding in zip(
            unique_found_articles, article_embeddings.embeddings
        )
    ]

    if articles:
        insert_global_articles(get_db(), articles)
        for page in get_user_interests(get_db()):
            try:
                batch_insert_user_articles(get_db(), page)
            except (OSError, RuntimeError) as e:
                logger.exception("Failed to update user interest page: %s", e)

    logger.info("Fetched and inserted %d new articles", len(articles))


def _notify_users(frequency: PublicEmailNotificationFrequency):
    db = get_db()
    user_ids = get_user_ids_for_frequency(db, frequency)
    user_ids_emails: dict[str, str] = {
        id: db.auth.admin.get_user_by_id(id).user.email for id in user_ids
    }  # type: ignore
    user_article_details = get_unread_user_article_details(db, user_ids_emails)
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
                html_body=_compose_email_html(details, os.getenv("FRONTEND_URL", "")),
            )
            for email, details in user_article_details_map.items()
        ],
        api_key=os.getenv("RESEND_API_KEY", ""),
        from_email=os.getenv("RESEND_FROM_EMAIL", ""),
    )


def _compose_email_html(details: list[UserArticleDetails], feed_url: str) -> str:
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
