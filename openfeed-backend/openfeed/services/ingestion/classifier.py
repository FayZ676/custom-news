import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from openfeed.database_models import PublicGlobalArticles
from openfeed.iptc.classifiers.classifier_embeddings import (
    classify_article_embeddings_full,
)
from openfeed.iptc.classifiers.classifier_llm import classify_article_llm
from openfeed.iptc.taxonomy import (
    Taxonomy,
    TaxonomyIndex,
    load_taxonomy,
    load_taxonomy_index,
)
from openfeed.openai_client import OpenAIClient

logger = logging.getLogger(__name__)


class ArticleClassifier:
    def __init__(self) -> None:
        self._taxonomy = load_taxonomy(
            Path(__file__).parent.parent.parent / "iptc" / "taxonomy.json"
        )
        self._taxonomy_index = load_taxonomy_index()
        self._client = OpenAIClient(
            model="gpt-5.4-nano",
            prompt_cache_key="iptc-classify-v1",
        )

    def classify_articles(
        self,
        articles: list[PublicGlobalArticles],
    ) -> list[tuple[PublicGlobalArticles, list[dict]]]:
        def _process(
            article: PublicGlobalArticles,
        ) -> tuple[PublicGlobalArticles, list[dict]]:
            text = "\n\n".join(filter(None, [article.title, article.summary]))
            medtop_ids = _classify(
                text, self._taxonomy, self._taxonomy_index, self._client
            )
            topics = [
                {"id": mid, "name": self._taxonomy[mid].name}
                for mid in medtop_ids
                if mid in self._taxonomy
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
                        "Classification failed for article %s (%r) — skipping topics",
                        article.id,
                        article.title,
                    )

        return results


def _classify(
    text: str,
    taxonomy: Taxonomy,
    index: TaxonomyIndex,
    client: OpenAIClient,
    # Tuned from 12 real-world fixtures across diverse IPTC categories.
    # Low top_score  → embedding has no confident signal (implied/abstract language).
    # High num_roots → embedding result is scattered across unrelated branches (noisy).
    # In practice these two conditions catch complementary failure modes:
    #   - score < 0.30 catches low-signal articles (Air Force One, Asteroid)
    #   - roots > 3   catches scattered articles (Gaza, CISA, EV tax, ICE Firearms)
    confidence_score_threshold: float = 0.30,
    confidence_roots_threshold: int = 3,
) -> list[str]:
    """Classify an article using embeddings, falling back to the LLM when unsure.

    Fast path (embeddings): one cheap embed call, deterministic, ~10x cheaper.
    Slow path (LLM):        full two-pass GPT pipeline, triggered when the
                            embedding result is low-confidence.
    """
    result = classify_article_embeddings_full(text, taxonomy, index, client)

    low_confidence = (
        result.top_score < confidence_score_threshold
        or result.num_roots > confidence_roots_threshold
    )

    if low_confidence:
        return classify_article_llm(text, taxonomy, client)

    return result.topics
