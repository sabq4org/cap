# كبسولة (Capsulah) — دليل واجهات الـ API لبناء تطبيق iOS

> هذا الملف مرجع متكامل لبرمجة تطبيق iOS يستهلك واجهات موقع كبسولة.
> الموقع منصّة أخبار صحية عربية (RTL) مبنية على Express + PostgreSQL.

---

## 1. معلومات أساسية

| العنصر | القيمة |
|---|---|
| **Base URL (الإنتاج)** | `https://capsulah.com` |
| **صيغة البيانات** | JSON (`Content-Type: application/json`) |
| **اللغة / الاتجاه** | عربي، RTL |
| **الترميز** | UTF-8 |

كل المسارات تبدأ بـ `/api/` ماعدا مسارات خدمية (`/og/:id`, `/sitemap.xml`, `/robots.txt`).

---

## 2. المصادقة (Authentication) — مهم جداً

الخادم **يعتمد على جلسات (Sessions) عبر الكوكيز** وليس على Bearer Token / JWT.
اسم الكوكي: **`connect.sid`** (HTTP-only). لا يوجد توكن يُرسل في الهيدر.

### تبعات ذلك على iOS
- استخدم `URLSession` مع `HTTPCookieStorage` (السلوك الافتراضي يحفظ الكوكي تلقائياً)، أو `URLSessionConfiguration` مع `httpCookieAcceptPolicy = .always`.
- بعد تسجيل الدخول، الكوكي يُحفظ ويُرسل تلقائياً مع كل طلب لاحق طوال مدة الجلسة (7 أيام).
- **الطريقة المناسبة للتطبيق الأصلي (native) هي تسجيل الدخول المحلي بالبريد وكلمة المرور** لأنه يرجع JSON مباشرة. أما تسجيل دخول Replit (OIDC) فيتطلب متصفح (استخدم `ASWebAuthenticationSession` إن أردته).

### 2.1 التسجيل المحلي (بريد + كلمة مرور)
```
POST /api/auth/register
Body: { "email": "a@b.com", "password": "••••••", "firstName": "اسم", "lastName": "العائلة" }
201 → { "id", "email", "firstName", "lastName", "role" }
```

### 2.2 تسجيل الدخول المحلي
```
POST /api/auth/login
Body: { "email": "a@b.com", "password": "••••••" }
200 → { "id", "email", "firstName", "lastName", "role" }
(يُضبط الكوكي connect.sid في الرد)
```

### 2.3 تسجيل الخروج
```
POST /api/auth/logout
200 → { "success": true }  (يمسح الكوكي)
```

### 2.4 تسجيل دخول Replit (OIDC) — اختياري، يحتاج متصفح
```
GET /api/login      → يبدأ تدفّق OIDC (redirect)
GET /api/callback   → يعالج الرجوع، ثم redirect إلى /
GET /api/logout     → إنهاء جلسة OIDC
```

### 2.5 المستخدم الحالي
```
GET /api/auth/user   (يتطلب جلسة)
200 → كائن المستخدم (User) — انظر النماذج
401 → غير مسجّل دخول
```

> **ملاحظة:** أغلب محتوى القراءة (الأخبار، المقالات، الأدوية، الشائعات، الإعلانات، التصنيفات) **عام لا يحتاج مصادقة**. المصادقة مطلوبة فقط لميزات المستخدم (الملف الصحي، المؤشرات، التغذية، المحادثة، خلاصة الكبسولة الشخصية).

---

## 3. نقاط النهاية العامة (بدون مصادقة)

### 3.1 الأخبار

| الطريقة | المسار | الوصف |
|---|---|---|
| GET | `/api/news` | قائمة الأخبار |
| GET | `/api/news?category={slug}` | تصفية حسب التصنيف |
| GET | `/api/news?search={q}` | بحث (يتطلب page) |
| GET | `/api/news?page=1&perPage=20` | صفحات (paginated) |
| GET | `/api/news?limit=50` | تحديد العدد (بدون page) |
| GET | `/api/news/trending?limit=10` | الأكثر تداولاً (حد أقصى 20) |
| GET | `/api/news/:id` | خبر واحد بالمعرّف |
| GET | `/api/n/:shortCode` | خبر واحد بالرمز القصير (JSON) |
| GET | `/api/news/:id/related` | أخبار ذات صلة |
| GET | `/api/news/keyword/:keyword` | أخبار حسب كلمة مفتاحية |
| POST | `/api/news/:id/view` | تسجيل مشاهدة (اختياري في الرد `{ok:true}`) |

