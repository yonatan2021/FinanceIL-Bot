import { betterAuth } from "better-auth";
import Database from "better-sqlite3-multiple-ciphers";

const url = (process.env.AUTH_DB_URL ?? "").replace(/^file:/, "") || "auth.db";
const sqlite = new Database(url);
sqlite.pragma("journal_mode=WAL");

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET,
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
});

export type Auth = typeof auth;
