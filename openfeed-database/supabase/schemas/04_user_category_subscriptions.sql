create table "user_category_subscriptions" (
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "category_id" uuid not null references global_categories(id) on delete cascade,
    "created_at" timestamptz not null default now(),
    primary key (user_id, category_id)
);

alter table "user_category_subscriptions" enable row level security;

create policy "Users manage their own subscriptions"
  on "user_category_subscriptions" for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);