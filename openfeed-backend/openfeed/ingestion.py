import feedparser

from openfeed.models.feed_article import FeedArticle


def get_articles(url: str) -> list[FeedArticle]:
    d = feedparser.parse(url).entries or []
    articles = []
    for article in d:
        try:
            articles.append(FeedArticle.model_validate(article))
        except Exception as e:
            print(e)
            print(f"FAILED TO PARSE ARTICLE:\n{article}")
    return articles
