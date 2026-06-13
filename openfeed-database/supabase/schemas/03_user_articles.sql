create extension if not exists vector;
create extension if not exists pg_trgm;

create table "user_articles" (
    "id" uuid primary key default gen_random_uuid(),
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "source_name" text not null,
    "title" text not null,
    "url" text not null,
    "summary" text,
    "image_url" text,
    "published_at" timestamptz not null,
    "created_at" timestamptz not null default now(),
    "embedding" vector(512),
    "search_vector" tsvector generated always as (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, ''))
    ) stored,
    unique ("user_id", "url")
);

alter table "user_articles" enable row level security;

create policy "user_articles_select_policy"
  on "user_articles" for select
  to authenticated
  using (auth.uid() = user_id);

create index if not exists user_articles_user_id_idx
  on user_articles (user_id);

create index if not exists user_articles_title_trgm_idx
  on user_articles using gin (title gin_trgm_ops);

create index user_articles_search_vector_idx
  on user_articles using gin (search_vector);

create or replace function search_articles_feed_page(
  query_text text default null,
  query_embedding vector(512) default null,
  page_size int default 10,
  page_offset int default 0
)
returns table (
  id uuid,
  source_name text,
  title text,
  url text,
  summary text,
  image_url text,
  published_at timestamptz,
  created_at timestamptz,
  total_count bigint
)
language sql
stable
as $$
  -- Runs with invoker rights: RLS on user_articles scopes every retriever to
  -- the calling user's own rows.
  --
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
    select ua.*
    from user_articles ua
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
    f.source_name,
    f.title,
    f.url,
    f.summary,
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
