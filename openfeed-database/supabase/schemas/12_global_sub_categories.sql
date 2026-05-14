create table "global_sub_categories" (
    "id" uuid primary key default uuid_generate_v4(),
    "name" text unique not null,
    "category_name" text not null references global_categories(name) on update cascade on delete cascade,
    "created_at" timestamptz not null default now()
);

alter table "global_sub_categories" enable row level security;

create policy "global_sub_categories_select_policy"
  on "global_sub_categories" for select
  to anon, authenticated
  using (true);
