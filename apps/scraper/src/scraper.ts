import { db } from '@finance-bot/db';
import { credentials, scrapeLogs } from '@finance-bot/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '@finance-bot/utils/crypto';
import { createScraper, CompanyTypes } from 'israeli-bank-scrapers';
import type { ScraperCredentials, ScraperOptions } from 'israeli-bank-scrapers';
import { upsertScrapedData } from './db-upsert.js';
import crypto from 'crypto';

type ScraperErrorCode = 'INVALID_CREDENTIALS' | 'BANK_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';

function isScraperCredentials(v: unknown): v is ScraperCredentials {
  return typeof v === 'object' && v !== null && 'password' in v && typeof (v as Record<string, unknown>).password === 'string';
}

function toErrorCode(err: unknown): ScraperErrorCode {
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes('INVALID_PASSWORD') || msg.includes('CHANGE_PASSWORD') || msg.includes('ACCOUNT_BLOCKED')) {
      return 'INVALID_CREDENTIALS';
    }
    if (msg.includes('TIMEOUT')) return 'TIMEOUT';
    if (msg.includes('TWO_FACTOR_RETRIEVER_MISSING') || msg.includes('GENERIC') || msg.includes('GENERAL_ERROR')) {
      return 'BANK_UNAVAILABLE';
    }
  }
  return 'UNKNOWN';
}

export async function runScraperForCredential(credentialId: string) {
  if (!process.env.ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY required');

  const cred = await db.select().from(credentials).where(eq(credentials.id, credentialId)).get();
  if (!cred) throw new Error('Credential not found');

  const decryptedJson = decrypt(cred.encryptedData, process.env.ENCRYPTION_KEY);
  const authCredentials: unknown = JSON.parse(decryptedJson);
  if (!isScraperCredentials(authCredentials)) {
    throw new Error('Decrypted credential has unexpected shape');
  }

  const logId = crypto.randomUUID();
  await db.insert(scrapeLogs).values({
    id: logId,
    credentialId,
    startedAt: new Date(),
    status: 'running'
  });

  try {
    const validCompanyIds = Object.values(CompanyTypes) as string[];
    if (!validCompanyIds.includes(cred.bankId)) {
      throw new Error(`Unknown bankId: ${cred.bankId}`);
    }
    const companyId = cred.bankId as CompanyTypes;

    const options: ScraperOptions = {
      companyId,
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
    }
    // TODO: add structured logger warn when accounts is empty on success

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
        errorMessage: toErrorCode(err)
      })
      .where(eq(scrapeLogs.id, logId));
    throw err;
  }
}
