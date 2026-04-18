# 🚀 מדריך התקנה + פיתוח מקומי

צעד אחר צעד איך להתחיל לעבוד על הפרוייקט במחשבך.

---

## דרישות מקדימות

```
✅ Node.js 24+ (LTS)
✅ npm 10+ (comes with Node.js)
✅ Git
✅ Telegram Bot Token (from @BotFather)
```

**Check versions:**
```bash
node --version    # Should be v24.x.x or higher
npm --version     # Should be 10.x.x or higher
git --version
```

---

## 1️⃣ Clone הפרוייקט

```bash
git clone <repo-url>
cd finance
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

זה יתקין את כל הdependencies לכל 3 apps + packages.

**אם יש בעיות:**
```bash
npm install --legacy-peer-deps  # אם יש conflicts
npm ci                          # Clean install
```

---

## 3️⃣ Environment Setup

### 3.1 יצור `.env.local` בשורש

```bash
cp .env.example .env.local
```

### 3.2 עדכן את `.env.local` עם הערכים שלך

**הערכים שצריכים:**

```env
# Telegram Bot (חובה אם רוצה להפעיל bot)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# Encryption Key (חובה!)
# Generate one:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
ENCRYPTION_KEY=<paste-output-here>

# Database (optional - defaults to data.db)
DATABASE_URL=file:./data.db

# Bot owner (your Telegram user ID)
BOT_OWNER_ID=123456789

# Optional: Bank scraper credentials
# (Skip for now, you can add later)
BANK_USERNAME=
BANK_PASSWORD=
```

**⚠️ חשוב:**
- `ENCRYPTION_KEY` — חייב להיות 32 bytes base64 encoded
- `TELEGRAM_BOT_TOKEN` — קבל מ[@BotFather](https://t.me/BotFather)
- Never commit `.env.local` to Git!

---

## 4️⃣ Database Setup

### 4.1 Run migrations

```bash
npm run db:migrate
```

זה יוצר את ה-SQLite database + יוצר את כל הtables.

**אם יש שינויים בschema:**
```bash
npm run db:generate  # Creates new migration SQL
npm run db:migrate   # Applies migrations
```

### 4.2 Verify database

```bash
ls -lah data.db     # Should exist now
```

---

## 5️⃣ Start Development

### Option A: Start everything (web + bot)

```bash
npm run dev
```

זה יתחיל:
- **Web**: http://localhost:5200
- **Bot**: Polling mode (connects to Telegram)

### Option B: Start just web

```bash
cd apps/web
npm run dev
```

### Option C: Start just bot

```bash
cd apps/bot
npm run dev
```

---

## 6️⃣ Test it

### Web Dashboard
1. Go to http://localhost:5200
2. Should see dashboard (might be empty)
3. Check browser console for errors

### Telegram Bot
1. Message your bot on Telegram
2. Send `/help` — should get list of commands
3. Try `/balance` — should work

### TypeScript Check
```bash
npm run typecheck  # Should have 0 errors
```

---

## 🐛 Common Issues

### Issue: "database is locked"
```
Solution: Kill all Node processes, restart:
pkill -f node
npm run dev
```

### Issue: Bot not responding
```
Steps:
1. Check TELEGRAM_BOT_TOKEN in .env.local
2. Check console for errors
3. Restart bot: stop npm run dev, run again
4. Try: curl https://api.telegram.org/bot{TOKEN}/getMe
```

### Issue: Port 5200 already in use
```bash
# Kill process on port 5200
lsof -ti:5200 | xargs kill -9
# Or change port in next.config.ts
```

### Issue: Dependencies won't install
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript errors
```bash
npm run typecheck  # See all errors
# Each app/package might have its own tsconfig
```

---

## 📁 What You Just Created

```
finance/
├── node_modules/           ← installed packages
├── data.db                 ← SQLite database (created by migration)
├── .env.local              ← Your local config (NEVER commit!)
├── .next/                  ← Next.js build cache
├── apps/
│   ├── web/                ← Dashboard running on :5200
│   │   └── src/app/...     ← Routes, components
│   └── bot/                ← Telegram Bot
│       └── src/...         ← Handlers, commands
└── packages/
    ├── db/                 ← Database schema
    ├── types/              ← Shared types
    └── utils/              ← Crypto, helpers
```

---

## 🏗️ Project Structure Quick Reference

| Folder | Purpose | Language |
|--------|---------|----------|
| `apps/web` | Next.js Dashboard | TypeScript + React |
| `apps/bot` | Telegram Bot | TypeScript |
| `packages/db` | Drizzle ORM + Schema | TypeScript |
| `packages/types` | Shared Types | TypeScript |
| `packages/utils` | Utilities (crypto, dates) | TypeScript |
| `docs` | Documentation | Markdown |

---

## 🛠️ Useful Commands

```bash
# Development
npm run dev                    # Start all (web + bot)

# Database
npm run db:generate            # Generate migration from schema changes
npm run db:migrate             # Run migrations
npm run db:studio              # Opens Drizzle Studio (browse DB)

# Code Quality
npm run typecheck              # TypeScript check (all apps)
npm run lint                   # (if configured)

# Tests
cd packages/utils && npm test  # Run utils tests (Vitest)

# Building
npm run build                  # Build for production
```

---

## 📦 Production Setup (Later)

When you're ready to deploy:
1. Build: `npm run build`
2. Use Docker: `docker compose up`
3. Set up database backups
4. Configure real bot webhooks (not polling)

---

## 🎯 Next Steps

1. ✅ **Setup complete** — You can run `npm run dev`
2. 📖 **Read the docs**:
   - `README_HE.md` — What is this?
   - `STATUS_REPORT.md` — What's working/missing?
   - `ROADMAP.md` — Where we're going
3. 🤔 **Explore the code**:
   - Check `apps/web/src` for frontend
   - Check `apps/bot/src` for bot commands
   - Check `packages/db/schema.ts` for database structure
4. 🧪 **Play around**:
   - Message the bot
   - Use the dashboard
   - Try commands

---

## ❓ Stuck?

- **Bot not working?** → Check `.env.local` + token
- **Database error?** → Run `npm run db:migrate`
- **Port conflict?** → Change port or kill process
- **TypeScript errors?** → Run `npm run typecheck`
- **Still confused?** → See `FAQ.md`

---

**Happy coding! 🚀**

