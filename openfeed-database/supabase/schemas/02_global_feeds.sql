create table "catalog_feeds" (
    "id" uuid primary key default uuid_generate_v4(),
    "title" text not null,
    "url" text not null unique,
    "description" text not null,
    "category_id" uuid references catalog_categories(id),
    "created_at" timestamptz not null default now()
);

alter table "catalog_feeds" enable row level security;

create policy "catalog_feeds_select_policy" 
  on "catalog_feeds" for select 
  to anon, authenticated 
  using (true);