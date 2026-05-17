drop extension if exists "pg_cron";

create extension if not exists "vector" with schema "public";


  create table "public"."global_article_topics" (
    "article_id" uuid not null,
    "medtop_id" text not null,
    "pass" smallint not null
      );


alter table "public"."global_article_topics" enable row level security;


  create table "public"."global_articles" (
    "id" uuid not null default gen_random_uuid(),
    "feed_title" text not null,
    "title" text not null,
    "url" text not null,
    "summary" text,
    "summary_embeddings" public.vector(512),
    "summary_entities" text[] not null default '{}'::text[],
    "significance_score" double precision not null,
    "image_url" text,
    "published_at" timestamp with time zone not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."global_articles" enable row level security;


  create table "public"."global_emails" (
    "id" uuid not null default gen_random_uuid(),
    "email_text" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."global_emails" enable row level security;


  create table "public"."global_feeds" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "title" text not null,
    "url" text not null,
    "description" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."global_feeds" enable row level security;


  create table "public"."global_settings" (
    "id" uuid not null default gen_random_uuid(),
    "notification_hours" integer[] not null,
    "article_ttl" interval not null,
    "clustering_window_hours" integer not null default 72,
    "min_similarity_threshold" real not null,
    "max_match_count" integer not null,
    "cluster_significance_threshold" real not null default 0.6,
    "singleton" boolean not null default true
      );


alter table "public"."global_settings" enable row level security;


  create table "public"."global_share_links" (
    "token" uuid not null default gen_random_uuid(),
    "content_type" text not null,
    "content_id" text not null,
    "created_by" uuid default auth.uid(),
    "expires_at" timestamp with time zone not null default (now() + '7 days'::interval),
    "created_at" timestamp with time zone default now()
      );


alter table "public"."global_share_links" enable row level security;


  create table "public"."global_stories" (
    "id" uuid not null default gen_random_uuid(),
    "headline" text not null,
    "summary" text not null,
    "summary_embeddings" public.vector(512),
    "related_articles_urls" text[] not null default '{}'::text[],
    "score" double precision not null,
    "velocity" double precision not null,
    "image_url" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."global_stories" enable row level security;


  create table "public"."global_story_topics" (
    "story_id" uuid not null,
    "medtop_id" text not null
      );


alter table "public"."global_story_topics" enable row level security;


  create table "public"."user_settings" (
    "user_id" uuid not null,
    "email_notification" boolean not null default true,
    "timezone" text not null default 'UTC'::text,
    "color_theme" text not null default 'cupcake'::text
      );


alter table "public"."user_settings" enable row level security;


  create table "public"."user_stories_hidden" (
    "user_id" uuid not null,
    "story_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."user_stories_hidden" enable row level security;


  create table "public"."user_topic_preferences" (
    "user_id" uuid not null,
    "medtop_id" text not null,
    "preference" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."user_topic_preferences" enable row level security;

CREATE UNIQUE INDEX global_article_topics_pkey ON public.global_article_topics USING btree (article_id, medtop_id);

CREATE UNIQUE INDEX global_articles_pkey ON public.global_articles USING btree (id);

CREATE UNIQUE INDEX global_articles_url_key ON public.global_articles USING btree (url);

CREATE UNIQUE INDEX global_emails_pkey ON public.global_emails USING btree (id);

CREATE UNIQUE INDEX global_feeds_pkey ON public.global_feeds USING btree (id);

CREATE UNIQUE INDEX global_feeds_title_key ON public.global_feeds USING btree (title);

CREATE UNIQUE INDEX global_feeds_url_key ON public.global_feeds USING btree (url);

CREATE UNIQUE INDEX global_settings_pkey ON public.global_settings USING btree (id);

CREATE UNIQUE INDEX global_settings_singleton ON public.global_settings USING btree (singleton);

CREATE UNIQUE INDEX global_share_links_pkey ON public.global_share_links USING btree (token);

CREATE UNIQUE INDEX global_stories_pkey ON public.global_stories USING btree (id);

CREATE UNIQUE INDEX global_story_topics_pkey ON public.global_story_topics USING btree (story_id, medtop_id);

CREATE UNIQUE INDEX user_settings_pkey ON public.user_settings USING btree (user_id);

CREATE INDEX user_settings_user_id_idx ON public.user_settings USING btree (user_id);

CREATE UNIQUE INDEX user_stories_hidden_pkey ON public.user_stories_hidden USING btree (user_id, story_id);

CREATE UNIQUE INDEX user_topic_preferences_pkey ON public.user_topic_preferences USING btree (user_id, medtop_id);

alter table "public"."global_article_topics" add constraint "global_article_topics_pkey" PRIMARY KEY using index "global_article_topics_pkey";

alter table "public"."global_articles" add constraint "global_articles_pkey" PRIMARY KEY using index "global_articles_pkey";

alter table "public"."global_emails" add constraint "global_emails_pkey" PRIMARY KEY using index "global_emails_pkey";

alter table "public"."global_feeds" add constraint "global_feeds_pkey" PRIMARY KEY using index "global_feeds_pkey";

alter table "public"."global_settings" add constraint "global_settings_pkey" PRIMARY KEY using index "global_settings_pkey";

alter table "public"."global_share_links" add constraint "global_share_links_pkey" PRIMARY KEY using index "global_share_links_pkey";

alter table "public"."global_stories" add constraint "global_stories_pkey" PRIMARY KEY using index "global_stories_pkey";

alter table "public"."global_story_topics" add constraint "global_story_topics_pkey" PRIMARY KEY using index "global_story_topics_pkey";

alter table "public"."user_settings" add constraint "user_settings_pkey" PRIMARY KEY using index "user_settings_pkey";

alter table "public"."user_stories_hidden" add constraint "user_stories_hidden_pkey" PRIMARY KEY using index "user_stories_hidden_pkey";

alter table "public"."user_topic_preferences" add constraint "user_topic_preferences_pkey" PRIMARY KEY using index "user_topic_preferences_pkey";

alter table "public"."global_article_topics" add constraint "global_article_topics_article_id_fkey" FOREIGN KEY (article_id) REFERENCES public.global_articles(id) ON DELETE CASCADE not valid;

alter table "public"."global_article_topics" validate constraint "global_article_topics_article_id_fkey";

alter table "public"."global_article_topics" add constraint "global_article_topics_pass_check" CHECK ((pass = ANY (ARRAY[1, 2]))) not valid;

alter table "public"."global_article_topics" validate constraint "global_article_topics_pass_check";

alter table "public"."global_articles" add constraint "global_articles_feed_title_fkey" FOREIGN KEY (feed_title) REFERENCES public.global_feeds(title) ON DELETE CASCADE not valid;

alter table "public"."global_articles" validate constraint "global_articles_feed_title_fkey";

alter table "public"."global_articles" add constraint "global_articles_url_key" UNIQUE using index "global_articles_url_key";

alter table "public"."global_feeds" add constraint "global_feeds_title_key" UNIQUE using index "global_feeds_title_key";

alter table "public"."global_feeds" add constraint "global_feeds_url_key" UNIQUE using index "global_feeds_url_key";

alter table "public"."global_settings" add constraint "global_settings_singleton" UNIQUE using index "global_settings_singleton";

alter table "public"."global_settings" add constraint "global_settings_singleton_true" CHECK ((singleton = true)) not valid;

alter table "public"."global_settings" validate constraint "global_settings_singleton_true";

alter table "public"."global_share_links" add constraint "global_share_links_content_type_check" CHECK ((content_type = ANY (ARRAY['article'::text, 'story'::text]))) not valid;

alter table "public"."global_share_links" validate constraint "global_share_links_content_type_check";

alter table "public"."global_share_links" add constraint "global_share_links_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."global_share_links" validate constraint "global_share_links_created_by_fkey";

alter table "public"."global_story_topics" add constraint "global_story_topics_story_id_fkey" FOREIGN KEY (story_id) REFERENCES public.global_stories(id) ON DELETE CASCADE not valid;

alter table "public"."global_story_topics" validate constraint "global_story_topics_story_id_fkey";

alter table "public"."user_settings" add constraint "user_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_settings" validate constraint "user_settings_user_id_fkey";

alter table "public"."user_stories_hidden" add constraint "user_stories_hidden_story_id_fkey" FOREIGN KEY (story_id) REFERENCES public.global_stories(id) ON DELETE CASCADE not valid;

alter table "public"."user_stories_hidden" validate constraint "user_stories_hidden_story_id_fkey";

alter table "public"."user_stories_hidden" add constraint "user_stories_hidden_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_stories_hidden" validate constraint "user_stories_hidden_user_id_fkey";

alter table "public"."user_topic_preferences" add constraint "user_topic_preferences_preference_check" CHECK ((preference = ANY (ARRAY['liked'::text, 'disliked'::text]))) not valid;

alter table "public"."user_topic_preferences" validate constraint "user_topic_preferences_preference_check";

alter table "public"."user_topic_preferences" add constraint "user_topic_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_topic_preferences" validate constraint "user_topic_preferences_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_user_settings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
    insert into public.user_settings (user_id)
    values (new.id);
    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.match_stories(query_embedding public.vector, match_count integer, min_similarity double precision)
 RETURNS TABLE(id uuid, headline text, summary text, similarity double precision)
 LANGUAGE sql
AS $function$
  select id, headline, summary, 1 - (summary_embeddings <=> query_embedding) as similarity
  from global_stories
  where summary_embeddings is not null
    and (1 - (summary_embeddings <=> query_embedding)) >= min_similarity
  order by summary_embeddings <=> query_embedding
  limit match_count;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_user_settings_timezone()
 RETURNS trigger
 LANGUAGE plpgsql
 STABLE
AS $function$
begin
    if not exists (select 1 from pg_timezone_names where name = new.timezone) then
        raise exception 'Invalid timezone: %', new.timezone;
    end if;
    return new;
end;
$function$
;

grant delete on table "public"."global_article_topics" to "anon";

grant insert on table "public"."global_article_topics" to "anon";

grant references on table "public"."global_article_topics" to "anon";

grant select on table "public"."global_article_topics" to "anon";

grant trigger on table "public"."global_article_topics" to "anon";

grant truncate on table "public"."global_article_topics" to "anon";

grant update on table "public"."global_article_topics" to "anon";

grant delete on table "public"."global_article_topics" to "authenticated";

grant insert on table "public"."global_article_topics" to "authenticated";

grant references on table "public"."global_article_topics" to "authenticated";

grant select on table "public"."global_article_topics" to "authenticated";

grant trigger on table "public"."global_article_topics" to "authenticated";

grant truncate on table "public"."global_article_topics" to "authenticated";

grant update on table "public"."global_article_topics" to "authenticated";

grant delete on table "public"."global_article_topics" to "service_role";

grant insert on table "public"."global_article_topics" to "service_role";

grant references on table "public"."global_article_topics" to "service_role";

grant select on table "public"."global_article_topics" to "service_role";

grant trigger on table "public"."global_article_topics" to "service_role";

grant truncate on table "public"."global_article_topics" to "service_role";

grant update on table "public"."global_article_topics" to "service_role";

grant delete on table "public"."global_articles" to "anon";

grant insert on table "public"."global_articles" to "anon";

grant references on table "public"."global_articles" to "anon";

grant select on table "public"."global_articles" to "anon";

grant trigger on table "public"."global_articles" to "anon";

grant truncate on table "public"."global_articles" to "anon";

grant update on table "public"."global_articles" to "anon";

grant delete on table "public"."global_articles" to "authenticated";

grant insert on table "public"."global_articles" to "authenticated";

grant references on table "public"."global_articles" to "authenticated";

grant select on table "public"."global_articles" to "authenticated";

grant trigger on table "public"."global_articles" to "authenticated";

grant truncate on table "public"."global_articles" to "authenticated";

grant update on table "public"."global_articles" to "authenticated";

grant delete on table "public"."global_articles" to "service_role";

grant insert on table "public"."global_articles" to "service_role";

grant references on table "public"."global_articles" to "service_role";

grant select on table "public"."global_articles" to "service_role";

grant trigger on table "public"."global_articles" to "service_role";

grant truncate on table "public"."global_articles" to "service_role";

grant update on table "public"."global_articles" to "service_role";

grant delete on table "public"."global_emails" to "anon";

grant insert on table "public"."global_emails" to "anon";

grant references on table "public"."global_emails" to "anon";

grant select on table "public"."global_emails" to "anon";

grant trigger on table "public"."global_emails" to "anon";

grant truncate on table "public"."global_emails" to "anon";

grant update on table "public"."global_emails" to "anon";

grant delete on table "public"."global_emails" to "authenticated";

grant insert on table "public"."global_emails" to "authenticated";

grant references on table "public"."global_emails" to "authenticated";

grant select on table "public"."global_emails" to "authenticated";

grant trigger on table "public"."global_emails" to "authenticated";

grant truncate on table "public"."global_emails" to "authenticated";

grant update on table "public"."global_emails" to "authenticated";

grant delete on table "public"."global_emails" to "service_role";

grant insert on table "public"."global_emails" to "service_role";

grant references on table "public"."global_emails" to "service_role";

grant select on table "public"."global_emails" to "service_role";

grant trigger on table "public"."global_emails" to "service_role";

grant truncate on table "public"."global_emails" to "service_role";

grant update on table "public"."global_emails" to "service_role";

grant delete on table "public"."global_feeds" to "anon";

grant insert on table "public"."global_feeds" to "anon";

grant references on table "public"."global_feeds" to "anon";

grant select on table "public"."global_feeds" to "anon";

grant trigger on table "public"."global_feeds" to "anon";

grant truncate on table "public"."global_feeds" to "anon";

grant update on table "public"."global_feeds" to "anon";

grant delete on table "public"."global_feeds" to "authenticated";

grant insert on table "public"."global_feeds" to "authenticated";

grant references on table "public"."global_feeds" to "authenticated";

grant select on table "public"."global_feeds" to "authenticated";

grant trigger on table "public"."global_feeds" to "authenticated";

grant truncate on table "public"."global_feeds" to "authenticated";

grant update on table "public"."global_feeds" to "authenticated";

grant delete on table "public"."global_feeds" to "service_role";

grant insert on table "public"."global_feeds" to "service_role";

grant references on table "public"."global_feeds" to "service_role";

grant select on table "public"."global_feeds" to "service_role";

grant trigger on table "public"."global_feeds" to "service_role";

grant truncate on table "public"."global_feeds" to "service_role";

grant update on table "public"."global_feeds" to "service_role";

grant delete on table "public"."global_settings" to "anon";

grant insert on table "public"."global_settings" to "anon";

grant references on table "public"."global_settings" to "anon";

grant select on table "public"."global_settings" to "anon";

grant trigger on table "public"."global_settings" to "anon";

grant truncate on table "public"."global_settings" to "anon";

grant update on table "public"."global_settings" to "anon";

grant delete on table "public"."global_settings" to "authenticated";

grant insert on table "public"."global_settings" to "authenticated";

grant references on table "public"."global_settings" to "authenticated";

grant select on table "public"."global_settings" to "authenticated";

grant trigger on table "public"."global_settings" to "authenticated";

grant truncate on table "public"."global_settings" to "authenticated";

grant update on table "public"."global_settings" to "authenticated";

grant delete on table "public"."global_settings" to "service_role";

grant insert on table "public"."global_settings" to "service_role";

grant references on table "public"."global_settings" to "service_role";

grant select on table "public"."global_settings" to "service_role";

grant trigger on table "public"."global_settings" to "service_role";

grant truncate on table "public"."global_settings" to "service_role";

grant update on table "public"."global_settings" to "service_role";

grant delete on table "public"."global_share_links" to "anon";

grant insert on table "public"."global_share_links" to "anon";

grant references on table "public"."global_share_links" to "anon";

grant select on table "public"."global_share_links" to "anon";

grant trigger on table "public"."global_share_links" to "anon";

grant truncate on table "public"."global_share_links" to "anon";

grant update on table "public"."global_share_links" to "anon";

grant delete on table "public"."global_share_links" to "authenticated";

grant insert on table "public"."global_share_links" to "authenticated";

grant references on table "public"."global_share_links" to "authenticated";

grant select on table "public"."global_share_links" to "authenticated";

grant trigger on table "public"."global_share_links" to "authenticated";

grant truncate on table "public"."global_share_links" to "authenticated";

grant update on table "public"."global_share_links" to "authenticated";

grant delete on table "public"."global_share_links" to "service_role";

grant insert on table "public"."global_share_links" to "service_role";

grant references on table "public"."global_share_links" to "service_role";

grant select on table "public"."global_share_links" to "service_role";

grant trigger on table "public"."global_share_links" to "service_role";

grant truncate on table "public"."global_share_links" to "service_role";

grant update on table "public"."global_share_links" to "service_role";

grant delete on table "public"."global_stories" to "anon";

grant insert on table "public"."global_stories" to "anon";

grant references on table "public"."global_stories" to "anon";

grant select on table "public"."global_stories" to "anon";

grant trigger on table "public"."global_stories" to "anon";

grant truncate on table "public"."global_stories" to "anon";

grant update on table "public"."global_stories" to "anon";

grant delete on table "public"."global_stories" to "authenticated";

grant insert on table "public"."global_stories" to "authenticated";

grant references on table "public"."global_stories" to "authenticated";

grant select on table "public"."global_stories" to "authenticated";

grant trigger on table "public"."global_stories" to "authenticated";

grant truncate on table "public"."global_stories" to "authenticated";

grant update on table "public"."global_stories" to "authenticated";

grant delete on table "public"."global_stories" to "service_role";

grant insert on table "public"."global_stories" to "service_role";

grant references on table "public"."global_stories" to "service_role";

grant select on table "public"."global_stories" to "service_role";

grant trigger on table "public"."global_stories" to "service_role";

grant truncate on table "public"."global_stories" to "service_role";

grant update on table "public"."global_stories" to "service_role";

grant delete on table "public"."global_story_topics" to "anon";

grant insert on table "public"."global_story_topics" to "anon";

grant references on table "public"."global_story_topics" to "anon";

grant select on table "public"."global_story_topics" to "anon";

grant trigger on table "public"."global_story_topics" to "anon";

grant truncate on table "public"."global_story_topics" to "anon";

grant update on table "public"."global_story_topics" to "anon";

grant delete on table "public"."global_story_topics" to "authenticated";

grant insert on table "public"."global_story_topics" to "authenticated";

grant references on table "public"."global_story_topics" to "authenticated";

grant select on table "public"."global_story_topics" to "authenticated";

grant trigger on table "public"."global_story_topics" to "authenticated";

grant truncate on table "public"."global_story_topics" to "authenticated";

grant update on table "public"."global_story_topics" to "authenticated";

grant delete on table "public"."global_story_topics" to "service_role";

grant insert on table "public"."global_story_topics" to "service_role";

grant references on table "public"."global_story_topics" to "service_role";

grant select on table "public"."global_story_topics" to "service_role";

grant trigger on table "public"."global_story_topics" to "service_role";

grant truncate on table "public"."global_story_topics" to "service_role";

grant update on table "public"."global_story_topics" to "service_role";

grant delete on table "public"."user_settings" to "anon";

grant insert on table "public"."user_settings" to "anon";

grant references on table "public"."user_settings" to "anon";

grant select on table "public"."user_settings" to "anon";

grant trigger on table "public"."user_settings" to "anon";

grant truncate on table "public"."user_settings" to "anon";

grant update on table "public"."user_settings" to "anon";

grant delete on table "public"."user_settings" to "authenticated";

grant insert on table "public"."user_settings" to "authenticated";

grant references on table "public"."user_settings" to "authenticated";

grant select on table "public"."user_settings" to "authenticated";

grant trigger on table "public"."user_settings" to "authenticated";

grant truncate on table "public"."user_settings" to "authenticated";

grant update on table "public"."user_settings" to "authenticated";

grant delete on table "public"."user_settings" to "service_role";

grant insert on table "public"."user_settings" to "service_role";

grant references on table "public"."user_settings" to "service_role";

grant select on table "public"."user_settings" to "service_role";

grant trigger on table "public"."user_settings" to "service_role";

grant truncate on table "public"."user_settings" to "service_role";

grant update on table "public"."user_settings" to "service_role";

grant delete on table "public"."user_stories_hidden" to "anon";

grant insert on table "public"."user_stories_hidden" to "anon";

grant references on table "public"."user_stories_hidden" to "anon";

grant select on table "public"."user_stories_hidden" to "anon";

grant trigger on table "public"."user_stories_hidden" to "anon";

grant truncate on table "public"."user_stories_hidden" to "anon";

grant update on table "public"."user_stories_hidden" to "anon";

grant delete on table "public"."user_stories_hidden" to "authenticated";

grant insert on table "public"."user_stories_hidden" to "authenticated";

grant references on table "public"."user_stories_hidden" to "authenticated";

grant select on table "public"."user_stories_hidden" to "authenticated";

grant trigger on table "public"."user_stories_hidden" to "authenticated";

grant truncate on table "public"."user_stories_hidden" to "authenticated";

grant update on table "public"."user_stories_hidden" to "authenticated";

grant delete on table "public"."user_stories_hidden" to "service_role";

grant insert on table "public"."user_stories_hidden" to "service_role";

grant references on table "public"."user_stories_hidden" to "service_role";

grant select on table "public"."user_stories_hidden" to "service_role";

grant trigger on table "public"."user_stories_hidden" to "service_role";

grant truncate on table "public"."user_stories_hidden" to "service_role";

grant update on table "public"."user_stories_hidden" to "service_role";

grant delete on table "public"."user_topic_preferences" to "anon";

grant insert on table "public"."user_topic_preferences" to "anon";

grant references on table "public"."user_topic_preferences" to "anon";

grant select on table "public"."user_topic_preferences" to "anon";

grant trigger on table "public"."user_topic_preferences" to "anon";

grant truncate on table "public"."user_topic_preferences" to "anon";

grant update on table "public"."user_topic_preferences" to "anon";

grant delete on table "public"."user_topic_preferences" to "authenticated";

grant insert on table "public"."user_topic_preferences" to "authenticated";

grant references on table "public"."user_topic_preferences" to "authenticated";

grant select on table "public"."user_topic_preferences" to "authenticated";

grant trigger on table "public"."user_topic_preferences" to "authenticated";

grant truncate on table "public"."user_topic_preferences" to "authenticated";

grant update on table "public"."user_topic_preferences" to "authenticated";

grant delete on table "public"."user_topic_preferences" to "service_role";

grant insert on table "public"."user_topic_preferences" to "service_role";

grant references on table "public"."user_topic_preferences" to "service_role";

grant select on table "public"."user_topic_preferences" to "service_role";

grant trigger on table "public"."user_topic_preferences" to "service_role";

grant truncate on table "public"."user_topic_preferences" to "service_role";

grant update on table "public"."user_topic_preferences" to "service_role";


  create policy "global_article_topics_select_policy"
  on "public"."global_article_topics"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "global_articles_select_policy"
  on "public"."global_articles"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "global_emails_allow_all"
  on "public"."global_emails"
  as permissive
  for all
  to anon, authenticated
using (true);



  create policy "global_feeds_select_policy"
  on "public"."global_feeds"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "global_settings_select_policy"
  on "public"."global_settings"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Authenticated users can create share links"
  on "public"."global_share_links"
  as permissive
  for insert
  to public
with check ((auth.uid() IS NOT NULL));



  create policy "Public can read non-expired share links"
  on "public"."global_share_links"
  as permissive
  for select
  to public
using ((expires_at > now()));



  create policy "global_stories_select_policy"
  on "public"."global_stories"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "global_story_topics_select_policy"
  on "public"."global_story_topics"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Users can manage their own article scores"
  on "public"."user_settings"
  as permissive
  for all
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users manage their own hidden stories"
  on "public"."user_stories_hidden"
  as permissive
  for all
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users manage their own topic preferences"
  on "public"."user_topic_preferences"
  as permissive
  for all
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


CREATE TRIGGER check_user_settings_timezone BEFORE INSERT OR UPDATE OF timezone ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.validate_user_settings_timezone();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_user_settings();


