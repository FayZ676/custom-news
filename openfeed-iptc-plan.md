# openfeed — IPTC Classification & User Preference System
## Concrete Design Plan

---

## 1. Overview

This document describes the full design for two interconnected systems:

1. **Article classification** — tagging every ingested article with IPTC Media Topic codes via a two-pass LLM pipeline, running synchronously inside the existing `fetch_articles` pipeline
2. **User preference system** — translating user-described interests into taxonomy codes, storing preferences, and using them to serve a single personalised feed per user

These two systems share a common foundation: the IPTC Media Topics taxonomy, which lives entirely in the Python backend as an in-memory data structure.

### What is removed
This design **retires** the following existing systems:

- `user_interests` table and all associated backend/frontend code — free-text saved topics with embedding vectors are replaced entirely by IPTC preference codes
- `user_stories` table — pre-computed per-user scored feed is replaced by a live `GET /feed` endpoint
- `score_articles` background task — the pgvector ANN search + cross-encoder reranking pipeline is no longer needed
- The "My News" / "Trending News" tab split — there is now a single personalised feed per user

---

## 2. The IPTC Media Topics Taxonomy

### What it is
The IPTC Media Topics taxonomy is a hierarchical controlled vocabulary of ~1,100 terms for classifying news content. It has 17 top-level categories (politics, health, sport, etc.) branching into up to 5 levels of specificity. Each term has a stable unique identifier (e.g. `medtop:11000000` for "politics").

It is published by IPTC under a Creative Commons Attribution 4.0 licence — free to use.

### Where it lives
The taxonomy does **not** live in Supabase. It lives entirely on the Python backend:

- **Source** — `openfeed/iptc/iptc-taxonomy.json`, the official IPTC Media Topics JSON-LD file, committed directly to the repo
- **Runtime** — `openfeed/iptc/taxonomy.py` parses the JSON at backend startup into a Python dict keyed by `medtop_id`, with ancestor chains pre-computed

```python
# In-memory taxonomy structure
{
  "medtop:11000000": {
    "name": "politics",
    "definition": "Local, regional, national and international exercise of power...",
    "parent_id": None,
    "ancestors": ["medtop:11000000"],
  },
  "medtop:20000588": {
    "name": "presidential elections",
    "definition": "...",
    "parent_id": "medtop:20000586",
    "ancestors": ["medtop:11000000", "medtop:20000586", "medtop:20000588"],
  },
}
```

Ancestor chains are computed once at load time by walking the dict. No recursive SQL ever needed.

### Why not Supabase
- The taxonomy is static (updated quarterly by IPTC)
- It is small (~1,100 nodes, well under 1MB in memory)
- No query ever needs to join against it — all taxonomy reasoning happens in Python
- Supabase tables that reference taxonomy IDs just store `medtop_id` strings

### Keeping it up to date
Download the updated JSON-LD file from IPTC quarterly and replace `openfeed/iptc/iptc-taxonomy.json`. Commit and redeploy.

---

## 4. The `openfeed/iptc/` Subpackage

All IPTC logic lives in a dedicated subpackage within the backend. This keeps `services/` thin — they import from `openfeed.iptc` rather than containing taxonomy logic directly.

```
openfeed/iptc/
    __init__.py
    iptc-taxonomy.json   # committed IPTC source file
    taxonomy.py          # parse JSON, build in-memory dict, ancestor walking
    classifier.py        # two-pass LLM classification of articles
    scorer.py            # preference score computation for GET /feed
```

### Module responsibilities

- **`taxonomy.py`** — loaded once at startup. Exposes the in-memory dict and pure functions: `get_ancestors(medtop_id)`, `get_subtree(medtop_id)`, `render_prompt_tree(medtop_ids)`. No I/O after startup.
- **`classifier.py`** — pure functions that take article text + taxonomy and return a list of `medtop_id` tags. Calls `openai_client`. Called by `services/ingestion.py`.
- **`scorer.py`** — pure function `score_story(story_topics, user_preferences, taxonomy)` → `float`. No I/O; all data passed in. Called by `main.py`'s `/feed` handler.

---

## 4. Article Classification Pipeline

### Where it runs
Classification runs **synchronously inside `fetch_articles`** (in `services/ingestion.py`), immediately after `extract_article_metadata` returns and before the insert into `global_articles`. No separate endpoint or background job.

### Design
Every ingested article is classified using a **two-pass LLM pipeline**. Multi-label classification is supported — an article can belong to multiple topic branches simultaneously.

