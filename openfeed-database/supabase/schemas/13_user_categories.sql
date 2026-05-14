create table "user_categories" (
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "category_name" text not null references global_categories(name) on update cascade on delete cascade,
    "position" integer not null,
    primary key (user_id, category_name)
);

create index on "user_categories" (user_id);

alter table "user_categories" enable row level security;

create policy "Users manage their own category subscriptions"
  on "user_categories" for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
