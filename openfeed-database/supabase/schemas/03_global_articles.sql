create extension if not exists vector;

create table "articles" (
    "id" uuid primary key default gen_random_uuid(),
    "feed_id" uuid not null references catalog_feeds(id),
    "title" text not null,
    "url" text not null unique,
    "content" text not null,
    "published_at" timestamptz not null,
    "embedding" vector(384),
    "embedding_model" text,
    "created_at" timestamptz not null default now()
);

alter table "articles" enable row level security;

create policy "articles_select_policy"
  on "articles" for select
  to anon, authenticated
  using (true);