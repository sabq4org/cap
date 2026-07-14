/**
 * Backfill news.wp_id from the Wayback Machine.
 *
 * The old capsulah.com ran WordPress with numeric permalinks (/20538/). The
 * archive was imported into the new DB without storing the WP post id, so the
 * legacy 301 redirects have nothing to match against. This script rebuilds the
 * mapping: it lists archived capsulah.com/<id> snapshots from the Wayback CDX
 * API, extracts each snapshot's article title, and matches it against news
 * titles in the database (normalized exact match — no fuzzy matching, a wrong
 * redirect is worse than none).
 *
 * Usage:
 *   tsx scripts/backfill-wp-ids.ts --dry-run          # report matches only
 *   tsx scripts/backfill-wp-ids.ts                    # write wp_id to DB
 *   tsx scripts/backfill-wp-ids.ts --limit 50         # first 50 URLs only
 *   tsx scripts/backfill-wp-ids.ts --concurrency 3    # default 4
 *
 * Safe to re-run: already-mapped wp_ids are skipped, matching is idempotent.
 */
import { db, pool } from '../server/db';
import { news } from '@shared/schema';
import { isNotNull, sql } from 'drizzle-orm';
import pLimit from 'p-limit';

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = (() => {
  const i = process.argv.indexOf('--limit');
  return i > -1 ? parseInt(process.argv[i + 1], 10) : Infinity;
})();
const CONCURRENCY = (() => {
  const i = process.argv.indexOf('--concurrency');
  return i > -1 ? parseInt(process.argv[i + 1], 10) : 4;
})();

const CDX_URL =
  'http://web.archive.org/cdx/search/cdx' +
  '?url=capsulah.com&matchType=prefix&collapse=urlkey' +
  '&filter=statuscode:200&fl=original,timestamp&limit=100000';

// عناوين ووردبريس القديمة تنتهي غالباً بلاحقة الموقع
const TITLE_SUFFIXES = [/\s*[-–—|]\s*كبسولة.*$/u, /\s*[-–—|]\s*Capsulah.*$/iu];

const normalizeTitle = (raw: string): string => {
  let t = raw.trim();
  for (const suffix of TITLE_SUFFIXES) t = t.replace(suffix, '');
  return t
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#8230;|&hellip;/g, '...')
    .replace(/[\u200E\u200F؜]/g, '')       // علامات الاتجاه الخفية
    .replace(/[ً-ٰٟ]/g, '')      // التشكيل
    .replace(/[«»""'']/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
};

const hasCJK = (s: string) => /[぀-ヿ㐀-鿿가-힯]/.test(s);

async function fetchWithRetry(url: string, tries = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(45000),
        headers: { 'User-Agent': 'CapsulahBackfill/1.0 (+https://capsulah.com)' },
      });
      if (res.status === 429 || res.status >= 500) {
        await new Promise(r => setTimeout(r, attempt * 5000));
        continue;
      }
      if (!res.ok) return null;
      return await res.text();
    } catch {
      await new Promise(r => setTimeout(r, attempt * 3000));
    }
  }
  return null;
}

const extractTitle = (html: string): string | null => {
  const og = html.match(/property="og:title"\s+content="([^"]+)"/);
  if (og?.[1]) return og[1];
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return title?.[1]?.trim() || null;
};

