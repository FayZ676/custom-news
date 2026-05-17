create table "user_stories_hidden" (
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "story_id" uuid not null references global_stories(id) on delete cascade,
    "created_at" timestamptz not null default now(),
    primary key (user_id, story_id)
);

alter table "user_stories_hidden" enable row level security;

create policy "Users manage their own hidden stories"
  on "user_stories_hidden" for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);