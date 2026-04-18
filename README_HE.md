# 💰 יוני בוט | מערכת ניהול פיננסים אישיים

## מה זה?

**יוני בוט** היא מערכת ניהול פיננסים *מקומית* ו*מוצפנת*, בנויה עבור אדם אחד וחברים קרובים.

הרעיון: דע את כספך, בלי תמונות בענן.

### מה זה עושה?

```
📊 Dashboard (Next.js)
  ↕️ ← → 
🤖 Telegram Bot (grammy)
  ↕️ ← →
💾 SQLite (מוצפן)
  ↕️
🏦 Bank Scraper (Puppeteer)
```

**כל רכיב:**
- **Dashboard** (web): ראה את כל הנתונים + ניתוח בסיסי
- **Bot** (Telegram): קבל עדכונים, בקש דברים, תחזור על עצמך
- **Database** (SQLite): הכל מקומי + מוצפן
- **Scraper** (Puppeteer): יוך דברים מהבנקים כל יום אוטומטי

---

## "עכשיו vs אידיאל"

### מה עובד כרגע ✅
- ✅ Architecture בסיסי (3 apps + shared database)
- ✅ Telegram bot עם פקודות בסיסיות
- ✅ Web dashboard עם UI בסיסית
- ✅ Scraper עבור בנקים ישראליים
- ✅ Database מוצפן + WAL mode
- ✅ TypeScript everywhere

### מה חסר / לא מושלם ⚠️
- ⚠️ אין טסטים כחוק (partial coverage)
- ⚠️ דוקומנטציה חלקית בעברית
- ⚠️ UI dashboard בסיסית מאוד
- ⚠️ אין features "מעולה" (budget tracking, categorization)
- ⚠️ Bot commands לא יותר מדי ידידותיים
- ⚠️ לא ברור איפה הפרוייקט הולך

### המטרה 🎯
לשנות את זה ל:
- ✨ עובד חלק מבלי bugs
- 📚 תיעוד בעברית שמבין אדם
- 🎯 ברור מה עובד ומה לא
- 🚀 Features שאתה בעצם צריך

---

## Setup מהיר (Local Dev)

```bash
# 1. Clone & install
git clone <repo>
cd finance
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with your values:
# - TELEGRAM_BOT_TOKEN=...
# - ENCRYPTION_KEY=... (generate a new one!)

# 3. Database migrations
npm run db:generate  # אם יש שינויים בschema
npm run db:migrate   # הפעל migrations

# 4. Start dev
npm run dev          # http://localhost:5200 + bot
```

**נדרש:**
- Node.js 24+
- npm workspaces support
- Bank accounts עם scrapers support

---

## סטרוקטורה

```
finance/
├── apps/
│   ├── web/          Next.js dashboard
│   ├── bot/          Telegram bot (grammy)
│   └── scraper/      Bank scraper (Docker)
├── packages/
│   ├── db/           Drizzle ORM + schema
│   ├── types/        Shared TypeScript types
│   └── utils/        Crypto, dates, helpers
├── docs/             תיעוד
└── docker-compose.yml
```

---

## Commands מהיר

```bash
npm run dev              # Start web + bot
npm run db:generate      # Generate migration SQL
npm run db:migrate       # Run migrations
npm run typecheck        # TS check כל workspaces
cd packages/utils && npm test  # Run tests

# Scraper (Docker only)
docker compose --profile scraper up scraper
```

---

## Telegram Bot

שלח `/help` לbot כדי לראות פקודות.

**בסיס:**
- `/help` — פקודות זמינות
- `/balance` — סיכום חשבון
- `/transactions` — עסקאות אחרונות
- `/subscribe` — עדכונים יומיים

---

## שאלות קצרות?

ראה `FAQ.md` או `SETUP_GUIDE.md`.

---

## ⚠️ כללים חשובים

1. **אל תשתמש ב-`drizzle-kit push`** — תמיד `generate` + `migrate`
2. **ENCRYPTION_KEY = ברור** — אל תציג בconsole / browser
3. **SQLite = WAL mode** — אחרת "database is locked"
4. **Scraper = Docker** — יש צורך בChromium/Puppeteer

---

## מה בא הלאה?

ראה `ROADMAP.md`:
- **שלב 1**: תיעוד + הבנה (עכשיו)
- **שלב 2**: עבודה טובה + ניקיון
- **שלב 3**: Features שמועילות

---

**Version**: Early (April 2026)  
**Status**: Personal use + close friends  
**עדכון אחרון**: יום שלישי  