async function main() {
  console.log(`[Backfill] الوضع: ${DRY_RUN ? 'تجريبي (بلا كتابة)' : 'كتابة فعلية'} — تزامن ${CONCURRENCY}`);

  // 0) العمود قد لا يكون موجوداً بعد إن شُغّل السكربت قبل نشر السيرفر الجديد
  await pool.query(`
    ALTER TABLE news ADD COLUMN IF NOT EXISTS wp_id integer;
    CREATE INDEX IF NOT EXISTS idx_news_wp_id ON news(wp_id) WHERE wp_id IS NOT NULL;
  `);

  // 1) خريطة العناوين من قاعدة البيانات
  const rows = await db
    .select({ id: news.id, title: news.title, shortCode: news.shortCode, wpId: news.wpId })
    .from(news);
  const byTitle = new Map<string, { id: string; shortCode: string | null }>();
  const mappedWpIds = new Set<number>();
  for (const row of rows) {
    if (row.wpId != null) mappedWpIds.add(row.wpId);
    const key = normalizeTitle(row.title);
    if (key && !byTitle.has(key)) byTitle.set(key, { id: row.id, shortCode: row.shortCode });
  }
  console.log(`[Backfill] ${rows.length} خبراً في القاعدة، ${mappedWpIds.size} مربوط مسبقاً`);

  // 2) قائمة الروابط الرقمية من أرشيف Wayback
  console.log('[Backfill] جلب قائمة CDX من Wayback…');
  const cdx = await fetchWithRetry(CDX_URL, 4);
  if (!cdx) throw new Error('تعذر جلب قائمة CDX من Wayback');

  const targets: { wpId: number; timestamp: string }[] = [];
  const seen = new Set<number>();
  for (const line of cdx.split('\n')) {
    const [original, timestamp] = line.trim().split(' ');
    if (!original || !timestamp) continue;
    const m = original.match(/capsulah\.com\/(\d{1,7})\/?$/);
    if (!m) continue;
    const wpId = parseInt(m[1], 10);
    if (seen.has(wpId) || mappedWpIds.has(wpId)) continue;
    seen.add(wpId);
    targets.push({ wpId, timestamp });
  }
  const work = targets.slice(0, LIMIT === Infinity ? undefined : LIMIT);
  console.log(`[Backfill] ${targets.length} رابطاً مؤرشفاً غير مربوط — سيعالج ${work.length}`);

  // 3) جلب العناوين ومطابقتها
  const limiter = pLimit(CONCURRENCY);
  let matched = 0, unmatched = 0, spam = 0, failed = 0, done = 0;
  const unmatchedSamples: string[] = [];

  // لقطات غير صالحة: تحدي كلاودفلير المؤرشف أو غلاف الموقع الجديد بعد الهجرة
  const isJunkTitle = (t: string) =>
    /bot verification|just a moment|attention required/i.test(t) ||
    /^كبسولة\s*[|–-]/.test(t.trim());

  // يجرب لقطة CDX الأولى، وإن كانت غير صالحة يطلب قائمة لقطات الرابط كاملة ويجربها
  const fetchBestTitle = async (wpId: number, firstTimestamp: string): Promise<string | null> => {
    const tryOne = async (ts: string): Promise<string | null> => {
      const html = await fetchWithRetry(`http://web.archive.org/web/${ts}id_/https://capsulah.com/${wpId}`);
      if (!html) return null;
      const t = extractTitle(html);
      return t && !isJunkTitle(t) ? t : null;
    };

    const first = await tryOne(firstTimestamp);
    if (first) return first;

    const cdxPerId = await fetchWithRetry(
      `http://web.archive.org/cdx/search/cdx?url=capsulah.com/${wpId}&filter=statuscode:200&fl=timestamp&limit=6`
    );
    if (!cdxPerId) return null;
    for (const ts of cdxPerId.split('\n').map(s => s.trim()).filter(Boolean)) {
      if (ts === firstTimestamp) continue;
      const title = await tryOne(ts);
      if (title) return title;
    }
    return null;
  };

  await Promise.all(work.map(({ wpId, timestamp }) => limiter(async () => {
    const rawTitle = await fetchBestTitle(wpId, timestamp);
    done++;
    if (done % 50 === 0) {
      console.log(`[Backfill] ${done}/${work.length} — مطابق ${matched}، بلا تطابق ${unmatched}، سبام ${spam}، فشل ${failed}`);
    }
    if (!rawTitle) { failed++; return; }
    if (hasCJK(rawTitle)) { spam++; return; } // صفحة سبام الاختراق الياباني — تبقى 410

    const key = normalizeTitle(rawTitle);
    const hit = byTitle.get(key);
    if (!hit) {
      unmatched++;
      if (unmatchedSamples.length < 20) unmatchedSamples.push(`${wpId}: ${key.slice(0, 70)}`);
      return;
    }

    matched++;
    if (!DRY_RUN) {
      await db
        .update(news)
        .set({ wpId })
        .where(sql`${news.id} = ${hit.id} AND ${news.wpId} IS NULL`);
    }
  })));

  console.log('\n[Backfill] النتيجة النهائية:');
  console.log(`  مطابق (301 جاهز): ${matched}`);
  console.log(`  بلا تطابق (يبقى 410): ${unmatched}`);
  console.log(`  سبام اختراق (يبقى 410): ${spam}`);
  console.log(`  فشل الجلب: ${failed}`);
  if (unmatchedSamples.length) {
    console.log('\n  عينات بلا تطابق (للمراجعة اليدوية):');
    unmatchedSamples.forEach(s => console.log(`   - ${s}`));
  }

  const totalMapped = await db.select({ c: sql<number>`count(*)` }).from(news).where(isNotNull(news.wpId));
  console.log(`\n[Backfill] إجمالي المربوط في القاعدة الآن: ${totalMapped[0].c}`);

  await pool.end();
}

main().catch(err => {
  console.error('[Backfill] خطأ فادح:', err);
  process.exit(1);
});
