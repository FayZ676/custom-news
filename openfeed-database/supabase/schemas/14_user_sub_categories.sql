create table "user_sub_categories" (
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "sub_category_name" text not null references global_sub_categories(name) on update cascade on delete cascade,
    primary key (user_id, sub_category_name)
);

create index on "user_sub_categories" (user_id);

alter table "user_sub_categories" enable row level security;

create policy "Users manage their own sub-category subscriptions"
  on "user_sub_categories" for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
