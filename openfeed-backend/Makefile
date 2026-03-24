PYTHON := $(shell which python)
GIT_ROOT := $(shell git rev-parse --show-toplevel)

install:
	python -m venv .venv
	.venv/bin/pip install --upgrade pip
	.venv/bin/pip install -e ".[dev]"


install-hooks:
	@echo "Installing git hooks..."
	@mkdir -p $(GIT_ROOT)/.git/hooks
	@cp $(CURDIR)/scripts/pre-push $(GIT_ROOT)/.git/hooks/pre-push
	@chmod +x $(GIT_ROOT)/.git/hooks/pre-push
	@echo "✓ Pre-push hook installed"

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