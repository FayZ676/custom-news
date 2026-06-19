create table "user_article_interactions" (
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "article_id" uuid not null references user_articles(id) on delete cascade,
    "read_at" timestamptz,
    "updated_at" timestamptz not null default now(),
    primary key (user_id, article_id)
);

alter table "user_article_interactions" enable row level security;

create policy "Users can manage their own article interactions"
  on "user_article_interactions" for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index user_article_interactions_user_id_idx
  on user_article_interactions (user_id);
