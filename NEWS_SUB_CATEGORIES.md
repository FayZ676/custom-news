# News Sub-Categories Plan

## Database Schema Changes

### New table: `global_sub_categories`
- Create a separate `global_sub_categories` table (not a column on `global_categories`).
- Columns: `id`, `name` (unique, not null), `category_name` (text FK → `global_categories.name` on update cascade on delete cascade), `created_at`.

### Update `global_articles`
- Add `category_name text references global_categories(name) on update cascade on delete set null`.
- Populated at ingestion time by resolving `feed.category_name` (consistent with how `feed_title` is already denormalized onto articles).
- Nullable — articles from uncategorized feeds are skipped during per-category clustering.

### Update `global_stories`
- Add `category_name text references global_categories(name) on update cascade on delete set null`.
- Add `tags text[]` — sub-category tags assigned by the LLM, coinciding with valid `global_sub_categories.name` values for that category.

### New tables: `user_category_subscriptions` and `user_sub_category_subscriptions`
- `user_categories`: `user_id` (FK → auth.users), `category_name` (FK → global_categories.name), `position integer not null`, primary key on (`user_id`, `category_name`). RLS: users manage their own rows.
- `user_sub_categories`: `user_id`, `sub_category_name` (FK → global_sub_categories.name), primary key on both. RLS: users manage their own rows.
- Do NOT store subscriptions in `user_settings` — these warrant their own junction tables for clean querying.
- On user creation (existing `on_auth_user_created` trigger), also insert a default row into `user_categories` for "Technology" at `position = 1`.
- When a user subscribes to a new category it is appended at `max(position) + 1` for that user.
- No DB-level constraint enforcing that a sub-category subscription requires a parent category subscription. The frontend enforces this invariant by only showing sub-category toggles when the parent category is subscribed.

## Backend Changes

### Ingestion (`services/ingestion.py`)
- When building articles from feeds, populate `category_name` from `feed.category_name` (resolved from `global_feeds`).
- Update `PublicGlobalArticles` Pydantic model in `database_models.py` to include `category_name: Optional[str]`.

### Clustering (`services/extraction.py` — `top_stories()`)
- Change `top_stories()` to loop over all categories.
- For each category:
  1. Filter `articles` by `category_name`.
  2. Call `cluster_articles()`, `reduce_clusters()`, `deduplicate_clusters()` independently.
  3. Generate/rescore all stories for that category (LLM calls, scoring).
  4. Only after processing is complete: delete existing stories for that category, then insert the new ones.
- This means a failure in one category leaves all other categories' stories intact.
- `delete_all_stories()` is replaced by a new `delete_stories_by_category(db, category_name)` function in `db/global_stories.py`.
- `cluster_articles()` itself stays a pure function — pre-filtering by category happens before calling it.

### LLM Story Generation (`services/extraction.py` — `_generate_story_text()`)
- Extend `TopStoryLLMResponse` to include `tags: list[str]`.
- Pass the valid sub-category names for the story's category into the prompt so the LLM can tag appropriately.
- Update `_generate_story()` to store `tags` on the returned `PublicGlobalStories`.
- Update `PublicGlobalStories` Pydantic model in `database_models.py` to include `tags: List[str]`.

## Frontend Changes

### Settings Modal — News Categories button
- Add a "News Categories" button in the Settings modal (alongside Email Notifications, Theme, Sign Out).
- Clicking it opens a new `NewsCategoriesModal` component.
- The modal lists all of the user's subscribed categories.
- Each category is expandable (accordion) to show its sub-categories with toggle controls to subscribe/unsubscribe.
- Users can also subscribe to new top-level categories from this modal.

### Feed filtering by subscribed categories
- Stories and articles from unsubscribed categories are hidden entirely — only content whose `category_name` is in the user's `user_category_subscriptions` is shown.
- Since all users are subscribed to "Technology" by default, no user will ever land on an empty feed.
- The Supabase queries for `global_stories` and `user_articles` need to filter by the user's subscribed category names.
- Because this is user-specific filtering, it must happen at query time (not at the data layer) — the frontend fetches the user's subscribed categories and passes them as a filter to the relevant queries.
- Stories are displayed grouped and ordered by `position` (ascending), with `score DESC` applied within each category group. This means a user's highest-priority category always leads the feed.

## Files to Update (Checklist)

> **Note:** Do not touch migration files. All DB changes go into the schema files only. The DB will be wiped and reinitialized with a new migration.
- [ ] `openfeed-database/supabase/schemas/01_global_categories.sql` — no change needed
- [x] `openfeed-database/supabase/schemas/03_global_articles.sql` — add `category_name`
- [x] `openfeed-database/supabase/schemas/05_global_stories.sql` — add `category_name`, `tags`
- [x] `openfeed-database/supabase/schemas/11_user_settings.sql` — `on_auth_user_created` trigger moved out; only table + timezone trigger remain
- [x] New: `openfeed-database/supabase/schemas/12_global_sub_categories.sql`
- [x] New: `openfeed-database/supabase/schemas/13_user_categories.sql`
- [x] New: `openfeed-database/supabase/schemas/14_user_sub_categories.sql`
- [x] New: `openfeed-database/supabase/schemas/15_user_hooks.sql` — `create_user_settings()` function + `on_auth_user_created` trigger (loads after 13 so `user_categories` exists)
- [x] `openfeed-backend/openfeed/database_models.py` — update `PublicGlobalArticles`, `PublicGlobalFeeds`, `PublicGlobalStories`; add `PublicGlobalSubCategories`, `PublicUserCategories`, `PublicUserSubCategories` models
- [x] `openfeed-backend/openfeed/services/ingestion.py` — populate `category_name` at ingestion
- [x] `openfeed-backend/openfeed/services/extraction.py` — per-category clustering loop, tags in LLM response
- [x] `openfeed-backend/openfeed/models.py` — updated `to_db_schema` to accept and pass `category_name`
- [x] `openfeed-backend/openfeed/db/global_stories.py` — added `delete_stories_by_category`
- [x] New: `openfeed-backend/openfeed/db/global_categories.py` — `get_global_categories`
- [x] New: `openfeed-backend/openfeed/db/global_sub_categories.py` — `get_sub_categories_by_category`
- [ ] `openfeed-frontend/components/SettingsModal.tsx` — add News Categories button
- [ ] New: `openfeed-frontend/components/NewsCategoriesModal.tsx` — includes drag-to-reorder for categories (updates `position`); accordion per category for sub-category toggles; subscribe/unsubscribe top-level categories
- [ ] `openfeed-frontend/components/ViewTopStories.tsx` — filter by subscribed categories
- [ ] `openfeed-frontend/app/feed/` — update queries to filter by subscribed categories