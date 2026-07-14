import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, warmOgImagesForNews, warmOgImageForNews } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedProductionIfEmpty } from "./seedProduction";
import { storage } from "./storage";
import { pool } from "./db";
import { seedDefaultSources, seedDefaultKeywords } from "./radarService";
import { startTrendRefreshScheduler } from "./trendService";
import { notifySearchEnginesOfNews } from "./services/indexingPing";
import { getCanonicalHostname, getCanonicalOrigin, isCapsulahAliasHost } from "./seo";

// Keep the process alive on uncaught exceptions.
// Crashing on every unexpected error causes deployment outages.
// We log the error and continue — the server recovers on the next request.
// Only truly unrecoverable signals (SIGKILL, OOM) should bring the process down.
process.on('uncaughtException', (err: Error) => {
  // Neon WebSocket bug: tries to set `error.message` on a read-only ErrorEvent.
  // This is a known transient issue in @neondatabase/serverless — safe to ignore.
  if (err instanceof TypeError && err.message?.includes('Cannot set property message')) {
    console.error('[Process] Neon WebSocket transient error (recovered):', err.message);
    return;
  }
  // All other uncaught exceptions: log with full stack but do NOT exit.
  // Exiting here would take the entire server down for what is often a
  // transient error (bad image, momentary network blip, 3rd-party API hiccup).
  console.error('[Process] Uncaught exception (recovered — server stays up):', err?.message);
  console.error(err?.stack ?? '(no stack)');
});

process.on('unhandledRejection', (reason: unknown) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : '';
  console.error('[Process] Unhandled promise rejection (non-fatal):', msg);
  if (stack) console.error(stack);
});

const app = express();

// Trust proxy headers so req.protocol returns https behind Railway/Cloudflare
app.set('trust proxy', 1);

// Collapse every owned domain variant to the one official public origin.
// This is intentionally early so HTML, API pages, sitemaps, and assets never
// serve a competing 200 response on capsulah.net or www.capsulah.com.
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "production") return next();

  const requestHost = req.hostname.toLowerCase();
  const canonicalHost = getCanonicalHostname();
  if (isCapsulahAliasHost(requestHost) && requestHost !== canonicalHost) {
    return res.redirect(301, `${getCanonicalOrigin()}${req.originalUrl}`);
  }

  next();
});

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

// Railway / load balancer healthcheck — keep cheap and early
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });

  next();
});

async function setupMatawsPermissions() {
  const { pool } = await import("./db");
  try {
    const perms = ["publish_news","edit_news","delete_news","ai_images","manage_radar","view_analytics","manage_ads"];
    await pool.query(
      `UPDATE admin_accounts SET permissions = $1::text[] WHERE username = 'matawa'`,
      [perms]
    );
    console.log("[Init] ✅ تم تحديث صلاحيات matawa");
    // Add manage_ads to any existing admin account missing it
    await pool.query(
      `UPDATE admin_accounts SET permissions = array_append(permissions, 'manage_ads')
       WHERE NOT ('manage_ads' = ANY(permissions)) AND role != 'super_admin'`
    );
    // Ensure super_admin account always has manage_ads
    await pool.query(
      `UPDATE admin_accounts SET permissions = array_append(permissions, 'manage_ads')
       WHERE NOT ('manage_ads' = ANY(permissions)) AND role = 'super_admin'`
    );
    console.log("[Init] ✅ تم التحقق من صلاحية manage_ads لجميع الحسابات");
  } catch (e) { console.error("[Init] خطأ في تحديث صلاحية manage_ads:", e); }
}

