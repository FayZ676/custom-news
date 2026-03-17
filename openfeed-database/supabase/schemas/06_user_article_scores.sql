create table "user_article_scores" (
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "interest_id" uuid not null references user_interests(id) on delete cascade,
    "article_id" uuid not null references global_articles(id) on delete cascade,
    "score" float not null,
    "updated_at" timestamptz not null default now(),
    primary key (user_id, interest_id, article_id)
);

create index on "user_article_scores" (user_id, interest_id, score desc);

alter table "user_article_scores" enable row level security;

create policy "Users can manage their own article scores"
  on "user_article_scores" for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);