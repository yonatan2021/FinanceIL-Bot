let registered = false;

export async function register() {
  if (registered) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureAdminUser } = await import("./lib/ensure-admin");
    await ensureAdminUser();
    registered = true; // only after success — allows hot-reload retry on failure
  }
}
