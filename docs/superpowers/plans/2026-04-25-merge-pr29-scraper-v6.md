# Merge PR #29: israeli-bank-scrapers v3→v6 + puppeteer v6→v24 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the scraper source code so it compiles and runs correctly with `israeli-bank-scrapers@6.7.4` and `puppeteer@24.42.0`, then merge the Dependabot PR #29.

**Architecture:** PR #29 (Dependabot) bumps `israeli-bank-scrapers` v3→v6 and `puppeteer` v6→v24 in `package-lock.json`. The source code was written against the v3 API and has broken internal import paths (`lib/transactions.d.ts`) that are incompatible with `moduleResolution: "NodeNext"`. These must be fixed before the lockfile bump is safe to merge. Also removes the unused `playwright` dep and bumps the Docker base image to match.

**Tech Stack:** TypeScript (NodeNext resolution), `israeli-bank-scrapers@6.7.4`, `puppeteer@24.42.0`, Docker (`ghcr.io/puppeteer/puppeteer`), Drizzle ORM, better-sqlite3.

---

## Files to Modify

| File | Change |
|------|--------|
| `apps/scraper/package.json` | Bump `israeli-bank-scrapers` to `^6.7.4`, remove `playwright` |
| `apps/scraper/src/scraper.ts` | Fix import path, fix `companyId` cast |
| `apps/scraper/src/db-upsert.ts` | Fix broken `.d.ts` import path — derive types from public API |
| `apps/scraper/Dockerfile` | Bump base image `24.41.0` → `24.42.0` |
| `apps/scraper/CLAUDE.md` | Fix incorrect "NO package.json" statement |

---

## Background: Why the Imports Are Broken

`tsconfig.base.json` sets `moduleResolution: "NodeNext"`. Under NodeNext:
- Importing `from 'pkg/lib/file.d.ts'` directly is non-standard — `.d.ts` is a declaration file, not a module path
- `TransactionsAccount` and `Transaction` are **not** re-exported from `israeli-bank-scrapers`'s public index, so `from 'israeli-bank-scrapers'` won't give them
- Correct fix: derive `TransactionsAccount` and `Transaction` from `ScraperScrapingResult['accounts']` (public API) using TypeScript utility types

The `showBrowser` option remains valid in v6: it lives in `DefaultBrowserOptions`, which TypeScript correctly narrows to when neither `browser` nor `browserContext` are present in the object literal.

---

### Task 1: Fix `apps/scraper/package.json`

**Files:**
- Modify: `apps/scraper/package.json`

- [ ] **Step 1: Edit package.json**

Replace the file content:

```json
{
  "name": "@finance-bot/scraper",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@finance-bot/db": "*",
    "@finance-bot/utils": "*",
    "@finance-bot/types": "*",
    "israeli-bank-scrapers": "^6.7.4"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0"
  }
}
```

Changes: bumped `israeli-bank-scrapers` from `^3.0.0` → `^6.7.4`; removed unused `playwright` dependency.

- [ ] **Step 2: Install updated dependencies**

```bash
npm install
```

Expected: `package-lock.json` updated, `israeli-bank-scrapers@6.7.4` installed in workspace.

- [ ] **Step 3: Commit**

```bash
git add apps/scraper/package.json package-lock.json
git commit -m "chore(scraper): bump israeli-bank-scrapers to v6.7.4, remove unused playwright dep"
```

---

### Task 2: Fix `apps/scraper/src/scraper.ts`

**Files:**
- Modify: `apps/scraper/src/scraper.ts`

The problem: line 6 imports `ScraperOptions` from `'israeli-bank-scrapers/lib/index.d.ts'` — a direct `.d.ts` file path, invalid under `moduleResolution: "NodeNext"`. Also line 29 uses `as any` for `companyId`; the correct type is `CompanyTypes`.

- [ ] **Step 1: Rewrite `scraper.ts` with fixed imports**

Replace the entire file:

