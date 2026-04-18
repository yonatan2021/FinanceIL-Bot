import Database from 'better-sqlite3-multiple-ciphers';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ENCRYPTION NOTE: ENCRYPTION_KEY serves two distinct purposes:
//   1. DB-level (here): SQLite file is fully encrypted via better-sqlite3-multiple-ciphers.
//   2. Field-level (packages/utils/crypto.ts): individual sensitive fields (e.g. credentials.encryptedData)
//      are AES-256-GCM encrypted before being stored. Both mechanisms use the same env var.

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL env var is required');
}

// Walk up from __dirname until we find the root package.json with "workspaces".
// This works regardless of whether the code runs from source (packages/db/) or
// compiled output (packages/db/dist/), so DATABASE_URL relative paths always
// resolve to the monorepo root.
function findMonorepoRoot(dir: string): string {
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { workspaces?: unknown };
      if (pkg.workspaces) return dir;
    } catch { /* continue walking */ }
  }
  const parent = path.dirname(dir);
  if (parent === dir) throw new Error('Could not find monorepo root');
  return findMonorepoRoot(parent);
}

const rawPath = process.env.DATABASE_URL.replace(/^file:/, '');
const monorepoRoot = findMonorepoRoot(path.dirname(fileURLToPath(import.meta.url)));
const dbPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(monorepoRoot, rawPath);
const sqlite = new Database(dbPath);

sqlite.pragma('journal_mode=WAL');
sqlite.pragma('foreign_keys=ON');

if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}
sqlite.pragma(`key="${process.env.ENCRYPTION_KEY}"`);

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
