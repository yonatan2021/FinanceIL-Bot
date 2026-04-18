import Database from 'better-sqlite3-multiple-ciphers';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

// ENCRYPTION NOTE: ENCRYPTION_KEY serves two distinct purposes:
//   1. DB-level (here): SQLite file is fully encrypted via better-sqlite3-multiple-ciphers.
//   2. Field-level (packages/utils/crypto.ts): individual sensitive fields (e.g. credentials.encryptedData)
//      are AES-256-GCM encrypted before being stored. Both mechanisms use the same env var.

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL env var is required');
}

const sqlite = new Database(process.env.DATABASE_URL);

sqlite.pragma('journal_mode=WAL');
sqlite.pragma('foreign_keys=ON');

if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}
sqlite.pragma(`key="${process.env.ENCRYPTION_KEY}"`);

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
