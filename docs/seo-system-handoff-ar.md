# منظومة SEO في كبسولة — وثيقة تسليم

> منقولة من مبادئ «منظومة SEO في صحيفة سبق — الخيط والمخيط»، مع تكييفها
> لمعمارية كبسولة (SPA + Dynamic Rendering عبر Express، بدون Next.js منفصل).

## الصورة الكبيرة

| الطبقة | أين | الدور |
|--------|-----|--------|
| HTML الزاحف | `server/routes.ts` → `buildCrawlerHtml` | عند User-Agent زاحف: عنوان + وصف + OG + JSON-LD + نص كامل |
| قشرة SPA | Vite/static + `client/src/components/SEO.tsx` | البشر بعد hydration |
| اكتشاف فوري | `server/services/indexingPing.ts` | IndexNow، مع خرائط الموقع لاكتشاف Google |

الرابط القانوني للخبر: `https://capsulah.com/n/{shortCode}`.

## إشارات موحّدة (لا تكسرها)

1. **عنوان العرض** = `seoTitle?.trim() || title` في الصفحة والزاحف و`sitemap-news` (`news:title` و`image:title`).
2. **الوصف** عبر `buildMetaDescription` (قص 220 حرفاً على حدود كلمة) من `@shared/seoSignals`.
3. **dateModified** يُضبط بـ `clampModifiedTime` (منع حداثة زائفة بعد 30 يوماً).
4. **robots حسب العمر**: حديث `index,follow,max-image-preview:large`؛ بعد 30 يوماً `googlebot-news:noindex`؛ بعد سنة `noarchive`.
5. **محذوف/مسحب** → HTTP **410** للزواحف (وليس soft-404 بـ 200 SPA).
6. **إشعار الفهرسة** بالرابط القانوني `/n/{shortCode}` فقط.
7. **مسارات خاصة** في `server/utils/noindexPaths.ts` → `X-Robots-Tag: noindex` + `Cache-Control: private, no-store` + حارس تطوير في `server/index.ts`.

## Env

| المتغير | الغرض |
|---------|--------|
| `INDEXNOW_KEY` | IndexNow + ملف `/{KEY}.txt` |
| `BASE_URL` | الأصل القانوني (افتراضي `https://capsulah.com`) |

> لا تُرسل أخبار أو مقالات كبسولة إلى Google Indexing API؛ توثيق Google يقصرها
> على `JobPosting` و`BroadcastEvent` داخل `VideoObject`. Google يكتشف محتوى
> كبسولة عبر `sitemap-news.xml` و`sitemap-general.xml` و`sitemap-articles.xml`.

## تشخيص

```bash
curl -s https://capsulah.com/api/seo/indexing-status | python3 -m json.tool
GB='Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
curl -s -A "$GB" 'https://capsulah.com/n/FelRlGE' | grep -E '<title>|news:title|robots|BreadcrumbList'
```

## خطة مرحلية (منفَّذة)

- A توحيد العنوان/الوصف/modified_time
- B 410 + robots عمر + utm noindex
- C noindexPaths + حارس كاش
- D JSON-LD أغنى + Breadcrumb + preload LCP
- E IndexNow عند النشر/التحديث + خرائط Google (بدون Indexing API غير المدعومة)
- F/G sitemaps (أولوية حسب العمر) + هذه الوثيقة

## تحقق آلي

```bash
npm run check:seo
npm run build
```
