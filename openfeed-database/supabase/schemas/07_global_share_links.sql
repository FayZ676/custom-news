create table global_share_links (
  token uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('article', 'story')),
  content_id text not null,
  created_by uuid references auth.users default auth.uid(),
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz default now()
);

alter table global_share_links enable row level security;

create policy "Public can read non-expired share links"
on global_share_links for select
to public
using (expires_at > now());

create policy "Authenticated users can create share links"
on global_share_links for insert
to public
with check (auth.uid() is not null);