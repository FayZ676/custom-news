# openfeed — IPTC Classification & User Preference System

---

## Progress

| #   | Task                                                                                                                          | Status |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | `openfeed/iptc/` subpackage — `taxonomy.py`, `classifier.py`, `scorer.py`, `__init__.py`                                      | ✅ Done |
| 2   | Tests — `test_iptc_taxonomy.py`, `test_iptc_classifier.py`, `test_iptc_scorer.py`                                             | ✅ Done |
| 3   | Database schemas — `global_article_topics`, `global_story_topics`, `user_topic_preferences`, `user_stories_hidden`            | ✅ Done |
| 4   | Schema cleanup — removed `global_categories`, `category_id` from `global_feeds`, updated seeds and `database_models.py`       | ✅ Done |
| 5   | Wire `classify_article` into `services/ingestion.py` (`fetch_articles`) and insert into `global_article_topics`               | ✅ Done |
| 6   | Aggregate `global_article_topics` → `global_story_topics` in `services/ingestion.py` (`top_stories`)                          | ✅ Done |
| 7   | Add DB query helpers — `insert_article_topics`, `insert_story_topics`, `get_story_topics`, `get_user_preferences`             | ✅ Done |
| 8   | `GET /preferences/topics` + `POST /preferences/set` endpoints — topic picker onboarding (no LLM)                              | ⬜ Todo |
| 9   | `POST /preferences/update` endpoint — same topic picker flow as onboarding                                                    | ⬜ Todo |
| 10  | Story like/dislike/hide — frontend-side writes directly to Supabase via RLS; hidden stories filtered server-side on page load | ✅ Done |
| 11  | `GET /feed` endpoint — fetch stories + topics, score with `scorer.py`, return ranked list                                     | ⬜ Todo |
| 12  | Frontend — replace `user_interests` / `user_stories` UI with new onboarding + single feed                                     | ⬜ Todo |

---

## Remaining Work

### Tasks 8 & 9 — Preference endpoints (backend)

`GET /preferences/topics` — returns the 17 top-level IPTC topics filtered to only those with at least one current story. Determined by querying `global_story_topics` and walking each tag's ancestor chain in Python to find its root.

`POST /preferences/set` — replaces all `liked` rows in `user_topic_preferences` for the user with the submitted `medtop_id`s. Used for both initial onboarding and settings updates (tasks 8 and 9 share the same endpoint).

### Task 11 — `GET /feed` endpoint (backend)

Replaces the current Supabase-direct story fetch in the frontend. The endpoint:
1. Fetches all `global_stories` + their `global_story_topics`, excluding any in `user_stories_hidden` for the requesting user
2. Fetches the user's `user_topic_preferences`
3. Scores each story in Python using `scorer.py` and the in-memory taxonomy
4. Returns stories sorted by `final_score` descending

**Scoring:**

For each `medtop_id` on a story, walk the taxonomy to find the nearest ancestor the user has an explicit preference on. `depth_distance` is the number of hops between the story tag and the preference node.

```
If liked ancestor:    positive_contribution = base_weight / (depth_distance + 1)
If disliked ancestor: negative_contribution = base_weight / (depth_distance + 1)
Otherwise:            contribution = 0

preference_score = sum of all contributions
final_score = 0.7 × preference_score + 0.3 × significance_score
```

`disliked` always takes precedence over `liked` when both match the same tag. Cold start (no preferences): `preference_score = 0`, feed ranks by `significance_score` alone. Weights `w₁ = 0.7`, `w₂ = 0.3` are tunable — revisit once real user data exists.

### Task 12 — Frontend overhaul

- Add onboarding topic picker (calls `GET /preferences/topics`, submits to `POST /preferences/set`)
- Settings page: pre-populate topic picker from existing `liked` preferences, save via `POST /preferences/set`
- Switch feed page from Supabase-direct fetch to `GET /feed` once that endpoint is live
- Remove remaining `user_interests` / `user_stories` UI and references

---

## Open Questions

- **Preference conflict resolution** — `disliked` takes precedence over `liked` when both match the same tag. Straightforward to enforce in scoring but should be made explicit.
- **Weight tuning** — `w₁` and `w₂` are initially set by intuition. Treat as tunable parameters and revisit once real user data exists.
- **Deeper topic selection** — onboarding currently exposes only the 17 top-level topics. Could expand to child topics (e.g. "sport" → "football") without backend changes — `GET /preferences/topics` can accept an optional `parent_id`.
- **`/feed` latency** — scoring ~100 stories per user in Python is fast, but may need caching or pre-computation if the user base grows.

---

## Backend Endpoints

| Method | Endpoint              | Description                                                                             |
| ------ | --------------------- | --------------------------------------------------------------------------------------- |
| `GET`  | `/preferences/topics` | Returns top-level IPTC topics that have at least one current story (live query)         |
| `POST` | `/preferences/set`    | Writes selected `medtop_id`s as `liked` preferences; replaces all existing `liked` rows |
| `POST` | `/stories/hide`       | Writes to `user_stories_hidden` + `user_topic_preferences` (disliked)                   |
| `GET`  | `/feed`               | Scores and returns top N ranked stories for the authenticated user                      |

---

## Open Questions

- **Preference conflict resolution** — `disliked` takes precedence over `liked` when both match the same tag. Straightforward to enforce in scoring but should be made explicit.
- **Weight tuning** — `w₁` and `w₂` are initially set by intuition. Treat as tunable parameters and revisit once real user data exists.
- **Deeper topic selection** — onboarding currently exposes only the 17 top-level topics. Could expand to child topics (e.g. "sport" → "football") without backend changes — `GET /preferences/topics` can accept an optional `parent_id`.
- **`/feed` latency** — scoring ~100 stories per user in Python is fast, but may need caching or pre-computation if the user base grows.
