import { describe, it, expect, vi, afterEach } from 'vitest';
import { TTLCache, queryCache, CACHE_KEYS, CACHE_TTLS } from '../cache.js';

describe('TTLCache', () => {
  afterEach(() => {
    vi.useRealTimers();
    queryCache.clear();
  });

  it('returns undefined for a missing key', () => {
    const cache = new TTLCache();
    expect(cache.get('missing')).toBeUndefined();
  });

  it('returns the value when within TTL', () => {
    const cache = new TTLCache();
    cache.set('k', [1, 2, 3], 10_000);
    expect(cache.get<number[]>('k')).toEqual([1, 2, 3]);
  });

  it('returns undefined after TTL expires', () => {
    vi.useFakeTimers();
    const cache = new TTLCache();
    cache.set('k', 'hello', 1_000);
    vi.advanceTimersByTime(1_001);
    expect(cache.get('k')).toBeUndefined();
  });

  it('delete removes a key', () => {
    const cache = new TTLCache();
    cache.set('k', 42, 10_000);
    cache.delete('k');
    expect(cache.get('k')).toBeUndefined();
  });

  it('invalidatePrefix removes matching keys only', () => {
    const cache = new TTLCache();
    cache.set('txn:jan', 1, 10_000);
    cache.set('txn:feb', 2, 10_000);
    cache.set('budget:active', 3, 10_000);
    cache.invalidatePrefix('txn:');
    expect(cache.get('txn:jan')).toBeUndefined();
    expect(cache.get('txn:feb')).toBeUndefined();
    expect(cache.get<number>('budget:active')).toBe(3);
  });

  it('clear empties all entries', () => {
    const cache = new TTLCache();
    cache.set('a', 1, 10_000);
    cache.set('b', 2, 10_000);
    cache.clear();
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
  });

  it('expired entry is lazily deleted on get', () => {
    vi.useFakeTimers();
    const cache = new TTLCache();
    cache.set('k', 'val', 500);
    vi.advanceTimersByTime(600);
    cache.get('k'); // triggers lazy delete
    cache.set('k', 'new', 10_000);
    expect(cache.get('k')).toBe('new');
  });

  it('queryCache is a singleton (same instance re-exported)', () => {
    expect(queryCache).toBeInstanceOf(TTLCache);
  });

  it('CACHE_KEYS has expected shape', () => {
    expect(CACHE_KEYS).toMatchObject({
      BALANCES: expect.any(String),
      TRANSACTIONS_CURRENT: expect.any(String),
      BUDGETS: expect.any(String),
      USERS: expect.any(String),
      ADMIN_USERS: expect.any(String),
      SCRAPE_LOG: expect.any(String),
    });
  });

  it('CACHE_TTLS has positive numeric values', () => {
    for (const val of Object.values(CACHE_TTLS)) {
      expect(val).toBeGreaterThan(0);
    }
  });

  it('returns undefined at the exact expiry instant', () => {
    vi.useFakeTimers();
    const cache = new TTLCache();
    cache.set('k', 'val', 1_000);
    vi.advanceTimersByTime(1_000); // exactly at expiry
    expect(cache.get('k')).toBeUndefined();
  });
});

describe('TTLCache - undefined value caching', () => {
  it('caches undefined values and distinguishes from cache miss via has()', () => {
    const cache = new TTLCache();
    cache.set('k', undefined, 10_000);
    expect(cache.has('k')).toBe(true);
    expect(cache.get('k')).toBeUndefined();
  });

  it('has() returns false for missing key', () => {
    const cache = new TTLCache();
    expect(cache.has('missing')).toBe(false);
  });

  it('has() returns false after TTL expires', () => {
    vi.useFakeTimers();
    const cache = new TTLCache();
    cache.set('k', 'v', 1_000);
    vi.advanceTimersByTime(1_001);
    expect(cache.has('k')).toBe(false);
    vi.useRealTimers();
  });
});

describe('TTLCache - set guard', () => {
  it('throws when ttlMs is 0', () => {
    const cache = new TTLCache();
    expect(() => cache.set('k', 'v', 0)).toThrow('ttlMs must be positive');
  });

  it('throws when ttlMs is negative', () => {
    const cache = new TTLCache();
    expect(() => cache.set('k', 'v', -1)).toThrow('ttlMs must be positive');
  });

  it('overwrites existing key with new value', () => {
    const cache = new TTLCache();
    cache.set('k', 'old', 10_000);
    cache.set('k', 'new', 10_000);
    expect(cache.get('k')).toBe('new');
  });
});
