create or replace function get_curated_feed(
  p_user_id uuid,
  p_interest_embeddings text[],
  p_topic_filters text[] default null,
  p_page_size int default 10
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
  created_at timestamptz
)
language sql
stable
as $$
  -- For each interest embedding, rank unseen candidate articles by semantic
  -- similarity. An article's final rank is its best rank across all
  -- interests, which interleaves each interest's strongest matches.
  -- Summing scores across interests (e.g. RRF) is deliberately avoided: on a
  -- small corpus it favors articles that are mediocre matches for every
  -- interest over exact matches for a single one.
  with candidates as (
    select ga.*
    from global_articles ga
    where
      ga.embedding is not null
      and not exists (
        select 1 from user_seen_articles usa
        where usa.user_id = p_user_id and usa.article_id = ga.id
      )
      and (p_topic_filters is null or cardinality(p_topic_filters) = 0 or ga.topic = any(p_topic_filters))
  ),
  interest_ranks as (
    select
      c.id,
      row_number() over (
        partition by t.emb_idx
        order by c.embedding <=> t.emb::vector(512)
      ) as rank
    from candidates c
    cross join unnest(p_interest_embeddings) with ordinality as t(emb, emb_idx)
  ),
  best as (
    select id, min(rank) as best_rank
    from interest_ranks
    group by id
  )
  select
    c.id, c.feed_title, c.title, c.url, c.summary,
    c.topic, c.type, c.coverage, c.duration, c.impact,
    c.image_url, c.published_at, c.created_at
  from candidates c
  join best b on b.id = c.id
  order by b.best_rank asc, c.published_at desc
  limit least(p_page_size, 10);
$$;