**شكل الرد لـ `/api/news` (قائمة مسطحة):** مصفوفة من كائنات `News`.

**شكل الرد المُصفّح (عند تمرير `page`):**
```json
{ "news": [ /* News[] */ ], "total": 1234, "page": 1, "totalPages": 62 }
```

مثال طلب تسجيل مشاهدة (اختياري لكن مفيد للإحصاءات):
```
POST /api/news/:id/view
Body: { "referrer": "", "utmSource": "", "utmMedium": "", "utmCampaign": "" }
```

### 3.2 التصنيفات
```
GET /api/categories            → كل التصنيفات
GET /api/categories?active=true → التصنيفات المفعّلة فقط
200 → Category[]
```

### 3.3 المقالات الطبية
```
GET /api/articles                 → Article[] (المنشورة)
GET /api/articles?category={slug} → تصفية
GET /api/articles?limit=20        → تحديد العدد
GET /api/articles/:slug           → مقال واحد بالـ slug
```

### 3.4 دليل الأدوية
```
GET  /api/drugs?limit=20      → قائمة الأدوية (حد أقصى 50)
GET  /api/drugs/search?q=...  → بحث في الأدوية → Drug[]
GET  /api/drugs/:id           → دواء واحد (ويزيد عدّاد المشاهدة)
POST /api/drugs/generate      → توليد معلومات دواء بالذكاء الاصطناعي
     Body: { "name": "اسم الدواء" }   (rate limit: 10/دقيقة)
```

### 3.5 تفنيد الشائعات (Rumors / Debunk)
```
GET  /api/rumors/published?limit=10 → الشائعات المنشورة (Rumor[])
GET  /api/rumors/:id                → شائعة واحدة (بدون editorNotes)
POST /api/rumors/:id/view           → تسجيل مشاهدة → { success }
GET  /api/rumors/cta/total          → إجمالي نقرات زر الشائعات
```

### 3.6 الإعلانات (Ads)
```
GET  /api/ads/active/:position → الإعلانات النشطة لموضع معيّن
     المواضع: above_featured | below_featured | news_sidebar
POST /api/ads/:id/click        → تسجيل نقرة على إعلان
```

### 3.7 الكُتّاب (Authors)
```
GET  /api/authors            → قائمة الكُتّاب المعتمدين
GET  /api/authors/:slug      → كاتب واحد
POST /api/authors/register   → تقديم طلب انضمام كاتب (rate limited)
POST /api/authors/upload-url → رابط رفع صورة (rate limited)
GET  /api/author-image/:objectId → صورة الكاتب
```

### 3.8 مشاركة اجتماعية / صور OG
```
GET /api/share/news/:id → صفحة HTML بميتا للمشاركة
GET /og/:id             → صورة Open Graph للخبر
```

---

## 4. نقاط النهاية للمستخدم المسجّل (تتطلب جلسة)

### 4.1 خلاصة الكبسولة الشخصية والاهتمامات
```
GET /api/capsule/interests → { "interests": string[] }
PUT /api/capsule/interests
    Body: { "interests": ["heart","nutrition",...] } → { "interests": [...] }
GET /api/capsule/feed?page=1&perPage=20 → خلاصة مخصّصة (أخبار + مقالات)
```

### 4.2 الملف الصحي
```
GET  /api/health-profile → HealthProfile | null
POST /api/health-profile → إنشاء/تحديث (upsert)
     Body (اختياري الحقول): { heightCm, weightKg, bloodType, conditions[], medications[], allergies[], goals[] }
```

### 4.3 مؤشرات القياس (Trackers)
```
GET  /api/trackers?type={type}&limit=50 → Tracker[]
POST /api/trackers
     Body: { type, valuePrimary, valueSecondary?, unit, measuredAt?, note? }
```
أمثلة `type`: ضغط الدم، سكر الدم، الوزن، معدل ضربات القلب... (`valuePrimary` رقم، `unit` نص).

