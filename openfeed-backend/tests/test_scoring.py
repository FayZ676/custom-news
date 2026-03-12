import pytest

from openfeed.scoring import rank_articles
from openfeed.embedder.local import LocalEmbedder
from openfeed.fixtures.collect_fixtures import load_articles


@pytest.fixture(scope="module")
def articles():
    return load_articles()


@pytest.fixture(scope="module")
def embedder():
    return LocalEmbedder()


@pytest.mark.integration
def test_rank_articles_returns_all(articles, embedder):
    articles_ranked = rank_articles(articles, "AI agents", embedder)
    assert len(articles_ranked) == len(articles)


@pytest.mark.integration
@pytest.mark.parametrize(
    "query,expected_title_fragments,top_n",
    [
        (
            "AI agents and autonomous systems",
            ["Governing Agentic AI", "Computer-Using Agent", "proactive AI agents"],
            5,
        ),
        (
            "startup fundraising and venture capital",
            ["unicorn", "mega-fund", "Breakout Ventures"],
            5,
        ),
        (
            "electric vehicles EV",
            ["Harbinger", "Lucid", "Rivian"],
            5,
        ),
        (
            "cybersecurity hacking data breach",
            ["Wiz", "FBI", "scam detection"],
            5,
        ),
        (
            "space satellites and missile defense",
            ["Anduril", "ExoAnalytic", "Van Allen"],
            5,
        ),
    ],
)
def test_rank_articles_relevant_results(
    articles, embedder, query, expected_title_fragments, top_n
):
    """For a given query, at least one expected article should appear in the top-N results."""
    ranked = rank_articles(articles, query, embedder)
    top_titles = [article.article.title for article in ranked[:top_n]]

    matched = [
        fragment
        for fragment in expected_title_fragments
        if any(fragment.lower() in title.lower() for title in top_titles)
    ]
    assert matched, (
        f"Query '{query}': none of {expected_title_fragments} found in top {top_n}.\n"
        f"Top titles were: {top_titles}"
    )
