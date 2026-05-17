create table "user_topic_preferences" (
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "medtop_id" text not null,
    "preference" text not null check (preference in ('liked', 'disliked')),
    "created_at" timestamptz not null default now(),
    primary key (user_id, medtop_id)
);

alter table "user_topic_preferences" enable row level security;

create policy "Users manage their own topic preferences"
  on "user_topic_preferences" for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);