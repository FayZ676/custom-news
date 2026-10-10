-- One row per relevance decision (interest x article), kept for both
-- accepted and rejected articles so any feed result can be explained.
create table "user_article_matches" (
    "interest_id" uuid not null references user_interests(id) on delete cascade,
    "article_id" uuid not null references global_articles(id) on delete cascade,
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "similarity" real not null,
    "relevant" boolean not null,
    "reason" text not null,
    "created_at" timestamptz not null default now(),
    primary key ("interest_id", "article_id")
);

create index on "user_article_matches" (user_id);

alter table "user_article_matches" enable row level security;

create policy "user_article_matches_select_policy"
  on "user_article_matches" for select
  to authenticated
  using (auth.uid() = user_id);

-- Nearest recent articles to an embedding. When p_interest_id is given,
-- articles already judged for that interest are skipped.
create or replace function match_articles(
  p_embedding extensions.vector(1024),
  p_since timestamptz,
  p_min_similarity real,
  p_limit integer,
  p_interest_id uuid default null
)
returns table (
  id uuid,
  source_name text,
  title text,
  url text,
  summary text,
  image_url text,
  published_at timestamptz,
  similarity real
)
language sql
stable
set search_path = public, extensions
as $$
  select * from (
    select
      ga.id, ga.source_name, ga.title, ga.url, ga.summary, ga.image_url,
      ga.published_at,
      (1 - (ga.embedding <=> p_embedding))::real as similarity
    from global_articles ga
    where ga.embedding is not null
      and ga.published_at >= p_since
      and not exists (
        select 1 from user_article_matches m
        where m.interest_id = p_interest_id and m.article_id = ga.id
      )
  ) candidates
  where candidates.similarity >= p_min_similarity
  order by candidates.similarity desc
  limit p_limit;
$$;
