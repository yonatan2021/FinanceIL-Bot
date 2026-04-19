export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TTLCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (entry === undefined) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (entry === undefined) return false;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (ttlMs <= 0) throw new Error(`TTLCache.set: ttlMs must be positive, got ${ttlMs}`);
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  clear(): void {
    this.store.clear();
  }
}

export const queryCache = new TTLCache();

export const CACHE_KEYS = {
  BALANCES: 'balances',
  TRANSACTIONS_CURRENT: 'transactions_current',
  BUDGETS: 'budgets',
  USERS: 'users',
  ADMIN_USERS: 'admin_users',
  SCRAPE_LOG: 'scrape_log',
} as const;

export const CACHE_TTLS: Record<keyof typeof CACHE_KEYS, number> = {
  BALANCES: 10 * 60 * 1_000,
  TRANSACTIONS_CURRENT: 4 * 60 * 60 * 1_000,
  BUDGETS: 10 * 60 * 1_000,
  USERS: 10 * 60 * 1_000,
  ADMIN_USERS: 10 * 60 * 1_000,
  SCRAPE_LOG: 5 * 60 * 1_000,
} as const;
