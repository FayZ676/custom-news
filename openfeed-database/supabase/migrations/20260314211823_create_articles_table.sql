create extension if not exists "vector" with schema "public";


  create table "public"."articles" (
    "id" uuid not null default gen_random_uuid(),
    "feed_id" uuid not null,
    "title" text not null,
    "url" text not null,
    "content" text not null,
    "published_at" timestamp with time zone not null,
    "embedding" public.vector(384),
    "embedding_model" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."articles" enable row level security;

CREATE UNIQUE INDEX articles_pkey ON public.articles USING btree (id);

CREATE UNIQUE INDEX articles_url_key ON public.articles USING btree (url);

alter table "public"."articles" add constraint "articles_pkey" PRIMARY KEY using index "articles_pkey";

alter table "public"."articles" add constraint "articles_feed_id_fkey" FOREIGN KEY (feed_id) REFERENCES public.catalog_feeds(id) not valid;

alter table "public"."articles" validate constraint "articles_feed_id_fkey";

alter table "public"."articles" add constraint "articles_url_key" UNIQUE using index "articles_url_key";

grant delete on table "public"."articles" to "anon";

grant insert on table "public"."articles" to "anon";

grant references on table "public"."articles" to "anon";

grant select on table "public"."articles" to "anon";

grant trigger on table "public"."articles" to "anon";

grant truncate on table "public"."articles" to "anon";

grant update on table "public"."articles" to "anon";

grant delete on table "public"."articles" to "authenticated";

grant insert on table "public"."articles" to "authenticated";

grant references on table "public"."articles" to "authenticated";

grant select on table "public"."articles" to "authenticated";

grant trigger on table "public"."articles" to "authenticated";

grant truncate on table "public"."articles" to "authenticated";

grant update on table "public"."articles" to "authenticated";

grant delete on table "public"."articles" to "service_role";

grant insert on table "public"."articles" to "service_role";

grant references on table "public"."articles" to "service_role";

grant select on table "public"."articles" to "service_role";

grant trigger on table "public"."articles" to "service_role";

grant truncate on table "public"."articles" to "service_role";

grant update on table "public"."articles" to "service_role";


  create policy "articles_select_policy"
  on "public"."articles"
  as permissive
  for select
  to anon, authenticated
using (true);



