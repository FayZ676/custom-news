drop extension if exists "pg_cron";

create extension if not exists "vector" with schema "public";


  create table "public"."global_articles" (
    "id" uuid not null default gen_random_uuid(),
    "feed_title" text not null,
    "title" text not null,
    "url" text not null,
    "summary" text,
    "content" text,
    "published_at" timestamp with time zone not null,
    "embeddings" public.vector(512),
    "embedding_model" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."global_articles" enable row level security;


  create table "public"."global_categories" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "interest_suggestions" jsonb not null default '[]'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."global_categories" enable row level security;


  create table "public"."global_feeds" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "title" text not null,
    "url" text not null,
    "description" text not null,
    "category_id" uuid,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."global_feeds" enable row level security;


  create table "public"."user_articles" (
    "user_id" uuid not null,
    "interest_id" uuid not null,
    "article_id" uuid not null,
    "score" double precision not null,
    "updated_at" timestamp with time zone not null default now(),
    "is_read" boolean not null default false
      );


alter table "public"."user_articles" enable row level security;


  create table "public"."user_category_subscriptions" (
    "user_id" uuid not null,
    "category_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."user_category_subscriptions" enable row level security;


  create table "public"."user_interests" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "query" text not null,
    "embeddings" public.vector(512) not null,
    "embedding_model" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."user_interests" enable row level security;


  create table "public"."user_settings" (
    "user_id" uuid not null,
    "email_notification" boolean not null default true,
    "timezone" text not null default 'UTC'::text
      );


alter table "public"."user_settings" enable row level security;

CREATE UNIQUE INDEX global_articles_pkey ON public.global_articles USING btree (id);

CREATE UNIQUE INDEX global_articles_url_key ON public.global_articles USING btree (url);

CREATE UNIQUE INDEX global_categories_name_key ON public.global_categories USING btree (name);

CREATE UNIQUE INDEX global_categories_pkey ON public.global_categories USING btree (id);

CREATE UNIQUE INDEX global_feeds_pkey ON public.global_feeds USING btree (id);

CREATE UNIQUE INDEX global_feeds_title_key ON public.global_feeds USING btree (title);

CREATE UNIQUE INDEX global_feeds_url_key ON public.global_feeds USING btree (url);

CREATE UNIQUE INDEX user_articles_pkey ON public.user_articles USING btree (user_id, interest_id, article_id);

CREATE INDEX user_articles_user_id_interest_id_score_idx ON public.user_articles USING btree (user_id, interest_id, score DESC);

CREATE UNIQUE INDEX user_category_subscriptions_pkey ON public.user_category_subscriptions USING btree (user_id, category_id);

CREATE UNIQUE INDEX user_interests_pkey ON public.user_interests USING btree (id);

CREATE UNIQUE INDEX user_settings_pkey ON public.user_settings USING btree (user_id);

CREATE INDEX user_settings_user_id_idx ON public.user_settings USING btree (user_id);

alter table "public"."global_articles" add constraint "global_articles_pkey" PRIMARY KEY using index "global_articles_pkey";

alter table "public"."global_categories" add constraint "global_categories_pkey" PRIMARY KEY using index "global_categories_pkey";

alter table "public"."global_feeds" add constraint "global_feeds_pkey" PRIMARY KEY using index "global_feeds_pkey";

alter table "public"."user_articles" add constraint "user_articles_pkey" PRIMARY KEY using index "user_articles_pkey";

alter table "public"."user_category_subscriptions" add constraint "user_category_subscriptions_pkey" PRIMARY KEY using index "user_category_subscriptions_pkey";

alter table "public"."user_interests" add constraint "user_interests_pkey" PRIMARY KEY using index "user_interests_pkey";

alter table "public"."user_settings" add constraint "user_settings_pkey" PRIMARY KEY using index "user_settings_pkey";

alter table "public"."global_articles" add constraint "global_articles_feed_title_fkey" FOREIGN KEY (feed_title) REFERENCES public.global_feeds(title) ON DELETE CASCADE not valid;

alter table "public"."global_articles" validate constraint "global_articles_feed_title_fkey";

alter table "public"."global_articles" add constraint "global_articles_url_key" UNIQUE using index "global_articles_url_key";

alter table "public"."global_categories" add constraint "global_categories_name_key" UNIQUE using index "global_categories_name_key";

alter table "public"."global_feeds" add constraint "global_feeds_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.global_categories(id) not valid;

alter table "public"."global_feeds" validate constraint "global_feeds_category_id_fkey";

alter table "public"."global_feeds" add constraint "global_feeds_title_key" UNIQUE using index "global_feeds_title_key";

alter table "public"."global_feeds" add constraint "global_feeds_url_key" UNIQUE using index "global_feeds_url_key";

alter table "public"."user_articles" add constraint "user_articles_article_id_fkey" FOREIGN KEY (article_id) REFERENCES public.global_articles(id) ON DELETE CASCADE not valid;

alter table "public"."user_articles" validate constraint "user_articles_article_id_fkey";

alter table "public"."user_articles" add constraint "user_articles_interest_id_fkey" FOREIGN KEY (interest_id) REFERENCES public.user_interests(id) ON DELETE CASCADE not valid;

alter table "public"."user_articles" validate constraint "user_articles_interest_id_fkey";

alter table "public"."user_articles" add constraint "user_articles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_articles" validate constraint "user_articles_user_id_fkey";

alter table "public"."user_category_subscriptions" add constraint "user_category_subscriptions_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.global_categories(id) ON DELETE CASCADE not valid;

alter table "public"."user_category_subscriptions" validate constraint "user_category_subscriptions_category_id_fkey";

alter table "public"."user_category_subscriptions" add constraint "user_category_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_category_subscriptions" validate constraint "user_category_subscriptions_user_id_fkey";

alter table "public"."user_interests" add constraint "user_interests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_interests" validate constraint "user_interests_user_id_fkey";

alter table "public"."user_settings" add constraint "user_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_settings" validate constraint "user_settings_user_id_fkey";

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

CREATE OR REPLACE FUNCTION public.match_articles(query_embedding public.vector, match_count integer, min_similarity double precision)
 RETURNS TABLE(id uuid, title text, summary text, content text, similarity double precision)
 LANGUAGE sql
AS $function$
  select id, title, summary, content, 1 - (embeddings <=> query_embedding) as similarity
  from global_articles
  where (1 - (embeddings <=> query_embedding)) >= min_similarity
  order by embeddings <=> query_embedding
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

grant delete on table "public"."global_categories" to "anon";

grant insert on table "public"."global_categories" to "anon";

grant references on table "public"."global_categories" to "anon";

grant select on table "public"."global_categories" to "anon";

grant trigger on table "public"."global_categories" to "anon";

grant truncate on table "public"."global_categories" to "anon";

grant update on table "public"."global_categories" to "anon";

grant delete on table "public"."global_categories" to "authenticated";

grant insert on table "public"."global_categories" to "authenticated";

grant references on table "public"."global_categories" to "authenticated";

grant select on table "public"."global_categories" to "authenticated";

grant trigger on table "public"."global_categories" to "authenticated";

grant truncate on table "public"."global_categories" to "authenticated";

grant update on table "public"."global_categories" to "authenticated";

grant delete on table "public"."global_categories" to "service_role";

grant insert on table "public"."global_categories" to "service_role";

grant references on table "public"."global_categories" to "service_role";

grant select on table "public"."global_categories" to "service_role";

grant trigger on table "public"."global_categories" to "service_role";

grant truncate on table "public"."global_categories" to "service_role";

grant update on table "public"."global_categories" to "service_role";

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

grant delete on table "public"."user_articles" to "anon";

grant insert on table "public"."user_articles" to "anon";

grant references on table "public"."user_articles" to "anon";

grant select on table "public"."user_articles" to "anon";

grant trigger on table "public"."user_articles" to "anon";

grant truncate on table "public"."user_articles" to "anon";

grant update on table "public"."user_articles" to "anon";

grant delete on table "public"."user_articles" to "authenticated";

grant insert on table "public"."user_articles" to "authenticated";

grant references on table "public"."user_articles" to "authenticated";

grant select on table "public"."user_articles" to "authenticated";

grant trigger on table "public"."user_articles" to "authenticated";

grant truncate on table "public"."user_articles" to "authenticated";

grant update on table "public"."user_articles" to "authenticated";

grant delete on table "public"."user_articles" to "service_role";

grant insert on table "public"."user_articles" to "service_role";

grant references on table "public"."user_articles" to "service_role";

grant select on table "public"."user_articles" to "service_role";

grant trigger on table "public"."user_articles" to "service_role";

grant truncate on table "public"."user_articles" to "service_role";

grant update on table "public"."user_articles" to "service_role";

grant delete on table "public"."user_category_subscriptions" to "anon";

grant insert on table "public"."user_category_subscriptions" to "anon";

grant references on table "public"."user_category_subscriptions" to "anon";

grant select on table "public"."user_category_subscriptions" to "anon";

grant trigger on table "public"."user_category_subscriptions" to "anon";

grant truncate on table "public"."user_category_subscriptions" to "anon";

grant update on table "public"."user_category_subscriptions" to "anon";

grant delete on table "public"."user_category_subscriptions" to "authenticated";

grant insert on table "public"."user_category_subscriptions" to "authenticated";

grant references on table "public"."user_category_subscriptions" to "authenticated";

grant select on table "public"."user_category_subscriptions" to "authenticated";

grant trigger on table "public"."user_category_subscriptions" to "authenticated";

grant truncate on table "public"."user_category_subscriptions" to "authenticated";

grant update on table "public"."user_category_subscriptions" to "authenticated";

grant delete on table "public"."user_category_subscriptions" to "service_role";

grant insert on table "public"."user_category_subscriptions" to "service_role";

grant references on table "public"."user_category_subscriptions" to "service_role";

grant select on table "public"."user_category_subscriptions" to "service_role";

grant trigger on table "public"."user_category_subscriptions" to "service_role";

grant truncate on table "public"."user_category_subscriptions" to "service_role";

grant update on table "public"."user_category_subscriptions" to "service_role";

grant delete on table "public"."user_interests" to "anon";

grant insert on table "public"."user_interests" to "anon";

grant references on table "public"."user_interests" to "anon";

grant select on table "public"."user_interests" to "anon";

grant trigger on table "public"."user_interests" to "anon";

grant truncate on table "public"."user_interests" to "anon";

grant update on table "public"."user_interests" to "anon";

grant delete on table "public"."user_interests" to "authenticated";

grant insert on table "public"."user_interests" to "authenticated";

grant references on table "public"."user_interests" to "authenticated";

grant select on table "public"."user_interests" to "authenticated";

grant trigger on table "public"."user_interests" to "authenticated";

grant truncate on table "public"."user_interests" to "authenticated";

grant update on table "public"."user_interests" to "authenticated";

grant delete on table "public"."user_interests" to "service_role";

grant insert on table "public"."user_interests" to "service_role";

grant references on table "public"."user_interests" to "service_role";

grant select on table "public"."user_interests" to "service_role";

grant trigger on table "public"."user_interests" to "service_role";

grant truncate on table "public"."user_interests" to "service_role";

grant update on table "public"."user_interests" to "service_role";

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


  create policy "global_articles_select_policy"
  on "public"."global_articles"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "global_categories_select_policy"
  on "public"."global_categories"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "global_feeds_select_policy"
  on "public"."global_feeds"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Users can manage their own article scores"
  on "public"."user_articles"
  as permissive
  for all
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users manage their own subscriptions"
  on "public"."user_category_subscriptions"
  as permissive
  for all
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users manage their own interests"
  on "public"."user_interests"
  as permissive
  for all
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can manage their own article scores"
  on "public"."user_settings"
  as permissive
  for all
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


CREATE TRIGGER check_user_settings_timezone BEFORE INSERT OR UPDATE OF timezone ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.validate_user_settings_timezone();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_user_settings();


