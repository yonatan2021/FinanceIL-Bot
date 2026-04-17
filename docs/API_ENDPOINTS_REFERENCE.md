# 🌐 API Endpoints — הפניה מלאה

כל endpoints מדברים JSON ודורשים authentication (token).

---

## Authentication

### Headers דרושים
```
Authorization: Bearer {SESSION_TOKEN}
Content-Type: application/json
```

**איך קבל token:**
1. יצור חשבון דרך `/auth/register`
2. התחבר דרך `/auth/login`
3. השתמש ב-token בכל בקשה

---

## 🏦 Accounts (חשבונות בנק)

### `GET /api/accounts`

קבל רשימה של כל החשבונות שלך עם יתרות עדכניות.

**Query Params:** אין

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "acc_123",
      "accountNumber": "123456789",
      "balance": 15250.00,
      "lastUpdatedAt": "2026-04-17T09:15:00Z",
      "credentialId": "cred_456",
      "bankDisplayName": "בנק ישראל",
      "bankId": "leumi"
    }
  ]
}
```

**Errors:**
- `401` — No authentication
- `500` — Database error

---

## 💳 Transactions (עסקאות)

### `GET /api/transactions`

קבל עסקאות עם סינון וPagination.

**Query Params:**
| Param | Type | Default | דוגמה |
|-------|------|---------|--------|
| `month` | number | none | `4` |
| `year` | number | none | `2026` |
| `category` | string | none | `אוכל` |
| `page` | number | 1 | `2` |
| `limit` | number | 50 | `100` (max: 100) |

**דוגמה:**
```
GET /api/transactions?month=4&year=2026&category=אוכל&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "txn_001",
      "accountId": "acc_123",
      "date": "2026-04-17T14:30:00Z",
      "description": "קרדיט מרכז",
      "amount": 350.00,
      "currency": "ILS",
      "type": "debit",
      "category": "קניות",
      "status": "completed",
      "createdAt": "2026-04-17T15:00:00Z"
    }
  ],
  "meta": {
    "total": 127,
    "page": 1,
    "limit": 20
  }
}
```

**Errors:**
- `401` — No authentication
- `400` — Invalid filters
- `500` — Database error

---

## 🔐 Credentials (פרטי בנק מוצפנים)

### `GET /api/credentials`

קבל רשימת כל פרטי הבנק (לא מוצפנים בתשובה).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cred_456",
      "bankId": "leumi",
      "displayName": "בנק ישראל",
      "status": "active",
      "lastScrapedAt": "2026-04-17T08:30:00Z"
    }
  ]
}
```

### `POST /api/credentials`

הוסף בנק חדש.

**Body:**
```json
{
  "bankId": "leumi",
  "displayName": "בנק ישראל",
  "username": "my_username",
  "password": "my_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cred_789",
    "bankId": "leumi",
    "displayName": "בנק ישראל",
    "status": "active"
  }
}
```

### `GET /api/credentials/[id]`

קבל פרטי בנק ספציפי.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cred_456",
    "bankId": "leumi",
    "displayName": "בנק ישראל",
    "status": "active"
  }
}
```

### `DELETE /api/credentials/[id]`

מחק בנק.

**Response:**
```json
{
  "success": true
}
```

---

## 📋 Scrape Logs (היסטוריית סקרייפר)

### `GET /api/scrape-logs`

קבל היסטוריה של הריצות האחרונות של הסקרייפר.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log_001",
      "credentialId": "cred_456",
      "startedAt": "2026-04-17T08:00:00Z",
      "finishedAt": "2026-04-17T08:15:00Z",
      "transactionsFetched": 42,
      "status": "success",
      "errorMessage": null
    }
  ]
}
```

---

## 💰 Budgets (תקציב חודשי)

### `GET /api/budgets`

קבל את כל התקציבים הפעילים.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "budget_001",
      "categoryName": "אוכל",
      "monthlyLimit": 1500.00,
      "period": "monthly",
      "alertThreshold": 0.8,
      "isActive": true,
      "createdAt": "2026-04-01T00:00:00Z"
    }
  ]
}
```

### `POST /api/budgets`

צור תקציב חדש.

**Body:**
```json
{
  "categoryName": "אוכל",
  "monthlyLimit": 1500.00,
  "alertThreshold": 0.8
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "budget_123",
    "categoryName": "אוכל",
    "monthlyLimit": 1500.00
  }
}
```

### `PUT /api/budgets/[id]`

עדכן תקציב.

**Body:**
```json
{
  "monthlyLimit": 1800.00,
  "alertThreshold": 0.85
}
```

### `DELETE /api/budgets/[id]`

מחק תקציב.

---

## 👤 Users (משתמשים)

### `GET /api/users`

קבל רשימת משתמשים (admin only).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_123",
      "telegramId": "123456789",
      "name": "Yonatan",
      "role": "admin",
      "isActive": true,
      "createdAt": "2026-03-01T00:00:00Z",
      "lastSeenAt": "2026-04-17T15:00:00Z"
    }
  ]
}
```

### `GET /api/users/[id]`

קבל פרטי משתמש ספציפי.

### `POST /api/users`

צור משתמש חדש (admin only).

**Body:**
```json
{
  "telegramId": "987654321",
  "name": "Friend1",
  "role": "viewer"
}
```

---

## 🔄 Scraper Control (ניהול סקרייפר)

### `POST /api/scrape`

הפעל סקרייפר ידנית.

**Headers:**
```
x-internal-secret: [INTERNAL_API_SECRET]
```

**Body:** (ריק)

**Response:**
```json
{
  "success": true,
  "message": "Scraper started",
  "logId": "log_001"
}
```

---

## 🤖 Bot Status

### `GET /api/bot/status`

קבל סטטוס של הבוט.

**Response:**
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "lastUpdate": "2026-04-17T15:00:00Z",
    "activeUsers": 3
  }
}
```

---

## 📊 Statistics (סטטיסטיקות)

### `GET /api/statistics/summary`

סיכום ההוצאות החודשיות לפי קטגוריה.

**Response:**
```json
{
  "success": true,
  "data": {
    "month": 4,
    "year": 2026,
    "categories": {
      "אוכל": 1200.00,
      "קניות": 2450.00,
      "תחבורה": 800.00
    },
    "total": 4450.00
  }
}
```

---

## 🔐 Auth (הרשמה וכניסה)

### `POST /api/auth/register`

הרשמה חדשה.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "My Name"
}
```

### `POST /api/auth/login`

כניסה.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## ❌ Global Error Handling

כל endpoint יכול להחזיר שגיאה:

```json
{
  "success": false,
  "error": "Internal Server Error"
}
```

**Common Status Codes:**
- `200` — Success
- `400` — Bad Request (invalid params)
- `401` — Unauthorized (no token)
- `403` — Forbidden (no permission)
- `404` — Not Found
- `500` — Server Error

---

## Rate Limiting

כרגע **ללא rate limiting** (פרוייקט מקומי).  
עתיד: הוסף rate limiting בעת ייצור.

---

## Pagination

כל endpoints עם רשימות יותר גדולות תומכות pagination:

```
GET /api/transactions?page=2&limit=20
```

Response includes:
```json
"meta": {
  "total": 127,
  "page": 2,
  "limit": 20
}
```

---

**Last Updated**: April 2026  
**Framework**: Next.js API Routes  
**Authentication**: better-auth
