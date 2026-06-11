-- Enable realtime for global_articles so the frontend can subscribe to new ingestions.
alter publication supabase_realtime add table global_articles;

-- Digest feed: ranks articles by impact × recency decay and returns the top N.
-- Impact weights (highest to lowest): transformational > structural > operational > behavioral > informational.
-- Recency decay: exponential with a ~3-day characteristic time (score halves every ~2 days).
-- Used as the default feed view; search queries continue to use search_articles_feed_page.
create or replace function get_digest_feed(
  topic_filters    text[]  default null,
  type_filters     text[]  default null,
  coverage_filters text[]  default null,
  duration_filters text[]  default null,
  impact_filters   text[]  default null,
  feed_size        int     default 10
)
returns table (
  id           uuid,
  feed_title   text,
  title        text,
  url          text,
  summary      text,
  topic        text,
  type         text,
  coverage     text,
  duration     text,
  impact       text,
  image_url    text,
  published_at timestamptz,
  created_at   timestamptz
)
language sql
stable
as $$
  with filtered as (
    select ga.*
    from global_articles ga
    where
      (topic_filters    is null or cardinality(topic_filters)    = 0 or ga.topic    = any(topic_filters))
      and (type_filters     is null or cardinality(type_filters)     = 0 or ga.type     = any(type_filters))
      and (coverage_filters is null or cardinality(coverage_filters) = 0 or ga.coverage = any(coverage_filters))
      and (duration_filters is null or cardinality(duration_filters) = 0 or ga.duration = any(duration_filters))
      and (impact_filters   is null or cardinality(impact_filters)   = 0 or ga.impact   = any(impact_filters))
  ),
  scored as (
    select
      f.*,
      case f.impact
        when 'transformational' then 1.0
        when 'structural'       then 0.8
        when 'operational'      then 0.6
        when 'behavioral'       then 0.4
        when 'informational'    then 0.2
        else                         0.3
      end
      * exp(
          -extract(epoch from (now() - f.published_at))
          / (3.0 * 24 * 3600)
        ) as digest_score
    from filtered f
  )
  select
    s.id,
    s.feed_title,
    s.title,
    s.url,
    s.summary,
    s.topic,
    s.type,
    s.coverage,
    s.duration,
    s.impact,
    s.image_url,
    s.published_at,
    s.created_at
  from scored s
  order by s.digest_score desc
  limit greatest(feed_size, 1);
$$;
