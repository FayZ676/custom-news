import uuid
import logging
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
from functools import partial

from pydantic import BaseModel

from openfeed.db.client import Client
from openfeed.openai_client import openai_client
from openfeed.db.global_emails import insert_email
from openfeed.db.global_articles import get_recent_global_articles
from openfeed.db.global_settings import get_global_settings
from openfeed.database_models import PublicGlobalArticles, PublicGlobalStories
from openfeed.services.cluster_scoring import score_cluster
from openfeed.clusterer import cluster_articles, reduce_clusters, deduplicate_clusters
from openfeed.db.global_stories import (
    get_stories,
    delete_all_stories,
    insert_stories,
)

logger = logging.getLogger(__name__)


def top_stories(db: Client):
    settings = get_global_settings(db)
    stories = get_stories(db)
    articles = get_recent_global_articles(db, settings.clustering_window_hours)
    clusters = cluster_articles(articles)
    clusters = reduce_clusters(clusters, settings.cluster_significance_threshold)
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

    delete_all_stories(db)
    insert_stories(db, all_stories)

    if all_stories:
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
    """Re-score a known story against its updated cluster, preserving headline, summary, and ID."""
    cluster_score = score_cluster(articles, now=now, window_hours=window_hours)
    return prev.model_copy(
        update={
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
    headline, summary = _generate_story_text(articles)
    cluster_score = score_cluster(articles, now=now, window_hours=window_hours)
    image_url = next((a.image_url for a in articles if a.image_url), None)
    return PublicGlobalStories(
        id=uuid.uuid4(),
        headline=headline,
        summary=summary,
        related_articles_urls=[article.url for article in articles],
        score=cluster_score.score,
        velocity=cluster_score.velocity,
        image_url=image_url,
        created_at=now,
    )


def _generate_trending_news_email_section(stories: list[PublicGlobalStories]) -> str:
    top_five = sorted(stories, key=lambda s: s.score, reverse=True)[:5]
    story_data = [
        {"summary": s.summary, "urls": s.related_articles_urls[:3]} for s in top_five
    ]
    return _generate_trending_news_email_copy(story_data)


def _generate_trending_news_email_copy(stories: list[dict]) -> str:
    class CopyResponse(BaseModel):
        text: str

    story_blocks = "\n\n".join(
        f"- Summary: {s['summary']}\n  Sources: {', '.join(s['urls'])}" for s in stories
    )

    prompt = f"""
### Top Stories
{story_blocks}

### Instructions
Write a short newspaper-style digest summarizing the above stories in **Markdown format**.

Structure your output like this for each story:

### <Story Headline>

<Two sentence summary. Lead with the key fact. Use **bold** for the most critical detail and *italic* for context or stakes.>

**<u>[Read full article](<url>)</u>**

Rules:
- Use `###` headings for each story title.
- Use **bold** for key facts, figures, or names.
- Use *italic* for stakes, context, or what happens next.
- After each story body, on its own line, include a Markdown hyperlink to the most relevant provided URL formatted exactly as: **<u>[Read full article](url)</u>**
- No greetings, no sign-offs, no filler, no horizontal rules.
- Keep the entire output under 1,500 characters."""
    llm_response = openai_client.generate_response(
        "gpt-5.4", prompt, CopyResponse, temperature=1.0
    )
    return llm_response.text


def _generate_story_text(
    articles: list[PublicGlobalArticles],
) -> tuple[str, str]:
    class TopStoryLLMResponse(BaseModel):
        headline: str
        summary: str

    prompt = f"""You are a veteran newspaper copy editor writing front-page briefs.

## Article Summaries
{"\n".join(article.summary or "" for article in articles)}

## Task
Distill the above summaries into ONE punchy story brief.

**headline**: Write it like a tabloid front page — active verbs, no filler, max 10 words. Grab the reader by the collar.
**summary**: Two sentences, max. Lead with the single most newsworthy fact. Follow with stakes or what happens next. Every word must earn its place.

## Rules
- Write about the NEWS, not about the coverage.
- No hedging, no passive voice, no editorializing. Hard facts, sharp language."""
    llm_response = openai_client.generate_response(
        "gpt-5.4", prompt, TopStoryLLMResponse
    )
    return llm_response.headline, llm_response.summary


if __name__ == "__main__":
    from openfeed.db.client import client

    top_stories(client())
