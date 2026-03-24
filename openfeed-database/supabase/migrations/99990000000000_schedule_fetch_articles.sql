-- enable required extensions
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- schedule fetch-articles to run every hour
select cron.schedule(
  'fetch_articles',
  '0 * * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'backend_url') || '/global/articles',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-api-key', (select decrypted_secret from vault.decrypted_secrets where name = 'backend_api_key')
      ),
      body := '{}'::jsonb
    );
  $$
);