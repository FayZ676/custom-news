# RSS Semantic Reader — Project Plan

## Overview

A self-hostable, open source RSS feed aggregator with interest-based relevance ranking. Users subscribe to a curated catalog of feeds and define their interests in natural language. All articles from their subscribed feeds are automatically ranked by relevance to those interests — no manual searching required. The goal is to surface what matters to the user passively, not to make them work for it.

The project follows a **hybrid model**: the codebase is open source and Docker-ready for self-hosters, while a paid hosted tier runs the same code on managed infrastructure.

---

## Product Vision

- Users should be able to discover relevant news without worrying about managing sources
- The app ships with a curated catalog of feeds, organized by suggested categories
- Users subscribe to feeds from the catalog and optionally organize them into personal groups
- Users define **interest queries** in natural language that describe what they care about
- All articles from subscribed feeds are ranked by relevance to the user's interests — no manual searching required
- Custom feed support is planned for v2

---

## Business Model

- **Open source** — codebase is publicly available
- **Self-hosted** — users deploy via Docker, bring their own Supabase project
- **Hosted tier** — managed version for users who don't want to self-host, subscription-based

---

## Stack

| Component          | Technology                                            |
| ------------------ | ----------------------------------------------------- |
| API Framework      | FastAPI                                               |
| Database           | Supabase (PostgreSQL)                                 |
| Vector Search      | Supabase pgvector                                     |
| Authentication     | Supabase Auth                                         |
| Embeddings         | sentence-transformers (`all-MiniLM-L6-v2`) by default |
| Embedder Interface | Pluggable — swappable via config                      |
| Feed Parsing       | feedparser                                            |
| Background Polling | APScheduler                                           |
| Containerization   | Docker                                                |

### Embedder Interface

The embedder is designed as a swappable component from day one, controlled via environment variable:

```
EMBEDDER=local        # default, sentence-transformers (free, private)
EMBEDDER=openai       # OpenAI text-embedding-3-small
EMBEDDER=cohere       # Cohere embed-english-v3.0
```

**Important:** if the embedding model is changed, all existing articles must be re-embedded since vectors from different models are not compatible. The `embedding_model` field on articles tracks which model was used.

---

## Self-Hosting

Self-hosters:
1. Create a free Supabase project
2. Run the provided migration script to set up schema and pgvector
3. Copy `.env.example` to `.env` and paste in Supabase URL and API keys
4. Run the app via Docker

Infrastructure as Code (Supabase CLI migrations) will be provided to make setup as simple as possible.

---

## Database Schema

### `catalog_feeds`
Global feed catalog, maintained by the app.

| Column             | Type      | Notes                       |
| ------------------ | --------- | --------------------------- |
| id                 | uuid      | primary key                 |
| title              | text      |                             |
| url                | text      | unique                      |
| suggested_category | text      | nullable, e.g. "Technology" |
| last_fetched_at    | timestamp | nullable                    |
| created_at         | timestamp |                             |

### `articles`
Shared across all users — fetched and embedded once per feed.

| Column          | Type        | Notes                                   |
| --------------- | ----------- | --------------------------------------- |
| id              | uuid        | primary key                             |
| feed_id         | uuid        | references catalog_feeds(id)            |
| title           | text        |                                         |
| url             | text        | unique                                  |
| content         | text        | full article content                    |
| published_at    | timestamp   |                                         |
| embedding       | vector(384) | pgvector, 384 dims for all-MiniLM-L6-v2 |
| embedding_model | text        | e.g. "all-MiniLM-L6-v2"                 |
| created_at      | timestamp   |                                         |

### `user_subscriptions`
Which catalog feeds a user follows.

| Column     | Type      | Notes                          |
| ---------- | --------- | ------------------------------ |
| user_id    | uuid      | references users(id)           |
| feed_id    | uuid      | references catalog_feeds(id)   |
| created_at | timestamp |                                |
|            |           | primary key (user_id, feed_id) |

### `user_article_state`
Per-user read/saved state. Rows only created on interaction.

