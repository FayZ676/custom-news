import uuid
from concurrent.futures import ThreadPoolExecutor

from pydantic import BaseModel

from openfeed.db.client import Client
from openfeed.llm import generate_response
from openfeed.clusterer import cluster_articles
from openfeed.db.global_articles import get_global_articles
from openfeed.db.global_stories import delete_stories, insert_stories
from openfeed.database_models import PublicGlobalArticles, PublicGlobalStories


def top_stories(db: Client):
    class TopStoryLLMResponse(BaseModel):
        headline: str
        summary: str

    def process_cluster(cluster: list[PublicGlobalArticles]) -> PublicGlobalStories:
        articles_text = "\n".join(
            f"{article.title}: {article.url}" for article in cluster
        )
        prompt = f"""You are a veteran newspaper copy editor writing front-page briefs.

## Sources
{articles_text}

## Task
Distill these sources into ONE punchy story brief.

**headline**: Write it like a tabloid front page — active verbs, no filler, max 10 words. Grab the reader by the collar.
**summary**: Two sentences, max. Lead with the single most newsworthy fact. Follow with stakes or what happens next. Every word must earn its place.

## Rules
- Write about the NEWS, not about the coverage.
- No hedging, no passive voice, no editorializing. Hard facts, sharp language."""
        llm_response = generate_response(prompt, TopStoryLLMResponse)
        return PublicGlobalStories(
            id=uuid.uuid4(),
            headline=llm_response.headline,
            summary=llm_response.summary,
            related_articles_urls=[article.url for article in cluster],
        )

    articles = get_global_articles(db)
    clusters = cluster_articles(articles)
    top_clusters = [c for c in clusters if len(c) >= 10]

    with ThreadPoolExecutor(max_workers=5) as executor:
        stories = list(executor.map(process_cluster, top_clusters))

    delete_stories(db)
    insert_stories(db, stories)


if __name__ == "__main__":
    from openfeed.db.client import client

    top_stories(client())
