create table "global_settings" (
    "id" uuid primary key default gen_random_uuid(),
    "notification_hours" integer[] not null,
    "article_ttl" interval not null,
    "min_similarity_threshold" real not null,
    "max_match_count" integer not null,
    "singleton" boolean not null default true,
    constraint "global_settings_singleton" unique ("singleton"),
    constraint "global_settings_singleton_true" check ("singleton" = true)
);

alter table "global_settings" enable row level security;

create policy "global_settings_select_policy"
  on "global_settings" for select
  to anon, authenticated
  using (true);