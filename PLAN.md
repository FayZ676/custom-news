# RSS Semantic Reader — Project Plan

## Overview

A self-hostable, open source RSS feed reader with interest-based relevance ranking. Users subscribe to a curated catalog of feeds, define their interests in natural language, and receive a personalized feed of articles ranked by relevance — without having to search manually.

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

## Architecture

The project is a monorepo with two packages: a stateless Python backend and a NextJS frontend.

```
Backend (stateless Python API)
    └── Responsible for fetching, parsing, embedding, and ranking articles
    └── No knowledge of users, persistence, or auth
    └── Accepts feeds and queries, returns ranked articles

Frontend (NextJS — full stack)
    └── Supabase — persistence, auth, pgvector
    └── Feed catalog and user subscriptions
    └── User interests and groups
    └── Scheduling — periodic feed fetching via backend
    └── Client UI — article reading, interest management, groups
```

---

## Stack

### Backend
| Component          | Technology                                            |
| ------------------ | ----------------------------------------------------- |
| API Framework      | FastAPI                                               |
| Embeddings         | sentence-transformers (`all-MiniLM-L6-v2`) by default |
| Embedder Interface | Pluggable — swappable via config                      |
| Feed Parsing       | feedparser                                            |
| Containerization   | Docker                                                |

### Frontend
| Component      | Technology            |
| -------------- | --------------------- |
| Framework      | NextJS (full stack)   |
| Database       | Supabase (PostgreSQL) |
| Vector Search  | Supabase pgvector     |
| Authentication | Supabase Auth         |

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
2. Run the provided migration script to set up schema
3. Copy `.env.example` to `.env` and paste in Supabase URL and API keys
4. Run the app via Docker

Infrastructure as Code (Supabase CLI migrations) will be provided to make setup as simple as possible.

---

## Backend API

The backend is a stateless ranking and embedding service. It has no knowledge of users, feeds, or persistence. The frontend supplies feeds and queries, the backend returns ranked articles.

### Rank
```
POST   /rank
```

Request:
```json
{
  "feeds": ["https://techcrunch.com/feed", "..."],
  "queries": ["AI research", "startup funding"]
}
```

Response:
```json
{
  "rankings": [
    {
      "query": "AI research",
      "results": [
        {
          "feed_url": "...",
          "title": "...",
          "url": "...",
          "content": "...",
          "published_at": "...",
          "relevance_score": 0.92
        }
      ]
    },
    {
      "query": "startup funding",
      "results": [...]
    }
  ]
}
```

### Embed
```
POST   /embed
```

Request:
```json
{
  "texts": ["AI research and large language models", "..."]
}
```

Response:
```json
{
  "embeddings": [[0.1, 0.2, ...], ...],
  "model": "all-MiniLM-L6-v2"
}
```

### System
```
GET    /health
GET    /config
```

---

## Frontend Responsibilities

All user-facing concerns live in the NextJS frontend:

### Supabase Schema

#### `catalog_feeds`
Global feed catalog, maintained by the app.

| Column             | Type      | Notes       |
| ------------------ | --------- | ----------- |
| id                 | uuid      | primary key |
| title              | text      |             |
| url                | text      | unique      |
| suggested_category | text      | nullable    |
| created_at         | timestamp |             |

#### `articles`
Fetched and stored by the frontend on a schedule.

| Column          | Type        | Notes                        |
| --------------- | ----------- | ---------------------------- |
| id              | uuid        | primary key                  |
| feed_id         | uuid        | references catalog_feeds(id) |
| title           | text        |                              |
| url             | text        | unique                       |
| content         | text        | full article content         |
| published_at    | timestamp   |                              |
| embedding       | vector(384) | pgvector                     |
| embedding_model | text        |                              |
| created_at      | timestamp   |                              |

#### `user_subscriptions`
| Column     | Type      | Notes                          |
| ---------- | --------- | ------------------------------ |
| user_id    | uuid      | references users(id)           |
| feed_id    | uuid      | references catalog_feeds(id)   |
| created_at | timestamp |                                |
|            |           | primary key (user_id, feed_id) |

#### `user_article_state`
| Column     | Type      | Notes                             |
| ---------- | --------- | --------------------------------- |
| user_id    | uuid      | references users(id)              |
| article_id | uuid      | references articles(id)           |
| is_read    | boolean   | default false                     |
| is_saved   | boolean   | default false                     |
| created_at | timestamp |                                   |
|            |           | primary key (user_id, article_id) |

#### `user_groups`
| Column     | Type      | Notes                |
| ---------- | --------- | -------------------- |
| id         | uuid      | primary key          |
| user_id    | uuid      | references users(id) |
| name       | text      |                      |
| created_at | timestamp |                      |

#### `user_group_feeds`
| Column   | Type | Notes                           |
| -------- | ---- | ------------------------------- |
| group_id | uuid | references user_groups(id)      |
| feed_id  | uuid | references catalog_feeds(id)    |
|          |      | primary key (group_id, feed_id) |

#### `user_interests`
| Column          | Type        | Notes                           |
| --------------- | ----------- | ------------------------------- |
| id              | uuid        | primary key                     |
| user_id         | uuid        | references users(id)            |
| query           | text        |                                 |
| embedding       | vector(384) | pre-computed via backend /embed |
| embedding_model | text        |                                 |
| created_at      | timestamp   |                                 |

#### `user_article_scores`
| Column     | Type      | Notes                                    |
| ---------- | --------- | ---------------------------------------- |
| user_id    | uuid      | references users(id)                     |
| article_id | uuid      | references articles(id)                  |
| score      | float     | max similarity across all user interests |
| updated_at | timestamp |                                          |
|            |           | primary key (user_id, article_id)        |

### Frontend API Routes

```
# Auth (Supabase)
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh

# Catalog
GET    /catalog
GET    /catalog?category=Technology

# Subscriptions
POST   /subscriptions
DELETE /subscriptions/{feed_id}
GET    /subscriptions

# Groups
POST   /groups
GET    /groups
DELETE /groups/{id}
PATCH  /groups/{id}
POST   /groups/{id}/feeds
DELETE /groups/{id}/feeds/{feed_id}
GET    /groups/{id}/feeds

# Interests
POST   /interests
GET    /interests
DELETE /interests/{id}

# Articles
GET    /articles
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

---

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
- User subscriptions and personal feed groups
- User interest queries with pre-computed relevance scoring
- Articles ranked by relevance to user interests
- Read/unread and saved/unsaved article state
- Stateless Python backend — fetch, embed, rank
- Pluggable embedder (local by default)
- NextJS frontend with Supabase
- Docker deployment
- CI pipeline: feed validation + ranking golden dataset tests

## V2 / Future

- Custom user-added feeds
- Keyword filtering alongside interest-based ranking
- AI summarization
- Billing / subscription management for hosted tier
- Frontier embedding model evaluation (OpenAI, Cohere) vs local baseline

