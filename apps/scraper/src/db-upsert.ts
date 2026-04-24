import { db } from '@finance-bot/db';
import { accounts, transactions } from '@finance-bot/db/schema';
import { sql } from 'drizzle-orm';
import type { TransactionsAccount, Transaction } from 'israeli-bank-scrapers/lib/transactions.d.ts';
import crypto from 'crypto';

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

    // Prepare transactions based on explicit israeli-bank-scrapers Transaction types
    const txnsToInsert = account.txns.map((t: Transaction) => ({
      id: crypto.randomUUID(),
      accountId,
      date: new Date(t.date),
      description: t.description,
      amount: t.chargedAmount,
      currency: t.originalCurrency || 'ILS',
      // Ensure fallbacks match the DB schema constraints if scraper data is malformed
      type: t.type || 'normal',
      status: t.status || 'completed',
      createdAt: now,
    }));

    // Upsert transactions (ignore duplicates based on unique constraint)
    for (const chunk of chunkArray(txnsToInsert, 50)) {
      await db.insert(transactions).values(chunk as any).onConflictDoNothing({
        target: [transactions.accountId, transactions.date, transactions.description, transactions.amount]
      });
    }
  }
  return totalProcessed;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );
}
