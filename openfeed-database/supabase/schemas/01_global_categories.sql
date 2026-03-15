create table "global_categories" (
    "id" uuid primary key default uuid_generate_v4(),
    "name" text unique not null,
    "interest_suggestions" jsonb not null default '[]'::jsonb,
    "created_at" timestamptz not null default now()
);

alter table "global_categories" enable row level security;

create policy "global_categories_select_policy" 
  on "global_categories" for select 
  to anon, authenticated 
  using (true);