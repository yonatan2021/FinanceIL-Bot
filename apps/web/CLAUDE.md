# apps/web — Next.js 16 Dashboard

@../../.claude/rules/security.md
@../../.claude/rules/web-patterns.md

## Stack

- Next.js 16.2.4, App Router, Turbopack (dev)
- Tailwind CSS v4 + shadcn/ui (Radix primitives, `components.json` config)
- better-auth for session management (email+password, single admin user)
- react-hook-form 7.x + Zod v4 for form validation
- Drizzle ORM via `@finance-bot/db` (server-only — see security section above)

## Route Structure

```
src/app/
  (dashboard)/           ← authenticated layout group
    page.tsx             ← dashboard root
    banks/
    bot/                 ← Telegram bot management
      page.tsx           ← bot overview
      activity/
      logs/
      messages/
      scheduler/
      settings/
      users/
    budgets/
    categories/          ← transaction category management (v0.2.0)
    logs/
    transactions/
    users/
  api/
    auth/[...all]/       ← better-auth handler (GET+POST → toNextJsHandler)
    accounts/
    bot/
      broadcast/
      notify/[userId]/
      status/
    budgets/
    credentials/
    health/              ← GET → {status, timestamp, version}
    scrape/
    scrape-logs/
    statistics/summary/
    transactions/
    users/
  login/
  layout.tsx
```

## API Route Conventions

Every API route must have:
1. `export const dynamic = "force-dynamic"` — prevents static caching
2. Session auth before any data: `const session = await auth.api.getSession({ headers: await headers() })`; return 401 if null
3. Zod validation on POST/PUT request bodies
4. Response envelope: `{ success: true, data: ... }` or `{ error: "..." }`
5. Never return `encryptedData` field — apply `safeCredential()` to strip it

Routes under `api/bot/` are **dashboard management routes** (controlling the bot from the UI) — they use session auth like all other routes. The bot service does NOT call back into the web API. If future bot→web server-to-server routes are needed, place them under `api/internal/` and authenticate via `Authorization: Bearer ${INTERNAL_API_SECRET}` (not session).

## Auth Flow

1. `src/auth.ts` — configures better-auth with custom password verifier (checks against `DASHBOARD_PASSWORD` env var — no bcrypt)
2. `src/lib/ensure-admin.ts` — seeds `admin@local.dev` on web startup (called from `instrumentation.ts`)
3. `src/lib/auth-client.ts` — better-auth client for React components

## shadcn/ui Usage

All UI components are in `src/components/ui/`. To add a new component:
```bash
npx shadcn@latest add <component-name>
```
Never manually copy Radix UI primitives — always go through `shadcn`.

## Key Files

- `src/auth.ts` — better-auth configuration + custom password verifier
- `src/lib/db.ts` — creates Drizzle DB connection for web (server-only, uses `@finance-bot/db`)
- `src/lib/ensure-admin.ts` — seeds admin@local.dev on startup (called from `instrumentation.ts`)
- `src/lib/auth-client.ts` — better-auth client for React components

## Dev Command

```bash
just dev-web    # web only
just dev        # web + bot together
```

## TypeScript Config

`tsconfig.json` extends `../../tsconfig.base.json`. Path alias: `@/*` → `./src/*`.
