create table "user_article_metadata_options" (
	"user_id" uuid not null references auth.users(id) on delete cascade,
	"field" text not null,
	"name" text not null,
	"created_at" timestamptz not null default now(),
	primary key (user_id, field, name),
	constraint "user_article_metadata_options_field_name_fkey"
		foreign key (field, name)
		references "global_article_metadata_options" (field, name)
		on delete cascade,
	constraint "user_article_metadata_options_topic_only"
		check (field = 'topic')
);

create index on "user_article_metadata_options" (user_id);
create index on "user_article_metadata_options" (user_id, field);

alter table "user_article_metadata_options" enable row level security;

create policy "Users can manage their own metadata options"
	on "user_article_metadata_options" for all
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);