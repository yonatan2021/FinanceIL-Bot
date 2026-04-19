import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoist mocks and chainMock via vi.hoisted so they are available in the vi.mock factory
const {
  mockAll,
  mockGet,
  mockLimit,
  mockWhere,
  mockOrderBy,
  mockFrom,
  mockSelect,
  mockSelectDistinct,
  mockLeftJoin,
  mockOffset,
  mockPrepare,
  chainMock,
} = vi.hoisted(() => {
  const mockAll = vi.fn().mockReturnValue([]);
  const mockGet = vi.fn().mockReturnValue(undefined);
  const mockLimit = vi.fn();
  const mockWhere = vi.fn();
  const mockOrderBy = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockSelectDistinct = vi.fn();
  const mockLeftJoin = vi.fn();
  const mockOffset = vi.fn();

  // prepare() returns an object with .all() and .get() so module-level prepared statements work
  const preparedMock: any = { all: mockAll, get: mockGet };
  const mockPrepare = vi.fn().mockReturnValue(preparedMock);

  const chainMock: any = {
    from: mockFrom,
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    offset: mockOffset,
    leftJoin: mockLeftJoin,
    all: mockAll,
    get: mockGet,
    prepare: mockPrepare,
  };

  // Wire all chain methods to return chainMock immediately (needed at module load time)
  mockFrom.mockReturnValue(chainMock);
  mockWhere.mockReturnValue(chainMock);
  mockOrderBy.mockReturnValue(chainMock);
  mockLimit.mockReturnValue(chainMock);
  mockOffset.mockReturnValue(chainMock);
  mockLeftJoin.mockReturnValue(chainMock);
  mockSelect.mockReturnValue(chainMock);
  mockSelectDistinct.mockReturnValue(chainMock);

  return { mockAll, mockGet, mockLimit, mockWhere, mockOrderBy, mockFrom, mockSelect, mockSelectDistinct, mockLeftJoin, mockOffset, mockPrepare, chainMock };
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
  mockOffset.mockReturnValue(chainMock);
  mockLeftJoin.mockReturnValue(chainMock);
  mockAll.mockReturnValue([]);
  mockGet.mockReturnValue(undefined);
  mockSelect.mockReturnValue(chainMock);
  mockSelectDistinct.mockReturnValue(chainMock);
  mockPrepare.mockReturnValue({ all: mockAll, get: mockGet });
});

import { searchTransactions, getBudgetCategories, getAllCategories, computeBudgetAlertCount } from '../queries.js';

describe('searchTransactions', () => {
  it('applies limit when provided', () => {
    searchTransactions({ limit: 5 });
    expect(mockLimit).toHaveBeenCalledWith(5);
    expect(mockAll).toHaveBeenCalled();
  });

  it('applies default limit (500) when no limit provided', () => {
    searchTransactions({});
    expect(mockLimit).toHaveBeenCalledWith(500);
  });

  it('applies limit: 0 (undefined check, not falsy check)', () => {
    searchTransactions({ limit: 0 });
    expect(mockLimit).toHaveBeenCalledWith(1);
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

describe('computeBudgetAlertCount', () => {
  const budget = (overrides: Partial<{ categoryName: string; monthlyLimit: number; alertThreshold: number | null }> = {}) => ({
    categoryName: 'מזון',
    monthlyLimit: 1000,
    alertThreshold: 0.8,
    ...overrides,
  });

  it('returns 0 when no budgets', () => {
    expect(computeBudgetAlertCount([], {})).toBe(0);
  });

  it('returns 0 when spending is below threshold', () => {
    const spending = { מזון: 700 };
    expect(computeBudgetAlertCount([budget()], spending)).toBe(0);
  });

  it('returns 1 when spending exactly meets threshold (>=)', () => {
    const spending = { מזון: 800 }; // 800/1000 = 0.8 exactly
    expect(computeBudgetAlertCount([budget()], spending)).toBe(1);
  });

  it('returns 1 when spending exceeds threshold', () => {
    const spending = { מזון: 950 };
    expect(computeBudgetAlertCount([budget()], spending)).toBe(1);
  });

  it('defaults alertThreshold to 0.8 when null', () => {
    const spending = { מזון: 800 };
    expect(computeBudgetAlertCount([budget({ alertThreshold: null })], spending)).toBe(1);
  });

  it('skips budgets with monthlyLimit === 0 (division-by-zero guard)', () => {
    const spending = { מזון: 999 };
    expect(computeBudgetAlertCount([budget({ monthlyLimit: 0 })], spending)).toBe(0);
  });

  it('counts categories with no transactions as 0 spending (no alert)', () => {
    expect(computeBudgetAlertCount([budget()], {})).toBe(0);
  });

  it('counts multiple exceeded budgets correctly', () => {
    const budgets = [
      budget({ categoryName: 'מזון', monthlyLimit: 1000, alertThreshold: 0.8 }),
      budget({ categoryName: 'בידור', monthlyLimit: 500, alertThreshold: 0.8 }),
      budget({ categoryName: 'ביגוד', monthlyLimit: 200, alertThreshold: 0.8 }),
    ];
    const spending = { מזון: 900, בידור: 100, ביגוד: 190 }; // מזון + ביגוד exceeded
    expect(computeBudgetAlertCount(budgets, spending)).toBe(2);
  });
});
