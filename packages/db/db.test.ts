import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';

const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

vi.mock('better-sqlite3-multiple-ciphers', () => {
  const MockDatabase = vi.fn();
  MockDatabase.prototype.pragma = vi.fn();
  return { default: MockDatabase };
});

vi.mock('drizzle-orm/better-sqlite3', () => ({
  drizzle: vi.fn().mockReturnValue({}),
}));

describe('DATABASE_URL path resolution', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
    delete process.env.DATABASE_URL;
  });

  it('resolves file: URI to monorepo root, not CWD', async () => {
    process.env.DATABASE_URL = 'file:./data.db';

    await import('./db.js');

    const { default: DatabaseMock } = await import('better-sqlite3-multiple-ciphers') as unknown as {
      default: ReturnType<typeof vi.fn>;
    };

    expect(DatabaseMock).toHaveBeenCalledOnce();
    const calledWith: string = DatabaseMock.mock.calls[0][0];
    expect(calledWith).toBe(path.join(monorepoRoot, 'data.db'));
    expect(calledWith).not.toContain('file:');
    expect(path.isAbsolute(calledWith)).toBe(true);
  });

  it('passes through absolute DATABASE_URL unchanged', async () => {
    process.env.DATABASE_URL = '/absolute/path/custom.db';

    await import('./db.js');

    const { default: DatabaseMock } = await import('better-sqlite3-multiple-ciphers') as unknown as {
      default: ReturnType<typeof vi.fn>;
    };

    expect(DatabaseMock).toHaveBeenCalledOnce();
    expect(DatabaseMock.mock.calls[0][0]).toBe('/absolute/path/custom.db');
  });
});
