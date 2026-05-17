create table "global_article_topics" (
    "article_id" uuid not null references global_articles(id) on delete cascade,
    "medtop_id" text not null,
    "pass_number" smallint not null check (pass_number in (1, 2)),
    primary key (article_id, medtop_id)
);

alter table "global_article_topics" enable row level security;

create policy "global_article_topics_select_policy"
  on "global_article_topics" for select
  to anon, authenticated
  using (true);
