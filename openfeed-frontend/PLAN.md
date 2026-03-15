# Frontend Plan

## Overview

The frontend is a NextJS full-stack application responsible for all user-facing concerns. It interfaces with the Python backend for article fetching and embedding, and uses Supabase for persistence, authentication, and ranked article queries via pgvector.

---

## Stack

| Component      | Technology                       |
| -------------- | -------------------------------- |
| Framework      | NextJS (App Router)              |
| Language       | TypeScript                       |
| Database       | Supabase (PostgreSQL + pgvector) |
| Authentication | Supabase Auth (email/password)   |
| Server Actions | NextJS Server Actions            |

---

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── signin/
│   │   │   └── page.tsx            # sign in form
│   │   └── signup/
│   │       └── page.tsx            # sign up form
│   ├── (app)/
│   │   ├── onboarding/
│   │   │   └── page.tsx            # category selection + interest suggestions
│   │   ├── feed/
│   │   │   └── page.tsx            # ranked article feed
│   │   └── settings/
│   │       └── page.tsx            # manage categories and interests
│   └── page.tsx                    # root — redirects to /feed or /auth/signin
├── actions/
│   ├── auth.ts                     # signUp, signIn, signOut
│   ├── subscriptions.ts            # subscribeToCategory, unsubscribeFromCategory
│   ├── interests.ts                # addInterest, deleteInterest
│   └── articles.ts                 # fetchAndStoreArticles, computeAndStoreScores
├── lib/
│   ├── supabase.ts                 # browser + server Supabase clients
│   └── backend.ts                  # calls to Python backend /articles and /embed
└── components/
    ├── CategoryCard.tsx             # selectable category card
    ├── InterestChip.tsx             # interest query chip, removable
    └── ArticleCard.tsx              # article display card with relevance score
```

---

## Database Schema

These tables are defined in `db/` and managed via the Supabase CLI. Documented here for frontend reference.

### `global_categories`
| Column               | Type        | Notes                  |
| -------------------- | ----------- | ---------------------- |
| id                   | uuid        | primary key            |
| name                 | text        | unique, not null       |
| interest_suggestions | jsonb       | not null, default '[]' |
| created_at           | timestamptz |                        |

RLS: select only, open to anon and authenticated users.

### `global_feeds`
| Column      | Type        | Notes                                      |
| ----------- | ----------- | ------------------------------------------ |
| id          | uuid        | primary key                                |
| title       | text        | not null                                   |
| url         | text        | unique, not null                           |
| description | text        | not null                                   |
| category_id | uuid        | nullable, references global_categories(id) |
| created_at  | timestamptz |                                            |

RLS: select only, open to anon and authenticated users.

### `global_articles`
| Column          | Type        | Notes                       |
| --------------- | ----------- | --------------------------- |
| id              | uuid        | primary key                 |
| feed_id         | uuid        | references global_feeds(id) |
| title           | text        | not null                    |
| url             | text        | unique, not null            |
| content         | text        | not null                    |
| published_at    | timestamptz |                             |
| embedding       | vector(384) | nullable until embedded     |
| embedding_model | text        | nullable until embedded     |
| created_at      | timestamptz |                             |

RLS: select only, open to anon and authenticated users.

### `user_category_subscriptions`
| Column      | Type        | Notes                              |
| ----------- | ----------- | ---------------------------------- |
| user_id     | uuid        | references auth.users(id)          |
| category_id | uuid        | references global_categories(id)   |
| created_at  | timestamptz |                                    |
|             |             | primary key (user_id, category_id) |

### `user_interests`
| Column          | Type        | Notes                                     |
| --------------- | ----------- | ----------------------------------------- |
| id              | uuid        | primary key                               |
| user_id         | uuid        | references auth.users(id)                 |
| query           | text        | not null                                  |
| embedding       | vector(384) | not null, pre-computed via backend /embed |
| embedding_model | text        | not null                                  |
| created_at      | timestamptz |                                           |

### `user_article_scores`
| Column      | Type        | Notes                                          |
| ----------- | ----------- | ---------------------------------------------- |
| user_id     | uuid        | references auth.users(id)                      |
| interest_id | uuid        | references user_interests(id)                  |
| article_id  | uuid        | references global_articles(id)                 |
| score       | float       | cosine similarity score                        |
| updated_at  | timestamptz |                                                |
|             |             | primary key (user_id, interest_id, article_id) |
|             |             | index on (user_id, interest_id, score)         |

N is configurable via `MAX_ARTICLES_PER_INTEREST` environment variable, defaulting to 50.

---



Two Supabase client instances live in `lib/supabase.ts`:

**Browser client** — used in client components:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Server client** — used in server components and server actions:
```typescript
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
)
```

---

## Backend Client

All calls to the Python backend are centralized in `lib/backend.ts`:

```typescript
const BACKEND_URL = process.env.BACKEND_URL

