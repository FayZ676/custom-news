create table "global_topics" (
    "id" text primary key,
    "name" text not null,
    "description" text not null,
    "significance_score" real not null,
  constraint "global_topics_id_format" check (id ~ '^[0-9]{2}$'),
    constraint "global_topics_significance_range" check (significance_score >= 0 and significance_score <= 1)
);

alter table "global_topics" enable row level security;

create policy "global_topics_select_policy"
  on "global_topics" for select
  to anon, authenticated
  using (true);
