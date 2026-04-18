import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '../db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../drizzle'
);

try {
  migrate(db, { migrationsFolder });
  process.stdout.write('[migrate] done — database is encrypted and up to date\n');
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`[migrate] failed: ${msg}\n`);
  process.exit(1);
}
