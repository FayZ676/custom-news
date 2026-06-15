create table "user_feedback" (
    "id" uuid primary key default gen_random_uuid(),
    "user_email" text,
    "message" text not null,
    "created_at" timestamptz not null default now()
);

alter table "user_feedback" enable row level security;

create policy "user_feedback_insert_authenticated"
  on "user_feedback" for insert
  to authenticated
  with check (true);
