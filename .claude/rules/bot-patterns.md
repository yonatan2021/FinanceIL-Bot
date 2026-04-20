# Bot Patterns — FinanceIL-Bot

## New Command Checklist

- [ ] Handler file in `src/handlers/`
- [ ] Service function in `src/services/` (if new business logic)
- [ ] DB queries in `src/queries.ts` (if new DB access)
- [ ] Formatter in `src/formatters.ts` (if new message format)
- [ ] Registered in `src/index.ts`: `bot.command('name', authMiddleware, handler)`
- [ ] Documented in `docs/BOT_COMMANDS_REFERENCE.md`
- [ ] Error handling for every failure scenario
- [ ] Unit test for the service function

## Handler Canonical Template

```typescript
// src/handlers/balanceHandler.ts
export async function balanceHandler(ctx: BotContext): Promise<void> {
  // 1. Validate args
  const args = parseArgs(ctx.message?.text);
  if (!args.month) {
    return ctx.reply(formatError('נא לציין חודש: /balance 2024-01'));
  }

  // 2. (authMiddleware already ran — ctx.user is guaranteed)
  const user = ctx.user!;

  // 3. Service call — NEVER call db or queries.ts directly from here
  const balance = await getBalanceSummary(user.telegramId, args.month);

  // 4. Format
  const message = formatBalance(balance);

  // 5. Reply
  return ctx.reply(message, { parse_mode: 'MarkdownV2' });
}
```

## handlers/ vs notifications.ts

| `handlers/` | `notifications.ts` |
|------------|-------------------|
| Responds to user-initiated actions (commands, callbacks) | Sends proactively (cron trigger, event) |
| Runs inside a Telegram Update context | Calls `bot.telegram.sendMessage(chatId, ...)` directly |
| Uses `ctx.reply()` | Uses `bot.telegram.sendMessage()` |
| Example: `/balance` command handler | Example: budget alert, monthly report cron |

All cron scheduling lives in `src/scheduler.ts` only — never scattered across other files.

## Anti-Patterns

| Anti-Pattern | Correct Approach |
|-------------|-----------------|
| Handler imports from `packages/db` or calls Drizzle | Handler → service → `queries.ts` |
| Handler calls bridge or scraper directly | Handler → service → bridge via HTTP through service layer |
| Business logic in `formatters.ts` | Formatters return strings only; logic belongs in services |
| `console.log` or `console.error` | `logger.info()` / `logger.error()` structured only |
| Cron job registered outside `scheduler.ts` | All cron in `scheduler.ts` |
| Re-checking `allowedUsers` in handler | `authMiddleware` guarantees `ctx.user`; trust it |

## Error Handling Contract

Global error middleware is registered once in `src/index.ts`. Individual handlers do **not** need their own try/catch.

What the global handler does:
- Logs `{ action: 'handler_error', command, telegramId, errorCode }` — no stack trace, no user data
- Replies with a friendly Hebrew error message
- Never exposes internal details to users

If a handler needs to return a **business error** (invalid input, not found), it uses `ctx.reply()` with a formatted message and returns early — no exception thrown.
