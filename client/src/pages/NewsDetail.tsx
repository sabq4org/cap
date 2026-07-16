import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import DOMPurify from "dompurify";
import { Helmet } from "react-helmet-async";
import { SiWhatsapp, SiX } from "react-icons/si";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  Copy,
  ExternalLink,
  Facebook,
  ImageIcon,
  Link2,
  Newspaper,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";
import AdBanner from "@/components/AdBanner";
import { AIImageBadge } from "@/components/AIImageBadge";
import { SEO } from "@/components/SEO";
import { buildMetaDescription, displayTitle, newsCanonicalPath, newsSharePath } from "@shared/seoSignals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getNewsFallbackImage, getNewsImage } from "@/lib/newsImages";
import type { News } from "@shared/schema";

const categoryLabels: Record<string, string> = {
  health: "صحة عامة",
  "health-news": "أخبار صحية",
  "saudi-health": "صحة السعودية",
  "health-community": "المجتمع الصحي",
  "health-reports": "تقارير صحية",
  "health-events": "فعاليات صحية",
  "quality-life": "جودة حياة",
  nutrition: "تغذية",
  debunk: "تفنيد",
  misc: "منوعات",
};

function formatDate(value: Date | string | null | undefined, compact = false): string {
  if (!value) return "وقت النشر غير متاح";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "وقت النشر غير متاح";

  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
    timeZone: "Asia/Riyadh",
    calendar: "gregory",
    year: compact ? undefined : "numeric",
    month: "long",
    day: "numeric",
    hour: compact ? undefined : "2-digit",
    minute: compact ? undefined : "2-digit",
  }).format(date);
}

function getReadTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return Math.max(1, Math.ceil(text.split(" ").filter(Boolean).length / 180));
}

function getNewsHref(item: News): string {
  return newsCanonicalPath(item);
}

