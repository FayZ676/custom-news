create or replace function match_articles(
  query_embedding vector(512),
  match_count int
)
returns table (id uuid, title text, summary text, content text, similarity float)
language sql
as $$
  select id, title, summary, content, 1 - (embeddings <=> query_embedding) as similarity
  from global_articles
  order by embeddings <=> query_embedding
  limit match_count;
$$;