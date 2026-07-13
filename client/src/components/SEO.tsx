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
}

export function SEO({
  title = "كبسولة - بوابتك الصحية الذكية",
  description = "كبسولة - بوابتك الصحية الذكية. مساعد صحي عربي موثوق مع متتبع تغذية ولياقة، ملف صحي شخصي، ومركز محتوى طبي معتمد.",
  image = "/og-image.png",
  url,
  type = "website",
  publishedTime,
  author,
  keywords = []
}: SEOProps) {
  const fullTitle = title.includes("كبسولة") ? title : `${title} | كبسولة`;
  const currentUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const imageUrl = image.startsWith("http") ? image : `${typeof window !== "undefined" ? window.location.origin : ""}${image}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {currentUrl && <link rel="canonical" href={currentUrl} />}
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(", ")} />
      )}

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
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
}
