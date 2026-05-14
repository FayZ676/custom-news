create table "global_stories" (
    "id" uuid primary key default gen_random_uuid(),
    "headline" text not null,
    "summary" text not null,
    "related_articles_urls" text[] not null default '{}',
    "score" float not null,
    "velocity" float not null,
    "image_url" text,
    "created_at" timestamptz not null default now(),
    "category_name" text references global_categories(name) on update cascade on delete set null,
    "tags" text[] not null default '{}'
);

alter table "global_stories" enable row level security;

create policy "global_stories_select_policy"
  on "global_stories" for select
  to anon, authenticated
  using (true);