// Blueprint: javascript_log_in_with_replit
import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupLocalAuth, registerLocalAuthRoutes } from "./localAuth";
import { generateHealthResponse, analyzeSymptoms, analyzeNutrition, analyzeNewsContent, generateImage, generatePromptFromContent, buildNewsImagePrompt, generateInfographicPrompt, extractInfographicFromText, generateInfographicImage, translateAndProcessNews, evaluateNewsImportance, categorizeNewsArticle, generateEditorialInsights, generateArchiveChatResponse, type ArchiveSearchResult, factCheckMedicalContent, simplifyMedicalText, extractNewsFromPdf, debunkMedicalRumor, generateSocialContent } from "./openai";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { 
  insertGenerationSettingsSchema, 
  insertImageGenerationSchema, 
  insertInfographicTemplateSchema, 
  insertInfographicJobSchema,
  type User,
} from "@shared/schema";
import { fetchAllActiveSources, fetchRSSSource, seedDefaultSources, seedDefaultKeywords, classifyPendingItems, cleanupNonHealthItems } from "./radarService";
import { refreshHealthTrends } from "./trendService";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import {
  insertHealthProfileSchema,
  insertTrackerSchema,
  insertNutritionEntrySchema,
  insertArticleSchema,
  insertNewsSchema,
  insertChatSessionSchema,
  insertChatMessageSchema,
  insertRadarSourceSchema,
  insertRadarKeywordSchema,
  insertRadarAlertSchema,
  insertRumorSubmissionSchema,
} from "@shared/schema";
import { objectStorageClient } from "./replit_integrations/object_storage";
import { randomUUID, createHmac, timingSafeEqual } from "crypto";
import sharp from "sharp";
import rateLimit from "express-rate-limit";

const rumorSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "لقد تجاوزت الحد المسموح به من الطلبات. يُسمح بـ 5 طلبات فقط في الساعة. يرجى المحاولة لاحقاً." },
  statusCode: 429,
});

const whatsappSubscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "لقد تجاوزت الحد المسموح به من طلبات الاشتراك. يُسمح بـ 5 طلبات فقط في الساعة." },
  statusCode: 429,
});

const whatsappUnsubscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "لقد تجاوزت الحد المسموح به من الطلبات. يرجى المحاولة لاحقاً." },
  statusCode: 429,
});

// Per-phone cooldown: track the last time a welcome/confirmation WhatsApp
// message was dispatched to a given phone number.  Any phone that already
// received a message within the cooldown window is silently skipped so that
// the subscribe endpoint cannot be scripted to flood arbitrary numbers.
const WHATSAPP_PHONE_SEND_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const whatsappPhoneLastSent = new Map<string, number>();

function canSendToPhone(phone: string): boolean {
  const last = whatsappPhoneLastSent.get(phone);
  if (last !== undefined && Date.now() - last < WHATSAPP_PHONE_SEND_COOLDOWN_MS) {
    return false;
  }
  whatsappPhoneLastSent.set(phone, Date.now());
  return true;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper function to download image and upload to object storage
async function downloadAndUploadImage(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to download image: ${response.status}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.includes('png') ? 'png' : contentType.includes('gif') ? 'gif' : contentType.includes('webp') ? 'webp' : 'jpg';
    const imageBuffer = await response.arrayBuffer();
    
    // Get private object directory and create file path
    const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || '';
    if (!privateObjectDir) {
      console.error('PRIVATE_OBJECT_DIR not set');
      return null;
    }
    
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}.${extension}`;
    
    // Parse bucket name and object name from path
    const pathParts = fullPath.startsWith('/') ? fullPath.slice(1).split('/') : fullPath.split('/');
    const bucketName = pathParts[0];
    const objectName = pathParts.slice(1).join('/');
    
    // Upload to object storage
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    await file.save(Buffer.from(imageBuffer), {
      contentType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    // Return the normalized path
    return `/objects/uploads/${objectId}.${extension}`;
  } catch (error) {
    console.error('Error downloading/uploading image:', error);
    return null;
  }
}

const OG_MAX_SIZE_LIMIT = 300 * 1024; // 300KB

// Helper function to optimize image for OG (Open Graph) sharing
async function optimizeImageForOG(imageUrl: string, baseUrl?: string): Promise<Buffer | null> {
  try {
    let imageBuffer: Buffer;
    
    // For local object storage paths, read directly from storage
    if (imageUrl.startsWith('/objects/')) {
      try {
        const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || '';
        const defaultBucket = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || '';
        
        if (privateObjectDir || defaultBucket) {
          // Parse path matching downloadAndUploadImage's structure
          // downloadAndUploadImage saves to: ${privateObjectDir}/uploads/${uuid}.ext
          // and returns: /objects/uploads/${uuid}.ext
          // So we need to reconstruct the full object path
          const relativePath = imageUrl.replace('/objects/', ''); // e.g., "uploads/uuid.jpg"
          
          // Parse PRIVATE_OBJECT_DIR to get bucket and base path
          const pathParts = privateObjectDir.startsWith('/') ? privateObjectDir.slice(1).split('/') : privateObjectDir.split('/');
          const bucketName = pathParts[0];
          const basePath = pathParts.slice(1).join('/'); // e.g., ".private"
          
          // Construct full object name: basePath + relativePath
          const objectName = basePath ? `${basePath}/${relativePath}` : relativePath;
          
          if (!bucketName) {
            console.error('No bucket name found for OG image optimization');
            return null;
          }

          const bucket = objectStorageClient.bucket(bucketName);
          const file = bucket.file(objectName);
          
          const [exists] = await file.exists();
          if (exists) {
            const [data] = await file.download();
            imageBuffer = data;
          } else {
            console.error(`Object not found: ${objectName} in bucket ${bucketName}`);
            return null;
          }
        } else {
          console.error('Missing storage configuration for OG image optimization');
          return null;
        }
      } catch (storageError) {
        console.error('Error reading from object storage:', storageError);
        return null;
      }
    } else if (imageUrl.startsWith('http')) {
      // Fetch external images
      const response = await fetch(imageUrl, { 
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch image for OG optimization: ${response.status}`);
        return null;
      }
      
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      return null;
    }
    
    // Detect HEIF/AVIF format (Sharp cannot decode these) — bail early
    // Magic: bytes 4-7 are 'ftyp' (0x66 0x74 0x79 0x70)
    if (
      imageBuffer.length > 11 &&
      imageBuffer[4] === 0x66 && imageBuffer[5] === 0x74 &&
      imageBuffer[6] === 0x79 && imageBuffer[7] === 0x70
    ) {
      const brand = imageBuffer.toString('ascii', 8, 12).toLowerCase();
      if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'avif', 'avis'].includes(brand)) {
        console.warn(`[OG] Skipping unsupported HEIF/AVIF image (brand: ${brand})`);
        return null;
      }
    }

    const maxDim = 1200;

    let resizedBuffer = await sharp(imageBuffer, { failOn: 'none' })
      .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
      .toFormat('jpeg')
      .jpeg({ quality: 82, progressive: true })
      .toBuffer();

    if (resizedBuffer.length > OG_MAX_SIZE_LIMIT) {
      resizedBuffer = await sharp(imageBuffer, { failOn: 'none' })
        .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
        .toFormat('jpeg')
        .jpeg({ quality: 60, progressive: true })
        .toBuffer();
    }

    if (resizedBuffer.length > OG_MAX_SIZE_LIMIT) {
      resizedBuffer = await sharp(imageBuffer, { failOn: 'none' })
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .toFormat('jpeg')
        .jpeg({ quality: 50, progressive: true })
        .toBuffer();
    }

    return resizedBuffer;
  } catch (error) {
    console.error('Error optimizing image for OG:', error);
    return null;
  }
}

// Generate 7-character short code (mixed case letters and numbers)
function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  setupLocalAuth(app);
  registerLocalAuthRoutes(app);

  // Setup object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // Temporary seed endpoint for production database
  app.get("/api/admin/seed-production", async (req, res) => {
    const key = req.query.key;
    if (key !== process.env.SESSION_SECRET) {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const fs = await import("fs");
      const path = await import("path");
      const { pool } = await import("./db");

      const countResult = await pool.query("SELECT count(*) as cnt FROM news");
      const existingCount = parseInt(countResult.rows[0].cnt, 10);

      let seedPath = path.resolve(import.meta.dirname, "data", "seed_data.sql");
      if (!fs.existsSync(seedPath)) {
        seedPath = path.resolve(import.meta.dirname, "..", "server", "data", "seed_data.sql");
      }
      if (!fs.existsSync(seedPath)) {
        return res.json({ message: "No seed file found", tried: [
          path.resolve(import.meta.dirname, "data", "seed_data.sql"),
          path.resolve(import.meta.dirname, "..", "server", "data", "seed_data.sql")
        ], dirname: import.meta.dirname, existingNews: existingCount });
      }

      if (existingCount > 0) {
        return res.json({ message: "Already seeded", newsCount: existingCount });
      }

      const sql = fs.readFileSync(seedPath, "utf-8");
      const client = await pool.connect();
      let successCount = 0;
      let errorCount = 0;
      
      try {
        const lines = sql.split("\n");
        let currentStatement = "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("--") || trimmed.startsWith("\\")) continue;
          if (trimmed.startsWith("SET ") || trimmed.startsWith("SELECT ") || trimmed.startsWith("ALTER TABLE")) continue;
          currentStatement += line + "\n";
          if (trimmed.endsWith(";")) {
            const stmt = currentStatement.trim();
            if (stmt.toUpperCase().startsWith("INSERT")) {
              try {
                await client.query(stmt);
                successCount++;
              } catch (err: any) {
                if (err.code !== "23505" && err.code !== "23503") errorCount++;
              }
            }
            currentStatement = "";
          }
        }
      } finally {
        client.release();
      }

      const finalResult = await pool.query("SELECT count(*) as cnt FROM news");
      res.json({ message: "Seed completed", newsCount: finalResult.rows[0].cnt, successCount, errorCount });
    } catch (err: any) {
      res.status(500).json({ message: err.message, stack: err.stack?.slice(0, 300) });
    }
  });

  // Temporary admin endpoint to clear news for re-import - moved after isAdminAuthenticated

  // HTML escape helper for security
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Sanitize admin/feed-authored HTML before embedding it in crawler pages.
  // Crawler detection is User-Agent based (spoofable), so this output can reach
  // real browsers — strip script/style/iframe-style elements, inline event
  // handlers, and javascript: URLs to prevent stored XSS.
  const sanitizeContentHtml = (html: string): string =>
    html
      .replace(/<\s*(script|style|iframe|object|embed|link|meta|form|input|button|textarea|noscript|svg)\b[\s\S]*?<\/\s*\1\s*>/gi, '')
      .replace(/<\s*(script|style|iframe|object|embed|link|meta|form|input|button|textarea|noscript|svg)\b[^>]*\/?>/gi, '')
      .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
      .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
      .replace(/(href|src)\s*=\s*"\s*javascript:[^"]*"/gi, '$1="#"')
      .replace(/(href|src)\s*=\s*'\s*javascript:[^']*'/gi, "$1='#'")
      .replace(/(href|src)\s*=\s*javascript:[^\s>]+/gi, '$1="#"');

  // Strip HTML tags to plain text (for meta description fallback + JSON-LD articleBody)
  const stripHtml = (html: string): string =>
    html
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ')
      .trim();

  // Canonical public origin for sitemaps/robots (prefer BASE_URL on Railway).
  const getSiteBaseUrl = (): string => {
    const fromEnv = (process.env.BASE_URL || '').trim().replace(/\/$/, '');
    if (fromEnv) return fromEnv;
    return 'https://capsulah.com';
  };

  const getRequestBaseUrl = (req: { get: (h: string) => string | undefined }): string => {
    const reqHost = req.get('host') || 'capsulah.com';
    const proto = req.get('x-forwarded-proto') || (reqHost.includes('localhost') ? 'http' : 'https');
    return `${proto}://${reqHost}`;
  };

  const isCrawlerRequest = (req: { get: (h: string) => string | undefined }): boolean => {
    const userAgent = req.get('User-Agent') || '';
    return /Googlebot|bingbot|WhatsApp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|TelegramBot|Slackbot|Discordbot|Pinterest|Slack|Telegram|bot|crawler|spider/i.test(userAgent);
  };

  const isPublicNews = (item: { status?: string | null; scheduledAt?: Date | string | null; deletedAt?: Date | string | null }): boolean => {
    if (!item || item.deletedAt) return false;
    if (item.status === 'deleted' || item.status === 'draft') return false;
    if (item.status === 'published') return true;
    if (item.status === 'scheduled' && item.scheduledAt && new Date(item.scheduledAt).getTime() <= Date.now()) {
      return true;
    }
    return false;
  };

  const isPublicArticle = (item: { status?: string | null; scheduledAt?: Date | string | null }): boolean => {
    if (!item) return false;
    if (item.status === 'published') return true;
    if (item.status === 'scheduled' && item.scheduledAt && new Date(item.scheduledAt).getTime() <= Date.now()) {
      return true;
    }
    return false;
  };

  const notFoundHtml = (title = 'الصفحة غير موجودة'): string => {
    const escTitle = escapeHtml(title);
    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escTitle} | كبسولة</title>
  <meta name="robots" content="noindex, follow">
  <meta name="description" content="الصفحة المطلوبة غير موجودة على كبسولة.">
</head>
<body>
  <h1>404 — ${escTitle}</h1>
  <p><a href="/">العودة إلى كبسولة</a></p>
</body>
</html>`;
  };

  function buildCrawlerHtml(opts: {
    title: string;
    description: string;
    ogImageUrl: string;
    pageUrl: string;
    publishedAt?: Date | string | null;
    updatedAt?: Date | string | null;
    contentHtml?: string | null;
    keywords?: string[] | null;
    author?: string | null;
    articleImageUrl?: string | null;
    redirect?: boolean;
  }) {
    const { title, description, ogImageUrl, pageUrl, publishedAt, updatedAt, contentHtml, keywords, author, articleImageUrl, redirect = true } = opts;
    const escTitle = escapeHtml(title);
    const escDesc = escapeHtml(description);
    const pub = publishedAt ? new Date(publishedAt).toISOString() : undefined;
    const mod = updatedAt ? new Date(updatedAt).toISOString() : pub;
    const plainBody = contentHtml ? stripHtml(contentHtml) : '';

    const jsonLd: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
      headline: title.slice(0, 110),
      description,
      image: [articleImageUrl || ogImageUrl],
      inLanguage: 'ar',
      author: { '@type': author ? 'Person' : 'Organization', name: author || 'كبسولة' },
      publisher: {
        '@type': 'Organization',
        name: 'كبسولة',
        logo: { '@type': 'ImageObject', url: `${getSiteBaseUrl()}/favicon.png` },
      },
    };
    if (pub) jsonLd.datePublished = pub;
    if (mod) jsonLd.dateModified = mod;
    if (plainBody) jsonLd.articleBody = plainBody;
    if (keywords && keywords.length) jsonLd.keywords = keywords.join(', ');
    // Escape "<" so the article body can never break out of the <script> tag.
    const jsonLdStr = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escTitle} | كبسولة</title>
  <meta name="description" content="${escDesc}">
  ${keywords && keywords.length ? `<meta name="keywords" content="${escapeHtml(keywords.join(', '))}">` : ''}
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="كبسولة">
  <meta property="og:title" content="${escTitle}">
  <meta property="og:description" content="${escDesc}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:locale" content="ar_SA">
  ${pub ? `<meta property="article:published_time" content="${pub}">` : ''}
  ${mod ? `<meta property="article:modified_time" content="${mod}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@capsulah_sa">
  <meta name="twitter:title" content="${escTitle}">
  <meta name="twitter:description" content="${escDesc}">
  <meta name="twitter:image" content="${ogImageUrl}">
  <meta name="twitter:image:alt" content="${escTitle}">
  <link rel="canonical" href="${pageUrl}">
  <script type="application/ld+json">${jsonLdStr}</script>
  ${redirect ? `<meta http-equiv="refresh" content="2;url=${pageUrl}">` : ''}
</head>
<body>
  <article>
    <h1>${escTitle}</h1>
    <img src="${ogImageUrl}" alt="${escTitle}">
    ${contentHtml ? sanitizeContentHtml(contentHtml) : `<p>${escDesc}</p>`}
  </article>
  ${redirect ? `<p><a href="${pageUrl}">اقرأ الخبر كاملاً على كبسولة</a></p>` : ''}
