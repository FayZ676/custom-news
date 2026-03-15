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


  create table "public"."user_article_scores" (
    "user_id" uuid not null,
    "interest_id" uuid not null,
    "article_id" uuid not null,
    "score" double precision not null,
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."user_article_scores" enable row level security;


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
    "embedding" public.vector(384) not null,
    "embedding_model" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."user_interests" enable row level security;

CREATE UNIQUE INDEX articles_pkey ON public.articles USING btree (id);

CREATE UNIQUE INDEX articles_url_key ON public.articles USING btree (url);

CREATE UNIQUE INDEX catalog_categories_name_key ON public.catalog_categories USING btree (name);

CREATE UNIQUE INDEX catalog_categories_pkey ON public.catalog_categories USING btree (id);

CREATE UNIQUE INDEX catalog_feeds_pkey ON public.catalog_feeds USING btree (id);

CREATE UNIQUE INDEX catalog_feeds_url_key ON public.catalog_feeds USING btree (url);

CREATE UNIQUE INDEX user_article_scores_pkey ON public.user_article_scores USING btree (user_id, interest_id, article_id);

CREATE INDEX user_article_scores_user_id_interest_id_score_idx ON public.user_article_scores USING btree (user_id, interest_id, score DESC);

CREATE UNIQUE INDEX user_category_subscriptions_pkey ON public.user_category_subscriptions USING btree (user_id, category_id);

CREATE UNIQUE INDEX user_interests_pkey ON public.user_interests USING btree (id);

alter table "public"."articles" add constraint "articles_pkey" PRIMARY KEY using index "articles_pkey";

alter table "public"."catalog_categories" add constraint "catalog_categories_pkey" PRIMARY KEY using index "catalog_categories_pkey";

alter table "public"."catalog_feeds" add constraint "catalog_feeds_pkey" PRIMARY KEY using index "catalog_feeds_pkey";

alter table "public"."user_article_scores" add constraint "user_article_scores_pkey" PRIMARY KEY using index "user_article_scores_pkey";

alter table "public"."user_category_subscriptions" add constraint "user_category_subscriptions_pkey" PRIMARY KEY using index "user_category_subscriptions_pkey";

alter table "public"."user_interests" add constraint "user_interests_pkey" PRIMARY KEY using index "user_interests_pkey";

alter table "public"."articles" add constraint "articles_feed_id_fkey" FOREIGN KEY (feed_id) REFERENCES public.catalog_feeds(id) not valid;

alter table "public"."articles" validate constraint "articles_feed_id_fkey";

alter table "public"."articles" add constraint "articles_url_key" UNIQUE using index "articles_url_key";

alter table "public"."catalog_categories" add constraint "catalog_categories_name_key" UNIQUE using index "catalog_categories_name_key";

alter table "public"."catalog_feeds" add constraint "catalog_feeds_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.catalog_categories(id) not valid;

alter table "public"."catalog_feeds" validate constraint "catalog_feeds_category_id_fkey";

alter table "public"."catalog_feeds" add constraint "catalog_feeds_url_key" UNIQUE using index "catalog_feeds_url_key";

alter table "public"."user_article_scores" add constraint "user_article_scores_article_id_fkey" FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE not valid;

alter table "public"."user_article_scores" validate constraint "user_article_scores_article_id_fkey";

alter table "public"."user_article_scores" add constraint "user_article_scores_interest_id_fkey" FOREIGN KEY (interest_id) REFERENCES public.user_interests(id) ON DELETE CASCADE not valid;

alter table "public"."user_article_scores" validate constraint "user_article_scores_interest_id_fkey";

alter table "public"."user_article_scores" add constraint "user_article_scores_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_article_scores" validate constraint "user_article_scores_user_id_fkey";

alter table "public"."user_category_subscriptions" add constraint "user_category_subscriptions_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.catalog_categories(id) ON DELETE CASCADE not valid;

alter table "public"."user_category_subscriptions" validate constraint "user_category_subscriptions_category_id_fkey";

alter table "public"."user_category_subscriptions" add constraint "user_category_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_category_subscriptions" validate constraint "user_category_subscriptions_user_id_fkey";

alter table "public"."user_interests" add constraint "user_interests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_interests" validate constraint "user_interests_user_id_fkey";

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

grant delete on table "public"."user_article_scores" to "anon";

grant insert on table "public"."user_article_scores" to "anon";

grant references on table "public"."user_article_scores" to "anon";

grant select on table "public"."user_article_scores" to "anon";

grant trigger on table "public"."user_article_scores" to "anon";

grant truncate on table "public"."user_article_scores" to "anon";

grant update on table "public"."user_article_scores" to "anon";

grant delete on table "public"."user_article_scores" to "authenticated";

grant insert on table "public"."user_article_scores" to "authenticated";

grant references on table "public"."user_article_scores" to "authenticated";

grant select on table "public"."user_article_scores" to "authenticated";

grant trigger on table "public"."user_article_scores" to "authenticated";

grant truncate on table "public"."user_article_scores" to "authenticated";

grant update on table "public"."user_article_scores" to "authenticated";

grant delete on table "public"."user_article_scores" to "service_role";

grant insert on table "public"."user_article_scores" to "service_role";

grant references on table "public"."user_article_scores" to "service_role";

grant select on table "public"."user_article_scores" to "service_role";

grant trigger on table "public"."user_article_scores" to "service_role";

grant truncate on table "public"."user_article_scores" to "service_role";

grant update on table "public"."user_article_scores" to "service_role";

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


  create policy "articles_select_policy"
  on "public"."articles"
  as permissive
  for select
  to anon, authenticated
using (true);



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



  create policy "Users can read their own article scores"
  on "public"."user_article_scores"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



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



