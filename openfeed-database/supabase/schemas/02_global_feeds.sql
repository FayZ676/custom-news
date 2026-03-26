create table "global_feeds" (
    "id" uuid primary key default uuid_generate_v4(),
    "title" text not null unique,
    "url" text not null unique,
    "description" text not null,
    "category_id" uuid references global_categories(id),
    "created_at" timestamptz not null default now()
);

alter table "global_feeds" enable row level security;

create policy "global_feeds_select_policy" 
  on "global_feeds" for select 
  to anon, authenticated 
  using (true);