# 🤖 FinanceIL-Bot

> **v0.1.0 | Personal Alpha | Local Only**

בוט טלגרם לניהול פיננסי אישי בישראל. מתחבר לבנקים ולחברות האשראי הישראליים, שולף עסקאות אוטומטית, מקטלג אותן, ומאפשר מעקב תקציב, דוחות וניתוח — הכל מ-Telegram, עם Dashboard ניהולי מלא.

**⚠️ Privacy Note:** גרסה זו (v0.x) פועלת **local only** — כל הנתונים על המכונה שלך בלבד. הנתונים הפיננסיים הם המידע הרגיש ביותר. אין cloud, אין שרת חיצוני.

---

## Features

| Feature | Status | גרסה |
|---------|--------|------|
| Telegram bot — פקודות בסיסיות | ✅ Done | v0.1.0 |
| Israeli Bank MCP Scraper | ✅ Done | v0.1.0 |
| Dashboard — צפייה בעסקאות | ✅ Done | v0.1.0 |
| Auto-Categorization | 📋 Planned | v0.2.0 |
| Category Management (Dashboard) | 📋 Planned | v0.2.0 |
| Budget Tracking חודשי | 📋 Planned | v0.3.0 |
| Anomaly Alerts | 📋 Planned | v0.3.0 |
| Monthly Reports | 📋 Planned | v0.4.0 |
| CSV Export | 📋 Planned | v0.4.0 |
| Recurring Detection | 📋 Planned | v0.5.0 |
| AI Finance Assistant | 📋 Planned | v0.6.0 |
| Multi-User (Family) | 📋 Planned | v1.0.0 |
| Cloud Deployment | 📋 Planned | v1.0.0 |
| BaaS / Multi-Tenant | 📋 Planned | v2.0.0 |

---

## Tech Stack

| שכבה | טכנולוגיה |
|------|----------|
| Language | TypeScript + Node.js |
| Architecture | Monorepo (npm workspaces) |
| Telegram Bot | Telegraf |
| Dashboard | Web UI (apps/web) |
| Database | SQLite + Drizzle ORM |
| Bank Integration | Israeli Bank MCP Scraper |
| Infrastructure | Docker + docker-compose |

### Project Structure

```
apps/
  bot/     ← Telegram bot (Telegraf)
  web/     ← Dashboard UI + API
packages/
  db/      ← Drizzle schema + migrations
  types/   ← Shared TypeScript types
  utils/   ← Shared utilities
```

---

## Quick Start (Local)

### Prerequisites
- Node.js 20.x (see `.nvmrc`)
- Docker + docker-compose

### Setup

```bash
git clone <repo-url>
cd finance-bot

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — הוסף bank credentials ו-Telegram bot token

# Run database migrations
npm run db:migrate

# Start everything
docker-compose up
```

Dashboard זמין ב: `http://localhost:3000`  
Bot: מגיב ל-Telegram לאחר הגדרת `BOT_TOKEN` ב-`.env`

### Development (ללא Docker)

```bash
npm run dev          # bot + dashboard במקביל
npm run typecheck    # type checking
npm run test         # run tests
```

---

## Documentation

| מסמך | תיאור |
|------|-------|
| [ROADMAP.md](ROADMAP.md) | גרסאות v0.1.0 → v3.0.0, features, timelines |
| [VERSIONING.md](VERSIONING.md) | לוגיקת semver, changelog, release checklist |
| [VISION.md](VISION.md) | BaaS vision, קהל יעד, core principles |
| [SECURITY.md](SECURITY.md) | דיווח על בעיות אבטחה |
| [docs/BOT_COMMANDS_REFERENCE.md](docs/BOT_COMMANDS_REFERENCE.md) | כל פקודות ה-bot |
| [docs/DATABASE_SCHEMA_REFERENCE.md](docs/DATABASE_SCHEMA_REFERENCE.md) | DB schema |
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | הגדרה מפורטת |
