# ترحيل الصور من Replit Object Storage إلى Railway (S3/R2)

الصور في كبسولة محفوظة كمسارات نسبية مثل `/objects/uploads/...` في Neon.
الملفات نفسها كانت في **Replit App Storage**. على Railway نخدم نفس المسارات عبر باكت S3-compatible (Railway Bucket أو Cloudflare R2).

## 1) أنشئ باكت الوجهة

### خيار أ: Railway Bucket
أنشئ Bucket من لوحة Railway وانسخ من تبويب **Credentials**:
- Endpoint
- Access Key
- Secret Key
- Bucket name (مثل `arranged-foodbox-4edogh3q`)
- Region

اربط هذه القيم بخدمة **cap** (Variables) — إما Variable Reference من الباكت أو نسخ يدوي.

### خيار ب: Cloudflare R2
أنشئ باكت + API Token بصلاحيات Object Read & Write، واستخدم:
- `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

## 2) صدّر من Replit إلى الباكت الجديد

شغّل **داخل Replit** (مهم: sidecar المحلي فقط هناك):

```bash
export S3_ENDPOINT="https://...."
export S3_ACCESS_KEY_ID="...."
export S3_SECRET_ACCESS_KEY="...."
export S3_BUCKET="arranged-foodbox-4edogh3q"
export S3_REGION="auto"

MIGRATE_DRY_RUN=1 MIGRATE_LIMIT=20 npx tsx scripts/migrate-object-storage.ts
npx tsx scripts/migrate-object-storage.ts
```

السكربت يتخطى الملفات الموجودة بنفس الحجم، ويمكن إعادة تشغيله بأمان.

## 3) قائمة متغيرات خدمة `cap` على Railway

### تخزين (مرتبط بـ arranged-foodbox)
```
S3_ENDPOINT=                 # أو BUCKET_ENDPOINT_URL من Credentials
S3_ACCESS_KEY_ID=            # أو BUCKET_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY=        # أو BUCKET_SECRET_ACCESS_KEY
S3_REGION=auto
S3_BUCKET=arranged-foodbox-4edogh3q   # اختياري إن ضُبط PRIVATE_OBJECT_DIR يدوياً
PRIVATE_OBJECT_DIR=/arranged-foodbox-4edogh3q/.private
PUBLIC_OBJECT_SEARCH_PATHS=/arranged-foodbox-4edogh3q/public
UPLOAD_URL_SECRET=           # اختياري؛ إن لم يُضبط يستخدم SESSION_SECRET
```

إن لم تضع `PRIVATE_OBJECT_DIR` وكان `S3_BUCKET` مضبوطاً، السيرفر يفترض تلقائياً `/<S3_BUCKET>/.private`.

### تشغيل أساسي
```
DATABASE_URL=
SESSION_SECRET=
NODE_ENV=production
BASE_URL=https://<your-railway-or-custom-domain>
ADMIN_PASSWORD=
OPENAI_API_KEY=              # أو AI_INTEGRATIONS_OPENAI_API_KEY
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
```

لا تضع `REPL_ID` على Railway إلا إذا أردت Replit OIDC صراحةً؛ بدونه يعمل تسجيل الأدمن المحلي.

### Healthcheck
المسار: `GET /health` → `{ "ok": true }`  
مضبوط في `railway.toml` على `/health`.

## 4) تحقق بعد Redeploy
- `GET /health` → 200
- `GET /objects/uploads/<uuid>.webp` → صورة (بعد ترحيل ذلك الملف)
- 404 غالباً: `PRIVATE_OBJECT_DIR` خاطئ أو الملف لم يُرحَّل بعد
- 500 على `/objects`: مفاتيح S3 غير مربوطة بخدمة `cap`

## ملاحظات
- بدون ترحيل الباكت ستظهر الصور مكسورة رغم نجاح نسخ Neon.
- الرفع الجديد من لوحة الأدمن في وضع S3 يمر عبر `/api/objects/upload/:id` (بدون CORS على الباكت).
- روابط `/objects/uploads/...` في Neon تبقى كما هي — لا حاجة لتحديث صفوف `news`.


## SEO على Railway
- اضبط `BASE_URL=https://capsulah.com` (بدون شرطة أخيرة) — يُستخدم في `robots.txt` وملفات sitemap.
- بعد الربط: Google Search Console → إضافة الموقع → إرسال `https://capsulah.com/sitemap.xml`.
- صفحات الأخبار والمقالات تخدم HTML للزواحف؛ المسارات غير الموجودة ترجع HTTP 404 مع `noindex`.
