import express, { type Express, type Request } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { getCanonicalOrigin } from "./seo";
import { isNoindexPath } from "./utils/noindexPaths";
import { hasDirtySeoQuery } from "@shared/seoSignals";

const viteLogger = createLogger();

type SpaSeo = {
  title: string;
  description: string;
  canonical: string;
  noIndex: boolean;
  status: number;
};

const DEFAULT_DESCRIPTION = "كبسولة صحيفة صحية رقمية سعودية تقدم أخباراً طبية موثوقة، وتقارير صحية، وتغطية للمستجدات الصحية في السعودية والعالم.";

const PUBLIC_PAGE_SEO: Record<string, { title: string; description: string }> = {
  "/": {
    title: "كبسولة | صحيفة صحية رقمية",
    description: "آخر الأخبار الصحية، تفنيد الشائعات، مقالات طبية موثوقة، ونشرة واتساب يومية من كبسولة.",
  },
  "/news": {
    title: "الأخبار الصحية والطبية | كبسولة",
    description: "تابع أحدث الأخبار الصحية والطبية الموثوقة في السعودية والعالم من صحيفة كبسولة.",
  },
  "/articles": {
    title: "مقالات وتقارير صحية موثوقة | كبسولة",
    description: "مقالات وتقارير طبية وصحية عربية تساعدك على فهم صحتك واتخاذ قرارات أكثر وعياً.",
  },
  "/ask-capsule": {
    title: "اسأل كبسولة وتحقق من المعلومات الصحية",
    description: "أرسل سؤالك أو المعلومة الصحية المتداولة إلى فريق كبسولة للتحقق منها.",
  },
  "/drugs": {
    title: "دليل الأدوية | كبسولة",
    description: "معلومات عربية مبسطة عن الأدوية واستخداماتها وتنبيهاتها من كبسولة.",
  },
  "/authors": {
    title: "كتّاب ومراجعو كبسولة",
    description: "تعرّف على كتّاب ومراجعي المحتوى الصحي في صحيفة كبسولة.",
  },
  "/whatsapp": {
    title: "نشرة كبسولة الصحية على واتساب",
    description: "اشترك في نشرة كبسولة لتصلك أهم الأخبار والمعلومات الصحية الموثوقة عبر واتساب.",
  },
  "/podcast": {
    title: "بودكاست كبسولة الصحي",
    description: "استمع إلى حلقات بودكاست كبسولة حول الصحة والطب وجودة الحياة.",
  },
  "/about": {
    title: "عن صحيفة كبسولة الصحية",
    description: "تعرّف على رسالة كبسولة ومنهجها في تقديم محتوى صحي عربي موثوق وواضح.",
  },
  "/privacy": {
    title: "سياسة الخصوصية | كبسولة",
    description: "سياسة الخصوصية وحماية البيانات في منصة وصحيفة كبسولة.",
  },
  "/terms": {
    title: "الشروط والأحكام | كبسولة",
    description: "الشروط والأحكام المنظمة لاستخدام منصة وصحيفة كبسولة.",
  },
};

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizePathname(pathname: string): string {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "") || "/";
}

export function resolveSpaSeo(req: Pick<Request, "originalUrl">): SpaSeo {
  const origin = getCanonicalOrigin();
  const requested = new URL(req.originalUrl, origin);
  const pathname = normalizePathname(requested.pathname);
  let canonicalPath = pathname;
  let noIndex = false;
  let status = 200;
  let title = "كبسولة | صحيفة صحية رقمية";
  let description = DEFAULT_DESCRIPTION;

  if (hasDirtySeoQuery(Object.fromEntries(requested.searchParams.entries()))) {
    noIndex = true;
  }

  const staticSeo = PUBLIC_PAGE_SEO[pathname];
  if (staticSeo) {
    title = staticSeo.title;
    description = staticSeo.description;

    if (pathname === "/news") {
      const canonicalQuery = new URLSearchParams();
      const category = requested.searchParams.get("category")?.trim();
      const page = requested.searchParams.get("page")?.trim();
      const search = requested.searchParams.get("q")?.trim();
      if (category) canonicalQuery.set("category", category);
      if (page && /^\d+$/.test(page) && Number(page) > 1) canonicalQuery.set("page", page);
      if (canonicalQuery.size > 0) canonicalPath += `?${canonicalQuery.toString()}`;
      if (search) noIndex = true;
      if (category) {
        title = "أخبار صحية حسب التصنيف | كبسولة";
        description = "أحدث الأخبار والتغطيات الصحية الموثوقة ضمن التصنيف المختار في صحيفة كبسولة.";
      }
    }
  } else if (pathname.startsWith("/keyword/") && pathname.length > "/keyword/".length) {
    const encodedKeyword = pathname.slice("/keyword/".length);
    let keyword = encodedKeyword;
    try {
      keyword = decodeURIComponent(encodedKeyword);
    } catch {
      // Keep the encoded value for malformed requests; attribute escaping below
      // still guarantees safe HTML and avoids turning a bad URL into a 500.
    }
    title = `${keyword} - أخبار ومقالات صحية | كبسولة`;
    description = `أحدث الأخبار والمقالات الصحية المتعلقة بـ${keyword} في صحيفة كبسولة.`;
  } else if (pathname.startsWith("/authors/") && pathname !== "/authors/register") {
    title = "ملف الكاتب | كبسولة";
    description = "اقرأ أحدث المواد الصحية المنشورة للكاتب في صحيفة كبسولة.";
  } else if (/^\/(?:n|news|articles)\/[^/]+$/.test(pathname)) {
    // Existing detail pages are rendered with authoritative server metadata by
    // their routes before this SPA fallback. This branch serves human clients.
  } else if (isNoindexPath(pathname)) {
    noIndex = true;
    title = "كبسولة";
    description = DEFAULT_DESCRIPTION;
  } else {
    status = 404;
    noIndex = true;
    title = "الصفحة غير موجودة | كبسولة";
    description = "الصفحة المطلوبة غير موجودة على موقع كبسولة.";
  }

  const canonical = `${origin}${canonicalPath === "/" ? "/" : canonicalPath}`;
  return { title, description, canonical, noIndex, status };
}

