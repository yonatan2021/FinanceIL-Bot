import { db } from '@finance-bot/db';
import { credentials, scrapeLogs } from '@finance-bot/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '@finance-bot/utils/crypto';
import { createScraper } from 'israeli-bank-scrapers';
import type { ScraperOptions } from 'israeli-bank-scrapers';
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
      companyId: cred.bankId as any,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      combineInstallments: false,
      showBrowser: false,
    };

    const scraper = createScraper(options);
    const scrapeResult = await scraper.scrape(authCredentials);

    if (!scrapeResult.success) {
      throw new Error(`Scraping failed: ${scrapeResult.errorType} - ${scrapeResult.errorMessage || ''}`);
    }

    let fetchedTransactionsCount = 0;

    // Process accounts and transactions
    if (scrapeResult.accounts) {
      await upsertScrapedData(credentialId, scrapeResult.accounts);
      // 'transactionsFetched' strictly tracks the number of raw transactions returned by the scraper
      for (const acc of scrapeResult.accounts) {
        fetchedTransactionsCount += acc.txns?.length || 0;
      }
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
