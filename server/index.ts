import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedProductionIfEmpty } from "./seedProduction";
import { storage } from "./storage";
import { pool } from "./db";
import { seedDefaultSources, seedDefaultKeywords } from "./radarService";
import { startTrendRefreshScheduler } from "./trendService";

const app = express();

// Trust proxy headers (Replit's deployment proxy) so req.protocol returns https in production
app.set('trust proxy', 1);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  limit: '25mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function setupMatawsPermissions() {
  const { pool } = await import("./db");
  try {
    await pool.query(`UPDATE admin_accounts SET permissions = $1::text[] WHERE username = 'matawa'`, [["publish_news","edit_news","delete_news","ai_images","manage_radar"]]);
    console.log("[Init] ✅ تم تحديث صلاحيات matawa");
  } catch (e) { console.error("[Init] خطأ في تحديث matawa:", e); }
}

async function fillMissingCreatedBy() {
  // لا نعدل الأخبار الموجودة - فقط نترك NULL كما هي (الـ Frontend يعرض "مستورد")
  console.log("[Init] ✅ بيانات الناشر جاهزة");
}

async function setupDisplayNames() {
  const { pool } = await import("./db");
  try {
    // فقط تحديث admin_accounts - لا تعديل على جدول news أبداً
    await pool.query(`UPDATE admin_accounts SET display_name = 'محمد مطاوع' WHERE username = 'matawa' AND (display_name IS NULL OR display_name = '')`);
    // إصلاح خبر محمد مطاوع الذي تم تغييره خطأً
    await pool.query(`UPDATE news SET created_by = 'محمد مطاوع' WHERE id = '67833234-d744-43c8-b316-2325b574827a'`);
    console.log("[Init] ✅ تم تحديث أسماء الموظفين");
  } catch (e) { console.error("[Init] خطأ في تحديث الأسماء:", e); }
}

async function initTodayViews() {
  const client = await pool.connect();
  try {
    // For articles published today that haven't been initialized for today's tracking,
    // seed their todayViews with their current viewCount (all views are from today)
    const todaySA = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
    const result = await client.query(`
      UPDATE news
      SET today_views = view_count,
          today_views_date = $1
      WHERE DATE(published_at AT TIME ZONE 'Asia/Riyadh') = $1::date
        AND today_views != view_count
        AND status != 'deleted'
    `, [todaySA]);
    if (result.rowCount && result.rowCount > 0) {
      log(`[Init] ✅ تم تهيئة مشاهدات اليوم لـ ${result.rowCount} خبر منشور اليوم`);
    }
  } catch (err) {
    console.error('[Init] خطأ في تهيئة مشاهدات اليوم (غير حرج):', err);
  } finally {
    client.release();
  }
}

async function fixTranslatedNews() {
  const client = await pool.connect();
  try {
    // Mark news as translated where they match radar items that had titleAr (translated from English)
    const result = await client.query(`
      UPDATE news n
      SET is_translated = true
      FROM radar_items r
      WHERE n.source_url = r.original_url
        AND r.title_ar IS NOT NULL
        AND (r.language IS NULL OR r.language != 'ar')
        AND n.is_translated = false
    `);
    if (result.rowCount && result.rowCount > 0) {
      log(`[Init] ✅ تم تمييز ${result.rowCount} خبر كمترجم`);
    }
  } catch (err) {
    console.error('[Init] خطأ في تحديث الأخبار المترجمة (غير حرج):', err);
  } finally {
    client.release();
  }
}

