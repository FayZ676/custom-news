create table "sources" (
	"key" text primary key,
	"label" text not null,
	"feed_url" text not null,
	"created_at" timestamptz not null default now()
);

alter table "sources" enable row level security;

create policy "Authenticated users can read sources"
	on "sources" for select
	to authenticated
	using (true);
