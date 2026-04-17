# 💾 Database Schema — הפניה מלאה

SQLite database עם הצפנה dual-level (DB + fields).

---

## 📊 Schema Overview

```
┌─────────────────────────────────────────────────┐
│           DATABASE TABLES                        │
├─────────────────────────────────────────────────┤
│ credentials (בנקים מוצפנים)                      │
│   ├─ accounts (חשבונות)                          │
│   │  └─ transactions (עסקאות)                    │
│ allowedUsers (משתמשים)                          │
│ budgets (תקציב)                                  │
│ scrapeLogs (היסטוריה)                           │
└─────────────────────────────────────────────────┘
```

---

## 1️⃣ `credentials` — פרטי בנק (מוצפנים)

שמירת תאי הכניסה לבנקים.

| Field | Type | Nullable | Note |
|-------|------|----------|------|
| `id` | TEXT | ✗ | Primary Key. UUID. |
| `bankId` | TEXT | ✗ | מזהה בנק (e.g., "leumi"). |
| `displayName` | TEXT | ✗ | שם להצגה (e.g., "בנק ישראל"). |
| `encryptedData` | TEXT | ✗ | **Encrypted** AES-256-GCM. Base64. Contains: `{ username, password }`. |
| `status` | TEXT | ✓ | "active" / "inactive". Default: "active". |
| `lastScrapedAt` | TIMESTAMP | ✓ | מתי בדקנו בפעם האחרונה. |

**Example:**
```sql
INSERT INTO credentials VALUES (
  'cred_123',
  'leumi',
  'בנק ישראל',
  'U2FsdGVkX1...[base64-encrypted]',
  'active',
  '2026-04-17 08:30:00'
);
```

**Relationships:**
- accounts → credentialId (1:N)

---

## 2️⃣ `accounts` — חשבונות בנקאיים

חשבונות פתוחים בכל בנק.

| Field | Type | Nullable | Note |
|-------|------|----------|------|
| `id` | TEXT | ✗ | Primary Key. UUID. |
| `credentialId` | TEXT | ✗ | Foreign Key → credentials. |
| `accountNumber` | TEXT | ✗ | מספר חשבון בנקאי. |
| `balance` | REAL | ✗ | יתרה עדכנית. |
| `lastUpdatedAt` | TIMESTAMP | ✓ | מתי עדכנו בפעם האחרונה. |

**Example:**
```sql
INSERT INTO accounts VALUES (
  'acc_456',
  'cred_123',
  '123456789',
  15250.00,
  '2026-04-17 09:15:00'
);
```

**Relationships:**
- credentials ← credentialId
- transactions → accountId (1:N)

---

## 3️⃣ `transactions` — עסקאות

כל עסקה על כל חשבון.

| Field | Type | Nullable | Note |
|-------|------|----------|------|
| `id` | TEXT | ✗ | Primary Key. UUID. |
| `accountId` | TEXT | ✗ | Foreign Key → accounts. |
| `date` | TIMESTAMP | ✗ | תאריך העסקה. |
| `description` | TEXT | ✗ | תיאור (e.g., "קרדיט מרכז"). |
| `amount` | REAL | ✗ | סכום (ערך מוחלט). |
| `currency` | TEXT | ✗ | "ILS" / "USD" / etc. Default: "ILS". |
| `type` | TEXT | ✗ | "debit" / "credit". |
| `category` | TEXT | ✓ | קטגוריה (e.g., "אוכל"). |
| `status` | TEXT | ✗ | "completed" / "pending" / "failed". Default: "completed". |
| `createdAt` | TIMESTAMP | ✗ | מתי שמרנו את זה. |

**Unique Constraint:**
```sql
UNIQUE(accountId, date, description, amount)
```
מניעת כפילויות עסקאות.

**Example:**
```sql
INSERT INTO transactions VALUES (
  'txn_001',
  'acc_456',
  '2026-04-17 14:30:00',
  'קרדיט מרכז',
  350.00,
  'ILS',
  'debit',
  'קניות',
  'completed',
  '2026-04-17 15:00:00'
);
```

**Relationships:**
- accounts ← accountId

---

## 4️⃣ `allowedUsers` — משתמשים מורשים

רשימת משתמשים שיכולים להשתמש בבוט ב-dashboard.

| Field | Type | Nullable | Note |
|-------|------|----------|------|
| `id` | TEXT | ✗ | Primary Key. UUID. |
| `telegramId` | TEXT | ✗ | Unique. Telegram user ID. |
| `name` | TEXT | ✓ | שם המשתמש. |
| `role` | TEXT | ✗ | "admin" / "viewer". Default: "viewer". |
| `isActive` | BOOLEAN | ✗ | Is user allowed? Default: true. |
| `addedBy` | TEXT | ✓ | אדמין שהוסיף את המשתמש. |
| `createdAt` | TIMESTAMP | ✗ | מתי נוצר. |
| `lastSeenAt` | TIMESTAMP | ✓ | מתי היה פעיל בפעם האחרונה. |

**Example:**
```sql
INSERT INTO allowedUsers VALUES (
  'user_123',
  '123456789',
  'Yonatan',
  'admin',
  true,
  'system',
  '2026-03-01 00:00:00',
  '2026-04-17 15:00:00'
);
```

**Roles:**
- **admin**: גישה מלאה (הוסף משתמשים, הפעל סקרייפר, הצג הכל)
- **viewer**: גישה קריאה בלבד (יתרות, עסקאות, סיכום)

---

## 5️⃣ `budgets` — תקציב חודשי

הגדר תקציבים לכל קטגוריה.

