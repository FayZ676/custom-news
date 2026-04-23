import uuid
from concurrent.futures import ThreadPoolExecutor

from pydantic import BaseModel

from openfeed.db.client import Client
from openfeed.openai_client import openai_client
from openfeed.db.global_stories import get_stories
from openfeed.db.global_emails import insert_email
from openfeed.db.global_articles import get_global_articles
from openfeed.db.global_stories import delete_stories_by_ids, insert_stories
from openfeed.database_models import PublicGlobalArticles, PublicGlobalStories
from openfeed.clusterer import cluster_articles, reduce_clusters, deduplicate_clusters


def top_stories(db: Client):
    stories = get_stories(db)
    articles = get_global_articles(db)
    clusters = cluster_articles(articles)
    clusters = reduce_clusters(clusters)
    new_clusters, matched_story_ids = deduplicate_clusters(db, clusters, stories)
    stale_story_ids = [s.id for s in stories if s.id not in matched_story_ids]

    if stale_story_ids:
        delete_stories_by_ids(db, stale_story_ids)
    if new_clusters:
        with ThreadPoolExecutor(max_workers=5) as executor:
            new_stories = list(executor.map(_generate_story, new_clusters))

        stories = [s for s in stories if s.id not in stale_story_ids] + new_stories
        email = _generate_email([s.summary for s in stories])
        # TODO: Should we upsert instead of insert?
        insert_email(db, email)
        insert_stories(db, new_stories)


def _generate_story(articles: list[PublicGlobalArticles]) -> PublicGlobalStories:
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
    return PublicGlobalStories(
        id=uuid.uuid4(),
        headline=llm_response.headline,
        summary=llm_response.summary,
        related_articles_urls=[article.url for article in articles],
    )


def _generate_email(story_texts: list[str]) -> str:
    class EmailResponse(BaseModel):
        email: str

    prompt = f"""
### Top Stories
{"\n - ".join(story_texts)}

### Instructions
Generate an email for our newsletter concisely summarizing the above top stories.
End with a call to action directing users to visit 'The Latest Times' for more info on the above stories as well as to see additional stories."""
    llm_response = openai_client.generate_response(
        "gpt-5.4", prompt, EmailResponse, temperature=1.0
    )
    return llm_response.email


if __name__ == "__main__":
    from openfeed.db.client import client

    top_stories(client())
