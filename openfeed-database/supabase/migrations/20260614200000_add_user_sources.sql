create table "public"."user_sources" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "source_key" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."user_sources" enable row level security;

CREATE UNIQUE INDEX user_sources_pkey ON public.user_sources USING btree (id);

CREATE INDEX user_sources_user_id_idx ON public.user_sources USING btree (user_id);

CREATE UNIQUE INDEX user_sources_user_id_source_key_key ON public.user_sources USING btree (user_id, source_key);

alter table "public"."user_sources" add constraint "user_sources_pkey" PRIMARY KEY using index "user_sources_pkey";

alter table "public"."user_sources" add constraint "user_sources_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_sources" validate constraint "user_sources_user_id_fkey";

alter table "public"."user_sources" add constraint "user_sources_user_id_source_key_key" UNIQUE using index "user_sources_user_id_source_key_key";

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


  create policy "Users can manage their own sources"
  on "public"."user_sources"
  as permissive
  for all
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));
