# OpenFeed Frontend — Plan

## Purpose

The NextJS full-stack application responsible for all user-facing concerns: authentication, category subscriptions, interest management, article ranking, and the UI. It orchestrates the backend and database — scheduling feed fetches, triggering ranking, and serving the personalized feed.

---

## Stack

| Component      | Technology                       |
| -------------- | -------------------------------- |
| Framework      | NextJS (App Router)              |
| Language       | TypeScript                       |
| Database       | Supabase (PostgreSQL + pgvector) |
| Authentication | Supabase Auth (email/password)   |
| Mutations      | NextJS Server Actions            |

---

## Key Decisions

**Supabase SSR client** — session management uses `@supabase/ssr` with cookie-based sessions, making the session accessible on both client and server. Always use `getClaims()` on the server, never `getSession()`.

**Backend client** — all calls to the Python backend are centralized in `lib/backend.ts`. The frontend never calls RSS feeds directly.

**Pre-computed scores** — article relevance scores are computed and stored in `user_article_scores` after each fetch, so the feed page is a simple ranked read with no runtime vector computation.

**Client-side read state** — read/unread and saved state are managed client-side for simplicity. No server persistence for these in v1.

---

## User Flow

```
Sign up → /onboarding (select categories, optionally add interests) → /feed
Sign in → /feed

/feed with no interests → chronological feed + prompt to add interests
/feed with interests    → ranked feed, one tab per interest
```

---

## Pages

| Route           | Purpose                                                  |
| --------------- | -------------------------------------------------------- |
| `/`             | Redirects to `/feed` or `/auth/signin`                   |
| `/auth/signup`  | Email/password sign up                                   |
| `/auth/signin`  | Email/password sign in                                   |
| `/onboarding`   | Category selection + interest suggestions                |
| `/feed`         | Ranked article feed, tabbed by interest                  |
| `/settings`     | Manage category subscriptions and interest queries       |

---

## Server Actions

| Action                    | What it does                                                              |
| ------------------------- | ------------------------------------------------------------------------- |
| `auth.signUp`             | Creates user, redirects to `/onboarding`                                  |
| `auth.signIn`             | Signs in, redirects to `/feed`                                            |
| `auth.signOut`            | Signs out, redirects to `/auth/signin`                                    |
| `subscriptions.subscribe` | Inserts into `user_category_subscriptions`                                |
| `subscriptions.unsubscribe` | Deletes from `user_category_subscriptions`                              |
| `interests.add`           | Calls backend `/embed`, stores result in `user_interests`                 |
| `interests.delete`        | Deletes from `user_interests` (cascades to `user_article_scores`)         |

---

## Route Protection

`middleware.ts` handles two concerns:
1. **Token refresh** — keeps the Supabase session alive
2. **Route protection** — redirects unauthenticated users away from protected routes, and authenticated users away from auth routes

Protected routes: `/feed`, `/onboarding`, `/settings`  
Auth routes: `/auth/signin`, `/auth/signup`

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
BACKEND_URL=
MAX_ARTICLES_PER_INTEREST=50
```