### Pass 1 — Top-level classification
- **Input**: article text + the 17 top-level IPTC topics (tiny prompt)
- **Output**: one or more top-level `medtop_id`s (e.g. `["medtop:11000000", "medtop:02000000"]`)
- **Prompt**: instructs the LLM to return all applicable top-level categories, not just one

### Pass 2 — Fine-grained classification
- **Input**: article text + the subtree of one top-level topic (one pass per top-level result)
- **Output**: one `medtop_id` at the deepest appropriate level within that branch
- **Prompt**: instructs the LLM to pick the single most specific matching term

If Pass 1 returns two top-level topics, Pass 2 runs twice — once per branch — yielding two fine-grained tags.

### Output
All tags (both pass levels) are written to `article_topics`:

```
article_topics
  article_id  — fk → global_articles
  medtop_id   — e.g. "medtop:20000588"
  pass        — 1 or 2
```

### Prompt format
The taxonomy is serialized as an indented plain-text tree with definitions:

```
politics (medtop:11000000) — Local, regional, national and international exercise of power...
  elections (medtop:20000586) — The process by which people vote...
    presidential elections (medtop:20000588) — ...
    local elections (medtop:20000587) — ...
```

Pass 1 uses only the 17 root lines. Pass 2 uses only the relevant subtree.

---

## 5. Story Topic Aggregation

Stories are clusters of articles. Each story inherits a combined set of IPTC topic tags from its constituent articles.

`global_stories` is **fully rebuilt on every pipeline cycle** — `delete_all_stories` wipes the table and stories are re-generated from the current article clusters. Since `story_topics` uses `on delete cascade`, story-level IPTC tags are also wiped and rebuilt each cycle. Article-level tags in `article_topics` persist alongside their articles and are re-read during each aggregation pass.

When stories are inserted, the backend aggregates all `article_topics` rows for each story's constituent articles and writes deduplicated tags to `story_topics`:

```
story_topics
  story_id    — fk → global_stories, on delete cascade
  medtop_id   — aggregated from constituent articles
```

Stories also have an independently computed **significance score** (from the existing cluster scoring pipeline). This score is stored on `global_stories` and is not affected by user preferences.

---

## 6. User Preference System

### Onboarding
The user types a natural language description of their interests:

> "I care about Middle Eastern politics, AI and technology startups, and climate change"

The backend:
1. Passes the description + the full taxonomy tree to an LLM
2. LLM returns a set of matching `medtop_id`s at the most specific applicable level
3. Backend resolves the IDs to plain-language label names
4. Frontend displays a confirmation: *"We'll show you stories about: Middle Eastern politics, artificial intelligence, technology startups, climate change — does that sound right?"*
5. User confirms → preferences written to `user_topic_preferences` as `liked`

### Ongoing preference updates
- **Thumbs-down on a story** — the story is immediately hidden in the UI (optimistic removal), a row is inserted into `user_stories_hidden`, and the story's `medtop_id`s are written to `user_topic_preferences` as `disliked`
- **Settings update** — user can re-describe their interests in natural language at any time. Same NL → LLM → medtop_ids pipeline. New preferences overwrite or extend existing ones.

### Preference inheritance
- Liking a parent topic (`politics`) implicitly covers its children — but a child match scores less than an explicit match at that depth
- Disliking a child topic does not affect the parent — a child is a subset, not the whole
- Explicit preferences at a specific level always outweigh inherited ones

### Storage

```
user_topic_preferences
  user_id     — fk → auth.users, on delete cascade
  medtop_id   — e.g. "medtop:11000000"
  preference  — "liked" | "disliked"
  created_at  — timestamptz default now()
  primary key (user_id, medtop_id)
```

---

## 7. Feed

### Single personalised feed
Each user has one feed — a ranked list of current stories scored against their IPTC preferences. There is no "Trending" vs "My News" split. Significance score is a component of the ranking formula, so breaking and widely-covered stories surface naturally even when they don't perfectly match a user's preferences.

### When the frontend fetches
- **On onboarding completion** — immediately after preferences are confirmed
- **Hourly** — the frontend checks a stored timestamp and re-fetches if stale
- **On app foreground** — if the cached feed is older than 1 hour

Thumbs-down and settings changes do **not** trigger a re-fetch. They write to the backend silently. The next scheduled fetch reflects them.

### How `GET /feed` works
The endpoint:
1. Fetches all current `global_stories` with their `story_topics` tags, excluding any in `user_stories_hidden` for the requesting user
2. Fetches the user's full `user_topic_preferences` profile
3. Scores each story in Python using the in-memory taxonomy
4. Returns stories sorted by `final_score` descending, top N

### Python scoring
For each story, the backend computes a preference score:

