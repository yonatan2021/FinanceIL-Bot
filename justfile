set dotenv-load
set shell := ["bash", "-cu"]

# Show all available recipes
default:
	@just --list --unsorted

# First-run setup: install deps and create .env if missing
setup:
	npm install
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "→ Created .env from .env.example"; \
		echo "→ Open .env and fill in your secrets before running just dev"; \
	else \
		echo "→ .env already exists, skipping"; \
	fi

# Start all dev servers in parallel via turbo
dev:
	npx turbo run dev

# Start web dashboard only
dev-web:
	npx turbo run dev --filter=@finance-bot/web

# Start Telegram bot only
dev-bot:
	npx turbo run dev --filter=@finance-bot/bot

# Start scraper only (requires package.json in apps/scraper)
dev-scraper:
	npx turbo run dev --filter=@finance-bot/scraper

# Build all workspaces
build:
	npx turbo run build

# Build a specific app by name (e.g. just build-app @finance-bot/web)
build-app app:
	npx turbo run build --filter={{app}}

# Generate Drizzle migration from schema changes
db-generate:
	npm run db:generate

# Apply pending database migrations
db-migrate:
	npm run db:migrate

# Delete data.db and re-create it encrypted (run after changing ENCRYPTION_KEY or first setup)
db-reset-dev:
	#!/usr/bin/env bash
	set -euo pipefail
	if [ -f data.db ]; then
		mv data.db data.db.bak
		rm -f data.db-wal data.db-shm
		echo "→ data.db backed up to data.db.bak"
	fi
	if npm run db:migrate; then
		rm -f data.db.bak
		echo "→ Migration succeeded, backup removed"
	else
		echo "ERROR: Migration failed. Restoring data.db." >&2
		[ -f data.db.bak ] && mv data.db.bak data.db
		exit 1
	fi

# TypeScript check across all packages
typecheck:
	npx turbo run typecheck

# Run test suite
test:
	npx turbo run test

# Lint all packages
lint:
	npx turbo run lint

# Remove build artifacts (excludes .claude/)
clean:
	find . -path './.claude' -prune -o -name 'node_modules' -type d -prune -exec rm -rf '{}' +
	find . -path './.claude' -prune -o -name '.next' -type d -prune -exec rm -rf '{}' +
	find . -path './.claude' -prune -o -name 'dist' -type d -prune -exec rm -rf '{}' +
	find . -path './.claude' -prune -o -name '.turbo' -type d -prune -exec rm -rf '{}' +
	@echo "→ Clean complete"

# Full reset: clean then setup
reset: clean setup

# Start all Docker services
docker-up:
	docker compose up -d

# Stop all Docker services
docker-down:
	docker compose down

# Follow Docker logs
docker-logs:
	docker compose logs -f
