-- enable required extensions
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- schedule user email notifications to run once a day
select cron.schedule(
  'notification_daily',
  '0 0 * * *',
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
