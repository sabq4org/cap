# توثيق API - صحيفة كبسولة الصحية

## معلومات عامة

| البيان | القيمة |
|--------|--------|
| **الموقع الرسمي** | `https://capsulah.com` |
| **Base URL للـ API** | `https://capsulah.com/api` |
| **تنسيق البيانات** | JSON |
| **ترميز النصوص** | UTF-8 |
| **اللغة الرئيسية** | العربية |
| **التوقيت** | Asia/Riyadh (UTC+3) |

---

## نظام المصادقة

### أنواع الجلسات
- **مستخدمو التطبيق**: جلسة عبر Cookie (Session-based)
- **مسؤولو الإدارة**: جلسة عبر Cookie منفصلة
- يجب إرسال `credentials: "include"` في كل طلب

---

## ١. الأخبار (News) — متاحة للعموم

### جلب قائمة الأخبار
```
GET /api/news
```

**Query Parameters:**

| Parameter | النوع | الوصف | مثال |
|-----------|-------|-------|-------|
| `category` | string | تصفية بالتصنيف | `saudi-health` |
| `page` | integer | رقم الصفحة (مع pagination) | `1` |
| `perPage` | integer | عدد النتائج في الصفحة (افتراضي: 20) | `20` |
| `limit` | integer | حد النتائج بدون pagination (افتراضي: 50) | `50` |

**مثال الطلب:**
```
GET /api/news?category=saudi-health&page=1&perPage=20
```

**مثال الرد (مع pagination):**
```json
{
  "items": [
    {
      "id": "uuid-string",
      "shortCode": "AbC1234",
      "title": "عنوان الخبر",
      "subtitle": "العنوان الفرعي",
      "summary": "ملخص الخبر...",
      "content": "محتوى الخبر الكامل...",
      "category": "saudi-health",
      "source": "اسم المصدر",
      "sourceUrl": "https://...",
      "imageUrl": "https://...",
      "imageAlt": "وصف الصورة",
      "seoTitle": "عنوان SEO",
      "seoDescription": "وصف SEO",
      "keywords": ["كلمة1", "كلمة2"],
      "viewCount": 1250,
      "todayViews": 45,
      "isTranslated": false,
      "isFeatured": true,
      "status": "published",
      "publishedAt": "2026-03-11T10:00:00.000Z",
      "createdBy": "محمد الحيدر",
      "createdAt": "2026-03-11T09:30:00.000Z",
      "updatedAt": "2026-03-11T09:30:00.000Z"
    }
  ],
  "total": 7200,
  "page": 1,
  "perPage": 20,
  "totalPages": 360
}
```

**مثال الرد (بدون pagination):**
```json
[
  { ...news object... },
  { ...news object... }
]
```

---

### جلب خبر واحد بالـ ID
```
GET /api/news/:id
```

**مثال:**
```
GET /api/news/6f45cd43-d6b9-4071-9faf-a803b0ad5946
```

**الرد الكامل (تفاصيل الخبر):**
```json
{
  "id": "6f45cd43-d6b9-4071-9faf-a803b0ad5946",
  "shortCode": "AbC1234",
  "title": "وزارة الصحة تطلق حملة للكشف المبكر عن سرطان الثدي",
  "subtitle": "الحملة تستهدف النساء فوق سن الأربعين",
  "summary": "موجز ذكي مُولَّد بالذكاء الاصطناعي يلخّص أبرز نقاط الخبر في 2-3 جمل. هذا الحقل يظهر في بطاقة الخبر المختصرة ويُستخدم في meta description لمحركات البحث.",
  "content": "المحتوى الكامل للخبر...",
  "category": "saudi-health",
  "source": "وكالة الأنباء السعودية",
  "sourceUrl": "https://www.spa.gov.sa/...",
  "imageUrl": "https://www.spa.gov.sa/images/news.jpg",
  "imageAlt": "صورة تعبيرية لحملة الكشف المبكر",
  "seoTitle": "حملة وزارة الصحة للكشف المبكر عن سرطان الثدي 2026",
  "seoDescription": "وصف مُحسَّن لمحركات البحث يصف الخبر بشكل موجز",
  "keywords": ["سرطان", "صحة", "وزارة الصحة", "كشف مبكر"],
  "viewCount": 1250,
  "todayViews": 45,
  "isTranslated": false,
  "isFeatured": false,
  "status": "published",
  "scheduledAt": null,
  "deletedAt": null,
  "publishedAt": "2026-03-11T10:00:00.000Z",
  "createdBy": "محمد الحيدر",
  "createdAt": "2026-03-11T09:30:00.000Z",
  "updatedAt": "2026-03-11T09:30:00.000Z"
}
```

