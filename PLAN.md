# OpenFeed — Project Plan

## Overview

A self-hostable, open source RSS feed reader with interest-based relevance ranking. Users subscribe to a curated catalog of feeds, define their interests in natural language, and receive a personalized feed of articles ranked by relevance.

The project follows a **hybrid model**: the codebase is open source and Docker-ready for self-hosters, while a paid hosted tier runs the same code on managed infrastructure.

---

## Architecture

Three top-level packages, each with its own `PLAN.md`:

```
openfeed-backend/     # Stateless Python API — feed fetching and embeddings
openfeed-frontend/    # NextJS full-stack app — UI, auth, ranking, scheduling
openfeed-database/    # Supabase migrations and seed data — shared concern
```

The backend is stateless and has no knowledge of users, auth, or ranking. All persistence, scheduling, and user-specific logic lives in the frontend and database.

---

## Cross-Cutting Concerns

### Embeddings

Articles and interest queries are embedded using the same model so their vectors are comparable. The embedding model is configurable via `EMBEDDER` env var; changing it requires re-embedding all existing articles. The `embedding_model` field on both `global_articles` and `user_interests` tracks which model was used.

### Scoring

Relevance scores are pre-computed and stored in `user_article_scores`. The top `MAX_ARTICLES_PER_INTEREST` articles per user per interest are kept. This is refreshed each time articles are fetched.

### Self-Hosting

1. Create a Supabase project
2. Run `supabase db push` from `openfeed-database/` to apply migrations and seed data
3. Copy `.env.example` to `.env` in each package and fill in credentials
4. Run via Docker

---

## Business Model

- **Open source** — codebase is publicly available
- **Self-hosted** — users deploy via Docker with their own Supabase project
- **Hosted tier** — managed version, subscription-based

---

## V1 Scope

- Curated feed catalog organized into categories
- Category subscriptions (all feeds in a category included automatically)
- Interest queries with pre-computed relevance scoring via pgvector
- Stateless Python backend for feed fetching and embedding
- NextJS frontend with Supabase
- Docker deployment

## V2 / Future

- Individual feed subscriptions and custom user-added feeds
- Server-side read/unread and saved state
- AI summarization
- Frontier embedding model support (OpenAI, Cohere)
- Billing for hosted tier