export async function fetchArticles(feedUrls: string[]) {
  const res = await fetch(`${BACKEND_URL}/articles`, {
    method: 'POST',
    body: JSON.stringify({ feeds: feedUrls })
  })
  return res.json()
}

export async function embedText(text: string) {
  const res = await fetch(`${BACKEND_URL}/embed`, {
    method: 'POST',
    body: JSON.stringify({ text })
  })
  return res.json()
}
```

---

## Authentication

Email/password auth via Supabase JS client.

### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({ email, password })
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({ email, password })
```

### Sign Out
```typescript
await supabase.auth.signOut()
```

### Session Check
Pages check for an active session on load and redirect accordingly:
```typescript
const { data: { session } } = await supabase.auth.getSession()
if (!session) redirect('/auth/signin')
```

---

## User Flow

```
Sign up
    └── /onboarding         # select at least one category
                            # optionally add interests from suggestions or custom
            └── /feed       # ranked article feed

Sign in
    └── /feed               # ranked article feed

/feed (no interests yet)
    └── chronological feed from subscribed categories
    └── prompt to add interests to enable ranking
```

---

## Server Actions

All mutations are handled via NextJS Server Actions, organized by concern in `actions/`.

### `actions/auth.ts`
- `signUp(email, password)` — creates a new user, redirects to `/onboarding`
- `signIn(email, password)` — signs in, redirects to `/feed`
- `signOut()` — signs out, redirects to `/auth/signin`

### `actions/subscriptions.ts`
- `subscribeToCategory(categoryId)` — inserts into `user_category_subscriptions`
- `unsubscribeFromCategory(categoryId)` — deletes from `user_category_subscriptions`

### `actions/interests.ts`
- `addInterest(query)` — calls backend `/embed`, stores in `user_interests`
- `deleteInterest(interestId)` — deletes from `user_interests` and cleans up `user_article_scores`

### `actions/articles.ts`
- `fetchAndStoreArticles()` — fetches feed URLs for all subscribed categories, calls backend `/articles`, upserts into `global_articles`
- `computeAndStoreScores(interestId)` — queries pgvector to rank articles against an interest, stores top `MAX_ARTICLES_PER_INTEREST` results in `user_article_scores`

---

## Article Fetching and Scoring Flow

```
fetchAndStoreArticles()
    ├── Load all global_feeds for user's subscribed categories
    ├── Call backend POST /articles with feed URLs
    ├── Upsert returned articles + embeddings into global_articles
    └── For each user interest
            └── computeAndStoreScores(interestId)
                    ├── Query pgvector: rank global_articles by similarity to interest embedding
                    ├── Take top MAX_ARTICLES_PER_INTEREST results
                    └── Upsert into user_article_scores
```

---

## Ranking Query

Articles ranked for a specific interest via pgvector:

```sql
SELECT a.*, uas.score
FROM global_articles a
JOIN user_article_scores uas ON uas.article_id = a.id
WHERE uas.user_id = $1 AND uas.interest_id = $2
ORDER BY uas.score DESC
LIMIT 50;
```

---

## Pages

### `/` — Root
Checks session. Redirects to `/feed` if authenticated, `/auth/signin` if not.

### `/auth/signup` — Sign Up
Email/password sign up form. On success redirects to `/onboarding`.

### `/auth/signin` — Sign In
Email/password sign in form. On success redirects to `/feed`.

### `/onboarding` — Onboarding
1. Displays all `global_categories` as selectable cards
2. User must select at least one category before continuing
3. On category selection, interest suggestions for selected categories appear
4. User can select suggestions or type custom interests
5. Interests step is skippable
6. On completion, saves subscriptions and interests, redirects to `/feed`

### `/feed` — Article Feed
- Loads user's interests from `user_interests`
- Displays interests as tabs or filter chips
- Loads ranked articles from `user_article_scores` for selected interest
- Falls back to chronological feed if no interests, with prompt to add some
- Links to full article via `url`

### `/settings` — Settings
- Manage category subscriptions (add/remove)
- Manage interest queries (add/remove)
- Changes to interests trigger `computeAndStoreScores` recomputation

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
BACKEND_URL=
MAX_ARTICLES_PER_INTEREST=50
```
