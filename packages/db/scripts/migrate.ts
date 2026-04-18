import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { db } from '../db.js'
import path from 'path'
import { fileURLToPath } from 'url'

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../drizzle'
)

console.log('[migrate] applying migrations from', migrationsFolder)
migrate(db, { migrationsFolder })
console.log('[migrate] done — database is encrypted and up to date')
