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

// Validate ENCRYPTION_KEY before opening the DB file.
// If we open the file first and the key is missing, an empty unencrypted file
// is created on disk before the error is thrown.
if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}
if (!/^[0-9a-fA-F]{32,}$/.test(process.env.ENCRYPTION_KEY)) {
  throw new Error('ENCRYPTION_KEY must be a hex string of at least 32 characters (no quotes allowed)');
}

// Walk up from __dirname until we find the root package.json with "workspaces".
// Works from both source (packages/db/) and compiled output (packages/db/dist/).
function findMonorepoRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      let pkg: { workspaces?: unknown };
      try {
        pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { workspaces?: unknown };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to parse ${pkgPath}: ${msg}`);
      }
      if (pkg.workspaces) return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`Could not find monorepo root (searched from ${startDir})`);
    dir = parent;
  }
}

const rawPath = process.env.DATABASE_URL.replace(/^file:/, '');
// Only resolve monorepo root for relative paths — Docker always uses absolute paths.
const dbPath = path.isAbsolute(rawPath)
  ? rawPath
  : path.resolve(findMonorepoRoot(path.dirname(fileURLToPath(import.meta.url))), rawPath);

const sqlite = new Database(dbPath);

// CRITICAL: key pragma MUST be set BEFORE any other pragmas or SQL operations.
// SQLCipher requires this order; setting WAL first creates an unencrypted file.
sqlite.pragma(`key="${process.env.ENCRYPTION_KEY}"`);

// Now set other pragmas after encryption is configured.
sqlite.pragma('journal_mode=WAL');
sqlite.pragma('foreign_keys=ON');

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
export const client: InstanceType<typeof Database> = sqlite; // raw better-sqlite3 instance for BEGIN IMMEDIATE transactions
