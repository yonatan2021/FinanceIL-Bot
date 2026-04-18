# 📦 VERSIONING — FinanceIL-Bot

> Last Updated: April 2026 | Current Version: v0.1.0 | Status: Active

---

## Semantic Versioning בפרויקט זה

פורמט: `MAJOR.MINOR.PATCH`

| טיפוס | מתי? | דוגמה |
|-------|------|-------|
| **PATCH** `x.x.Z` | Bug fix, refactor, עדכון dependency, שיפור performance — **אין שינוי API, אין feature חדש** | `v0.2.1` — תיקון bug ב-scraper parsing |
| **MINOR** `x.Y.x` | Feature חדש שלא שובר תאימות אחורה — הוספת endpoint, הוספת bot command | `v0.3.0` — הוספת budget tracking |
| **MAJOR** `X.x.x` | שינוי ארכיטקטוני / breaking change / milestone עסקי משמעותי | `v1.0.0` — מעבר לcloud, stable API |

### דוגמאות ספציפיות לפרויקט

| שינוי | טיפוס | סיבה |
|-------|-------|------|
| תיקון bug בparsing של שם merchant | PATCH | לא משנה API |
| שדרוג `drizzle-orm` ל-version חדש | PATCH | dependency בלבד |
| הוספת `/ask` command לbot | MINOR | feature חדש, backward compatible |
| הוספת שדה חדש לtransactions table (nullable) | MINOR | schema change שלא שובר קוד קיים |
| שינוי schema שמוחק שדה / משנה type | MAJOR | breaking change לDB |
| מעבר מ-SQLite לPostgres | MAJOR | ארכיטקטורה |
| הוספת multi-tenant support | MAJOR | milestone עסקי |
| שינוי API response format | MAJOR | breaking change |

### Milestones

| גרסה | משמעות עסקית |
|------|-------------|
| `v0.x.x` | Personal tool, local, experimental — שובר תאימות מותר |
| `v1.0.0` | Cloud MVP ציבורי, stable API, family-ready |
| `v2.0.0` | BaaS Product עם billing ו-multi-tenant |
| `v3.0.0` | Enterprise |

---

## Changelog Template

לפי [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
-

### Changed
-

### Fixed
-

### Removed
-

---

## [0.2.0] - YYYY-MM-DD

### Added
- Auto-categorization for transactions
- Full dashboard UI with filters and settings page
- `/transactions [month]` bot command

### Changed
- DB schema extended with categories and account relations

### Fixed
- Scraper crash on empty transaction list

---

## [0.1.0] - 2026-04-01

### Added
- Initial Telegram bot with basic commands
- Israeli Bank MCP Scraper integration
- Basic dashboard (transaction list view)
- SQLite + Drizzle ORM setup
- Docker + docker-compose configuration
```

---

## Release Checklist

לפני כל release, עברו על הרשימה:

### כל Release (PATCH / MINOR / MAJOR)
- [ ] `npm run typecheck` — ללא errors
- [ ] `npm run test` — ירוק
- [ ] `npm run test` coverage ≥ 60% (מ-v0.5.0)
- [ ] CHANGELOG.md מעודכן עם כל השינויים
- [ ] Version מעודכן ב-`package.json` (root + packages)
- [ ] אין secrets / keys מקודדים בקוד
- [ ] `.env.example` מעודכן אם נוספו env vars חדשות
- [ ] Docker build עובר: `docker-compose build`

### MINOR Release נוסף
- [ ] README.md מעודכן (features table, quick start אם השתנה)
- [ ] ROADMAP.md — סמן [x] ל-success criteria שהושלמו
- [ ] Bot commands מתועדים ב-`docs/BOT_COMMANDS_REFERENCE.md`

### MAJOR Release נוסף
- [ ] Migration plan לdata קיים — לא שוברים דברים בשקט
- [ ] API changes מתועדים (breaking changes בולטים)
- [ ] VISION.md / ROADMAP.md — עדכון status ו-next milestone
- [ ] Tag ב-git: `git tag -a v1.0.0 -m "v1.0.0: Cloud MVP"`
- [ ] GitHub Release עם release notes

---

## Branch Strategy

```
main          ← production-ready only. כל commit כאן = releaseable.
develop       ← integration branch. PRs נפתחים לכאן.
feature/xxx   ← feature branches. מתחילים מ-develop, מתמזגים לdevelop.
hotfix/xxx    ← critical fixes. מתחילים מ-main, מתמזגים ל-main ו-develop.
release/x.x.x ← release preparation. branch זמני לפני merge ל-main.
```

### Flow רגיל (feature)

```bash
git checkout develop
git checkout -b feature/auto-categorization
# ... עבודה ...
git push -u origin feature/auto-categorization
# PR → develop
```

### Flow release

```bash
git checkout develop
git checkout -b release/0.2.0
# עדכון version, CHANGELOG, בדיקות אחרונות
git checkout main
git merge release/0.2.0
git tag -a v0.2.0 -m "v0.2.0: Auto-categorization + Full Dashboard"
git checkout develop
git merge release/0.2.0
git branch -d release/0.2.0
```

### Flow hotfix

```bash
git checkout main
git checkout -b hotfix/scraper-crash
# fix...
git checkout main && git merge hotfix/scraper-crash
git tag -a v0.1.1 -m "v0.1.1: Fix scraper crash on empty list"
git checkout develop && git merge hotfix/scraper-crash
```
