from openfeed.iptc.classifiers.classifier_embeddings import (
    classify_article_embeddings_full,
)
from openfeed.iptc.classifiers.classifier_llm import classify_article_llm
from openfeed.iptc.taxonomy import Taxonomy, TaxonomyIndex
from openfeed.openai_client import OpenAIClient

# Tuned from 12 real-world fixtures across diverse IPTC categories.
# Low top_score  → embedding has no confident signal (implied/abstract language).
# High num_roots → embedding result is scattered across unrelated branches (noisy).
# In practice these two conditions catch complementary failure modes:
#   - score < 0.30 catches low-signal articles (Air Force One, Asteroid)
#   - roots > 3   catches scattered articles (Gaza, CISA, EV tax, ICE Firearms)
_CONFIDENCE_SCORE_THRESHOLD = 0.30
_CONFIDENCE_ROOTS_THRESHOLD = 3


def classify(
    text: str,
    taxonomy: Taxonomy,
    index: TaxonomyIndex,
    client: OpenAIClient,
) -> list[str]:
    """Classify an article using embeddings, falling back to the LLM when unsure.

    Fast path (embeddings): one cheap embed call, deterministic, ~10x cheaper.
    Slow path (LLM):        full two-pass GPT pipeline, triggered when the
                            embedding result is low-confidence.
    """
    result = classify_article_embeddings_full(text, taxonomy, index, client)

    low_confidence = (
        result.top_score < _CONFIDENCE_SCORE_THRESHOLD
        or result.num_roots > _CONFIDENCE_ROOTS_THRESHOLD
    )

    if low_confidence:
        return classify_article_llm(text, taxonomy, client)

    return result.topics
