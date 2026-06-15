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

-- user_articles is RLS-scoped to its owner, so shared articles are resolved
-- through this definer function: a valid, non-expired token is the capability
-- that grants read access to the single linked article.
create or replace function get_shared_article(p_token uuid)
returns table (
  id uuid,
  source_name text,
  title text,
  url text,
  summary text,
  image_url text,
  published_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ua.id, ua.source_name, ua.title, ua.url, ua.summary,
    ua.image_url, ua.published_at, ua.created_at
  from global_share_links sl
  join user_articles ua on ua.id::text = sl.content_id
  where sl.token = p_token
    and sl.content_type = 'article'
    and sl.expires_at > now();
$$;