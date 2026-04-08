drop extension if exists "pg_cron";

alter table "public"."global_articles" drop constraint "global_articles_feed_title_fkey";

alter table "public"."global_articles" add constraint "global_articles_feed_title_fkey" FOREIGN KEY (feed_title) REFERENCES public.global_feeds(title) ON DELETE CASCADE not valid;

alter table "public"."global_articles" validate constraint "global_articles_feed_title_fkey";