export default function NewsDetail() {
  const [, idParams] = useRoute("/news/:id");
  const [, canonicalParams] = useRoute("/n/:shortCode/:slug");
  const [, shortCodeParams] = useRoute("/n/:shortCode");
  const newsId = idParams?.id || null;
  const shortCode = canonicalParams?.shortCode || shortCodeParams?.shortCode || null;
  const { toast } = useToast();
  const articleRef = useRef<HTMLElement | null>(null);
  const viewedRef = useRef<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const { data: news, isLoading } = useQuery<News>({
    queryKey: shortCode ? ["/api/n", shortCode] : ["/api/news", newsId],
    enabled: !!(newsId || shortCode),
  });

  const { data: relatedNews } = useQuery<News[]>({
    queryKey: ["/api/news", news?.id, "related"],
    queryFn: async () => {
      const response = await fetch(`/api/news/${news!.id}/related`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!news?.id,
  });

  const sanitizedContent = useMemo(() => {
    if (!news?.content) return "";
    return DOMPurify.sanitize(news.content, {
      ALLOWED_TAGS: [
        "p", "br", "strong", "em", "u", "s", "h1", "h2", "h3",
        "ul", "ol", "li", "blockquote", "a", "img", "hr", "code", "pre",
      ],
      ALLOWED_ATTR: ["href", "src", "alt", "class", "target", "rel", "style"],
      ALLOW_DATA_ATTR: false,
    });
  }, [news?.content]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setReadingProgress(0);
  }, [newsId, shortCode]);

  useEffect(() => {
    if (!news?.id || viewedRef.current === news.id) return;
    viewedRef.current = news.id;
    const params = new URLSearchParams(window.location.search);
    fetch(`/api/news/${news.id}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referrer: document.referrer || "",
        utmSource: params.get("utm_source") || "",
        utmMedium: params.get("utm_medium") || "",
        utmCampaign: params.get("utm_campaign") || "",
      }),
    }).catch(() => {});
  }, [news?.id]);

  useEffect(() => {
    const updateProgress = () => {
      const article = articleRef.current;
      if (!article) return;
      const start = article.offsetTop;
      const scrollable = Math.max(article.offsetHeight - window.innerHeight, 1);
      const next = ((window.scrollY - start) / scrollable) * 100;
      setReadingProgress(Math.min(100, Math.max(0, next)));
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [news?.id]);

  const getPublicOrigin = () => window.location.hostname === "localhost"
    ? window.location.origin
    : "https://capsulah.com";

  const getCanonicalUrl = () => {
    const origin = getPublicOrigin();
    return news
      ? `${origin}${newsCanonicalPath(news)}`
      : `${origin}/news/${newsId}`;
  };

  const getShareUrl = () => {
    const origin = getPublicOrigin();
    return news
      ? `${origin}${newsSharePath(news)}`
      : `${origin}/news/${newsId}`;
  };

  const copyShareLink = async () => {
    const shareUrl = getShareUrl();
    let didCopy = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        didCopy = true;
      }
    } catch {
      // Fall back below for older browsers and non-secure preview environments.
    }

    if (!didCopy) {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      didCopy = document.execCommand("copy");
      textarea.remove();
    }

    if (didCopy) {
      setCopied(true);
      toast({ title: "تم نسخ رابط الخبر", description: "يمكنك مشاركته الآن في أي تطبيق." });
      window.setTimeout(() => setCopied(false), 2200);
    } else {
      toast({ title: "تعذر نسخ الرابط", description: "حاول مرة أخرى.", variant: "destructive" });
    }
  };

  const shareOnSocial = (platform: "whatsapp" | "twitter" | "facebook") => {
    const shareUrl = getShareUrl();
    const title = news?.title || "";
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title}\n${shareUrl}`)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    };
    window.open(urls[platform], "_blank", "noopener,noreferrer,width=680,height=560");
  };

  const shareNatively = async () => {
    if (!news) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: news.title, text: news.summary || news.subtitle || "", url: getShareUrl() });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyShareLink();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/20 px-4 py-6" dir="rtl">
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-5 w-48" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="aspect-[16/9] w-full rounded-3xl" />
              <Skeleton className="h-52 w-full rounded-3xl" />
            </div>
            <Skeleton className="hidden h-96 rounded-2xl lg:block" />
          </div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-muted/20 px-4" dir="rtl">
        <SEO title="الخبر غير موجود" description="الخبر المطلوب غير متوفر." noIndex />
        <Helmet><meta name="robots" content="noindex, follow" /></Helmet>
        <Card className="w-full max-w-md border-0 p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Newspaper className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="mb-2 text-xl font-bold">الخبر غير موجود</h1>
          <p className="mb-6 text-sm text-muted-foreground">ربما تم نقل الخبر أو لم يعد متاحًا.</p>
          <Link href="/news">
            <Button data-testid="button-back-to-news">
              <ArrowRight className="ml-2 h-4 w-4" />
              تصفح آخر الأخبار
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const related = (relatedNews || []).slice(0, 5);
  const categoryLabel = categoryLabels[news.category] || news.category;
  const readTime = getReadTime(news.content);
  const seoTitle = displayTitle(news.seoTitle, news.title);
  const seoDescription = buildMetaDescription({
    seoDescription: news.seoDescription,
    summary: news.summary,
    title: news.title,
  });
  const seoImage = news.imageUrl || getNewsFallbackImage(news.id);
  const keywords = news.keywords || [];
  const updatedAt = news.updatedAt ? new Date(news.updatedAt).getTime() : 0;
  const publishedAt = news.publishedAt ? new Date(news.publishedAt).getTime() : 0;
  const wasUpdated = Number.isFinite(updatedAt) && Number.isFinite(publishedAt) && updatedAt > publishedAt + 5 * 60 * 1000;

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={seoImage}
        url={getCanonicalUrl()}
        type="article"
        publishedTime={news.publishedAt ? new Date(news.publishedAt).toISOString() : undefined}
        author={news.source || "كبسولة"}
        keywords={keywords as string[]}
      />

      <div
        className="fixed left-0 top-0 z-[70] h-1 bg-primary transition-[width] duration-150"
        style={{ width: `${readingProgress}%` }}
        aria-hidden="true"
      />

      <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_32rem)] px-4 py-5 md:py-8" dir="rtl">
        <div className="mx-auto max-w-6xl">
          <nav className="mb-6 flex items-center gap-1.5 overflow-hidden text-sm text-muted-foreground" aria-label="مسار الصفحة">
            <Link href="/" className="shrink-0 transition-colors hover:text-primary">الرئيسية</Link>
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <Link href="/news" className="shrink-0 transition-colors hover:text-primary">الأخبار</Link>
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="truncate text-foreground">{categoryLabel}</span>
          </nav>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-10">
            <article ref={articleRef} className="min-w-0" data-testid="news-article">
              <header className="mb-6 md:mb-8">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {news.isBreaking && (
                    <Badge className="gap-1.5 rounded-full border-0 bg-red-600 px-3 py-1.5 text-white shadow-sm hover:bg-red-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      عاجل
                    </Badge>
                  )}
                  <Link href={`/news?category=${encodeURIComponent(news.category)}`}>
                    <Badge variant="secondary" className="rounded-full px-3 py-1.5 text-primary hover:bg-primary/10">
                      {categoryLabel}
                    </Badge>
                  </Link>
                </div>

                <h1
                  className="max-w-4xl text-3xl font-black leading-[1.35] tracking-tight text-foreground md:text-4xl lg:text-[2.75rem]"
                  data-testid="text-news-title"
                >
                  {news.title}
                </h1>

                {news.subtitle && (
                  <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl" data-testid="text-news-subtitle">
                    {news.subtitle}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span data-testid="text-publish-date">{formatDate(news.publishedAt)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    {readTime} {readTime === 1 ? "دقيقة" : "دقائق"} قراءة
                  </span>
                </div>

                {wasUpdated && (
                  <p className="mt-2 text-xs text-muted-foreground">آخر تحديث: {formatDate(news.updatedAt)}</p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Button onClick={shareNatively} className="rounded-full" data-testid="button-share-native">
                    <Share2 className="ml-2 h-4 w-4" />
                    مشاركة الخبر
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full text-emerald-600"
                    onClick={() => shareOnSocial("whatsapp")}
                    aria-label="مشاركة عبر واتساب"
                    data-testid="button-share-whatsapp"
                  >
                    <SiWhatsapp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => shareOnSocial("twitter")}
                    aria-label="مشاركة عبر إكس"
                    data-testid="button-share-twitter"
                  >
                    <SiX className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full text-blue-600"
                    onClick={() => shareOnSocial("facebook")}
                    aria-label="مشاركة عبر فيسبوك"
                    data-testid="button-share-facebook"
                  >
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={copyShareLink}
                    aria-label="نسخ رابط الخبر"
                    data-testid="button-copy-link"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </header>

              <figure className="relative mb-7 overflow-hidden rounded-2xl bg-muted shadow-[0_18px_50px_-24px_hsl(var(--foreground)/0.35)] md:rounded-3xl">
                <img
                  src={getNewsImage(news, "hero")}
                  alt={news.imageAlt || news.title}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="aspect-[16/9] w-full object-cover"
                  data-testid="img-news-cover"
                />
                <AIImageBadge imageUrl={news.imageUrl} size="md" />
                {news.imageAlt && news.imageAlt !== news.title && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-12 text-sm text-white/90">
                    <span className="inline-flex items-center gap-2" data-testid="text-image-caption">
                      <ImageIcon className="h-4 w-4" />
                      {news.imageAlt}
                    </span>
                  </figcaption>
                )}
              </figure>

              {news.summary && (
                <section className="mb-7 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-5 md:p-6" data-testid="summary-box">
                  <div className="mb-3 flex items-center gap-2 text-primary">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <h2 className="font-bold">الخلاصة</h2>
                  </div>
                  <p className="text-base font-medium leading-8 text-foreground/90 md:text-lg" data-testid="text-news-summary">
                    {news.summary}
                  </p>
                </section>
              )}

              <section className="rounded-2xl border bg-card px-5 py-7 shadow-sm md:rounded-3xl md:px-9 md:py-10">
                <div
                  className="news-content"
                  data-testid="text-news-content"
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
              </section>

              {news.source && (
                <section className="mt-6 rounded-2xl border bg-muted/30 p-5" aria-label="مصدر الخبر">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                      <ExternalLink className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">المصدر</p>
                      {news.sourceUrl ? (
                        <a
                          href={news.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-1.5 font-bold text-primary hover:underline"
                          data-testid="link-source"
                        >
                          <span className="truncate">{news.source}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="font-bold" data-testid="text-source">{news.source}</span>
                      )}
                    </div>
                  </div>
                </section>
              )}

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm leading-6">المحتوى للتوعية والمعرفة، ولا يغني عن استشارة الطبيب أو المختص عند الحاجة.</p>
              </div>

              {keywords.length > 0 && (
                <section className="mt-7" data-testid="keywords-section">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Tag className="h-4 w-4 text-primary" />
                    مواضيع مرتبطة
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, index) => (
                      <Link key={`${keyword}-${index}`} href={`/keyword/${encodeURIComponent(keyword)}`}>
                        <Badge variant="secondary" className="rounded-full px-3 py-1.5 font-normal hover:bg-primary/10 hover:text-primary" data-testid={`badge-keyword-${index}`}>
                          {keyword}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-8 overflow-hidden rounded-2xl bg-foreground px-5 py-6 text-background md:flex md:items-center md:justify-between md:px-7">
                <div>
                  <h2 className="text-lg font-bold">هل وجدت الخبر مفيدًا؟</h2>
                  <p className="mt-1 text-sm text-background/70">شاركه مع من يهمه الموضوع.</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
                  <Button variant="secondary" className="rounded-full" onClick={() => shareOnSocial("whatsapp")} data-testid="button-share-whatsapp-bottom">
                    <SiWhatsapp className="ml-2 h-4 w-4 text-emerald-600" />
                    واتساب
                  </Button>
                  <Button variant="secondary" className="rounded-full" onClick={copyShareLink} data-testid="button-copy-link-bottom">
                    <Link2 className="ml-2 h-4 w-4" />
                    نسخ الرابط
                  </Button>
                </div>
              </section>
            </article>

            <aside className="space-y-5 lg:sticky lg:top-24" aria-label="محتوى جانبي">
              <AdBanner position="news_sidebar" />

              <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Newspaper className="h-5 w-5 text-primary" />
                    اقرأ أيضًا
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  {related.length > 0 ? (
                    <div className="divide-y">
                      {related.map((item) => (
                        <Link key={item.id} href={getNewsHref(item)}>
                          <div className="group flex gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted/60" data-testid={`card-related-${item.id}`}>
                            <img
                              src={getNewsImage(item, "thumb")}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="h-20 w-24 shrink-0 rounded-lg object-cover"
                            />
                            <div className="min-w-0 flex-1 py-0.5">
                              <h3 className="line-clamp-2 text-sm font-bold leading-6 transition-colors group-hover:text-primary">{item.title}</h3>
                              <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.publishedAt, true)}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-8 text-center">
                      <Newspaper className="mx-auto mb-2 h-7 w-7 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">لا توجد أخبار مرتبطة حاليًا</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-primary/15 bg-primary/[0.04]">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-primary" />
                    <h2 className="font-bold">شارك الخبر</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="bg-background text-emerald-600" onClick={() => shareOnSocial("whatsapp")} data-testid="button-share-whatsapp-sidebar">
                      <SiWhatsapp className="ml-2 h-4 w-4" />
                      واتساب
                    </Button>
                    <Button variant="outline" className="bg-background" onClick={() => shareOnSocial("twitter")} data-testid="button-share-twitter-sidebar">
                      <SiX className="ml-2 h-4 w-4" />
                      إكس
                    </Button>
                    <Button variant="outline" className="bg-background text-blue-600" onClick={() => shareOnSocial("facebook")} data-testid="button-share-facebook-sidebar">
                      <Facebook className="ml-2 h-4 w-4" />
                      فيسبوك
                    </Button>
                    <Button variant="outline" className="bg-background" onClick={copyShareLink} data-testid="button-copy-link-sidebar">
                      {copied ? <Check className="ml-2 h-4 w-4 text-emerald-600" /> : <Copy className="ml-2 h-4 w-4" />}
                      نسخ
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Link href="/news">
                <Button variant="ghost" className="w-full justify-between text-muted-foreground" data-testid="button-back">
                  <span className="inline-flex items-center"><ArrowRight className="ml-2 h-4 w-4" />جميع الأخبار</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