**تفصيل الحقول المهمة:**

| الحقل | الوصف |
|-------|-------|
| `id` | المعرّف الفريد UUID |
| `shortCode` | رمز قصير (7 أحرف) للروابط المختصرة |
| `title` | عنوان الخبر الرئيسي |
| `subtitle` | العنوان الفرعي (اختياري) |
| `summary` | **الموجز الذكي** — ملخص 2-3 جمل مُولَّد بالذكاء الاصطناعي |
| `content` | المحتوى الكامل (HTML أو نص) |
| `category` | slug التصنيف |
| `source` | اسم المصدر |
| `sourceUrl` | رابط الخبر الأصلي في المصدر |
| `imageUrl` | **صورة الخبر** — رابط مباشر للصورة |
| `imageAlt` | النص البديل للصورة |
| `seoTitle` | عنوان محسّن لمحركات البحث |
| `seoDescription` | وصف محسّن لمحركات البحث |
| `keywords` | مصفوفة الكلمات المفتاحية |
| `viewCount` | إجمالي المشاهدات الكلية |
| `todayViews` | عدد مشاهدات اليوم الحالي |
| `isTranslated` | هل الخبر مترجم من لغة أخرى |
| `isFeatured` | هل هو خبر مميّز (يظهر في البانر الرئيسي) |
| `status` | `published` \| `draft` \| `scheduled` \| `deleted` |
| `publishedAt` | تاريخ ووقت النشر |
| `createdBy` | اسم المحرر أو المصدر |

---

### جلب خبر بالرمز القصير
```
GET /api/n/:shortCode
```

**مثال:**
```
GET /api/n/AbC1234
```

الرمز القصير مكوّن من 7 أحرف وأرقام. يُستخدم للروابط القصيرة.

---

### تسجيل مشاهدة للخبر
```
POST /api/news/:id/view
```

استدعِ هذا الـ endpoint عند فتح الخبر في التطبيق لتحديث عداد المشاهدات.

**الرد:**
```json
{ "ok": true }
```

---

### البحث بكلمة مفتاحية
```
GET /api/news/keyword/:keyword
```

**مثال:**
```
GET /api/news/keyword/سرطان
```

**الرد:** مصفوفة من كائنات الأخبار.

---

### صورة الخبر الأصلية
حقل `imageUrl` في كائن الخبر يحتوي على رابط الصورة المباشرة للعرض داخل التطبيق.

```
GET {newsItem.imageUrl}
```

**ملاحظات:**
- قد يكون الرابط خارجياً (من موقع المصدر) أو داخلياً على `capsulah.com`
- يُنصح بعرض صورة بديلة عند فشل تحميل الصورة
- حقل `imageAlt` يحتوي على النص البديل للصورة (alt text)

---

### صورة Open Graph (للمشاركة الاجتماعية)
صورة مُولّدة آلياً بالذكاء الاصطناعي تحتوي على عنوان الخبر وشعار كبسولة، مناسبة للمشاركة على واتساب وتويتر وغيرها.

```
GET /og/:id
GET /og/:shortCode
GET /api/og-image/:id
```

**مثال بالـ ID:**
```
GET https://capsulah.com/og/6f45cd43-d6b9-4071-9faf-a803b0ad5946
```

**مثال بالرمز القصير:**
```
GET https://capsulah.com/og/AbC1234
```

**الرد:** صورة JPEG بحجم 1200×630 بكسل.

