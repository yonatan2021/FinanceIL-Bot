.PHONY: help dev dev-web dev-bot setup db-generate db-migrate typecheck test build clean

help:
	@echo "Finance Yonibot — Available commands:"
	@echo ""
	@echo "  make setup        First-run setup (install deps + create .env)"
	@echo "  make dev          Start web dashboard + Telegram bot"
	@echo "  make dev-web      Start web dashboard only"
	@echo "  make dev-bot      Start Telegram bot only"
	@echo "  make build        Build all apps for production"
	@echo "  make db-generate  Generate Drizzle migration from schema changes"
	@echo "  make db-migrate   Apply pending database migrations"
	@echo "  make typecheck    TypeScript check across all packages"
	@echo "  make test         Run test suite"
	@echo "  make clean        Remove node_modules and build artifacts"
	@echo ""

setup:
	@echo "→ Installing dependencies..."
	npm install
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "→ Created .env from .env.example"; \
		echo "→ Open .env and fill in your secrets before running make dev"; \
	else \
		echo "→ .env already exists, skipping"; \
	fi

dev:
	npm run dev

dev-web:
	npm run dev --workspace=apps/web

dev-bot:
	npm run dev --workspace=apps/bot

build:
	npm run build --workspaces --if-present

db-generate:
	npm run db:generate

db-migrate:
	npm run db:migrate

typecheck:
	npm run typecheck

test:
	npm run test

clean:
	find . -name "node_modules" -type d -not -path "*/.claude/*" -prune -exec rm -rf {} +
	find . -name ".next" -type d -prune -exec rm -rf {} +
	find . -name "dist" -type d -prune -exec rm -rf {} +
	@echo "→ Clean complete"
