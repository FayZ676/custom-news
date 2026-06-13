-- enable required extensions
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- schedule the per-user article refresh to run every hour: the backend runs
-- every user's interest queries against NewsData.io and replaces each user's
-- articles with the results
select cron.schedule(
  'refresh_user_articles',
  '0 * * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'backend_url') || '/user/articles',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-api-key', (select decrypted_secret from vault.decrypted_secrets where name = 'backend_api_key')
      ),
      body := '{}'::jsonb
    );
  $$
);