### 4.4 التغذية (Nutrition)
```
GET  /api/nutrition             → NutritionEntry[]
POST /api/nutrition
     Body: { mealName, calories, protein?, carbs?, fat?, items?[], loggedAt? }
POST /api/nutrition/analyze     → تحليل وجبة بالذكاء الاصطناعي
     Body: { description: "وصف الوجبة" }
```

### 4.5 المساعد الصحي الذكي (Chat)
```
GET  /api/chat/sessions                        → جلسات المحادثة للمستخدم
POST /api/chat/sessions                         → إنشاء جلسة { title? }
GET  /api/chat/sessions/:sessionId/messages     → رسائل الجلسة
POST /api/chat/messages
     Body: { "sessionId": "...", "content": "سؤال المستخدم" }
     200 → { userMessage, assistantMessage, tldr }
           assistantMessage.citations: [{ title, url }]
```

### 4.6 فحص الأعراض
```
POST /api/symptoms/analyze
     Body: { symptoms/description ... } → تحليل بالذكاء الاصطناعي
```

---

## 5. نماذج البيانات (Data Models)

> الحقول بدون علامة = قد تكون null. المفاتيح كلها `varchar` UUID ما لم يُذكر خلافه.

### News (خبر)
```
id, shortCode(unique, 7 حروف), title*, subtitle, summary, content*,
category*, source, sourceUrl, imageUrl, imageAlt, seoTitle, seoDescription,
keywords: string[], viewCount* (int), todayViews* (int), todayViewsDate,
isTranslated(bool), isFeatured(bool), isBreaking(bool), status* ("published"),
scheduledAt, deletedAt, publishedAt* (timestamp),
socialContentGenerated(bool), socialContentGeneratedAt,
createdBy, createdAt, updatedAt
(* = مطلوب/غير فارغ)
```

### Article (مقال طبي)
```
id, slug*(unique), title*, excerpt*, content*, category*,
tags: string[], readTime* (int), reviewedBy*, author, imageUrl, imageAlt,
seoTitle, seoDescription, keywords: string[], medicalReviewDate,
sources: {title,url}[], status* ("draft"|"published"), scheduledAt, publishedAt,
socialContentGenerated, socialContentGeneratedAt, socialContentData,
createdAt, updatedAt
```

### Category (تصنيف)
```
id, slug*(unique), nameAr*, nameEn, color* ("emerald-600"),
icon, description, sortOrder(int), isActive(bool), createdAt, updatedAt
```

### Drug (دواء)
```
id, nameAr*, nameEn, genericName, category, description,
uses: string[], sideEffects: string[], contraindications: string[],
dosage, warnings: string[], interactions: string[], pregnancy, storage,
aiGenerated(bool), viewCount* (int), createdAt, updatedAt
```

### Rumor (شائعة) — جدول rumor_submissions
```
id, rumorText*, sourcePlatform* ("other"), sourceUrl,
status* ("pending"|...), aiResponse: { verdict, explanation, shortSummary, sources },
editorNotes (لا يُرجع للعموم), publishedNewsId, viewCount* (int),
createdAt, updatedAt
```

### Author (كاتب)
```
id, slug*(unique), fullName*, email*(unique), phone, profileImageUrl,
bio*, specialty*, jobTitle, qualification, organization, yearsExperience(int),
twitterUrl, linkedinUrl, websiteUrl, credentialsImageUrl,
status* ("pending"|"approved"|...), reviewNotes, reviewedBy, reviewedAt,
articleCount* (int), createdAt, updatedAt
```

### Ad (إعلان) — جدول advertisements
```
id, title*, imageUrl, linkUrl, position* ("above_featured"|"below_featured"|"news_sidebar"),
isActive*(bool), startsAt, expiresAt, rotationInterval*(int),
clickCount*(int), impressionCount*(int), notes, createdAt, updatedAt
```

### User (مستخدم)
```
id, email(unique), firstName, lastName, profileImageUrl,
passwordHash (لا يُرجع), authProvider ("replit"|"local"),
role* ("subscriber"|...), isActive(bool), lastLoginAt,
userInterests: string[], createdAt, updatedAt
```

