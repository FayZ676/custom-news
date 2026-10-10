-- Hand-written: cron jobs live in the cron schema as data, so `db diff`
-- can't generate them from the declarative schema files.
--
-- Both jobs call the frontend's cron routes. They read two Vault secrets,
-- which must be created once per environment:
--   select vault.create_secret('https://<your-app>', 'app_url');
--   select vault.create_secret('<CRON_SECRET>', 'cron_secret');
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Pull every RSS feed and embed the new articles.
select cron.schedule(
  'fetch_articles',
  '*/15 * * * *',
  $$
    select net.http_get(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'app_url') || '/api/cron/fetch',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      timeout_milliseconds := 300000
    );
  $$
);

-- Judge new candidate articles for every interest, offset from the fetch.
select cron.schedule(
  'match_articles',
  '5-59/15 * * * *',
  $$
    select net.http_get(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'app_url') || '/api/cron/match',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      timeout_milliseconds := 300000
    );
  $$
);
