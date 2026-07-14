import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  author?: string;
  keywords?: string[];
  noIndex?: boolean;
}

const SITE_ORIGIN = "https://capsulah.com";

function canonicalizeUrl(value?: string): string {
  try {
    const parsed = new URL(value || (typeof window !== "undefined" ? window.location.href : "/"), SITE_ORIGIN);
    const canonical = new URL(parsed.pathname || "/", SITE_ORIGIN);
    // Preserve only content-defining list parameters; tracking and search
    // queries must never create new canonical URLs.
    if (parsed.pathname === "/news") {
      const category = parsed.searchParams.get("category")?.trim();
      const page = parsed.searchParams.get("page")?.trim();
      if (category) canonical.searchParams.set("category", category);
      if (page && /^\d+$/.test(page) && Number(page) > 1) canonical.searchParams.set("page", page);
    }
    return canonical.toString();
  } catch {
    return `${SITE_ORIGIN}/`;
  }
}

export function SEO({
  title = "كبسولة - بوابتك الصحية الذكية",
  description = "كبسولة - بوابتك الصحية الذكية. مساعد صحي عربي موثوق مع متتبع تغذية ولياقة، ملف صحي شخصي، ومركز محتوى طبي معتمد.",
  image = "/og-image.png",
  url,
  type = "website",
  publishedTime,
  author,
  keywords = [],
  noIndex = false,
}: SEOProps) {
  const fullTitle = title.includes("كبسولة") ? title : `${title} | كبسولة`;
  const currentUrl = canonicalizeUrl(url);
  const imageUrl = image.startsWith("http") ? image : `${SITE_ORIGIN}${image.startsWith("/") ? image : `/${image}`}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(", ")} />}
      <meta name="robots" content={noIndex ? "noindex, follow" : "index, follow, max-image-preview:large"} />
      <link rel="canonical" href={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="كبسولة" />
      <meta property="og:locale" content="ar_SA" />

      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && author && (
        <meta property="article:author" content={author} />
      )}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@capsulah_sa" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
}
