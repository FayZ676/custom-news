create extension if not exists pg_trgm;

create table "user_articles" (
    "id" uuid primary key default gen_random_uuid(),
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "source_name" text not null,
    "title" text not null,
    "url" text not null,
    "summary" text,
    "image_url" text,
    "published_at" timestamptz not null,
    "created_at" timestamptz not null default now(),
    "search_vector" tsvector generated always as (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, ''))
    ) stored,
    unique ("user_id", "url")
);

alter table "user_articles" enable row level security;

create policy "user_articles_select_policy"
  on "user_articles" for select
  to authenticated
  using (auth.uid() = user_id);

create index if not exists user_articles_user_id_idx
  on user_articles (user_id);

create index if not exists user_articles_title_trgm_idx
  on user_articles using gin (title gin_trgm_ops);

create index user_articles_search_vector_idx
  on user_articles using gin (search_vector);
