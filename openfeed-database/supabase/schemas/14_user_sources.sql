create table "user_sources" (
	"id" uuid primary key default gen_random_uuid(),
	"user_id" uuid not null references auth.users(id) on delete cascade,
	"source_key" text not null references global_sources(key) on delete cascade,
	"created_at" timestamptz not null default now(),
	unique (user_id, source_key)
);

create index on "user_sources" (user_id);

alter table "user_sources" enable row level security;

create policy "Users can manage their own sources"
	on "user_sources" for all
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);
