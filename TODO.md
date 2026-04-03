Looking at both codebases, I can identify clear patterns of concern-mixing, scattered configuration, and some structural inconsistencies. Here's a concrete, step-by-step plan organized from highest to lowest impact, where each step is safe to stop at.

---

## Backend

### B1 — Centralize all configuration in `Settings`

**Problem:** `os.getenv()` calls are scattered across `embeddings.py`, `reranker.py`, `resend.py`, and `main.py`. `config.py` only captures three of the nine env vars.

**Change:** Add every env var to `Settings`. All modules import `settings` — no more raw `os.getenv`.

```python
# config.py
class Settings(BaseSettings):
    api_key: str
    openai_api_key: str
    voyageai_api_key: str
    resend_api_key: str
    resend_from_email: str
    frontend_url: str
    supabase_project_url: str
    supabase_service_role_key: str
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 512
    embedding_max_tokens_per_input: int = 8_192
    embedding_max_tokens_per_batch: int = 100_000

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
```

`pydantic-settings` handles the `env_file` loading, so you can drop the manual `include .env.prod` from the Makefile for the deploy target (use `env_file=".env.prod"` via an env var or a second `Settings` subclass).

---

### B2 — Introduce a `services/` layer; purify `db/`

**Problem:** `db/user_articles.py:batch_insert_user_articles` does three things: vector search, reranking (an external API call), and upsert. The `db/` layer should be a pure data-access layer.

**Also:** `main.py`'s `_fetch_articles`, `_notify_users`, and `_compose_email_html` are business logic disguised as private helpers on a route file.

**Create:**

```
openfeed/
  services/
    __init__.py
    ingestion.py     # article fetch + embed + score pipeline
    notifications.py # email composition + dispatch
```

**`services/ingestion.py`** owns:
- `fetch_and_embed_articles(db)` — pulled from `main._fetch_articles`
- `score_articles_for_interests(db, interests)` — the embed→rerank→score loop currently inside `db/user_articles.py:batch_insert_user_articles`

**`services/notifications.py`** owns:
- `send_user_notifications(db, frequency)` — pulled from `main._notify_users`
- `_compose_email_html(...)` — stays private to this module

**`db/user_articles.py`** becomes a pure data layer:
- `batch_insert_user_articles(db, scores: list[dict])` — just the upsert, accepts pre-computed scores
- `get_unread_user_article_details(...)` — unchanged

This makes the dependency graph explicit: `services` depends on `db` and external clients; `db` depends on nothing but `client` and `database_models`.

---

### B3 — Strip `main.py` down to route handlers

After B2, each endpoint becomes a one-liner delegation:

```python
@app.post("/global/articles", status_code=202)
def global_articles_update(background_tasks: BackgroundTasks):
    background_tasks.add_task(ingestion.fetch_and_embed_articles, get_db())
    return Response(status_code=202)

@app.post("/user/notifications", status_code=202)
def user_email_notifications_send(
    frequency: PublicEmailNotificationFrequency,
    background_tasks: BackgroundTasks,
):
    background_tasks.add_task(notifications.send_user_notifications, get_db(), frequency)
    return Response(status_code=202)
```

`main.py` should contain: imports, lifespan, app instantiation, `get_db()`, and route handlers only.

---

## Frontend

### F1 — Rename `proxy.ts` → `middleware.ts`

**Problem:** Next.js automatically picks up `middleware.ts` at the project root. The current `proxy.ts` exports a `proxy` function and a `config` matcher but isn't wired as actual middleware — the framework can't see it.

**Change:** Rename the file, rename the export to `middleware`:

```ts
// middleware.ts
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
export const config = { matcher: [...] };
```

Self-contained, zero risk.

---

### F2 — Split `lib/backend.ts` by domain

**Problem:** One 160-line file mixes types, articles, interests, and settings with no organizational seams.

**Create:**

```
lib/
  data/
    types.ts       # Article, Interest, UserArticleScore interfaces
    articles.ts    # getGlobalArticlesByPage, matchArticlesByEmbedding, getGlobalArticlesByIds, updateUserArticles, readUserArticles
    interests.ts   # getUserInterests
    settings.ts    # getUserSettings, updateUserNotificationSettings
    index.ts       # re-export everything
```

Callers import from `@/lib/data` (unchanged public API). The only edit needed in each consumer is the import path.

---

### F3 — Extract page business logic into `actions/`

**Problem:** `app/feed/[page]/page.tsx` contains three substantial functions that aren't route-level concerns:

- `searchGlobalArticles` — embeds query, does vector match, reranks
- `updateUserArticleScores` — embeds interest, matches, reranks, upserts scores  
- `saveUserInterest` — calls `addInterest`, then `updateUserArticleScores`

**Create `actions/search.ts`:**
```ts
"use server";
export async function searchArticles(query: string): Promise<Article[]>
```

**Extend `actions/interests.ts`** with `saveInterestAndScore`, absorbing `saveUserInterest` + `updateUserArticleScores`. The `addInterest` action already exists there — this is the natural home.

The page component then becomes pure data-fetching + prop composition with no embedded logic.

---

### F4 — Extract a `useDrawer` hook

**Problem:** `DrawerMenu.tsx` and `DrawerOptions.tsx` both implement identical checkbox-drawer open/close boilerplate:

```tsx
const checkboxRef = useRef<HTMLInputElement>(null);
function closeDrawer() {
  if (checkboxRef.current) checkboxRef.current.checked = false;
}
```

**Create `hooks/useDrawer.ts`:**

```ts
export function useDrawer() {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const close = useCallback(() => {
    if (checkboxRef.current) checkboxRef.current.checked = false;
  }, []);
  return { checkboxRef, close };
}
```

Both drawer components call `const { checkboxRef, close } = useDrawer()` and drop ~6 lines each.

---

### F5 — Create a `FeedLayout` component

**Problem:** `ViewFeed` and `ViewInterestFeed` share the same outer scaffold:

```tsx
<div className="flex flex-col gap-8">
  <Navbar left={<DrawerMenu ... />} center={...} right={...} />
  {/* content */}
</div>
```

**Create `components/FeedLayout.tsx`:**

```tsx
export function FeedLayout({
  drawerMenuProps,
  center,
  right,
  children,
}: {
  drawerMenuProps: DrawerMenuProps;
  center: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8">
      <Navbar
        left={<DrawerMenu {...drawerMenuProps} />}
        center={center}
        right={right}
      />
      {children}
    </div>
  );
}
```

Both view components shrink by ~10 lines and the layout contract is explicit.

---

## Suggested execution order

| Step                 | Effort         | Risk | Value  |
| -------------------- | -------------- | ---- | ------ |
| B1 — Settings        | Low            | Low  | High   |
| F1 — middleware.ts   | Trivial        | None | Medium |
| F2 — Split lib/data  | Low            | Low  | High   |
| B2 — services/ layer | Medium         | Low  | High   |
| B3 — Clean main.py   | Low (after B2) | Low  | Medium |
| F3 — Extract actions | Medium         | Low  | High   |
| F4 — useDrawer hook  | Low            | Low  | Low    |
| F5 — FeedLayout      | Low            | Low  | Low    |

B1 and F2 are the best starting points — both are pure reorganization with no behavioral change and immediately improve every file that touches them.