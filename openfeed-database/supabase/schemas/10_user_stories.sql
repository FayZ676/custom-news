create table "user_stories" (
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "interest_id" uuid not null references user_interests(id) on delete cascade,
    "story_id" uuid not null references global_stories(id) on delete cascade,
    "score" float not null,
    "updated_at" timestamptz not null default now(),
    "is_read" boolean not null default false,
    primary key (user_id, interest_id, story_id)
);

create index on "user_stories" (user_id, interest_id, score desc);

alter table "user_stories" enable row level security;

create policy "Users can manage their own story scores"
  on "user_stories" for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);