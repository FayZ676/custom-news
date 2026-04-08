set check_function_bodies = off;

drop function if exists "public"."match_articles"(query_embedding public.vector, match_count integer, min_similarity double precision);

CREATE OR REPLACE FUNCTION public.match_articles(query_embedding public.vector, match_count integer, min_similarity double precision)
 RETURNS TABLE(id uuid, title text, summary text, content text, similarity double precision)
 LANGUAGE sql
AS $function$
  select id, title, summary, content, 1 - (embeddings <=> query_embedding) as similarity
  from global_articles
  where (1 - (embeddings <=> query_embedding)) >= min_similarity
  order by embeddings <=> query_embedding
  limit match_count;
$function$
;