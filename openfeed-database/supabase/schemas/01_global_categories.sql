create table "catalog_categories" (
    "id" uuid primary key default uuid_generate_v4(),
    "name" text unique not null,
    "created_at" timestamptz not null default now()
);

alter table "catalog_categories" enable row level security;

create policy "catalog_categories_select_policy" 
  on "catalog_categories" for select 
  to anon, authenticated 
  using (true);