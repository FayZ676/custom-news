-- Fix search pagination returning inflated page counts.
--
-- Previously, count(*) over() ran over every article that weakly matched the
-- WHERE clause (FTS hit OR trigram similarity > 0.3), including articles that
-- mention a search term only once in passing.  This caused total_count to equal
-- the full corpus size for common queries, always producing ~10 pages.
--
-- Fix: compute relevance scores first (in "scored"), then filter to articles
-- with a meaningful minimum score (in "filtered"), so count(*) over() only
-- counts genuinely relevant articles.
--
-- Thresholds chosen:
--   fts_rank   >= 0.05  — term appears meaningfully in title/summary (not a
--                         single incidental mention)
--   trgm_rank  >= 0.5   — query covers at least half the title by word
--                         similarity (strong title match / typo tolerance)
CREATE OR REPLACE FUNCTION public.search_articles_feed_page(
  query_text     text      DEFAULT NULL::text,
  topic_filters  text[]    DEFAULT NULL::text[],
  type_filters   text[]    DEFAULT NULL::text[],
  coverage_filters text[]  DEFAULT NULL::text[],
  duration_filters text[]  DEFAULT NULL::text[],
  impact_filters text[]    DEFAULT NULL::text[],
  page_size      integer   DEFAULT 10,
  page_offset    integer   DEFAULT 0
)
RETURNS TABLE(
  id           uuid,
  feed_title   text,
  title        text,
  url          text,
  summary      text,
  topic        text,
  type         text,
  coverage     text,
  duration     text,
  impact       text,
  image_url    text,
  published_at timestamp with time zone,
  created_at   timestamp with time zone,
  total_count  bigint
)
LANGUAGE sql
STABLE
AS $function$
  with normalized as (
    select
      nullif(trim(query_text), '') as q,
      case
        when length(nullif(trim(query_text), '')) >= 3
          then websearch_to_tsquery('english', nullif(trim(query_text), ''))
        else null
      end as tsq
  ),
  -- Compute relevance scores for every article that passes metadata filters.
  scored as (
    select
      ga.*,
      n.q,
      n.tsq,
      case
        when n.tsq is not null and ga.search_vector @@ n.tsq
          then ts_rank(ga.search_vector, n.tsq)
        else 0
      end as fts_rank,
      case
        when n.q is not null and length(n.q) >= 3
          then word_similarity(lower(n.q), lower(ga.title))
        else 0
      end as trgm_rank
    from global_articles ga
    cross join normalized n
    where
      (topic_filters    is null or cardinality(topic_filters)    = 0 or ga.topic    = any(topic_filters))
      and (type_filters     is null or cardinality(type_filters)     = 0 or ga.type     = any(type_filters))
      and (coverage_filters is null or cardinality(coverage_filters) = 0 or ga.coverage = any(coverage_filters))
      and (duration_filters is null or cardinality(duration_filters) = 0 or ga.duration = any(duration_filters))
      and (impact_filters   is null or cardinality(impact_filters)   = 0 or ga.impact   = any(impact_filters))
  ),
  -- Keep only articles with a meaningful relevance score so that count(*) over()
  -- reflects genuinely relevant results rather than the entire corpus.
  filtered as (
    select * from scored
    where
      q is null
      or length(q) < 3
      or fts_rank  >= 0.05   -- meaningful FTS coverage of title/summary
      or trgm_rank >= 0.5    -- strong title word-similarity (typo tolerance)
  ),
  ranked as (
    select
      id, feed_title, title, url, summary, topic, type, coverage,
      duration, impact, image_url, published_at, created_at,
      count(*) over() as total_count,
      fts_rank,
      trgm_rank
    from filtered
  )
  select
    id, feed_title, title, url, summary, topic, type, coverage,
    duration, impact, image_url, published_at, created_at,
    total_count
  from ranked
  order by
    fts_rank  desc,
    trgm_rank desc,
    published_at desc
  limit  greatest(page_size,   1)
  offset greatest(page_offset, 0);
$function$;
