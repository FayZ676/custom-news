import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from pydantic import BaseModel, field_validator

from openfeed.database_models import PublicGlobalArticles
from openfeed.iptc.taxonomy import (
    Taxonomy,
    load_taxonomy,
    render_prompt_tree,
)
from openfeed.openai_client import OpenAIClient, Message

logger = logging.getLogger(__name__)


class _ClassifyResponse(BaseModel):
    medtop_ids: list[str]

    @field_validator("medtop_ids")
    @classmethod
    def _only_valid_qcodes(cls, ids: list[str]) -> list[str]:
        return [mid for mid in ids if mid.startswith("medtop:")]


class ArticleClassifier:
    def __init__(self) -> None:
        self._taxonomy = load_taxonomy(
            Path(__file__).parent.parent.parent / "iptc" / "taxonomy.json"
        )
        self._client = OpenAIClient(
            model="gpt-5.4-nano",
            prompt_cache_key="iptc-classify-v1",
            instructions=Message(
                role="system",
                content=_build_system_prompt(self._taxonomy),
            ),
        )

    def classify_articles(
        self,
        articles: list[PublicGlobalArticles],
    ) -> list[tuple[PublicGlobalArticles, list[dict]]]:
        def _process(
            article: PublicGlobalArticles,
        ) -> tuple[PublicGlobalArticles, list[dict]]:
            text = "\n\n".join(filter(None, [article.title, article.summary]))
            result = self._client.generate_response(
                [Message(role="user", content=text)],
                _ClassifyResponse,
            )
            medtop_ids = [mid for mid in result.medtop_ids if mid in self._taxonomy]
            if not medtop_ids:
                logger.warning(
                    "Classifier returned no valid topics for article %s", article.id
                )
            topics = [
                {"id": mid, "name": self._taxonomy[mid].name} for mid in medtop_ids
            ]
            return article, topics

        results: list[tuple[PublicGlobalArticles, list[dict]]] = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = {
                executor.submit(_process, article): article for article in articles
            }
            for future in as_completed(futures):
                article = futures[future]
                try:
                    results.append(future.result())
                except Exception:
                    logger.exception(
                        "Classification failed for article %s — skipping topics",
                        article.id,
                    )

        return results


_CLASSIFY_SYSTEM_PROMPT = """\
You are a news classifier using the IPTC Media Topics taxonomy.

Given an article, return the qcodes of the most specific IPTC topics that apply.
For each relevant branch of the taxonomy, choose the deepest term that accurately
describes the article's focus — do not over-generalise. Most articles belong to
one branch; some legitimately span two or three. Only include a topic if the
article substantially covers it.

Return the qcodes as a list in the medtop_ids field.

Full IPTC Media Topics taxonomy (qcode — name — definition):
{tree}
"""


def _build_system_prompt(taxonomy: Taxonomy) -> str:
    all_ids = sorted(taxonomy.keys())
    return _CLASSIFY_SYSTEM_PROMPT.format(
        tree=render_prompt_tree(all_ids, taxonomy),
    )
