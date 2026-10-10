create extension if not exists vector with schema extensions;
-- pg_cron and pg_net drive the article pipeline schedule (see migrations/*_schedule_pipeline.sql).
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