### HealthProfile (ملف صحي)
```
id, userId*, heightCm(real), weightKg(real), bloodType,
conditions: string[], medications: string[], allergies: string[], goals: string[],
createdAt, updatedAt
```

### Tracker (مؤشر قياس)
```
id, userId*, type*, measuredAt*(timestamp), valuePrimary*(real),
valueSecondary(real), unit*, note, createdAt
```

### NutritionEntry (تغذية)
```
id, userId*, loggedAt*(timestamp), mealName*, calories*(int),
protein(real), carbs(real), fat(real),
items: {name, quantity, unit}[], createdAt
```

### ChatSession / ChatMessage (محادثة)
```
ChatSession: id, userId*, title, createdAt, updatedAt
ChatMessage: id, sessionId*, role* ("user"|"assistant"), content*,
             citations: {title,url}[], createdAt
```

---

## 6. أكواد الحالة (HTTP Status)

| الكود | المعنى |
|---|---|
| 200 | نجاح |
| 201 | تم الإنشاء (التسجيل) |
| 400 | خطأ في البيانات المُرسلة (رسالة في `message`) |
| 401 | غير مصرّح (يلزم تسجيل دخول) |
| 403 | ممنوع (المورد لمستخدم آخر) |
| 404 | غير موجود |
| 500 | خطأ في الخادم |

كل الأخطاء ترجع بالشكل: `{ "message": "وصف الخطأ" }` (غالباً بالعربية).

---

## 7. توصيات لتطبيق iOS

1. **ابدأ بواجهة قراءة عامة** (أخبار + تصنيفات + مقالات + أدوية + شائعات) — لا تحتاج مصادقة، وهي جوهر التطبيق.
2. **الترقيم (Pagination):** استخدم `?page=&perPage=` مع `/api/news` واعتمد على `totalPages` لتحميل المزيد (infinite scroll).
3. **الجلسات:** فعّل حفظ الكوكيز في `URLSession`. سجّل دخول المستخدم عبر `/api/auth/login` قبل استدعاء مسارات المستخدم.
4. **الصور:** حقل `imageUrl` قد يكون رابطاً كاملاً أو مساراً يبدأ بـ `/` — في الحالة الثانية اسبقه بـ `https://capsulah.com`.
5. **المشاهدات:** استدعِ `POST /api/news/:id/view` عند فتح الخبر (كل فتح يُحتسب).
6. **RTL:** صمّم الواجهة يمين‑لليسار بخط عربي واضح (مثل IBM Plex Sans Arabic).
7. **المحتوى `content`** لأخبار/مقالات يأتي HTML — اعرضه عبر عارض HTML/WebView أو حوّله لنص منسّق.
8. **الحدود (Rate limits):** توليد الأدوية 10/دقيقة، والتسجيل/رفع الصور محدودة أيضاً — تعامل مع 429 إن ظهرت.

---

## 8. أمثلة سريعة (Swift / URLSession)

```swift
struct NewsItem: Codable {
    let id: String
    let shortCode: String?
    let title: String
    let summary: String?
    let content: String
    let category: String
    let imageUrl: String?
    let isBreaking: Bool?
    let publishedAt: String
    let viewCount: Int
}

func fetchNews(page: Int = 1) async throws -> [NewsItem] {
    var comps = URLComponents(string: "https://capsulah.com/api/news")!
    comps.queryItems = [
        .init(name: "page", value: "\(page)"),
        .init(name: "perPage", value: "20")
    ]
    let (data, _) = try await URLSession.shared.data(from: comps.url!)
    struct Page: Codable { let news: [NewsItem]; let totalPages: Int }
    return try JSONDecoder().decode(Page.self, from: data).news
}

// تسجيل الدخول (يحفظ الكوكي تلقائياً في HTTPCookieStorage)
func login(email: String, password: String) async throws {
    var req = URLRequest(url: URL(string: "https://capsulah.com/api/auth/login")!)
    req.httpMethod = "POST"
    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    req.httpBody = try JSONEncoder().encode(["email": email, "password": password])
    _ = try await URLSession.shared.data(for: req)
}
```

---

*آخر تحديث للمرجع: مبني على الكود الحالي للخادم. أي تغيّر في `server/routes.ts` قد يستلزم تحديث هذا الملف.*
