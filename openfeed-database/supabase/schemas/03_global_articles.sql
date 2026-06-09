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
    "created_at" timestamptz not null default now()
);

alter table "global_articles" enable row level security;

create policy "global_articles_select_policy"
  on "global_articles" for select
  to anon, authenticated
  using (true);

create index if not exists global_articles_title_trgm_idx
  on global_articles using gin (title gin_trgm_ops);

create or replace function search_articles_feed_page(
  query_text text default null,
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
  with normalized as (
    select nullif(trim(query_text), '') as q
  ),
  filtered as (
    select ga.*, n.q
    from global_articles ga
    cross join normalized n
    where
      (
        n.q is null
        or length(n.q) < 3
        or ga.title ilike '%' || n.q || '%'
        or lower(n.q) <% lower(ga.title)
      )
      and (
        topic_filters is null
        or cardinality(topic_filters) = 0
        or ga.topic = any(topic_filters)
      )
      and (
        type_filters is null
        or cardinality(type_filters) = 0
        or ga.type = any(type_filters)
      )
      and (
        coverage_filters is null
        or cardinality(coverage_filters) = 0
        or ga.coverage = any(coverage_filters)
      )
      and (
        duration_filters is null
        or cardinality(duration_filters) = 0
        or ga.duration = any(duration_filters)
      )
      and (
        impact_filters is null
        or cardinality(impact_filters) = 0
        or ga.impact = any(impact_filters)
      )
  ),
  ranked as (
    select
      filtered.id,
      filtered.feed_title,
      filtered.title,
      filtered.url,
      filtered.summary,
      filtered.topic,
      filtered.type,
      filtered.coverage,
      filtered.duration,
      filtered.impact,
      filtered.image_url,
      filtered.published_at,
      filtered.created_at,
      count(*) over() as total_count,
      case
        when filtered.q is not null
          and length(filtered.q) >= 3
          and filtered.title ilike '%' || filtered.q || '%'
          then 1
        else 0
      end as exact_match_rank,
      case
        when filtered.q is not null and length(filtered.q) >= 3
          then word_similarity(lower(filtered.q), lower(filtered.title))
        else 0
      end as word_similarity_rank,
      case
        when filtered.q is not null and length(filtered.q) >= 3
          then similarity(lower(filtered.title), lower(filtered.q))
        else 0
      end as trigram_similarity_rank
    from filtered
  )
  select
    ranked.id,
    ranked.feed_title,
    ranked.title,
    ranked.url,
    ranked.summary,
    ranked.topic,
    ranked.type,
    ranked.coverage,
    ranked.duration,
    ranked.impact,
    ranked.image_url,
    ranked.published_at,
    ranked.created_at,
    ranked.total_count
  from ranked
  order by
    exact_match_rank desc,
    word_similarity_rank desc,
    trigram_similarity_rank desc,
    published_at desc
  limit greatest(page_size, 1)
  offset greatest(page_offset, 0);
$$;