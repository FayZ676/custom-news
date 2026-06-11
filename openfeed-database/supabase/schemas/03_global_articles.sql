create extension if not exists vector;
create extension if not exists pg_trgm;

create table "global_articles" (
    "id" uuid primary key default gen_random_uuid(),
    "feed_title" text not null references global_feeds(title) on delete cascade,
    "title" text not null,
    "url" text not null unique,
    "summary" text,
    "topic" text,
    "type" text,
    "coverage" text,
    "duration" text,
    "impact" text,
    "image_url" text,
    "published_at" timestamptz not null,
    "created_at" timestamptz not null default now(),
    "embedding" vector(512),
    "search_vector" tsvector generated always as (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, ''))
    ) stored
);

alter table "global_articles" enable row level security;

create policy "global_articles_select_policy"
  on "global_articles" for select
  to anon, authenticated
  using (true);

create index if not exists global_articles_title_trgm_idx
  on global_articles using gin (title gin_trgm_ops);

create index global_articles_search_vector_idx
  on global_articles using gin (search_vector);

create or replace function search_articles_feed_page(
  query_text text default null,
  query_embedding vector(512) default null,
  topic_filters text[] default null,
  type_filters text[] default null,
  coverage_filters text[] default null,
  duration_filters text[] default null,
  impact_filters text[] default null,
  page_size int default 10,
  page_offset int default 0
)
returns table (
  id uuid,
  feed_title text,
  title text,
  url text,
  summary text,
  topic text,
  type text,
  coverage text,
  duration text,
  impact text,
  image_url text,
  published_at timestamptz,
  created_at timestamptz,
  total_count bigint
)
language sql
stable
as $$
  -- Hybrid search: full-text, trigram, and semantic retrievers each produce a
  -- ranked candidate list; results are merged with Reciprocal Rank Fusion
  -- (score = sum of 1 / (60 + rank)). Ranks are scale-free, so no
  -- cross-retriever score normalization is needed. Any retriever can be
  -- absent (short query, null embedding) and the fusion degrades gracefully.
  with normalized as (
    select
      case
        when length(nullif(trim(query_text), '')) >= 3
          then nullif(trim(query_text), '')
        else null
      end as q,
      case
        when length(nullif(trim(query_text), '')) >= 3
          then websearch_to_tsquery('english', nullif(trim(query_text), ''))
        else null
      end as tsq
  ),
  filtered as (
    select ga.*
    from global_articles ga
    where
      (topic_filters is null or cardinality(topic_filters) = 0 or ga.topic = any(topic_filters))
      and (type_filters is null or cardinality(type_filters) = 0 or ga.type = any(type_filters))
      and (coverage_filters is null or cardinality(coverage_filters) = 0 or ga.coverage = any(coverage_filters))
      and (duration_filters is null or cardinality(duration_filters) = 0 or ga.duration = any(duration_filters))
      and (impact_filters is null or cardinality(impact_filters) = 0 or ga.impact = any(impact_filters))
  ),
  fts_hits as (
    select f.id, row_number() over (order by ts_rank(f.search_vector, n.tsq) desc) as rank
    from filtered f, normalized n
    where n.tsq is not null and f.search_vector @@ n.tsq
    order by rank
    limit 100
  ),
  trgm_hits as (
    select f.id, row_number() over (order by word_similarity(lower(n.q), lower(f.title)) desc) as rank
    from filtered f, normalized n
    where n.q is not null and lower(n.q) <% lower(f.title)
    order by rank
    limit 100
  ),
  vec_hits as (
    select f.id, row_number() over (order by f.embedding <=> query_embedding) as rank
    from filtered f, normalized n
    where n.q is not null and query_embedding is not null and f.embedding is not null
    order by rank
    limit 100
  ),
  fused as (
    select
      id,
      coalesce(1.0 / (60 + fts.rank), 0)
        + coalesce(1.0 / (60 + trgm.rank), 0)
        + coalesce(1.0 / (60 + vec.rank), 0) as rrf_score
    from fts_hits fts
    full outer join trgm_hits trgm using (id)
    full outer join vec_hits vec using (id)
  )
  select
    f.id,
    f.feed_title,
    f.title,
    f.url,
    f.summary,
    f.topic,
    f.type,
    f.coverage,
    f.duration,
    f.impact,
    f.image_url,
    f.published_at,
    f.created_at,
    count(*) over () as total_count
  from filtered f
  cross join normalized n
  left join fused fu on fu.id = f.id
  where n.q is null or fu.id is not null
  order by
    fu.rrf_score desc nulls last,
    f.published_at desc
  limit greatest(page_size, 1)
  offset greatest(page_offset, 0);
$$;
