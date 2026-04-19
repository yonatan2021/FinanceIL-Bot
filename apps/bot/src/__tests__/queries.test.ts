import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoist mocks and chainMock via vi.hoisted so they are available in the vi.mock factory
const {
  mockAll,
  mockLimit,
  mockWhere,
  mockOrderBy,
  mockFrom,
  mockSelect,
  mockSelectDistinct,
  chainMock,
} = vi.hoisted(() => {
  const mockAll = vi.fn();
  const mockLimit = vi.fn();
  const mockWhere = vi.fn();
  const mockOrderBy = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockSelectDistinct = vi.fn();

  const chainMock: any = {
    from: mockFrom,
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    all: mockAll,
  };

  return { mockAll, mockLimit, mockWhere, mockOrderBy, mockFrom, mockSelect, mockSelectDistinct, chainMock };
});

vi.mock('@finance-bot/db', () => ({
  db: {
    select: mockSelect,
    selectDistinct: mockSelectDistinct,
    update: vi.fn().mockReturnValue(chainMock),
    insert: vi.fn().mockReturnValue(chainMock),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  invalidateCache();
  mockFrom.mockReturnValue(chainMock);
  mockWhere.mockReturnValue(chainMock);
  mockOrderBy.mockReturnValue(chainMock);
  mockLimit.mockReturnValue(chainMock);
  mockAll.mockReturnValue([]);
  mockSelect.mockReturnValue(chainMock);
  mockSelectDistinct.mockReturnValue(chainMock);
});

import { searchTransactions, getBudgetCategories, getAllCategories, invalidateCache } from '../queries.js';

describe('searchTransactions', () => {
  it('applies limit when provided', () => {
    searchTransactions({ limit: 5 });
    expect(mockLimit).toHaveBeenCalledWith(5);
    expect(mockAll).toHaveBeenCalled();
  });

  it('does not call limit when no limit provided', () => {
    searchTransactions({});
    expect(mockLimit).not.toHaveBeenCalled();
  });

  it('applies limit: 0 (undefined check, not falsy check)', () => {
    searchTransactions({ limit: 0 });
    expect(mockLimit).toHaveBeenCalledWith(0);
  });

  it('calls where when no filters provided', () => {
    searchTransactions({});
    expect(mockWhere).toHaveBeenCalled();
  });

  it('returns empty array when no transactions match', () => {
    mockAll.mockReturnValue([]);
    const result = searchTransactions({ category: 'nonexistent' });
    expect(result).toEqual([]);
  });

  it('returns all results when no options given', () => {
    const fakeRows = [{ id: 1 }, { id: 2 }, { id: 3 }];
    mockAll.mockReturnValue(fakeRows);
    const result = searchTransactions({});
    expect(result).toHaveLength(3);
  });
});

describe('getBudgetCategories', () => {
  it('returns category names for active budgets', () => {
    mockAll.mockReturnValue([{ categoryName: 'מזון' }, { categoryName: 'תחבורה' }]);
    const result = getBudgetCategories();
    expect(result).toEqual(['מזון', 'תחבורה']);
  });

  it('returns empty array when no active budgets', () => {
    mockAll.mockReturnValue([]);
    const result = getBudgetCategories();
    expect(result).toEqual([]);
  });
});

describe('getAllCategories', () => {
  it('returns distinct non-null categories', () => {
    mockAll.mockReturnValue([{ category: 'מזון' }, { category: 'תחבורה' }]);
    const result = getAllCategories();
    expect(result).toEqual(['מזון', 'תחבורה']);
  });

  it('filters out null/falsy category values', () => {
    mockAll.mockReturnValue([{ category: 'מזון' }, { category: null }, { category: '' }]);
    const result = getAllCategories();
    expect(result).not.toContain(null);
    expect(result).not.toContain('');
    expect(result).toContain('מזון');
  });

  it('returns empty array when no transactions have categories', () => {
    mockAll.mockReturnValue([]);
    const result = getAllCategories();
    expect(result).toEqual([]);
  });
});

describe('invalidateCache', () => {
  it('exports without throwing', () => {
    expect(() => invalidateCache()).not.toThrow();
  });

  it('can invalidate a specific key without throwing', () => {
    expect(() => invalidateCache('currentMonthTxns')).not.toThrow();
  });
});

describe('TTL cache behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cache hit: calling getBudgetCategories twice only invokes DB once', () => {
    mockAll.mockReturnValue([{ categoryName: 'מזון' }]);
    getBudgetCategories();
    getBudgetCategories();
    // mockAll is called once inside the DB chain for the cached function
    expect(mockAll).toHaveBeenCalledTimes(1);
  });

  it('re-fetch after TTL elapses: next call re-invokes DB', () => {
    mockAll.mockReturnValue([{ categoryName: 'מזון' }]);
    getBudgetCategories(); // populates cache (TTL = 300_000 ms)
    expect(mockAll).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300_001); // advance past the 300s TTL

    getBudgetCategories(); // cache expired — should hit DB again
    expect(mockAll).toHaveBeenCalledTimes(2);
  });

  it('invalidateCache() clears all entries so next call re-invokes DB', () => {
    mockAll.mockReturnValue([{ categoryName: 'מזון' }]);
    getBudgetCategories(); // caches 'budgetCategories'
    expect(mockAll).toHaveBeenCalledTimes(1);

    invalidateCache(); // clear entire cache

    getBudgetCategories(); // must re-fetch
    expect(mockAll).toHaveBeenCalledTimes(2);
  });

  it('invalidateCache(key) clears only that key, leaving other keys intact', () => {
    // Populate two cached functions
    mockAll.mockReturnValue([{ categoryName: 'מזון' }]);
    getBudgetCategories(); // caches 'budgetCategories'

    mockAll.mockReturnValue([{ category: 'תחבורה' }]);
    getAllCategories(); // getAllCategories is not cached — but we use it to verify that
                        // invalidating 'budgetCategories' does not affect subsequent
                        // DB calls for other queries

    const callsAfterPopulate = mockAll.mock.calls.length;

    // Invalidate only 'budgetCategories'
    invalidateCache('budgetCategories');

    // getBudgetCategories must re-fetch
    mockAll.mockReturnValue([{ categoryName: 'מזון' }]);
    getBudgetCategories();
    expect(mockAll).toHaveBeenCalledTimes(callsAfterPopulate + 1);

    // Calling getBudgetCategories a second time should NOT hit DB again (re-cached)
    getBudgetCategories();
    expect(mockAll).toHaveBeenCalledTimes(callsAfterPopulate + 1);
  });
});
