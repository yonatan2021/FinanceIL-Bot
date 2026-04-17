import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@finance-bot/db",
    "@finance-bot/utils",
    "better-sqlite3-multiple-ciphers",
    "better-auth",
    "drizzle-orm",
  ],
};

export default nextConfig;