**كيفية بناء رابط الصورة في التطبيق:**
```
https://capsulah.com/og/{shortCode}?v={timestamp}
```
- استخدم `shortCode` إن توفّر وإلا استخدم `id`
- أضف `?v={updatedAt_timestamp}` لتجنب التخزين المؤقت القديم
- مثال: `https://capsulah.com/og/AbC1234?v=1741694400`

---

### صفحة المشاركة الاجتماعية
صفحة HTML جاهزة تحتوي على جميع وسوم Open Graph وتُعيد توجيه المستخدم تلقائياً إلى الخبر.

```
GET /api/share/news/:id
```

**مثال:**
```
GET https://capsulah.com/api/share/news/6f45cd43-d6b9-4071-9faf-a803b0ad5946
```

**الاستخدام:** عند مشاركة رابط الخبر في واتساب أو تويتر أو تلغرام، استخدم هذا الرابط بدلاً من الرابط المباشر للخبر حتى تظهر الصورة والعنوان بشكل صحيح.

**يحتوي الرد على:**
- `og:title` — عنوان الخبر
- `og:description` — ملخص الخبر
- `og:image` — صورة OG (1200×630)
- `og:url` — الرابط الكامل للخبر
- `twitter:card` — بطاقة تويتر كبيرة
- إعادة توجيه تلقائية للخبر

---

### الصور المُولّدة بالذكاء الاصطناعي للخبر
يمكن أن يكون للخبر صورة مولّدة بالذكاء الاصطناعي (Nano Banana 2 / Gemini) مرتبطة به.

```
GET /api/admin/generation/images?newsId=:newsId
```

**الرد:**
```json
[
  {
    "id": "uuid",
    "newsId": "uuid",
    "prompt": "النص المستخدم لتوليد الصورة",
    "revisedPrompt": "النص المعدّل من النموذج",
    "generationType": "realistic",
    "quality": "hd",
    "size": "1024x1024",
    "model": "gemini-3.1-flash-image-preview",
    "status": "completed",
    "imageUrl": "https://storage.capsulah.com/...",
    "objectStoragePath": "public/news-images/...",
    "generationTimeMs": 8500,
    "createdAt": "2026-03-11T10:00:00.000Z",
    "completedAt": "2026-03-11T10:00:08.000Z"
  }
]
```

**حالات status:**
- `pending` — في الانتظار
- `generating` — قيد التوليد
- `completed` — اكتمل (imageUrl متاح)
- `failed` — فشل (errorMessage يحتوي السبب)

---

## ٢. التصنيفات (Categories) — متاحة للعموم

### جلب قائمة التصنيفات
```
GET /api/categories
```

**Query Parameters:**

| Parameter | النوع | الوصف |
|-----------|-------|-------|
| `active` | boolean | `true` لجلب التصنيفات النشطة فقط |

**مثال الرد:**
```json
[
  {
    "id": "uuid-string",
    "slug": "saudi-health",
    "nameAr": "الصحة السعودية",
    "description": "أخبار الصحة في المملكة العربية السعودية",
    "color": "#2E7D32",
    "icon": "hospital",
    "isActive": true,
    "sortOrder": 1,
    "newsCount": 450,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
]
```

**قائمة التصنيفات الرئيسية:**

| Slug | الاسم العربي |
|------|-------------|
| `saudi-health` | الصحة السعودية |
| `medical` | طبي |
| `health` | صحة |
| `pharmaceutical` | صيدلانيات |
| `nutrition` | تغذية |
| `awareness` | توعية |
| `conference` | مؤتمرات |
| `arab-news` | أخبار عربية |
| `health-news` | أخبار صحية |

---

## ٣. مصادقة المستخدمين (User Auth)

### تسجيل حساب جديد
```
POST /api/auth/register
```

**Body:**
```json
{
  "firstName": "اسم المستخدم",
  "lastName": "اسم العائلة",
  "email": "user@example.com",
  "password": "كلمة المرور (6 أحرف على الأقل)"
}
```

