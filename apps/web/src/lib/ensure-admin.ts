import { getMigrations } from "better-auth/db";
import { auth } from "@/auth";

export async function ensureAdminUser(): Promise<void> {
  if (!process.env.DASHBOARD_PASSWORD) {
    throw new Error("DASHBOARD_PASSWORD env var is required");
  }
  if (!process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET env var is required");
  }

  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();

  try {
    await auth.api.signUpEmail({
      body: {
        email: "admin@local.dev",
        password: process.env.DASHBOARD_PASSWORD,
        name: "מנהל",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('already exists') && !msg.includes('UNIQUE')) {
      console.error('[ensure-admin] seed failed:', msg);
    }
  }
}
