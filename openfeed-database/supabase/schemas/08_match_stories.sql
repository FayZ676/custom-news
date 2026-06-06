create or replace function match_stories(
  query_embedding vector(512),
  query_text text,
  match_count int,
  min_similarity float
)
returns table (id uuid, headline text, summary text, similarity float)
language sql
as $$
  with normalized_query as (
    select trim(coalesce(query_text, '')) as text
  ),
  vector_matches as (
    select
      id,
      headline,
      summary,
      1 - (summary_embeddings <=> query_embedding) as similarity,
      false as is_lexical
    from global_stories
    where summary_embeddings is not null
      and (1 - (summary_embeddings <=> query_embedding)) >= min_similarity
  ),
  lexical_matches as (
    select
      gs.id,
      gs.headline,
      gs.summary,
      coalesce(1 - (gs.summary_embeddings <=> query_embedding), min_similarity) as similarity,
      true as is_lexical
    from global_stories gs
    cross join normalized_query nq
    where nq.text <> ''
      and gs.headline ilike '%' || nq.text || '%'
  ),
  combined as (
    select distinct on (id)
      id,
      headline,
      summary,
      similarity,
      is_lexical
    from (
      select * from lexical_matches
      union all
      select * from vector_matches
    ) all_matches
    order by id, is_lexical desc, similarity desc
  )
  select id, headline, summary, similarity
  from combined
  order by is_lexical desc, similarity desc
  limit match_count;
$$;
