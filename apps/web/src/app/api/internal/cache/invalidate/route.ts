export const dynamic = "force-dynamic";

// Cache invalidation endpoint — called by the bot after mutations to signal that
// client-side SWR caches should be considered stale.
//
// NOTE: The web app reads directly from SQLite via server-side DB calls. There is
// no server-side cache layer (no Redis, no in-memory store) to clear here.
// Client-side SWR caches invalidate automatically on window focus / next navigation.
// This endpoint exists so the bot has a stable contract to call; when a Redis or
// server-side cache layer is added in a future version, the invalidation logic goes here.
//
// Auth: INTERNAL_API_SECRET Bearer token (bot→web server-to-server, not session).
// Method: POST — cache invalidation is a state-changing trigger, not a safe/idempotent read.

export async function POST(req: Request): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.INTERNAL_API_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json({ success: true, invalidatedAt: new Date().toISOString() });
}
