# 🗺️ ROADMAP — FinanceIL-Bot

> Last Updated: April 2026 | Current Version: v0.1.0 | Status: Active Development

---

## מה יש כאן

Roadmap מחולק לפי גרסאות semver. כל גרסה = milestone ברור עם Definition of Done.  
לוגיקת גרסאות מפורטת ב-[VERSIONING.md](VERSIONING.md).

---

## ✅ v0.1.0 — Personal Foundation (קיים)

**מטרה:** הוכחת היתכנות — בוט, scraping, ו-dashboard בסיסיים עובדים locally.

**Deliverables:**
1. Telegram bot מגיב לפקודות בסיסיות
2. Israeli Bank MCP Scraper שולף עסקאות מהבנק
3. Dashboard web UI בסיסי (צפייה בעסקאות)
4. SQLite + Drizzle ORM — schema בסיסי
5. Docker + docker-compose — מריץ הכל locally

**Success Criteria:**
- [x] Bot responds to `/start`, `/help`, `/balance`
- [x] Bank scraping מביא עסקאות מחשבון אחד לפחות
- [x] Dashboard מציג עסקאות ברשימה
- [x] `docker-compose up` מריץ את כל המערכת
- [x] משתמש יחיד, local only

**Definition of Done:** פורס, רץ, אפשר לשלוף עסקאות ולראות אותן. ✅

---

## 🚧 v0.2.0 — Auto-Categorization + Full Dashboard

**מטרה:** מהפרויקט מרגיש כמו demo → מרגיש כמו כלי עבודה אמיתי.

**Timeline:** ~3–4 שבועות

