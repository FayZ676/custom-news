create table "user_seen_articles" (
	"user_id" uuid not null references auth.users(id) on delete cascade,
	"article_id" uuid not null references global_articles(id) on delete cascade,
	"seen_at" timestamptz not null default now(),
	primary key (user_id, article_id)
);

create index on "user_seen_articles" (user_id);

alter table "user_seen_articles" enable row level security;

create policy "Users can manage their own seen articles"
	on "user_seen_articles" for all
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);
