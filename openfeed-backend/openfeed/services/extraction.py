import uuid
import logging
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
from functools import partial

from openfeed.db.client import Client
from openfeed.db.global_emails import insert_email
from openfeed.db.global_articles import get_recent_global_articles
from openfeed.db.global_settings import get_global_settings
from openfeed.database_models import PublicGlobalArticles, PublicGlobalStories
from openfeed.services.significance_scoring import compute_significance_score
from openfeed.clusterer import cluster_articles, deduplicate_clusters
from openfeed.db.global_stories import (
    get_stories,
    delete_all_stories,
    insert_stories,
)
from openfeed.db.global_article_topics import get_article_topics_for_articles
from openfeed.db.global_story_topics import insert_story_topics

logger = logging.getLogger(__name__)


def top_stories(db: Client):
    settings = get_global_settings(db)
    stories = get_stories(db)
    articles = get_recent_global_articles(db, settings.clustering_window_hours)
    clusters = cluster_articles(articles)
    new_clusters, matched_clusters = deduplicate_clusters(clusters, stories)

    stories_by_id = {s.id: s for s in stories}
    window_hours = float(settings.clustering_window_hours)
    now = datetime.now(timezone.utc)

    # Generate stories: LLM for new clusters, re-score only for known clusters
    with ThreadPoolExecutor(max_workers=5) as executor:
        generated = list(
            executor.map(
                partial(_generate_story, window_hours=window_hours, now=now),
                new_clusters,
            )
        )
        rescored = list(
            executor.map(
                lambda item: _rescore_story(
                    item[1], stories_by_id[item[0]], window_hours, now
                ),
                matched_clusters.items(),
            )
        )

    all_stories = generated + rescored
    story_articles: dict = {
        story.id: articles
        for story, articles in [
            *zip(generated, new_clusters),
            *zip(rescored, matched_clusters.values()),
        ]
    }

    delete_all_stories(db)

    if all_stories:
        insert_stories(db, all_stories)
        _aggregate_and_insert_story_topics(db, story_articles, all_stories)
        insert_email(db, _generate_trending_news_email_section(all_stories))

    logger.info(
        "top_stories completed: %d generated, %d rescored",
        len(generated),
        len(rescored),
    )


def _rescore_story(
    articles: list[PublicGlobalArticles],
    prev: PublicGlobalStories,
    window_hours: float,
    now: datetime,
) -> PublicGlobalStories:
    """Re-score a known story against its updated cluster.

    Picks the most recently published article as the representative so the
    headline, summary, and embeddings stay current as new articles join.
    """
    cluster_score = compute_significance_score(
        articles, now=now, window_hours=window_hours
    )
    representative = max(articles, key=lambda a: a.published_at)
    return prev.model_copy(
        update={
            "headline": representative.title,
            "summary": representative.summary or "",
            "summary_embeddings": representative.summary_embeddings,
            "related_articles_urls": [a.url for a in articles],
            "score": cluster_score.score,
            "velocity": cluster_score.velocity,
        }
    )


def _generate_story(
    articles: list[PublicGlobalArticles],
    window_hours: float,
    now: datetime,
) -> PublicGlobalStories:
    """Generate a new story from a cluster.

    Uses the highest-significance article as the representative — its title,
    summary, and embeddings become the story. No LLM call needed.
    """
    representative = max(articles, key=lambda a: a.significance_score)
    cluster_score = compute_significance_score(
        articles, now=now, window_hours=window_hours
    )
    image_url = next((a.image_url for a in articles if a.image_url), None)
    return PublicGlobalStories(
        id=uuid.uuid4(),
        headline=representative.title,
        summary=representative.summary or "",
        summary_embeddings=representative.summary_embeddings,
        related_articles_urls=[article.url for article in articles],
        score=cluster_score.score,
        velocity=cluster_score.velocity,
        image_url=image_url,
        created_at=now,
    )


def _aggregate_and_insert_story_topics(
    db: Client,
    story_articles: dict,
    all_stories: list[PublicGlobalStories],
) -> None:
    """Aggregate article-level IPTC topics into story-level topics and insert them.

    Fetches all article topics in a single batch query, then aggregates per story
    by taking the union of all constituent article topics.
    """
    all_article_ids = [
        article.id for articles in story_articles.values() for article in articles
    ]
    article_topics = get_article_topics_for_articles(db, all_article_ids)

    story_topic_map = {
        story.id: {
            medtop_id
            for article in story_articles[story.id]
            for medtop_id in article_topics.get(article.id, set())
        }
        for story in all_stories
    }
    insert_story_topics(db, story_topic_map)


def _generate_trending_news_email_section(stories: list[PublicGlobalStories]) -> str:
    top_five = sorted(stories, key=lambda s: s.score, reverse=True)[:5]
    return "".join(_render_story_card(s) for s in top_five)


def _render_story_card(story: PublicGlobalStories) -> str:
    img_html = (
        f'<img src="{story.image_url}" alt="" style="display:block;width:100%;height:auto;border-radius:4px;margin:10px 0 12px;" />'
        if story.image_url
        else ""
    )
    return (
        f'<div style="padding: 20px 0; border-bottom: 1px solid #f0f0f0;">'
        f'<p style="margin: 0 0 4px; font-size: 17px; font-weight: 700; color: #1a1a1a; line-height: 1.3;">{story.headline}</p>'
        f"{img_html}"
        f'<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #444;">{story.summary}</p>'
        f"</div>"
    )


if __name__ == "__main__":
    from openfeed.db.client import client

    top_stories(client())
