import feedparser

from openfeed.models import Article


def get_articles(url: str) -> list[Article]:
    d = feedparser.parse(url).entries or []
    articles = []
    for article in d:
        try:
            articles.append(Article.model_validate(article))
        except Exception as e:
            print(e)
            print(f"FAILED TO PARSE ARTICLE:\n{article}")
    return articles
