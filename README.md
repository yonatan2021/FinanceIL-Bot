# Finance Bot

A self-hosted personal financial management system built with Next.js and SQLite.

## Features
- **Dashboard**: Web UI built with Next.js (App Router), Tailwind CSS, and Radix UI.
- **Database**: Encrypted SQLite using `better-sqlite3-multiple-ciphers` and Drizzle ORM.
- **Authentication**: Secure dashboard access via `better-auth`.
- **Monorepo**: Managed with npm workspaces.

## Project Structure
- `apps/web`: Next.js frontend and API.
- `apps/bot`: Financial bot implementation.
- `packages/db`: Database schema and migrations.
- `packages/types`: Shared TypeScript types.
- `packages/utils`: Shared utility functions.

## Getting Started

### Prerequisites
- Node.js 20.x
- npm

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and provide a secure `ENCRYPTION_KEY` and `AUTH_SECRET`.*

### Development
Run the web dashboard and bot concurrently:
```bash
npm run dev
```

### Database Management
- Generate migrations: `npm run db:generate`
- Apply migrations: `npm run db:migrate`

### Quality Assurance
- Type checking: `npm run typecheck`
- Testing: `npm run test --workspaces`

## Security
For security reporting, see [SECURITY.md](SECURITY.md).
Never commit real secrets or `.env` files.
# FinanceIL-Bot
