
  create table "public"."catalog_categories" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."catalog_categories" enable row level security;


  create table "public"."catalog_feeds" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "title" text not null,
    "url" text not null,
    "description" text not null,
    "category_id" uuid,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."catalog_feeds" enable row level security;

CREATE UNIQUE INDEX catalog_categories_name_key ON public.catalog_categories USING btree (name);

CREATE UNIQUE INDEX catalog_categories_pkey ON public.catalog_categories USING btree (id);

CREATE UNIQUE INDEX catalog_feeds_pkey ON public.catalog_feeds USING btree (id);

CREATE UNIQUE INDEX catalog_feeds_url_key ON public.catalog_feeds USING btree (url);

alter table "public"."catalog_categories" add constraint "catalog_categories_pkey" PRIMARY KEY using index "catalog_categories_pkey";

alter table "public"."catalog_feeds" add constraint "catalog_feeds_pkey" PRIMARY KEY using index "catalog_feeds_pkey";

alter table "public"."catalog_categories" add constraint "catalog_categories_name_key" UNIQUE using index "catalog_categories_name_key";

alter table "public"."catalog_feeds" add constraint "catalog_feeds_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.catalog_categories(id) not valid;

alter table "public"."catalog_feeds" validate constraint "catalog_feeds_category_id_fkey";

alter table "public"."catalog_feeds" add constraint "catalog_feeds_url_key" UNIQUE using index "catalog_feeds_url_key";

grant delete on table "public"."catalog_categories" to "anon";

grant insert on table "public"."catalog_categories" to "anon";

grant references on table "public"."catalog_categories" to "anon";

grant select on table "public"."catalog_categories" to "anon";

grant trigger on table "public"."catalog_categories" to "anon";

grant truncate on table "public"."catalog_categories" to "anon";

grant update on table "public"."catalog_categories" to "anon";

grant delete on table "public"."catalog_categories" to "authenticated";

grant insert on table "public"."catalog_categories" to "authenticated";

grant references on table "public"."catalog_categories" to "authenticated";

grant select on table "public"."catalog_categories" to "authenticated";

grant trigger on table "public"."catalog_categories" to "authenticated";

grant truncate on table "public"."catalog_categories" to "authenticated";

grant update on table "public"."catalog_categories" to "authenticated";

grant delete on table "public"."catalog_categories" to "service_role";

grant insert on table "public"."catalog_categories" to "service_role";

grant references on table "public"."catalog_categories" to "service_role";

grant select on table "public"."catalog_categories" to "service_role";

grant trigger on table "public"."catalog_categories" to "service_role";

grant truncate on table "public"."catalog_categories" to "service_role";

grant update on table "public"."catalog_categories" to "service_role";

grant delete on table "public"."catalog_feeds" to "anon";

grant insert on table "public"."catalog_feeds" to "anon";

grant references on table "public"."catalog_feeds" to "anon";

grant select on table "public"."catalog_feeds" to "anon";

grant trigger on table "public"."catalog_feeds" to "anon";

grant truncate on table "public"."catalog_feeds" to "anon";

grant update on table "public"."catalog_feeds" to "anon";

grant delete on table "public"."catalog_feeds" to "authenticated";

grant insert on table "public"."catalog_feeds" to "authenticated";

grant references on table "public"."catalog_feeds" to "authenticated";

grant select on table "public"."catalog_feeds" to "authenticated";

grant trigger on table "public"."catalog_feeds" to "authenticated";

grant truncate on table "public"."catalog_feeds" to "authenticated";

grant update on table "public"."catalog_feeds" to "authenticated";

grant delete on table "public"."catalog_feeds" to "service_role";

grant insert on table "public"."catalog_feeds" to "service_role";

grant references on table "public"."catalog_feeds" to "service_role";

grant select on table "public"."catalog_feeds" to "service_role";

grant trigger on table "public"."catalog_feeds" to "service_role";

grant truncate on table "public"."catalog_feeds" to "service_role";

grant update on table "public"."catalog_feeds" to "service_role";


  create policy "catalog_categories_select_policy"
  on "public"."catalog_categories"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "catalog_feeds_select_policy"
  on "public"."catalog_feeds"
  as permissive
  for select
  to anon, authenticated
using (true);



