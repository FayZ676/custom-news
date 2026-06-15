create table "global_sources" (
	"key" text primary key,
	"label" text not null,
	"feed_url" text not null,
	"created_at" timestamptz not null default now()
);

alter table "global_sources" enable row level security;

create policy "Authenticated users can read global sources"
	on "global_sources" for select
	to authenticated
	using (true);
