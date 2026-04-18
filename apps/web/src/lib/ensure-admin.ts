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
        email: "admin@local",
        password: process.env.DASHBOARD_PASSWORD,
        name: "מנהל",
      },
    });
  } catch {
    // User already exists — expected on every restart after first run. Safe to ignore.
  }
}
