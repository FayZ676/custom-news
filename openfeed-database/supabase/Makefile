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


reset_remote:
	supabase link --project-ref $(PROJECT_ID) \
		&& supabase db reset --linked

deploy_remote:
	supabase link --project-ref $(PROJECT_ID) \
		&& supabase db push --include-seed --include-all \
		&& supabase functions deploy fetch_articles

functions_test:
	@for test in functions/tests/test_*.ts; do \
		echo "Running $$test..."; \
		deno run --allow-net --allow-read --allow-env --env=../.env "$$test" || exit 1; \
	done

inspect_feeds:
	deno run --reload --allow-net --allow-read functions/tests/inspect_feeds.ts > content.txt
