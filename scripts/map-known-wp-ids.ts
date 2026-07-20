/**
 * ربط يدوي لمعرّفات ووردبريس التي نعرف عناوينها يقيناً من فهرس جوجل
 * (نتائج site:capsulah.com الفعلية) — للحالات التي فشل فيها أرشيف Wayback.
 *
 *   tsx scripts/map-known-wp-ids.ts            # كتابة
 *   tsx scripts/map-known-wp-ids.ts --dry-run  # عرض فقط
 */
import { db, pool } from '../server/db';
import { news } from '@shared/schema';
import { and, ilike, isNull, sql } from 'drizzle-orm';

const DRY_RUN = process.argv.includes('--dry-run');

// wpId → مقطع مميز من العنوان كما ظهر في فهرس جوجل
// ملاحظة: بعض العناوين في القاعدة تحوي مسافات مزدوجة — المطابقة تتسامح معها.
const KNOWN: [number, string][] = [
  [20538, 'حوادث الطرق أزمة عالمية صامتة'],
  [13972, 'دواء جديد للملاريا آمن للرضع'],
  [10793, 'تقليل حالات الثلاسيميا بفحص ما قبل الزواج'],
  [1866, 'البعوض يوفر لقاحات ضد'],
  [6791, 'إسعاف المنية يقدم 80 مهمة'],
  [25911, 'مواعيد الوجبات وساعات الصيام'],
  [12346, 'آلام الأعصاب ووخز باليدين والقدمين'],
  [9611, 'شريحتان من الدجاج أو قطعة لحم'],
  [20717, 'بتفشي فيروس ماربورغ في إثيوبيا'],
  [676, 'تطورات الطب المخبري في مؤتمر بالرياض'],
  [3660, 'بريطانيون يسافرون إلى هولندا لحقنهم'],
  [23823, 'ترسم ملامح الطبق السعودي المثالي'],
  [10168, 'تناول الجوز في الفطور'],
  [232, 'من أطباء التخدير يعانون من'], // غير موجود في القاعدة — لم يُهاجَر من ووردبريس
];

// أي فراغ في المقطع يطابق فراغاً واحداً أو أكثر في العنوان
const pattern = (fragment: string) => `%${fragment.trim().split(/\s+/).join('%')}%`;

async function main() {
  let mapped = 0, missing = 0, taken = 0;
  for (const [wpId, fragment] of KNOWN) {
    const rows = await db
      .select({ id: news.id, title: news.title, shortCode: news.shortCode, wpId: news.wpId })
      .from(news)
      .where(ilike(news.title, pattern(fragment)))
      .limit(2);

    if (rows.length === 0) {
      console.log(`✗ ${wpId}: لا يوجد خبر يطابق «${fragment}»`);
      missing++;
      continue;
    }
    if (rows.length > 1) {
      console.log(`⚠ ${wpId}: أكثر من تطابق لـ «${fragment}» — تخطّي حذراً`);
      continue;
    }
    const row = rows[0];
    if (row.wpId != null && row.wpId !== wpId) {
      console.log(`⚠ ${wpId}: الخبر مربوط أصلاً بـ ${row.wpId} — «${row.title.slice(0, 50)}»`);
      taken++;
      continue;
    }
    console.log(`✓ ${wpId} → /n/${row.shortCode} — «${row.title.slice(0, 55)}»`);
    if (!DRY_RUN) {
      await db.update(news)
        .set({ wpId })
        .where(and(sql`${news.id} = ${row.id}`, isNull(news.wpId)));
    }
    mapped++;
  }
  console.log(`\nمربوط: ${mapped} · مفقود من القاعدة: ${missing} · متضارب: ${taken}${DRY_RUN ? ' (تجريبي)' : ''}`);
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
