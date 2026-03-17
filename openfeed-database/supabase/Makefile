include ../.env

fetch_articles:
	curl -i --location --request POST '$(PROJECT_URL)/functions/v1/fetch_articles' \
		--header 'Authorization: Bearer $(ANON_KEY)' \
		--header 'Content-Type: application/json'; \

init:
	supabase stop --no-backup \
		&& rm -rf migrations/*_create_all.sql .branches .temp \
		&& supabase db diff -f create_all \
		&& supabase start \
		&& supabase migration up \
		&& $(MAKE) fetch_articles

deploy:
	supabase link --project-ref $(PROJECT_ID) \
		&& supabase db push --include-seed \
		&& supabase functions deploy fetch_articles
