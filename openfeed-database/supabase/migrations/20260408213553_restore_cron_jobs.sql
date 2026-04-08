-- ensure extensions are enabled
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- unschedule existing jobs if they exist (avoids duplicate name errors)
select cron.unschedule(jobid) from cron.job where jobname = 'fetch_articles';
select cron.unschedule(jobid) from cron.job where jobname = 'delete_articles';
select cron.unschedule(jobid) from cron.job where jobname = 'notification_daily_morning';
select cron.unschedule(jobid) from cron.job where jobname = 'notification_daily_evening';

-- fetch articles every hour
select cron.schedule('fetch_articles', '0 * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'backend_url') || '/global/articles',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-api-key', (select decrypted_secret from vault.decrypted_secrets where name = 'backend_api_key')),
    body := '{}'::jsonb
  );
$$);

-- delete articles once a day
select cron.schedule('delete_articles', '0 0 * * *', $$
  select net.http_delete(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'backend_url') || '/global/articles',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-api-key', (select decrypted_secret from vault.decrypted_secrets where name = 'backend_api_key')),
    body := '{}'::jsonb
  );
$$);

-- email notifications 7am daily
select cron.schedule('notification_daily_morning', '0 7 * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'backend_url') || '/user/notifications?frequency=daily',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-api-key', (select decrypted_secret from vault.decrypted_secrets where name = 'backend_api_key')),
    body := '{}'::jsonb
  );
$$);

-- email notifications 7pm daily
select cron.schedule('notification_daily_evening', '0 19 * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'backend_url') || '/user/notifications?frequency=daily',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-api-key', (select decrypted_secret from vault.decrypted_secrets where name = 'backend_api_key')),
    body := '{}'::jsonb
  );
$$);