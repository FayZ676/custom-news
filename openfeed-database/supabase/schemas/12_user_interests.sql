create table "user_interests" (
	"id" uuid primary key default gen_random_uuid(),
	"user_id" uuid not null references auth.users(id) on delete cascade,
	-- Plain-language description of what the user wants; it is both embedded
	-- for candidate retrieval and given verbatim to the relevance judge.
	"interest_text" text not null,
	-- Voyage query embedding of interest_text; null until embedded.
	"embedding" extensions.vector(1024),
	"created_at" timestamptz not null default now()
);

create index on "user_interests" (user_id);

alter table "user_interests" enable row level security;

create policy "Users can manage their own interests"
	on "user_interests" for all
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);
