-- enable required extensions
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- schedule fetch-articles to run every hour
select cron.schedule(
  'fetch_articles',
  '0 * * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/fetch-articles',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
      ),
      body := '{}'::jsonb
    );
  $$
);