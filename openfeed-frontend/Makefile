include .env.local
export

db_types:
	supabase gen types typescript --project-id $(SUPABASE_PROJECT_ID) > lib/supabase.types.ts


# TODO: Run in the openfeed-database/supabase/ directory
db_types_local:
	supabase gen types typescript --local > ../../openfeed-frontend/lib/supabase.types.ts
