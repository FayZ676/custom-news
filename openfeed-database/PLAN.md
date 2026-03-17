# OpenFeed Database — Plan

## Purpose

All Supabase migrations, seed data, and edge functions for the project. Independent of the frontend — a shared concern that the frontend depends on. Self-hosters run `supabase db push` from this directory to set up their own instance.

---

## Schema Overview

| Table                         | Purpose                                                   |
| ----------------------------- | --------------------------------------------------------- |
| `global_categories`           | Curated feed categories, with interest suggestions        |
| `global_feeds`                | RSS feed catalog, organized by category                   |
| `global_articles`             | Fetched articles with embeddings, shared across all users |
| `user_category_subscriptions` | Which categories each user subscribes to                  |
| `user_interests`              | User interest queries with pre-computed embeddings        |
| `user_article_scores`         | Pre-computed relevance scores per user per interest       |

All user tables have RLS enabled. Global tables (`global_categories`, `global_feeds`, `global_articles`) are readable by all authenticated and anonymous users.

---

## Edge Functions

### `fetch_articles`

Runs hourly on a schedule. Orchestrates the full article refresh cycle:

1. Delete all existing articles (cascades to `user_article_scores`)
2. Load all feeds from `global_feeds`
3. Fetch and parse each RSS feed
4. Generate embeddings for each article using Supabase built-in AI inference (`gte-small`)
5. Insert articles and embeddings into `global_articles`
6. For each user interest, call `match_articles` RPC to rank articles by similarity
7. Store the top `MAX_ARTICLES_PER_INTEREST` results in `user_article_scores`

### `embed`

Generates an embedding for a given text string using Supabase built-in AI inference (`gte-small`). Called by the frontend when a user adds a new interest query.

---

## Workflow

```bash
supabase start                       # spin up local instance
supabase db diff -f <description>    # generate migration from schema changes
supabase migration up                # apply migrations locally
supabase db push                     # apply migrations to remote project
supabase functions deploy            # deploy edge functions
```

Seed data in `seeds/` populates `global_categories` and `global_feeds` so the catalog is immediately usable after a fresh push.

---

## Environment Variables

```
PROJECT_URL=
ANON_KEY=
PUBLISHABLE_KEY=
MAX_ARTICLES_PER_INTEREST=50
```
