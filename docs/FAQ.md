# ❓ שאלות נפוצות (FAQ)

---

## Setup & Installation

### **Q: אני לא יכול להתחיל את הפרוייקט**

**A:** בדוק את זה בסדר הזה:

1. `node --version` — צריך להיות v24+
2. `npm install` — פעל מחדש
3. `cp .env.example .env.local` — יצור env file
4. `npm run db:migrate` — יצור database
5. `npm run dev` — נסה להתחיל

אם עדיין לא עובד → ראה `SETUP_GUIDE.md` > Common Issues

---

### **Q: Port 3000 כבר תפוס**

**A:** Kill process:
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

---

### **Q: איזה Node version צריך?**

**A:** Node.js 24 LTS או יותר חדש.
```bash
node --version  # Check your version
```

---

## Telegram Bot

### **Q: Bot לא משיב**

**A:** בדוק את זה:

1. ✅ `TELEGRAM_BOT_TOKEN` בקבצי `.env.local`?
2. ✅ Token תקף? (Test: `curl https://api.telegram.org/bot{TOKEN}/getMe`)
3. ✅ Bot running? (`npm run dev` בקונסול)
4. ✅ Sending message to bot from Telegram?

אם עדיין לא עובד → סגור bot, התחל מחדש.

---

### **Q: Bot מה הפקודות שיש?**

**A:** שלח `/help` לbot. או ראה את הקוד ב`apps/bot/src/handlers/`.

**פקודות בסיס:**
- `/help` — רשימת פקודות
- `/balance` — סיכום חשבון
- `/transactions` — עסקאות אחרונות
- (עוד לא בנוי)

---

### **Q: אוכל להוסיף פקודה חדשה?**

**A:** כן! ראה `apps/bot/src/handlers/` והוסף handler חדש.

```typescript
// apps/bot/src/handlers/mycommand.ts
export const myCommand = async (ctx) => {
  await ctx.reply("Hello!");
};
```

עדכן `apps/bot/src/index.ts` כדי להוסיף את הפקודה.

---

## Database

### **Q: "database is locked" error**

**A:** SQLite locked בגלל concurrent access:
```bash
# Kill all Node processes
pkill -f node

# Start again
npm run dev
```

אם זה קורה בתדירות → צריך לבדוק את WAL mode (צריך להיות ON).

---

### **Q: איך הצפנה עובדת?**

**A:** שתי רמות:

1. **DB-level**: SQLite file מוצפן (better-sqlite3-multiple-ciphers)
2. **Field-level**: sensitive fields מוצפנים עם AES-256-GCM (packages/utils/crypto.ts)

`ENCRYPTION_KEY` משמש לשניהם.

---

### **Q: אני שכחתי את ENCRYPTION_KEY**

**A:** ❌ לא משחזר. אתה צריך key חדש:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy את הoutput → `.env.local` → `ENCRYPTION_KEY=...`

⚠️ **זה משמע**: database ישן לא יתפקד. אתה תאבד נתונים.

---

### **Q: איך להוסיף עמודה חדשה בdb?**

**A:** בדיוק בkeyspace:

1. Edit `packages/db/schema.ts` → הוסף עמודה
2. `npm run db:generate` → יוצר migration SQL
3. `npm run db:migrate` → מעדכן את DB
4. Update `packages/types/index.ts` אם צריך

**לעולם לא**: `drizzle-kit push` (יכול למחוק נתונים!)

---

## Scraper

### **Q: Scraper לא פועל**

**A:** Scraper דורש Docker:
```bash
docker compose --profile scraper up scraper
```

אם זה לא עובד:
1. ✅ Docker installed?
2. ✅ Docker daemon running?
3. ✅ Internet connection?
4. ✅ Bank credentials valid?

---

### **Q: איך להוסיף בנק חדש?**

**A:** Scraper משתמש ב`israeli-bank-scrapers` (external lib).

1. Check if bank is supported: https://github.com/eshaham/israeli-bank-scrapers
2. If yes → update `apps/scraper/src`
3. If no → manual import או switch to different tool

---

## Dashboard