**رد النجاح (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "اسم",
  "lastName": "عائلة",
  "role": "subscriber"
}
```

**رد الخطأ (400):**
```json
{ "message": "رسالة الخطأ" }
```

---

### تسجيل الدخول
```
POST /api/auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "كلمة المرور"
}
```

**رد النجاح (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "اسم",
  "lastName": "عائلة",
  "role": "subscriber",
  "profileImageUrl": null
}
```

---

### جلب المستخدم الحالي
```
GET /api/auth/user
```

يتطلب جلسة مفعّلة.

**رد النجاح (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "اسم",
  "lastName": "عائلة",
  "role": "subscriber",
  "profileImageUrl": "https://...",
  "isActive": true,
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

**رد إذا لم يكن مسجلاً (401):**
```json
{ "message": "Unauthorized" }
```

---

### تسجيل الخروج
```
POST /api/auth/logout
```

**الرد:**
```json
{ "message": "Logged out successfully" }
```

---

## ٤. الملف الصحي (Health Profile) — يتطلب تسجيل دخول

### جلب الملف الصحي
```
GET /api/health-profile
```

**رد النجاح (200):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "heightCm": 175,
  "weightKg": 70.5,
  "bloodType": "A+",
  "conditions": ["السكري", "ضغط الدم"],
  "medications": ["ميتفورمين"],
  "allergies": ["البنسلين"],
  "goals": ["إنقاص الوزن"],
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-03-01T00:00:00.000Z"
}
```

**إذا لم يكن موجوداً (404):**
```json
{ "message": "Health profile not found" }
```

---

### إنشاء/تحديث الملف الصحي
```
POST /api/health-profile
```

**Body:**
```json
{
  "heightCm": 175,
  "weightKg": 70.5,
  "bloodType": "A+",
  "conditions": ["السكري"],
  "medications": ["ميتفورمين"],
  "allergies": ["البنسلين"],
  "goals": ["إنقاص الوزن", "ممارسة الرياضة"]
}
```

جميع الحقول اختيارية.

---

## ٥. المؤشرات الصحية (Trackers) — يتطلب تسجيل دخول

### جلب المؤشرات الصحية
```
GET /api/trackers
```

**Query Parameters:**

| Parameter | النوع | الوصف |
|-----------|-------|-------|
| `type` | string | نوع المؤشر |
| `limit` | integer | عدد النتائج |

**مثال الرد:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "type": "blood_pressure",
    "value": 120,
    "value2": 80,
    "unit": "mmHg",
    "notes": "قياس صباحي",
    "recordedAt": "2026-03-11T08:00:00.000Z",
    "createdAt": "2026-03-11T08:00:00.000Z"
  }
]
```

**أنواع المؤشرات المتاحة (type):**

| النوع | الوصف | الوحدة | قيمة ثانية |
|-------|-------|--------|------------|
| `blood_pressure` | ضغط الدم | mmHg | الضغط الانبساطي |
| `blood_sugar` | سكر الدم | mg/dL | - |
| `weight` | الوزن | kg | - |
| `heart_rate` | معدل ضربات القلب | bpm | - |
| `temperature` | درجة الحرارة | °C | - |
| `oxygen_saturation` | تشبع الأكسجين | % | - |
| `steps` | عدد الخطوات | خطوة | - |
| `sleep` | ساعات النوم | ساعة | - |
| `water` | كمية الماء | مل | - |

---

### إضافة مؤشر صحي
```
POST /api/trackers
```

**Body:**
```json
{
  "type": "blood_pressure",
  "value": 120,
  "value2": 80,
  "unit": "mmHg",
  "notes": "قياس صباحي",
  "recordedAt": "2026-03-11T08:00:00.000Z"
}
```

---

## ٦. تتبع التغذية (Nutrition) — يتطلب تسجيل دخول

### جلب سجلات التغذية
```
GET /api/nutrition
```

