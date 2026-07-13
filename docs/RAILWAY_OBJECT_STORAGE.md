# ترحيل الصور من Replit Object Storage إلى Railway (S3/R2)

الصور في كبسولة محفوظة كمسارات نسبية مثل `/objects/uploads/...` في Neon.
الملفات نفسها كانت في **Replit App Storage**. على Railway نخدم نفس المسارات عبر باكت S3-compatible (Railway Bucket أو Cloudflare R2).

## 1) أنشئ باكت الوجهة

### خيار أ: Railway Bucket
أنشئ Bucket من لوحة Railway وانسخ:
- Endpoint
- Access Key
- Secret Key
- Bucket name
- Region

### خيار ب: Cloudflare R2
أنشئ باكت + API Token بصلاحيات Object Read & Write، واستخدم:
- `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

## 2) صدّر من Replit إلى الباكت الجديد

شغّل **داخل Replit** (مهم: sidecar المحلي فقط هناك):

```bash
# متغيرات الوجهة
export S3_ENDPOINT="https://...."
export S3_ACCESS_KEY_ID="...."
export S3_SECRET_ACCESS_KEY="...."
export S3_BUCKET="capsulah-media"
export S3_REGION="auto"

# PRIVATE_OBJECT_DIR موجود أصلاً على Replit

# تجربة أولاً
MIGRATE_DRY_RUN=1 MIGRATE_LIMIT=20 npx tsx scripts/migrate-object-storage.ts

# الترحيل الكامل
npx tsx scripts/migrate-object-storage.ts
```

السكربت يتخطى الملفات الموجودة بنفس الحجم، ويمكن إعادة تشغيله بأمان.

## 3) متغيرات Railway

```
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_REGION=auto
PRIVATE_OBJECT_DIR=/<BUCKET_NAME>/.private
PUBLIC_OBJECT_SEARCH_PATHS=/<BUCKET_NAME>/public
UPLOAD_URL_SECRET=  # اختياري؛ إن لم يُضبط يستخدم SESSION_SECRET
```

بعدها أعد نشر الخدمة. روابط `/objects/uploads/...` في قاعدة البيانات تبقى كما هي — لا حاجة لتحديث صفوف `news`.

## ملاحظات

- بدون ترحيل الباكت ستظهر الصور مكسورة رغم نجاح نسخ Neon.
- الرفع الجديد من لوحة الأدمن في وضع S3 يمر عبر `/api/objects/upload/:id` (بدون CORS على الباكت).
