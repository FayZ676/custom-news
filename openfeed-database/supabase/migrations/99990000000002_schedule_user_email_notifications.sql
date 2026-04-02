-- enable required extensions
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- 7am daily
select cron.schedule(
  'notification_daily_morning',
  '0 7 * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'backend_url') || '/user/notifications?frequency=daily',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-api-key', (select decrypted_secret from vault.decrypted_secrets where name = 'backend_api_key')
      ),
      body := '{}'::jsonb
    );
  $$
);

-- 7pm daily
select cron.schedule(
  'notification_daily_evening',
  '0 19 * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'backend_url') || '/user/notifications?frequency=daily',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-api-key', (select decrypted_secret from vault.decrypted_secrets where name = 'backend_api_key')
      ),
      body := '{}'::jsonb
    );
  $$
);