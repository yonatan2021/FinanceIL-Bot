# apps/bot — Telegram Bot (grammy)

## Stack

- grammy 1.42.0 + @grammyjs/parse-mode
- node-cron 4.2.1 for scheduled messages
- tsx 4.x for dev (hot reload via `tsx watch`) and production
- ESM module (`"type": "module"` in package.json)

## Entry Point (`src/index.ts`)

Startup order:
1. Load env from `../../.env`
2. Create `Bot<BotContext>` with `BOT_TOKEN`
3. Configure default `parse_mode: 'MarkdownV2'` via middleware
4. Register middleware in order: **auth → menu → data → admin → search**
5. Register error handler (sends Hebrew error reply)
6. Call `startScheduler(bot)` to register cron jobs
7. Call `bot.start()` — **polling mode, no webhook needed**

## Source Structure

```
src/
  handlers/
    admin.ts      ← admin-only: user management, broadcast
    data.ts       ← financial data: accounts, transactions, budgets
    menu.ts       ← /start, /menu, /help, /status
    search.ts     ← transaction search by text
  middleware/
    auth.ts       ← allowedUsers check, updates lastSeenAt
  scheduler.ts    ← cron job registration
  queries.ts      ← all DB queries (Drizzle, synchronous)
  formatters.ts   ← Hebrew message formatting utilities
  keyboards.ts    ← InlineKeyboard builders
  helpers.ts      ← buildSpending() and other logic helpers
  notifications.ts ← outbound message helpers
  types.ts        ← BotContext type extension
```

## BotContext

```typescript
interface BotContext extends ConversationFlavor<Context>, SessionFlavor<SessionData> {
  user?: AllowedUser;  // set by authMiddleware; guaranteed present after auth
}
```

`ctx.user` is set by `authMiddleware`. In handlers registered after `authMiddleware`, use `ctx.user!` (non-null assertion) — auth guarantees it's present.

## Auth Middleware

- Checks `allowedUsers` table by `chat.id`
- **Silent drop** (no reply) if user not found or `isActive = false`
- Updates `lastSeenAt` timestamp on every allowed request

## Cron Scheduler

All cron jobs use **Asia/Jerusalem** timezone.

| Schedule | Cron | Action |
|----------|------|--------|
| Daily budget alert | `0 8 * * *` | Sends alert to admins if any budget ≥ alertThreshold |
| Weekly summary | `0 8 * * 0` | Summary to all active users |
| Monthly summary | `0 8 1 * *` | Monthly summary to all active users |

## MarkdownV2 Escaping

grammy is configured for MarkdownV2. Special characters in **dynamic content** must be escaped with `\`:

```
_ * [ ] ( ) ~ ` > # + - = | { } . !
```

Static text in template literals is safe if you escape it manually. Dynamic values (amounts, names, dates) from DB must always be escaped.

## Running

- Dev: `npm run dev` (tsx watch, hot reload)
- Prod: `npm run start` (tsx)
- Docker: built via root `docker-compose.yml`, `depends_on: [web]`

## Tests

```bash
npm run test   # vitest run (from apps/bot/)
```

Test files: `src/__tests__/queries.test.ts`, `src/__tests__/formatters.test.ts`, `src/__tests__/helpers.test.ts`, `src/__tests__/handlers/search.test.ts`

## Reference Docs

@../../.claude/rules/bot-patterns.md
