create table "user_interests" (
    "id" uuid primary key default gen_random_uuid(),
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "query" text not null,
    "embeddings" vector(512) not null,
    "embedding_model" text not null,
    "created_at" timestamptz not null default now()
);

alter table "user_interests" enable row level security;

create policy "Users manage their own interests"
  on "user_interests" for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);