| Column     | Type      | Notes                             |
| ---------- | --------- | --------------------------------- |
| user_id    | uuid      | references users(id)              |
| article_id | uuid      | references articles(id)           |
| is_read    | boolean   | default false                     |
| is_saved   | boolean   | default false                     |
| created_at | timestamp |                                   |
|            |           | primary key (user_id, article_id) |

### `user_groups`
User-defined feed groupings.

| Column     | Type      | Notes                |
| ---------- | --------- | -------------------- |
| id         | uuid      | primary key          |
| user_id    | uuid      | references users(id) |
| name       | text      |                      |
| created_at | timestamp |                      |

### `user_interests`
User-defined interest queries. Embeddings are pre-computed and stored.

| Column          | Type        | Notes                                        |
| --------------- | ----------- | -------------------------------------------- |
| id              | uuid        | primary key                                  |
| user_id         | uuid        | references users(id)                         |
| query           | text        | e.g. "AI research and large language models" |
| embedding       | vector(384) | pre-computed embedding of the query          |
| embedding_model | text        | e.g. "all-MiniLM-L6-v2"                      |
| created_at      | timestamp   |                                              |

### `user_article_scores`
Pre-computed relevance scores per user per article. Score is the highest similarity across all of the user's interest queries.

| Column     | Type      | Notes                                    |
| ---------- | --------- | ---------------------------------------- |
| user_id    | uuid      | references users(id)                     |
| article_id | uuid      | references articles(id)                  |
| score      | float     | max similarity across all user interests |
| updated_at | timestamp |                                          |
|            |           | primary key (user_id, article_id)        |

### `user_group_feeds`
Feeds within a user group.

| Column   | Type | Notes                           |
| -------- | ---- | ------------------------------- |
| group_id | uuid | references user_groups(id)      |
| feed_id  | uuid | references catalog_feeds(id)    |
|          |      | primary key (group_id, feed_id) |

---

## API

### Auth
```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
```

### Catalog
```
GET    /catalog
GET    /catalog?category=Technology
```

### Subscriptions
```
POST   /subscriptions
DELETE /subscriptions/{feed_id}
GET    /subscriptions
```

### Groups
```
POST   /groups
GET    /groups
DELETE /groups/{id}
PATCH  /groups/{id}
POST   /groups/{id}/feeds
DELETE /groups/{id}/feeds/{feed_id}
GET    /groups/{id}/feeds
```

### Interests
```
POST   /interests               # Add an interest query
GET    /interests               # List my interests
DELETE /interests/{id}          # Remove an interest
```

### Articles
```
GET    /articles                # All articles from subscribed feeds, ranked by relevance
GET    /articles?unread=true
GET    /articles?saved=true
GET    /articles?feed_id=...
GET    /articles?group_id=...
GET    /articles/{id}
POST   /articles/{id}/read
POST   /articles/{id}/unread
POST   /articles/{id}/save
POST   /articles/{id}/unsave
```

Articles are always returned ranked by pre-computed relevance score (highest first). Each article includes its score:

```json
{
  "results": [
    {
      "id": "...",
      "feed_id": "...",
      "feed_title": "...",
      "title": "...",
      "url": "...",
      "content": "...",
      "published_at": "...",
      "relevance_score": 0.92,
      "is_read": false,
      "is_saved": false
    }
  ],
  "total": 142
}
```

### System
```
GET    /health
GET    /config
```

---

## Project Structure