**مثال الرد:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "mealType": "breakfast",
    "foodName": "بيض مسلوق",
    "calories": 155,
    "protein": 13,
    "carbs": 1.1,
    "fat": 11,
    "fiber": 0,
    "sodium": 124,
    "servingSize": "2 بيضة",
    "notes": "مع قطعة خبز",
    "loggedAt": "2026-03-11T07:30:00.000Z",
    "createdAt": "2026-03-11T07:30:00.000Z"
  }
]
```

**أنواع الوجبات (mealType):**
- `breakfast` - إفطار
- `lunch` - غداء
- `dinner` - عشاء
- `snack` - وجبة خفيفة

---

### إضافة سجل تغذية
```
POST /api/nutrition
```

**Body:**
```json
{
  "mealType": "breakfast",
  "foodName": "بيض مسلوق",
  "calories": 155,
  "protein": 13,
  "carbs": 1.1,
  "fat": 11,
  "fiber": 0,
  "sodium": 124,
  "servingSize": "2 بيضة",
  "notes": "",
  "loggedAt": "2026-03-11T07:30:00.000Z"
}
```

---

### تحليل الوجبة بالذكاء الاصطناعي
```
POST /api/nutrition/analyze
```

**Body:**
```json
{
  "foodDescription": "وجبة غداء: رز مع دجاج مشوي وسلطة"
}
```

**الرد:**
```json
{
  "analysis": "...",
  "estimatedCalories": 650,
  "protein": 45,
  "carbs": 60,
  "fat": 15,
  "recommendations": ["..."]
}
```

---

## ٧. المساعد الصحي الذكي (Chat) — يتطلب تسجيل دخول

### جلب جلسات المحادثة
```
GET /api/chat/sessions
```

**الرد:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "title": "استشارة صحية",
    "summary": "...",
    "createdAt": "2026-03-11T10:00:00.000Z",
    "updatedAt": "2026-03-11T10:30:00.000Z"
  }
]
```

---

### إنشاء جلسة محادثة جديدة
```
POST /api/chat/sessions
```

**Body:**
```json
{
  "title": "استشارة حول ضغط الدم"
}
```

---

### جلب رسائل جلسة
```
GET /api/chat/sessions/:sessionId/messages
```

**الرد:**
```json
[
  {
    "id": "uuid",
    "sessionId": "uuid",
    "role": "user",
    "content": "ما هي أسباب ارتفاع ضغط الدم؟",
    "createdAt": "2026-03-11T10:00:00.000Z"
  },
  {
    "id": "uuid",
    "sessionId": "uuid",
    "role": "assistant",
    "content": "ارتفاع ضغط الدم له أسباب عديدة...",
    "citations": [{"title": "...", "url": "..."}],
    "createdAt": "2026-03-11T10:00:05.000Z"
  }
]
```

**قيم role:** `user` | `assistant`

---

### إرسال رسالة
```
POST /api/chat/messages
```

**Body:**
```json
{
  "sessionId": "uuid-of-session",
  "content": "ما هي أسباب ارتفاع ضغط الدم؟"
}
```

**الرد:** كائن الرسالة مع رد المساعد الذكي.

---

### تحليل الأعراض
```
POST /api/symptoms/analyze
```

**Body:**
```json
{
  "symptoms": ["صداع", "حرارة", "إرهاق"],
  "duration": "3 أيام",
  "severity": "متوسطة"
}
```

---

## ٨. الإحصائيات العامة

### إحصائيات الموقع
```
GET /api/admin/stats
```

**الرد:**
```json
{
  "totalNews": 7200,
  "todayNews": 15,
  "totalUsers": 1240,
  "totalViews": 95000
}
```

---

## ٩. SEO — محركات البحث

### حقول SEO في الخبر

كل خبر يحتوي على حقلين مخصصين لمحركات البحث:

| الحقل | الاستخدام | الحد الأقصى |
|-------|-----------|-------------|
| `seoTitle` | عنوان `<title>` في صفحة الخبر | 60-70 حرف |
| `seoDescription` | وصف `<meta name="description">` | 150-160 حرف |

**مثال الاستخدام في التطبيق:**
- عند مشاركة الخبر يُستخدم `seoTitle` كعنوان البطاقة
- `seoDescription` يُعرض كوصف مختصر تحت العنوان
- إذا كان `seoTitle` فارغاً، استخدم `title` بديلاً عنه
- إذا كان `seoDescription` فارغاً، استخدم `summary` بديلاً عنه

