# Vision & Roadmap — FinanceIL-Bot

## Current Version

**v0.1.0 — Personal Alpha (Local Only)**

All data stays on your machine. No cloud. No external server sees financial data.

## Core Principles

| Principle | What it means in practice |
|-----------|--------------------------|
| **Simple** | Must work in Telegram without a manual. If it needs explanation, simplify it. |
| **Reliable** | Wrong data is worse than no data. Scrape failure → clear error, never silent. |
| **Secure** | Bank credentials never stored plain text. Ever. No exceptions across any version. |
| **Private** | User data belongs to the user. Local-first wherever possible. |
| **Useful** | Delete features nobody uses. Fewer features done well beats many done poorly. |

## Target Audience by Version

| Version | User | Central need |
|---------|------|-------------|
| v0.x | Solo developer | Proof of concept, local tool |
| v1.x | Families (2–5 users) | Shared finance tracking, cloud deployment |
| v2.x | Small businesses | Tax-deductible expenses, VAT tracking |
| v3.x+ | Enterprises | Compliance, audit logs, roles |

## Roadmap

| Version | Status | Theme | Key deliverables |
|---------|--------|-------|-----------------|
| v0.1.0 | ✅ Done & deployed | Foundation | Bot, scraping, basic dashboard, SQLite, Docker |
| v0.2.0 | 🔨 In Progress | Categorization | Auto-categorization, full dashboard, `/transactions`, `/categories` |
| v0.3.0 | 📋 Planned | Alerts | Budget tracking, anomaly detection, Telegram alerts at 80%/100% |
| v0.4.0 | 📋 Planned | Reports | Monthly auto-reports, CSV export, trend graphs, merchant search |
| v0.5.0 | 📋 Planned | Hardening | 60%+ test coverage, retry logic, structured logging |
| v0.6.0 | 📋 Planned | AI | `/ask` command, local Ollama default, guardrails (no investment advice) |
| v1.0.0 | 📋 Planned | Cloud | Multi-user, HTTPS, encrypted at-rest, daily backups, stable API |
| v2.0.0 | 📋 Planned | BaaS | Multi-tenant, dedicated bot per customer, billing, admin panel |
| v3.0.0 | 📋 Planned | Enterprise | SOC2, SSO/SAML, Israeli regulatory compliance |

## Feature Scope Boundaries

| Out of scope | Reason |
|-------------|--------|
| Investment tracking | Requires financial advisory licensing |
| Open Banking API (direct) | Pending Israeli regulation |
| Crypto wallets | Outside Israeli banking scope |
| Receipt scanning (OCR) | Nice-to-have, not core |
| Native mobile app | Web + Telegram covers mobile |

## Open Architecture Questions

These are **undecided** — do not implement solutions without explicit discussion:

1. **Multi-tenant DB strategy (v2.0.0):** tenantId-per-row vs separate schema vs separate DB file per tenant
2. **Dashboard auth v1.0.0:** JWT + httpOnly cookies vs better-auth (already integrated) vs NextAuth.js
3. **AI provider (v0.6.0):** Ollama local default, with pluggable OpenAI / Claude Haiku / Gemini Flash