| Field | Type | Nullable | Note |
|-------|------|----------|------|
| `id` | TEXT | ✗ | Primary Key. UUID. |
| `categoryName` | TEXT | ✗ | קטגוריה (e.g., "אוכל"). |
| `monthlyLimit` | REAL | ✗ | הגבלה חודשית. |
| `period` | TEXT | ✗ | "monthly" / "weekly" / "yearly". Default: "monthly". |
| `alertThreshold` | REAL | ✗ | 0.8 = התראה ב-80%. Default: 0.8. |
| `isActive` | BOOLEAN | ✗ | Is budget active? Default: true. |
| `createdAt` | TIMESTAMP | ✗ | מתי נוצר. |

**Example:**
```sql
INSERT INTO budgets VALUES (
  'budget_001',
  'אוכל',
  1500.00,
  'monthly',
  0.8,
  true,
  '2026-04-01 00:00:00'
);
```

**Logic:**
```
Spent = sum(transactions.amount) for category in current month
Alert = Spent >= monthlyLimit * alertThreshold
```

---

## 6️⃣ `scrapeLogs` — היסטוריה

רישום כל ריצה של הסקרייפר.

| Field | Type | Nullable | Note |
|-------|------|----------|------|
| `id` | TEXT | ✗ | Primary Key. UUID. |
| `credentialId` | TEXT | ✓ | Foreign Key → credentials (אם ישים). |
| `startedAt` | TIMESTAMP | ✗ | מתי התחיל. |
| `finishedAt` | TIMESTAMP | ✓ | מתי סיים. |
| `transactionsFetched` | INTEGER | ✗ | כמה עסקאות הובאו. Default: 0. |
| `status` | TEXT | ✗ | "success" / "error" / "partial". |
| `errorMessage` | TEXT | ✓ | תיאור שגיאה (אם נכשלה). |

**Example:**
```sql
INSERT INTO scrapeLogs VALUES (
  'log_001',
  'cred_123',
  '2026-04-17 08:00:00',
  '2026-04-17 08:15:00',
  42,
  'success',
  NULL
);
```

**Status Values:**
- **success** - הכל עבד
- **error** - נכשל לגמרי
- **partial** - חלק מהעסקאות הובאו

---

## 🔐 Encryption

### Dual-Layer Encryption

**Layer 1: Database Encryption**
- SQLite בעצמה מוצפנת עם `better-sqlite3-multiple-ciphers`
- Key: `ENCRYPTION_KEY` משתנה סביבה
- All data at rest is encrypted

**Layer 2: Field Encryption**
- `credentials.encryptedData` — מוצפן עם AES-256-GCM
- ראה `packages/utils/crypto.ts` לפרטים
- Only username/password are encrypted

### לא Encrypted (לעת עתה)
- `transactions` — גם בשכבה 1, לא צריך יותר
- `accounts.balance` — גם בשכבה 1
- `budgets` — לא חשוב

---

## 📋 Indices (Performance)

**Primary Keys:**
```sql
credentials(id)
accounts(id)
transactions(id)
allowedUsers(id)
budgets(id)
scrapeLogs(id)
```

**Unique Indices:**
```sql
allowedUsers(telegramId)           -- One user per Telegram ID
transactions(account, date, desc, amount) -- Prevent duplicates
```

**Recommended (TBD):**
```sql
CREATE INDEX idx_transactions_account_date ON transactions(accountId, date);
CREATE INDEX idx_accounts_credential ON accounts(credentialId);
```

---

## 🔄 WAL Mode (Concurrency)

Database uses `PRAGMA journal_mode=WAL` for concurrent access:

```sql
PRAGMA journal_mode=WAL;
```

זה מאפשר:
- Bot reads while web writes
- Multiple processes access DB safely
- No "database is locked" errors

---

## 📈 Data Volume & Growth

**Typical:**
- 2-3 credentials (בנקים)
- 5-10 accounts (חשבונות)
- 100-500 transactions per month
- 3-10 budgets

**Scaling:**
- Current SQLite handles millions of rows
- If reaches 100+ million transactions → consider PostgreSQL

---

## 🛠️ Common Queries

### Get all transactions for a month
```sql
SELECT * FROM transactions
WHERE accountId = ? AND date >= ? AND date < ?
ORDER BY date DESC;
```

### Get account balance + recent transactions
```sql
SELECT a.*, t.* FROM accounts a
LEFT JOIN transactions t ON a.id = t.accountId
WHERE a.id = ?
ORDER BY t.date DESC
LIMIT 10;
```

### Check budget status
```sql
SELECT b.*, SUM(t.amount) as spent
FROM budgets b
LEFT JOIN transactions t ON t.category = b.categoryName
  AND MONTH(t.date) = MONTH(CURRENT_DATE)
GROUP BY b.id;
```

---

## 🧹 Data Maintenance

### Backup Database
```bash
cp data.db data.db.backup
```

### View Database (Drizzle Studio)
```bash
npm run db:studio
```

### Export to CSV
```bash
# Manually via Studio or:
SELECT * FROM transactions INTO OUTFILE 'export.csv';
```

---

## ⚠️ Important Rules

1. **Never use `drizzle-kit push`** — Always generate + migrate
2. **ENCRYPTION_KEY is critical** — Losing it = data lost forever
3. **WAL mode must stay ON** — Or "database is locked" errors
4. **Backup regularly** — Especially before major changes

---

**Last Updated**: April 2026  
**ORM**: Drizzle  
**Database**: SQLite (with encryption)  
**Mode**: WAL (Write-Ahead Logging)