async function fixCategoriesArabic() {
  const CATEGORY_DATA = [
    { slug: 'health-news',      nameAr: 'أخبار الصحة',        nameEn: 'Health News',      color: 'green-200' },
    { slug: 'saudi-health',     nameAr: 'الصحة في السعودية',  nameEn: 'Saudi Health',     color: 'emerald-200' },
    { slug: 'health-community', nameAr: 'مجتمع صحي',          nameEn: 'Health Community', color: 'blue-200' },
    { slug: 'health-reports',   nameAr: 'تقارير صحية',         nameEn: 'Health Reports',   color: 'purple-200' },
    { slug: 'health-events',    nameAr: 'فعاليات صحية',        nameEn: 'Health Events',    color: 'orange-200' },
    { slug: 'quality-life',     nameAr: 'جودة الحياة',         nameEn: 'Quality of Life',  color: 'teal-200' },
    { slug: 'nutrition',        nameAr: 'التغذية',              nameEn: 'Nutrition',        color: 'lime-200' },
    { slug: 'misc',             nameAr: 'متنوع',               nameEn: 'Miscellaneous',    color: 'gray-200' },
  ];
  const client = await pool.connect();
  try {
    for (const c of CATEGORY_DATA) {
      await client.query(
        `UPDATE categories SET name_ar = $1, name_en = $2, color = $3 WHERE slug = $4`,
        [c.nameAr, c.nameEn, c.color, c.slug]
      );
    }
    log('[Init] ✅ تم تحديث أسماء التصنيفات بالعربية');
  } catch (err) {
    console.error('[Init] خطأ في تحديث التصنيفات:', err);
  } finally {
    client.release();
  }
}

(async () => {
  try {
    const server = await registerRoutes(app);

    // Fix category Arabic names and colors on every startup (both dev and prod)
    try {
      await fixCategoriesArabic();
    } catch (err) {
      console.error('[Init] خطأ في تحديث التصنيفات (غير حرج):', err);
    }

    // Retroactively mark translated news (runs on every startup, idempotent)
    try {
      await fixTranslatedNews();
      await setupMatawsPermissions();
      await setupDisplayNames();
    } catch (err) {
      console.error('[Init] خطأ في تحديث الأخبار المترجمة (غير حرج):', err);
    }

    // Initialize today's view counters for articles published today (idempotent)
    try {
      await initTodayViews();
    } catch (err) {
      console.error('[Init] خطأ في تهيئة مشاهدات اليوم (غير حرج):', err);
    }

    // Create performance indexes if they don't exist
    try {
      const client = await pool.connect();
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_news_status_published ON news(status, published_at DESC);
        CREATE INDEX IF NOT EXISTS idx_radar_items_status ON radar_items(status);
        CREATE INDEX IF NOT EXISTS idx_news_view_count ON news(view_count DESC, published_at DESC);
      `);
      client.release();
    } catch (err) {
      console.error('[Init] خطأ في إنشاء الفهارس (غير حرج):', err);
    }

    // Seed default radar sources — only adds missing ones
    try {
      const sourcesAdded = await seedDefaultSources();
      const keywordsAdded = await seedDefaultKeywords();
      if (sourcesAdded > 0 || keywordsAdded > 0) {
        log(`[Init] ✅ أُضيف ${sourcesAdded} مصدر و${keywordsAdded} كلمة مفتاحية جديدة إلى رادار الأخبار`);
      }
    } catch (err) {
      console.error('[Init] خطأ في إضافة مصادر الرادار (غير حرج):', err);
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });

    // Background scheduler: promote overdue scheduled news every 60 seconds
    const runScheduler = async () => {
      try {
        const promoted = await storage.promoteOverdueScheduledNews();
        if (promoted > 0) {
          log(`[Scheduler] نُشر ${promoted} خبر مجدول تلقائياً`);
        }
      } catch (err) {
        console.error("[Scheduler] خطأ في نشر الأخبار المجدولة:", err);
      }
    };

    runScheduler();
    setInterval(runScheduler, 60 * 1000);

    // Background scheduler: deactivate expired ads every 5 minutes
    const runAdExpiry = async () => {
      try {
        const deactivated = await storage.deactivateExpiredAds();
        if (deactivated > 0) {
          log(`[Scheduler] تم إيقاف ${deactivated} إعلان منتهي الصلاحية تلقائياً`);
        }
      } catch (err) {
        console.error("[Scheduler] خطأ في إيقاف الإعلانات المنتهية:", err);
      }
    };

    runAdExpiry();
    setInterval(runAdExpiry, 5 * 60 * 1000);

    // Start health trend radar scheduler (refreshes every 6 hours)
    try {
      startTrendRefreshScheduler();
      log("[Init] ✅ رادار الترند الصحي يعمل (تحديث كل 6 ساعات)");
    } catch (err) {
      console.error("[Init] خطأ في تشغيل رادار الترند (غير حرج):", err);
    }
  } catch (err) {
    console.error('[Startup] فشل حرج في بدء تشغيل الخادم:', err);
    process.exit(1);
  }
})();
