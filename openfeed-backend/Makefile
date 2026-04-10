include .env.prod

PYTHON := $(shell which python)
GIT_ROOT := $(shell git rev-parse --show-toplevel)

install:
	python -m venv .venv
	.venv/bin/pip install --upgrade pip
	.venv/bin/pip install -e ".[dev]"

test:
	set -a && \
	. ./.env && \
	set +a && \
	pytest tests/ -v

run:
	set -a && \
	. ./.env && \
	set +a && \
	uvicorn openfeed.main:app --reload --host 0.0.0.0 --port 8000

generate_api_key:
	openssl rand -hex 32

# Docker

docker_build:
	docker build -t openfeed-backend .

docker_run:
	docker run --rm \
		--name openfeed-backend \
		-p 8000:8000 \
		--env-file .env \
		openfeed-backend

# Deployment

deploy_secrets:
	modal secret delete openfeed-secrets
	modal secret create openfeed-secrets \
		SUPABASE_PROJECT_URL=$(SUPABASE_PROJECT_URL) \
		SUPABASE_SERVICE_ROLE_KEY=$(SUPABASE_SERVICE_ROLE_KEY) \
		OPENAI_API_KEY=$(OPENAI_API_KEY) \
		VOYAGEAI_API_KEY=$(VOYAGEAI_API_KEY) \
		BACKEND_API_KEY=$(BACKEND_API_KEY) \
		RESEND_API_KEY=$(RESEND_API_KEY) \
		RESEND_FROM_EMAIL=$(RESEND_FROM_EMAIL) \
		FRONTEND_URL=$(FRONTEND_URL) \

deploy: deploy_secrets
	modal deploy openfeed/modal_app.py