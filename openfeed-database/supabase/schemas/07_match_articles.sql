create or replace function match_articles(
  query_embedding vector(384),
  match_count int
)
returns table (id uuid, similarity float)
language sql
as $$
  select id, 1 - (embeddings <=> query_embedding) as similarity
  from global_articles
  order by embeddings <=> query_embedding
  limit match_count;
$$;