### **Q: Dashboard לא טוען**

**A:** בדוק:

1. `npm run dev` — running?
2. http://localhost:3000 — נגישה?
3. Browser console — errors?
4. Network tab — API calls failing?

---

### **Q: איך להוסיף page חדש בdashboard?**

**A:** Next.js App Router:

```
apps/web/src/app/
├── page.tsx           (Home page)
├── layout.tsx         (Root layout)
└── new-page/
    └── page.tsx       (New page at /new-page)
```

---

## Testing

### **Q: איך להריץ tests?**

**A:** Tests יש רק ב`packages/utils` כרגע:

```bash
cd packages/utils
npm test          # Run tests
npm test -- --ui  # Interactive UI
```

---

### **Q: כיצד להוסיף test?**

**A:** Use Vitest (like Jest):

```typescript
// packages/utils/__tests__/mytest.test.ts
import { describe, it, expect } from "vitest";

describe("myFunction", () => {
  it("should work", () => {
    expect(1 + 1).toBe(2);
  });
});
```

```bash
npm test
```

---

## Architecture

### **Q: למה monorepo?**

**A:** Code sharing:

- `packages/types` — shared types across web + bot
- `packages/utils` — shared crypto, dates
- `packages/db` — shared database + schema

Easier to keep them in sync.

---

### **Q: אפשר להזיז את הdatabase לענן?**

**A:** כן, אבל **לא כרגע**. המטרה: local-only.

אם אתה רוצה ענן later → צריך:
1. Migrate SQLite → cloud DB (PostgreSQL? etc.)
2. Update connection string
3. Handle encryption differently
4. Add authentication layer

---

### **Q: אפשר להוסיף יותר apps?**

**A:** כן! npm workspaces תומך בזה:

```bash
mkdir apps/mobile
cd apps/mobile
npm init
# Update root package.json workspaces
```

---

## Security

### **Q: הנתונים שלי בטוח?**

**A:** כן, כל עוד:

- ✅ Database מוצפן (better-sqlite3-multiple-ciphers)
- ✅ Sensitive fields מוצפנים (AES-256-GCM)
- ✅ ENCRYPTION_KEY secure (not in Git, not in logs)
- ✅ Local only (not on cloud)

⚠️ **כל עוד**: לא ביצעת error בהגדרה

---

### **Q: ENCRYPTION_KEY זלע לו לעולם?**

**A:** **כן. עולם.**

- Never commit to Git
- Never log to console
- Never expose to client (browser)
- Keep safe locally

אם נדלף → צריך ליצור key חדש + database חדש.

---

### **Q: אפשר להשיג הרשאות?**

**A:** All features are local. No external permissions needed.

Bot צריך:
- Telegram Bot Token (from @BotFather)
- Internet connection

Scraper צריך:
- Bank credentials (stored encrypted)
- Internet connection
- Docker

---

## General

### **Q: זה חינם?**

**A:** כן! Open source (eventually).

כרגע: personal project בעברית.

---

### **Q: אפשר להשתמש בזה בייצור?**

**A:** **Not yet.** Currently:

- Personal use ✅
- Friends + family ✅
- Production ❌ (still too new)

See `STATUS_REPORT.md` for details.

---

### **Q: איך להתבונן לעיתוד?**

**A:** ראה `ROADMAP.md`:

1. **Phase 1** (עכשיו): Foundation + docs
2. **Phase 2** (שבועות): Cleanup + stability
3. **Phase 3** (חודשים): Features (categorization, budgets, reports)
4. **Phase 4** (maybe): Advanced stuff

---

### **Q: אוכל לתרום?**

**A:** כן! But right now it's personal.

Later: contribution guidelines במקום אחר.

For now: suggest features/bugs בדוקס.

---

### **Q: איפה לשאול שאלה שלא כאן?**

**A:** ראה:

- `SETUP_GUIDE.md` — setup issues
- `STATUS_REPORT.md` — what works/doesn't
- `ROADMAP.md` — future plans
- Code itself — comments explain complex parts

אם עדיין lost → ask me directly.

---

**Missing something?** Add to this FAQ!