**الأولوية في العرض:**
```
عنوان الخبر     → seoTitle  ?? title
وصف الخبر       → seoDescription ?? summary ?? subtitle
صورة المشاركة   → imageUrl (OG image)
رابط الخبر      → https://capsulah.com/n/{shortCode}
```

---

### Sitemap XML
يحتوي على روابط جميع الأخبار المنشورة (آخر 5000 خبر) وصفحات الموقع الثابتة.

```
GET https://capsulah.com/sitemap.xml
```

**الاستجابة:** XML بصيغة Sitemap Protocol 0.9

**مثال على محتوى الـ Sitemap:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- صفحات ثابتة -->
  <url>
    <loc>https://capsulah.com</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://capsulah.com/news</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://capsulah.com/news?category=health-news</loc>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://capsulah.com/news?category=nutrition</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- أخبار (تتكرر لكل خبر منشور) -->
  <url>
    <loc>https://capsulah.com/n/AbC1234</loc>
    <lastmod>2026-03-11</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

</urlset>
```

**ملاحظات:**
- يُحدَّث فور نشر خبر جديد
- التخزين المؤقت: ساعة واحدة (`Cache-Control: public, max-age=3600`)
- يستخدم الرابط القصير `shortCode` إن توفّر

---

### Robots.txt
```
GET https://capsulah.com/robots.txt
```

**المحتوى:**
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://capsulah.com/sitemap.xml
```

**المعنى:**
- بوتات الزحف مسموح لها بفهرسة كل الصفحات
- لوحة التحكم `/admin` ممنوعة من الفهرسة
- مسارات API `/api/` ممنوعة من الفهرسة
- رابط Sitemap مُضمَّن للاكتشاف التلقائي

---

### Canonical URL لكل خبر

الرابط الأساسي (Canonical) لكل خبر هو دائماً:
```
https://capsulah.com/n/{shortCode}       ← إذا كان shortCode متاحاً
https://capsulah.com/news/{id}           ← بديل إذا لم يكن shortCode متاحاً
```

**ملاحظة:** جميع الروابط القديمة وروابط المشاركة تُعيد التوجيه تلقائياً إلى الرابط الـ Canonical.

---

### Open Graph + Twitter Cards (لكل خبر)

عند فتح رابط `https://capsulah.com/api/share/news/{id}` تُولَّد هذه الوسوم تلقائياً:

```html
<!-- Open Graph -->
<meta property="og:type"         content="article">
<meta property="og:site_name"    content="كبسولة">
<meta property="og:title"        content="{seoTitle ?? title}">
<meta property="og:description"  content="{summary ?? seoDescription}">
<meta property="og:image"        content="https://capsulah.com/og/{shortCode ?? id}?v={timestamp}">
<meta property="og:image:width"  content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type"   content="image/jpeg">
<meta property="og:url"          content="https://capsulah.com/n/{shortCode}">
<meta property="og:locale"       content="ar_SA">
<meta property="article:published_time" content="{publishedAt ISO8601}">

<!-- Twitter Cards -->
<meta name="twitter:card"        content="summary_large_image">
<meta name="twitter:site"        content="@capsulah_sa">
<meta name="twitter:title"       content="{seoTitle ?? title}">
<meta name="twitter:description" content="{summary ?? seoDescription}">
<meta name="twitter:image"       content="https://capsulah.com/og/{shortCode ?? id}?v={timestamp}">
<meta name="twitter:image:alt"   content="{title}">
```

**الاستخدام في التطبيق:** عند مشاركة خبر على واتساب أو تلغرام، أرسل رابط `share/news/{id}` وليس رابط الخبر مباشرة — سيُعيد التوجيه تلقائياً للخبر بعد أن تُحمَّل الصورة والعنوان بشكل صحيح.

---

## ١٠. مصادقة المسؤولين (Admin Auth)

