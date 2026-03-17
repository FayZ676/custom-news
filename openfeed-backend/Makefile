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
	@pytest tests/ -v

.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make install-hooks  - Install git pre-push hook"
	@echo "  make test          - Run all tests"

run:
	set -a && \
	. ./.env && \
	set +a && \
	uvicorn openfeed.main:app --reload --host 0.0.0.0 --port 8000

generate_api_key:
	openssl rand -hex 32