import uuid
from concurrent.futures import ThreadPoolExecutor

from pydantic import BaseModel

from openfeed.db.client import Client
from openfeed.openai_client import openai_client
from openfeed.db.global_articles import get_global_articles
from openfeed.clusterer import cluster_articles, reduce_clusters
from openfeed.db.global_stories import delete_stories, insert_stories
from openfeed.database_models import PublicGlobalArticles, PublicGlobalStories


class TopStoryLLMResponse(BaseModel):
    headline: str
    summary: str


def top_stories(db: Client):
    articles = get_global_articles(db)
    clusters = cluster_articles(articles)
    clusters = reduce_clusters(clusters)

    with ThreadPoolExecutor(max_workers=5) as executor:
        stories = list(executor.map(_generate_story, clusters))

    delete_stories(db)
    insert_stories(db, stories)


def _generate_story(articles: list[PublicGlobalArticles]) -> PublicGlobalStories:
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
    return PublicGlobalStories(
        id=uuid.uuid4(),
        headline=llm_response.headline,
        summary=llm_response.summary,
        related_articles_urls=[article.url for article in articles],
    )


if __name__ == "__main__":
    from openfeed.db.client import client

    top_stories(client())
