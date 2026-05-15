create or replace function match_stories(
  query_embedding vector(512),
  match_count int,
  min_similarity float
)
returns table (id uuid, headline text, summary text, similarity float)
language sql
as $$
  select id, headline, summary, 1 - (summary_embeddings <=> query_embedding) as similarity
  from global_stories
  where summary_embeddings is not null
    and (1 - (summary_embeddings <=> query_embedding)) >= min_similarity
  order by summary_embeddings <=> query_embedding
  limit match_count;
$$;