**Deliverables:**
1. **Auto-Categorization** — כל עסקה מקבלת קטגוריה אוטומטית (חנויות מזון, תחבורה, בילוי, וכד')
2. **Category Management** — ניהול קטגוריות מה-dashboard (הוספה, עריכה, override ידני)
3. **Full Dashboard UI:**
   - עמוד עסקאות עם filter לפי תאריך / קטגוריה
   - עמוד הגדרות (אילו בנקים מחוברים, תזמון scraping)
   - ניהול חשבונות מחוברים
4. **Bot Commands** — `/transactions [month]`, `/categories`
5. מעבר מ-basic schema לschema מלא עם relations

**Success Criteria:**
- [ ] 90%+ מהעסקאות מקבלות קטגוריה (לא "אחר")
- [ ] אפשר לשנות קטגוריה ידנית מה-dashboard
- [ ] Dashboard מציג עסקאות עם filter ו-sort
- [ ] Bot מחזיר רשימת עסקאות לפי חודש
- [ ] settings page עובדת — אפשר להוסיף/להסיר חשבון בנק

**Definition of Done:** אפשר להשתמש ביומיום ולהבין את ההוצאות שלי לפי קטגוריה.

---

## 📋 v0.3.0 — Budget Tracking + Anomaly Alerts

**מטרה:** מהמערכת עוקבת → המערכת מתריעה.

**Timeline:** ~3–4 שבועות

**Deliverables:**
1. **Budget Tracking** — הגדרת תקציב חודשי לפי קטגוריה (דרך dashboard)
2. **Budget Alerts (Bot)** — התראה אוטומטית כש-80% / 100% מהתקציב נוצל
3. **Anomaly Detection** — זיהוי עסקאות חריגות (סכום חריג, merchant לא מוכר)
4. **Bot Alerts** — הודעות Telegram לאנומליות
5. **Budget Dashboard** — progress bars, השוואה חודשית

**Success Criteria:**
- [ ] אפשר להגדיר תקציב חודשי לקטגוריה מה-dashboard
- [ ] Bot שולח התראה כשעוברים 80% מהתקציב
- [ ] עסקה > 500% מהממוצע הקטגורי מקבלת flag
- [ ] Dashboard מציג "Spent vs Budget" לכל קטגוריה
- [ ] אפשר לכבות/להפעיל alerts מההגדרות

**Definition of Done:** Bot מתריע לפני שחרגתי מהתקציב, ולא אחרי.

---

## 📊 v0.4.0 — Reports + Export

**מטרה:** מעקב שוטף → הבנה היסטורית וייצוא נתונים.

**Timeline:** ~3–4 שבועות

**Deliverables:**
1. **Monthly Report (Bot)** — דוח חודשי אוטומטי ב-1 לחודש: סיכום הוצאות, top categories, budget performance
2. **Monthly Report (Dashboard)** — עמוד דוחות חזותי עם גרפים
3. **CSV Export** — ייצוא עסקאות לפי טווח תאריכים
4. **Trend View** — גרף הוצאות לפי חודש (3/6/12 חודשים אחורה)
5. **Transaction Search** — חיפוש עסקאות לפי merchant / תיאור

**Success Criteria:**
- [ ] Bot שולח דוח חודשי ב-1 לחודש (cron)
- [ ] Export לCSV עובד מה-dashboard
- [ ] גרף trend מציג לפחות 3 חודשים
- [ ] חיפוש עסקאות עובד
- [ ] Dashboard מציג גרפים (pie chart קטגוריות, bar chart חודשי)

**Definition of Done:** אפשר להסתכל על 6 חודשים אחורה ולהבין לאן הכסף הלך.

---

## 🔧 v0.5.0 — Stability + Hardening

**מטרה:** מהפרויקט "עובד" → פרויקט "סומכים עליו".

**Timeline:** ~4–5 שבועות

**Deliverables:**
1. **Recurring Detection** — זיהוי עסקאות קבועות (חשמל, אינטרנט, ביטוח)
2. **Test Coverage** — הגעה ל-60%+ coverage (unit + integration)
3. **Error Handling** — graceful handling לכל כשלי ה-scraper
4. **Scraper Retry Logic** — retry עם backoff לכשלי scraping
5. **Documentation** — SETUP_GUIDE מעודכן, BOT_COMMANDS_REFERENCE מלא
6. **Logging** — structured logging לכל operations קריטיים

**Success Criteria:**
- [ ] 60%+ test coverage (`npm run test`)
- [ ] Bot לא קורס כשה-scraper נכשל — שולח הודעת שגיאה ידידותית
- [ ] עסקאות קבועות מוצגות עם badge "חוזר"
- [ ] scraping מנסה שוב אוטומטית לאחר כשל
- [ ] `npm run test` ירוק ב-CI

**Definition of Done:** המערכת רצה שבוע ללא intervention.

> ❓ Open Question: מה רמת ה-flakiness הנוכחית של ה-MCP scraper? זה ישפיע על עדיפות retry logic.

---

## 🤖 v0.6.0 — AI Finance Assistant (Local Beta)

**מטרה:** מהמערכת מציגה נתונים → המערכת עונה על שאלות.

**Timeline:** ~5–6 שבועות

**Deliverables:**
1. **AI Chat (Bot)** — `/ask "כמה הוצאתי על אוכל ב-3 חודשים אחרונים?"` מחזיר תשובה בשפה טבעית
2. **Insights** — תובנות שבועיות אוטומטיות ("הוצאת 30% יותר על מסעדות מהחודש שעבר")
3. **Context-aware** — ה-AI מכיר את הקטגוריות, תקציבים, והתנהגות שלי
4. **Guardrails** — AI **לא** נותן ייעוץ השקעות, לא גישה לנתוני הבנק הגולמיים

**Success Criteria:**
- [ ] אפשר לשאול שאלות ב-`/ask` ולקבל תשובה ב-5 שניות
- [ ] AI לא חורג מגבולות — לא מציע מניות, לא משתף נתונים
- [ ] AI מציג disclaimer ברור: "מידע בלבד, לא ייעוץ פיננסי"
- [ ] עובד fully locally (no data leaves the machine)

**⚠️ הגבלות חוקיות:** AI assistant מספק מידע על עסקאות בלבד. אין ייעוץ השקעות. הנתונים הפיננסיים הם המידע הרגיש ביותר — local only בשלב זה.

**Definition of Done:** אפשר לשאול "כמה הוצאתי" ולקבל תשובה מדויקת.

---

## ☁️ v1.0.0 — Cloud MVP (Family-Ready)

**מטרה:** מ-local tool → שירות cloud יציב שמשפחה יכולה להשתמש בו.

**Timeline:** ~2–3 חודשים

**Deliverables:**
1. **Cloud Deployment** — deploy על VPS / managed service, HTTPS, domain
2. **Multi-User (Family)** — 2–5 משתמשים לתא משפחתי, shared/separate views
3. **Encrypted Credentials** — bank credentials מוצפנים at-rest, לא נשמרים plain text
4. **Stable API** — versioned API שלא ישבר בין versions
5. **Backup & Recovery** — automated daily backups לdata
6. **Auth** — proper multi-user authentication

> ✅ AI assistant (v0.6.0) — optional for v1.0.0, not required for DoD. v1.0.0 = Cloud + Family בלבד.

**Success Criteria:**
- [ ] משפחה (2+ users) יכולה להתחבר ולראות עסקאות משותפות
- [ ] Data מוצפן at-rest ו-in-transit
- [ ] 99% uptime במשך חודש
- [ ] Bank credentials **לא** נשמרים plain text
- [ ] Backup אוטומטי יומי
- [ ] Public stable API v1 — לא ישתנה ב-patch versions

**Definition of Done:** אפשר לתת לבן/בת זוג גישה בלי לפחד שהנתונים ידלפו.

---

## 🏢 v2.0.0 — BaaS (Bot-as-a-Service)

**מטרה:** מ-shared family product → פלטפורמה multi-tenant עם billing.

**Timeline:** ~3–4 חודשים

**Deliverables:**
1. **Multi-Tenant Architecture** — כל לקוח מבודד לחלוטין (DB isolation)
2. **Dedicated Bot per Tenant** — כל לקוח מקבל בוט טלגרם נפרד משלו
3. **Billing & Subscriptions** — מנוי חודשי, ניהול תשלומים
4. **Admin Panel** — ניהול כל הלקוחות (onboarding, status, billing)
5. **Business Reports** — הוצאות מוכרות, מע"מ, דוחות לחשבי שכר
6. **SLA & Monitoring** — dashboards, alerting, incident response

> ❓ Open Question: מה ה-pricing model? (per-user, per-bot, tiered?) — נקבע לפני v2.0.0.

**Success Criteria:**
- [ ] Tenant A לא יכול לראות data של Tenant B (isolation tests)
- [ ] Onboarding עצמאי — לקוח חדש מקבל בוט תוך < 5 דקות
- [ ] Billing מעבד תשלום בהצלחה
- [ ] Admin Panel מציג כל הלקוחות + status
- [ ] Business expense report ניתן לייצוא כ-PDF

**Definition of Done:** לקוח חדש יכול להירשם, לשלם, ולקבל בוט — ללא intervention ידני שלי.

---

## 🏛️ v3.0.0 — Enterprise

**מטרה:** מ-SMB → ארגונים גדולים ורגולציה ישראלית מלאה.

**Timeline:** ~6+ חודשים (מ-v2.0.0)

**Deliverables:**
1. **SOC2 Readiness** — audit logs, access controls, security review
2. **Roles & Permissions** — admin, accountant, viewer, approver
3. **Open Banking Integration** — כשיהיה זמין רגולטורית בישראל
4. **Advanced Business Reports** — תאימות לרו"ח ישראלי, מסמכי מע"מ
5. **SSO / SAML** — integration ארגונית
6. **Israeli Regulatory Compliance** — פרטיות, GDPR-equivalent

**Definition of Done:** חברה עם 50 עובדים יכולה להשתמש ולעבור audit.

---

## 🧊 Future / Icebox

רעיונות שלא ייושמו בטווח הנראה לעין — נשמרים לעתיד:

| רעיון | סיבה שנדחה |
|-------|-----------|
| **Voice commands** (WhatsApp/Alexa) | מורכבות גבוהה, low priority |
| **Open Banking API** (direct) | תלוי ברגולציה ישראלית — לא קיימת עדיין |
| **Investment tracking** | רגולציה ייעוץ השקעות — out of scope |
| **Receipt scanning (OCR)** | nice-to-have, לא core |
| **Crypto wallets** | מחוץ ל-scope הישראלי הבנקאי |
| **Mobile app (native)** | Web-first בינתיים — bot מספק mobile access |
| **Bill splitting** | Feature נישתי, לא core use-case |
