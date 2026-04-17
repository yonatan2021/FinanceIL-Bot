import { betterAuth } from "better-auth";
import Database from "better-sqlite3-multiple-ciphers";

let _auth: ReturnType<typeof createAuth> | null = null;

function createAuth() {
  const url = process.env.AUTH_DB_URL?.replace("file:", "") ?? "auth.db";
  const sqlite = new Database(url);
  sqlite.pragma("journal_mode=WAL");

  return betterAuth({
    secret: process.env.AUTH_SECRET,
    database: {
      db: sqlite,
      type: "sqlite",
    },
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
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
}

export const auth = new Proxy({} as ReturnType<typeof createAuth>, {
  get(_target, prop: string | symbol) {
    if (!_auth) {
      _auth = createAuth();
    }
    return (_auth as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type Auth = ReturnType<typeof createAuth>;
