create extension if not exists "pg_trgm" with schema "public";


  create table "public"."global_emails" (
    "id" uuid not null default gen_random_uuid(),
    "email_text" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."global_emails" enable row level security;


  create table "public"."global_settings" (
    "id" uuid not null default gen_random_uuid(),
    "notification_hours" integer[] not null,
    "article_ttl" interval not null,
    "clustering_window_hours" integer not null default 72,
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


  create table "public"."global_sources" (
    "key" text not null,
    "label" text not null,
    "feed_url" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."global_sources" enable row level security;


  create table "public"."user_articles" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "source_name" text not null,
    "title" text not null,
    "url" text not null,
    "summary" text,
    "image_url" text,
    "published_at" timestamp with time zone not null,
    "created_at" timestamp with time zone not null default now(),
    "search_vector" tsvector generated always as (to_tsvector('english'::regconfig, ((COALESCE(title, ''::text) || ' '::text) || COALESCE(summary, ''::text)))) stored
      );


alter table "public"."user_articles" enable row level security;


  create table "public"."user_interests" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "interest_text" text not null,
    "query_payload" jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."user_interests" enable row level security;


  create table "public"."user_settings" (
    "user_id" uuid not null,
    "email_notification" boolean not null default true,
    "timezone" text not null default 'UTC'::text,
    "color_theme" text not null default 'cupcake'::text
      );


alter table "public"."user_settings" enable row level security;


  create table "public"."user_sources" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "source_key" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."user_sources" enable row level security;

CREATE UNIQUE INDEX global_emails_pkey ON public.global_emails USING btree (id);

CREATE UNIQUE INDEX global_settings_pkey ON public.global_settings USING btree (id);

CREATE UNIQUE INDEX global_settings_singleton ON public.global_settings USING btree (singleton);

CREATE UNIQUE INDEX global_share_links_pkey ON public.global_share_links USING btree (token);

CREATE UNIQUE INDEX global_sources_pkey ON public.global_sources USING btree (key);

CREATE UNIQUE INDEX user_articles_pkey ON public.user_articles USING btree (id);

CREATE INDEX user_articles_search_vector_idx ON public.user_articles USING gin (search_vector);

CREATE INDEX user_articles_title_trgm_idx ON public.user_articles USING gin (title public.gin_trgm_ops);

CREATE INDEX user_articles_user_id_idx ON public.user_articles USING btree (user_id);

CREATE UNIQUE INDEX user_articles_user_id_url_key ON public.user_articles USING btree (user_id, url);

CREATE UNIQUE INDEX user_interests_pkey ON public.user_interests USING btree (id);

CREATE INDEX user_interests_user_id_idx ON public.user_interests USING btree (user_id);

CREATE UNIQUE INDEX user_settings_pkey ON public.user_settings USING btree (user_id);

CREATE INDEX user_settings_user_id_idx ON public.user_settings USING btree (user_id);

CREATE UNIQUE INDEX user_sources_pkey ON public.user_sources USING btree (id);

CREATE INDEX user_sources_user_id_idx ON public.user_sources USING btree (user_id);

CREATE UNIQUE INDEX user_sources_user_id_source_key_key ON public.user_sources USING btree (user_id, source_key);

alter table "public"."global_emails" add constraint "global_emails_pkey" PRIMARY KEY using index "global_emails_pkey";

alter table "public"."global_settings" add constraint "global_settings_pkey" PRIMARY KEY using index "global_settings_pkey";

alter table "public"."global_share_links" add constraint "global_share_links_pkey" PRIMARY KEY using index "global_share_links_pkey";

alter table "public"."global_sources" add constraint "global_sources_pkey" PRIMARY KEY using index "global_sources_pkey";

alter table "public"."user_articles" add constraint "user_articles_pkey" PRIMARY KEY using index "user_articles_pkey";

alter table "public"."user_interests" add constraint "user_interests_pkey" PRIMARY KEY using index "user_interests_pkey";

alter table "public"."user_settings" add constraint "user_settings_pkey" PRIMARY KEY using index "user_settings_pkey";

alter table "public"."user_sources" add constraint "user_sources_pkey" PRIMARY KEY using index "user_sources_pkey";

alter table "public"."global_settings" add constraint "global_settings_singleton" UNIQUE using index "global_settings_singleton";

alter table "public"."global_settings" add constraint "global_settings_singleton_true" CHECK ((singleton = true)) not valid;

alter table "public"."global_settings" validate constraint "global_settings_singleton_true";

alter table "public"."global_share_links" add constraint "global_share_links_content_type_check" CHECK ((content_type = ANY (ARRAY['article'::text, 'story'::text]))) not valid;

alter table "public"."global_share_links" validate constraint "global_share_links_content_type_check";

alter table "public"."global_share_links" add constraint "global_share_links_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."global_share_links" validate constraint "global_share_links_created_by_fkey";

alter table "public"."user_articles" add constraint "user_articles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_articles" validate constraint "user_articles_user_id_fkey";

alter table "public"."user_articles" add constraint "user_articles_user_id_url_key" UNIQUE using index "user_articles_user_id_url_key";

alter table "public"."user_interests" add constraint "user_interests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_interests" validate constraint "user_interests_user_id_fkey";

alter table "public"."user_settings" add constraint "user_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_settings" validate constraint "user_settings_user_id_fkey";

alter table "public"."user_sources" add constraint "user_sources_source_key_fkey" FOREIGN KEY (source_key) REFERENCES public.global_sources(key) ON DELETE CASCADE not valid;

alter table "public"."user_sources" validate constraint "user_sources_source_key_fkey";

alter table "public"."user_sources" add constraint "user_sources_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_sources" validate constraint "user_sources_user_id_fkey";

alter table "public"."user_sources" add constraint "user_sources_user_id_source_key_key" UNIQUE using index "user_sources_user_id_source_key_key";

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

CREATE OR REPLACE FUNCTION public.get_shared_article(p_token uuid)
 RETURNS TABLE(id uuid, source_name text, title text, url text, summary text, image_url text, published_at timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    ua.id, ua.source_name, ua.title, ua.url, ua.summary,
    ua.image_url, ua.published_at, ua.created_at
  from global_share_links sl
  join user_articles ua on ua.id::text = sl.content_id
  where sl.token = p_token
    and sl.content_type = 'article'
    and sl.expires_at > now();
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

grant delete on table "public"."global_sources" to "anon";

grant insert on table "public"."global_sources" to "anon";

grant references on table "public"."global_sources" to "anon";

grant select on table "public"."global_sources" to "anon";

grant trigger on table "public"."global_sources" to "anon";

grant truncate on table "public"."global_sources" to "anon";

grant update on table "public"."global_sources" to "anon";

grant delete on table "public"."global_sources" to "authenticated";

grant insert on table "public"."global_sources" to "authenticated";

grant references on table "public"."global_sources" to "authenticated";

grant select on table "public"."global_sources" to "authenticated";

grant trigger on table "public"."global_sources" to "authenticated";

grant truncate on table "public"."global_sources" to "authenticated";

grant update on table "public"."global_sources" to "authenticated";

grant delete on table "public"."global_sources" to "service_role";

grant insert on table "public"."global_sources" to "service_role";

grant references on table "public"."global_sources" to "service_role";

grant select on table "public"."global_sources" to "service_role";

grant trigger on table "public"."global_sources" to "service_role";

grant truncate on table "public"."global_sources" to "service_role";

grant update on table "public"."global_sources" to "service_role";

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

grant delete on table "public"."user_sources" to "anon";

grant insert on table "public"."user_sources" to "anon";

grant references on table "public"."user_sources" to "anon";

grant select on table "public"."user_sources" to "anon";

grant trigger on table "public"."user_sources" to "anon";

grant truncate on table "public"."user_sources" to "anon";

grant update on table "public"."user_sources" to "anon";

grant delete on table "public"."user_sources" to "authenticated";

grant insert on table "public"."user_sources" to "authenticated";

grant references on table "public"."user_sources" to "authenticated";

grant select on table "public"."user_sources" to "authenticated";

grant trigger on table "public"."user_sources" to "authenticated";

grant truncate on table "public"."user_sources" to "authenticated";

grant update on table "public"."user_sources" to "authenticated";

grant delete on table "public"."user_sources" to "service_role";

grant insert on table "public"."user_sources" to "service_role";

grant references on table "public"."user_sources" to "service_role";

grant select on table "public"."user_sources" to "service_role";

grant trigger on table "public"."user_sources" to "service_role";

grant truncate on table "public"."user_sources" to "service_role";

grant update on table "public"."user_sources" to "service_role";


  create policy "global_emails_allow_all"
  on "public"."global_emails"
  as permissive
  for all
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



  create policy "Authenticated users can read global sources"
  on "public"."global_sources"
  as permissive
  for select
  to authenticated
using (true);



  create policy "user_articles_select_policy"
  on "public"."user_articles"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can manage their own interests"
  on "public"."user_interests"
  as permissive
  for all
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can manage their own article scores"
  on "public"."user_settings"
  as permissive
  for all
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can manage their own sources"
  on "public"."user_sources"
  as permissive
  for all
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


CREATE TRIGGER check_user_settings_timezone BEFORE INSERT OR UPDATE OF timezone ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.validate_user_settings_timezone();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_user_settings();


