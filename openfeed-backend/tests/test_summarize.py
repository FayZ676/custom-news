from unittest.mock import MagicMock, patch

import pytest

from openfeed.summarize import _ArticleTextExtractor, _fetch_article_text, generate_summary


class TestArticleTextExtractor:
    def test_extracts_plain_text(self):
        extractor = _ArticleTextExtractor()
        extractor.feed("<p>Hello world</p>")
        assert "Hello world" in extractor.get_text()

    def test_skips_script_tags(self):
        extractor = _ArticleTextExtractor()
        extractor.feed("<script>var x = 1;</script><p>Visible</p>")
        text = extractor.get_text()
        assert "var x" not in text
        assert "Visible" in text

    def test_skips_style_tags(self):
        extractor = _ArticleTextExtractor()
        extractor.feed("<style>.hidden { display: none; }</style><p>Article body</p>")
        text = extractor.get_text()
        assert ".hidden" not in text
        assert "Article body" in text

    def test_skips_nav_and_footer(self):
        extractor = _ArticleTextExtractor()
        extractor.feed("<nav>Menu</nav><article>Content</article><footer>Footer</footer>")
        text = extractor.get_text()
        assert "Menu" not in text
        assert "Footer" not in text
        assert "Content" in text

    def test_handles_nested_skip_tags(self):
        extractor = _ArticleTextExtractor()
        extractor.feed("<script><script>inner</script></script><p>After</p>")
        text = extractor.get_text()
        assert "inner" not in text
        assert "After" in text

    def test_empty_html(self):
        extractor = _ArticleTextExtractor()
        extractor.feed("")
        assert extractor.get_text() == ""


class TestFetchArticleText:
    def test_returns_cleaned_text(self):
        mock_response = MagicMock()
        mock_response.text = "<html><body><p>Article content here</p></body></html>"
        mock_response.raise_for_status = MagicMock()

        with patch("openfeed.summarize.requests.get", return_value=mock_response):
            result = _fetch_article_text("https://example.com/article")

        assert "Article content here" in result

    def test_truncates_to_max_chars(self):
        long_text = "word " * 10_000
        mock_response = MagicMock()
        mock_response.text = f"<p>{long_text}</p>"
        mock_response.raise_for_status = MagicMock()

        with patch("openfeed.summarize.requests.get", return_value=mock_response):
            result = _fetch_article_text("https://example.com/article")

        from openfeed.config import settings
        assert len(result) <= settings.summarization_max_input_chars

    def test_collapses_whitespace(self):
        mock_response = MagicMock()
        mock_response.text = "<p>Word1   \n\n  Word2</p>"
        mock_response.raise_for_status = MagicMock()

        with patch("openfeed.summarize.requests.get", return_value=mock_response):
            result = _fetch_article_text("https://example.com/article")

        assert "  " not in result


class TestGenerateSummary:
    def test_returns_none_when_no_api_key(self):
        mock_fetch = MagicMock(return_value="Some article text.")

        with (
            patch("openfeed.summarize._fetch_article_text", mock_fetch),
            patch.dict("os.environ", {}, clear=True),
            patch("openfeed.summarize.os.getenv", return_value=None),
        ):
            result = generate_summary("https://example.com/article")

        assert result is None

    def test_returns_summary_on_success(self):
        mock_fetch = MagicMock(return_value="This is the article text.")
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "A short summary."}}]
        }

        with (
            patch("openfeed.summarize._fetch_article_text", mock_fetch),
            patch("openfeed.summarize.os.getenv", return_value="test-api-key"),
            patch("openfeed.summarize.requests.post", return_value=mock_response),
        ):
            result = generate_summary("https://example.com/article")

        assert result == "A short summary."

    def test_returns_none_when_fetch_fails(self):
        with patch(
            "openfeed.summarize._fetch_article_text",
            side_effect=Exception("connection refused"),
        ):
            result = generate_summary("https://example.com/article")

        assert result is None

    def test_returns_none_when_no_text_extracted(self):
        with patch("openfeed.summarize._fetch_article_text", return_value=""):
            result = generate_summary("https://example.com/article")

        assert result is None

    def test_returns_none_when_openai_fails(self):
        mock_fetch = MagicMock(return_value="Some article text.")
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = Exception("API error")

        with (
            patch("openfeed.summarize._fetch_article_text", mock_fetch),
            patch("openfeed.summarize.os.getenv", return_value="test-api-key"),
            patch("openfeed.summarize.requests.post", return_value=mock_response),
        ):
            result = generate_summary("https://example.com/article")

        assert result is None

    def test_strips_whitespace_from_summary(self):
        mock_fetch = MagicMock(return_value="Article text here.")
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "  Summary with spaces.  "}}]
        }

        with (
            patch("openfeed.summarize._fetch_article_text", mock_fetch),
            patch("openfeed.summarize.os.getenv", return_value="test-api-key"),
            patch("openfeed.summarize.requests.post", return_value=mock_response),
        ):
            result = generate_summary("https://example.com/article")

        assert result == "Summary with spaces."
