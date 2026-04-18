# 🏛️ ARCHITECTURE — FinanceIL-Bot

> ⚠️ **LIVING DOCUMENT** — Last Updated: April 2026 | Version: v0.1.0
>
> **כל AI שעובד על פרויקט זה חייב לקרוא מסמך זה במלואו לפני כתיבת קוד כלשהו.**
> החלטות כאן הן LAW — לא הצעות, לא guidelines, לא "מומלץ".
> שאלה לפני שינוי ארכיטקטורה, לא אחריו.

---

## תוכן עניינים

1. [Monorepo & File Structure](#1-️-monorepo--file-structure)
2. [Application Architecture](#2-️-application-architecture)
3. [Bridge Layer](#3--bridge-layer)
4. [Database](#4-️-database)
5. [Security](#5--security)
6. [Bot Architecture](#6--bot-architecture)
7. [Web Dashboard Architecture](#7--web-dashboard-architecture)
8. [Scraper Architecture](#8-️-scraper-architecture)
9. [Deployment](#9--deployment)
10. [Packages](#10--packages)
11. [AI Coding Rules](#11--ai-coding-rules)
12. [AI Assistant Architecture](#12--ai-assistant-architecture-v060)
13. [Open Questions](#-open-questions)

> **Note:** TOC links use emoji anchors — if a link doesn't jump correctly, navigate to the section manually.

---

## 1. 🗂️ Monorepo & File Structure

### מבנה הפרויקט

```
finance-bot/
├── apps/
│   ├── bot/          ← Telegram Bot (Telegraf)
│   ├── web/          ← Dashboard (Next.js App Router)
│   ├── scraper/      ← Israeli Bank Scraper (asher-mcp)
│   └── bridge/       ← Security Bridge Layer
├── packages/
│   ├── db/           ← Drizzle ORM + SQLite schema — shared across apps
│   ├── types/        ← Shared TypeScript types — cross-app contracts
│   └── utils/        ← Pure utility functions — no business logic
├── docker-compose.yml
├── .env.example
└── package.json      ← npm workspaces root
```

### חוק: מה נכנס ל-`packages/` לעומת ישיר ב-app

**נכנס ל-`packages/`** אם ולא רק אם:
- יותר מ-app אחד משתמש בקוד
- זהו contract (type, interface, schema) בין apps
- זוהי utility function טהורה (ללא תלות ב-app-specific logic)

**נשאר ב-app** אם:
- רק app אחד משתמש בו
- מכיל business logic ספציפי ל-app
- מכיל קריאות ל-API חיצוני (לא DB)

### חוקי מבנה קבצים לכל app

#### `apps/bot/src/`
```
handlers/       ← command + callback handlers בלבד. אפס business logic.
middleware/     ← Telegraf middleware (auth, logging, rate limiting)
services/       ← כל business logic של הbot
queries/        ← queries.ts — ועוד כל קריאה לDB מהbot
formatters/     ← formatters.ts — Markdown formatting בלבד
keyboards/      ← keyboards.ts — Telegram inline keyboards בלבד
notifications/  ← notifications.ts — פונקציות שמשלחות הודעות proactively
scheduler.ts    ← כל cron jobs. אין cron בשום מקום אחר ב-bot.
```

#### `apps/web/src/`
```
app/
  (dashboard)/      ← route groups לפי feature
    transactions/
    budgets/
    settings/
    accounts/
  api/              ← Route Handlers בלבד. כל API כאן.
    transactions/
    accounts/
    budgets/
    scrape/
components/
  ui/               ← shadcn/ui components — ללא logic
  features/         ← feature components (מכילים Zustand hooks)
  layouts/          ← layout components
lib/
  stores/           ← Zustand stores בלבד
  api/              ← fetch wrappers לAPI routes
  utils/            ← web-specific utilities
```

#### `apps/bridge/src/`
```
routes/         ← Express/Fastify route handlers
middleware/     ← auth, rate-limit, circuit-breaker
services/       ← scraping orchestration, cache, DB writes
cache/          ← in-memory cache layer (TTL logic)
circuit/        ← circuit breaker state machine
```

#### `apps/scraper/src/`
```
server.ts       ← MCP server entry point
tools/          ← MCP tools per bank provider
providers/      ← per-bank scraping implementation
types.ts        ← scraper-internal types only
```

### Naming Conventions

| סוג | Convention | דוגמה |
|-----|-----------|-------|
| קבצים | `camelCase.ts` | `budgetService.ts` |
| תיקיות | `kebab-case/` | `circuit-breaker/` |
| Exports | named exports בלבד | `export function getTransactions()` |
| Types | PascalCase | `TransactionRow`, `ScrapedAccount` |
| DB tables | `camelCase` (Drizzle) | `transactions`, `scrapeLogs` |
| DB columns | `camelCase` | `accountId`, `createdAt` |
| Env vars | `SCREAMING_SNAKE_CASE` | `ENCRYPTION_KEY`, `BOT_TOKEN` |
| Zustand stores | `use[Name]Store` | `useTransactionStore` |
| API routes | `/api/[resource]/[action]` | `/api/transactions/list` |

### חוק: איפה אסור לשים business logic

| מיקום | מותר | אסור |
|-------|------|------|
| `handlers/` | parse args, call service, format reply | DB access, bank calls, calculations |
| `components/` | render, call store/api | DB access, business rules |
| `formatters.ts` | string formatting | DB access, any async |
| `keyboards.ts` | build InlineKeyboard objects | any logic |
| `packages/utils/` | pure functions | imports מ-apps, side effects |

---

## 2. 🏛️ Application Architecture

### תקשורת בין Apps — תרשים מוחלט

```
Telegram User          Browser (Dashboard)
      ↓                       ↓
  apps/bot              apps/web
      ↓                  ↓ (API Routes only — /api/*)
  apps/bridge         packages/db
      ↓
  apps/scraper
      ↓
  Israeli Banks

packages/db ← [apps/bot, apps/bridge, apps/web API routes]
```

**חוק:** כל חץ הוא כיוון תקשורת מותר. כל תקשורת שאינה בתרשים — **אסורה**.

### Layers המחייבים לכל App

#### Bot
```
Telegram Update
  → middleware/ (auth check, rate limit)
  → handlers/ (parse, validate args)
  → services/ (business logic)
  → queries.ts (DB read/write)
  → packages/db (Drizzle)
```

#### Web
```
HTTP Request
  → API Route Handler (auth check)
  → Service function (business logic)
  → packages/db (Drizzle, read-only where possible)
```

#### Bridge
```
HTTP Request from Bot
  → middleware (auth: shared secret)
  → middleware (rate limiter: per credential)
  → middleware (circuit breaker)
  → cache check
  → service (orchestrate scraping)
  → apps/scraper (MCP protocol)
  → DB write (scrapeLogs + transactions)
  → response to Bot
```

### Anti-Patterns — מה אסור

| Anti-Pattern | במקום |
|-------------|-------|
| Handler קורא לDB ישירות | Handler → service → queries.ts |
| Component קורא לDB ישירות | Component → Zustand store → `/api/*` |
| Bot קורא לscraper ישירות | Bot → Bridge → Scraper |
| Scraper כותב לDB | Bridge כותב לDB בלבד |
| Business logic ב-formatter | business logic → service, formatter = strings only |
| `console.log` בכל מקום | structured logger (ראה Security §5) |

---

## 3. 🔐 Bridge Layer

> **⚠️ Status: Planned — v0.2.0.** This section describes the *intended* architecture. `apps/bridge/` does not exist yet. Do not write code for this layer until v0.2.0 development begins.

**תפקיד:** שומר הסף היחיד בין הbot לבנקים. כל scraping עובר כאן. אף אחד אחר לא מתקשר עם הscraper.

### מבנה פנימי

```
apps/bridge/src/
├── index.ts              ← entry point, server setup
├── routes/
│   ├── scrape.ts         ← POST /scrape — trigger scraping
│   └── health.ts         ← GET /health — liveness check
├── middleware/
│   ├── authMiddleware.ts  ← shared secret validation
│   ├── rateLimiter.ts     ← per-credential rate limiting
│   └── circuitBreaker.ts  ← circuit breaker per credential
├── services/
│   ├── scrapeService.ts   ← orchestrates full scraping flow
│   └── dbWriter.ts        ← כל כתיבות לDB מהbridge
├── cache/
│   └── scrapeCache.ts     ← in-memory TTL cache
└── circuit/
    └── circuitState.ts    ← state machine per credential
```

### Rate Limiting

**אסטרטגיה:** per credential (לא per user, לא global).

```typescript
// rateLimiter.ts — חוק:
const RATE_LIMIT = {
  maxRequests: 3,       // מקסימום 3 scrape לאותה credential
  windowMs: 60 * 60 * 1000, // בחלון של שעה
};
// אם חורגים: 429 + הודעת "נסה שוב בעוד X דקות" לbot
```

**סיבה:** בנקים ישראליים חוסמים IP לאחר requests מרובים — rate limiting מגן על הmissibility.

### Cache Layer

| נתון | TTL | מבוטל כאשר |
|------|-----|-----------|
| `transactions` (חודש נוכחי) | 4 שעות | scraping חדש הצליח |
| `transactions` (חודש קודם) | 24 שעות | לעולם לא מתבטל (immutable) |
| `accounts` (רשימת חשבונות) | 12 שעות | user מוסיף/מוחק account |
| `balances` | 1 שעה | scraping חדש הצליח |

```typescript
// scrapeCache.ts — interface חובה:
interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

function getCached<T>(key: string): T | null
function setCached<T>(key: string, data: T, ttlMs: number): void
function invalidate(pattern: string): void  // e.g. invalidate('transactions:*')
```

**חוק:** Cache key בנוי כ: `{type}:{credentialId}:{month}` — אין PII ב-cache key.

### Circuit Breaker

**State Machine לכל credential:**

```
CLOSED (רגיל) → [5 כשלונות ב-5 דקות] → OPEN (חסום)
OPEN           → [אחרי 15 דקות]        → HALF-OPEN (בדיקה)
HALF-OPEN      → [הצלחה]              → CLOSED
HALF-OPEN      → [כישלון]             → OPEN (reset timer)
```

```typescript
// circuitState.ts
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreaker {
  state: CircuitState;
  failureCount: number;
  lastFailureAt: number | null;
  openUntil: number | null;
}

const CIRCUIT_CONFIG = {
  failureThreshold: 5,
  windowMs: 5 * 60 * 1000,    // 5 דקות
  halfOpenAfterMs: 15 * 60 * 1000, // 15 דקות
};
```

**מה הbot מקבל כשה-circuit פתוח:**

```typescript
// response מ-bridge כשהcircuit OPEN:
{
  status: 'circuit_open',
  message: 'Bank connection temporarily unavailable',
  retryAfter: 900, // seconds
  cachedDataAvailable: boolean
}
```

הbot מציג: "⚠️ החיבור לבנק זמנית לא זמין. משתמש בנתונים מהזיכרון (עדכון אחרון: X שעות)."
אם אין cached data — "⚠️ שירות הבנק זמנית לא זמין. נסה שוב בעוד ~15 דקות."

### Auth: Bot → Bridge

**Shared Secret (HMAC).**

```typescript
// bridge מאמת כל request:
// Header: X-Bridge-Secret: <HMAC-SHA256(body, BRIDGE_SECRET)>

function validateBridgeRequest(req: Request): boolean {
  const secret = process.env.BRIDGE_SECRET;
  const signature = req.headers['x-bridge-secret'];
  const expected = createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

**חוק:** `BRIDGE_SECRET` ב-.env בלבד. לא בקוד, לא בlogs, לא ב-API responses.
**חוק:** Bridge מאזין רק על internal docker network — לא exposed לעולם החיצון.

### Retry Logic

```typescript
const RETRY_CONFIG = {
  attempts: 3,
  backoff: [2000, 5000, 15000], // ms — exponential-ish
  retryOn: ['NETWORK_ERROR', 'TIMEOUT', 'SCRAPER_UNAVAILABLE'],
  noRetryOn: ['INVALID_CREDENTIALS', 'BANK_BLOCKED', 'CIRCUIT_OPEN'],
};
```

### scrapeLogs — חובה בכל תרחיש

```typescript
// dbWriter.ts — נכתב תמיד, גם בכישלון:
type ScrapeLogStatus = 'success' | 'error' | 'partial' | 'circuit_open' | 'rate_limited' | 'cached';

interface ScrapeLog {
  credentialId: string;   // לא plaintext credential
  accountId: string | null;
  status: ScrapeLogStatus;
  transactionCount: number | null;
  errorCode: string | null;   // 'BANK_BLOCKED', 'TIMEOUT', וכו' — לא stack trace
  durationMs: number;
  cachedResult: boolean;
  createdAt: Date;
}
// NEVER log: credentials, ENCRYPTION_KEY, bank passwords, session tokens
```

### Security — מה Bridge לא עושה לעולם

- לא מחזיר credentials (אפילו masked) ב-response
- לא לוגג plaintext credentials בשום format
- לא מקבל requests מאף אחד מלבד bot (network policy)
- לא חושף endpoint לscraper (רק scraper מקבל קריאות מbridge — חד-כיווני)

---

## 4. 🗃️ Database

### מי רשאי לגשת לDB ישירות — רשימה סגורה

| App | גישה | סוג |
|-----|------|-----|
| `apps/bot` | ✅ | Read + Write (via queries.ts) |
| `apps/bridge` | ✅ | Write only (scrapeLogs, transactions) |
| `apps/web` | ✅ | Read only (via API routes → service) |
| `apps/scraper` | ❌ | **אסור לחלוטין** |

**חוק:** כל גישה לDB עוברת דרך `packages/db` (Drizzle). אין `better-sqlite3` ישיר בשום app.

### Schema הנוכחי

```typescript
// packages/db/src/schema.ts

export const credentials = sqliteTable('credentials', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),          // telegram userId (allowedUsers)
  bankId: text('bankId').notNull(),          // 'hapoalim' | 'leumi' | 'discount' | ...
  encryptedData: text('encryptedData').notNull(), // AES-256-GCM: iv:authTag:ciphertext
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  // future: tenantId text('tenantId') — hook for multi-tenant
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  credentialId: text('credentialId').notNull().references(() => credentials.id),
  accountNumber: text('accountNumber').notNull(),  // masked: '****1234'
  bankId: text('bankId').notNull(),
  accountType: text('accountType').notNull(),      // 'checking' | 'savings' | 'credit'
  currency: text('currency').notNull().default('ILS'),
  isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
  lastScrapedAt: integer('lastScrapedAt', { mode: 'timestamp' }),
  // future: tenantId text('tenantId')
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull().references(() => accounts.id),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('ILS'),
  category: text('category'),
  isRecurring: integer('isRecurring', { mode: 'boolean' }).notNull().default(false),
  metadata: text('metadata', { mode: 'json' }),   // raw scraper data — JSONified
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  // future: tenantId text('tenantId')
}, (t) => ({
  uniqueIdx: uniqueIndex('transactions_unique')
    .on(t.accountId, t.date, t.description, t.amount),
}));

export const allowedUsers = sqliteTable('allowedUsers', {
  id: text('id').primaryKey(),
  telegramId: text('telegramId').notNull().unique(),
  username: text('username'),
  role: text('role', { enum: ['viewer', 'admin'] }).notNull().default('viewer'),
  addedAt: integer('addedAt', { mode: 'timestamp' }).notNull(),
  // future: tenantId text('tenantId')
});

export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  category: text('category').notNull(),
  monthlyLimit: real('monthlyLimit').notNull(),
  alertThreshold: real('alertThreshold').notNull().default(0.8), // 0-1
  currency: text('currency').notNull().default('ILS'),
  isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
  // future: tenantId text('tenantId')
});

export const scrapeLogs = sqliteTable('scrapeLogs', {
  id: text('id').primaryKey(),
  credentialId: text('credentialId').notNull(),
  accountId: text('accountId'),
  status: text('status', {
    enum: ['success', 'error', 'partial', 'circuit_open', 'rate_limited', 'cached']
  }).notNull(),
  transactionCount: integer('transactionCount'),
  errorCode: text('errorCode'),     // enum string — NOT stack trace
  durationMs: integer('durationMs').notNull(),
  cachedResult: integer('cachedResult', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  // future: tenantId text('tenantId')
});
```

### חוקי Schema

**הוספת שדה חדש:**
1. הוסף לschema.ts עם `.default()` או nullable — **לעולם לא NOT NULL ללא default על טבלה קיימת**
2. הרץ `npm run db:generate` → קובץ migration נוצר ב-`drizzle/`
3. הרץ `npm run db:migrate` — בדוק שהmigration רץ בלי errors
4. עדכן types ב-`packages/types/`
5. עדכן `ARCHITECTURE.md` — Schema section

**אסור:**
- לשנות column type קיים ישירות (צור column חדש, migrate data, drop ישן)
- לשנות unique index בלי migration מפורשת
- להוסיף NOT NULL column ללא default על טבלה עם data

### Naming Conventions — DB

- **טבלאות:** `camelCase`, plural — `transactions`, `scrapeLogs`
- **שדות:** `camelCase` — `accountId`, `createdAt`, `isActive`
- **Indexes:** `{table}_{columns}_{type}` — `transactions_unique`, `accounts_credentialId_idx`
- **IDs:** `text`, UUID format — `crypto.randomUUID()` בלבד

### הכנה ל-Multi-Tenant (ללא שבירה)

כל טבלה מכילה comment: `// future: tenantId text('tenantId')`.
כשיגיע v2.0.0: הוספת `tenantId` כ-nullable תחילה → migrate data → NOT NULL.
**חוק:** אסור ליצור foreign key בין טבלאות שיש בהן tenant_id ללא `tenantId` על שניהן.

---

## 5. 🔐 Security

### Encryption — חוקים

**Algorithm:** AES-256-GCM בלבד. לא AES-CBC, לא RSA לdata, לא bcrypt לcredentials.

**Format:** `base64(iv):base64(authTag):base64(ciphertext)`

```typescript
// packages/utils/src/crypto.ts — הinterface הרשמי:
export function encrypt(plaintext: string, key: string): string
export function decrypt(ciphertext: string, key: string): string

// Usage — חוק:
// key תמיד מ-process.env.ENCRYPTION_KEY
// לעולם לא: encrypt(data, 'hardcoded-key')
// לעולם לא: encrypt(data, someVariable) בלי לוודא שהמשתנה בא מ-.env
```

**Key Management:**
- `ENCRYPTION_KEY` ב-`.env` בלבד
- לא עובר ב-API response
- לא נלוג
- אם הkey אבד — הdata אבד. אין key recovery. הsimplicity זה הsecurity.

### מה לא נשמר לעולם Plain Text — רשימה סגורה

| נתון | מה נשמר במקום |
|------|--------------|
| סיסמת בנק | `encrypt(password, ENCRYPTION_KEY)` |
| שם משתמש בנק | `encrypt(username, ENCRYPTION_KEY)` |
| OTP / session token | לא נשמר כלל — ephemeral בלבד |
| `ENCRYPTION_KEY` עצמו | `.env` בלבד, לא DB, לא קוד |
| `BOT_TOKEN` | `.env` בלבד |
| `BRIDGE_SECRET` | `.env` בלבד |

### מה לא מוחזר לעולם ב-API Response

| נתון | מה מוחזר במקום |
|------|--------------|
| `encryptedData` מטבלת `credentials` | לא מוחזר — אפילו לא encrypted |
| `ENCRYPTION_KEY` | לא מוחזר בשום תרחיש |
| מספר חשבון מלא | masked בלבד: `****1234` |
| OTP | לא נשמר, לא מוחזר |

### Auth Flow — Bot

```typescript
// middleware/authMiddleware.ts — Telegraf middleware:
// כל update בודק:
// 1. telegramId קיים ב-allowedUsers
// 2. role מתאים לפקודה (viewer vs admin)

bot.use(async (ctx, next) => {
  const telegramId = String(ctx.from?.id);
  const user = await getAllowedUser(telegramId);  // מ-queries.ts
  if (!user) return ctx.reply('⛔ אין לך הרשאה להשתמש בבוט זה.');
  ctx.state.user = user;  // מועבר לhandlers
  return next();
});
```

**חוק:** `ctx.state.user` קיים בכל handler — לא צריך לבדוק שוב. Middleware מטפל בזה.

**חוק:** Admin-only commands מסומנים מפורשות:
```typescript
bot.command('adduser', requireRole('admin'), addUserHandler);
```

### Auth Flow — Dashboard

**v0.x (כרגע):** Basic auth — username + password ב-.env.

**v1.0.0 (planned):**
```typescript
// JWT + refresh tokens:
// Access token: 15 דקות
// Refresh token: 7 ימים, httpOnly cookie
// כל API route: validateToken(req) — 401 אם expired
// Session data: userId, role — לעולם לא credentials
```

**חוק:** כל API route מוגן — גם בlocal, גם ב-development. אין unprotected routes.

### Logging Rules

**מותר ללוג:**
```typescript
// ✅ מותר:
logger.info({ action: 'scrape_completed', credentialId, transactionCount, durationMs });
logger.error({ action: 'scrape_failed', credentialId, errorCode: 'BANK_BLOCKED' });
logger.info({ action: 'user_command', telegramId, command: '/balance' });
```

**אסור ללוג לחלוטין:**
```typescript
// ❌ אסור:
logger.info({ password });           // credentials
logger.info({ encryptedData });      // גם encrypted — מיותר ומסוכן
logger.error(error.stack);           // stack trace עם data
logger.info({ body: req.body });     // body עלול להכיל credentials
logger.info(`User: ${username}, Pass: ${password}`);  // ברור למה לא
```

**חוק:** Logger הוא `structured` בלבד. `console.log` אסור בכל environments — development, production, test.

### Network Rules (Docker)

```yaml
# docker-compose.yml — network policy:
networks:
  internal:         # bot ↔ bridge
    internal: true
  external:         # bot ↔ telegram, web ↔ internet
    internal: false

services:
  bridge:
    networks: [internal]       # ← לא exposed לinternet
  bot:
    networks: [internal, external]
  web:
    networks: [external]       # dashboard — אין גישה לbridge
  scraper:
    networks: [internal]       # ← רק bridge מגיע אליו
```

---

## 6. 🤖 Bot Architecture

### מבנה Handler — חובה

**כל handler חייב לעקוב אחר הסדר הזה:**

```typescript
// handlers/balanceHandler.ts — template:
export async function balanceHandler(ctx: BotContext): Promise<void> {
  // 1. Validation — args, format
  const args = parseArgs(ctx.message?.text);
  if (!args.month) {
    return ctx.reply(formatError('נא לציין חודש: /balance 2024-01'));
  }

  // 2. Auth — role check (user כבר validated ב-middleware)
  const { user } = ctx.state;
  // (אם צריך role ספציפי מעבר לviewer הבסיסי — בדוק כאן)

  // 3. Service — business logic
  const balance = await getBalanceSummary(user.telegramId, args.month);

  // 4. Format — strings only
  const message = formatBalance(balance);

  // 5. Reply
  return ctx.reply(message, { parse_mode: 'Markdown' });
}
```

**חוק:** אפס קריאות לDB ישירות מhandler. אפס קריאות לbridge מhandler. הכל דרך service.

### הוספת Command חדש — Checklist

- [ ] קובץ handler ב-`handlers/`
- [ ] קובץ service ב-`services/` (אם business logic חדש)
- [ ] queries ב-`queries.ts` (אם צריך DB access חדש)
- [ ] formatter ב-`formatters.ts` (אם format חדש)
- [ ] רישום ב-bot setup: `bot.command('name', middleware, handler)`
- [ ] עדכון `docs/BOT_COMMANDS_REFERENCE.md`
- [ ] error handling לכל תרחיש כישלון
- [ ] unit test לservice function

### Error Handling — חוק

```typescript
// כל handler עטוף ב-try/catch ב-middleware רמה גלובלית:
bot.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    logger.error({ action: 'handler_error', errorCode: error.code ?? 'UNKNOWN' });
    await ctx.reply('❌ משהו השתבש. נסה שוב בעוד רגע.');
  }
});

// User רואה: הודעה ידידותית בעברית.
// Log מכיל: error code, action, telegramId — לא stack trace, לא data.
```

### `notifications.ts` לעומת `handlers/`

| `handlers/` | `notifications.ts` |
|------------|-------------------|
| מגיב ל-user action (command, callback) | שולח proactively (cron, trigger) |
| תמיד בcontexct של Telegram Update | קורא `bot.telegram.sendMessage(chatId, ...)` ישירות |
| `ctx.reply()` | `bot.telegram.sendMessage()` |
| דוגמה: `/balance` handler | דוגמה: budget alert, monthly report |

---

## 7. 🌐 Web Dashboard Architecture

### App Router Structure

```
app/
├── layout.tsx              ← root layout (auth check, providers)
├── (dashboard)/
│   ├── layout.tsx          ← dashboard shell (sidebar, header)
│   ├── page.tsx            ← redirect → /transactions
│   ├── transactions/
│   │   ├── page.tsx        ← Server Component (initial render)
│   │   └── TransactionsView.tsx ← Client Component (interactive)
│   ├── budgets/
│   ├── accounts/
│   └── settings/
└── api/
    ├── transactions/
    │   ├── list/route.ts
    │   └── export/route.ts
    ├── accounts/route.ts
    ├── budgets/route.ts
    └── scrape/route.ts
```

### API Routes — חוקים

```typescript
// app/api/transactions/list/route.ts — template:
export async function GET(req: Request): Promise<Response> {
  // 1. Auth
  const user = await validateSession(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Parse params
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');

  // 3. Validate
  if (!month || !isValidMonth(month)) {
    return Response.json({ error: 'Invalid month parameter' }, { status: 400 });
  }

  // 4. Service
  const transactions = await getTransactions({ userId: user.id, month });

  // 5. Response — consistent envelope:
  return Response.json({
    success: true,
    data: transactions,
    meta: { total: transactions.length }
  });
}

// Error response — תמיד:
// { success: false, error: 'Human-readable message', code: 'ERROR_CODE' }
```

**Naming:** `/api/[resource]/[action]` — `/api/transactions/list`, `/api/accounts/connect`

**חוק:** Server Components לא קוראים לDB ישירות — קוראים ל-`/api/*` routes בלבד.

### Zustand Store Structure

```typescript
// lib/stores/transactionStore.ts — template:
interface TransactionStore {
  // State
  transactions: Transaction[];
  selectedMonth: string;
  filters: TransactionFilters;
  isLoading: boolean;
  error: string | null;

  // Actions
  setMonth: (month: string) => void;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  fetchTransactions: () => Promise<void>;
  updateCategory: (id: string, category: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>()((set, get) => ({
  // implementation
}));
```

**חוק:** Store אחד לfeature אחד — `useTransactionStore`, `useBudgetStore`, `useAccountStore`.
**חוק:** Prop drilling מעל 2 רמות → Zustand store. אין exceptions.
**חוק:** Server state (fetch, cache, retry) → SWR או React Query. לא Zustand.

### Component Hierarchy

```
page.tsx (Server Component — layout, initial data fetch via API)
  └── FeatureView.tsx (Client Component — interactive, uses store)
       ├── FeatureHeader.tsx
       ├── FeatureList.tsx
       │    └── FeatureCard.tsx (ui/card)
       └── FeatureActions.tsx
            └── Button, Dialog (shadcn/ui)
```

**חוק:** `ui/` components — ללא business logic, ללא store imports.
**חוק:** `features/` components — מכילים store hooks, business display logic.
**חוק:** Dashboard = ממשק תפעולי מלא. כל פעולה שקיימת בbot קיימת גם בdashboard.

---

## 8. ⚙️ Scraper Architecture

**תפקיד בלעדי:** מקבל credentials בplaintext מה-bridge (פוענחו כבר שם) → מריץ scraping → מחזיר `ScrapedTransaction[]`.

**מה הscraper לא עושה לעולם:**
- לא כותב לDB
- לא מכיר את הbot
- לא מכיר את הbridge (מגיב לrequests, לא יוזם)
- לא שולח notifications
- לא מחזיר credentials בשום response

### Interface שBridge מצפה לו

```typescript
// packages/types/src/scraper.ts — contract מחייב:

export interface ScrapeRequest {
  credentialId: string;           // reference בלבד — לרישום ב-scrapeLogs
  // Bridge מפענח credentials לפני שליחה לscraper.
  // Scraper לא מחזיק ENCRYPTION_KEY ולא יודע שהdata היה מוצפן.
  // תקשורת bridge → scraper היא internal docker network בלבד.
  username: string;               // plaintext — decrypted by bridge before sending
  password: string;               // plaintext — decrypted by bridge before sending
  bankId: string;
  accountIds?: string[];          // optional: scrape specific accounts only
  fromDate: Date;
  toDate: Date;
}

export interface ScrapedTransaction {
  externalId: string;            // unique id מהבנק
  date: Date;
  description: string;
  amount: number;
  currency: string;
  type: 'debit' | 'credit';
  memo?: string;
}

export interface ScrapeResult {
  credentialId: string;
  accountId: string;
  status: 'success' | 'error' | 'partial';
  transactions: ScrapedTransaction[];
  errorCode?: string;            // 'INVALID_CREDENTIALS' | 'BANK_UNAVAILABLE' | 'TIMEOUT'
  scrapedAt: Date;
  durationMs: number;
}
```

**חוק:** Scraper מממש MCP Protocol. Bridge קורא לו דרך MCP — לא HTTP ישיר.

---

## 9. 🚀 Deployment

### Docker Services

```yaml
# docker-compose.yml
services:
  bot:
    build: ./apps/bot
    env_file: .env
    networks: [internal, external]
    depends_on: [bridge]
    restart: unless-stopped

  web:
    build: ./apps/web
    env_file: .env
    ports: ["3000:3000"]
    networks: [external]
    restart: unless-stopped

  bridge:
    build: ./apps/bridge
    env_file: .env
    networks: [internal]    # ← אין external exposure
    depends_on: [scraper]
    restart: unless-stopped

  scraper:
    build: ./apps/scraper
    env_file: .env
    networks: [internal]    # ← רק bridge מגיע אליו
    restart: unless-stopped

networks:
  internal:
    internal: true
  external: {}

volumes:
  db_data:
    driver: local
```

### Environment Variables — Template מלא

```bash
# .env.example — כל משתנה חובה מתועד:

# === Bot ===
BOT_TOKEN=                    # Telegram Bot Token (BotFather)
ADMIN_TELEGRAM_ID=            # Telegram ID של הadmin הראשי

# === Security ===
ENCRYPTION_KEY=               # 32 chars random — openssl rand -hex 16
BRIDGE_SECRET=                # 32 chars random — openssl rand -hex 16

# === Bridge ===
BRIDGE_URL=http://bridge:3001 # internal docker url — לא לשנות
BRIDGE_PORT=3001

# === Web Dashboard ===
DASHBOARD_PORT=3000
SESSION_SECRET=               # 32 chars random — openssl rand -hex 16
# v1.0.0: JWT_SECRET, REFRESH_TOKEN_SECRET

# === Database ===
DATABASE_PATH=./data/finance.db  # volume mount path

# === Scraper ===
SCRAPER_MCP_PORT=3002

# === Logging ===
LOG_LEVEL=info                # debug | info | warn | error
LOG_FORMAT=json               # json | pretty (dev only)

# === Feature Flags (v0.x) ===
ENABLE_AI_ASSISTANT=false     # v0.6.0+
```

**חוק:** `.env` לא נכנס לgit לעולם. `.env.example` חובה לעדכן עם כל env var חדש.

### Migration Path לCloud (v1.0.0)

| Component | v0.x (local) | v1.0.0 (cloud) |
|-----------|-------------|----------------|
| Database | SQLite file | PostgreSQL (managed) |
| Secrets | `.env` file | secrets manager (Doppler / AWS SSM) |
| Deployment | docker-compose | Docker on VPS / Railway / Render |
| HTTPS | לא (local) | חובה + auto-renew |
| Auth | basic auth | JWT + refresh tokens |
| Backup | manual | automated daily |

**חוק:** כל שינוי schema שיידרש למעבר SQLite → PostgreSQL יתועד ב-`ARCHITECTURE.md` מראש.

---

## 10. 📦 Packages

### `packages/db`

**נכנס:** Drizzle schema, migration runner, typed query helpers.

```typescript
// packages/db/src/index.ts — exports:
export { db } from './db';           // Drizzle instance
export * from './schema';            // all table definitions
export * from './migrations';        // runMigrations()
```

**לא נכנס:** business logic, API calls, formatters, app-specific queries.

**חוק:** `packages/db` לא מייבא מ-`apps/*`. אפס dependencies לאחד מה-apps.

### `packages/types`

**נכנס:** כל type שעובר בין apps — request/response shapes, domain models, enums.

```typescript
// packages/types/src/index.ts — דוגמאות:
export type { ScrapeRequest, ScrapeResult, ScrapedTransaction } from './scraper';
export type { BotUser, UserRole } from './user';
export type { TransactionRow, CategoryEnum } from './transaction';
export type { BridgeResponse, CircuitState } from './bridge';
```

**לא נכנס:** Drizzle schema types (אלו ב-`packages/db`), app-specific types.

### `packages/utils`

**נכנס:** Pure utility functions — crypto, date formatting, validation, parsers.

```typescript
// packages/utils/src/index.ts:
export { encrypt, decrypt } from './crypto';
export { formatAmount, formatDate, formatMonth } from './formatters';
export { isValidMonth, isValidTelegramId } from './validators';
export { generateId } from './id';
```

**לא נכנס:** DB access, API calls, Telegraf imports, Next.js imports, business logic.

### חוק תלויות — חד-כיווני

```
apps/bot    → packages/db, packages/types, packages/utils
apps/web    → packages/db, packages/types, packages/utils
apps/bridge → packages/db, packages/types, packages/utils
apps/scraper → packages/types (בלבד)

packages/db → (אין dependencies לpackages אחרים)
packages/types → (אין dependencies לpackages אחרים)
packages/utils → (אין dependencies לpackages אחרים)

❌ אסור: packages/* → apps/*
❌ אסור: packages/db → packages/utils
❌ אסור: apps/web → apps/bot
```

---

## 11. 🤖 AI CODING RULES

> **אתה AI שמוסיף קוד לפרויקט זה. הסעיף הזה מדבר אליך ישירות.**
> כל חוק כאן הוא blocking — לא suggestion. עצור ושאל לפני שאתה מפר חוק.

### לפני כל Feature — Mandatory Checklist

```
□ קראתי את הschema הרלוונטי ב-packages/db/src/schema.ts
□ חיפשתי ב-queries.ts אם הquery כבר קיים — לא כותב כפול
□ חיפשתי ב-packages/utils אם utility function כבר קיים
□ בדקתי ב-packages/types אם הtype כבר מוגדר
□ זיהיתי את הlayer שבו הקוד שייך (handler/service/query/db)
□ אם מוסיף npm package — יש comment עם נימוק ברור
```

### TypeScript — ללא פשרות

```typescript
// ❌ אסור — אפס יוצאים מהכלל:
const data: any = await fetch(url);
function process(input: any) {}

// ✅ חובה:
const data: unknown = await fetch(url);
if (!isTransactionArray(data)) throw new Error('Invalid response shape');
function process(input: TransactionRow) {}

// Type guards — חובה לdata חיצוני:
function isTransactionArray(data: unknown): data is TransactionRow[] {
  return Array.isArray(data) && data.every(isTransactionRow);
}
```

### DB Access — חוקים

```typescript
// ❌ אסור:
import Database from 'better-sqlite3';
const db = new Database('./finance.db');  // bypass ל-packages/db

// ✅ חובה:
import { db } from '@finance-bot/db';
const rows = await db.select().from(transactions).where(eq(transactions.accountId, id));
```

**חוק:** כל function שנוגעת בDB גרה ב-`queries.ts` של הapp, או ב-service שקורא לה.
**חוק:** Schema change = migration מיידית. אסור לשנות schema.ts ללא `npm run db:generate`.

### npm Packages — חוק

```typescript
// לפני כל `npm install X`:
// 1. האם packages/utils לא כבר עושה את זה?
// 2. האם node stdlib לא מספיק? (crypto, path, fs)
// 3. מה הsecurity track record של הpackage?
// אם מוסיפים — comment מחייב:

// package.json:
// "some-library": "^1.2.3",  // Added for: X functionality. Alternative considered: Y was too heavy.
```

### Handler Pattern — חובה

```typescript
// כל handler — בדיוק הסדר הזה:
export async function myHandler(ctx: BotContext): Promise<void> {
  // 1. Validate args
  // 2. Check permissions (אם מעבר לmiddleware הבסיסי)
  // 3. Call service (NOT db, NOT bridge directly)
  // 4. Format response (call formatter)
  // 5. Reply
}
// Handler שסוטה מהסדר הזה → refactor לפני PR.
```

### Logging — חוק

```typescript
// ❌ אסור:
console.log('user data:', user);
console.error(error);

// ✅ חובה — structured logger בלבד:
import { logger } from '../lib/logger';
logger.info({ action: 'balance_requested', telegramId: user.telegramId, month });
logger.error({ action: 'scrape_failed', credentialId, errorCode: error.code });
// NEVER log: password, encryptedData, ENCRYPTION_KEY, session tokens
```

### Credentials — חוק אדום

```typescript
// ❌ אסור בכל circumstances — אפס יוצאים מהכלל:
return res.json({ credential: encryptedData });   // אסור להחזיר
logger.info({ credential: encryptedData });        // אסור ללוג
throw new Error(`Invalid credential: ${password}`); // אסור ב-error message
```

### State Management — Web

```typescript
// ❌ אסור:
<ComponentA data={transactions} />  // prop drilling יותר מ-2 רמות
const [txs, setTxs] = useState([]);  // local state לdata שחוצה components

// ✅ חובה:
const { transactions } = useTransactionStore();  // Zustand לglobal state
const { data } = useSWR('/api/transactions/list', fetcher);  // SWR לserver state
```

### Tests — חוק

```typescript
// כל function ב-packages/* — חייבת unit test:
// packages/utils/src/crypto.ts → packages/utils/src/__tests__/crypto.test.ts
// packages/utils/src/validators.ts → packages/utils/src/__tests__/validators.test.ts

// Test file naming: [filename].test.ts
// Coverage target: 60%+ (מ-v0.5.0)
// ❌ אסור לskip coverage ב-packages/*
```

### סדר עדיפויות — לכל החלטה

```
1. Security   — credentials, encryption, auth
2. Correctness — הקוד עושה מה שהוא אמור לעשות
3. Performance — מהירות, caching, DB queries
4. Readability — קוד ברור, naming, structure
```

אם יש conflict בין שניים — הגבוה בסדר מנצח. תמיד.

---

## 12. 🧠 AI Assistant Architecture (v0.6.0+)

**זמינות:** v0.6.0 ואילך. לא קיים בv0.1.0–v0.5.0.
**חוק:** כל קוד AI assistant מגודר ב-feature flag: `ENABLE_AI_ASSISTANT=false` בdefault.

### Pluggable Provider Architecture

**עיקרון:** Provider אחד ב-.env. לא hardcoded. לא בקוד. החלפת provider = שינוי משתנה אחד.

```typescript
// packages/types/src/ai.ts — contract מחייב:

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIProvider {
  name: string;
  chat(messages: AIMessage[], opts?: AIRequestOptions): Promise<string>;
  isAvailable(): Promise<boolean>;  // health check לפני שימוש
}

export interface AIRequestOptions {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}
```

### Providers — מימוש

```
packages/utils/src/ai/
├── index.ts             ← createAIProvider(config) factory
├── providers/
│   ├── ollama.ts        ← local: Ollama (llama3, mistral, etc.)
│   ├── openai.ts        ← cloud: OpenAI GPT-4
│   ├── anthropic.ts     ← cloud: Anthropic Claude
│   └── gemini.ts        ← cloud: Google Gemini
└── types.ts             ← re-export from packages/types
```

```typescript
// packages/utils/src/ai/index.ts — factory:
export function createAIProvider(config: AIConfig): AIProvider {
  switch (config.provider) {
    case 'ollama':    return new OllamaProvider(config);
    case 'openai':    return new OpenAIProvider(config);
    case 'anthropic': return new AnthropicProvider(config);
    case 'gemini':    return new GeminiProvider(config);
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}
```

### Configuration — .env

```bash
# AI Assistant — v0.6.0+
ENABLE_AI_ASSISTANT=false         # true להפעלה

AI_PROVIDER=ollama                # ollama | openai | anthropic | gemini

# Ollama (local — default):
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3               # llama3 | mistral | phi3 | etc.

# OpenAI (אם AI_PROVIDER=openai):
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Anthropic (אם AI_PROVIDER=anthropic):
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-4-5-20251001   # haiku — low cost לuse-case זה

# Gemini (אם AI_PROVIDER=gemini):
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
```

**חוק:** `AI_PROVIDER=ollama` הוא ה-default המומלץ לv0.6.0 — local, private, אפס עלות.
**חוק:** כל cloud provider = נתוני FinanceIL-Bot יוצאים מהמכונה. יש לציין זאת בdocumentation בצורה ברורה.

### Data Access — מה AI רואה

```typescript
// apps/bot/src/services/aiService.ts
// AI מקבל context מסונן — לא raw DB rows:

interface AIFinanceContext {
  summary: {
    month: string;
    totalSpent: number;
    byCategory: Record<string, number>;
    budgetStatus: Record<string, { limit: number; spent: number }>;
  };
  recentTransactions: Array<{
    date: string;
    description: string;  // ✅ — merchant name
    amount: number;
    category: string;
    // ❌ לא נשלח: accountId, credentialId, id, metadata raw
  }>;
}
```

**חוק:** AI לא מקבל לעולם:
- `credentialId`, `accountId` (internal IDs)
- `encryptedData` (ברור)
- מספרי חשבון בנק (גם masked)
- raw `metadata` מהscraper

### Guardrails — חובה

```typescript
// apps/bot/src/services/aiService.ts

const SYSTEM_PROMPT = `
אתה עוזר פיננסי שיודע לענות על שאלות על הוצאות והכנסות של המשתמש.
אתה מספק מידע בלבד על עסקאות ותקציבים.
אתה לא נותן ייעוץ השקעות, לא ממליץ על מוצרים פיננסיים,
ולא מפרש מגמות שוק.
בכל תשובה הוסף: "המידע הוא לצורכי מעקב בלבד ואינו ייעוץ פיננסי."
`;
```

**חוק:** SYSTEM_PROMPT לא ניתן לדריסה על ידי user input.
**חוק:** כל response מה-AI מוצג עם disclaimer — לא optional, לא ניתן לכיבוי.

### שילוב ב-Bot

```typescript
// handlers/askHandler.ts
export async function askHandler(ctx: BotContext): Promise<void> {
  if (!process.env.ENABLE_AI_ASSISTANT) {
    return ctx.reply('🤖 AI assistant לא מופעל. הגדר ENABLE_AI_ASSISTANT=true ב-.env');
  }

  const question = ctx.message?.text?.replace('/ask', '').trim();
  if (!question) return ctx.reply('שאל שאלה: /ask כמה הוצאתי על אוכל?');

  await ctx.reply('⏳ חושב...');

  const context = await buildFinanceContext(ctx.state.user.telegramId);
  const answer = await aiService.ask(question, context);

  return ctx.reply(answer, { parse_mode: 'Markdown' });
}
```

---

## ❓ Open Questions

שאלות שטרם הוחלט עליהן — **אל תחליט לבד. שאל לפני שתכתוב קוד שתלוי בהן.**

### 1. Multi-Tenant DB Strategy (v2.0.0)

**השאלה:** כיצד ממשים tenant isolation ב-v2.0.0?

| אפשרות | יתרונות | חסרונות |
|--------|---------|---------|
| `tenantId` בכל row (current schema hooks) | פשוט, migration קל | row-level isolation בלבד, RLS מורכב |
| Schema נפרד לכל tenant (PostgreSQL) | isolation חזק, queries פשוטות | מורכבות infra, connection pooling |
| DB נפרד לכל tenant | isolation מקסימלי | expensive, ops מורכב |

**החלטה נדרשת לפני:** התחלת v2.0.0 development.
**כרגע:** schema.ts מוכן עם `// future: tenantId` hooks — לא מממשים עד ההחלטה.

---

### 2. Dashboard Auth v1.0.0

**השאלה:** מה מנגנון ה-auth המדויק לdashboard ב-v1.0.0?

| אפשרות | מתאים כי | בעייתי כי |
|--------|----------|----------|
| JWT + httpOnly cookies | standard, secure | refresh logic |
| better-auth (קיים בrepo) | כבר integrated | תלות בספרייה חיצונית |
| NextAuth.js | ecosystem support | overhead לuse-case פשוט |

**החלטה נדרשת לפני:** התחלת v1.0.0 auth implementation.
**כרגע:** basic auth מספיק לv0.x local use.