> ⚠️ هذه النقاط للاستخدام الداخلي فقط — لوحة تحكم الصحيفة.

### تسجيل دخول المسؤول
```
POST /api/admin/login
```

**Body:**
```json
{
  "username": "admin",
  "password": "كلمة_المرور"
}
```

**رد النجاح:**
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "role": "super_admin"
}
```

---

### التحقق من جلسة المسؤول
```
GET /api/admin/check-session
```

**رد النجاح:**
```json
{
  "authenticated": true,
  "role": "super_admin",
  "permissions": ["*"],
  "displayName": "محمد الحيدر"
}
```

**أدوار المسؤولين:**

| الدور | الوصف |
|-------|-------|
| `super_admin` | مدير النظام - صلاحيات كاملة |
| `editor` | محرر - نشر وتحرير الأخبار |

---

### تسجيل خروج المسؤول
```
POST /api/admin/logout
```

---

## ١١. إدارة الأخبار (Admin) — يتطلب مصادقة مسؤول

### جلب الأخبار (لوحة التحكم)
```
GET /api/admin/news
```

**Query Parameters:**

| Parameter | النوع | الوصف |
|-----------|-------|-------|
| `page` | integer | رقم الصفحة |
| `perPage` | integer | عدد في الصفحة |
| `status` | string | `published` \| `draft` \| `scheduled` \| `deleted` |
| `category` | string | slug التصنيف |
| `search` | string | بحث في العنوان |
| `sortBy` | string | `publishedAt` \| `viewCount` \| `createdAt` |
| `sortOrder` | string | `asc` \| `desc` |

---

### إضافة خبر
```
POST /api/news
```

**Body:**
```json
{
  "title": "عنوان الخبر",
  "subtitle": "العنوان الفرعي",
  "content": "محتوى الخبر الكامل بصيغة HTML أو نص عادي",
  "summary": "ملخص قصير",
  "category": "saudi-health",
  "source": "اسم المصدر",
  "imageUrl": "https://...",
  "imageAlt": "وصف الصورة",
  "seoTitle": "عنوان SEO",
  "seoDescription": "وصف SEO",
  "keywords": ["كلمة1", "كلمة2"],
  "publishedAt": "2026-03-11T10:00:00.000Z",
  "status": "published",
  "isFeatured": false
}
```

**حقول الـ status:**
- `published` - منشور فوراً
- `draft` - مسودة
- `scheduled` - مجدول (يتطلب `scheduledAt`)

---

### تعديل خبر
```
PATCH /api/news/:id
```

**Body:** نفس حقول إضافة الخبر (جزئي أو كامل).

---

### حذف خبر (نقل للسلة)
```
POST /api/admin/news/:id/trash
```

### استعادة خبر من السلة
```
POST /api/admin/news/:id/restore
```

### حذف نهائي
```
DELETE /api/admin/news/:id/permanent
```

### حذف متعدد
```
POST /api/admin/news/bulk-delete
```

**Body:**
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"],
  "permanent": false
}
```

---

## ١٢. هيكل بيانات الخبر الكامل (News Object)

```json
{
  "id": "6f45cd43-d6b9-4071-9faf-a803b0ad5946",
  "shortCode": "AbC1234",
  "title": "عنوان الخبر الصحي",
  "subtitle": "العنوان الفرعي",
  "summary": "ملخص قصير للخبر لا يتجاوز 500 حرف",
  "content": "محتوى الخبر الكامل...",
  "category": "saudi-health",
  "source": "وكالة الأنباء السعودية",
  "sourceUrl": "https://www.spa.gov.sa/...",
  "imageUrl": "https://capsulah.com/images/...",
  "imageAlt": "وصف تفصيلي للصورة",
  "seoTitle": "عنوان محسّن لمحركات البحث",
  "seoDescription": "وصف محسّن لمحركات البحث",
  "keywords": ["صحة", "سعودية", "طب"],
  "viewCount": 1250,
  "todayViews": 45,
  "isTranslated": false,
  "isFeatured": true,
  "status": "published",
  "scheduledAt": null,
  "deletedAt": null,
  "publishedAt": "2026-03-11T10:00:00.000Z",
  "createdBy": "محمد الحيدر",
  "createdAt": "2026-03-11T09:30:00.000Z",
  "updatedAt": "2026-03-11T09:30:00.000Z"
}
```

