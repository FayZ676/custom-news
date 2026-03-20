# OpenFeed — UI/UX Performance Plan

## Goals

Two principles drive all decisions in this phase:

1. **Every interaction has a response.** The UI never appears frozen. Navigations show skeletons, mutations reflect instantly, and async work happens visibly in the background.
2. **Only fetch when necessary.** Article data refreshes on an hourly schedule. The frontend cache should align with that schedule — Supabase is queried on a cache miss, not on every page visit.

---

## Data Classification

Different data has different caching needs. Everything flows from this taxonomy.

| Data | Changes when | Cache strategy |
|---|---|---|
| `global_categories`, `global_feeds` | Seed data, on deploy | Cache indefinitely, redeploy to refresh |
| `global_articles`, `user_article_scores` | Hourly (scheduled edge function) | `'use cache'`, invalidate via revalidation webhook |
| `user_interests`, `user_category_subscriptions` | User explicitly mutates | `'use cache'`, invalidate via Server Action |

---

## Caching

Docs: [`'use cache'`](https://nextjs.org/docs/app/api-reference/directives/use-cache) · [`cacheLife`](https://nextjs.org/docs/app/api-reference/functions/cacheLife) · [`cacheTag`](https://nextjs.org/docs/app/api-reference/functions/cacheTag) · [`revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)

### Static global data

Categories and feeds are queried with `'use cache'` and a long `cacheLife` with no tags. Since updates to this data are always a deliberate developer action — editing seed SQL and running `supabase db push` — a frontend redeploy is a natural part of that workflow. Next.js clears its cache on deployment, so the redeploy itself serves as the invalidation with no extra machinery needed.

### Hourly article data

Article scores are cached per-user using `'use cache'`, keyed on `userId` and `interestId` as function arguments (Next.js uses these to scope the cache entry automatically). Two tags are applied: a global `articles` tag for bulk invalidation, and a per-user `articles:{userId}` tag for surgical invalidation when a user's interests change.

The cache is invalidated **exactly when new data is available** via a revalidation webhook (see below) rather than on a fixed TTL. A one-hour TTL serves as a safety net in case the webhook fails.

### User interests and subscriptions

Interests and subscriptions are cached per-user and tagged with `interests:{userId}` and `subscriptions:{userId}` respectively. They change infrequently and only ever as a direct result of a user action, so the Server Action that performs the write also calls `revalidateTag` in the same operation. No external webhook is needed — the cache is invalidated exactly when the mutation occurs.

When interests or subscriptions change, the Server Action also invalidates the user's `articles:{userId}` tag, since ranked scores depend on both.

---

## Caching Per-User Data

Docs: [`'use cache'` — working with runtime APIs](https://nextjs.org/docs/app/getting-started/caching#working-with-runtime-apis) · [`'use cache: private'`](https://nextjs.org/docs/app/api-reference/directives/use-cache-private) · [Supabase service role](https://supabase.com/docs/guides/api/api-keys#the-servicerole-key)

`'use cache'` functions execute in an isolated environment with no access to runtime request APIs — `cookies()`, `headers()`, or `searchParams`. This is a problem because `createClient()` relies on `cookies()` to read the user's session and authenticate requests via RLS.

The solution is to split identity resolution from data fetching across two layers:

**Outside the cache boundary** — call `createClient()` normally to resolve the user's identity from the session. This is the only place cookies are touched.

**Inside the cache boundary** — accept `userId` as a plain argument and use a service role client that authenticates directly via `SUPABASE_SERVICE_ROLE_KEY`, with no cookie dependency. The `userId` is passed as an explicit filter on the query. Next.js keys the cache entry on the function's arguments, so each user gets their own isolated cache entry automatically.

The security guarantee is equivalent to RLS — the service role client is only used in server-side cached functions and is never accessible to the client.

This is explicitly the pattern Next.js recommends: read runtime APIs outside the cache scope, pass values in as arguments. The docs also introduce `'use cache: private'` as an alternative, but it caches only in the browser's memory and does not persist across page reloads — which would mean re-querying Supabase on every visit, defeating the goal of only fetching when necessary.

---

## Revalidation Webhook

Docs: [`revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag) · [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)

The edge function that runs hourly is the source of truth for when article data changes. After it finishes writing articles and scores, it calls a Route Handler on the Next.js server (`POST /api/revalidate`), which triggers `revalidateTag('articles')`.

This keeps the frontend cache in sync with the backend schedule without polling and without relying on TTL alone.

The Route Handler is protected by a shared secret (`REVALIDATE_SECRET`) verified via an `x-revalidate-secret` header. The secret is set in both the frontend and edge function environments.

---

## Streaming and Suspense

Docs: [`loading.js`](https://nextjs.org/docs/app/api-reference/file-conventions/loading) · [Streaming with Suspense](https://nextjs.org/docs/app/getting-started/fetching-data#streaming-with-suspense)

The feed page shell — layout chrome, interest tabs, navigation — renders and serves instantly with no async work. Only the article list needs to wait on data.

The article list is wrapped in a `<Suspense>` boundary with a skeleton fallback. On a cache hit, this resolves near-instantly. On a cache miss (first visit after a refresh cycle), the skeleton is visible briefly while Supabase is queried.

The `key` prop on the `<Suspense>` boundary is set to the active interest ID. This causes React to re-mount the boundary — and show the skeleton — when the user switches interest tabs, preventing stale content from a previous tab bleeding through during the transition.

`loading.tsx` files are used at the route level for initial page visit skeletons. `<Suspense>` is used within pages for section-level streaming granularity.

---

## Optimistic Updates

Docs: [`useOptimistic`](https://react.dev/reference/react/useOptimistic)

Mutations that affect visible UI state use `useOptimistic` so the interface responds before the Server Action completes. The current cases are:

- **Removing an interest** — the chip disappears immediately; if the action fails, it is restored
- **Adding an interest** — the chip appears immediately in a pending state

This pattern is limited to mutations where the expected outcome is deterministic. Write errors surface via error boundaries or toast notifications.

---

## Interest Tab Navigation

Docs: [`<Link>`](https://nextjs.org/docs/app/api-reference/components/link) · [`useSearchParams`](https://nextjs.org/docs/app/api-reference/functions/use-search-params) · [Prefetching](https://nextjs.org/docs/app/guides/prefetching)

The active interest is stored in a URL search parameter (`?interest=<id>`). This makes the active state bookmarkable, SSR-compatible, and shareable without any client-side state management. Tab switching is handled by `<Link>` components, which trigger the Suspense boundary re-mount via the `key` prop and prefetch the destination on hover.

---

## Environment Variables

```
# openfeed-frontend/.env.local
REVALIDATE_SECRET=          # shared with edge function, protects /api/revalidate
SUPABASE_SERVICE_ROLE_KEY=  # used by cached functions to query Supabase without a session

# openfeed-database/supabase/functions/.env
REVALIDATE_SECRET=          # same value as above
NEXT_PUBLIC_URL=            # frontend URL the edge function POSTs to
```
