create table "global_story_topics" (
    "story_id" uuid not null references global_stories(id) on delete cascade,
    "medtop_id" text not null,
    "medtop_name" text not null,
    primary key (story_id, medtop_id)
);

alter table "global_story_topics" enable row level security;

create policy "global_story_topics_select_policy"
  on "global_story_topics" for select
  to anon, authenticated
  using (true);
