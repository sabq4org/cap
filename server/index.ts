import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedProductionIfEmpty } from "./seedProduction";
import { storage } from "./storage";
import { pool } from "./db";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
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
  const server = await registerRoutes(app);
  
  // await seedProductionIfEmpty();

  // Fix category Arabic names and colors on every startup (both dev and prod)
  await fixCategoriesArabic();

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

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
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

  // Run immediately on startup, then every 60 seconds
  runScheduler();
  setInterval(runScheduler, 60 * 1000);
})();