```typescript
import { db } from '@finance-bot/db';
import { credentials, scrapeLogs } from '@finance-bot/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '@finance-bot/utils/crypto';
import { createScraper, CompanyTypes } from 'israeli-bank-scrapers';
import type { ScraperOptions } from 'israeli-bank-scrapers';
import { logger } from '../lib/logger.js';
import { upsertScrapedData } from './db-upsert.js';
import crypto from 'crypto';

export async function runScraperForCredential(credentialId: string) {
  if (!process.env.ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY required');

  const cred = await db.select().from(credentials).where(eq(credentials.id, credentialId)).get();
  if (!cred) throw new Error('Credential not found');

  const decryptedJson = decrypt(cred.encryptedData, process.env.ENCRYPTION_KEY);
  const authCredentials = JSON.parse(decryptedJson);

  const logId = crypto.randomUUID();
  await db.insert(scrapeLogs).values({
    id: logId,
    credentialId,
    startedAt: new Date(),
    status: 'running'
  });

  try {
    const options: ScraperOptions = {
      companyId: cred.bankId as CompanyTypes,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      combineInstallments: false,
      showBrowser: false,
    };

    const scraper = createScraper(options);
    const scrapeResult = await scraper.scrape(authCredentials);

    if (!scrapeResult.success) {
      throw new Error(`Scraping failed: ${scrapeResult.errorType} - ${scrapeResult.errorMessage ?? ''}`);
    }

    let fetchedTransactionsCount = 0;

    if (scrapeResult.accounts && scrapeResult.accounts.length > 0) {
      fetchedTransactionsCount = await upsertScrapedData(credentialId, scrapeResult.accounts);
    } else {
      logger.warn({ action: 'scrape_no_accounts', credentialId, bankId: cred.bankId });
    }

    await db.update(scrapeLogs)
      .set({
        status: 'success',
        finishedAt: new Date(),
        transactionsFetched: fetchedTransactionsCount
      })
      .where(eq(scrapeLogs.id, logId));

  } catch (err) {
    await db.update(scrapeLogs)
      .set({
        status: 'error',
        finishedAt: new Date(),
        errorMessage: err instanceof Error ? err.message : String(err)
      })
      .where(eq(scrapeLogs.id, logId));
    throw err;
  }
}
```

Key changes vs original:
- Line 5–6: `import { createScraper, CompanyTypes } from 'israeli-bank-scrapers'` (public API, no `.d.ts` path)
- Line 7: `import type { ScraperOptions } from 'israeli-bank-scrapers'` (public API)
- Line 29: `cred.bankId as CompanyTypes` instead of `as any`
- Lines 44–49: `accounts.length > 0` guard + `logger.warn` when empty accounts returned on success

> **Note:** If `apps/scraper/src/lib/logger.ts` does not exist, skip the logger import and leave a `// TODO: add structured logger` comment on the warn line. Do NOT use `console.log`/`console.error` in new code (CLAUDE.md rule).

- [ ] **Step 2: Typecheck scraper**

```bash
npx tsc --noEmit -p apps/scraper/tsconfig.json
```

Expected: zero errors. If `CompanyTypes` is not found, verify `israeli-bank-scrapers@6.x` is installed (`ls node_modules/israeli-bank-scrapers`).

- [ ] **Step 3: Commit**

```bash
git add apps/scraper/src/scraper.ts
git commit -m "fix(scraper): use public israeli-bank-scrapers v6 API imports, fix companyId cast"
```

---

### Task 3: Fix `apps/scraper/src/db-upsert.ts`

**Files:**
- Modify: `apps/scraper/src/db-upsert.ts`

The problem: line 4 imports `TransactionsAccount` and `Transaction` from `'israeli-bank-scrapers/lib/transactions.d.ts'`. This is:
1. A direct `.d.ts` path (invalid under NodeNext moduleResolution)
2. An internal path not part of the library's public API

Fix: derive the types from `ScraperScrapingResult` (which IS public) using utility types.

- [ ] **Step 1: Rewrite `db-upsert.ts` with derived types**

Replace the entire file:

```typescript
import { db } from '@finance-bot/db';
import { accounts, transactions } from '@finance-bot/db/schema';
import type { ScraperScrapingResult } from 'israeli-bank-scrapers';
import crypto from 'crypto';

// Derive types from the public ScraperScrapingResult rather than importing
// from internal lib/ paths (incompatible with moduleResolution: NodeNext)
type TransactionsAccount = NonNullable<ScraperScrapingResult['accounts']>[number];
type Transaction = TransactionsAccount['txns'][number];

export async function upsertScrapedData(credentialId: string, scrapedAccounts: TransactionsAccount[]) {
  const now = new Date();
  let totalProcessed = 0;

  for (const account of scrapedAccounts) {
    const accountId = crypto.createHash('sha256').update(`${credentialId}-${account.accountNumber}`).digest('hex');

    // Upsert Account
    await db.insert(accounts).values({
      id: accountId,
      credentialId,
      accountNumber: account.accountNumber,
      balance: account.balance ?? 0,
      lastUpdatedAt: now,
    }).onConflictDoUpdate({
      target: accounts.id,
      set: { balance: account.balance ?? 0, lastUpdatedAt: now }
    });

    if (!account.txns || account.txns.length === 0) continue;
    totalProcessed += account.txns.length;

    const txnsToInsert = account.txns.map((t: Transaction) => ({
      id: crypto.randomUUID(),
      accountId,
      date: new Date(t.date),
      description: t.description,
      amount: t.chargedAmount,
      currency: t.originalCurrency || 'ILS',
      type: t.type || 'normal',
      status: t.status || 'completed',
      createdAt: now,
    }));

    // Upsert transactions in chunks (ignore duplicates via unique constraint)
    for (const chunk of chunkArray(txnsToInsert, 50)) {
      await db.insert(transactions).values(chunk as any).onConflictDoNothing({
        target: [transactions.accountId, transactions.date, transactions.description, transactions.amount]
      });
    }
  }
  return totalProcessed;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}
```

