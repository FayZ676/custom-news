create extension if not exists vector;

create table "global_articles" (
    "id" uuid primary key default gen_random_uuid(),
    "feed_title" text not null references global_feeds(title) on delete cascade,
    "title" text not null,
    "url" text not null unique,
    "summary" text,
    "content" text,
    "published_at" timestamptz not null,
    "embeddings" vector(512),
    "embedding_model" text,
    "created_at" timestamptz not null default now()
);

alter table "global_articles" enable row level security;

create policy "global_articles_select_policy"
  on "global_articles" for select
  to anon, authenticated
  using (true);