# OpenFeed Backend — Plan

## Purpose

A stateless Python service responsible for two things:
1. Fetching and parsing articles from RSS feeds
2. Producing embeddings for articles and interest queries

It has no knowledge of users, auth, persistence, or ranking. Those are frontend and database concerns.

---

## Stack

| Component     | Technology                                            |
| ------------- | ----------------------------------------------------- |
| Framework     | FastAPI                                               |
| Feed parsing  | feedparser                                            |
| Embeddings    | sentence-transformers (`all-MiniLM-L6-v2`) by default |
| Embedder      | Pluggable — swappable via `EMBEDDER` env var          |

---

## API

### `POST /fetch_articles`

Fetches and parses articles from the given feeds, returning each article with its embedding.

Request:
```json
{ "feeds": [{ "id": "...", "url": "..." }] }
```

Response:
```json
[
  {
    "feed_id": "...",
    "article": { "title": "...", "link": "...", "published": "...", "content": [...] },
    "embeddings": [0.1, 0.2, ...],
    "embeddings_model": "all-MiniLM-L6-v2"
  }
]
```

Fetching and embedding are always done together — the caller always needs both.

### `POST /embed`

Embeds a single text string. Used by the frontend to embed user interest queries.

Request:
```json
{ "text": "AI research and large language models" }
```

Response:
```json
{ "embeddings": [0.1, 0.2, ...], "model": "all-MiniLM-L6-v2" }
```

---

## Embedder Interface

The embedder is a swappable component controlled via the `EMBEDDER` environment variable:

```
EMBEDDER=local     # default — sentence-transformers, free, private
EMBEDDER=openai    # OpenAI text-embedding-3-small
EMBEDDER=cohere    # Cohere embed-english-v3.0
```

All embedders implement `BaseEmbedder` with `embed_one` and `embed_many` methods. Changing the model requires re-embedding all existing data.

---

## Testing

Integration tests in `tests/test_ingestion.py` verify that each feed in `fixtures/feeds.json` returns at least one article. These run as part of the pre-push hook when ingestion-related files change.
