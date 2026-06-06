create table "user_topics" (
		"user_id" uuid not null references auth.users(id) on delete cascade,
		"topic_id" text not null references global_topics(id) on delete cascade,
		"created_at" timestamptz not null default now(),
		primary key (user_id, topic_id)
);

create index on "user_topics" (user_id);

alter table "user_topics" enable row level security;

create policy "Users can manage their own topics"
	on "user_topics" for all
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);