let registered = false;

export async function register() {
  if (registered) return;
  registered = true;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureAdminUser } = await import("./lib/ensure-admin");
    await ensureAdminUser();
  }
}
