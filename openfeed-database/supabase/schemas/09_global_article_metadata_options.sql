create table "global_article_metadata_options" (
    "field" text not null,
    "name" text not null,
    "description" text not null,
    constraint "global_article_metadata_options_pkey" primary key ("field", "name"),
  constraint "global_article_metadata_options_field_check" check ("field" in ('topic', 'type', 'coverage', 'duration', 'impact'))
);

alter table "global_article_metadata_options" enable row level security;

create policy "global_article_metadata_options_select_policy"
  on "global_article_metadata_options" for select
  to anon, authenticated
  using (true);