export function renderSeoShell(template: string, req: Pick<Request, "originalUrl">): { html: string; status: number } {
  const seo = resolveSpaSeo(req);
  const title = escapeAttribute(seo.title);
  const description = escapeAttribute(seo.description);
  const canonical = escapeAttribute(seo.canonical);
  const robots = seo.noIndex
    ? "noindex, follow"
    : "index, follow, max-image-preview:large";

  // Remove the template's route-dependent tags regardless of attribute order
  // or react-helmet's data-rh marker, then inject one authoritative set. The
  // old exact-string replacements silently failed against data-rh="true",
  // leaving every SPA route canonicalized to the home page.
  const dynamicTagPatterns = [
    /<title\b[^>]*>[\s\S]*?<\/title>\s*/gi,
    /<meta\b(?=[^>]*\bname=["']description["'])[^>]*>\s*/gi,
    /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>\s*/gi,
    /<meta\b(?=[^>]*\bproperty=["']og:title["'])[^>]*>\s*/gi,
    /<meta\b(?=[^>]*\bproperty=["']og:description["'])[^>]*>\s*/gi,
    /<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*>\s*/gi,
    /<meta\b(?=[^>]*\bname=["']twitter:url["'])[^>]*>\s*/gi,
    /<meta\b(?=[^>]*\bname=["']twitter:title["'])[^>]*>\s*/gi,
    /<meta\b(?=[^>]*\bname=["']twitter:description["'])[^>]*>\s*/gi,
    /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>\s*/gi,
  ];

  let html = dynamicTagPatterns.reduce(
    (current, pattern) => current.replace(pattern, ""),
    template,
  );
  const dynamicHead = [
    `<title data-rh="true">${title}</title>`,
    `<meta name="description" content="${description}" data-rh="true" />`,
    `<meta name="robots" content="${robots}" data-rh="true" />`,
    `<link rel="canonical" href="${canonical}" data-rh="true" />`,
    `<meta property="og:title" content="${title}" data-rh="true" />`,
    `<meta property="og:description" content="${description}" data-rh="true" />`,
    `<meta property="og:url" content="${canonical}" data-rh="true" />`,
    `<meta name="twitter:url" content="${canonical}" data-rh="true" />`,
    `<meta name="twitter:title" content="${title}" data-rh="true" />`,
    `<meta name="twitter:description" content="${description}" data-rh="true" />`,
  ].map((tag) => `    ${tag}`).join("\n");
  html = html.replace("</head>", `${dynamicHead}\n  </head>`);

  return { html, status: seo.status };
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const transformed = await vite.transformIndexHtml(url, template);
      const page = renderSeoShell(transformed, req);
      res.status(page.status).set({ "Content-Type": "text/html" }).end(page.html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }
  const indexTemplate = fs.readFileSync(path.resolve(distPath, "index.html"), "utf-8");

  // Content-hashed assets (JS/CSS) are safe to cache forever; the app shell
  // (index.html) must NEVER be cached, otherwise returning visitors keep
  // loading an old bundle and never receive new frontend code after a deploy.
  app.use(
    express.static(distPath, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      },
    }),
  );

  // fall through to index.html if the file doesn't exist
  app.use("*", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const page = renderSeoShell(indexTemplate, req);
    res.status(page.status).type("html").send(page.html);
  });
}
