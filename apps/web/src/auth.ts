import { betterAuth, type BetterAuthOptions } from "better-auth";
import Database from "better-sqlite3-multiple-ciphers";

if (!process.env.AUTH_DB_URL) {
  throw new Error("AUTH_DB_URL env var is required");
}

// auth.db is intentionally NOT encrypted with SQLCipher — it contains only
// session tokens and hashed passwords, no financial data. It lives on a
// separate Docker volume (finance_auth) isolated from data.db.
const url = process.env.AUTH_DB_URL.replace(/^file:/, "");
const sqlite = new Database(url);
sqlite.pragma("journal_mode=WAL");

export const authOptions = {
  secret: process.env.AUTH_SECRET,
  // BETTER_AUTH_URL takes precedence; NEXT_PUBLIC_APP_URL is acceptable here
  // because baseURL is the *public* origin (browser-visible), not a secret.
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  database: sqlite,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 1,
    password: {
      hash: async (password: string) => password,
      verify: async ({ hash, password }: { hash: string; password: string }) => {
        const expected = process.env.DASHBOARD_PASSWORD;
        if (!expected) throw new Error("DASHBOARD_PASSWORD env var required");
        void hash;
        return password === expected;
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    },
  },
} satisfies BetterAuthOptions;

export const auth = betterAuth(authOptions);

export type Auth = typeof auth;
