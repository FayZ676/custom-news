create table "global_articles" (
    "id" uuid primary key default gen_random_uuid(),
    "source_name" text not null,
    "title" text not null,
    "url" text not null unique,
    "summary" text,
    "image_url" text,
    "published_at" timestamptz not null,
    "created_at" timestamptz not null default now(),
    -- Voyage document embedding of title + summary; null until embedded.
    "embedding" extensions.vector(1024),
    "search_vector" tsvector generated always as (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, ''))
    ) stored
);

alter table "global_articles" enable row level security;

create policy "global_articles_select_policy"
  on "global_articles" for select
  to authenticated
  using (true);

create index global_articles_published_at_idx
  on global_articles (published_at desc);

create index global_articles_embedding_idx
  on global_articles using hnsw (embedding extensions.vector_cosine_ops);

create index global_articles_search_vector_idx
  on global_articles using gin (search_vector);
