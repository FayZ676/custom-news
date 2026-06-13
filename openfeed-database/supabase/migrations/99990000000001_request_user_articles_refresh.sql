-- pg_net is needed to call the backend over HTTP (also created by the cron
-- migration; declared here too so this migration is order-independent).
create extension if not exists pg_net;

-- The hourly cron refreshes every user's articles, but a user who just changed
-- their interests (e.g. while onboarding) would otherwise see an empty feed
-- until the next run. This lets the app trigger an immediate refresh for the
-- calling user, mirroring the cron's net.http_post but scoped to auth.uid().
set check_function_bodies = off;

create or replace function public.request_user_articles_refresh()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  perform net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'backend_url') || '/user/articles/refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-api-key', (select decrypted_secret from vault.decrypted_secrets where name = 'backend_api_key')
    ),
    body := jsonb_build_object('user_id', v_user_id)
  );
end;
$$;

revoke all on function public.request_user_articles_refresh() from public, anon;
grant execute on function public.request_user_articles_refresh() to authenticated;
