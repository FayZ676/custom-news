create or replace function match_articles(
  query_embedding vector(512),
  match_count int,
  min_similarity float default 0.0
)
returns table (id uuid, title text, summary text, content text, similarity float)
language sql
as $$
  select id, title, summary, content, 1 - (embeddings <=> query_embedding) as similarity
  from global_articles
  where (1 - (embeddings <=> query_embedding)) >= min_similarity
  order by embeddings <=> query_embedding
  limit match_count;
$$;