from concurrent.futures import ThreadPoolExecutor

from openfeed.openai_client import openai_client
from openfeed.models import ArticleMetadata, EntitiesResponse


def extract_article_metadata(
    articles: list[str],
) -> list[ArticleMetadata]:
    def process(text: str) -> ArticleMetadata:
        prompt = f"""Your task is to extract the key named entities, write a summary, and score the newsworthiness of this article.

Steps:
1. Identify the core subject or story in one sentence.
2. Extract only the specific named entities central to that story — including but not limited to named people, organizations, products, technologies, places, or events.
3. Prefer the most specific entity over its parent when it IS the story. Extract "GitHub Copilot" not "Microsoft". Extract "GPT-Rosalind" not "OpenAI" (unless OpenAI itself is the story).
4. For roundup or list-style articles (security bulletins, weekly digests, "best of" lists, release changelogs), do NOT extract every item in the list. Instead extract only the subject of the roundup itself — e.g. for a security update bulletin covering many Linux packages, extract the distributions ("Debian", "Ubuntu", "Red Hat") but not the individual packages.
5. Limit yourself to the 3–7 most central entities. If you find yourself extracting more than 7, you are likely including peripheral or list items — revisit and trim.
6. Return an empty list if no specific named entities are present.
7. Write a 1 sentence summary focused on the specific event, development, or situation at the core of the article. Use precise, concrete language — name the key entities, describe what happened or changed, and avoid filler phrases. Do NOT use meta-framing like "The article discusses" or "This piece covers" — write the summary directly. This summary should maximally distinguish the article's topic from other articles on related subjects.
8. Score the article's newsworthiness and societal importance on a scale from 0.0 to 1.0 based on:
   - **Broad impact**: Does this affect a large number of people or industries?
   - **Significance**: Is this a major development, breakthrough, or decision with lasting consequences?
   - **Novelty**: Is this genuinely new and noteworthy, not routine or recurring?
   - **Stakes**: Are there real-world consequences (security, finance, health, policy, etc.)?

   Score guide:
   - 0.8–1.0: Events with immediate, broad societal impact affecting tens of millions of people.
     Examples: major geopolitical events, widespread cyberattacks on critical infrastructure (e.g. Log4Shell, SolarWinds),
     landmark court rulings or policy decisions with sweeping effects, significant scientific breakthroughs with immediate
     real-world consequences (e.g. a new approved vaccine, a fusion energy milestone).
   - 0.5–0.8: Meaningful developments affecting a large but specific industry or user base (millions of people).
     Examples: a major product launch from a market-leading company with broad consumer impact, a CVE in widely-used
     infrastructure software (e.g. OpenSSL, Linux kernel, nginx), a significant regulatory action against a large tech company,
     a notable acquisition or merger with industry-wide consequences.
   - 0.3–0.5: Noteworthy but narrow in scope — affects a specialized or professional audience (thousands to low millions).
     Examples: a CVE in niche or mid-tier software (e.g. cPanel, a specific CMS), a meaningful open-source library release
     with clear production use, a startup funding round with genuine industry relevance, a notable research paper without
     immediate application.
   - 0.0–0.3: Low-impact, routine, or promotional content.
     Examples: vendor case studies and DevOps blog posts, hardware reviews, product deals, opinion pieces, "how-to" tutorials,
     minor software version bumps, niche ML/infra optimizations targeting a narrow specialist audience (e.g. a new attention
     kernel for a specific GPU architecture), lifestyle or productivity tips.

Article text:
{text}"""
        response = openai_client.generate_response(
            "gpt-5.4-nano", prompt, EntitiesResponse
        )
        return ArticleMetadata(
            entities=response.entities,
            summary=response.summary,
            summary_embeddings=openai_client.embed([response.summary]).embeddings[0],
            significance_score=response.significance_score,
        )

    with ThreadPoolExecutor(max_workers=10) as executor:
        return list(executor.map(process, articles))
