## Implementation Approach

### Two-Stage Filtering Strategy

Instead of returning a fixed count of articles, we'll use a two-stage filtering approach:

1. **Cosine Similarity Filter (cheap, fast)** - Filter candidates by minimum similarity threshold
2. **Rerank Remaining Candidates (expensive, accurate)** - Apply reranker only to filtered results
3. **Return All Reranked Results** - No artificial count limits, just what's actually relevant

### Configuration

**Backend:** Add to existing `openfeed-backend/openfeed/config.py`
```python
class Settings(BaseSettings):
    # ... existing fields ...
    min_similarity_threshold: float = 0.7
```

**Frontend:** Create new `openfeed-frontend/lib/config.ts`
```typescript
export const MIN_SIMILARITY_THRESHOLD = 0.7;
```

### Changes Required

**1. Update SQL Function:** `openfeed-database/supabase/schemas/08_match_articles.sql`
- Add `min_similarity` parameter
- Filter by threshold: `WHERE (1 - (embeddings <=> query_embedding)) >= min_similarity`

**2. Update Three Retrieval Paths:**

- **Backend periodic fetching:** `openfeed-backend/openfeed/services/ingestion.py` (line 57-67)
- **Frontend new interest:** `openfeed-frontend/app/feed/page.tsx` (`updateUserArticleScores` function)
- **Frontend ad-hoc search:** `openfeed-frontend/app/feed/page.tsx` (`searchGlobalArticles` function)

**3. Remove Fixed-Count Logic:**
- Remove `* 2` over-fetching
- Remove `.slice(0, articlesCount)` / `.slice(0, ARTICLES_PER_PAGE)` hard limits
- Return all results that pass threshold and reranking

All three paths will pass the threshold to `match_articles`, which filters at the database level before returning candidates for reranking.