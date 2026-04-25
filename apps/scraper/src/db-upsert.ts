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
