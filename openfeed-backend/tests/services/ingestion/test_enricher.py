from unittest.mock import MagicMock

import pytest

from openfeed.clients.iptc.taxonomy import load_taxonomy
from openfeed.services.ingestion.enricher import ArticleEnricher
from openfeed.db.models import PublicGlobalArticles

FIXTURES = [
    {
        "title": (
            "US orders travelers on Air Force One to throw away gifts, pins, "
            "and burner phones after China trip"
        ),
        "summary": (
            "The U.S. ordered travelers on Air Force One to discard gifts, pins, and "
            "burner phones after a China trip amid concerns about China's intelligence "
            "and espionage capabilities."
        ),
        "expected_root": "medtop:11000000",  # politics and government
    },
    {
        "title": "Tesla reveals two Robotaxi crashes involving teleoperators",
        "summary": (
            "Tesla disclosed newly unredacted crash reports detailing two Robotaxi "
            "crashes involving teleoperators as it works to scale its autonomous "
            "ride-hailing service."
        ),
        "expected_root": "medtop:13000000",  # science and technology
    },
    {
        "title": (
            "OpenAI launches ChatGPT for personal finance, "
            "will let you connect bank accounts"
        ),
        "summary": (
            "OpenAI launched ChatGPT for personal finance, enabling users to connect "
            "bank accounts and view a dashboard covering portfolio performance, "
            "spending, subscriptions, and upcoming payments."
        ),
        "expected_root": "medtop:04000000",  # economy, business and finance
    },
    {
        "title": "Ebola outbreak: WHO declares emergency, US restricts travel, American infected",
        "summary": (
            "The WHO declared an Ebola outbreak public health emergency as the US restricted "
            "travel and the CDC arranged to move an infected American and six others to "
            "Germany for treatment."
        ),
        "expected_root": "medtop:07000000",  # health
    },
    {
        "title": "RFK Jr. forced to withdraw charter that opened CDC panel to anti-vaccine quacks",
        "summary": (
            "RFK Jr. was forced to withdraw a charter that would have expanded eligibility "
            "for a CDC panel and focused on alleged vaccine injuries, enabling anti-vaccine "
            "figures to gain influence."
        ),
        "expected_root": "medtop:07000000",  # health
    },
    {
        "title": "Gaza Is Rebuilding With Lego-Like Bricks Made From Rubble",
        "summary": (
            "Palestinians in Gaza are rebuilding shelters by crushing rubble into "
            "interlocking, Lego-like bricks because reconstruction materials remain blocked."
        ),
        "expected_root": "medtop:16000000",  # conflict, war and peace
    },
    {
        "title": "Asteroid 2026 JH2 Is About to Fly Right Past Earth—Relatively Speaking",
        "summary": (
            "Asteroid 2026 JH2 is set to pass Earth on May 18 at a distance about four times "
            "closer than the Moon, making it a notably close flyby despite being 'relatively' safe."
        ),
        "expected_root": "medtop:13000000",  # science and technology
    },
    {
        "title": "An ICE Firearms Trainer Was Involved in At Least 4 Deadly Shootings",
        "summary": (
            "David Norman, a former Phoenix police officer now running an ICE Firearms Trainer "
            "company, provided firearms training to Homeland Security's Special Response Teams "
            "and was involved in at least four deadly shootings."
        ),
        "expected_root": "medtop:02000000",  # crime, law and justice
    },
    {
        "title": "Tesla's lithium refinery discharges 231,000 gallons of polluted wastewater a day",
        "summary": (
            "Tesla's lithium refinery discharged 231,000 gallons of polluted wastewater per day, "
            "raising concerns about environmental harm from the company's operations."
        ),
        "expected_root": "medtop:06000000",  # environment
    },
    {
        "title": "Minnesota becomes first state to ban prediction markets",
        "summary": "Minnesota became the first U.S. state to ban prediction markets.",
        "expected_root": "medtop:11000000",  # politics and government
    },
    {
        "title": "CISA Admin Leaked AWS GovCloud Keys on GitHub",
        "summary": (
            "A CISA administrator leaked AWS GovCloud keys on GitHub, exposing sensitive "
            "credentials tied to the U.S. government cloud environment."
        ),
        "expected_root": "medtop:02000000",  # crime, law and justice
    },
    {
        "title": "EV drivers will pay $130 a year under Congress' 2026 transportation bill",
        "summary": (
            "Congress' 2026 transportation bill would require electric vehicle drivers to pay "
            "$130 per year to fund road use, as lawmakers argue EVs should contribute their "
            "'fair share.'"
        ),
        "expected_root": "medtop:11000000",  # politics and government
    },
]


@pytest.fixture(scope="module")
def taxonomy():
    return load_taxonomy()


@pytest.fixture(scope="module")
def article_enricher():
    return ArticleEnricher()


def _make_article(title: str, summary: str) -> PublicGlobalArticles:
    article = MagicMock(spec=PublicGlobalArticles)
    article.id = title
    article.title = title
    article.summary = summary
    return article


@pytest.fixture(scope="module")
def classified(article_enricher):
    """Run ArticleEnricher.extract_article_metadata once for all fixtures."""
    texts = ["\n\n".join(filter(None, [f["title"], f["summary"]])) for f in FIXTURES]
    results = article_enricher.extract_article_metadata(texts)
    return {f["title"]: metadata.topics for f, metadata in zip(FIXTURES, results)}
