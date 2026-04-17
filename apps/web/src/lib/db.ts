/**
 * Lazy db accessor for apps/web.
 *
 * packages/db initializes SQLite eagerly at module scope (throws if DATABASE_URL
 * is missing). Next.js Turbopack bundles the package inline and evaluates it
 * during "collecting page data" at build time, before DATABASE_URL is set.
 *
 * This module defers the actual db import until the first call to getDb(),
 * which only happens inside request handlers at runtime when DATABASE_URL
 * is available.
 *
 * All apps/web routes and pages should import getDb from "@/lib/db" instead of
 * directly from "@finance-bot/db".
 */

import type { DB } from "@finance-bot/db";

let _dbPromise: Promise<DB> | undefined;

function loadDb(): Promise<DB> {
  if (!_dbPromise) {
    _dbPromise = import("@finance-bot/db")
      .then((mod) => mod.db as DB)
      .catch(() => {
        throw new Error("Database unavailable");
      });
  }
  return _dbPromise;
}

/**
 * Async accessor — use this inside route handlers and server components.
 * Example:
 *   const db = await getDb();
 *   const rows = await db.select().from(table);
 */
export function getDb(): Promise<DB> {
  return loadDb();
}
