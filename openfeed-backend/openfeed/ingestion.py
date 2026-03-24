import feedparser

from openfeed.models import Article


# TODO: We should get an alert if a feed is broken.
def get_articles(url: str, top_n: int = 50) -> list[Article]:
    d = feedparser.parse(url).entries[:top_n] or []
    articles = []
    for article in d:
        try:
            articles.append(Article.model_validate(article))
        except Exception as e:
            print(e)
            print(f"FAILED TO PARSE ARTICLE:\n{article}")
    return articles
