import json
from pathlib import Path

from openfeed.models import Feed, Article
from openfeed.embedder.local import LocalEmbedder, EmbedManyResult


def persist(results: list[Article], path: Path) -> None:
    data = [article.model_dump(mode="json") for article in results]
    path.write_text(json.dumps(data, indent=2))


def persist_embeddings(embeddings: EmbedManyResult, path: Path) -> None:
    path.write_text(json.dumps(embeddings, indent=2))


def load_feeds() -> list[Feed]:
    feeds_path = Path(__file__).parent / "feeds.json"
    with open(feeds_path) as f:
        data = json.load(f)
    return [Feed(**feed) for feed in data["feeds"]]


def load_articles() -> list[Article]:
    articles_path = Path(__file__).parent / "articles.json"
    with open(articles_path) as f:
        data = json.load(f)
    return [Article(**article) for article in data]


def load_embeddings() -> list[list[float]]:
    embeddings_path = Path(__file__).parent / "embeddings.json"
    with open(embeddings_path) as f:
        data = json.load(f)
    return data


if __name__ == "__main__":
    article_embeddings = LocalEmbedder().embed_many(
        [str(article) for article in load_articles()]
    )
    embeddings_path = Path(__file__).parent / "embeddings.json"
    persist_embeddings(article_embeddings, embeddings_path)
