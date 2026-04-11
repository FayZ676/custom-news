create table "global_stories" (
    "id" uuid primary key default gen_random_uuid(),
    "headline" text not null,
    "summary" text not null,
    "related_articles_urls" text[] not null default '{}'
);

alter table "global_stories" enable row level security;

create policy "global_stories_select_policy"
  on "global_stories" for select
  to anon, authenticated
  using (true);