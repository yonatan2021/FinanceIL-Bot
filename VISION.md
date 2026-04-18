# 🔭 VISION — FinanceIL-Bot

> Last Updated: April 2026 | Current Version: v0.1.0 | Status: Active

---

## Product Vision

**FinanceIL-Bot הוא הדרך הפשוטה ביותר לישראלי לדעת לאן הכסף שלו הולך.**

לא app אחר שצריך ללמוד. לא spreadsheet שמת תוך שבועיים. הכל קורה אוטומטית, ישירות מהטלגרם, עם Dashboard שנותן תמונה מלאה ללא friction.

בסופו של דבר: **BaaS — Bot-as-a-Service.** כל לקוח מקבל בוט טלגרם נפרד משלו. הכל מנוהל ממערכת ריכוזית אחת. מנוי חודשי. ישראלי בלבד.

---

## קהל יעד לפי שלב

| גרסה | משתמש | הצורך המרכזי | Pain point |
|------|-------|-------------|-----------|
| **v0.x** | מפתח solo (אני) | Proof of concept, local tool | "אין כלי טוב שעובד עם בנקים ישראליים" |
| **v1.x** | משפחות (2–5 users) | ניהול כספים משפחתי, cloud | "אנחנו לא יודעים לאן הכסף הולך ביחד" |
| **v2.x** | עסקים קטנים (SMB) | הוצאות מוכרות, מע"מ, חשבי שכר | "הנהלת חשבונות ידנית זה waste של זמן" |
| **v3.x+** | ארגונים גדולים | Compliance, audit, roles | "צריך SOC2 ורגולציה ישראלית" |

---

## Differentiators — למה זה שונה

### 🇮🇱 ישראלי-first
מחובר ישירות לבנקים ולחברות האשראי הישראליים דרך MCP Scraper. לא פתרון generic שמנסים לעשות לו adapt. הקטגוריות, ה-merchants, והמטבע (₪) — הכל מותאם לשוק הישראלי.

### 🔒 Privacy-first / Local-first
- **v0.x:** הכל על המכונה שלך. אין cloud. אין שרת שלנו שרואה את הנתונים שלך.
- **v1.x:** Cloud עם הצפנה מלאה. Bank credentials **אף פעם** לא נשמרים plain text.
- **v2.x+:** SOC2-ready, audit logs, compliance ישראלי.

### 🤖 Telegram-native
לא app שצריך לפתוח. הבוט מגיע אליך — התראות, שאלות מהירות, דוחות — הכל ב-Telegram. Dashboard קיים לניהול מעמיק, אבל השימוש היומיומי קורה בצ'אט.

### 🛠️ MCP Scraper Architecture
שימוש ב-Israeli Bank MCP Scraper — הפרויקט הopen-source המבוסס ביותר לscraping בנקאי ישראלי. לא API פרטי, לא black box.

---

## BaaS Model — איך זה עובד עסקית

```
לקוח נרשם → מקבל בוט טלגרם ייעודי משלו → מחבר את הבנקים שלו
                                                        ↓
                          מערכת ריכוזית מנהלת את כל הבוטים, ה-scraping, ה-data
                                                        ↓
                                   לקוח משלם מנוי חודשי — Bot-as-a-Service
```

**Isolation:** כל לקוח מבודד לחלוטין. אין שיתוף data בין לקוחות. Tenant A לא יודע על קיומו של Tenant B.

**Operations:** המפעיל (אני) מנהל את כל הלקוחות דרך Admin Panel אחד — onboarding, status, billing, troubleshooting.

> ❓ Open Question: pricing model — per-user flat, tiered by accounts, או per-transaction? נקבע לפני v2.0.0.

---

## Core Principles

| עיקרון | משמעות |
|-------|-------|
| **Simple** | כל feature צריך לעבוד ב-Telegram ללא הסבר. אם צריך מדריך — זה לא פשוט מספיק. |
| **Reliable** | מידע פיננסי שגוי גרוע ממידע שאין. Scraping נכשל → שגיאה ברורה, לא שקט. |
| **Secure** | Bank credentials לא נשמרים plain text. Never. בשום גרסה. |
| **Private** | הנתונים של המשתמש שייכים למשתמש. Local-first בכל מקום שאפשר. |
| **Useful** | פיצ'ר שאף אחד לא משתמש בו — מוחקים. Default להוסיף פחות ולגרום לזה לעבוד טוב. |

---

## What Success Looks Like

| שלב | מדד הצלחה אחד |
|-----|--------------|
| **v0.x (Personal)** | אני משתמש בזה ביומיום ב-3 חודשים רצופים ללא crashes |
| **v1.x (Family)** | 5 משפחות משתמשות בזה לפחות חודש, ו-0 תלונות על פרטיות |
| **v2.x (BaaS)** | 20 לקוחות משלמים, onboarding עצמאי, 0 interventions ידניים לחודש |
| **v3.x (Enterprise)** | חברה עם 50 עובדים עוברת audit פנימי ללא ממצאים |
