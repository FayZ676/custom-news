create table "global_emails" (
    "id" uuid primary key default gen_random_uuid(),
    "email_text" text not null,
    "created_at" timestamptz not null default now()
);

alter table "global_emails" enable row level security;

create policy "global_emails_allow_all"
  on "global_emails" for all
  to anon, authenticated 
  using (true);