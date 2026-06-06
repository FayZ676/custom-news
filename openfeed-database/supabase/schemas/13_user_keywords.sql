create table "user_keywords" (
		"user_id" uuid not null references auth.users(id) on delete cascade,
		"keywords" text not null,
		"created_at" timestamptz not null default now(),
		primary key (user_id, keywords)
);

create index on "user_keywords" (user_id);

alter table "user_keywords" enable row level security;

create policy "Users can manage their own keywords"
	on "user_keywords" for all
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);