```
rss-reader/                          # root of the monorepo
├── backend/                         # Python API backend
│   ├── app/
│   │   ├── feeds.json               # bundled feed catalog
│   │   ├── main.py                  # FastAPI app, route registration
│   │   ├── config.py                # Settings (poll interval, embedder, etc.)
│   │   ├── database.py              # Supabase client setup
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── feed_article.py      # FeedArticle — Pydantic model & parsing layer for raw RSS entries
│   │   │   ├── article.py           # Article — full database model
│   │   │   ├── interest.py          # Interest — user interest query model
│   │   │   ├── group.py             # Group — user feed group model
│   │   │   └── user.py              # User — user model
│   │   ├── embedder/
│   │   │   ├── __init__.py
│   │   │   ├── base.py              # BaseEmbedder interface
│   │   │   ├── local.py             # sentence-transformers implementation
│   │   │   ├── openai.py            # OpenAI implementation
│   │   │   └── cohere.py            # Cohere implementation
│   │   ├── scheduler.py             # APScheduler feed polling jobs
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── catalog.py
│   │   │   ├── subscriptions.py
│   │   │   ├── groups.py
│   │   │   ├── articles.py
│   │   │   └── interests.py
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── ingestion.py         # Feed fetching, article storage, embedding
│   │       └── scoring.py           # Pre-compute and store user article scores
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── app/
│   │   │   ├── models/
│   │   │   │   └── test_feed_article.py    # tests for FeedArticle model & parsing
│   │   │   └── services/
│   │   │       └── test_ingestion.py       # tests for ingestion service
│   │   ├── fixtures/
│   │   │   ├── collect_fixtures.py         # one-time script to populate articles.json
│   │   │   ├── articles.json               # fixed corpus of real articles
│   │   │   └── ranking_cases.json          # query → expected top results
│   │   ├── test_feeds.py                   # feed catalog validation
│   │   └── test_ranking.py                 # ranking validation
│   ├── supabase/
│   │   └── migrations/              # SQL migration files
│   ├── __init__.py
│   ├── pyproject.toml               # project packaging, installable with pip install -e .
│   ├── .env.example
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                        # future UI
├── .github/
│   └── workflows/
│       └── ci.yml                   # runs both test suites on push to main
└── README.md
```

---

## Background Job Flow

```
Daily poll
    ├── Fetch new articles from all catalog feeds
    ├── Store articles + compute and store embeddings
    └── For each subscribed user
            └── Compute score (max similarity across user's interests)
                    └── Store in user_article_scores

On user adds/removes an interest
    └── Recompute user_article_scores for that user across all subscribed articles
```

---

## Testing

Both test suites run on every push to main via GitHub Actions. No external services required — all tests are self-contained.

### 1. Feed Validation

Validates every feed in `catalog/feeds.json` to ensure the catalog stays healthy. Fails the pipeline if any feed doesn't pass.

Checks per feed:
- URL responds with 200
- Valid RSS/Atom that feedparser can parse
- Has at least one article
- Articles have title, url, and published date
- Content field is present and substantial enough to embed

### 2. Ranking Validation

A golden dataset test that validates the relevance scoring behaves as expected. Uses a fixed corpus of real articles collected from feeds, paired with queries and expected top results.

```json
{
  "query": "artificial intelligence and machine learning",
  "expected_top": [
    "openai-gpt4-article-id",
    "deepmind-gemini-article-id"
  ],
  "top_n": 5
}
```

The test passes if all `expected_top` articles appear within the top N ranked results. This acts as a regression suite — if the embedding model is swapped or scoring logic changes, any degradation in ranking quality is immediately visible.

### Project structure for tests

```
tests/
    ├── fixtures/
    │   ├── articles.json          # collected real articles, fixed corpus
    │   └── ranking_cases.json     # query → expected top results
    ├── test_ranking.py            # ranking validation
    └── test_feeds.py              # feed validation

.github/
    └── workflows/
            └── ci.yml             # runs both test suites on push to main
```

## Suggested Feed Categories (v1)

Categories are suggestions only — the backend treats all feeds the same. Users can organize their subscriptions into custom groups however they like.

- Technology
- Science
- Finance
- Politics
- Sports
- Health
- World News

---

## V1 Scope

- Curated feed catalog (no custom feeds yet)
- User subscriptions
- Personal feed groups
- Article ingestion with background polling
- User interest queries with pre-computed relevance scoring
- Articles ranked by relevance to user interests
- Read/unread and saved/unsaved article state
- Pluggable embedder (local by default)
- Docker deployment
- Supabase migration scripts
- CI pipeline: feed validation + ranking golden dataset tests

## V2 / Future

- Custom user-added feeds
- Keyword filtering alongside interest-based ranking
- Manual search across articles
- AI summarization
- UI layer
- Billing / subscription management for hosted tier
- GPU-accelerated embeddings for hosted tier
- Frontier embedding model evaluation (OpenAI, Cohere) vs local baseline
