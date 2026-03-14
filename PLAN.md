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

The project is a monorepo with three top-level folders: a stateless Python backend, a NextJS frontend, and a database folder containing all Supabase migrations and seed data.

```
Backend (stateless Python API)
    └── Fetches and parses articles from RSS feeds
    └── Produces embeddings for articles and queries
    └── No knowledge of users, persistence, auth, or ranking

Frontend (NextJS — full stack)
    └── Supabase — persistence, auth, pgvector
    └── Feed catalog and user subscriptions
    └── User interests and groups
    └── Scheduling — periodic feed fetching via backend
    └── Ranking — pgvector similarity queries in Supabase
    └── Client UI — article reading, interest management, groups

Database (Supabase CLI)
    └── All migrations as versioned SQL files
    └── Seed data for initial catalog feeds
    └── Independent of backend and frontend — shared concern
```

---

## Database

Managed via the Supabase CLI. The `db/` folder is self-contained and independent of the backend and frontend.

### Structure

```
db/
├── supabase/
│   ├── config.toml                              # Supabase project config
│   ├── seed.sql                                 # initial catalog_feeds rows
│   └── migrations/
│       ├── 00001_create_catalog_feeds.sql
│       ├── 00002_create_articles.sql
│       ├── 00003_create_user_subscriptions.sql
│       ├── 00004_create_user_article_state.sql
│       ├── 00005_create_user_groups.sql
│       ├── 00006_create_user_group_feeds.sql
│       ├── 00007_create_user_interests.sql
│       └── 00008_create_user_article_scores.sql
└── README.md                                    # setup instructions for self-hosters
```

### Workflow

```bash
supabase init      # initialise the supabase folder
supabase start     # spin up local Supabase instance for development
supabase db push   # apply migrations to remote Supabase project
```

### Self-hosting

Self-hosters run `supabase db push` against their own Supabase project. The `seed.sql` file populates the initial `catalog_feeds` rows so the catalog is immediately ready to use.

---

## Stack

### Backend
| Component | Technology |
|---|---|
| API Framework | FastAPI |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`) by default |
| Embedder Interface | Pluggable — swappable via config |
| Feed Parsing | feedparser |
| Containerization | Docker |

### Frontend
| Component | Technology |
|---|---|
| Framework | NextJS (full stack) |
| Database | Supabase (PostgreSQL) |
| Vector Search | Supabase pgvector |
| Authentication | Supabase Auth |

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
2. Run `supabase db push` from the `db/` folder to apply migrations and seed data
3. Copy `.env.example` to `.env` in both `backend/` and `frontend/` and paste in Supabase URL and API keys
4. Run the app via Docker

Infrastructure as Code (Supabase CLI migrations) is provided in `db/` to make setup as simple as possible.

---

## Backend API

The backend is a stateless service responsible for fetching articles from RSS feeds and producing embeddings. Ranking is handled by the frontend via Supabase pgvector similarity queries.

### Fetch Articles and Embeddings
```
POST   /articles
```

Request:
```json
{
  "feeds": ["https://techcrunch.com/feed", "..."]
}
```

Response:
```json
{
  "articles": [
    {
      "feed_url": "...",
      "title": "...",
      "url": "...",
      "content": "...",
      "published_at": "...",
      "embedding": [0.1, 0.2, ...],
      "embedding_model": "all-MiniLM-L6-v2"
    }
  ]
}
```

Fetching articles and their embeddings are always done in tandem — the caller always needs both together, never one without the other.

### Embed a Query
```
POST   /embed
```

Request:
```json
{
  "text": "AI research and large language models"
}
```

Response:
```json
{
  "embedding": [0.1, 0.2, ...],
  "model": "all-MiniLM-L6-v2"
}
```

Used by the frontend to embed user interest queries before storing them in Supabase and performing pgvector similarity searches.

### System
```
GET    /health
GET    /config
```

---

## Ranking

Ranking is handled entirely by the frontend via Supabase pgvector. Once article embeddings and query embeddings are stored, the frontend queries Supabase directly:

```sql
SELECT * FROM articles
ORDER BY embedding <=> query_embedding
LIMIT 20;
```

This keeps the backend stateless and leverages pgvector for what it is built for.

---

## Frontend Responsibilities

All user-facing concerns live in the NextJS frontend:

### Supabase Schema

#### `catalog_feeds`
Global feed catalog, maintained by the app.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| title | text | |
| url | text | unique |
| suggested_category | text | nullable |
| created_at | timestamp | |

#### `articles`
Fetched and stored by the frontend on a schedule.

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| feed_id | uuid | references catalog_feeds(id) |
| title | text | |
| url | text | unique |
| content | text | full article content |
| published_at | timestamp | |
| embedding | vector(384) | pgvector |
| embedding_model | text | |
| created_at | timestamp | |

#### `user_subscriptions`
| Column | Type | Notes |
|---|---|---|
| user_id | uuid | references users(id) |
| feed_id | uuid | references catalog_feeds(id) |
| created_at | timestamp | |
| | | primary key (user_id, feed_id) |

#### `user_article_state`
| Column | Type | Notes |
|---|---|---|
| user_id | uuid | references users(id) |
| article_id | uuid | references articles(id) |
| is_read | boolean | default false |
| is_saved | boolean | default false |
| created_at | timestamp | |
| | | primary key (user_id, article_id) |

#### `user_groups`
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| user_id | uuid | references users(id) |
| name | text | |
| created_at | timestamp | |

#### `user_group_feeds`
| Column | Type | Notes |
|---|---|---|
| group_id | uuid | references user_groups(id) |
| feed_id | uuid | references catalog_feeds(id) |
| | | primary key (group_id, feed_id) |

#### `user_interests`
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| user_id | uuid | references users(id) |
| query | text | |
| embedding | vector(384) | pre-computed via backend /embed |
| embedding_model | text | |
| created_at | timestamp | |

#### `user_article_scores`
| Column | Type | Notes |
|---|---|---|
| user_id | uuid | references users(id) |
| article_id | uuid | references articles(id) |
| score | float | max similarity across all user interests |
| updated_at | timestamp | |
| | | primary key (user_id, article_id) |

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
- User interest queries
- Stateless Python backend — fetch articles and produce embeddings
- Ranking via Supabase pgvector similarity queries
- Articles ranked per interest query, no merged view
- Read/unread and saved/unsaved article state
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