---

## ١٣. رموز الاستجابة (HTTP Status Codes)

| الكود | المعنى |
|-------|--------|
| `200` | نجاح |
| `201` | تم الإنشاء |
| `304` | لم يتغير (cached) |
| `400` | خطأ في البيانات المرسلة |
| `401` | غير مصرح (يتطلب تسجيل دخول) |
| `403` | ممنوع (صلاحيات غير كافية) |
| `404` | العنصر غير موجود |
| `500` | خطأ في الخادم |

---

## ١٤. ملاحظات تقنية للمطوّر

### الصور
- صور الأخبار: يمكن أن تكون روابط خارجية أو مستضافة على الموقع
- صورة OG للمشاركة: `GET https://capsulah.com/og/{newsId}` — تُعيد صورة PNG
- الأيقونات والشعار: `https://capsulah.com/favicon.ico`

### الروابط القصيرة
- كل خبر له رمز مختصر من 7 أحرف (مثال: `AbC1234`)
- رابط الخبر القصير: `https://capsulah.com/n/{shortCode}`
- API: `GET /api/n/{shortCode}`

### الصفحة الكاملة للخبر
- `https://capsulah.com/{year}/{slug}` — مثال: `https://capsulah.com/2026/health-news-title`
- أو بالـ ID: `https://capsulah.com/news/{id}`

### التوقيت
- جميع الـ timestamps بصيغة ISO 8601 بتوقيت UTC
- لعرضها بالتوقيت السعودي: أضف 3 ساعات (UTC+3)

### Pagination
عند استخدام `page` و`perPage`، يكون الرد:
```json
{
  "items": [...],
  "total": 7200,
  "page": 1,
  "perPage": 20,
  "totalPages": 360
}
```

### التخزين المؤقت (Caching)
- قائمة الأخبار: يُنصح بالتحديث كل 5 دقائق
- تفاصيل الخبر: يُنصح بالتحديث كل 30 دقيقة
- التصنيفات: يُنصح بالتحديث كل ساعة

### فلترة الأخبار للتطبيق
للحصول على الأخبار المنشورة فقط، استخدم:
```
GET /api/news?page=1&perPage=20
```
الأخبار المُعادة تكون منشورة (`status=published`) تلقائياً في الـ API العام.

---

## ١٥. مثال عملي - تدفق قراءة الأخبار في التطبيق

```
1. عند فتح التطبيق:
   GET /api/categories?active=true       ← جلب التصنيفات
   GET /api/news?page=1&perPage=20       ← أخبار الصفحة الرئيسية

2. عند الضغط على تصنيف:
   GET /api/news?category=saudi-health&page=1&perPage=20

3. عند الضغط على خبر:
   GET /api/news/{id}                    ← تفاصيل الخبر
   POST /api/news/{id}/view              ← تسجيل المشاهدة (fire & forget)

4. عند المشاركة:
   رابط المشاركة: https://capsulah.com/n/{shortCode}
   صورة المشاركة: https://capsulah.com/og/{id}

5. تحديث الصفحة الرئيسية (Pull to Refresh):
   GET /api/news?page=1&perPage=20
```

---

## ١٦. مثال عملي - تدفق المستخدم المسجّل

```
1. تسجيل الدخول:
   POST /api/auth/login

2. جلب بيانات المستخدم:
   GET /api/auth/user

3. عرض الملف الصحي:
   GET /api/health-profile

4. إضافة مؤشر ضغط دم:
   POST /api/trackers
   Body: { "type": "blood_pressure", "value": 120, "value2": 80, "unit": "mmHg" }

5. سؤال المساعد الذكي:
   POST /api/chat/sessions     ← إنشاء جلسة
   POST /api/chat/messages     ← إرسال السؤال

6. تسجيل الخروج:
   POST /api/auth/logout
```