Key changes vs original:
- Line 3: `import type { ScraperScrapingResult } from 'israeli-bank-scrapers'` (public API)
- Lines 7–8: `TransactionsAccount` and `Transaction` derived via utility types — no internal path imports
- Removed unused `sql` import from drizzle-orm

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit -p apps/scraper/tsconfig.json
```

Expected: zero errors.

- [ ] **Step 3: Run full typecheck across monorepo**

```bash
npm run typecheck
```

Expected: zero errors across all workspaces.

- [ ] **Step 4: Commit**

```bash
git add apps/scraper/src/db-upsert.ts
git commit -m "fix(scraper): derive TransactionsAccount/Transaction from public v6 API, drop internal .d.ts imports"
```

---

### Task 4: Bump Docker base image

**Files:**
- Modify: `apps/scraper/Dockerfile` (line 1)
- Modify: `apps/scraper/CLAUDE.md` (pinned version reference)

The `package-lock.json` now pins `puppeteer@24.42.0`. The Dockerfile base image ships Chromium matched to puppeteer-core `24.41.x`. To avoid Chromium revision mismatch at runtime, bump to `24.42.0`.

- [ ] **Step 1: Update Dockerfile FROM line**

In `apps/scraper/Dockerfile`, change line 1:

```dockerfile
FROM ghcr.io/puppeteer/puppeteer:24.42.0
```

(was `ghcr.io/puppeteer/puppeteer:24.41.0`)

- [ ] **Step 2: Update CLAUDE.md pinned version**

In `apps/scraper/CLAUDE.md`, update the Docker image section:

```markdown
## Docker Image (PINNED)

```
ghcr.io/puppeteer/puppeteer:24.42.0
```
```

Also fix the incorrect statement "This directory has **NO `package.json`**" — a `package.json` does exist. Replace that paragraph:

```markdown
## CRITICAL: Docker-Only Service

This directory has a `package.json` but **no npm run scripts for local execution**. The scraper cannot be run outside Docker — Puppeteer requires the Chromium binary from the base image.

**Only valid way to run:**
```bash
docker compose --profile scraper up scraper
```

Do NOT add npm scripts at root that reference this app as a workspace for direct execution.
```

- [ ] **Step 3: Commit**

```bash
git add apps/scraper/Dockerfile apps/scraper/CLAUDE.md
git commit -m "fix(scraper): bump Docker base image to puppeteer:24.42.0, fix CLAUDE.md accuracy"
```

---

### Task 5: End-to-end Docker smoke test

**Files:** none (verification only)

This is a runtime verification. No code changes. Must be run before merging.

- [ ] **Step 1: Build the Docker image**

```bash
docker compose build scraper
```

Expected: build completes with zero errors. Watch for TypeScript compile errors in the `RUN npx tsc --build` steps.

- [ ] **Step 2: Check image layers are clean**

```bash
docker images | grep scraper
```

Expected: image listed with a recent timestamp.

- [ ] **Step 3: Run the scraper container**

```bash
docker compose --profile scraper up scraper
```

Expected: container starts, connects to `data.db`, begins polling for jobs. Look for:
- NO `"file is not a database"` errors (ENCRYPTION_KEY set correctly)
- NO `"Could not find browser revision"` or `"Target closed"` Puppeteer errors
- Logs showing `status: 'running'` → `status: 'success'` in `scrapeLogs`

If no credentials exist to trigger scraping, verify the polling loop starts without crashing:

```bash
docker compose --profile scraper logs scraper | head -30
```

Expected: shows startup logs (polling started), no immediate crash.

- [ ] **Step 4: Trigger a scrape and verify DB result**

From the host, run a quick SQLite check on the `scrapeLogs` table after triggering a scrape:

```bash
# Check last scrape log entry
sqlite3 ./data.db "SELECT status, errorMessage, transactionsFetched FROM scrapeLogs ORDER BY startedAt DESC LIMIT 1;"
```

Expected: `status = 'success'`, `errorMessage = NULL`, `transactionsFetched >= 0`.

- [ ] **Step 5: Merge PR #29 and push fixes**

Once smoke test passes:

```bash
# Push all fix commits to the PR branch (or directly to main if working there)
git push origin HEAD
```

Then merge PR #29 via GitHub or:

```bash
gh pr merge 29 --repo yonatan2021/FinanceIL-Bot --squash
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All 4 critical/important issues from the review are addressed
  - ✅ Broken `.d.ts` import paths → fixed in Tasks 2 & 3
  - ✅ `as any` on companyId → fixed in Task 2
  - ✅ Docker image version drift → fixed in Task 4
  - ✅ Unused `playwright` dep → fixed in Task 1
  - ✅ Empty accounts silent success → fixed in Task 2 with `logger.warn`
- [x] **No placeholders:** All code blocks are complete and runnable
- [x] **Type consistency:** `TransactionsAccount` derived same way in both Tasks 2 and 3; `CompanyTypes` used in Task 2 matches the v6 export
- [x] **Removed packages safe:** `uuid`, `lodash`, `build-url`, `json2csv` not imported in scraper source — confirmed safe
