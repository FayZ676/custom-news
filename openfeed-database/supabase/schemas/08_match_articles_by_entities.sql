create or replace function match_articles_by_entities(
  query_entities text[],
  match_count int,
  min_jaccard float
)
returns table (id uuid, title text, summary text, content text, jaccard_score float)
language plpgsql
as $$
begin
  return query
  select
    ga.id,
    ga.title,
    ga.summary,
    ga.content,
    (
      select count(distinct unnest)::float /
        (
          array_length(ga.summary_entities, 1) +
          array_length(query_entities, 1) -
          count(distinct unnest)
        )
      from unnest(ga.summary_entities || query_entities)
    ) as jaccard_score
  from global_articles ga
  where
    array_length(ga.summary_entities, 1) > 0
    and array_length(query_entities, 1) > 0
    and (
      select count(distinct unnest)::float /
        (
          array_length(ga.summary_entities, 1) +
          array_length(query_entities, 1) -
          count(distinct unnest)
        )
      from unnest(ga.summary_entities || query_entities)
    ) >= min_jaccard
  order by jaccard_score desc
  limit match_count;
end;
$$;
