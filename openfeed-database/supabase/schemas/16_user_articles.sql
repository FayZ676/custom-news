-- A user's feed: the articles judged relevant to one of their interests.
create table "user_articles" (
    "id" uuid primary key default gen_random_uuid(),
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "article_id" uuid not null references global_articles(id) on delete cascade,
    "interest_id" uuid not null references user_interests(id) on delete cascade,
    "created_at" timestamptz not null default now(),
    "read_at" timestamptz,
    unique ("user_id", "article_id")
);

alter table "user_articles" enable row level security;

create policy "user_articles_select_policy"
  on "user_articles" for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_articles_update_policy"
  on "user_articles" for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists user_articles_user_id_idx
  on user_articles (user_id);
