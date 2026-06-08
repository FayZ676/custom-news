from openfeed.services.articles.enricher import _limit_article_words


def test_limit_article_words_keeps_short_text() -> None:
    text = "one two three"

    assert _limit_article_words(text, max_words=10) == text


def test_limit_article_words_truncates_to_max_words() -> None:
    text = "one two three four five"

    assert _limit_article_words(text, max_words=3) == "one two three"