```
For each medtop_id tagged on the story:
  Walk the in-memory taxonomy to find the nearest ancestor
  that the user has an explicit preference on.

  If liked ancestor found:
    positive_contribution = base_weight / depth_distance
  If disliked ancestor found:
    negative_contribution = base_weight / depth_distance
  If no ancestor found:
    contribution = 0

preference_score = sum of all contributions across all story tags
```

Where `depth_distance` is the number of hops between the story's tag and the user's preference node. A direct match (distance = 0) scores highest. A grandparent match (distance = 2) scores less.

Final score:

```
final_score = w₁ × preference_score + w₂ × significance_score
where w₁ > w₂
```

Exact weights (`w₁`, `w₂`) are tunable constants, defaulting to e.g. `w₁ = 0.7`, `w₂ = 0.3`.

**Cold start**: if a user has no preferences yet (onboarding not completed), `preference_score = 0` for all stories and the feed ranks by `significance_score` alone — effectively a global trending feed.

---

## 8. Story Hiding

When a user thumbs down a story:

1. Story is immediately removed from the rendered feed (optimistic UI)
2. A row is inserted into `user_stories_hidden`
3. The story's topic tags are written to `user_topic_preferences` as `disliked`

On the next `GET /feed` call, the query excludes all stories in `user_stories_hidden` for that user, so hidden stories never reappear.

```
user_stories_hidden
  user_id     — fk → auth.users, on delete cascade
  story_id    — fk → global_stories, on delete cascade
  created_at  — timestamptz default now()
  primary key (user_id, story_id)
```

When a story is deleted from `global_stories`, its row in `user_stories_hidden` is automatically removed via `on delete cascade`.

---

## 9. Database Schema Summary

```sql
-- Article-level topic tags (from classification pipeline)
create table article_topics (
  article_id  uuid references global_articles(id) on delete cascade,
  medtop_id   text not null,
  pass        smallint not null check (pass in (1, 2)),
  primary key (article_id, medtop_id)
);

-- Story-level topic tags (aggregated from articles, rebuilt each pipeline cycle)
create table story_topics (
  story_id    uuid references global_stories(id) on delete cascade,
  medtop_id   text not null,
  primary key (story_id, medtop_id)
);

-- User topic preferences (liked / disliked)
create table user_topic_preferences (
  user_id     uuid references auth.users(id) on delete cascade,
  medtop_id   text not null,
  preference  text not null check (preference in ('liked', 'disliked')),
  created_at  timestamptz default now(),
  primary key (user_id, medtop_id)
);

-- Hidden stories per user
create table user_stories_hidden (
  user_id     uuid references auth.users(id) on delete cascade,
  story_id    uuid references global_stories(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (user_id, story_id)
);
```

### Tables retired by this design

```sql
-- Removed: free-text interest queries with embedding vectors
drop table user_interests;

-- Removed: pre-computed per-user scored feed
drop table user_stories;
```

---

## 10. Backend Endpoints Summary

| Method | Endpoint                  | Description                                                           |
| ------ | ------------------------- | --------------------------------------------------------------------- |
| `POST` | `/preferences/onboarding` | NL → taxonomy mapping, returns labels for confirmation                |
| `POST` | `/preferences/confirm`    | Writes confirmed preferences to `user_topic_preferences`              |
| `POST` | `/preferences/update`     | Updates preferences from settings (same NL pipeline)                  |
| `POST` | `/stories/hide`           | Writes to `user_stories_hidden` + `user_topic_preferences` (disliked) |
| `GET`  | `/feed`                   | Scores and returns top N ranked stories for the authenticated user    |

The existing `POST /global/articles` pipeline chain becomes:
```
fetch_articles (+ IPTC classification) → score_articles (removed) → top_stories (+ story_topics aggregation) → notify_users
```

---

## 11. Open Questions

- **Preference conflict resolution** — if a user has both `liked` and `disliked` for the same `medtop_id` (possible via onboarding + subsequent thumbs-down), which wins? Likely `disliked` takes precedence, but needs an explicit rule.
- **Weight tuning** — `w₁` and `w₂` are initially set by intuition. These should be treated as tunable parameters and revisited once real user data exists.
- **Entity matching** — articles already have `summary_entities` extracted (named people, orgs, products, etc.). These could be treated as a parallel scoring signal alongside IPTC codes in the future. No action now — entities are preserved in the schema but not used in scoring.
- **`/feed` latency** — scoring ~100 stories per user in Python is fast, but if the user base grows, this endpoint may need caching or a move back to pre-computation. Monitor and revisit.
