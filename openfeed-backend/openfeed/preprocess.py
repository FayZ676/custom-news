from concurrent.futures import ThreadPoolExecutor

from openfeed.openai_client import openai_client
from openfeed.models import ArticleMetadata, EntitiesResponse


def extract_article_metadata(
    articles: list[str],
) -> list[ArticleMetadata]:
    def process(text: str) -> ArticleMetadata:
        prompt = f"""Your task is to extract the key named entities and write a summary that captures the core subject of this article.

Steps:
1. Identify the core subject or story in one sentence.
2. Extract only the specific named entities central to that story — including but not limited to named people, organizations, products, technologies, places, or events.
3. Prefer the most specific entity over its parent when it IS the story. Extract "GitHub Copilot" not "Microsoft". Extract "GPT-Rosalind" not "OpenAI" (unless OpenAI itself is the story).
4. For roundup or list-style articles (security bulletins, weekly digests, "best of" lists, release changelogs), do NOT extract every item in the list. Instead extract only the subject of the roundup itself — e.g. for a security update bulletin covering many Linux packages, extract the distributions ("Debian", "Ubuntu", "Red Hat") but not the individual packages.
5. Limit yourself to the 3–7 most central entities. If you find yourself extracting more than 7, you are likely including peripheral or list items — revisit and trim.
6. Return an empty list if no specific named entities are present.
7. Write a 1 sentence summary focused on the specific event, development, or situation at the core of the article. Use precise, concrete language — name the key entities, describe what happened or changed, and avoid filler phrases. Do NOT use meta-framing like "The article discusses" or "This piece covers" — write the summary directly. This summary should maximally distinguish the article's topic from other articles on related subjects.

Article text:
{text}"""
        response = openai_client.generate_response(
            "gpt-5.4-nano", prompt, EntitiesResponse
        )
        return ArticleMetadata(
            entities=response.entities,
            summary=response.summary,
            summary_embeddings=openai_client.embed([response.summary]).embeddings[0],
        )

    with ThreadPoolExecutor(max_workers=10) as executor:
        return list(executor.map(process, articles))
