create table "global_feeds" (
    "id" uuid primary key default gen_random_uuid(),
    "title" text not null,
    "url" text not null unique,
    "description" text,
    "created_at" timestamptz not null default now()
);

-- Only the service role reads feeds (during ingestion), so no policies.
alter table "global_feeds" enable row level security;