async function ensureAdminAccount() {
  const { pool } = await import("./db");
  try {
    const { rows } = await pool.query(
      `SELECT id FROM admin_accounts WHERE role = 'super_admin' LIMIT 1`
    );
    if (rows.length > 0) return; // super_admin already exists

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.warn("[Init] ⚠️ لا يوجد حساب super_admin ومتغير ADMIN_PASSWORD غير مضبوط — تخطّي إنشاء الحساب");
      return;
    }

    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash(adminPassword, 12);
    const allPermissions = [
      "publish_news","edit_news","delete_news","manage_categories",
      "view_analytics","manage_users","ai_content","ai_images",
      "manage_radar","import_wordpress"
    ];
    await pool.query(
      `INSERT INTO admin_accounts (username, password_hash, display_name, role, permissions, is_active)
       VALUES ($1, $2, $3, 'super_admin', $4, true)
       ON CONFLICT (username) DO NOTHING`,
      ["admin", hash, "المدير العام", allPermissions]
    );
    log("[Init] ✅ تم إنشاء حساب المدير العام (admin) تلقائياً");
  } catch (e) {
    console.error("[Init] خطأ في إنشاء حساب المدير (غير حرج):", e);
  }
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

    // Ensure a super_admin account always exists (idempotent — skips if already present)
    try {
      await ensureAdminAccount();
    } catch (err) {
      console.error('[Init] خطأ في التحقق من حساب المدير (غير حرج):', err);
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
        ALTER TABLE news ADD COLUMN IF NOT EXISTS wp_id integer;
        CREATE INDEX IF NOT EXISTS idx_news_wp_id ON news(wp_id) WHERE wp_id IS NOT NULL;
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
      console.error(`[Error] ${status} — ${message}`, err?.stack ?? '');
      if (!res.headersSent) {
        res.status(status).json({ message });
      }
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
      // reusePort is Linux-only; macOS throws ENOTSUP
      ...(process.platform === "linux" ? { reusePort: true } : {}),
    }, () => {
      log(`serving on port ${port}`);
    });

    // Graceful shutdown — frees the port cleanly on SIGTERM/SIGINT so the next
    // process can bind immediately without hitting EADDRINUSE.
    const shutdown = (signal: string) => {
      log(`[Shutdown] ${signal} received — closing server gracefully`);
      server.close(() => {
        log('[Shutdown] HTTP server closed');
        process.exit(0);
      });
      // Force exit after 10 s if connections are still lingering
      setTimeout(() => {
        log('[Shutdown] Forcing exit after 10s timeout');
        process.exit(1);
      }, 10_000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    // Background scheduler: promote overdue scheduled news every 60 seconds
    const runScheduler = async () => {
      try {
        const promoted = await storage.promoteOverdueScheduledNews();
        if (promoted.length > 0) {
          log(`[Scheduler] نُشر ${promoted.length} خبر مجدول تلقائياً`);
          notifySearchEnginesOfNews(promoted);
          warmOgImagesForNews(promoted);
        }
      } catch (err) {
        console.error("[Scheduler] خطأ في نشر الأخبار المجدولة:", err);
      }
    };

    runScheduler();
    setInterval(runScheduler, 60 * 1000);

    // Boot-time OG warm: a deploy/restart starts this process with an empty
    // in-memory OG cache, and publish-time pre-warm only covers items
    // published AFTER boot. Warm the most recent articles shortly after
    // startup so a tweet of any recent link never hits a cold render.
    // (Most entries load instantly from the persistent og-cache/ store;
    // sequential on purpose to keep boot-time CPU/IO flat.)
    setTimeout(async () => {
      try {
        const recent = await storage.getNews(undefined, 20, { omitContent: true });
        let warmed = 0;
        for (const item of recent) {
          await warmOgImageForNews(item);
          warmed++;
        }
        log(`[OG] boot warm completed for ${warmed} recent articles`);
      } catch (err) {
        console.warn('[OG] boot warm failed:', err);
      }
    }, 15_000);

    // Background scheduler: promote overdue scheduled articles every 60 seconds
    const runArticleScheduler = async () => {
      try {
        const promoted = await storage.promoteOverdueScheduledArticles();
        if (promoted > 0) {
          log(`[Scheduler] نُشر ${promoted} مقال مجدول تلقائياً`);
        }
      } catch (err) {
        console.error("[Scheduler] خطأ في نشر المقالات المجدولة:", err);
      }
    };
    runArticleScheduler();
    setInterval(runArticleScheduler, 60 * 1000);

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

    // WhatsApp morning newsletter scheduler — checks every minute
    const runWhatsAppScheduler = async () => {
      try {
        // Pick up any scheduled newsletters that are now due
        const dueNewsletters = await storage.getScheduledWhatsappNewslettersDue();
        for (const nl of dueNewsletters) {
          try {
            // Atomic claim: only proceed if we successfully transition scheduled -> sending
            const claimed = await storage.claimScheduledNewsletter(nl.id);
            if (!claimed) continue; // another process already claimed it or it was canceled
            log(`[WhatsApp Scheduler] 📨 إرسال نشرة مجدولة: ${nl.title}`);
            const { sendBulkWhatsAppMessages } = await import("./whatsappService");
            const activeSubscribers = await storage.getActiveWhatsappSubscribers((nl.interests as string[]) || []);
            if (activeSubscribers.length === 0) {
              await storage.updateWhatsappNewsletter(nl.id, { status: "sent", sentAt: new Date(), recipientsCount: 0 });
              continue;
            }
            const phones = activeSubscribers.map(s => s.phone);
            const result = await sendBulkWhatsAppMessages(phones, nl.content);
            await storage.updateWhatsappNewsletter(nl.id, {
              status: "sent",
              sentAt: new Date(),
              recipientsCount: result.sent,
            });
            for (const sub of activeSubscribers) {
              await storage.updateWhatsappSubscriber(sub.id, { lastMessageAt: new Date() });
            }
            log(`[WhatsApp Scheduler] ✅ أُرسلت النشرة المجدولة "${nl.title}" إلى ${result.sent} مشترك`);
          } catch (nlErr) {
            console.error(`[WhatsApp Scheduler] خطأ في إرسال النشرة المجدولة ${nl.id}:`, nlErr);
            await storage.updateWhatsappNewsletter(nl.id, { status: "failed" });
          }
        }

        const settings = await storage.getWhatsappSettings();
        if (!settings?.isAutoSendEnabled) return;

        const now = new Date();
        const saudiNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
        const currentHour = saudiNow.getHours();
        const currentMinute = saudiNow.getMinutes();

        if (currentHour !== settings.sendHour || currentMinute !== settings.sendMinute) return;

        // Check if we already sent today
        const todayStr = saudiNow.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
        const recentNewsletters = await storage.getWhatsappNewsletters(10);
        const alreadySentToday = recentNewsletters.some(nl => {
          if (!nl.sentAt) return false;
          const sentDate = new Date(nl.sentAt).toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
          return sentDate === todayStr && nl.status === "sent";
        });

        if (alreadySentToday) return;

        log("[WhatsApp Scheduler] 🌿 إرسال كبسولة الصباح...");

        const recentNews = await storage.getNews(undefined, 20);
        const { generateWhatsAppNewsletter } = await import("./openai");
        const { sendBulkWhatsAppMessages } = await import("./whatsappService");

        const content = await generateWhatsAppNewsletter(
          recentNews.map(n => ({ title: n.title, summary: n.summary || undefined, category: n.category })),
          []
        );

        const dateStr = saudiNow.toLocaleDateString("ar-SA", { timeZone: "Asia/Riyadh", weekday: "long", year: "numeric", month: "long", day: "numeric" });
        const formattedMessage = [
          `🌿 *كبسولة الصباح الصحية*`,
          `📅 ${dateStr}`,
          ``,
          `*${content.title}*`,
          ``,
          ...content.points.map((p, i) => `${i + 1}. ${p}`),
          ``,
          `📖 اقرأ المزيد: https://capsulah.com`,
          ``,
          `━━━━━━━━━━━━━━━━━━`,
          `للإلغاء أرسل: *إيقاف*`,
        ].join("\n");

        const activeSubscribers = await storage.getActiveWhatsappSubscribers([]);
        if (activeSubscribers.length === 0) {
          log("[WhatsApp Scheduler] لا يوجد مشتركون فعّالون");
          return;
        }

        const newsletter = await storage.createWhatsappNewsletter({
          title: content.title,
          content: formattedMessage,
          interests: [],
          recipientsCount: activeSubscribers.length,
          status: "sending",
          sentBy: "auto",
        });

        const phones = activeSubscribers.map(s => s.phone);
        const result = await sendBulkWhatsAppMessages(phones, formattedMessage);

        await storage.updateWhatsappNewsletter(newsletter.id, {
          status: "sent",
          sentAt: new Date(),
          recipientsCount: result.sent,
        });

        for (const sub of activeSubscribers) {
          await storage.updateWhatsappSubscriber(sub.id, { lastMessageAt: new Date() });
        }

        log(`[WhatsApp Scheduler] ✅ أُرسلت كبسولة الصباح إلى ${result.sent} مشترك`);
      } catch (err) {
        console.error("[WhatsApp Scheduler] خطأ:", err);
      }
    };

    runWhatsAppScheduler();
    setInterval(runWhatsAppScheduler, 60 * 1000);
  } catch (err) {
    console.error('[Startup] فشل حرج في بدء تشغيل الخادم:', err);
    process.exit(1);
  }
})();