</body>
</html>`;
  }

  // Optimized OG image endpoint - serves resized 1200x630 JPEG for WhatsApp/Facebook
  // Maximum allowed size for OG images (strict enforcement)
  const OG_MAX_SIZE = 300 * 1024; // 300KB
  
  // Pre-computed minimal fallback: 1x1 green pixel JPEG (absolute minimum, ~631 bytes)
  const MINIMAL_FALLBACK_JPEG = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
    0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
    0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
    0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
    0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
    0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
    0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
    0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
    0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
    0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
    0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xDB, 0x20, 0xA8, 0xE8, 0x28, 0xA2,
    0x80, 0x3F, 0xFF, 0xD9
  ]);
  
  // Generate fallback OG image with strict size guarantee
  const generateFallbackOGImage = async (): Promise<Buffer> => {
    try {
      const buffer = await sharp({
        create: {
          width: 1200,
          height: 630,
          channels: 3,
          background: { r: 34, g: 139, b: 34 } // Forest green
        }
      })
      .jpeg({ quality: 80 })
      .toBuffer();
      
      if (buffer.length > OG_MAX_SIZE) {
        return MINIMAL_FALLBACK_JPEG;
      }
      return buffer;
    } catch {
      return MINIMAL_FALLBACK_JPEG;
    }
  };

  // Shared handler for OG image serving (used by both /og/:id and /api/og-image/:id)
  const serveOGImage = async (req: any, res: any) => {
    const sendSafeImage = async (buffer: Buffer | null, cacheTime: number): Promise<void> => {
      let safeBuffer = buffer;
      if (!safeBuffer || safeBuffer.length > OG_MAX_SIZE) {
        safeBuffer = await generateFallbackOGImage();
        if (safeBuffer.length > OG_MAX_SIZE) safeBuffer = MINIMAL_FALLBACK_JPEG;
      }
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Length': safeBuffer.length,
        'Cache-Control': `public, max-age=${cacheTime}`,
        'X-Robots-Tag': 'noindex'
      });
      res.send(safeBuffer);
    };

    try {
      // Try by ID first, then by shortCode
      let newsItem = await storage.getNewsById(req.params.id);
      if (!newsItem) {
        newsItem = await storage.getNewsByShortCode(req.params.id);
      }
      
      if (!newsItem || !newsItem.imageUrl) {
        return sendSafeImage(null, 3600);
      }
      
      const optimizedImage = await optimizeImageForOG(newsItem.imageUrl);
      await sendSafeImage(optimizedImage, 86400);
    } catch (error) {
      console.error('Error serving OG image:', error);
      await sendSafeImage(null, 3600);
    }
  };

  // Primary OG image route — outside /api/ so robots.txt never blocks social crawlers
  app.get('/og/:id', serveOGImage);
  // Keep legacy route for backward compatibility
  app.get('/api/og-image/:id', serveOGImage);

  // robots.txt
  app.get('/robots.txt', (_req, res) => {
    const baseUrl = getSiteBaseUrl();
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /api/',
        'Disallow: /login',
        'Disallow: /register',
        '',
        `Sitemap: ${baseUrl}/sitemap.xml`,
        `Sitemap: ${baseUrl}/sitemap-news.xml`,
      ].join('\n')
    );
  });

  app.get('/sitemap.xml', async (_req, res) => {
    try {
      const baseUrl = getSiteBaseUrl();
      // Only reference the articles sitemap when articles exist — an empty
      // sitemap shows up as an error in Google Search Console.
      let hasArticles = false;
      try {
        const articlesList = await storage.getArticles(undefined, 1);
        hasArticles = articlesList.length > 0;
      } catch (e) {
        console.error('Sitemap index: failed to check articles existence:', e);
      }
      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        `  <sitemap><loc>${baseUrl}/sitemap-static.xml</loc></sitemap>`,
        `  <sitemap><loc>${baseUrl}/sitemap-news.xml</loc></sitemap>`,
        `  <sitemap><loc>${baseUrl}/sitemap-general.xml</loc></sitemap>`,
        hasArticles ? `  <sitemap><loc>${baseUrl}/sitemap-articles.xml</loc></sitemap>` : '',
        '</sitemapindex>',
      ].filter(Boolean).join('\n');
      res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(xml);
    } catch (error) {
      console.error('Error generating sitemap index:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  app.get('/sitemap-static.xml', async (_req, res) => {
    try {
      const baseUrl = getSiteBaseUrl();
      const today = new Date().toISOString().split('T')[0];
      const cats = await storage.getCategories(true);

      const staticPages = [
        { loc: baseUrl, priority: '1.0', changefreq: 'hourly' },
        { loc: `${baseUrl}/news`, priority: '0.9', changefreq: 'hourly' },
        { loc: `${baseUrl}/articles`, priority: '0.8', changefreq: 'daily' },
      ];

      const catPages = cats.map(c => ({
        loc: `${baseUrl}/news?category=${encodeURIComponent(c.slug)}`,
        priority: '0.7',
        changefreq: 'daily',
      }));

      const allPages = [...staticPages, ...catPages];

      const urls = allPages.map(u =>
        `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
      ).join('\n');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
      res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(xml);
    } catch (error) {
      console.error('Error generating static sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Google News sitemap: ONLY articles from the last 48 hours, max 1000 URLs
  // (Google News rules — violating them makes Google ignore the whole sitemap)
  app.get('/sitemap-news.xml', async (_req, res) => {
    try {
      const baseUrl = getSiteBaseUrl();
      const published = await storage.getNewsForSitemap();

      const cutoff = Date.now() - 48 * 60 * 60 * 1000;
      const withinWindow = (item: { publishedAt: Date | null }) =>
        !!item.publishedAt && new Date(item.publishedAt).getTime() >= cutoff;
      let recent = published.filter(withinWindow).slice(0, 1000);
      // Fallback: if nothing was published in the last 48h, include the latest
      // few items WITHOUT <news:news> tags (old items with news tags violate
      // Google News rules) so the sitemap is never empty.
      if (recent.length === 0) {
        recent = published.slice(0, 10);
      }

      const urls = recent.map(item => {
        const includeNewsTag = withinWindow(item);
        const loc = item.shortCode ? `${baseUrl}/n/${item.shortCode}` : `${baseUrl}/news/${item.id}`;
        const lastmod = item.publishedAt ? new Date(item.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const pubDate = item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString();

        let imageTag = '';
        if (item.imageUrl) {
          const fullImageUrl = item.imageUrl.startsWith('/') ? `${baseUrl}${item.imageUrl}` : item.imageUrl;
          imageTag = `\n    <image:image>\n      <image:loc>${escapeXml(fullImageUrl)}</image:loc>\n      <image:title>${escapeXml(item.title)}</image:title>\n    </image:image>`;
        }

        const newsTag = includeNewsTag ? '\n' + [
          '    <news:news>',
          '      <news:publication>',
          '        <news:name>كبسولة</news:name>',
          '        <news:language>ar</news:language>',
          '      </news:publication>',
          `      <news:publication_date>${pubDate}</news:publication_date>`,
          `      <news:title>${escapeXml(item.title)}</news:title>`,
          item.keywords && item.keywords.length > 0
            ? `      <news:keywords>${escapeXml(item.keywords.join(', '))}</news:keywords>`
            : '',
          '    </news:news>',
        ].filter(Boolean).join('\n') : '';

        return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>${imageTag}${newsTag}\n  </url>`;
      }).join('\n');

      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"',
        '  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
        urls,
        '</urlset>',
      ].join('\n');

      res.type('application/xml').set('Cache-Control', 'public, max-age=1800').send(xml);
    } catch (error) {
      console.error('Error generating news sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // General sitemap: ALL published news as a plain urlset (no Google News tags)
  // so older items stay discoverable for regular indexing.
  app.get('/sitemap-general.xml', async (_req, res) => {
    try {
      const baseUrl = getSiteBaseUrl();
      const published = await storage.getNewsForSitemap();

      const urls = published.map(item => {
        const loc = item.shortCode ? `${baseUrl}/n/${item.shortCode}` : `${baseUrl}/news/${item.id}`;
        const lastmod = item.publishedAt ? new Date(item.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
      }).join('\n');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
      res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(xml);
    } catch (error) {
      console.error('Error generating general sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  app.get('/sitemap-articles.xml', async (_req, res) => {
    try {
      const baseUrl = getSiteBaseUrl();
      const articlesList = await storage.getArticles(undefined, 500);

      const urls = articlesList.map(article => {
        const loc = `${baseUrl}/articles/${article.slug}`;
        const lastmod = article.updatedAt ? new Date(article.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
      }).join('\n');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
      res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(xml);
    } catch (error) {
      console.error('Error generating articles sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Social media crawler meta tags API endpoint - redirects to short URL
  app.get('/api/share/news/:id', async (req, res) => {
    try {
      const newsItem = await storage.getNewsById(req.params.id);
      if (!newsItem || !isPublicNews(newsItem)) {
        return res.status(404).set({ 'Content-Type': 'text/html', 'Cache-Control': 'private, no-store' }).send(notFoundHtml('الخبر غير موجود'));
      }

      const baseUrl = getRequestBaseUrl(req);
      // Prefer short URL if available
      const pageUrl = newsItem.shortCode 
        ? `${baseUrl}/n/${newsItem.shortCode}`
        : `${baseUrl}/news/${newsItem.id}`;
      
      const imageId = newsItem.shortCode || newsItem.id;
      const ogImageUrl = `${baseUrl}/og/${imageId}`;
      const articleImageUrl = newsItem.imageUrl ? (newsItem.imageUrl.startsWith('/') ? `${baseUrl}${newsItem.imageUrl}` : newsItem.imageUrl) : null;
      const rawDescription = newsItem.summary || newsItem.seoDescription || (newsItem.content ? stripHtml(newsItem.content).slice(0, 160) : `${newsItem.title} - اقرأ المزيد على كبسولة`);
      
      const html = buildCrawlerHtml({ title: newsItem.title, description: rawDescription, ogImageUrl, pageUrl, publishedAt: newsItem.publishedAt, updatedAt: newsItem.updatedAt, contentHtml: newsItem.content, keywords: newsItem.keywords, author: newsItem.createdBy, articleImageUrl });
      
      res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
    } catch (error) {
      console.error('Error generating share page:', error);
      res.redirect(`/news/${req.params.id}`);
    }
  });

  // Social media crawler detection and short URL redirect for news URLs with UUID
  app.get('/news/:id', async (req, res, next) => {
    const isCrawler = isCrawlerRequest(req);

    try {
      const newsItem = await storage.getNewsById(req.params.id);

      if (!newsItem || !isPublicNews(newsItem)) {
        // Hard 404 for everyone — avoid soft-404 SPA shells that hurt indexing.
        return res.status(404).set({ 'Content-Type': 'text/html', 'Cache-Control': 'private, no-store' }).send(notFoundHtml('الخبر غير موجود'));
      }

      if (newsItem.shortCode) {
        if (isCrawler) {
          const baseUrl = getRequestBaseUrl(req);
          const canonicalUrl = `${baseUrl}/n/${newsItem.shortCode}`;
          const ogImageUrl = `${baseUrl}/og/${newsItem.shortCode}`;
          const articleImageUrl = newsItem.imageUrl ? (newsItem.imageUrl.startsWith('/') ? `${baseUrl}${newsItem.imageUrl}` : newsItem.imageUrl) : null;
          const rawDescription = newsItem.summary || newsItem.seoDescription || (newsItem.content ? stripHtml(newsItem.content).slice(0, 160) : `${newsItem.title} - اقرأ المزيد على كبسولة`);
          const html = buildCrawlerHtml({ title: newsItem.title, description: rawDescription, ogImageUrl, pageUrl: canonicalUrl, publishedAt: newsItem.publishedAt, updatedAt: newsItem.updatedAt, contentHtml: newsItem.content, keywords: newsItem.keywords, author: newsItem.createdBy, articleImageUrl, redirect: false });
          return res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
        }
        return res.redirect(301, `/n/${newsItem.shortCode}`);
      }

      if (isCrawler) {
        const baseUrl = getRequestBaseUrl(req);
        const pageUrl = `${baseUrl}/news/${newsItem.id}`;
        const ogImageUrl = `${baseUrl}/og/${newsItem.id}`;
        const articleImageUrl = newsItem.imageUrl ? (newsItem.imageUrl.startsWith('/') ? `${baseUrl}${newsItem.imageUrl}` : newsItem.imageUrl) : null;
        const rawDescription = newsItem.summary || newsItem.seoDescription || (newsItem.content ? stripHtml(newsItem.content).slice(0, 160) : `${newsItem.title} - اقرأ المزيد على كبسولة`);
        const html = buildCrawlerHtml({ title: newsItem.title, description: rawDescription, ogImageUrl, pageUrl, publishedAt: newsItem.publishedAt, updatedAt: newsItem.updatedAt, contentHtml: newsItem.content, keywords: newsItem.keywords, author: newsItem.createdBy, articleImageUrl, redirect: false });
        return res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
      }

      return next();
    } catch (error) {
      console.error('Error in /news/:id handler:', error);
      next();
    }
  });

  app.get('/n/:shortCode', async (req, res, next) => {
    const isCrawler = isCrawlerRequest(req);

    try {
      const newsItem = await storage.getNewsByShortCode(req.params.shortCode);

      if (!newsItem || !isPublicNews(newsItem)) {
        return res.status(404).set({ 'Content-Type': 'text/html', 'Cache-Control': 'private, no-store' }).send(notFoundHtml('الخبر غير موجود'));
      }

      if (!isCrawler) {
        return next();
      }

      const baseUrl = getRequestBaseUrl(req);
      const pageUrl = `${baseUrl}/n/${newsItem.shortCode}`;
      const ogImageUrl = `${baseUrl}/og/${newsItem.shortCode || newsItem.id}`;
      const articleImageUrl = newsItem.imageUrl ? (newsItem.imageUrl.startsWith('/') ? `${baseUrl}${newsItem.imageUrl}` : newsItem.imageUrl) : null;
      const rawDescription = newsItem.summary || newsItem.seoDescription || (newsItem.content ? stripHtml(newsItem.content).slice(0, 160) : `${newsItem.title} - اقرأ المزيد على كبسولة`);

      const html = buildCrawlerHtml({ title: newsItem.title, description: rawDescription, ogImageUrl, pageUrl, publishedAt: newsItem.publishedAt, updatedAt: newsItem.updatedAt, contentHtml: newsItem.content, keywords: newsItem.keywords, author: newsItem.createdBy, articleImageUrl, redirect: false });

      res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
    } catch (error) {
      console.error('Error in /n/:shortCode handler:', error);
      next();
    }
  });

  // Crawler HTML for medical articles (same SPA problem as news pages)
  app.get('/articles/:slug', async (req, res, next) => {
    if (!isCrawlerRequest(req)) {
      return next();
    }

    try {
      const article = await storage.getArticleBySlug(req.params.slug);
      if (!article || !isPublicArticle(article)) {
        return res.status(404).set({ 'Content-Type': 'text/html', 'Cache-Control': 'private, no-store' }).send(notFoundHtml('المقال غير موجود'));
      }

      const baseUrl = getRequestBaseUrl(req);
      const pageUrl = `${baseUrl}/articles/${article.slug}`;
      const articleImageUrl = article.imageUrl
        ? (article.imageUrl.startsWith('/') ? `${baseUrl}${article.imageUrl}` : article.imageUrl)
        : `${baseUrl}/og-image.png`;
      const ogImageUrl = articleImageUrl;
      const rawDescription = article.seoDescription || article.excerpt || (article.content ? stripHtml(article.content).slice(0, 160) : article.title);
      const keywords = (article.keywords && article.keywords.length > 0) ? article.keywords : (article.tags || []);
      const html = buildCrawlerHtml({
        title: article.seoTitle || article.title,
        description: rawDescription,
        ogImageUrl,
        pageUrl,
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt,
        contentHtml: article.content,
        keywords,
        author: article.author || article.reviewedBy,
        articleImageUrl,
        redirect: false,
      });
      return res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
    } catch (error) {
      console.error('Error in /articles/:slug crawler handler:', error);
      next();
    }
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Admin session (from admin panel login)
      if (req.session?.adminAuthenticated) {
        return res.json({
          id: "admin",
          email: "admin@capsulah.com",
          firstName: "مدير",
          lastName: "النظام",
          role: "super_admin",
          isActive: true,
          profileImageUrl: null,
          authProvider: "admin",
          createdAt: null,
          updatedAt: null,
          lastLoginAt: null,
        });
      }
      // Regular user (Passport auth)
      if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user) {
        const { passwordHash: _omit, ...safeUser }: User = user;
        return res.json(safeUser);
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ── Capsule (Personalized Feed) Routes ─────────────────────────────────────

  // GET current user's interests
  app.get('/api/capsule/interests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const interests = await storage.getUserInterests(userId);
      res.json({ interests });
    } catch (error) {
      console.error("Error fetching interests:", error);
      res.status(500).json({ message: "Failed to fetch interests" });
    }
  });

  // PUT update current user's interests
  app.put('/api/capsule/interests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schema = z.object({ interests: z.array(z.string()) });
      const { interests } = schema.parse(req.body);
      await storage.updateUserInterests(userId, interests);
      res.json({ interests });
    } catch (error: any) {
      console.error("Error updating interests:", error);
      res.status(400).json({ message: error.message || "Failed to update interests" });
    }
  });

  // GET personalized capsule feed (news + articles combined)
  app.get('/api/capsule/feed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const page = Math.max(1, parseInt(req.query.page as string || "1", 10));
      const perPage = Math.max(1, Math.min(parseInt(req.query.perPage as string || "20", 10), 50));
      const interests = await storage.getUserInterests(userId);
      const result = await storage.getCapsuleFeed(interests, page, perPage);
      res.json(result);
    } catch (error) {
      console.error("Error fetching capsule feed:", error);
      res.status(500).json({ message: "Failed to fetch capsule feed" });
    }
  });

  // ── End Capsule Routes ───────────────────────────────────────────────────────

  // Health Profile routes
  app.get('/api/health-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getHealthProfile(userId);
      res.json(profile || null);
    } catch (error) {
      console.error("Error fetching health profile:", error);
      res.status(500).json({ message: "Failed to fetch health profile" });
    }
  });

  app.post('/api/health-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = insertHealthProfileSchema.parse({ ...req.body, userId });
      const profile = await storage.upsertHealthProfile(validated);
      res.json(profile);
    } catch (error: any) {
      console.error("Error creating health profile:", error);
      res.status(400).json({ message: error.message || "Failed to create health profile" });
    }
  });

  // Tracker routes
  app.get('/api/trackers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const type = req.query.type as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const trackers = await storage.getTrackers(userId, type, limit);
      res.json(trackers);
    } catch (error) {
      console.error("Error fetching trackers:", error);
      res.status(500).json({ message: "Failed to fetch trackers" });
    }
  });

  app.post('/api/trackers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = insertTrackerSchema.parse({ ...req.body, userId });
      const tracker = await storage.addTracker(validated);
      res.json(tracker);
    } catch (error: any) {
      console.error("Error adding tracker:", error);
      res.status(400).json({ message: error.message || "Failed to add tracker" });
    }
  });

  // Nutrition routes
  app.get('/api/nutrition', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const entries = await storage.getNutritionEntries(userId, startDate, endDate);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching nutrition entries:", error);
      res.status(500).json({ message: "Failed to fetch nutrition entries" });
    }
  });

  app.post('/api/nutrition', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = insertNutritionEntrySchema.parse({ ...req.body, userId });
      const entry = await storage.addNutritionEntry(validated);
      res.json(entry);
    } catch (error: any) {
      console.error("Error adding nutrition entry:", error);
      res.status(400).json({ message: error.message || "Failed to add nutrition entry" });
    }
  });

  // Nutrition analysis with AI
  app.post('/api/nutrition/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const { mealName, items } = req.body;
      if (!mealName || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const analysis = await analyzeNutrition(mealName, items);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing nutrition:", error);
      res.status(500).json({ message: "Failed to analyze nutrition" });
    }
  });

  // Roles that can manage users and admin content
  const userManagementRoles = ["super_admin", "editor_in_chief"];
  
  // Middleware to check admin permissions
  const isAdminAuthenticated = async (req: any, res: any, next: any) => {
    // Check session-based admin auth (from AdminLogin)
    if (req.session?.adminAuthenticated) {
      return next();
    }
    
    // Check Replit Auth user with admin role
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      const user = await storage.getUser(req.user.id);
      if (user && userManagementRoles.includes(user.role || '')) {
        return next();
      }
    }
    
    return res.status(401).json({ message: "غير مصرح" });
  };

  // Middleware restricted to super_admin role only
  const isSuperAdmin = (req: any, res: any, next: any) => {
    if (!req.session?.adminAuthenticated) return res.status(401).json({ message: "غير مصرح" });
    const role = (req.session as any).adminRole;
    const perms: string[] = (req.session as any).adminPermissions || [];
    if (role === "super_admin" || perms.includes("*")) return next();
    return res.status(403).json({ message: "هذه العملية للمدير العام فقط" });
  };

  // Re-reads permissions from DB and refreshes the session if they changed.
  // Called lazily when a session appears stale (missing a required permission).
  const refreshSessionPermissions = async (req: any): Promise<string[]> => {
    try {
      const { pool } = await import("./db");
      const username = req.session?.adminUsername;
      if (!username) return (req.session as any).adminPermissions || [];
      const { rows } = await pool.query(
        "SELECT permissions FROM admin_accounts WHERE username = $1 AND is_active = true",
        [username]
      );
      if (!rows[0]) return (req.session as any).adminPermissions || [];
      const freshPerms: string[] = rows[0].permissions || [];
      (req.session as any).adminPermissions = freshPerms;
      await new Promise<void>((resolve) => req.session.save(() => resolve()));
      return freshPerms;
    } catch {
      return (req.session as any).adminPermissions || [];
    }
  };

  // Middleware factory: requires a specific admin permission key.
  // Super-admin role always passes. If the session appears stale,
  // permissions are re-read from the DB and the session is updated.
  const requireAdminPermission = (permission: string) => async (req: any, res: any, next: any) => {
    if (!req.session?.adminAuthenticated) return res.status(401).json({ message: "غير مصرح" });
    const role = (req.session as any).adminRole;
    let perms: string[] = (req.session as any).adminPermissions || [];
    if (role === "super_admin" || perms.includes("*") || perms.includes(permission)) return next();
    // Session may be stale — refresh from DB once before rejecting
    perms = await refreshSessionPermissions(req);
    if (role === "super_admin" || perms.includes("*") || perms.includes(permission)) return next();
    return res.status(403).json({ message: "ليس لديك صلاحية للقيام بهذه العملية" });
  };

  // Middleware factory: requires any one of the given admin permission keys.
  // Super-admin role always passes. If the session appears stale,
  // permissions are re-read from the DB and the session is updated.
  const requireAnyAdminPermission = (...permissions: string[]) => async (req: any, res: any, next: any) => {
    if (!req.session?.adminAuthenticated) return res.status(401).json({ message: "غير مصرح" });
    const role = (req.session as any).adminRole;
    let perms: string[] = (req.session as any).adminPermissions || [];
    if (role === "super_admin" || perms.includes("*") || permissions.some(p => perms.includes(p))) return next();
    // Session may be stale — refresh from DB once before rejecting
    perms = await refreshSessionPermissions(req);
    if (role === "super_admin" || perms.includes("*") || permissions.some(p => perms.includes(p))) return next();
    return res.status(403).json({ message: "ليس لديك صلاحية للقيام بهذه العملية" });
  };

  app.delete("/api/admin/clear-news", isSuperAdmin, async (req, res) => {
    try {
      const { pool } = await import("./db");
      const r1 = await pool.query("DELETE FROM radar_items");
      const r2 = await pool.query("DELETE FROM radar_fetch_logs");
      const r3 = await pool.query("DELETE FROM radar_alerts");
      const r4 = await pool.query("DELETE FROM radar_notifications");
      const r5 = await pool.query("DELETE FROM news");
      const r6 = await pool.query("DELETE FROM articles");
      const total = (r1.rowCount||0)+(r2.rowCount||0)+(r3.rowCount||0)+(r4.rowCount||0)+(r5.rowCount||0)+(r6.rowCount||0);
      res.json({
        message: "تم حذف جميع الأخبار من قاعدة البيانات",
        details: {
          radar_items: r1.rowCount,
          radar_fetch_logs: r2.rowCount,
          radar_alerts: r3.rowCount,
          radar_notifications: r4.rowCount,
          news: r5.rowCount,
          articles: r6.rowCount,
        },
        total,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Article routes
  app.get('/api/articles', async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const includeAll = req.query.includeAll === 'true';
      const articles = await storage.getArticles(category, limit, includeAll);
      res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // Admin: fetch any article by id (incl. drafts/scheduled) for editing
  app.get('/api/admin/articles/:id', requireAdminPermission('edit_news'), async (req, res) => {
    try {
      const article = await storage.getArticleById(req.params.id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching admin article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.get('/api/articles/:slug', async (req, res) => {
    try {
      const article = await storage.getArticleBySlug(req.params.slug);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      if (!isPublicArticle(article)) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.post('/api/articles', requireAdminPermission('publish_news'), async (req, res) => {
    try {
      const body: any = { ...req.body };
      if (body.scheduledAt) body.scheduledAt = new Date(body.scheduledAt);
      if (body.publishedAt) body.publishedAt = new Date(body.publishedAt);
      // Scheduling: when status === 'scheduled', mirror scheduledAt to publishedAt for ordering
      if (body.status === 'scheduled' && body.scheduledAt) {
        body.publishedAt = body.scheduledAt;
      } else if (body.status === 'published' && !body.publishedAt) {
        body.publishedAt = new Date();
      }
      const articleData = insertArticleSchema.parse(body);
      const article = await storage.createArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      console.error("Error creating article:", error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  app.patch('/api/articles/:id', requireAdminPermission('edit_news'), async (req, res) => {
    try {
      const { id } = req.params;
      const body: any = { ...req.body };
      if (body.scheduledAt !== undefined) {
        body.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
        if (body.status === 'scheduled' && body.scheduledAt) {
          body.publishedAt = body.scheduledAt;
        }
      }
      if (body.publishedAt !== undefined && body.publishedAt) {
        body.publishedAt = new Date(body.publishedAt);
      }
      const validatedData = insertArticleSchema.partial().parse(body);
      const article = await storage.updateArticle(id, validatedData);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error updating article:", error);
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  app.delete('/api/articles/:id', requireAdminPermission('delete_news'), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteArticle(id);
      if (!deleted) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json({ message: "Article deleted successfully" });
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  // Social content generation for articles
  app.post('/api/articles/:id/social-content', requireAdminPermission('publish_news'), async (req, res) => {
    try {
      const { id } = req.params;
      const article = await storage.getArticleById(id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      const result = await generateSocialContent(article.title, article.content);
      // Mark article as having social content generated and save the content
      await storage.updateArticle(id, {
        socialContentGenerated: true,
        socialContentGeneratedAt: new Date(),
        socialContentData: result,
      });
      res.json(result);
    } catch (error) {
      console.error("Error generating social content:", error);
      res.status(500).json({ message: "Failed to generate social content" });
    }
  });

  // Social content generation for news
  app.post('/api/news/:id/social-content', requireAdminPermission('publish_news'), async (req, res) => {
    try {
      const { id } = req.params;
      const newsItem = await storage.getNewsById(id);
      if (!newsItem) {
        return res.status(404).json({ message: "News not found" });
      }
      const result = await generateSocialContent(newsItem.title, newsItem.content);
      await storage.updateNews(id, {
        socialContentGenerated: true,
        socialContentGeneratedAt: new Date(),
      } as any);
      res.json(result);
    } catch (error) {
      console.error("Error generating social content for news:", error);
      res.status(500).json({ message: "Failed to generate social content" });
    }
  });

  // News routes
  app.get('/api/news/trending', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
      const items = await storage.getTrendingNews(limit);
      res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
      res.json(items);
    } catch (error) {
      console.error("Error fetching trending news:", error);
      res.status(500).json({ message: "Failed to fetch trending news" });
    }
  });

  app.get('/api/news', async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const perPage = req.query.perPage ? parseInt(req.query.perPage as string) : undefined;
      const omitContent =
        req.query.fields === "list" || req.query.omitContent === "1";

      if (page) {
        const result = await storage.getNewsPaginated(category, page, perPage || 20, search);
        res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
        return res.json(result);
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const newsItems = await storage.getNews(category, limit, { omitContent });
      res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
      res.json(newsItems);
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  // Category management
  app.get('/api/categories', async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      const categoriesList = await storage.getCategories(activeOnly);
      res.json(categoriesList);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/admin/categories', requireAdminPermission('manage_categories'), async (req, res) => {
    try {
      const { slug, nameAr, nameEn, color, icon, description, sortOrder, isActive } = req.body;
      if (!slug || !nameAr) {
        return res.status(400).json({ message: "الاسم والمعرف مطلوبان" });
      }
      
      // Check if slug already exists
      const existing = await storage.getCategoryBySlug(slug);
      if (existing) {
        return res.status(400).json({ message: "هذا المعرف موجود مسبقاً" });
      }
      
      const category = await storage.createCategory({
        slug,
        nameAr,
        nameEn: nameEn || null,
        color: color || 'emerald-600',
        icon: icon || null,
        description: description || null,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false,
      });
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.patch('/api/admin/categories/:id', requireAdminPermission('manage_categories'), async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updated = await storage.updateCategory(id, updateData);
      if (!updated) {
        return res.status(404).json({ message: "التصنيف غير موجود" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete('/api/admin/categories/:id', requireAdminPermission('manage_categories'), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCategory(id);
      if (!deleted) {
        return res.status(404).json({ message: "التصنيف غير موجود" });
      }
      res.json({ message: "تم حذف التصنيف بنجاح" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Auto-categorize uncategorized news using AI
  app.post('/api/admin/auto-categorize', requireAdminPermission('manage_categories'), async (req, res) => {
    try {
      const allCategories = await storage.getCategories(true);
      if (allCategories.length === 0) {
        return res.status(400).json({ message: "لا توجد تصنيفات متاحة" });
      }

      const allNews = await storage.getAllNewsForAdmin();
      const uncategorized = allNews.filter(n => !n.category || n.category === '');
      
      if (uncategorized.length === 0) {
        return res.json({ message: "جميع الأخبار مصنفة بالفعل", categorized: 0, errors: 0, total: 0 });
      }

      const categoryInfo = allCategories.map(c => ({
        slug: c.slug,
        nameAr: c.nameAr,
        description: c.description,
      }));

      let categorized = 0;
      let errors = 0;
      const batchSize = 5;

      for (let i = 0; i < uncategorized.length; i += batchSize) {
        const batch = uncategorized.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (newsItem) => {
            const category = await categorizeNewsArticle(
              newsItem.title,
              newsItem.content || newsItem.summary || '',
              categoryInfo
            );
            await storage.updateNews(newsItem.id, { category });
            return category;
          })
        );
        
        results.forEach(r => {
          if (r.status === 'fulfilled') categorized++;
          else errors++;
        });
      }

      res.json({ 
        message: `تم تصنيف ${categorized} خبر بنجاح`, 
        categorized, 
        errors,
        total: uncategorized.length 
      });
    } catch (error) {
      console.error("Error auto-categorizing:", error);
      res.status(500).json({ message: "فشل في التصنيف التلقائي" });
    }
  });

  // In-memory job store for classify progress
  const classifyJobs = new Map<string, {
    status: 'running' | 'done' | 'error';
    processed: number;
    total: number;
    articlesClassified: number;
    newsClassified: number;
    errors: number;
    currentLabel: string;
    message?: string;
    remaining?: number;
  }>();

  // Admin: Start auto-classify job for 'misc' category
  app.post('/api/admin/auto-classify-misc', requireAdminPermission('manage_categories'), async (req, res) => {
    try {
      const allCategories = await storage.getCategories(true);
      if (allCategories.length === 0) {
        return res.status(400).json({ message: "لا توجد تصنيفات متاحة" });
      }

      const categoryInfo = allCategories
        .filter(c => c.slug !== 'misc')
        .map(c => ({ slug: c.slug, nameAr: c.nameAr, description: c.description }));

      // Configurable limits per run to avoid server timeouts
      const newsLimitPerRun = parseInt(req.body?.newsLimit as string) || 500;
      const articlesLimitPerRun = parseInt(req.body?.articlesLimit as string) || 300;

      const miscArticles = await storage.getArticles('misc', articlesLimitPerRun, true);

      // Fetch misc news directly using a targeted query (faster than getAllNewsForAdmin)
      const miscNewsRaw = await storage.getMiscNews(newsLimitPerRun);

      const total = miscArticles.length + miscNewsRaw.length;
      if (total === 0) {
        return res.json({ jobId: null, total: 0, message: "لا يوجد محتوى في تصنيف منوعات ✅" });
      }

      const jobId = `classify_${Date.now()}`;
      classifyJobs.set(jobId, {
        status: 'running',
        processed: 0,
        total,
        articlesClassified: 0,
        newsClassified: 0,
        errors: 0,
        currentLabel: 'جاري التحليل...',
      });

      // Run in background
      (async () => {
        const job = classifyJobs.get(jobId)!;
        const batchSize = 10; // Increased from 5 to 10 for speed

        // Articles
        if (miscArticles.length > 0) {
          for (let i = 0; i < miscArticles.length; i += batchSize) {
            const batch = miscArticles.slice(i, i + batchSize);
            job.currentLabel = `مقالات: ${job.articlesClassified}/${miscArticles.length}`;
            const results = await Promise.allSettled(
              batch.map(async (article) => {
                const newCat = await categorizeNewsArticle(
                  article.title,
                  article.content || article.excerpt || '',
                  categoryInfo
                );
                await storage.updateArticle(article.id, { category: newCat });
              })
            );
            results.forEach(r => {
              if (r.status === 'fulfilled') { job.articlesClassified++; job.processed++; }
              else { job.errors++; job.processed++; }
            });
          }
        }

        // News
        if (miscNewsRaw.length > 0) {
          for (let i = 0; i < miscNewsRaw.length; i += batchSize) {
            const batch = miscNewsRaw.slice(i, i + batchSize);
            job.currentLabel = `أخبار: ${job.newsClassified}/${miscNewsRaw.length}`;
            const results = await Promise.allSettled(
              batch.map(async (newsItem) => {
                const newCat = await categorizeNewsArticle(
                  newsItem.title,
                  newsItem.content || newsItem.summary || '',
                  categoryInfo
                );
                await storage.updateNews(newsItem.id, { category: newCat });
              })
            );
            results.forEach(r => {
              if (r.status === 'fulfilled') { job.newsClassified++; job.processed++; }
              else { job.errors++; job.processed++; }
            });
          }
        }

        // Check how many misc items remain (for "continue" message)
        const remainingNews = await storage.getMiscNewsCount();
        const remainingArticles = await storage.getMiscArticlesCount();
        const remaining = remainingNews + remainingArticles;

        job.status = 'done';
        job.currentLabel = 'اكتمل التصنيف';
        job.message = `تم تصنيف ${job.articlesClassified} مقالة و${job.newsClassified} خبر${remaining > 0 ? ` — تبقى ${remaining.toLocaleString('ar-SA')} عنصر، اضغط مرة أخرى للمتابعة` : ' — اكتمل التصنيف الكامل ✅'}`;
        job.remaining = remaining;
        setTimeout(() => classifyJobs.delete(jobId), 10 * 60 * 1000);
      })().catch(err => {
        const job = classifyJobs.get(jobId);
        if (job) { job.status = 'error'; job.message = 'حدث خطأ أثناء التصنيف'; }
        console.error("auto-classify-misc error:", err);
      });

      res.json({ jobId, total, newsLimit: newsLimitPerRun, articlesLimit: articlesLimitPerRun });
    } catch (error) {
      console.error("Error starting auto-classify-misc:", error);
      res.status(500).json({ message: "فشل في بدء التصنيف التلقائي" });
    }
  });

  // Admin: Get classify job progress
  app.get('/api/admin/auto-classify-misc/progress/:jobId', requireAdminPermission('manage_categories'), (req, res) => {
    const job = classifyJobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ message: "لم يُعثر على المهمة" });
    res.json(job);
  });

  // Admin: Category stats (news + article count per category slug)
  app.get('/api/admin/category-stats', requireAdminPermission('view_analytics'), async (req, res) => {
    try {
      const allNews = await storage.getAllNewsForAdmin();
      const allArticles = await storage.getArticles(undefined, 5000, true);
      const statsMap: Record<string, { news: number; articles: number; total: number }> = {};
      allNews.forEach(n => {
        const slug = n.category || 'misc';
        if (!statsMap[slug]) statsMap[slug] = { news: 0, articles: 0, total: 0 };
        statsMap[slug].news++;
        statsMap[slug].total++;
      });
      allArticles.forEach(a => {
        const slug = a.category || 'misc';
        if (!statsMap[slug]) statsMap[slug] = { news: 0, articles: 0, total: 0 };
        statsMap[slug].articles++;
        statsMap[slug].total++;
      });
      res.json(statsMap);
    } catch (error) {
      console.error("Error fetching category stats:", error);
      res.status(500).json({ message: "Failed to fetch category stats" });
    }
  });

  app.get('/api/admin/referrer-stats', requireAdminPermission('view_analytics'), async (req, res) => {
    try {
      const raw = parseInt(req.query.days as string);
      const days = Number.isNaN(raw) ? 30 : Math.max(1, Math.min(365, raw));
      const stats = await storage.getReferrerStats(days);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching referrer stats:", error);
      res.status(500).json({ message: "Failed to fetch referrer stats" });
    }
  });

  // Debunk-engagement counter.
  //
  // History: client-side click tracking proved unreliable in the wild — clicks
  // were silently dropped by ad-blockers/privacy browsers, stale caches, and
  // sendBeacon being blocked. So the source of truth is now SERVER-SIDE: we
  // count every time someone OPENS a debunk topic — i.e. a `news` item whose
  // category is "debunk" (the /n/<code> links users share). That counting lives
  // in the POST /api/news/:id/view handler. This is a normal data request no
  // ad-blocker touches and works on any cached bundle.
  //
  // Throttle key is per-IP + per-article (3s window) so opening DIFFERENT debunk
  // topics each counts, but a quick refresh of the SAME topic doesn't double-count.
  const ctaThrottle = new Map<string, number>();
  const recordDebunkOpenThrottled = async (req: any, dedupeKey: string) => {
    const ip = (req.ip || req.socket?.remoteAddress || 'unknown').toString();
    const key = `${ip}|${dedupeKey}`;
    const now = Date.now();
    const last = ctaThrottle.get(key) || 0;
    if (now - last < 3000) return; // same IP+topic within 3s → don't double-count
    ctaThrottle.set(key, now);
    if (ctaThrottle.size > 5000) {
      ctaThrottle.forEach((t, k) => {
        if (now - t > 60000) ctaThrottle.delete(k);
      });
    }
    await storage.recordDebunkCtaClick();
  };

  // Back-compat no-op endpoints. Old cached bundles still POST here on click;
  // we acknowledge but DON'T increment (counting now happens server-side when a
  // debunk topic is opened) so nothing is double-counted. New bundles don't call these.
  const handleLegacyCtaPost = (_req: any, res: any) => res.json({ ok: true });
  app.post('/api/rumors/cta', handleLegacyCtaPost);
  app.post('/api/analytics/debunk-cta', handleLegacyCtaPost);

  // Public: get total debunk CTA clicks (for social proof)
  app.get('/api/rumors/cta/total', async (req, res) => {
    try {
      const total = await storage.getTotalDebunkCtaClicks();
      res.json({ total });
    } catch (error) {
      console.error("Error fetching debunk CTA total:", error);
      res.status(500).json({ message: "Failed to fetch total" });
    }
  });

  // Admin: debunk CTA click stats over time
  app.get('/api/admin/debunk-cta-stats', requireAdminPermission('view_analytics'), async (req, res) => {
    try {
      const raw = parseInt(req.query.days as string);
      const days = Number.isNaN(raw) ? 30 : Math.max(1, Math.min(365, raw));
      const [stats, total] = await Promise.all([
        storage.getDebunkCtaStats(days),
        storage.getTotalDebunkCtaClicks(),
      ]);
      res.json({ stats, total });
    } catch (error) {
      console.error("Error fetching debunk CTA stats:", error);
      res.status(500).json({ message: "Failed to fetch debunk CTA stats" });
    }
  });

  app.get('/api/admin/country-stats', requireAdminPermission('view_analytics'), async (req, res) => {
    try {
      const raw = parseInt(req.query.days as string);
      const days = Number.isNaN(raw) ? 30 : Math.max(1, Math.min(365, raw));
      const stats = await storage.getCountryStats(days);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching country stats:", error);
      res.status(500).json({ message: "Failed to fetch country stats" });
    }
  });

  app.get('/api/admin/stats', requireAdminPermission('view_analytics'), async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/admin/charts', requireAdminPermission('view_analytics'), async (req, res) => {
    try {
      const days = Math.min(90, Math.max(1, parseInt(String(req.query.days || '7')) || 7));
      const data = await storage.getChartData(days);
      res.json(data);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      res.status(500).json({ message: "Failed to fetch chart data" });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Medical Content Capsule Routes
  // ───────────────────────────────────────────────────────────────────────────
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

  app.post('/api/admin/capsule/fact-check', requireAdminPermission('ai_content'), async (req, res) => {
    try {
      const schema = z.object({ text: z.string().min(10).max(10000) });
      const { text } = schema.parse(req.body);
      const result = await factCheckMedicalContent(text);
      const userId = (req as any).user?.id || (req as any).userId || null;
      storage.createCapsuleLog({
        tool: "fact-check",
        inputSnippet: text.slice(0, 500),
        result,
        createdBy: userId,
      }).catch((err: unknown) => {
        console.error("[capsule/fact-check] failed to save log:", err instanceof Error ? err.message : err);
      });
      res.json({ success: true, result });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const isTooLong = error.issues.some((i) => i.code === "too_big");
        return res.status(400).json({
          success: false,
          error: isTooLong
            ? "النص يتجاوز الحد المسموح به (10,000 حرف). يرجى تقصير النص وإعادة المحاولة."
            : "النص مطلوب (10 أحرف على الأقل)",
        });
      }
      console.error("[capsule/fact-check]", error?.message);
      const isLengthError = error?.message && (
        error.message.includes("context_length_exceeded") ||
        error.message.includes("maximum context") ||
        error.message.includes("too long") ||
        error.message.includes("token")
      );
      if (isLengthError) {
        return res.status(422).json({ success: false, error: "النص طويل جداً ويتجاوز حد المعالجة. يرجى تقصير النص وإعادة المحاولة." });
      }
      res.status(500).json({ success: false, error: "فشل في تدقيق المحتوى. يرجى المحاولة مرة أخرى." });
    }
  });

  app.post('/api/admin/capsule/simplify', requireAdminPermission('ai_content'), async (req, res) => {
    try {
      const schema = z.object({ text: z.string().min(10).max(10000) });
      const { text } = schema.parse(req.body);
      const simplified = await simplifyMedicalText(text);
      const userId = (req as any).user?.id || (req as any).userId || null;
      storage.createCapsuleLog({
        tool: "simplify",
        inputSnippet: text.slice(0, 500),
        result: { simplified },
        createdBy: userId,
      }).catch((err: unknown) => {
        console.error("[capsule/simplify] failed to save log:", err instanceof Error ? err.message : err);
      });
      res.json({ success: true, simplified });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const isTooLong = error.issues.some((i) => i.code === "too_big");
        return res.status(400).json({
          success: false,
          error: isTooLong
            ? "النص يتجاوز الحد المسموح به (10,000 حرف). يرجى تقصير النص وإعادة المحاولة."
            : "النص مطلوب (10 أحرف على الأقل)",
        });
      }
      console.error("[capsule/simplify]", error?.message);
      const isLengthError = error?.message && (
        error.message.includes("context_length_exceeded") ||
        error.message.includes("maximum context") ||
        error.message.includes("too long") ||
        error.message.includes("token")
      );
      if (isLengthError) {
        return res.status(422).json({ success: false, error: "النص طويل جداً ويتجاوز حد المعالجة. يرجى تقصير النص وإعادة المحاولة." });
      }
      res.status(500).json({ success: false, error: "فشل في تبسيط النص. يرجى المحاولة مرة أخرى." });
    }
  });

  // ── SSRF helpers ────────────────────────────────────────────────────────────
  function isPrivateIp(ip: string): boolean {
    // IPv6 loopback / link-local / unique-local
    if (ip === "::1") return true;
    const lower = ip.toLowerCase();
    if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
    // IPv4-mapped IPv6 (::ffff:x.x.x.x)
    const v4mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    const v4 = v4mapped ? v4mapped[1] : ip;
    const parts = v4.split(".").map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return false;
    const [a, b] = parts;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a === 240 ||
      (a === 255 && b === 255 && parts[2] === 255 && parts[3] === 255)
    );
  }

  async function assertUrlSafe(urlStr: string): Promise<void> {
    const parsed = new URL(urlStr);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw Object.assign(new Error("SSRF_PROTOCOL"), { ssrf: true });
    }
    const hostname = parsed.hostname.toLowerCase();
    const blockedHosts = ["localhost", "0.0.0.0", "metadata.google.internal", "169.254.169.254"];
    if (
      blockedHosts.includes(hostname) ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".corp")
    ) {
      throw Object.assign(new Error("SSRF_BLOCKED"), { ssrf: true });
    }
    const dns = await import("node:dns/promises");
    const { address } = await dns.lookup(hostname);
    if (isPrivateIp(address)) {
      throw Object.assign(new Error("SSRF_BLOCKED"), { ssrf: true });
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

  app.post('/api/admin/capsule/fetch-url', requireAdminPermission('ai_content'), async (req, res) => {
    try {
      const schema = z.object({ url: z.string().url() });
      const { url } = schema.parse(req.body);

      // SSRF guard: validate the initial URL before any outbound request
      await assertUrlSafe(url);

      // Follow redirects manually so each hop is validated before it is fetched
      const MAX_REDIRECTS = 5;
      let currentUrl = url;
      let response!: Response;
      for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        response = await fetch(currentUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; HealthBot/1.0)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(15000),
          redirect: "manual",
        });

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("location");
          if (!location) break;
          const nextUrl = new URL(location, currentUrl).toString();
          await assertUrlSafe(nextUrl); // validate before following
          currentUrl = nextUrl;
          continue;
        }

        break;
      }

      if (!response.ok) {
        return res.status(400).json({ success: false, error: "تعذر تحميل الصفحة. تأكد من صحة الرابط." });
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
        return res.status(400).json({ success: false, error: "الرابط لا يشير إلى صفحة ويب قابلة للقراءة." });
      }

      const html = await response.text();
      const cheerio = await import("cheerio");
      const $ = cheerio.load(html);

      // Remove non-content elements
      $("script, style, nav, header, footer, aside, noscript, iframe, [role='navigation'], [role='banner'], [role='contentinfo'], .ad, .ads, .advertisement, .sidebar, .menu, .cookie").remove();

      // Try to find the main article content
      const candidateSelectors = [
        "article",
        "[role='main']",
        "main",
        ".article-body",
        ".article-content",
        ".post-content",
        ".entry-content",
        ".content-body",
        "#article-body",
        "#main-content",
        ".story-body",
      ];

      let text = "";
      for (const selector of candidateSelectors) {
        const el = $(selector).first();
        if (el.length) {
          text = el.text();
          break;
        }
      }

      // Fallback to body
      if (!text || text.trim().length < 100) {
        text = $("body").text();
      }

      // Clean up whitespace
      text = text
        .replace(/\t/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/(\s*\n\s*){3,}/g, "\n\n")
        .trim();

      if (text.length < 50) {
        return res.status(400).json({ success: false, error: "لم يتم العثور على محتوى كافٍ في هذه الصفحة." });
      }

      // Truncate to 10000 chars to stay within AI limits
      if (text.length > 10000) {
        text = text.slice(0, 10000);
      }

      res.json({ success: true, text });
    } catch (error: any) {
      if (error?.ssrf) {
        return res.status(400).json({ success: false, error: "الرابط غير مسموح به. أدخل رابطاً لصفحة عامة على الإنترنت." });
      }
      if (error?.name === "TimeoutError" || error?.name === "AbortError") {
        return res.status(400).json({ success: false, error: "انتهت مهلة تحميل الصفحة. حاول مرة أخرى." });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: "رابط غير صالح. أدخل رابطاً كاملاً يبدأ بـ https://" });
      }
      console.error("[capsule/fetch-url]", error?.message);
      res.status(500).json({ success: false, error: "فشل في استخراج محتوى الصفحة" });
    }
  });

  app.post('/api/admin/capsule/extract-pdf', requireAdminPermission('ai_content'), upload.single("pdf"), async (req, res) => {
    let parser: any = null;
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "يرجى رفع ملف PDF" });
      }
      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({ success: false, error: "يجب أن يكون الملف بصيغة PDF" });
      }
      parser = new PDFParse({ data: req.file.buffer });
      const pdfData = await parser.getText();
      const pdfText = (pdfData.text as string)?.trim();
      if (!pdfText || pdfText.length < 50) {
        return res.status(400).json({ success: false, error: "تعذر استخراج النص من الملف. تأكد أن PDF يحتوي على نص قابل للنسخ." });
      }
      const extractedChars = pdfText.length;
      const sentChars = Math.min(pdfText.length, 8000);
      const result = await extractNewsFromPdf(pdfText);
      const userId = (req as any).user?.id || (req as any).userId || null;
      storage.createCapsuleLog({
        tool: "pdf-capsule",
        inputSnippet: (req.file.originalname || "ملف PDF").slice(0, 500),
        result,
        createdBy: userId,
      }).catch((err: unknown) => {
        console.error("[capsule/extract-pdf] failed to save log:", err instanceof Error ? err.message : err);
      });
      res.json({ success: true, result, extractedChars, sentChars });
    } catch (error: any) {
      console.error("[capsule/extract-pdf]", error?.message);
      res.status(500).json({ success: false, error: "فشل في معالجة الملف" });
    } finally {
      if (parser) {
        try { await parser.destroy(); } catch {}
      }
    }
  });

  app.get('/api/admin/capsule/history', requireAdminPermission('ai_content'), async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const logs = await storage.getCapsuleLogs(limit);
      res.json({ success: true, logs });
    } catch (error: any) {
      console.error("[capsule/history]", error?.message);
      res.status(500).json({ success: false, error: "فشل في جلب السجل" });
    }
  });
  // ───────────────────────────────────────────────────────────────────────────

  app.get('/api/admin/ai-insights', requireAdminPermission('view_analytics'), async (req, res) => {
    try {
      const analyticsData = await storage.getAnalyticsForAI();
      const insights = await generateEditorialInsights(analyticsData);
      res.json({ success: true, insights, analyticsData });
    } catch (error: any) {
      console.error('[AI Insights] Error:', error.message);
      res.status(500).json({ success: false, error: 'فشل في إنشاء التحليل' });
    }
  });

  // Admin: Get all news for dashboard (includes drafts, scheduled, deleted)
  app.get('/api/admin/news', requireAdminPermission('publish_news'), async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const perPage = req.query.perPage ? parseInt(req.query.perPage as string) : 30;
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const sortBy = (req.query.sortBy as string) || 'publishedAt';
      const sortOrder = (req.query.sortOrder as string) || 'desc';

      if (page) {
        const result = await storage.getAdminNewsPaginated(status, page, perPage, search, category, sortBy, sortOrder);
        return res.json(result);
      }

      let newsItems;
      if (status) {
        newsItems = await storage.getNewsByStatus(status);
      } else {
        newsItems = await storage.getAllNewsForAdmin();
      }
      res.json(newsItems);
    } catch (error) {
      console.error("Error fetching admin news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  // Admin: Soft delete news (move to trash)
  app.post('/api/admin/news/:id/trash', requireAdminPermission('delete_news'), async (req, res) => {
    try {
      const success = await storage.softDeleteNews(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "News not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error moving news to trash:", error);
      res.status(500).json({ message: "Failed to move news to trash" });
    }
  });

  // Admin: Restore news from trash
  app.post('/api/admin/news/:id/restore', requireAdminPermission('edit_news'), async (req, res) => {
    try {
      const success = await storage.restoreNews(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "News not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error restoring news:", error);
      res.status(500).json({ message: "Failed to restore news" });
    }
  });

  // Admin: Permanently delete news
  app.delete('/api/admin/news/:id/permanent', requireAdminPermission('delete_news'), async (req, res) => {
    try {
      const success = await storage.deleteNews(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "News not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error permanently deleting news:", error);
      res.status(500).json({ message: "Failed to permanently delete news" });
    }
  });

  // Bulk delete news
  app.post('/api/admin/news/bulk-delete', requireAdminPermission('delete_news'), async (req, res) => {
    try {
      const { ids, permanent } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No news IDs provided" });
      }
      
      let deletedCount = 0;
      for (const id of ids) {
        if (permanent) {
          // Permanent delete
          const success = await storage.deleteNews(id);
          if (success) deletedCount++;
        } else {
          // Soft delete (move to trash)
          const updated = await storage.updateNews(id, { status: 'deleted' });
          if (updated) deletedCount++;
        }
      }
      
      res.json({ deleted: deletedCount });
    } catch (error) {
      console.error("Error bulk deleting news:", error);
      res.status(500).json({ message: "Failed to bulk delete news" });
    }
  });

  // Get news by keyword
  app.get('/api/news/keyword/:keyword', async (req, res) => {
    try {
      const keyword = decodeURIComponent(req.params.keyword);
      const newsItems = await storage.getNewsByKeyword(keyword);
      res.json(newsItems);
    } catch (error) {
      console.error("Error fetching news by keyword:", error);
      res.status(500).json({ message: "Failed to fetch news by keyword" });
    }
  });

  app.get('/api/news/:id', async (req: any, res) => {
    try {
      const newsItem = await storage.getNewsById(req.params.id);
      const isAdmin = !!req.session?.adminAuthenticated;
      if (!newsItem || (!isPublicNews(newsItem) && !isAdmin)) {
        return res.status(404).json({ message: "News not found" });
      }
      res.json(newsItem);
    } catch (error) {
      console.error("Error fetching news item:", error);
      res.status(500).json({ message: "Failed to fetch news item" });
    }
  });

  app.post('/api/news/:id/view', async (req, res) => {
    try {
      // Count every view request — including repeated clicks/refreshes from the same person.
      await storage.incrementViewCount(req.params.id);
      // Debunk-engagement counter: if this opened article is a debunk topic,
      // count it (throttled per IP+article). This is the metric shown on the
      // admin dashboard as "نقرات زر الشائعات".
      try {
        const item = await storage.getNewsById(req.params.id);
        if (item && item.category === 'debunk') {
          recordDebunkOpenThrottled(req, req.params.id).catch((e) =>
            console.error("Error recording debunk open:", e),
          );
        }
      } catch {}
      try {
        const forwarded = req.headers['x-forwarded-for'];
        const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip || '';
        if (ip && ip !== '127.0.0.1' && ip !== '::1') {
          const geoip = await import('geoip-lite');
          const geo = geoip.default.lookup(ip);
          if (geo && geo.country) {
            const COUNTRY_NAMES_AR: Record<string, string> = {
              SA: "السعودية", AE: "الإمارات", KW: "الكويت", QA: "قطر", BH: "البحرين",
              OM: "عُمان", EG: "مصر", JO: "الأردن", LB: "لبنان", IQ: "العراق",
              SY: "سوريا", YE: "اليمن", PS: "فلسطين", SD: "السودان", LY: "ليبيا",
              TN: "تونس", DZ: "الجزائر", MA: "المغرب", MR: "موريتانيا", SO: "الصومال",
              DJ: "جيبوتي", KM: "جزر القمر", US: "أمريكا", GB: "بريطانيا", DE: "ألمانيا",
              FR: "فرنسا", TR: "تركيا", IN: "الهند", PK: "باكستان", CN: "الصين",
              JP: "اليابان", KR: "كوريا", AU: "أستراليا", CA: "كندا", BR: "البرازيل",
              RU: "روسيا", IT: "إيطاليا", ES: "إسبانيا", NL: "هولندا", SE: "السويد",
              MY: "ماليزيا", ID: "إندونيسيا", NG: "نيجيريا", ZA: "جنوب أفريقيا",
            };
            const name = COUNTRY_NAMES_AR[geo.country] || geo.country;
            storage.recordCountryView(geo.country, name).catch(() => {});
          }
        }
      } catch {}

      try {
        const ua = (req.headers['user-agent'] || '').toString();
        const isBot = /bot|crawler|spider|crawling|facebookexternalhit|slurp|duckduckbot|baiduspider|yandex|googlebot|bingbot|headless|python-requests|axios|node-fetch|curl|wget|phantomjs|puppeteer|playwright/i.test(ua);
        if (!isBot) {
          const refHeader = (req.body?.referrer || req.headers['referer'] || '').toString();
          const utmSource = (req.body?.utmSource || '').toString().trim().toLowerCase();
          const utmMedium = (req.body?.utmMedium || '').toString().trim().toLowerCase();

          // Map a known token (utm_source value OR referrer text/hostname) to a labeled source.
          const mapKnown = (s: string): { source: string; label: string } | null => {
            if (/news\.google|google.?news/.test(s)) return { source: 'google_news', label: 'أخبار قوقل' };
            if (/google/.test(s)) return { source: 'google', label: 'قوقل' };
            if (/bing/.test(s)) return { source: 'bing', label: 'بينق' };
            if (/yahoo/.test(s)) return { source: 'yahoo', label: 'ياهو' };
            if (/yandex/.test(s)) return { source: 'yandex', label: 'ياندكس' };
            if (/duckduckgo|duck/.test(s)) return { source: 'duckduckgo', label: 'DuckDuckGo' };
            if (/twitter|t\.co|x\.com|(^|[^a-z])x([^a-z]|$)/.test(s)) return { source: 'twitter', label: 'تويتر / X' };
            if (/facebook|fbcdn|(^|[^a-z])fb([^a-z]|$)/.test(s)) return { source: 'facebook', label: 'فيسبوك' };
            if (/instagram|(^|[^a-z])ig([^a-z]|$)/.test(s)) return { source: 'instagram', label: 'انستقرام' };
            if (/tiktok/.test(s)) return { source: 'tiktok', label: 'تيك توك' };
            if (/snapchat|snap/.test(s)) return { source: 'snapchat', label: 'سناب شات' };
            if (/linkedin/.test(s)) return { source: 'linkedin', label: 'لينكدإن' };
            if (/youtube|youtu\.be/.test(s)) return { source: 'youtube', label: 'يوتيوب' };
            if (/telegram|t\.me/.test(s)) return { source: 'telegram', label: 'تليقرام' };
            if (/whatsapp|wa\.me|(^|[^a-z])wa([^a-z]|$)/.test(s)) return { source: 'whatsapp', label: 'واتساب' };
            if (/reddit/.test(s)) return { source: 'reddit', label: 'ريديت' };
            if (/newsletter|email|mailing|(^|[^a-z])mail([^a-z]|$)/.test(s)) return { source: 'newsletter', label: 'النشرة البريدية' };
            return null;
          };

          let source = 'direct';
          let sourceLabel = 'مباشر';

          if (utmSource) {
            // UTM is the most reliable signal (campaigns, newsletter, app links).
            const m = mapKnown(utmSource);
            if (m) { source = m.source; sourceLabel = m.label; }
            else {
              const clean = utmSource.replace(/[^a-z0-9_\-.]/g, '').slice(0, 40) || 'campaign';
              source = clean;
              sourceLabel = utmMedium ? `${utmSource} (${utmMedium})` : utmSource;
            }
          } else if (refHeader) {
            // Match against the hostname only — paths/queries can contain stray
            // tokens (e.g. "/x") that would falsely match short source aliases.
            let hostname = '';
            try { hostname = new URL(refHeader).hostname.replace(/^www\./, '').toLowerCase(); }
            catch { /* malformed referrer → keep direct */ }
            if (hostname) {
              if (hostname.includes('capsulah.net') || hostname.includes('capsulah.com') || hostname.includes('replit')) {
                source = 'internal'; sourceLabel = 'تصفّح داخلي';
              } else {
                const m = mapKnown(hostname);
                if (m) { source = m.source; sourceLabel = m.label; }
                else { source = hostname.slice(0, 60); sourceLabel = hostname; }
              }
            }
          }

          storage.recordReferrerView(source, sourceLabel).catch(() => {});
        }
      } catch {}

      res.json({ ok: true });
    } catch {
      res.json({ ok: false });
    }
  });

  app.get('/api/news/:id/related', async (req, res) => {
    try {
      const newsItem = await storage.getNewsById(req.params.id);
      if (!newsItem || !isPublicNews(newsItem)) {
        return res.status(404).json({ message: "News not found" });
      }
      const related = await storage.getRelatedNews(newsItem.id, newsItem.category || 'general', 10);
      res.json(related);
    } catch (error) {
      console.error("Error fetching related news:", error);
      res.status(500).json({ message: "Failed to fetch related news" });
    }
  });

  // Get news by short code (for short URLs)
  app.get('/api/n/:shortCode', async (req: any, res) => {
    try {
      const newsItem = await storage.getNewsByShortCode(req.params.shortCode);
      const isAdmin = !!req.session?.adminAuthenticated;
      if (!newsItem || (!isPublicNews(newsItem) && !isAdmin)) {
        return res.status(404).json({ message: "News not found" });
      }
      res.json(newsItem);
    } catch (error) {
      console.error("Error fetching news by short code:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  // Create news (admin)
  app.post('/api/news', requireAdminPermission('publish_news'), async (req, res) => {
    try {
      const { title, subtitle, content, summary, category, source, imageUrl, imageAlt, seoTitle, seoDescription, keywords, publishedAt, status, scheduledAt, isFeatured } = req.body;
      // For drafts, only title is required. For publishing, require title, content, and category
      if (!title) {
        return res.status(400).json({ message: "العنوان مطلوب" });
      }
      if (status !== 'draft' && (!content || !category)) {
        return res.status(400).json({ message: "المحتوى والتصنيف مطلوبان للنشر" });
      }
      
      // Determine status and publishedAt based on scheduling
      let finalStatus = status || 'published';
      let finalPublishedAt = publishedAt ? new Date(publishedAt) : new Date();
      let finalScheduledAt = null;
      
      if (status === 'scheduled' && scheduledAt) {
        finalScheduledAt = new Date(scheduledAt);
        finalPublishedAt = finalScheduledAt; // Set publishedAt to scheduledAt for proper ordering
      }
      
      // Generate unique short code
      const shortCode = generateShortCode();
      
      const createdByName = (req.session as any)?.adminDisplayName || "نظام";
      const newsItem = await storage.createNews({
        title,
        subtitle: subtitle || null,
        content,
        summary: summary || null,
        category,
        source: source || null,
        imageUrl: imageUrl || null,
        imageAlt: imageAlt || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        keywords: keywords || [],
        isFeatured: isFeatured || false,
        status: finalStatus,
        scheduledAt: finalScheduledAt,
        publishedAt: finalPublishedAt,
        shortCode,
        createdBy: createdByName,
      });
      res.status(201).json(newsItem);
    } catch (error) {
      console.error("Error creating news:", error);
      res.status(500).json({ message: "Failed to create news" });
    }
  });

  app.patch('/api/news/:id', requireAdminPermission('edit_news'), async (req, res) => {
    try {
      const { id } = req.params;
      const { title, subtitle, content, summary, category, source, imageUrl, imageAlt, seoTitle, seoDescription, keywords, status, scheduledAt, isFeatured, isBreaking } = req.body;
      
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (subtitle !== undefined) updateData.subtitle = subtitle || null;
      if (content !== undefined) updateData.content = content;
      if (summary !== undefined) updateData.summary = summary || null;
      if (category !== undefined) updateData.category = category;
      if (source !== undefined) updateData.source = source || null;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
      if (imageAlt !== undefined) updateData.imageAlt = imageAlt || null;
      if (seoTitle !== undefined) updateData.seoTitle = seoTitle || null;
      if (seoDescription !== undefined) updateData.seoDescription = seoDescription || null;
      if (keywords !== undefined) updateData.keywords = keywords || [];
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
      if (isBreaking !== undefined) updateData.isBreaking = isBreaking;
      if (status !== undefined) updateData.status = status;
      if (scheduledAt !== undefined) {
        updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
        if (status === 'scheduled' && scheduledAt) {
          updateData.publishedAt = new Date(scheduledAt);
        }
      }

      const updated = await storage.updateNews(id, updateData);
      if (!updated) {
        return res.status(404).json({ message: "News not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating news:", error);
      res.status(500).json({ message: "Failed to update news" });
    }
  });

  app.delete('/api/news/:id', requireAdminPermission('delete_news'), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteNews(id);
      if (!deleted) {
        return res.status(404).json({ message: "News not found" });
      }
      res.json({ message: "News deleted successfully" });
    } catch (error) {
      console.error("Error deleting news:", error);
      res.status(500).json({ message: "Failed to delete news" });
    }
  });

  // WordPress Import API
  app.post('/api/import/wordpress', requireAdminPermission('import_wordpress'), async (req, res) => {
    try {
      const { siteUrl, perPage = 10, page = 1, importImages = true, category = 'health' } = req.body;
      
      if (!siteUrl) {
        return res.status(400).json({ message: "WordPress site URL is required" });
      }

      // Validate URL format
      let cleanUrl: string;
      try {
        const urlObj = new URL(siteUrl);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          return res.status(400).json({ message: "Invalid URL protocol. Use http or https." });
        }
        cleanUrl = urlObj.origin;
      } catch {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      const apiUrl = `${cleanUrl}/wp-json/wp/v2/posts?_embed&per_page=${perPage}&page=${page}`;
      
      console.log(`Fetching posts from: ${apiUrl}`);
      
      // Fetch with timeout (120s for large batch imports)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      
      // Extend Express response timeout for bulk imports
      if (perPage >= 50) {
        req.setTimeout(300000); // 5 minutes for large batches
        res.setTimeout(300000);
      }

      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('WordPress API error:', errorText);
        return res.status(400).json({ 
          message: `Failed to fetch from WordPress: ${response.status} ${response.statusText}`,
          details: errorText
        });
      }

      const posts = await response.json();
      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
      const totalPosts = parseInt(response.headers.get('X-WP-Total') || '0');

      const importedNews: any[] = [];
      const errors: any[] = [];
      
      const allCategories = await storage.getCategories(true);
      const categoryInfo = allCategories.map(c => ({ slug: c.slug, nameAr: c.nameAr, description: c.description }));

      for (const post of posts) {
        try {
          // Extract featured image URL
          let imageUrl = null;
          let imageAlt = null;
          
          if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
            const media = post._embedded['wp:featuredmedia'][0];
            const originalImageUrl = media.source_url;
            imageAlt = media.alt_text || post.title.rendered;
            
            // Download and upload image to local object storage
            if (importImages && originalImageUrl) {
              console.log(`Downloading image: ${originalImageUrl}`);
              const localImageUrl = await downloadAndUploadImage(originalImageUrl);
              if (localImageUrl) {
                imageUrl = localImageUrl;
                console.log(`Image saved locally: ${localImageUrl}`);
              } else {
                // Fallback to original URL if download fails
                imageUrl = originalImageUrl;
                console.log(`Using original image URL: ${originalImageUrl}`);
              }
            } else {
              imageUrl = originalImageUrl;
            }
          }

          // Extract categories from WordPress and use AI to categorize
          let wpCategory = category;
          
          if (post._embedded && post._embedded['wp:term'] && post._embedded['wp:term'][0]) {
            const wpCategories = post._embedded['wp:term'][0];
            if (wpCategories.length > 0) {
              const wpCatName = wpCategories[0].name.toLowerCase();
              const matchedCategory = allCategories.find(c => 
                c.slug === wpCatName || 
                c.nameAr === wpCategories[0].name || 
                c.nameEn?.toLowerCase() === wpCatName
              );
              if (matchedCategory) {
                wpCategory = matchedCategory.slug;
              }
            }
          }
          
          if (!wpCategory || wpCategory === category) {
            try {
              const rawTitle = post.title.rendered.replace(/<[^>]*>/g, '').trim();
              const rawExcerptForCat = post.excerpt.rendered.replace(/<[^>]*>/g, '').trim();
              wpCategory = await categorizeNewsArticle(rawTitle, rawExcerptForCat, categoryInfo);
            } catch {
              wpCategory = 'misc';
            }
          }

          const decodeHtmlEntities = (text: string): string => {
            return text
              .replace(/&#8217;|&#x2019;|&rsquo;/g, "'")
              .replace(/&#8216;|&#x2018;|&lsquo;/g, "'")
              .replace(/&#8220;|&#x201C;|&ldquo;/g, '"')
              .replace(/&#8221;|&#x201D;|&rdquo;/g, '"')
              .replace(/&#8211;|&#x2013;|&ndash;/g, '–')
              .replace(/&#8212;|&#x2014;|&mdash;/g, '—')
              .replace(/&#8230;|&hellip;/g, '...')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&nbsp;/g, ' ')
              .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
              .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
              .trim();
          };

          const cleanContent = post.content.rendered;
          const rawExcerpt = post.excerpt.rendered.replace(/<[^>]*>/g, '').trim();
          const cleanExcerpt = decodeHtmlEntities(rawExcerpt);
          const cleanTitle = decodeHtmlEntities(post.title.rendered);

          const newsData = {
            title: cleanTitle,
            subtitle: null,
            content: cleanContent,
            summary: cleanExcerpt.substring(0, 300) || null,
            category: wpCategory,
            source: cleanUrl,
            imageUrl,
            imageAlt,
            seoTitle: decodeHtmlEntities(post.yoast_head_json?.title || post.title.rendered),
            seoDescription: decodeHtmlEntities(post.yoast_head_json?.description || rawExcerpt.substring(0, 160)),
            keywords: post._embedded?.['wp:term']?.[1]?.map((tag: any) => tag.name) || [],
            publishedAt: new Date(post.date),
            isFeatured: post.sticky || false,
            shortCode: generateShortCode(),
          };

          const created = await storage.createNews(newsData);
          importedNews.push({
            id: created.id,
            title: created.title,
            wpId: post.id,
            imageUrl: created.imageUrl
          });
        } catch (postError: any) {
          errors.push({
            wpId: post.id,
            title: post.title?.rendered,
            error: postError.message
          });
        }
      }

      res.json({
        success: true,
        imported: importedNews.length,
        errors: errors.length,
        importedNews,
        errorDetails: errors,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts,
          perPage
        }
      });
    } catch (error: any) {
      console.error("Error importing from WordPress:", error);
      res.status(500).json({ message: "Failed to import from WordPress", error: error.message });
    }
  });

  // Preview WordPress posts before import
  app.post('/api/import/wordpress/preview', requireAdminPermission('import_wordpress'), async (req, res) => {
    try {
      const { siteUrl, perPage = 10, page = 1 } = req.body;
      
      if (!siteUrl) {
        return res.status(400).json({ message: "WordPress site URL is required" });
      }

      // Validate URL format
      let cleanUrl: string;
      try {
        const urlObj = new URL(siteUrl);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          return res.status(400).json({ message: "Invalid URL protocol. Use http or https." });
        }
        cleanUrl = urlObj.origin;
      } catch {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      const apiUrl = `${cleanUrl}/wp-json/wp/v2/posts?_embed&per_page=${perPage}&page=${page}`;
      
      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return res.status(400).json({ 
          message: `Failed to fetch from WordPress: ${response.status} ${response.statusText}`
        });
      }

      const posts = await response.json();
      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
      const totalPosts = parseInt(response.headers.get('X-WP-Total') || '0');

      const decodeEntities = (text: string): string => {
        return text
          .replace(/&#8217;|&#x2019;|&rsquo;/g, "'")
          .replace(/&#8216;|&#x2018;|&lsquo;/g, "'")
          .replace(/&#8220;|&#x201C;|&ldquo;/g, '"')
          .replace(/&#8221;|&#x201D;|&rdquo;/g, '"')
          .replace(/&#8211;|&#x2013;|&ndash;/g, '–')
          .replace(/&#8212;|&#x2014;|&mdash;/g, '—')
          .replace(/&#8230;|&hellip;/g, '...')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&nbsp;/g, ' ')
          .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
          .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
          .trim();
      };

      const preview = posts.map((post: any) => ({
        id: post.id,
        title: decodeEntities(post.title.rendered),
        excerpt: decodeEntities(post.excerpt.rendered.replace(/<[^>]*>/g, '').trim()).substring(0, 200),
        date: post.date,
        imageUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
        categories: post._embedded?.['wp:term']?.[0]?.map((cat: any) => cat.name) || [],
        tags: post._embedded?.['wp:term']?.[1]?.map((tag: any) => tag.name) || [],
        sticky: post.sticky
      }));

      res.json({
        posts: preview,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts,
          perPage
        }
      });
    } catch (error: any) {
      console.error("Error previewing WordPress posts:", error);
      res.status(500).json({ message: "Failed to preview WordPress posts", error: error.message });
    }
  });

  // Chat/Assistant routes
  app.get('/api/chat/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserChatSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  app.post('/api/chat/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = insertChatSessionSchema.parse({ ...req.body, userId });
      const session = await storage.createChatSession(validated);
      res.json(session);
    } catch (error: any) {
      console.error("Error creating chat session:", error);
      res.status(400).json({ message: error.message || "Failed to create chat session" });
    }
  });

  app.get('/api/chat/sessions/:sessionId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.getChatSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const messages = await storage.getChatMessages(req.params.sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chat/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId, content } = req.body;
      if (!sessionId || !content) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const userId = req.user.claims.sub;
      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Save user message
      const userMessage = await storage.addChatMessage({
        sessionId,
        role: "user",
        content,
        citations: []
      });

      // Get conversation history
      const messages = await storage.getChatMessages(sessionId);
      const history = messages.slice(-10).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }));

      // Generate AI response
      const aiResponse = await generateHealthResponse(content, history);

      // Save assistant message
      const assistantMessage = await storage.addChatMessage({
        sessionId,
        role: "assistant",
        content: aiResponse.answer,
        citations: aiResponse.citations || []
      });

      res.json({
        userMessage,
        assistantMessage,
        tldr: aiResponse.tldr
      });
    } catch (error: any) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // Admin: Generate full medical article content using AI (title, excerpt, content, tags, SEO)
  app.post('/api/admin/generate-article-content', requireAdminPermission('publish_news'), async (req, res) => {
    try {
      const { brief } = req.body;
      if (!brief || String(brief).trim().length < 10) {
        return res.status(400).json({ message: "الموجز قصير جداً (10 أحرف على الأقل)" });
      }
      const { generateArticleContent } = await import('./openai');
      const result = await generateArticleContent(String(brief));
      if (!result.title || !result.content) {
        return res.status(500).json({ message: "فشل توليد المقال، حاول مرة أخرى" });
      }
      res.json(result);
    } catch (error: any) {
      console.error("Error generating article content:", error?.message || error);
      res.status(500).json({ message: "فشل توليد المقال" });
    }
  });

  // Admin: Generate news metadata using AI
  app.post('/api/admin/generate-news-meta', requireAdminPermission('publish_news'), async (req, res) => {
    try {
      const { content } = req.body;
      if (!content || content.length < 50) {
        return res.status(400).json({ message: "المحتوى قصير جداً (50 حرف على الأقل)" });
      }

      const { generateNewsMeta } = await import('./openai');
      const result = await generateNewsMeta(content);
      
      // Check if result is empty (generation failed)
      if (!result.title && !result.summary) {
        return res.status(500).json({ message: "فشل توليد البيانات الوصفية، حاول مرة أخرى" });
      }
      
      res.json(result);
    } catch (error: any) {
      console.error("Error generating news meta:", error?.message || error);
      const errorMsg = error?.message?.includes("rate") 
        ? "تم تجاوز الحد المسموح، حاول بعد قليل"
        : "فشل توليد البيانات الوصفية";
      res.status(500).json({ message: errorMsg });
    }
  });

  // Symptom checker
  app.post('/api/symptoms/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const { symptoms, answers } = req.body;
      if (!symptoms || !Array.isArray(symptoms)) {
        return res.status(400).json({ message: "Missing or invalid symptoms" });
      }
      const result = await analyzeSymptoms(symptoms, answers || []);
      res.json(result);
    } catch (error) {
      console.error("Error analyzing symptoms:", error);
      res.status(500).json({ message: "Failed to analyze symptoms" });
    }
  });

  // ==========================================
  // Admin User Management Routes
  // ==========================================

  // Valid roles for validation
  const validRoles = [
    "super_admin", "editor_in_chief", "managing_editor", "senior_editor",
    "editor", "journalist", "reviewer", "contributor", "subscriber"
  ];

  // Admin login endpoint
  app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    const bcrypt = await import("bcryptjs");
    const { pool } = await import("./db");

    // Check admin_accounts table
    try {
      const result = await pool.query(
        "SELECT * FROM admin_accounts WHERE username = $1 AND is_active = true",
        [username]
      );
      const account = result.rows[0];
      if (account && await bcrypt.compare(password, account.password_hash)) {
        (req.session as any).adminAuthenticated = true;
        (req.session as any).adminRole = account.role;
        (req.session as any).adminPermissions = account.permissions || [];
        (req.session as any).adminUsername = account.username;
        (req.session as any).adminDisplayName = account.display_name || account.username;
        (req.session as any).adminAccountId = account.id;
        req.session.save((err) => {
          if (err) console.error("Session save error:", err);
          return res.json({ success: true, message: "تم تسجيل الدخول بنجاح", role: account.role });
        });
        return;
      }
    } catch (e) { console.error("Admin accounts lookup error:", e); }

    return res.status(401).json({ success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  });

  // Admin logout endpoint
  app.post('/api/admin/logout', (req, res) => {
    (req.session as any).adminAuthenticated = false;
    req.session.destroy?.((err: any) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
    });
    return res.json({ success: true, message: "تم تسجيل الخروج" });
  });

  // Check admin session endpoint
  app.get('/api/admin/check-session', async (req, res) => {
    if ((req.session as any)?.adminAuthenticated) {
      // جلب الاسم الحالي من قاعدة البيانات دائماً لتجنب الجلسات القديمة
      try {
        const { pool } = await import("./db");
        const username = (req.session as any).adminUsername;
        const role = (req.session as any).adminRole;
        let displayName = (req.session as any).adminDisplayName || "";
        if (username) {
          const result = await pool.query(
            "SELECT display_name FROM admin_accounts WHERE username = $1",
            [username]
          );
          if (result.rows[0]?.display_name) {
            displayName = result.rows[0].display_name;
            (req.session as any).adminDisplayName = displayName;
          }
        } else if (role === "super_admin") {
          // جلسة قديمة بدون adminUsername - يُعدّ super_admin هو "admin"
          displayName = "محمد الحيدر";
          (req.session as any).adminUsername = "admin";
          (req.session as any).adminDisplayName = displayName;
        }
        return res.json({
          authenticated: true,
          role: (req.session as any).adminRole || "editor",
          permissions: (req.session as any).adminPermissions || [],
          displayName,
        });
      } catch {
        return res.json({
          authenticated: true,
          role: (req.session as any).adminRole || "editor",
          permissions: (req.session as any).adminPermissions || [],
          displayName: (req.session as any).adminDisplayName || "",
        });
      }
    }
    return res.json({ authenticated: false });
  });

  // ── Admin Accounts CRUD (super_admin only) ────────────────────────────────
  app.get('/api/admin/accounts', isSuperAdmin, async (req, res) => {
    const { pool } = await import("./db");
    const result = await pool.query(
      "SELECT id, username, display_name, role, permissions, is_active, created_at FROM admin_accounts ORDER BY created_at DESC"
    );
    res.json(result.rows);
  });

  app.post('/api/admin/accounts', isSuperAdmin, async (req, res) => {
    const { username, password, displayName, role, permissions } = req.body;
    if (!username || !password || !displayName) {
      return res.status(400).json({ message: "اسم المستخدم وكلمة المرور والاسم مطلوبة" });
    }
    const bcrypt = await import("bcryptjs");
    const { pool } = await import("./db");
    try {
      const hash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        `INSERT INTO admin_accounts (username, password_hash, display_name, role, permissions)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, display_name, role, permissions, is_active, created_at`,
        [username, hash, displayName, role || "editor", permissions || []]
      );
      res.json(result.rows[0]);
    } catch (e: any) {
      if (e.code === "23505") return res.status(409).json({ message: "اسم المستخدم مستخدم مسبقاً" });
      res.status(500).json({ message: e.message });
    }
  });

  app.patch('/api/admin/accounts/:id', isSuperAdmin, async (req, res) => {
    const { id } = req.params;
    const { displayName, role, permissions, isActive, password } = req.body;
    const { pool } = await import("./db");
    const bcrypt = await import("bcryptjs");
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (displayName !== undefined) { updates.push(`display_name = $${idx++}`); values.push(displayName); }
    if (role !== undefined) { updates.push(`role = $${idx++}`); values.push(role); }
    if (permissions !== undefined) { updates.push(`permissions = $${idx++}`); values.push(permissions); }
    if (isActive !== undefined) { updates.push(`is_active = $${idx++}`); values.push(isActive); }
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      updates.push(`password_hash = $${idx++}`); values.push(hash);
    }
    updates.push(`updated_at = NOW()`);
    if (values.length === 0) return res.status(400).json({ message: "لا يوجد تحديثات" });
    values.push(id);
    const result = await pool.query(
      `UPDATE admin_accounts SET ${updates.join(", ")} WHERE id = $${idx}
       RETURNING id, username, display_name, role, permissions, is_active, created_at`,
      values
    );
    res.json(result.rows[0]);
  });

  app.delete('/api/admin/accounts/:id', isSuperAdmin, async (req, res) => {
    const { pool } = await import("./db");
    await pool.query("DELETE FROM admin_accounts WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  });

  // ─────────────────────────────────────────────────────────────────────────

  // Get all users (admin only)
  app.get('/api/admin/users', requireAdminPermission('manage_users'), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user role
  app.patch('/api/admin/users/:userId/role', isSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }
      
      // Validate role against allowed values
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role value" });
      }
      
      await storage.updateUserRole(userId, role);
      res.json({ success: true, message: "Role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Toggle user status (active/inactive)
  app.patch('/api/admin/users/:userId/status', isSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      
      await storage.updateUserStatus(userId, isActive);
      res.json({ success: true, message: "Status updated successfully" });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Update user profile (name and email)
  app.patch('/api/admin/users/:userId/profile', isSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { firstName, lastName, email } = req.body;
      
      const updated = await storage.updateUserProfile(userId, { firstName, lastName, email });
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true, message: "Profile updated successfully", user: updated });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // ==========================================
  // News Radar API Routes
  // ==========================================

  // Radar Sources
  app.get('/api/radar/sources', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      const sources = await storage.getRadarSources(activeOnly);
      res.json(sources);
    } catch (error) {
      console.error("Error fetching radar sources:", error);
      res.status(500).json({ message: "Failed to fetch sources" });
    }
  });

  app.post('/api/radar/sources', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const validation = insertRadarSourceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: validation.error.errors });
      }
      const source = await storage.createRadarSource(validation.data);
      res.status(201).json(source);
    } catch (error) {
      console.error("Error creating radar source:", error);
      res.status(500).json({ message: "Failed to create source" });
    }
  });

  app.patch('/api/radar/sources/:id', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const validation = insertRadarSourceSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: validation.error.errors });
      }
      const source = await storage.updateRadarSource(req.params.id, validation.data);
      if (!source) {
        return res.status(404).json({ message: "Source not found" });
      }
      res.json(source);
    } catch (error) {
      console.error("Error updating radar source:", error);
      res.status(500).json({ message: "Failed to update source" });
    }
  });

  app.delete('/api/radar/sources/:id', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const source = await storage.getRadarSource(req.params.id);
      if (source?.url) {
        await storage.addExcludedSeedUrl(source.url);
      }
      await storage.deleteRadarSource(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting radar source:", error);
      res.status(500).json({ message: "Failed to delete source" });
    }
  });

  // Radar Keywords
  app.get('/api/radar/keywords', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const keywords = await storage.getRadarKeywords(category);
      res.json(keywords);
    } catch (error) {
      console.error("Error fetching radar keywords:", error);
      res.status(500).json({ message: "Failed to fetch keywords" });
    }
  });

  app.post('/api/radar/keywords', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const validation = insertRadarKeywordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: validation.error.errors });
      }
      const keyword = await storage.createRadarKeyword(validation.data);
      res.status(201).json(keyword);
    } catch (error) {
      console.error("Error creating radar keyword:", error);
      res.status(500).json({ message: "Failed to create keyword" });
    }
  });

  app.patch('/api/radar/keywords/:id', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const validation = insertRadarKeywordSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: validation.error.errors });
      }
      const keyword = await storage.updateRadarKeyword(req.params.id, validation.data);
      if (!keyword) {
        return res.status(404).json({ message: "Keyword not found" });
      }
      res.json(keyword);
    } catch (error) {
      console.error("Error updating radar keyword:", error);
      res.status(500).json({ message: "Failed to update keyword" });
    }
  });

  app.delete('/api/radar/keywords/:id', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      await storage.deleteRadarKeyword(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting radar keyword:", error);
      res.status(500).json({ message: "Failed to delete keyword" });
    }
  });

  // Radar Items (collected news)
  app.get('/api/radar/items', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const options = {
        status: req.query.status as string | undefined,
        sourceId: req.query.sourceId as string | undefined,
        category: req.query.category as string | undefined,
        search: req.query.search as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };
      const items = await storage.getRadarItems(options);
      res.json(items);
    } catch (error) {
      console.error("Error fetching radar items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get('/api/radar/items/stats', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const stats = await storage.getRadarItemsStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching radar stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/radar/items/:id', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const item = await storage.getRadarItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching radar item:", error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.patch('/api/radar/items/:id/breaking', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const { isBreaking } = req.body;
      if (typeof isBreaking !== 'boolean') {
        return res.status(400).json({ message: "isBreaking must be boolean" });
      }
      const item = await storage.toggleRadarItemBreaking(req.params.id, isBreaking);
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.json(item);
    } catch (error) {
      console.error("Error toggling breaking:", error);
      res.status(500).json({ message: "Failed to toggle breaking" });
    }
  });

  app.patch('/api/radar/items/:id/status', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const statusUpdateSchema = z.object({
        status: z.enum(["pending", "approved", "rejected", "published", "archived"]),
        reviewNotes: z.string().optional(),
      });
      const validation = statusUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: validation.error.errors });
      }
      const { status, reviewNotes } = validation.data;
      const item = await storage.updateRadarItemStatus(req.params.id, status, undefined, reviewNotes);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating radar item status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Radar Alerts
  app.get('/api/radar/alerts', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      const alerts = await storage.getRadarAlerts(activeOnly);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching radar alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.post('/api/radar/alerts', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const validation = insertRadarAlertSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: validation.error.errors });
      }
      const alert = await storage.createRadarAlert(validation.data);
      res.status(201).json(alert);
    } catch (error) {
      console.error("Error creating radar alert:", error);
      res.status(500).json({ message: "Failed to create alert" });
    }
  });

  app.patch('/api/radar/alerts/:id', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const validation = insertRadarAlertSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: validation.error.errors });
      }
      const alert = await storage.updateRadarAlert(req.params.id, validation.data);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      console.error("Error updating radar alert:", error);
      res.status(500).json({ message: "Failed to update alert" });
    }
  });

  app.delete('/api/radar/alerts/:id', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      await storage.deleteRadarAlert(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting radar alert:", error);
      res.status(500).json({ message: "Failed to delete alert" });
    }
  });

  // Radar Notifications
  app.get('/api/radar/notifications', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const unreadOnly = req.query.unread === 'true';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const notifications = await storage.getRadarNotifications(unreadOnly, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching radar notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/radar/notifications/:id/read', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  app.post('/api/radar/notifications/mark-all-read', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      await storage.markAllNotificationsRead();
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications read:", error);
      res.status(500).json({ message: "Failed to mark all as read" });
    }
  });

  // Fetch logs
  app.get('/api/radar/logs', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const sourceId = req.query.sourceId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const logs = await storage.getRecentFetchLogs(sourceId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching radar logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  // Fetch news from all active sources
  app.post('/api/radar/fetch', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const result = await fetchAllActiveSources();
      res.json(result);
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  // Fetch from a specific source
  app.post('/api/radar/sources/:id/fetch', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const source = await storage.getRadarSource(req.params.id);
      if (!source) {
        return res.status(404).json({ message: "Source not found" });
      }
      const result = await fetchRSSSource(source);
      res.json(result);
    } catch (error) {
      console.error("Error fetching source:", error);
      res.status(500).json({ message: "Failed to fetch source" });
    }
  });

  // Classify pending items with AI
  app.post('/api/radar/classify', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const limit = req.body.limit || 10;
      const classified = await classifyPendingItems(limit);
      res.json({ classified });
    } catch (error) {
      console.error("Error classifying items:", error);
      res.status(500).json({ message: "Failed to classify items" });
    }
  });

  // Seed default sources and keywords
  app.post('/api/radar/seed', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const sourcesAdded = await seedDefaultSources();
      const keywordsAdded = await seedDefaultKeywords();
      res.json({ sourcesAdded, keywordsAdded });
    } catch (error) {
      console.error("Error seeding radar data:", error);
      res.status(500).json({ message: "Failed to seed data" });
    }
  });

  // حذف الأخبار غير الصحية من الرادار
  app.post('/api/radar/items/batch-delete', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "يجب تحديد أخبار للحذف" });
      }
      const deleted = await storage.deleteRadarItemsByIds(ids);
      res.json({ deleted, message: `تم حذف ${deleted} خبر` });
    } catch (error) {
      console.error("Error batch deleting radar items:", error);
      res.status(500).json({ message: "فشل حذف الأخبار" });
    }
  });

  app.post('/api/radar/cleanup-non-health', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const result = await cleanupNonHealthItems();
      res.json(result);
    } catch (error) {
      console.error("Error cleaning up non-health items:", error);
      res.status(500).json({ message: "فشل تنظيف الأخبار غير الصحية" });
    }
  });

  app.post('/api/radar/cleanup-reviewed', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const deleted = await storage.deleteReviewedRadarItems();
      res.json({ deleted, message: `تم حذف ${deleted} خبر مراجع` });
    } catch (error) {
      console.error("Error cleaning up reviewed radar items:", error);
      res.status(500).json({ message: "فشل حذف الأخبار المراجعة" });
    }
  });

  // Convert radar item to news article
  app.post('/api/radar/items/:id/publish', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const item = await storage.getRadarItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      const newsData = {
        title: item.titleAr || item.title,
        excerpt: item.summaryAr || item.summary || '',
        content: item.contentAr || item.content || '',
        category: item.category || 'health-news',
        imageUrl: item.imageUrl || undefined,
        author: 'محمد الحيدر',
        status: 'draft' as const,
        sourceUrl: item.originalUrl,
        sourceName: undefined,
        tags: item.keywords || [],
        isTranslated: !!(item.titleAr && item.language !== 'ar'),
      };

      const news = await storage.createNews(newsData);
      await storage.updateRadarItemStatus(item.id, 'published');
      
      res.json({ success: true, newsId: news.id });
    } catch (error) {
      console.error("Error publishing radar item:", error);
      res.status(500).json({ message: "Failed to publish item" });
    }
  });

  // =====================================================
  // Advanced Translation & News Processing Routes
  // =====================================================

  // Translate and process a single radar item with AI
  app.post('/api/radar/items/:id/translate', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const item = await storage.getRadarItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Get source info for translation
      let sourceName = "Unknown";
      if (item.sourceId) {
        const source = await storage.getRadarSource(item.sourceId);
        if (source) sourceName = source.name;
      }

      // Translate and process with AI
      const translated = await translateAndProcessNews(
        item.title,
        item.content || item.summary || '',
        item.summary || '',
        item.originalUrl,
        sourceName
      );

      // Update item with translated content (store in available fields)
      // Note: subtitle, seoTitle, seoDescription stored in aiAnalysis for later use
      await storage.updateRadarItem(item.id, {
        titleAr: translated.title,
        contentAr: translated.content,
        summaryAr: translated.summary,
        keywords: translated.keywords,
        category: translated.category,
        relevanceScore: translated.importanceScore,
        isBreaking: translated.isBreaking,
        status: 'pending',
        aiAnalysis: {
          topics: translated.keywords,
          entities: [],
          credibilityScore: translated.importanceScore * 10,
          summary: translated.summary,
          subtitle: translated.subtitle,
          seoTitle: translated.seoTitle,
          seoDescription: translated.seoDescription,
        } as any,
      });

      res.json({
        success: true,
        translation: translated,
      });
    } catch (error: any) {
      console.error("Error translating radar item:", error);
      res.status(500).json({ message: error?.message || "Failed to translate item" });
    }
  });

  // Evaluate importance of multiple news items
  app.post('/api/radar/evaluate', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const { itemIds } = req.body;
      if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({ message: "itemIds array required" });
      }

      const items = await Promise.all(
        itemIds.map(id => storage.getRadarItem(id))
      );

      const validItems = items.filter(Boolean);
      
      // Get source names for better AI evaluation
      const sourceNames: Record<string, string> = {};
      for (const item of validItems) {
        if (item!.sourceId && !sourceNames[item!.sourceId]) {
          const source = await storage.getRadarSource(item!.sourceId);
          sourceNames[item!.sourceId] = source?.name || 'Unknown';
        }
      }
      
      const newsItems = validItems.map(item => ({
        title: item!.titleAr || item!.title,
        summary: item!.summaryAr || item!.summary || '',
        source: sourceNames[item!.sourceId || ''] || 'Unknown',
      }));

      const evaluations = await evaluateNewsImportance(newsItems);

      // Update items with evaluations
      for (const evaluation of evaluations) {
        const itemId = itemIds[evaluation.index];
        if (itemId) {
          await storage.updateRadarItem(itemId, {
            relevanceScore: evaluation.score,
            status: evaluation.shouldPublish ? 'pending' : 'rejected',
          });
        }
      }

      res.json({ evaluations });
    } catch (error) {
      console.error("Error evaluating news:", error);
      res.status(500).json({ message: "Failed to evaluate news" });
    }
  });

  // Translate, process and publish radar item with image download
  app.post('/api/radar/items/:id/process-and-publish', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const item = await storage.getRadarItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Get source info
      let sourceName = "Unknown";
      if (item.sourceId) {
        const source = await storage.getRadarSource(item.sourceId);
        if (source) sourceName = source.name;
      }

      // Translate if not already translated
      const aiAnalysis = item.aiAnalysis as any || {};
      let translatedContent = {
        title: item.titleAr || '',
        subtitle: aiAnalysis.subtitle || '',
        content: item.contentAr || '',
        summary: item.summaryAr || '',
        seoTitle: aiAnalysis.seoTitle || '',
        seoDescription: aiAnalysis.seoDescription || '',
        keywords: item.keywords || [],
        category: item.category || 'health-news',
      };

      if (!item.titleAr) {
        const translated = await translateAndProcessNews(
          item.title,
          item.content || item.summary || '',
          item.summary || '',
          item.originalUrl,
          sourceName
        );
        translatedContent = {
          title: translated.title,
          subtitle: translated.subtitle,
          content: translated.content,
          summary: translated.summary,
          seoTitle: translated.seoTitle,
          seoDescription: translated.seoDescription,
          keywords: translated.keywords,
          category: translated.category,
        };
      }

      // Download and upload image if available
      let finalImageUrl = item.imageUrl;
      if (item.imageUrl && !item.imageUrl.includes('replit.app')) {
        const uploadedUrl = await downloadAndUploadImage(item.imageUrl);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      // Create news article with short code
      const newsData = {
        title: translatedContent.title,
        subtitle: translatedContent.subtitle,
        summary: translatedContent.summary,
        content: translatedContent.content,
        category: translatedContent.category,
        imageUrl: finalImageUrl || undefined,
        source: sourceName,
        sourceUrl: item.originalUrl,
        keywords: translatedContent.keywords,
        seoTitle: translatedContent.seoTitle,
        seoDescription: translatedContent.seoDescription,
        shortCode: generateShortCode(),
        status: 'draft' as const,
        isTranslated: item.language !== 'ar',
      };

      const news = await storage.createNews(newsData);
      
      // Update radar item status
      await storage.updateRadarItem(item.id, { status: 'published' });

      res.json({
        success: true,
        newsId: news.id,
        imageUploaded: finalImageUrl !== item.imageUrl,
      });
    } catch (error: any) {
      console.error("Error processing and publishing:", error);
      res.status(500).json({ message: error?.message || "Failed to process item" });
    }
  });

  // Batch translate multiple items
  app.post('/api/radar/batch-translate', requireAdminPermission('manage_radar'), async (req, res) => {
    try {
      const { itemIds } = req.body;
      if (!itemIds || !Array.isArray(itemIds)) {
        return res.status(400).json({ message: "itemIds array required" });
      }

      const results = [];
      for (const itemId of itemIds.slice(0, 10)) { // Max 10 items at a time
        try {
          const item = await storage.getRadarItem(itemId);
          if (!item) continue;

          let sourceName = "Unknown";
          if (item.sourceId) {
            const source = await storage.getRadarSource(item.sourceId);
            if (source) sourceName = source.name;
          }

          const translated = await translateAndProcessNews(
            item.title,
            item.content || item.summary || '',
            item.summary || '',
            item.originalUrl,
            sourceName
          );

          await storage.updateRadarItem(item.id, {
            titleAr: translated.title,
            contentAr: translated.content,
            summaryAr: translated.summary,
            keywords: translated.keywords,
            category: translated.category,
            relevanceScore: translated.importanceScore,
            isBreaking: translated.isBreaking,
            status: 'pending',
            aiAnalysis: {
              topics: translated.keywords,
              entities: [],
              credibilityScore: translated.importanceScore * 10,
              summary: translated.summary,
              subtitle: translated.subtitle,
              seoTitle: translated.seoTitle,
              seoDescription: translated.seoDescription,
            } as any,
          });

          results.push({ id: itemId, success: true });
        } catch (err: any) {
          results.push({ id: itemId, success: false, error: err?.message });
        }
      }

      res.json({ results });
    } catch (error) {
      console.error("Error batch translating:", error);
      res.status(500).json({ message: "Failed to batch translate" });
    }
  });

  // =====================================================
  // AI Image Generation Routes
  // =====================================================

  // Get generation settings
  app.get('/api/admin/generation/settings', requireAdminPermission('ai_content'), async (req, res) => {
    try {
      let settings = await storage.getGenerationSettings();
      if (!settings) {
        settings = await storage.upsertGenerationSettings({
          monthlyQuota: 100,
          defaultGenerationType: 'realistic',
          defaultQuality: 'hd',
          defaultSize: '1024x1024',
          enabledModels: ['dall-e-3'],
          maxPromptLength: 1000,
          autoGenerateFromContent: true,
        });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching generation settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update generation settings
  app.put('/api/admin/generation/settings', isSuperAdmin, async (req, res) => {
    try {
      const { id, createdAt, updatedAt, ...updateData } = req.body;
      const settings = await storage.upsertGenerationSettings(updateData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating generation settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Get monthly usage
  app.get('/api/admin/generation/usage', requireAdminPermission('view_analytics'), async (req, res) => {
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const usage = await storage.getTotalMonthlyUsage(month);
      const settings = await storage.getGenerationSettings();
      res.json({
        ...usage,
        month,
        quota: settings?.monthlyQuota || 100,
        remaining: (settings?.monthlyQuota || 100) - usage.credits,
      });
    } catch (error) {
      console.error("Error fetching usage:", error);
      res.status(500).json({ message: "Failed to fetch usage" });
    }
  });

  // Generate prompt from content
  app.post('/api/admin/generation/generate-prompt', requireAdminPermission('ai_content'), async (req, res) => {
    try {
      const { title, content, generationType } = req.body;
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content required" });
      }
      const prompt = await generatePromptFromContent(title, content, generationType || 'realistic');
      res.json({ prompt });
    } catch (error) {
      console.error("Error generating prompt:", error);
      res.status(500).json({ message: "Failed to generate prompt" });
    }
  });

  // Generate image
  app.post('/api/admin/generation/image', requireAdminPermission('ai_images'), async (req, res) => {
    try {
      const { prompt, newsId, articleId, quality, size, generationType } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt required" });
      }

      // Check quota
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const usage = await storage.getTotalMonthlyUsage(month);
      const settings = await storage.getGenerationSettings();
      
      if (usage.credits >= (settings?.monthlyQuota || 100)) {
        return res.status(429).json({ message: "تم تجاوز الحد الشهري للتوليد" });
      }

      // Create generation record
      const generation = await storage.createImageGeneration({
        userId: null,
        newsId: newsId || null,
        articleId: articleId || null,
        prompt,
        generationType: generationType || settings?.defaultGenerationType || 'artistic',
        quality: quality || settings?.defaultQuality || 'hd',
        size: size || settings?.defaultSize || '1024x1024',
        model: 'gemini-2.5-flash',
        creditsUsed: 1,
      });

      // Update status to generating
      await storage.updateImageGeneration(generation.id, { status: 'generating' });

      // Generate image using Gemini
      const result = await generateImage({
        prompt,
        quality: quality || 'hd',
        size: size || '1024x1024',
      });

      if (!result.success) {
        await storage.updateImageGeneration(generation.id, {
          status: 'failed',
          errorMessage: result.error,
          generationTimeMs: result.generationTimeMs,
        });
        return res.status(500).json({ message: result.error });
      }

      // Upload buffer to object storage via PRIVATE_OBJECT_DIR (served through /objects/ route)
      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || '';
      if (!privateObjectDir) {
        await storage.updateImageGeneration(generation.id, {
          status: 'failed',
          errorMessage: "مخزن الملفات غير مهيأ",
          generationTimeMs: result.generationTimeMs,
        });
        return res.status(500).json({ message: "مخزن الملفات غير مهيأ" });
      }

      let objectStoragePath: string;
      try {
        const objectId = randomUUID();
        const extension = result.imageMimeType?.includes('png') ? 'png' : 'jpg';
        const fileName = `ai-${objectId}.${extension}`;
        const fullPath = `${privateObjectDir}/uploads/${fileName}`;
        const pathParts = fullPath.startsWith('/') ? fullPath.slice(1).split('/') : fullPath.split('/');
        const bucketName = pathParts[0];
        const objectName = pathParts.slice(1).join('/');

        const bucket = objectStorageClient.bucket(bucketName);
        const file = bucket.file(objectName);
        await file.save(result.imageBuffer!, {
          contentType: result.imageMimeType || 'image/png',
          resumable: false,
        });
        objectStoragePath = `/objects/uploads/${fileName}`;
      } catch (uploadError: any) {
        await storage.updateImageGeneration(generation.id, {
          status: 'failed',
          errorMessage: "فشل في رفع الصورة للتخزين",
          generationTimeMs: result.generationTimeMs,
        });
        return res.status(500).json({ message: "فشل في رفع الصورة للتخزين" });
      }

      // Update generation record
      await storage.updateImageGeneration(generation.id, {
        status: 'completed',
        imageUrl: objectStoragePath,
        objectStoragePath,
        revisedPrompt: result.revisedPrompt,
        generationTimeMs: result.generationTimeMs,
        completedAt: new Date(),
      });

      // Increment usage
      await storage.incrementUsage(null, month, 1, 0, 1);

      res.json({
        success: true,
        generationId: generation.id,
        imageUrl: objectStoragePath,
        revisedPrompt: result.revisedPrompt,
        generationTimeMs: result.generationTimeMs,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ message: "Failed to generate image" });
    }
  });

  // Get image generations history
  app.get('/api/admin/generation/images', requireAdminPermission('ai_images'), async (req, res) => {
    try {
      const { newsId, status, limit } = req.query;
      const generations = await storage.getImageGenerations({
        newsId: newsId as string,
        status: status as string,
      }, limit ? parseInt(limit as string) : 50);
      res.json(generations);
    } catch (error) {
      console.error("Error fetching generations:", error);
      res.status(500).json({ message: "Failed to fetch generations" });
    }
  });

  // Get single generation
  app.get('/api/admin/generation/images/:id', requireAdminPermission('ai_images'), async (req, res) => {
    try {
      const generation = await storage.getImageGeneration(req.params.id);
      if (!generation) {
        return res.status(404).json({ message: "Generation not found" });
      }
      res.json(generation);
    } catch (error) {
      console.error("Error fetching generation:", error);
      res.status(500).json({ message: "Failed to fetch generation" });
    }
  });

  // =====================================================
  // Infographic Routes
  // =====================================================

  // Get infographic templates
  app.get('/api/admin/infographic/templates', requireAdminPermission('ai_images'), async (req, res) => {
    try {
      const activeOnly = req.query.activeOnly !== 'false';
      const templates = await storage.getInfographicTemplates(activeOnly);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Create infographic template
  app.post('/api/admin/infographic/templates', requireAdminPermission('ai_images'), async (req, res) => {
    try {
      const template = await storage.createInfographicTemplate(req.body);
      res.json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  // Update infographic template
  app.put('/api/admin/infographic/templates/:id', requireAdminPermission('ai_images'), async (req, res) => {
    try {
      const template = await storage.updateInfographicTemplate(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  // Delete infographic template
  app.delete('/api/admin/infographic/templates/:id', requireAdminPermission('ai_images'), async (req, res) => {
    try {
      await storage.deleteInfographicTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Extract infographic data from raw text
  app.post('/api/admin/infographic/extract-from-text', requireAdminPermission('ai_images'), async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string' || text.trim().length < 20) {
        return res.status(400).json({ message: "يرجى إدخال نص كافٍ (20 حرف على الأقل)" });
      }
      const infographicData = await extractInfographicFromText(text.trim());
      res.json(infographicData);
    } catch (error) {
      console.error("Error extracting infographic from text:", error);
      res.status(500).json({ message: "فشل في استخراج البيانات من النص" });
    }
  });

  // Generate infographic as AI image (Nano Banana 2)
  app.post('/api/admin/infographic/generate-ai-image', requireAdminPermission('ai_images'), async (req, res) => {
    try {
      const data = req.body;
      if (!data?.title) {
        return res.status(400).json({ message: "بيانات الإنفوجرافيك غير مكتملة" });
      }

      const result = await generateInfographicImage(data);
      if (!result.success || !result.imageBuffer) {
        return res.status(500).json({ message: result.error || "فشل في توليد الإنفوجرافيك" });
      }

      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || '';
      if (!privateObjectDir) {
        return res.status(500).json({ message: "مخزن الملفات غير مهيأ" });
      }

      const { randomUUID } = await import('node:crypto');
      const fileName = `infographic-ai-${randomUUID()}.png`;
      const fullPath = `${privateObjectDir}/uploads/${fileName}`;
      const pathParts = fullPath.startsWith('/') ? fullPath.slice(1).split('/') : fullPath.split('/');
      const bucketName = pathParts[0];
      const objectName = pathParts.slice(1).join('/');

      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      await file.save(result.imageBuffer, { contentType: 'image/png', resumable: false });

      const imageUrl = `/objects/uploads/${fileName}`;
      res.json({
        imageUrl,
        generationTimeMs: result.generationTimeMs,
        message: "تم توليد الإنفوجرافيك بنجاح",
      });
    } catch (error: any) {
      console.error("Infographic AI image error:", error);
      res.status(500).json({ message: error.message || "فشل في التوليد" });
    }
  });

  // Generate infographic
  app.post('/api/admin/infographic/generate', requireAdminPermission('ai_images'), async (req, res) => {
    try {
      const { templateId, newsId, title, contentData, customPrompt, width, height } = req.body;
      
      if (!title || !contentData) {
        return res.status(400).json({ message: "Title and content data required" });
      }

      // Check quota
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const usage = await storage.getTotalMonthlyUsage(month);
      const settings = await storage.getGenerationSettings();
      
      if (usage.credits >= (settings?.monthlyQuota || 100)) {
        return res.status(429).json({ message: "تم تجاوز الحد الشهري للتوليد" });
      }

      // Get template if provided
      let template = null;
      if (templateId) {
        template = await storage.getInfographicTemplate(templateId);
      }

      // Create job record
      const job = await storage.createInfographicJob({
        userId: null,
        templateId: templateId || null,
        newsId: newsId || null,
        title,
        contentData,
        customPrompt,
        width: width || template?.defaultWidth || 1200,
        height: height || template?.defaultHeight || 630,
        creditsUsed: 2,
      });

      // Update status
      await storage.updateInfographicJob(job.id, { status: 'generating' });

      // Generate prompt
      const prompt = customPrompt || await generateInfographicPrompt(
        title,
        contentData,
        template?.category || 'health'
      );

      // Generate image
      const result = await generateImage({
        prompt,
        quality: 'hd',
        size: '1792x1024',
        style: 'vivid',
      });

      if (!result.success) {
        await storage.updateInfographicJob(job.id, {
          status: 'failed',
          errorMessage: result.error,
          generationTimeMs: result.generationTimeMs,
        });
        return res.status(500).json({ message: result.error });
      }

      // Upload to object storage
      let objectStoragePath = null;
      if (result.imageUrl) {
        const uploadedUrl = await downloadAndUploadImage(result.imageUrl);
        if (uploadedUrl) {
          objectStoragePath = uploadedUrl;
        }
      }

      // Update job record
      await storage.updateInfographicJob(job.id, {
        status: 'completed',
        resultImageUrl: objectStoragePath || result.imageUrl,
        objectStoragePath,
        generationTimeMs: result.generationTimeMs,
        completedAt: new Date(),
      });

      // Increment usage (infographics cost 2 credits)
      await storage.incrementUsage(null, month, 0, 1, 2);

      res.json({
        success: true,
        jobId: job.id,
        imageUrl: objectStoragePath || result.imageUrl,
        generationTimeMs: result.generationTimeMs,
      });
    } catch (error) {
      console.error("Error generating infographic:", error);
      res.status(500).json({ message: "Failed to generate infographic" });
    }
  });

  // Get infographic jobs history
  app.get('/api/admin/infographic/jobs', requireAdminPermission('ai_images'), async (req, res) => {
    try {
      const { status, limit } = req.query;
      const jobs = await storage.getInfographicJobs({
        status: status as string,
      }, limit ? parseInt(limit as string) : 50);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching infographic jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Get single infographic job
  app.get('/api/admin/infographic/jobs/:id', requireAdminPermission('ai_images'), async (req, res) => {
    try {
      const job = await storage.getInfographicJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching infographic job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  // Seed default infographic templates
  app.post('/api/admin/infographic/seed-templates', requireAdminPermission('ai_images'), async (req, res) => {
    try {
      const templates = [
        {
          name: "Health Statistics",
          nameAr: "إحصائيات صحية",
          description: "Template for displaying health statistics and data",
          descriptionAr: "قالب لعرض الإحصائيات والبيانات الصحية",
          category: "statistics",
          defaultWidth: 1200,
          defaultHeight: 630,
          layoutConfig: { type: "statistics", columns: 3 },
          colorScheme: ["#10B981", "#3B82F6", "#6366F1"],
          isActive: true,
          sortOrder: 1,
        },
        {
          name: "Medical Tips",
          nameAr: "نصائح طبية",
          description: "Template for health tips and recommendations",
          descriptionAr: "قالب للنصائح والتوصيات الصحية",
          category: "tips",
          defaultWidth: 1200,
          defaultHeight: 630,
          layoutConfig: { type: "tips", items: 5 },
          colorScheme: ["#059669", "#047857", "#065F46"],
          isActive: true,
          sortOrder: 2,
        },
        {
          name: "Comparison Chart",
          nameAr: "مقارنة",
          description: "Template for comparing health options or treatments",
          descriptionAr: "قالب لمقارنة الخيارات أو العلاجات الصحية",
          category: "comparison",
          defaultWidth: 1200,
          defaultHeight: 800,
          layoutConfig: { type: "comparison", columns: 2 },
          colorScheme: ["#10B981", "#EF4444"],
          isActive: true,
          sortOrder: 3,
        },
        {
          name: "Timeline",
          nameAr: "جدول زمني",
          description: "Template for health timelines and processes",
          descriptionAr: "قالب للجداول الزمنية والعمليات الصحية",
          category: "timeline",
          defaultWidth: 1200,
          defaultHeight: 900,
          layoutConfig: { type: "timeline", steps: 5 },
          colorScheme: ["#3B82F6", "#60A5FA", "#93C5FD"],
          isActive: true,
          sortOrder: 4,
        },
      ];

      const created = [];
      for (const template of templates) {
        const existing = await storage.getInfographicTemplates(false);
        const exists = existing.find(t => t.name === template.name);
        if (!exists) {
          const newTemplate = await storage.createInfographicTemplate(template);
          created.push(newTemplate);
        }
      }

      res.json({ created: created.length, templates: created });
    } catch (error) {
      console.error("Error seeding templates:", error);
      res.status(500).json({ message: "Failed to seed templates" });
    }
  });

  // ==========================================
  // Google News Search API
  // ==========================================
  app.get('/api/admin/google-news', requireAdminPermission('publish_news'), async (req, res) => {
    try {
      const query = (req.query.q as string) || 'أخبار صحية';
      const page = parseInt(req.query.page as string) || 1;
      const apiKey = process.env.GOOGLE_API_KEY;
      const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

      if (!apiKey || !searchEngineId) {
        return res.status(500).json({ message: "مفاتيح Google API غير مهيأة" });
      }

      const startIndex = (page - 1) * 10 + 1;
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&start=${startIndex}&num=10&lr=lang_ar&dateRestrict=m1&sort=date`;

      const response = await fetch(searchUrl);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Search API error:', errorText);
        return res.status(response.status).json({ message: "فشل في البحث من Google", details: errorText });
      }

      const data = await response.json();

      const results = (data.items || []).map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        source: item.displayLink,
        imageUrl: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src || null,
        publishedDate: item.pagemap?.metatags?.[0]?.['article:published_time'] || item.pagemap?.metatags?.[0]?.['og:updated_time'] || null,
      }));

      res.json({
        results,
        totalResults: data.searchInformation?.totalResults || '0',
        searchTime: data.searchInformation?.searchTime || 0,
        page,
        hasMore: data.queries?.nextPage ? true : false,
      });
    } catch (error: any) {
      console.error("Error searching Google News:", error);
      res.status(500).json({ message: "فشل في البحث", error: error.message });
    }
  });

  // Import a single Google News result as news article
  app.post('/api/admin/google-news/import', requireAdminPermission('publish_news'), async (req, res) => {
    try {
      const { title, link, snippet, source, imageUrl, category } = req.body;

      if (!title || !link) {
        return res.status(400).json({ message: "العنوان والرابط مطلوبان" });
      }

      // Try to fetch the full article content
      let fullContent = snippet || '';
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const pageResponse = await fetch(link, { 
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CapsulahBot/1.0)' }
        });
        clearTimeout(timeoutId);
        
        if (pageResponse.ok) {
          const html = await pageResponse.text();
          // Extract article content from common selectors
          const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
          const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
          const contentMatch = html.match(/class="(?:entry-content|article-content|post-content|content-body)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)>/i);
          
          const rawContent = contentMatch?.[1] || articleMatch?.[1] || mainMatch?.[1] || '';
          if (rawContent.length > snippet.length) {
            // Clean up the HTML
            fullContent = rawContent
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<nav[\s\S]*?<\/nav>/gi, '')
              .replace(/<header[\s\S]*?<\/header>/gi, '')
              .replace(/<footer[\s\S]*?<\/footer>/gi, '')
              .replace(/<aside[\s\S]*?<\/aside>/gi, '')
              .replace(/<!--[\s\S]*?-->/g, '');
          }
        }
      } catch (fetchErr) {
        console.log('Could not fetch full article, using snippet');
      }

      // Download and upload image if available
      let localImageUrl = imageUrl;
      if (imageUrl) {
        const uploadedUrl = await downloadAndUploadImage(imageUrl);
        if (uploadedUrl) {
          localImageUrl = uploadedUrl;
        }
      }

      // Auto-categorize using AI if no category provided
      let finalCategory = category;
      if (!finalCategory || finalCategory === 'health-news') {
        try {
          const allCats = await storage.getCategories(true);
          const catInfo = allCats.map(c => ({ slug: c.slug, nameAr: c.nameAr, description: c.description }));
          finalCategory = await categorizeNewsArticle(title, snippet || '', catInfo);
        } catch {
          finalCategory = 'health-news';
        }
      }

      const shortCode = generateShortCode();
      const newsItem = await storage.createNews({
        title,
        subtitle: null,
        content: fullContent ? `<p>${fullContent.replace(/<[^>]*>/g, '').trim().substring(0, 5000)}</p>` : `<p>${snippet}</p>`,
        summary: snippet?.substring(0, 300) || null,
        category: finalCategory,
        source: source || new URL(link).hostname,
        sourceUrl: link,
        imageUrl: localImageUrl || null,
        imageAlt: title,
        seoTitle: title.substring(0, 60),
        seoDescription: snippet?.substring(0, 160) || null,
        keywords: [],
        isFeatured: false,
        status: 'draft',
        publishedAt: new Date(),
        shortCode,
      });

      res.status(201).json(newsItem);
    } catch (error: any) {
      console.error("Error importing Google News:", error);
      res.status(500).json({ message: "فشل في استيراد الخبر", error: error.message });
    }
  });

  // ==========================================
  // Nano Banana Image Generation (Gemini)
  // ==========================================
  app.post('/api/admin/generate-image-ai', requireAdminPermission('ai_images'), async (req, res) => {
    try {
      const { title, content, summary, category, style, mood } = req.body;

      if (!title && !content) {
        return res.status(400).json({ message: "العنوان أو المحتوى مطلوب لتوليد الصورة" });
      }

      const imagePrompt = buildNewsImagePrompt({
        title: title || '',
        summary: summary || (content ? content.substring(0, 300) : ''),
        category: category || 'health',
        style: style || 'photorealistic',
        mood: mood || 'neutral',
        language: 'Arabic',
      });
      console.log("[Image Generation] Built prompt:", imagePrompt.substring(0, 200));

      const result = await generateImage({ prompt: imagePrompt });

      if (!result.success || !result.imageBuffer) {
        return res.status(500).json({ message: result.error || "لم يتم توليد صورة، حاول مرة أخرى" });
      }

      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || '';
      if (!privateObjectDir) {
        return res.status(500).json({ message: "مخزن الملفات غير مهيأ" });
      }

      const extension = result.imageMimeType?.includes('png') ? 'png' : 'jpg';
      const objectId = randomUUID();
      const fileName = `ai-${objectId}.${extension}`;
      const fullPath = `${privateObjectDir}/uploads/${fileName}`;
      const pathParts = fullPath.startsWith('/') ? fullPath.slice(1).split('/') : fullPath.split('/');
      const bucketName = pathParts[0];
      const objectName = pathParts.slice(1).join('/');

      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      await file.save(result.imageBuffer, {
        contentType: result.imageMimeType || 'image/png',
        resumable: false,
      });

      const objectPath = `/objects/uploads/${fileName}`;

      res.json({ 
        imageUrl: objectPath,
        prompt: imagePrompt,
        message: "تم توليد الصورة بنجاح"
      });
    } catch (error: any) {
      console.error("Error generating AI image:", error);
      const errorMsg = error?.message?.includes("rate") || error?.message?.includes("429")
        ? "تم تجاوز الحد المسموح، حاول بعد قليل"
        : "فشل في توليد الصورة";
      res.status(500).json({ message: errorMsg, error: error.message });
    }
  });

  // ==========================================
  // Podcast API Routes
  // ==========================================

  // Public: list podcast episodes
  app.get('/api/podcast/episodes', async (req, res) => {
    try {
      const episodes = await storage.getPodcastEpisodes(50);
      res.json(episodes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Public: get single episode
  app.get('/api/podcast/episodes/:id', async (req, res) => {
    try {
      const episode = await storage.getPodcastEpisode(req.params.id);
      if (!episode) return res.status(404).json({ message: 'الحلقة غير موجودة' });
      res.json(episode);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: trigger podcast generation
  app.post('/api/admin/podcast/generate', requireAdminPermission('ai_content'), async (req, res) => {
    try {
      const { generatePodcastEpisode } = await import('./podcastService');
      const today = new Date().toISOString().split('T')[0];
      const title = req.body.title || `كبسولة الصوتية - ${today}`;

      const episode = await storage.createPodcastEpisode({
        title,
        scriptText: '',
        audioUrl: null,
        sourceArticleIds: [],
        episodeDate: today,
        status: 'pending',
        newsCount: 0,
        errorMessage: null,
        durationSeconds: null,
      });

      // Run generation in background
      generatePodcastEpisode(episode.id).catch(console.error);

      res.json({ message: 'جاري توليد الحلقة...', episode });
    } catch (error: any) {
      console.error('[podcast] generate error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: regenerate an existing episode
  app.post('/api/admin/podcast/episodes/:id/regenerate', requireAdminPermission('ai_content'), async (req, res) => {
    try {
      const { generatePodcastEpisode } = await import('./podcastService');
      const episode = await storage.getPodcastEpisode(req.params.id);
      if (!episode) return res.status(404).json({ message: 'الحلقة غير موجودة' });

      await storage.updatePodcastEpisode(episode.id, {
        status: 'pending',
        audioUrl: null,
        errorMessage: null,
      });

      generatePodcastEpisode(episode.id).catch(console.error);

      res.json({ message: 'جاري إعادة توليد الحلقة...' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: delete episode
  app.delete('/api/admin/podcast/episodes/:id', requireAdminPermission('ai_content'), async (req, res) => {
    try {
      const deleted = await storage.deletePodcastEpisode(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'الحلقة غير موجودة' });
      res.json({ message: 'تم حذف الحلقة بنجاح' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Serve podcast audio files
  app.get('/objects/podcasts/:filename', async (req, res) => {
    try {
      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || '';
      if (!privateObjectDir) return res.status(500).json({ message: 'Storage not configured' });

      const pathParts = privateObjectDir.startsWith('/') ? privateObjectDir.slice(1).split('/') : privateObjectDir.split('/');
      const bucketName = pathParts[0];
      const basePath = pathParts.slice(1).join('/');
      const objectName = basePath ? `${basePath}/podcasts/${req.params.filename}` : `podcasts/${req.params.filename}`;

      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (!exists) return res.status(404).json({ message: 'File not found' });

      const [data] = await file.download();
      res.set({
        'Content-Type': 'audio/wav',
        'Content-Length': data.length,
        'Cache-Control': 'public, max-age=86400',
        'Accept-Ranges': 'bytes',
      });
      res.send(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  // ──────────────────────────────────────────────────────────────────────────

  // ─── Admin image upload endpoint ──────────────────────────────────────────
  app.post('/api/admin/upload-image', requireAnyAdminPermission('ai_images', 'manage_ads'), async (req, res) => {
    try {
      const { base64, mimeType } = req.body;
      if (!base64 || !mimeType) {
        return res.status(400).json({ message: 'base64 and mimeType مطلوبان' });
      }
      const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg').replace('svg+xml', 'svg') || 'jpg';
      const objectId = randomUUID();
      const fileName = `${objectId}.${extension}`;
      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || '';
      if (!privateObjectDir) return res.status(500).json({ message: 'Object storage غير مهيأ' });

      const buffer = Buffer.from(base64, 'base64');
      const fullPath = `${privateObjectDir}/uploads/${fileName}`;
      const pathParts = fullPath.startsWith('/') ? fullPath.slice(1).split('/') : fullPath.split('/');
      const bucketName = pathParts[0];
      const objectName = pathParts.slice(1).join('/');

      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      await file.save(buffer, { contentType: mimeType, metadata: { cacheControl: 'public, max-age=31536000' } });

      res.json({ imageUrl: `/objects/uploads/${fileName}` });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'فشل في رفع الصورة' });
    }
  });
  // ──────────────────────────────────────────────────────────────────────────

  // ─── Archive Chatbot Endpoints ────────────────────────────────────────────
  app.get('/api/assistant/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ message: "يرجى إدخال كلمة بحث صالحة" });
      }
      const results = await storage.searchArchive(query.trim());
      const baseUrl = process.env.BASE_URL || 'https://capsulah.com';

      const newsItems = results.news.map((n) => ({
        id: n.id,
        type: "news" as const,
        title: n.title,
        excerpt: n.summary || n.content.substring(0, 300),
        url: n.shortCode ? `${baseUrl}/n/${n.shortCode}` : `${baseUrl}/news/${n.id}`,
        category: n.category,
        publishedAt: n.publishedAt,
        relevanceScore: n.relevanceScore,
      }));

      const articleItems = results.articles.map((a) => ({
        id: a.id,
        type: "article" as const,
        title: a.title,
        excerpt: a.excerpt,
        url: `${baseUrl}/articles/${a.slug}`,
        category: a.category,
        publishedAt: a.publishedAt,
        relevanceScore: a.relevanceScore,
      }));

      // Merge and sort globally by relevance score so the list is properly ranked
      const merged = [...newsItems, ...articleItems].sort(
        (a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0)
      );

      res.json({ results: merged, total: merged.length });
    } catch (error) {
      console.error("[Archive Search] Error:", error);
      res.status(500).json({ message: "فشل البحث في الأرشيف" });
    }
  });

  app.post('/api/assistant/chat', async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string' || message.trim().length < 2) {
        return res.status(400).json({ message: "يرجى إدخال سؤال صالح" });
      }

      const query = message.trim();

      // Extract 2-4 meaningful Arabic/English key terms from the user's question
      const CHAT_STOP_WORDS = new Set([
        'من','في','على','مع','عن','إلى','الى','هل','ما','ماذا','كيف','لماذا','متى','أين','اين',
        'هذا','هذه','ذلك','تلك','هو','هي','هم','هن','انا','نحن','انت','انتم',
        'كان','يكون','كانت','لا','نعم','قد','لقد','حتى','بعد','قبل','أو','او',
        'و','ف','ب','ل','ك','أن','ان','إن','إذ','إذا','اذا','لأن','لكن',
        'آخر','اخر','أحدث','احدث','اخبار','خبر','مقال','مقالات','معلومات',
        'تحدث','يتحدث','تخص','حول','عن','بشأن','بخصوص','لي','لنا','لهم',
        'أريد','اريد','أبحث','ابحث','اعطني','أخبرني','اخبرني','لخص','لخصي',
      ]);

      const keyTerms = [...new Set(
        query
          .replace(/[؟?!،,\.。\-_()[\]{}]/g, ' ')
          .split(/\s+/)
          .map(t => t.trim())
          .filter(t => t.length >= 2 && !CHAT_STOP_WORDS.has(t))
      )].slice(0, 4);

      // Run searches in parallel: one per key term + one for the full query
      const searchTargets = keyTerms.length > 0 ? [...keyTerms, query] : [query];
      const searchResults = await Promise.all(
        searchTargets.map(term => storage.searchArchive(term, 5))
      );

      // Merge and deduplicate by ID, keeping the highest relevance score per item
      const seenNews = new Map<string, typeof searchResults[0]['news'][0]>();
      const seenArticles = new Map<string, typeof searchResults[0]['articles'][0]>();

      for (const result of searchResults) {
        for (const n of result.news) {
          const existing = seenNews.get(n.id);
          if (!existing || n.relevanceScore > existing.relevanceScore) {
            seenNews.set(n.id, n);
          }
        }
        for (const a of result.articles) {
          const existing = seenArticles.get(a.id);
          if (!existing || a.relevanceScore > existing.relevanceScore) {
            seenArticles.set(a.id, a);
          }
        }
      }

      // Sort merged results by relevance score and take top results
      const mergedNews = [...seenNews.values()]
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 6);
      const mergedArticles = [...seenArticles.values()]
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 4);

      const baseUrl = process.env.BASE_URL || 'https://capsulah.com';

      const archiveResults: ArchiveSearchResult[] = [
        ...mergedNews.map((n) => ({
          id: n.id,
          type: "news" as const,
          title: n.title,
          excerpt: (n.summary || n.content.substring(0, 500)).replace(/<[^>]*>/g, ''),
          url: n.shortCode ? `${baseUrl}/n/${n.shortCode}` : `${baseUrl}/news/${n.id}`,
          category: n.category,
          publishedAt: n.publishedAt,
        })),
        ...mergedArticles.map((a) => ({
          id: a.id,
          type: "article" as const,
          title: a.title,
          excerpt: a.excerpt.replace(/<[^>]*>/g, ''),
          url: `${baseUrl}/articles/${a.slug}`,
          category: a.category,
          publishedAt: a.publishedAt,
        })),
      ];

      const chatResponse = await generateArchiveChatResponse(query, archiveResults);
      res.json(chatResponse);
    } catch (error) {
      console.error("[Archive Chat] Error:", error);
      res.status(500).json({ message: "فشل في معالجة السؤال" });
    }
  });
  // ──────────────────────────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────────────

  // =====================================================
  // Rumor Submissions API (اسأل كبسولة)
  // =====================================================

  // POST /api/rumors — public endpoint to submit a rumor
  app.post("/api/rumors", rumorSubmissionLimiter, async (req, res) => {
    try {
      const parsed = insertRumorSubmissionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: parsed.error.errors });
      }

      const rumor = await storage.createRumorSubmission(parsed.data);

      // Call AI immediately in the background, update status
      debunkMedicalRumor(rumor.rumorText).then(async (aiResponse) => {
        await storage.updateRumorSubmission(rumor.id, {
          status: "ai_responded",
          aiResponse,
        });
      }).catch((err) => {
        console.error("[Rumor] AI debunk error:", err);
      });

      res.status(201).json({ message: "تم استلام الشائعة وجاري التحليل", id: rumor.id });
    } catch (error: any) {
      console.error("[POST /api/rumors] Error:", error);
      res.status(500).json({ message: "حدث خطأ أثناء معالجة الطلب" });
    }
  });

  // GET /api/rumors/published — public list of published debunks
  app.get("/api/rumors/published", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const rumors = await storage.getPublishedRumors(limit);
      res.json(rumors);
    } catch (error: any) {
      console.error("[GET /api/rumors/published] Error:", error);
      res.status(500).json({ message: "خطأ في جلب البيانات" });
    }
  });

  // GET /api/rumors/:id — public status page for a specific submission (limited fields)
  app.get("/api/rumors/:id", async (req, res) => {
    try {
      const rumor = await storage.getRumorSubmissionById(req.params.id);
      if (!rumor) return res.status(404).json({ message: "الشائعة غير موجودة" });
      const { editorNotes, ...publicFields } = rumor;
      res.json(publicFields);
    } catch (error: any) {
      console.error("[GET /api/rumors/:id] Error:", error);
      res.status(500).json({ message: "خطأ في جلب البيانات" });
    }
  });

  // POST /api/rumors/:id/view — increment view count
  app.post("/api/rumors/:id/view", async (req, res) => {
    try {
      await storage.incrementRumorViewCount(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.json({ success: false });
    }
  });

  // GET /api/admin/rumors — admin list with optional status filter
  app.get('/api/admin/rumors', requireAdminPermission('publish_news'), async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const rumors = await storage.getRumorSubmissions(status);
      res.json(rumors);
    } catch (error: any) {
      console.error("[GET /api/admin/rumors] Error:", error);
      res.status(500).json({ message: "خطأ في جلب البيانات" });
    }
  });

  // GET /api/admin/rumors/:id
  app.get('/api/admin/rumors/:id', requireAdminPermission('publish_news'), async (req, res) => {
    try {
      const rumor = await storage.getRumorSubmissionById(req.params.id);
      if (!rumor) return res.status(404).json({ message: "الشائعة غير موجودة" });
      res.json(rumor);
    } catch (error: any) {
      res.status(500).json({ message: "خطأ في جلب البيانات" });
    }
  });

  // PATCH /api/admin/rumors/:id — edit notes, reject, or approve + publish
  app.patch('/api/admin/rumors/:id', requireAdminPermission('edit_news'), async (req, res) => {
    try {
      const rumor = await storage.getRumorSubmissionById(req.params.id);
      if (!rumor) return res.status(404).json({ message: "الشائعة غير موجودة" });

      const { action, editorNotes, aiResponse } = req.body;

      if (action === "reject") {
        const updated = await storage.updateRumorSubmission(req.params.id, {
          status: "rejected",
          editorNotes: editorNotes || rumor.editorNotes,
        });
        return res.json(updated);
      }

      if (action === "publish") {
        // Create or update a news item with category "debunk"
        const responseData = aiResponse || rumor.aiResponse;
        if (!responseData) {
          return res.status(400).json({ message: "لا يوجد رد من الذكاء الاصطناعي للنشر" });
        }

        // Ensure responseData is a plain serialisable object before writing to JSONB
        let safeResponseData: any;
        try {
          safeResponseData = JSON.parse(JSON.stringify(responseData));
        } catch (serErr) {
          console.error("[PATCH /api/admin/rumors/:id] aiResponse is not JSON-serialisable:", serErr);
          return res.status(400).json({ message: "بيانات الذكاء الاصطناعي غير صالحة للحفظ" });
        }
        if (typeof safeResponseData !== 'object' || safeResponseData === null || Array.isArray(safeResponseData)) {
          console.error("[PATCH /api/admin/rumors/:id] aiResponse is not a plain object:", typeof safeResponseData);
          return res.status(400).json({ message: "بيانات الذكاء الاصطناعي غير صالحة للحفظ" });
        }

        const verdictEmoji = safeResponseData.verdict === "خرافة" ? "❌" : safeResponseData.verdict === "صحيح" ? "✅" : "⚠️";
        const newsTitle = `تفنيد | ${verdictEmoji} ${safeResponseData.shortSummary || rumor.rumorText.substring(0, 80)}`;
        const platformLabels: Record<string, string> = {
          tiktok: "تيك توك", whatsapp: "واتساب", facebook: "فيسبوك", twitter: "تويتر", other: "الإنترنت"
        };
        const platformLabel = platformLabels[rumor.sourcePlatform] || "الإنترنت";

        const newsContent = `
<p><strong>الشائعة المُقدَّمة:</strong></p>
<blockquote>${rumor.rumorText}</blockquote>
<p><strong>المصدر:</strong> ${platformLabel}</p>
<hr/>
<h2>الحكم: ${safeResponseData.verdict}</h2>
<p>${safeResponseData.explanation}</p>
${safeResponseData.sources && safeResponseData.sources.length > 0 ? `
<h3>المراجع والمصادر:</h3>
<ul>
${safeResponseData.sources.map((s: { title: string; url: string }) => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.title}</a></li>`).join('')}
</ul>` : ''}
${editorNotes ? `<p><em>ملاحظات تحريرية: ${editorNotes}</em></p>` : ''}`.trim();

        const newsPayload = {
          title: newsTitle,
          subtitle: `شائعة انتشرت على ${platformLabel}`,
          summary: safeResponseData.shortSummary || "",
          content: newsContent,
          category: "debunk" as const,
          status: "published" as const,
          publishedAt: new Date(),
          source: "اسأل كبسولة",
          isFeatured: false,
          isBreaking: false,
        };

        let publishedNews: any;
        if (rumor.publishedNewsId) {
          // Re-publish: update the existing news item to avoid duplicate/constraint conflicts
          console.log(`[PATCH /api/admin/rumors/:id] Updating existing news item ${rumor.publishedNewsId} for rumor ${req.params.id}`);
          publishedNews = await storage.updateNews(rumor.publishedNewsId, newsPayload);
          if (!publishedNews) {
            // Existing news was deleted — fall back to creating a new one
            console.warn(`[PATCH /api/admin/rumors/:id] Existing news ${rumor.publishedNewsId} not found, creating new one`);
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let shortCode = '';
            for (let i = 0; i < 7; i++) shortCode += chars.charAt(Math.floor(Math.random() * chars.length));
            publishedNews = await storage.createNews({ ...newsPayload, shortCode });
          }
        } else {
          // First publish: create a new news item
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          let shortCode = '';
          for (let i = 0; i < 7; i++) shortCode += chars.charAt(Math.floor(Math.random() * chars.length));
          publishedNews = await storage.createNews({ ...newsPayload, shortCode });
        }

        const updated = await storage.updateRumorSubmission(req.params.id, {
          status: "published",
          editorNotes: editorNotes || rumor.editorNotes,
          aiResponse: safeResponseData,
          publishedNewsId: publishedNews.id,
        });

        // Generate a relevant image in the background (fire-and-forget)
        (async () => {
          try {
            const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || '';
            if (!privateObjectDir) return;

            const imagePrompt = buildNewsImagePrompt({
              title: responseData.shortSummary || rumor.rumorText.substring(0, 120),
              summary: rumor.rumorText.substring(0, 300),
              category: 'health',
              style: 'photorealistic',
              mood: 'serious',
              language: 'Arabic',
            });

            const imgResult = await generateImage({ prompt: imagePrompt });
            if (!imgResult.success || !imgResult.imageBuffer) return;

            const extension = imgResult.imageMimeType?.includes('png') ? 'png' : 'jpg';
            const fileName = `ai-${randomUUID()}.${extension}`;
            const fullPath = `${privateObjectDir}/uploads/${fileName}`;
            const pathParts = fullPath.startsWith('/') ? fullPath.slice(1).split('/') : fullPath.split('/');
            const bucket = objectStorageClient.bucket(pathParts[0]);
            await bucket.file(pathParts.slice(1).join('/')).save(imgResult.imageBuffer, {
              contentType: imgResult.imageMimeType || 'image/png',
              resumable: false,
            });

            await storage.updateNews(publishedNews.id, { imageUrl: `/objects/uploads/${fileName}` });
            console.log(`[Rumor] صورة الشائعة ${publishedNews.id} تم توليدها وحفظها`);
          } catch (imgErr) {
            console.error('[Rumor] فشل توليد صورة الشائعة (غير حرج):', imgErr);
          }
        })();

        return res.json({ ...updated, publishedNews });
      }

      // Otherwise just update notes/aiResponse
      const updated = await storage.updateRumorSubmission(req.params.id, {
        editorNotes: editorNotes !== undefined ? editorNotes : rumor.editorNotes,
        aiResponse: aiResponse !== undefined ? aiResponse : rumor.aiResponse,
      });
      res.json(updated);
    } catch (error: any) {
      console.error("[PATCH /api/admin/rumors/:id] Error:", error);
      res.status(500).json({ message: "خطأ في تحديث البيانات" });
    }
  });

  // POST /api/admin/rumors/:id/regenerate — re-run AI debunk
  app.post('/api/admin/rumors/:id/regenerate', requireAdminPermission('edit_news'), async (req, res) => {
    const rumorId = req.params.id;

    // Step 1: Fetch the rumor
    let rumor: any;
    try {
      rumor = await storage.getRumorSubmissionById(rumorId);
    } catch (dbErr: any) {
      console.error(`[POST /api/admin/rumors/${rumorId}/regenerate] DB fetch error:`, dbErr?.message, dbErr?.stack);
      return res.status(500).json({ message: "خطأ في قراءة بيانات الشائعة" });
    }
    if (!rumor) return res.status(404).json({ message: "الشائعة غير موجودة" });

    // Step 2: Call the AI debunk function
    let aiResponse: any;
    try {
      aiResponse = await debunkMedicalRumor(rumor.rumorText);
    } catch (aiErr: any) {
      console.error(`[POST /api/admin/rumors/${rumorId}/regenerate] AI call error:`, aiErr?.message, aiErr?.stack);
      return res.status(500).json({ message: "خطأ في استدعاء خدمة الذكاء الاصطناعي" });
    }

    // Ensure aiResponse is a plain JSON-serialisable object before writing to JSONB
    let safeAiResponse: any;
    try {
      safeAiResponse = JSON.parse(JSON.stringify(aiResponse));
    } catch (serErr: any) {
      console.error(`[POST /api/admin/rumors/${rumorId}/regenerate] aiResponse serialisation error:`, serErr?.message);
      return res.status(500).json({ message: "استجابة الذكاء الاصطناعي غير صالحة للحفظ" });
    }
    if (typeof safeAiResponse !== 'object' || safeAiResponse === null || Array.isArray(safeAiResponse)) {
      console.error(`[POST /api/admin/rumors/${rumorId}/regenerate] aiResponse is not a plain object:`, typeof safeAiResponse);
      return res.status(500).json({ message: "استجابة الذكاء الاصطناعي غير صالحة للحفظ" });
    }

    // Step 3: Persist the result
    let updated: any;
    try {
      updated = await storage.updateRumorSubmission(rumorId, {
        status: "ai_responded",
        aiResponse: safeAiResponse,
      });
    } catch (updateErr: any) {
      console.error(`[POST /api/admin/rumors/${rumorId}/regenerate] DB update error:`, updateErr?.message, updateErr?.stack);
      return res.status(500).json({ message: "خطأ في حفظ نتيجة التحليل" });
    }

    if (!updated) {
      console.error(`[POST /api/admin/rumors/${rumorId}/regenerate] updateRumorSubmission returned undefined — ID not found mid-flight`);
      return res.status(404).json({ message: "الشائعة غير موجودة أو تم حذفها" });
    }

    return res.json(updated);
  });

  // ─── WhatsApp Newsletter API ────────────────────────────────────────────────

  // Public: Subscribe to WhatsApp newsletter
  app.post("/api/whatsapp/subscribe", whatsappSubscribeLimiter, async (req, res) => {
    // Always return the same generic response to avoid a phone-number existence oracle
    const GENERIC_OK = { message: "إذا كان الرقم صالحاً، ستصلك رسالة واتساب خلال دقيقة للتأكيد" };
    try {
      const { phone, name, interests } = req.body;
      if (!phone || typeof phone !== "string") {
        return res.status(400).json({ message: "رقم الهاتف مطلوب" });
      }
      const cleanPhone = phone.replace(/\s/g, "").replace(/^00/, "+");
      if (!/^\+?[0-9]{9,15}$/.test(cleanPhone)) {
        return res.status(400).json({ message: "رقم الهاتف غير صحيح" });
      }

      const existing = await storage.getWhatsappSubscriberByPhone(cleanPhone);
      if (existing) {
        if (existing.isActive && existing.status === "active") {
          // Already subscribed — don't change state, don't reveal existence
          return res.status(200).json(GENERIC_OK);
        }
        await storage.updateWhatsappSubscriber(existing.id, {
          isActive: true,
          status: "pending",
          name: name || existing.name,
          interests: interests || existing.interests,
          unsubscribedAt: null,
        });
        if (canSendToPhone(cleanPhone)) {
          const { sendWhatsAppMessage, formatWelcomeMessage } = await import("./whatsappService");
          await sendWhatsAppMessage({ to: cleanPhone, body: formatWelcomeMessage(name) });
        }
        return res.status(200).json(GENERIC_OK);
      }

      await storage.createWhatsappSubscriber({
        phone: cleanPhone,
        name: name || null,
        interests: interests || [],
        status: "pending",
        isActive: true,
      });

      if (canSendToPhone(cleanPhone)) {
        const { sendWhatsAppMessage, formatWelcomeMessage } = await import("./whatsappService");
        await sendWhatsAppMessage({ to: cleanPhone, body: formatWelcomeMessage(name) });
      }

      return res.status(200).json(GENERIC_OK);
    } catch (error: any) {
      console.error("[WhatsApp Subscribe]", error.message);
      // Return generic success to avoid leaking internal errors
      return res.status(200).json(GENERIC_OK);
    }
  });

  // Public: Unsubscribe initiation — does NOT directly change subscriber state.
  // Ownership proof is required: the actual opt-out is handled by the verified
  // inbound WhatsApp webhook when the subscriber sends "إيقاف" / "stop".
  // This endpoint only informs the caller how to unsubscribe.
  app.post("/api/whatsapp/unsubscribe", whatsappUnsubscribeLimiter, async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "رقم الهاتف مطلوب" });
    // Return the same message regardless of whether the number is in the DB
    return res.json({
      message: "لإلغاء اشتراكك، أرسل كلمة «إيقاف» عبر واتساب إلى الرقم الذي أرسلت منه النشرة الصحية.",
    });
  });

  // WhatsApp webhook for inbound messages (stop/نعم keywords)
  app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
      // Validate X-Hub-Signature-256 — fail-closed: if WHATSAPP_APP_SECRET is not
      // configured the endpoint rejects all requests rather than accepting them.
      const appSecret = process.env.WHATSAPP_APP_SECRET;
      if (!appSecret) {
        return res.sendStatus(403);
      }
      const sigHeader = req.headers["x-hub-signature-256"] as string | undefined;
      if (!sigHeader) {
        return res.sendStatus(403);
      }
      const rawBody = req.rawBody as Buffer | undefined;
      if (!rawBody) {
        return res.sendStatus(400);
      }
      const expectedSig = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
      let sigMatch = false;
      try {
        sigMatch = timingSafeEqual(Buffer.from(sigHeader), Buffer.from(expectedSig));
      } catch {
        sigMatch = false;
      }
      if (!sigMatch) {
        return res.sendStatus(403);
      }

      const body = req.body;
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const messages = changes?.value?.messages;
      if (messages && messages.length > 0) {
        for (const msg of messages) {
          const from = msg.from;
          const text = (msg.text?.body || "").trim().toLowerCase();

          if (text === "إيقاف" || text === "stop" || text === "ايقاف") {
            const subscriber = await storage.getWhatsappSubscriberByPhone(from);
            if (subscriber) {
              await storage.updateWhatsappSubscriber(subscriber.id, {
                isActive: false,
                status: "unsubscribed",
                unsubscribedAt: new Date(),
              });
              const { sendWhatsAppMessage } = await import("./whatsappService");
              await sendWhatsAppMessage({ to: from, body: "✅ تم إلغاء اشتراكك بنجاح. يمكنك الاشتراك مجدداً من موقعنا في أي وقت." });
            }
          } else if (text === "نعم" || text === "yes") {
            const subscriber = await storage.getWhatsappSubscriberByPhone(from);
            if (subscriber && subscriber.status === "pending") {
              await storage.updateWhatsappSubscriber(subscriber.id, { status: "active" });
              const { sendWhatsAppMessage } = await import("./whatsappService");
              await sendWhatsAppMessage({ to: from, body: "🎉 أهلاً بك! تم تفعيل اشتراكك في كبسولة الصباح الصحية. ستصلك رسالتنا كل صباح 🌿" });
            }
          }
        }
      }
      res.sendStatus(200);
    } catch (error) {
      res.sendStatus(200);
    }
  });

  // WhatsApp webhook verification
  app.get("/api/whatsapp/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "capsulah_whatsapp_verify";
    if (mode === "subscribe" && token === verifyToken) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  // Admin: Get all subscribers
  app.get('/api/admin/whatsapp/subscribers', requireAdminPermission('ai_content'), async (req, res) => {
    try {
      const { status, isActive } = req.query;
      const filters: any = {};
      if (status) filters.status = status as string;
      if (isActive !== undefined) filters.isActive = isActive === "true";
      const subscribers = await storage.getWhatsappSubscribers(filters);
      res.json(subscribers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: Get subscriber stats
  app.get('/api/admin/whatsapp/stats', requireAdminPermission('ai_content'), async (req, res) => {
    try {
      const stats = await storage.getWhatsappSubscriberStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: Update subscriber status
  app.patch('/api/admin/whatsapp/subscribers/:id', requireAdminPermission('ai_content'), async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updateWhatsappSubscriber(id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: Get newsletters
  app.get('/api/admin/whatsapp/newsletters', requireAdminPermission('ai_content'), async (req, res) => {
    try {
      const newsletters = await storage.getWhatsappNewsletters();
      res.json(newsletters);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: Generate newsletter content with AI
  app.post('/api/admin/whatsapp/generate-newsletter', requireAdminPermission('ai_content'), async (req, res) => {
    try {
      const { interests } = req.body;
      const recentNews = await storage.getNews(undefined, 20);
      const { generateWhatsAppNewsletter } = await import("./openai");
      const content = await generateWhatsAppNewsletter(
        recentNews.map(n => ({ title: n.title, summary: n.summary || undefined, category: n.category })),
        interests || []
      );
      res.json(content);
    } catch (error: any) {
      console.error("[WhatsApp Generate Newsletter]", error.message);
      res.status(500).json({ message: "فشل في توليد المحتوى" });
    }
  });

  // Admin: Send newsletter manually (or schedule for later)
  app.post('/api/admin/whatsapp/send-newsletter', isSuperAdmin, async (req, res) => {
    try {
      const { title, content, interests, scheduledAtMs } = req.body;
      if (!title || !content) return res.status(400).json({ message: "العنوان والمحتوى مطلوبان" });

      const sentBy = (req.session as any)?.adminUser?.displayName || "admin";

      // If scheduledAtMs (epoch ms) is provided, save as scheduled without sending
      if (scheduledAtMs) {
        const scheduledDate = new Date(Number(scheduledAtMs));
        if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
          return res.status(400).json({ message: "وقت الجدولة يجب أن يكون في المستقبل" });
        }

        const newsletter = await storage.createWhatsappNewsletter({
          title,
          content,
          interests: interests || [],
          recipientsCount: 0,
          status: "scheduled",
          sentBy,
          scheduledAt: scheduledDate,
        });

        return res.json({
          message: `تمت جدولة النشرة للإرسال في ${scheduledDate.toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}`,
          newsletterId: newsletter.id,
          scheduled: true,
        });
      }

      // Immediate send
      const targetSubscribers = await storage.getActiveWhatsappSubscribers(interests || []);
      if (targetSubscribers.length === 0) {
        return res.status(400).json({ message: "لا يوجد مشتركون فعّالون لهذا التخصص. تأكد من وجود مشتركين نشطين." });
      }

      const newsletter = await storage.createWhatsappNewsletter({
        title,
        content,
        interests: interests || [],
        recipientsCount: targetSubscribers.length,
        status: "sending",
        sentBy,
      });

      const phones = targetSubscribers.map(s => s.phone);
      const { sendBulkWhatsAppMessages } = await import("./whatsappService");
      const result = await sendBulkWhatsAppMessages(phones, content);

      await storage.updateWhatsappNewsletter(newsletter.id, {
        status: "sent",
        sentAt: new Date(),
        recipientsCount: result.sent,
      });

      for (const sub of targetSubscribers) {
        await storage.updateWhatsappSubscriber(sub.id, { lastMessageAt: new Date() });
      }

      res.json({
        message: `تم إرسال النشرة إلى ${result.sent} مشترك`,
        sent: result.sent,
        failed: result.failed,
        newsletterId: newsletter.id,
      });
    } catch (error: any) {
      console.error("[WhatsApp Send Newsletter]", error.message);
      res.status(500).json({ message: "فشل في إرسال النشرة" });
    }
  });

  // Admin: Cancel a scheduled newsletter
  app.delete('/api/admin/whatsapp/newsletters/:id', isSuperAdmin, async (req, res) => {
    try {
      const canceled = await storage.cancelScheduledNewsletter(req.params.id);
      if (!canceled) {
        return res.status(409).json({ message: "النشرة غير موجودة أو لم تعد مجدولة (ربما تم إرسالها بالفعل)" });
      }
      res.json({ message: "تم إلغاء الجدولة بنجاح" });
    } catch (error: any) {
      console.error("[WhatsApp Cancel Newsletter]", error.message);
      res.status(500).json({ message: "فشل في إلغاء الجدولة" });
    }
  });

  // Admin: Get/Update WhatsApp settings
  app.get('/api/admin/whatsapp/settings', requireAdminPermission('ai_content'), async (req, res) => {
    try {
      const settings = await storage.getWhatsappSettings();
      const { getApiMode } = await import("./whatsappService");
      res.json({ ...settings, apiMode: getApiMode() });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/admin/whatsapp/settings', isSuperAdmin, async (req, res) => {
    try {
      const settings = await storage.upsertWhatsappSettings(req.body);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  // ─────────────────────────────────────────────────────────────────────────────

  // ─── Legacy WordPress URL redirect ────────────────────────────────────────
  // Catches old capsulah.com WordPress permalinks (e.g. /2025/03/article-slug/)
  // and performs a 301 permanent redirect to the correct new URL.
  // Only activates for paths that start with a 4-digit year OR contain
  // a slug that matches a known article's sourceUrl.
  const EXCLUDED_PREFIXES = [
    '/api/', '/n/', '/news', '/admin', '/articles', '/chat',
    '/profile', '/login', '/register', '/objects/', '/assets/',
  ];

  app.get(/^\/\d{4}(\/.*)?$/, async (req, res, next) => {
    try {
      const urlPath = req.path;
      const newsItem = await storage.getNewsByLegacyUrl(urlPath);
      if (newsItem) {
        const newUrl = newsItem.shortCode ? `/n/${newsItem.shortCode}` : `/news/${newsItem.id}`;
        console.log(`[Redirect] ${urlPath} → ${newUrl}`);
        return res.redirect(301, newUrl);
      }
      next();
    } catch (err) {
      next();
    }
  });

  // ==========================================
  // Advertisement Routes
  // ==========================================

  // Public: get all active ads for a given position (supports timer-based rotation)
  app.get('/api/ads/active/:position', async (req, res) => {
    try {
      const ads = await storage.getActiveAdsByPosition(req.params.position);
      ads.forEach(ad => storage.incrementAdDailyStat(ad.id, 'impressions').catch(() => {}));
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.json(ads);
    } catch (error) {
      console.error("Error fetching active ads:", error);
      res.status(500).json({ message: "Failed to fetch ads" });
    }
  });

  // Public: record ad click
  app.post('/api/ads/:id/click', async (req, res) => {
    try {
      storage.incrementAdDailyStat(req.params.id, 'clicks').catch(() => {});
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to record click" });
    }
  });

  // Admin: list all ads (view_analytics OR manage_ads)
  app.get('/api/admin/ads', requireAnyAdminPermission('view_analytics', 'manage_ads'), async (req, res) => {
    try {
      const ads = await storage.getAdvertisements();
      res.json(ads);
    } catch (error) {
      console.error("Error fetching ads:", error);
      res.status(500).json({ message: "Failed to fetch ads" });
    }
  });

  // Admin: create ad
  app.post('/api/admin/ads', requireAdminPermission('manage_ads'), async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.startsAt) body.startsAt = new Date(body.startsAt);
      else delete body.startsAt;
      if (body.expiresAt) body.expiresAt = new Date(body.expiresAt);
      else delete body.expiresAt;
      const ad = await storage.createAdvertisement(body);
      res.status(201).json(ad);
    } catch (error) {
      console.error("Error creating ad:", error);
      res.status(500).json({ message: "Failed to create ad" });
    }
  });

  // Admin: update ad
  app.patch('/api/admin/ads/:id', requireAdminPermission('manage_ads'), async (req, res) => {
    try {
      const id = req.params.id;
      const updates = { ...req.body };
      if ('startsAt' in updates) updates.startsAt = updates.startsAt ? new Date(updates.startsAt) : null;
      if ('expiresAt' in updates) updates.expiresAt = updates.expiresAt ? new Date(updates.expiresAt) : null;

      // If the request tries to activate an ad, check that it hasn't expired
      if (updates.isActive === true) {
        const existing = await storage.getAdvertisementById(id);
        if (existing && existing.expiresAt && new Date(existing.expiresAt) < new Date()) {
          return res.status(400).json({
            message: "لا يمكن تفعيل إعلان منتهي الصلاحية. يرجى تعديل تاريخ الانتهاء أولاً.",
          });
        }
        // Also validate the new expiresAt if provided
        if (updates.expiresAt && new Date(updates.expiresAt) < new Date()) {
          return res.status(400).json({
            message: "لا يمكن تفعيل إعلان بتاريخ انتهاء في الماضي.",
          });
        }
      }

      const updated = await storage.updateAdvertisement(id, updates);
      if (!updated) return res.status(404).json({ message: "Ad not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating ad:", error);
      res.status(500).json({ message: "Failed to update ad" });
    }
  });

  // Admin: delete ad
  app.delete('/api/admin/ads/:id', requireAdminPermission('manage_ads'), async (req, res) => {
    try {
      await storage.deleteAdvertisement(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting ad:", error);
      res.status(500).json({ message: "Failed to delete ad" });
    }
  });

  // Admin: reset impression and click counters for an ad
  app.patch('/api/admin/ads/:id/reset-stats', requireAdminPermission('manage_ads'), async (req, res) => {
    try {
      const updated = await storage.resetAdStats(req.params.id);
      if (!updated) return res.status(404).json({ message: "Ad not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error resetting ad stats:", error);
      res.status(500).json({ message: "Failed to reset ad stats" });
    }
  });

  // Admin: get daily stats for a specific ad
  app.get('/api/admin/ads/:id/stats', requireAdminPermission('view_analytics'), async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const stats = await storage.getAdStats(req.params.id, days);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching ad stats:", error);
      res.status(500).json({ message: "Failed to fetch ad stats" });
    }
  });

  // Admin: manually trigger expired-ad cleanup
  app.post('/api/admin/ads/deactivate-expired', requireAdminPermission('manage_ads'), async (req, res) => {
    try {
      const count = await storage.deactivateExpiredAds();
      res.json({ deactivated: count });
    } catch (error) {
      console.error("Error deactivating expired ads:", error);
      res.status(500).json({ message: "Failed to deactivate expired ads" });
    }
  });

  // Also catch /:slug patterns (non-year) that match known WordPress slugs
  app.get('/:slug', async (req, res, next) => {
    const { slug } = req.params;
    // Skip excluded routes and static assets
    const fullPath = '/' + slug;
    if (EXCLUDED_PREFIXES.some(p => fullPath.startsWith(p))) return next();
    // Only try slug redirect if it looks like an Arabic/URL slug (contains - or Arabic chars)
    if (!/[-\u0600-\u06FF]/.test(slug)) return next();
    try {
      const newsItem = await storage.getNewsByLegacyUrl(fullPath);
      if (newsItem) {
        const newUrl = newsItem.shortCode ? `/n/${newsItem.shortCode}` : `/news/${newsItem.id}`;
        console.log(`[Redirect] ${fullPath} → ${newUrl}`);
        return res.redirect(301, newUrl);
      }
      next();
    } catch (err) {
      next();
    }
  });
  // ──────────────────────────────────────────────────────────────────────────

  // ==========================================
  // Health Trend Radar API endpoints
  // ==========================================

  app.get('/api/admin/trends', requireAdminPermission('view_analytics'), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const trends = await storage.getHealthTrends(limit);
      res.json(trends);
    } catch (err: unknown) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.get('/api/admin/trends/alerts', requireAdminPermission('view_analytics'), async (req, res) => {
    try {
      const unreadOnly = req.query.unread === "true";
      const alerts = await storage.getTrendAlerts(unreadOnly);
      const unreadCount = await storage.getUnreadTrendAlertsCount();
      res.json({ alerts, unreadCount });
    } catch (err: unknown) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.patch('/api/admin/trends/alerts/:id/read', requireAdminPermission('view_analytics'), async (req, res) => {
    try {
      await storage.markTrendAlertRead(req.params.id);
      res.json({ success: true });
    } catch (err: unknown) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.post('/api/admin/trends/alerts/read-all', requireAdminPermission('view_analytics'), async (req, res) => {
    try {
      await storage.markAllTrendAlertsRead();
      res.json({ success: true });
    } catch (err: unknown) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.post('/api/admin/trends/refresh', isSuperAdmin, async (req, res) => {
    try {
      const region = (req.body.region as string) || "SA";
      const result = await refreshHealthTrends(region);
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.get('/api/admin/trends/weekly-report', requireAdminPermission('view_analytics'), async (req, res) => {
    try {
      const { generateWeeklyTrendReport } = await import("./trendService");
      const region = (req.query.region as string) || "SA";
      const report = await generateWeeklyTrendReport(region);
      res.json(report);
    } catch (err: unknown) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  // ─── Drug Encyclopedia API ────────────────────────────────────────

  // GET /api/drugs — list popular drugs
  app.get('/api/drugs', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const result = await storage.getDrugs(limit);
      res.json(result);
    } catch (e) {
      res.status(500).json({ message: "فشل جلب الأدوية" });
    }
  });

  // GET /api/drugs/search?q=... — search existing drugs in DB
  app.get('/api/drugs/search', async (req, res) => {
    try {
      const q = (req.query.q as string || '').trim();
      if (!q) return res.json([]);
      const result = await storage.searchDrugs(q);
      res.json(result);
    } catch (e) {
      res.status(500).json({ message: "فشل البحث" });
    }
  });

  // GET /api/drugs/:id — get drug by id + increment views
  app.get('/api/drugs/:id', async (req, res) => {
    try {
      const drug = await storage.getDrugById(req.params.id);
      if (!drug) return res.status(404).json({ message: "الدواء غير موجود" });
      await storage.incrementDrugViewCount(req.params.id);
      res.json(drug);
    } catch (e) {
      res.status(500).json({ message: "فشل جلب الدواء" });
    }
  });

  // POST /api/drugs/generate — AI-generate drug info and cache it
  const drugGenLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
  app.post('/api/drugs/generate', drugGenLimiter, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ message: "يرجى إدخال اسم الدواء" });
      }
      const trimmedName = name.trim().slice(0, 100);

      // Check if already in DB first
      const existing = await storage.searchDrugs(trimmedName);
      const exactMatch = existing.find(d =>
        d.nameAr.toLowerCase() === trimmedName.toLowerCase() ||
        d.nameEn?.toLowerCase() === trimmedName.toLowerCase()
      );
      if (exactMatch) {
        await storage.incrementDrugViewCount(exactMatch.id);
        return res.json(exactMatch);
      }

      // Generate via AI
      const { generateDrugInfo } = await import('./openai');
      const info = await generateDrugInfo(trimmedName);
      if (!info) return res.status(404).json({ message: "لم يتم التعرف على هذا الدواء. تأكد من الاسم وأعد المحاولة." });

      const saved = await storage.upsertDrug({
        ...info,
        aiGenerated: true,
        viewCount: 1,
      });
      res.json(saved);
    } catch (e) {
      console.error("Drug generate error:", e);
      res.status(500).json({ message: "حدث خطأ أثناء توليد المعلومات" });
    }
  });

  // ==========================================
  // Authors / Writers
  // ==========================================

  const authorRegLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });
  const authorUploadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

  const AUTHOR_UPLOAD_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "application/pdf"]);
  // Public read route for author profile images (UUIDs are unguessable; credentials are NEVER served via this route)
  app.get('/api/author-image/:objectId', async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import('./replit_integrations/object_storage/objectStorage');
      const objectId = req.params.objectId;
      if (!/^[a-zA-Z0-9._-]+$/.test(objectId)) {
        return res.status(400).json({ error: "معرّف غير صحيح" });
      }
      const svc = new ObjectStorageService();
      try {
        const file = await svc.getObjectEntityFile(`/objects/uploads/${objectId}`);
        res.set({
          "Content-Disposition": "inline",
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "public, max-age=86400",
        });
        await svc.downloadObject(file, res, 86400);
      } catch (e: any) {
        if (e instanceof ObjectNotFoundError || e?.name === 'ObjectNotFoundError') {
          return res.status(404).json({ error: "لم يُعثر على الصورة" });
        }
        throw e;
      }
    } catch (e) {
      console.error("author-image error:", e);
      if (!res.headersSent) res.status(500).json({ error: "فشل عرض الصورة" });
    }
  });

  app.post('/api/authors/upload-url', authorUploadLimiter, async (req, res) => {
    try {
      const { ObjectStorageService } = await import('./replit_integrations/object_storage/objectStorage');
      const { name, size, contentType } = req.body as { name?: string; size?: number; contentType?: string };
      if (!name) return res.status(400).json({ error: "اسم الملف مطلوب" });
      if (!contentType || !AUTHOR_UPLOAD_MIME.has(contentType)) {
        return res.status(400).json({ error: "نوع الملف غير مدعوم. الأنواع المسموحة: صور وPDF" });
      }
      if (typeof size === 'number' && size > 10 * 1024 * 1024) {
        return res.status(400).json({ error: "حجم الملف يتجاوز 10 ميجابايت" });
      }
      const svc = new ObjectStorageService();
      const uploadURL = await svc.getObjectEntityUploadURL();
      const objectPath = svc.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath, metadata: { name, size, contentType } });
    } catch (e) {
      console.error("Author upload-url error:", e);
      res.status(500).json({ error: "فشل توليد رابط الرفع" });
    }
  });

  const slugifyAuthor = (name: string): string => {
    const base = name
      .trim()
      .toLowerCase()
      .replace(/[\s\u00A0]+/g, '-')
      .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return base || `author-${Date.now()}`;
  };

  // Rewrite private object paths to public author-image route
  const toPublicImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const m = url.match(/^\/objects\/uploads\/(.+)$/);
    if (m) return `/api/author-image/${m[1]}`;
    return url;
  };

  // Strip private fields (email, phone, credentials, review notes) before sending to public
  const toPublicAuthor = (a: any) => ({
    id: a.id,
    slug: a.slug,
    fullName: a.fullName,
    profileImageUrl: toPublicImageUrl(a.profileImageUrl),
    bio: a.bio,
    specialty: a.specialty,
    jobTitle: a.jobTitle,
    qualification: a.qualification,
    organization: a.organization,
    yearsExperience: a.yearsExperience,
    twitterUrl: a.twitterUrl,
    linkedinUrl: a.linkedinUrl,
    websiteUrl: a.websiteUrl,
    articleCount: a.articleCount,
    createdAt: a.createdAt,
  });

  // GET /api/authors — list approved authors (public)
  app.get('/api/authors', async (req, res) => {
    try {
      const result = await storage.getAuthors('approved');
      res.json(result.map(toPublicAuthor));
    } catch (e) {
      res.status(500).json({ message: "فشل جلب الكتّاب" });
    }
  });

  // GET /api/authors/:slug — public profile
  app.get('/api/authors/:slug', async (req, res) => {
    try {
      const author = await storage.getAuthorBySlug(req.params.slug);
      if (!author || author.status !== 'approved') {
        return res.status(404).json({ message: "الكاتب غير موجود" });
      }
      res.json(toPublicAuthor(author));
    } catch (e) {
      res.status(500).json({ message: "فشل جلب البيانات" });
    }
  });

  // POST /api/authors/register — public registration (rate-limited, status=pending)
  app.post('/api/authors/register', authorRegLimiter, async (req, res) => {
    try {
      const { insertAuthorSchema } = await import('@shared/schema');
      const parsed = insertAuthorSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: parsed.error.flatten() });
      }
      const data = parsed.data;
      const existing = await storage.getAuthorByEmail(data.email);
      if (existing) {
        return res.status(409).json({ message: "هذا البريد مسجّل مسبقاً" });
      }
      let slug = slugifyAuthor(data.fullName);
      let attempt = 0;
      while (await storage.getAuthorBySlug(slug)) {
        attempt++;
        slug = `${slugifyAuthor(data.fullName)}-${attempt}`;
        if (attempt > 20) break;
      }
      const created = await storage.createAuthor({ ...data, slug });
      res.status(201).json({ message: "تم استلام طلبك، سيتم مراجعته خلال 48 ساعة", author: { id: created.id, slug: created.slug } });
    } catch (e) {
      console.error("Author register error:", e);
      res.status(500).json({ message: "فشل التسجيل" });
    }
  });

  // ─── Admin endpoints ───
  app.get('/api/admin/authors', isAdminAuthenticated, async (req, res) => {
    try {
      const status = req.query.status as any;
      const result = await storage.getAuthors(status || undefined);
      res.json(result);
    } catch (e) {
      res.status(500).json({ message: "فشل الجلب" });
    }
  });

  app.post('/api/admin/authors', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { insertAuthorSchema } = await import('@shared/schema');
      const parsed = insertAuthorSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: parsed.error.flatten() });
      }
      const data = parsed.data;
      const existing = await storage.getAuthorByEmail(data.email);
      if (existing) {
        return res.status(409).json({ message: "هذا البريد مسجّل مسبقاً" });
      }
      let slug = slugifyAuthor(data.fullName);
      let attempt = 0;
      while (await storage.getAuthorBySlug(slug)) {
        attempt++;
        slug = `${slugifyAuthor(data.fullName)}-${attempt}`;
        if (attempt > 20) break;
      }
      const reviewer = req.session?.adminUsername || 'admin';
      const created = await storage.createAuthor({ ...data, slug });
      const approved = await storage.updateAuthorStatus(created.id, 'approved', reviewer, 'تمت الإضافة من قِبل الإدارة');
      res.status(201).json(approved || created);
    } catch (e) {
      console.error("Admin create author error:", e);
      res.status(500).json({ message: "فشل الإنشاء" });
    }
  });

  app.patch('/api/admin/authors/:id/status', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { status, reviewNotes } = req.body;
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "حالة غير صحيحة" });
      }
      const reviewer = req.session?.adminUsername || 'admin';
      const updated = await storage.updateAuthorStatus(req.params.id, status, reviewer, reviewNotes);
      if (!updated) return res.status(404).json({ message: "غير موجود" });
      res.json(updated);
    } catch (e) {
      res.status(500).json({ message: "فشل التحديث" });
    }
  });

  app.delete('/api/admin/authors/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const ok = await storage.deleteAuthor(req.params.id);
      if (!ok) return res.status(404).json({ message: "غير موجود" });
      res.json({ message: "تم الحذف" });
    } catch (e) {
      res.status(500).json({ message: "فشل الحذف" });
    }
  });

  // ==========================================

  const httpServer = createServer(app);

  return httpServer;
}
