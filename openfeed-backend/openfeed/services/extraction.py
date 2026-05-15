import uuid
import logging
from itertools import chain, groupby
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
from functools import partial

from pydantic import BaseModel

from openfeed.db.client import Client
from openfeed.openai_client import openai_client
from openfeed.db.global_emails import insert_email
from openfeed.db.global_articles import get_recent_global_articles
from openfeed.db.global_settings import get_global_settings
from openfeed.db.global_sub_categories import get_sub_categories_by_category
from openfeed.db.global_stories import (
    get_stories,
    delete_stories_by_category,
    insert_stories,
)
from openfeed.database_models import PublicGlobalArticles, PublicGlobalStories
from openfeed.services.cluster_scoring import score_cluster
from openfeed.clusterer import cluster_articles, reduce_clusters, deduplicate_clusters

logger = logging.getLogger(__name__)


def top_stories(db: Client):
    settings = get_global_settings(db)
    existing_stories = get_stories(db)
    all_articles = get_recent_global_articles(db, settings.clustering_window_hours)
    window_hours = float(settings.clustering_window_hours)
    now = datetime.now(timezone.utc)

    categorized = sorted(
        (a for a in all_articles if a.category_name),
        key=lambda a: a.category_name,  # type: ignore[arg-type]
    )

    stories_by_category = {
        category_name: _process_category(
            category_name=category_name,
            category_articles=list(articles),
            existing_stories=existing_stories,
            settings=settings,
            window_hours=window_hours,
            now=now,
            db=db,
        )
        for category_name, articles in groupby(
            categorized, key=lambda a: a.category_name
        )
    }

    for category_name, stories in stories_by_category.items():
        delete_stories_by_category(db, category_name)
        if stories:
            insert_stories(db, stories)

    all_new_stories = list(chain.from_iterable(stories_by_category.values()))
    if all_new_stories:
        insert_email(db, _generate_trending_news_email_section(all_new_stories))


def _process_category(
    category_name: str,
    category_articles: list[PublicGlobalArticles],
    existing_stories: list[PublicGlobalStories],
    settings,
    window_hours: float,
    now: datetime,
    db: Client,
) -> list[PublicGlobalStories]:
    category_existing = [
        s for s in existing_stories if s.category_name == category_name
    ]
    valid_tags = [sc.name for sc in get_sub_categories_by_category(db, category_name)]
    stories_by_id = {s.id: s for s in category_existing}

    clusters = cluster_articles(category_articles)
    clusters = reduce_clusters(clusters, settings.cluster_significance_threshold)
    new_clusters, matched_clusters = deduplicate_clusters(clusters, category_existing)

    with ThreadPoolExecutor(max_workers=5) as executor:
        generated = list(
            executor.map(
                partial(
                    _generate_story,
                    window_hours=window_hours,
                    now=now,
                    category_name=category_name,
                    valid_tags=valid_tags,
                ),
                new_clusters,
            )
        )
        rescored = list(
            executor.map(
                partial(
                    _rescore_matched_cluster,
                    stories_by_id=stories_by_id,
                    window_hours=window_hours,
                    now=now,
                ),
                matched_clusters.items(),
            )
        )

    logger.info(
        "top_stories [%s]: %d generated, %d rescored",
        category_name,
        len(generated),
        len(rescored),
    )
    return generated + rescored


def _rescore_matched_cluster(
    item: tuple,
    stories_by_id: dict,
    window_hours: float,
    now: datetime,
) -> PublicGlobalStories:
    story_id, articles = item
    return _rescore_story(articles, stories_by_id[story_id], window_hours, now)


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
    category_name: str,
    valid_tags: list[str] | None = None,
) -> PublicGlobalStories:
    headline, summary, tags = _generate_story_text(articles, valid_tags=valid_tags)
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
        category_name=category_name,
        tags=tags,
    )


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


def _generate_story_text(
    articles: list[PublicGlobalArticles],
    valid_tags: list[str] | None = None,
) -> tuple[str, str, list[str]]:
    class TopStoryLLMResponse(BaseModel):
        headline: str
        summary: str
        tags: list[str]

    tags_instruction = (
        f"**tags**: Choose zero or more of the following sub-category tags that apply to this story: {valid_tags}. Return only tags from this list."
        if valid_tags
        else "**tags**: Return an empty list."
    )

    prompt = f"""You are a veteran newspaper copy editor writing front-page briefs.

## Article Summaries
{"\n".join(article.summary or "" for article in articles)}

## Task
Distill the above summaries into ONE punchy story brief.

**headline**: Write it like a tabloid front page — active verbs, no filler, max 10 words. Grab the reader by the collar.
**summary**: Two sentences, max. Lead with the single most newsworthy fact. Follow with stakes or what happens next. Every word must earn its place.
{tags_instruction}

## Rules
- Write about the NEWS, not about the coverage.
- No hedging, no passive voice, no editorializing. Hard facts, sharp language."""
    llm_response = openai_client.generate_response(
        "gpt-5.4", prompt, TopStoryLLMResponse
    )
    return llm_response.headline, llm_response.summary, llm_response.tags


if __name__ == "__main__":
    from openfeed.db.client import client

    top_stories(client())
