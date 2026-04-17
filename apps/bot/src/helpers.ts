import type { Transaction } from '@finance-bot/types';

export function buildSpending(txns: Transaction[]): Record<string, number> {
  const spending: Record<string, number> = {};
  for (const t of txns) {
    const cat = t.category ?? 'ללא קטגוריה';
    spending[cat] = (spending[cat] ?? 0) + t.amount;
  }
  return spending;
}
