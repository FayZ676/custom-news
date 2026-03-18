# OpenFeed — Project Plan

## Overview

A self-hostable, open source RSS feed reader with interest-based relevance ranking. Users subscribe to a curated catalog of feeds, define their interests in natural language, and receive a personalized feed of articles ranked by relevance.

The project follows a **hybrid model**: the codebase is open source and self-hostable, while a paid hosted tier runs the same code on managed infrastructure.

---

## Architecture

Two top-level packages, each with its own `PLAN.md`:

```
openfeed-frontend/    # NextJS full-stack app — UI, auth, ranking
openfeed-database/    # Supabase migrations, seed data, and edge functions — shared concern
```

All persistence, scheduling, embedding, and user-specific logic lives in the frontend and database. There is no separate backend service.

---

## Deployment

- **Frontend** — deployed to Vercel
- **Database** — deployed to Supabase via the Supabase CLI (`supabase db push`)

### Self-Hosting

1. Create a Supabase project
2. Run `supabase db push` from `openfeed-database/` to apply migrations and seed data
3. Deploy the frontend to Vercel, connecting to the same Supabase project

---

## Cross-Cutting Concerns

### Embeddings

Articles and interest queries are embedded using OpenAI `text-embedding-3-small` at 512 dimensions. The same model is used for both so their vectors are comparable.

### Article Refresh

Articles are refreshed hourly. Only new articles (not yet in the database) are embedded and inserted. Stale articles (no longer present in any feed) are deleted. If no new articles are found, the refresh exits early with no embedding cost.

### Scoring

Relevance scores are pre-computed and stored in `user_article_scores`. The top `MAX_ARTICLES_PER_INTEREST` articles per user per interest are kept. Scores are recomputed whenever new articles are added.

---

## Business Model

- **Open source** — codebase is publicly available
- **Self-hosted** — users bring their own Supabase project and Vercel deployment
- **Hosted tier** — managed version, subscription-based

---

## V1 Scope

- Curated feed catalog organized into categories
- Category subscriptions (all feeds in a category included automatically)
- Interest queries with pre-computed relevance scoring via pgvector
- Embeddings via OpenAI `text-embedding-3-small` (512 dimensions)
- Hourly article refresh — diff-based, only new articles are embedded
- NextJS frontend deployed to Vercel
- Database deployed to Supabase

## V2 / Future

- Individual feed subscriptions and custom user-added feeds
- Server-side read/unread and saved state
- AI summarization
- Billing for hosted tier
