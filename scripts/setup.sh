#!/bin/bash
set -e

echo "Finance Yonibot — First-run Setup"
echo ""

NODE_MAJOR=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "ERROR: Node.js 22+ required. Current: $(node -v)"
  exit 1
fi
echo "Node $(node -v) ... OK"

echo "Installing dependencies..."
npm install
echo "Dependencies installed"

if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "Created .env from .env.example"
  echo ""
  echo "Fill in these values in .env before running:"
  echo "  TELEGRAM_BOT_TOKEN  — from @BotFather on Telegram"
  echo "  ENCRYPTION_KEY      — run: openssl rand -hex 16"
  echo "  AUTH_SECRET         — run: openssl rand -base64 32"
  echo "  DASHBOARD_PASSWORD  — choose a password"
  echo ""
else
  echo ".env already exists, skipping"
fi

echo ""
printf "Run database migrations now? [y/N] "
read -r REPLY
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm run db:migrate
  echo "Migrations applied"
fi

echo ""
echo "Setup complete."
echo "Run 'make dev' to start the web dashboard and bot."
