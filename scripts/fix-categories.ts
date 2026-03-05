import { db } from '../server/db.js';
import { categories } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

// Update color to the correct format used in the frontend: `bg-${color}` → "green-200" etc.
const colorFix = [
  { slug: 'health-news',      color: 'green-200' },
  { slug: 'saudi-health',     color: 'emerald-200' },
  { slug: 'health-community', color: 'blue-200' },
  { slug: 'health-reports',   color: 'purple-200' },
  { slug: 'health-events',    color: 'orange-200' },
  { slug: 'quality-life',     color: 'teal-200' },
  { slug: 'nutrition',        color: 'lime-200' },
  { slug: 'misc',             color: 'gray-200' },
];

for (const u of colorFix) {
  await db.update(categories)
    .set({ color: u.color })
    .where(eq(categories.slug, u.slug));
  console.log('✅ color fix:', u.slug, '->', u.color);
}

process.exit(0);
