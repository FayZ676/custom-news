create table "global_settings" (
    "id" uuid primary key default gen_random_uuid(),
    "notification_hours" integer[] not null,
    "article_ttl" interval not null,
    "clustering_window_hours" integer not null default 72,
    "max_match_count" integer not null,
    "cluster_significance_threshold" real not null default 0.6,
    "admin_email" text not null,
    "singleton" boolean not null default true,
    constraint "global_settings_singleton" unique ("singleton"),
    constraint "global_settings_singleton_true" check ("singleton" = true)
);

alter table "global_settings" enable row level security;

create policy "global_settings_select_policy"
  on "global_settings" for select
  to anon, authenticated
  using (true);