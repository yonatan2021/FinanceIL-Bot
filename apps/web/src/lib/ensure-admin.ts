import { auth } from "@/auth";

export async function ensureAdminUser(): Promise<void> {
  if (!process.env.DASHBOARD_PASSWORD) {
    throw new Error("DASHBOARD_PASSWORD env var is required");
  }
  if (!process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET env var is required");
  }

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
    // Duplicate user on every restart after first run — expected and safe to ignore.
    if (!msg.toLowerCase().includes("already exists") && !msg.toLowerCase().includes("unique")) {
      console.error("[ensure-admin] unexpected seed failure:", msg);
      throw err;
    }
  }
}
