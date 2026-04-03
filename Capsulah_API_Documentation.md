# Capsulah (كبسولة) - API Documentation
## Arabic Smart Health News Portal - Mobile App Integration Guide

**Base URL**: `https://capsulah.replit.app`
**Content-Type**: `application/json`
**Language**: Arabic (RTL)
**Timezone**: Asia/Riyadh (UTC+3)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [News (Public)](#2-news-public)
3. [Categories](#3-categories)
4. [Articles](#4-articles)
5. [Health Profile](#5-health-profile)
6. [Health Trackers](#6-health-trackers)
7. [Nutrition](#7-nutrition)
8. [AI Chat Assistant](#8-ai-chat-assistant)
9. [Data Models](#9-data-models)
10. [Error Handling](#10-error-handling)
11. [Notes for Mobile Development](#11-notes-for-mobile-development)

---

## 1. Authentication

The system supports two authentication methods:
- **Local Auth** (Email + Password) — recommended for mobile apps
- **Admin Auth** (Username + Password) — for CMS/admin panel only

Session is managed via cookie (`connect.sid`). Mobile apps should store and send this cookie with every request.

### 1.1 Register New User

```
POST /api/auth/register
```

**Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "أحمد",
  "lastName": "محمد"
}
```

**Validation Rules**:
- `email` — required, valid email format, unique (case-insensitive, trimmed)
- `password` — required, minimum 6 characters
- `firstName` — required
- `lastName` — optional

**Success Response** `201`:
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "firstName": "أحمد",
  "lastName": "محمد",
  "role": "subscriber"
}
```

**Error Responses**:
- `400` — `{ "message": "يرجى ملء جميع الحقول المطلوبة" }` (missing fields)
- `400` — `{ "message": "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }` (short password)
- `400` — `{ "message": "البريد الإلكتروني غير صحيح" }` (invalid email)
- `409` — `{ "message": "هذا البريد الإلكتروني مسجّل مسبقاً" }` (duplicate email)

**Note**: Registration auto-logs in the user. The session cookie is set automatically.

---

### 1.2 Login

```
POST /api/auth/login
```

**Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response** `200`:
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "firstName": "أحمد",
  "lastName": "محمد",
  "role": null
}
```

**Error Responses**:
- `401` — `{ "message": "البريد الإلكتروني أو كلمة المرور غير صحيحة" }`
- `401` — `{ "message": "الحساب معطّل. تواصل مع الدعم." }`

---

### 1.3 Logout

```
POST /api/auth/logout
```

**Success Response** `200`:
```json
{ "success": true }
```

---

### 1.4 Get Current User

```
GET /api/auth/user
```

**Requires**: Valid session cookie

**Success Response** `200`:
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "firstName": "أحمد",
  "lastName": "محمد",
  "role": "subscriber",
  "isActive": true,
  "profileImageUrl": null,
  "authProvider": "local",
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-15T10:00:00.000Z",
  "lastLoginAt": "2026-04-03T08:30:00.000Z"
}
```

**Error**: `401` — `{ "message": "Unauthorized" }`

---

## 2. News (Public)

All news endpoints are public (no auth required) unless otherwise noted.

### 2.1 Get News List

```
GET /api/news
```

**Query Parameters**:
| Parameter  | Type    | Default | Description |
|-----------|---------|---------|-------------|
| `category` | string  | —       | Filter by category slug (e.g., `medical`, `nutrition`) |
| `search`   | string  | —       | Search in title/content |
| `page`     | integer | —       | Page number (enables pagination mode) |
| `perPage`  | integer | 20      | Items per page (only with `page`) |
| `limit`    | integer | 50      | Max items (only without `page`) |

**Response (without pagination)**:
```json
[
  {
    "id": "uuid",
    "shortCode": "AbC1234",
    "title": "عنوان الخبر",
    "subtitle": "عنوان فرعي",
    "summary": "ملخص الخبر",
    "content": "<p>محتوى الخبر بالكامل HTML</p>",
    "category": "medical",
    "source": "وزارة الصحة",
    "sourceUrl": "https://...",
    "imageUrl": "https://...",
    "imageAlt": "وصف الصورة",
    "seoTitle": "عنوان SEO",
    "seoDescription": "وصف SEO",
    "keywords": ["صحة", "طب"],
    "viewCount": 150,
    "todayViews": 12,
    "isTranslated": false,
    "isFeatured": true,
    "isBreaking": false,
    "status": "published",
    "scheduledAt": null,
    "publishedAt": "2026-04-01T08:00:00.000Z",
    "createdBy": "admin",
    "createdAt": "2026-04-01T07:30:00.000Z",
    "updatedAt": "2026-04-01T08:00:00.000Z"
  }
]
```

**Response (with pagination)** — when `page` is provided:
```json
{
  "data": [ /* array of news objects */ ],
  "total": 150,
  "page": 1,
  "perPage": 20,
  "totalPages": 8
}
```

---

### 2.2 Get Single News

```
GET /api/news/:id
```

**Response** `200`: Single news object (same structure as list item)

**Error**: `404` — `{ "message": "News not found" }`

---

### 2.3 Get News by Short Code

```
GET /api/n/:shortCode
```

Short URLs like `/n/AbC1234` resolve to the full news item.

**Response** `200`: Single news object

**Error**: `404` — `{ "message": "News not found" }`

---

### 2.4 Get Trending News

```
GET /api/news/trending
```

Returns most-viewed news from the last 7 days.

**Query Parameters**:
| Parameter | Type    | Default | Description |
|----------|---------|---------|-------------|
| `limit`  | integer | 10      | Max items (capped at 20) |

**Response**: Array of news objects ordered by `viewCount` descending.

---

### 2.5 Get Related News

```
GET /api/news/:id/related
```

Returns up to 10 news items from the same category.

**Response**: Array of news objects (excludes the current article).

---

### 2.6 Search News by Keyword

```
GET /api/news/keyword/:keyword
```

**Response**: Array of news objects matching the keyword.

---

### 2.7 Record View (Analytics)

```
POST /api/news/:id/view
```

Call this when user opens a news article. Increments view count and records analytics.

**Body** (optional):
```json
{
  "referrer": "https://google.com"
}
```

**Response**: `{ "ok": true }`

---

### 2.8 Get Shareable News Data

```
GET /api/share/news/:id
```

Returns news data optimized for social sharing (includes OG metadata).

**Response** `200`:
```json
{
  "id": "uuid",
  "title": "عنوان الخبر",
  "summary": "ملخص قصير",
  "imageUrl": "https://...",
  "shortCode": "AbC1234",
  "shareUrl": "https://capsulah.replit.app/n/AbC1234",
  "category": "medical",
  "publishedAt": "2026-04-01T08:00:00.000Z",
  "source": "وزارة الصحة"
}
```

---

## 3. Categories

### 3.1 Get All Categories

```
GET /api/categories
```

**Query Parameters**:
| Parameter | Type    | Description |
|----------|---------|-------------|
| `active` | string  | Set to `"true"` to get only active categories |

**Response**:
```json
[
  {
    "id": "uuid",
    "slug": "medical",
    "nameAr": "طبي",
    "nameEn": "Medical",
    "color": "emerald-600",
    "icon": "Stethoscope",
    "description": "أخبار طبية وعلمية",
    "sortOrder": 1,
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

---

## 4. Articles

Medical articles with physician-reviewed content.

### 4.1 Get All Articles

```
GET /api/articles
```

**Query Parameters**:
| Parameter  | Type   | Description |
|-----------|--------|-------------|
| `category` | string | Filter by category |
| `search`   | string | Search in title/content |

**Response**:
```json
[
  {
    "id": "uuid",
    "slug": "diabetes-management",
    "title": "إدارة مرض السكري",
    "excerpt": "ملخص المقال",
    "content": "محتوى المقال الكامل (Markdown)",
    "category": "chronic-diseases",
    "tags": ["سكري", "صحة"],
    "readTime": 5,
    "reviewedBy": "د. أحمد",
    "medicalReviewDate": "2026-03-01T00:00:00.000Z",
    "sources": [
      { "title": "Mayo Clinic", "url": "https://..." }
    ],
    "status": "published",
    "publishedAt": "2026-03-15T00:00:00.000Z",
    "createdAt": "2026-03-01T00:00:00.000Z",
    "updatedAt": "2026-03-15T00:00:00.000Z"
  }
]
```

### 4.2 Get Article by Slug

```
GET /api/articles/:slug
```

**Response**: Single article object

**Error**: `404` — `{ "message": "Article not found" }`

---

## 5. Health Profile

All health profile endpoints require authentication.

### 5.1 Get Health Profile

```
GET /api/health-profile
```

**Requires**: Auth session

**Response** `200`:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "heightCm": 175.0,
  "weightKg": 72.5,
  "bloodType": "O+",
  "conditions": ["ضغط الدم", "سكري"],
  "medications": ["ميتفورمين"],
  "allergies": ["بنسلين"],
  "goals": ["إنقاص الوزن", "تحسين اللياقة"],
  "createdAt": "2026-01-15T00:00:00.000Z",
  "updatedAt": "2026-03-01T00:00:00.000Z"
}
```

Returns `null` if no profile exists yet.

---

### 5.2 Create/Update Health Profile

```
POST /api/health-profile
```

**Requires**: Auth session

**Body**:
```json
{
  "heightCm": 175.0,
  "weightKg": 72.5,
  "bloodType": "O+",
  "conditions": ["ضغط الدم"],
  "medications": ["ميتفورمين"],
  "allergies": ["بنسلين"],
  "goals": ["إنقاص الوزن"]
}
```

All fields are optional. This is an upsert — creates if not exists, updates if exists.

**Response**: Updated health profile object.

---

## 6. Health Trackers

Track vital signs: blood pressure, blood sugar, weight, heart rate, etc.

### 6.1 Get Trackers

```
GET /api/trackers
```

**Requires**: Auth session

**Query Parameters**:
| Parameter | Type    | Default | Description |
|----------|---------|---------|-------------|
| `type`   | string  | —       | Filter by type: `blood_pressure`, `blood_sugar`, `weight`, `heart_rate` |
| `limit`  | integer | 50      | Max records |

**Response**:
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "type": "blood_pressure",
    "measuredAt": "2026-04-01T10:00:00.000Z",
    "valuePrimary": 120.0,
    "valueSecondary": 80.0,
    "unit": "mmHg",
    "note": "قبل الفطور",
    "createdAt": "2026-04-01T10:00:00.000Z"
  }
]
```

**Tracker Types**:
| Type | `valuePrimary` | `valueSecondary` | Unit |
|------|---------------|------------------|------|
| `blood_pressure` | Systolic (e.g. 120) | Diastolic (e.g. 80) | `mmHg` |
| `blood_sugar` | Glucose level | — | `mg/dL` |
| `weight` | Weight value | — | `kg` |
| `heart_rate` | BPM | — | `bpm` |

---

### 6.2 Add Tracker Reading

```
POST /api/trackers
```

**Requires**: Auth session

**Body**:
```json
{
  "type": "blood_pressure",
  "measuredAt": "2026-04-01T10:00:00.000Z",
  "valuePrimary": 120,
  "valueSecondary": 80,
  "unit": "mmHg",
  "note": "بعد الرياضة"
}
```

**Required fields**: `type`, `measuredAt`, `valuePrimary`, `unit`
**Optional**: `valueSecondary`, `note`

**Response**: Created tracker object.

---

## 7. Nutrition

### 7.1 Get Nutrition Entries

```
GET /api/nutrition
```

**Requires**: Auth session

**Query Parameters**:
| Parameter   | Type   | Description |
|------------|--------|-------------|
| `startDate` | string | ISO date string — filter entries from this date |
| `endDate`   | string | ISO date string — filter entries until this date |

**Response**:
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "loggedAt": "2026-04-01T12:00:00.000Z",
    "mealName": "غداء",
    "calories": 650,
    "protein": 35.5,
    "carbs": 45.0,
    "fat": 20.0,
    "items": [
      { "name": "أرز", "quantity": 200, "unit": "غرام" },
      { "name": "دجاج مشوي", "quantity": 150, "unit": "غرام" }
    ],
    "createdAt": "2026-04-01T12:05:00.000Z"
  }
]
```

---

### 7.2 Add Nutrition Entry

```
POST /api/nutrition
```

**Requires**: Auth session

**Body**:
```json
{
  "loggedAt": "2026-04-01T12:00:00.000Z",
  "mealName": "غداء",
  "calories": 650,
  "protein": 35.5,
  "carbs": 45.0,
  "fat": 20.0,
  "items": [
    { "name": "أرز", "quantity": 200, "unit": "غرام" },
    { "name": "دجاج مشوي", "quantity": 150, "unit": "غرام" }
  ]
}
```

**Required**: `loggedAt`, `mealName`, `calories`
**Optional**: `protein`, `carbs`, `fat`, `items`

**Response**: Created nutrition entry object.

---

### 7.3 AI Nutrition Analysis

```
POST /api/nutrition/analyze
```

**Requires**: Auth session

Send meal data to get AI-powered nutritional analysis.

**Body**:
```json
{
  "mealName": "كبسة دجاج",
  "items": [
    { "name": "أرز بسمتي", "quantity": 300, "unit": "غرام" },
    { "name": "دجاج", "quantity": 200, "unit": "غرام" }
  ]
}
```

**Response**: AI-generated analysis with estimated nutritional values and recommendations.

---

## 8. AI Chat Assistant

Arabic-language health assistant powered by GPT. All endpoints require authentication.

### 8.1 Get Chat Sessions

```
GET /api/chat/sessions
```

**Requires**: Auth session

**Response**:
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "title": "استشارة عن الصداع",
    "createdAt": "2026-04-01T08:00:00.000Z",
    "updatedAt": "2026-04-01T09:00:00.000Z"
  }
]
```

---

### 8.2 Create Chat Session

```
POST /api/chat/sessions
```

**Requires**: Auth session

**Body**:
```json
{
  "title": "استشارة جديدة"
}
```

**Response**: Created session object.

---

### 8.3 Get Session Messages

```
GET /api/chat/sessions/:sessionId/messages
```

**Requires**: Auth session

**Response**:
```json
[
  {
    "id": "uuid",
    "sessionId": "uuid",
    "role": "user",
    "content": "ما أسباب الصداع المتكرر؟",
    "citations": [],
    "createdAt": "2026-04-01T08:01:00.000Z"
  },
  {
    "id": "uuid",
    "sessionId": "uuid",
    "role": "assistant",
    "content": "الصداع المتكرر قد يكون ناتجاً عن عدة أسباب...",
    "citations": [
      { "title": "Mayo Clinic - Headaches", "url": "https://..." }
    ],
    "createdAt": "2026-04-01T08:01:05.000Z"
  }
]
```

---

### 8.4 Send Message (Get AI Response)

```
POST /api/chat/messages
```

**Requires**: Auth session

**Body**:
```json
{
  "sessionId": "uuid",
  "content": "ما أسباب الصداع المتكرر؟"
}
```

**Response** `200`:
```json
{
  "userMessage": {
    "id": "uuid",
    "sessionId": "uuid",
    "role": "user",
    "content": "ما أسباب الصداع المتكرر؟",
    "citations": [],
    "createdAt": "2026-04-01T08:01:00.000Z"
  },
  "assistantMessage": {
    "id": "uuid",
    "sessionId": "uuid",
    "role": "assistant",
    "content": "الصداع المتكرر قد يكون ناتجاً عن...",
    "citations": [
      { "title": "Source Title", "url": "https://..." }
    ],
    "createdAt": "2026-04-01T08:01:05.000Z"
  }
}
```

**Note**: This endpoint may take 3-10 seconds as it calls the AI model. Show a loading indicator.

---

## 9. Data Models

### User

```typescript
{
  id: string;              // UUID
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;            // "subscriber" | "editor" | "super_admin" | etc.
  isActive: boolean;
  authProvider: string;    // "local" | "replit" | "admin"
  lastLoginAt: string | null;  // ISO timestamp
  createdAt: string;
  updatedAt: string;
}
```

### News

```typescript
{
  id: string;                    // UUID
  shortCode: string | null;      // 7-char alphanumeric (for short URLs)
  title: string;
  subtitle: string | null;
  summary: string | null;
  content: string;               // HTML content
  category: string;              // Category slug
  source: string | null;         // News source name
  sourceUrl: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  keywords: string[] | null;
  viewCount: number;
  todayViews: number;
  isTranslated: boolean;
  isFeatured: boolean;           // Shows in hero/carousel section
  isBreaking: boolean;           // Red highlight — breaking news
  status: string;                // "published" | "draft" | "scheduled" | "deleted"
  scheduledAt: string | null;    // ISO timestamp
  publishedAt: string;           // ISO timestamp
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Category

```typescript
{
  id: string;
  slug: string;            // "medical", "nutrition", "health", etc.
  nameAr: string;          // Arabic display name
  nameEn: string | null;   // English display name
  color: string;           // Tailwind color class (e.g., "emerald-600")
  icon: string | null;     // Lucide icon name
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Health Profile

```typescript
{
  id: string;
  userId: string;
  heightCm: number | null;
  weightKg: number | null;
  bloodType: string | null;   // "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"
  conditions: string[];        // ["ضغط الدم", "سكري"]
  medications: string[];
  allergies: string[];
  goals: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Tracker

```typescript
{
  id: string;
  userId: string;
  type: string;              // "blood_pressure" | "blood_sugar" | "weight" | "heart_rate"
  measuredAt: string;        // ISO timestamp
  valuePrimary: number;      // Main value
  valueSecondary: number | null;  // Secondary value (e.g., diastolic for BP)
  unit: string;              // "mmHg" | "mg/dL" | "kg" | "bpm"
  note: string | null;
  createdAt: string;
}
```

### Nutrition Entry

```typescript
{
  id: string;
  userId: string;
  loggedAt: string;          // ISO timestamp
  mealName: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  createdAt: string;
}
```

### Chat Session

```typescript
{
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Chat Message

```typescript
{
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  citations: Array<{
    title: string;
    url: string;
  }>;
  createdAt: string;
}
```

### Article

```typescript
{
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;           // Markdown content
  category: string;
  tags: string[];
  readTime: number;          // Minutes
  reviewedBy: string;
  medicalReviewDate: string | null;
  sources: Array<{
    title: string;
    url: string;
  }>;
  status: "draft" | "published";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## 10. Error Handling

All errors follow this format:
```json
{
  "message": "وصف الخطأ بالعربي"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created successfully |
| `400` | Bad request — validation error |
| `401` | Unauthorized — session expired or not logged in |
| `404` | Resource not found |
| `409` | Conflict — duplicate resource |
| `500` | Server error |

### Session Expiry

Sessions expire after **7 days**. When a `401` response is received:
1. Clear stored session data
2. Navigate user to login screen
3. After re-login, retry the failed request

---

## 11. Notes for Mobile Development

### Authentication Flow

1. Call `POST /api/auth/register` or `POST /api/auth/login`
2. Store the `connect.sid` cookie from the response `Set-Cookie` header
3. Send this cookie with every subsequent request in the `Cookie` header
4. On `401` responses, redirect to login
5. Call `POST /api/auth/logout` to end session

### Cookie Handling

```
Cookie: connect.sid=s%3A<session-value>
```

Most HTTP libraries (Alamofire, Retrofit, etc.) handle cookies automatically when configured with a cookie jar/storage.

### Recommended App Screens

| Screen | Endpoints Used |
|--------|---------------|
| **Splash/Login** | `GET /api/auth/user`, `POST /api/auth/login` |
| **Registration** | `POST /api/auth/register` |
| **Home/Feed** | `GET /api/news?page=1&perPage=20`, `GET /api/news/trending`, `GET /api/categories?active=true` |
| **News Detail** | `GET /api/news/:id`, `POST /api/news/:id/view`, `GET /api/news/:id/related` |
| **Search** | `GET /api/news?search=...&page=1` |
| **Category View** | `GET /api/news?category=medical&page=1` |
| **Articles** | `GET /api/articles`, `GET /api/articles/:slug` |
| **Health Profile** | `GET /api/health-profile`, `POST /api/health-profile` |
| **Trackers** | `GET /api/trackers?type=blood_pressure`, `POST /api/trackers` |
| **Nutrition** | `GET /api/nutrition`, `POST /api/nutrition`, `POST /api/nutrition/analyze` |
| **AI Chat** | `GET /api/chat/sessions`, `POST /api/chat/sessions`, `GET /api/chat/sessions/:id/messages`, `POST /api/chat/messages` |
| **Share** | `GET /api/share/news/:id` |

### Content Display

- **News content** is HTML — use a WebView or HTML renderer
- **Article content** is Markdown — use a Markdown renderer
- **All text is Arabic** — ensure RTL layout throughout the app
- **Font**: Use a quality Arabic font (IBM Plex Sans Arabic recommended, or system Arabic font)

### Short URL Support

For sharing, use short URLs: `https://capsulah.replit.app/n/{shortCode}`
These redirect to the full news page and are ideal for social sharing.

### Featured & Breaking News

- `isFeatured: true` — Display prominently (hero/carousel)
- `isBreaking: true` — Show with red highlight/badge indicating breaking news

### Pagination Pattern

For infinite scroll or pagination:
```
GET /api/news?page=1&perPage=20
GET /api/news?page=2&perPage=20
...
```

Response includes `total`, `page`, `totalPages` for UI pagination controls.

### Analytics

Call `POST /api/news/:id/view` when user opens an article. This is fire-and-forget — no need to handle the response.

### Offline Support Recommendations

- Cache the news list and categories locally
- Store the health profile locally for offline viewing
- Queue tracker and nutrition entries for sync when online
- Cache AI chat history locally

### Push Notifications (Future)

The API does not currently support push notifications. For breaking news alerts, consider polling `GET /api/news?page=1&perPage=5` periodically and checking for `isBreaking: true` items.

---

## API Endpoint Summary Table

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | No | Register new user |
| `POST` | `/api/auth/login` | No | Login |
| `POST` | `/api/auth/logout` | Yes | Logout |
| `GET` | `/api/auth/user` | Yes | Get current user |
| `GET` | `/api/news` | No | List news (with pagination/filter) |
| `GET` | `/api/news/trending` | No | Trending news (7 days) |
| `GET` | `/api/news/:id` | No | Single news item |
| `GET` | `/api/news/:id/related` | No | Related news |
| `GET` | `/api/news/keyword/:keyword` | No | Search by keyword |
| `POST` | `/api/news/:id/view` | No | Record page view |
| `GET` | `/api/n/:shortCode` | No | Resolve short URL |
| `GET` | `/api/share/news/:id` | No | Share metadata |
| `GET` | `/api/categories` | No | List categories |
| `GET` | `/api/articles` | No | List articles |
| `GET` | `/api/articles/:slug` | No | Single article |
| `GET` | `/api/health-profile` | Yes | Get health profile |
| `POST` | `/api/health-profile` | Yes | Create/update health profile |
| `GET` | `/api/trackers` | Yes | Get tracker readings |
| `POST` | `/api/trackers` | Yes | Add tracker reading |
| `GET` | `/api/nutrition` | Yes | Get nutrition entries |
| `POST` | `/api/nutrition` | Yes | Add nutrition entry |
| `POST` | `/api/nutrition/analyze` | Yes | AI nutrition analysis |
| `GET` | `/api/chat/sessions` | Yes | List chat sessions |
| `POST` | `/api/chat/sessions` | Yes | Create chat session |
| `GET` | `/api/chat/sessions/:id/messages` | Yes | Get chat messages |
| `POST` | `/api/chat/messages` | Yes | Send message (get AI reply) |
