import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { trackDebunkCta } from "@/lib/debunkCta";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Newspaper,
  BookOpen,
  TrendingUp,
  Heart,
  Apple,
  Lightbulb,
  ArrowLeft,
  Clock,
  ChevronLeft,
  Brain,
  AlertTriangle,
  Eye,
  Flame,
  Send,
  XCircle,
  CheckCircle,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { AIImageBadge, isAiGeneratedImage } from "@/components/AIImageBadge";
import { getNewsImage, getNewsFallbackImage } from "@/lib/newsImages";
import AdBanner from "@/components/AdBanner";
import { SEO } from "@/components/SEO";
import type { News, Article } from "@shared/schema";

interface PaginatedResponse {
  news: News[];
  total: number;
  page: number;
  totalPages: number;
}

const getVerdictFromTitle = (title: string) => {
  if (title.includes("❌")) return { label: "خرافة", icon: XCircle, chipClass: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/20 dark:text-red-200 dark:border-red-400/30", iconColor: "text-red-600 dark:text-red-300" };
  if (title.includes("✅")) return { label: "صحيح", icon: CheckCircle, chipClass: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-green-500/20 dark:text-green-200 dark:border-green-400/30", iconColor: "text-emerald-600 dark:text-green-300" };
  if (title.includes("⚠️")) return { label: "صحيح جزئياً", icon: AlertTriangle, chipClass: "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-400/30", iconColor: "text-amber-600 dark:text-orange-300" };
  return null;
};

const getCleanDebunkTitle = (title: string) => {
  return title.replace(/^تفنيد\s*\|\s*[❌✅⚠️]\s*/, "").trim();
};

const categoryLabels: Record<string, string> = {
  "health": "صحة عامة",
  "health-news": "أخبار صحية",
  "saudi-health": "صحة السعودية",
  "health-community": "المجتمع الصحي",
  "health-reports": "تقارير صحية",
  "health-events": "فعاليات صحية",
  "quality-life": "جودة حياة",
  "nutrition": "تغذية",
  "misc": "منوعات",
  "debunk": "تفنيد"
};

const categoryColors: Record<string, string> = {
  "health": "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  "health-news": "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  "saudi-health": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200",
  "health-community": "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  "health-reports": "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200",
  "health-events": "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200",
  "quality-life": "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200",
  "nutrition": "bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-200",
  "misc": "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200"
};

const quickCategories = [
  { slug: "saudi-health", label: "صحة السعودية" },
  { slug: "health-news", label: "أخبار صحية" },
  { slug: "nutrition", label: "تغذية" },
  { slug: "quality-life", label: "جودة حياة" },
  { slug: "debunk", label: "تفنيد" },
  { slug: "health-reports", label: "تقارير" },
];

const newsHref = (item: { id: string; shortCode?: string | null }) =>
  item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`;

const formatRelativeTime = (date: Date | string) => {
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return "";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} يوم`;
  return d.toLocaleDateString("ar-EG-u-nu-latn", {
    timeZone: "Asia/Riyadh",
    month: "short",
    day: "numeric",
    calendar: "gregory",
  });
};

const healthTips = [
  { icon: Heart, title: "صحة القلب", tip: "المشي 30 دقيقة يومياً يقلل خطر أمراض القلب بنسبة 30%" },
  { icon: Apple, title: "التغذية السليمة", tip: "تناول 5 حصص من الفواكه والخضروات يومياً لصحة أفضل" },
  { icon: TrendingUp, title: "النشاط البدني", tip: "التمارين المنتظمة تحسن المزاج وتقوي المناعة" }
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const { data: news, isLoading: newsLoading } = useQuery<News[]>({
    queryKey: ["/api/news?limit=30&fields=list"],
  });

  const { data: articles, isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles?limit=3"],
    enabled: !!news,
  });

  const { data: trendingNews } = useQuery<News[]>({
    queryKey: ["/api/news/trending?limit=8"],
    enabled: !!news,
  });

  const { data: debunksData, isLoading: debunksLoading } = useQuery<PaginatedResponse>({
    queryKey: ["/api/news?page=1&perPage=6&category=debunk"],
  });

  const { data: hajjNewsRaw, isLoading: hajjLoading } = useQuery<News[]>({
    queryKey: ["/api/news/keyword/موسم الحج"],
    enabled: false, // Hajj block is hidden — skip the network request entirely
  });
  const hajjNews = (hajjNewsRaw || []).slice(0, 8);

  const allDebunks = debunksData?.news || [];
  const CARDS_PER_PAGE = 3;
  const totalSets = Math.max(1, Math.ceil(allDebunks.length / CARDS_PER_PAGE));
  const [currentSet, setCurrentSet] = useState(0);
  const [visible, setVisible] = useState(true);
  const isPaused = useRef(false);

  useEffect(() => {
    if (allDebunks.length <= CARDS_PER_PAGE) return;
    let fadeTimeout: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      if (isPaused.current) return;
      setVisible(false);
      fadeTimeout = setTimeout(() => {
        setCurrentSet((prev) => (prev + 1) % totalSets);
        setVisible(true);
      }, 350);
    }, 4500);
    return () => {
      clearInterval(interval);
      if (fadeTimeout !== null) clearTimeout(fadeTimeout);
    };
  }, [allDebunks.length, totalSets]);

  const latestDebunks = allDebunks.slice(
    currentSet * CARDS_PER_PAGE,
    currentSet * CARDS_PER_PAGE + CARDS_PER_PAGE
  );

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ar-EG-u-nu-latn', { timeZone: 'Asia/Riyadh', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      calendar: 'gregory'
    });
  };

  const featuredNewsList = news?.filter(n => n.isFeatured).slice(0, 5) || [];
  // All news shown in the latest section (including featured ones)
  const allNewsList = news || [];

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Hero + side layout: featured first, then fill from latest (deduped)
  const heroCombined = (() => {
    const seen = new Set<string>();
    const out: News[] = [];
    for (const n of [...featuredNewsList, ...allNewsList]) {
      if (!seen.has(n.id)) { seen.add(n.id); out.push(n); }
      if (out.length >= 5) break;
    }
    return out;
  })();
  const heroItem = heroCombined[0];
  const heroSideItems = heroCombined.slice(1, 5);

  // Show all news in latest section (featured + non-featured)
  const latestNews = allNewsList.slice(0, 28);
  const latestArticles = articles?.slice(0, 3) || [];

  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "https://capsulah.com";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden" dir="rtl">
      <SEO
        title="كبسولة - بوابتك الصحية الذكية"
        description="آخر الأخبار الصحية، تفنيد الشائعات، مقالات طبية موثوقة، ونشرة واتساب يومية من كبسولة."
        url={siteOrigin + "/"}
        type="website"
      />
      <div className="px-4 md:px-6 pt-5 md:pt-6">
      <div className="container mx-auto max-w-7xl">
        <AdBanner position="above_featured" className="mb-4" />
        {newsLoading ? (
          <Skeleton className="h-[200px] md:h-[300px] w-full rounded-lg" />
        ) : heroItem ? (
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3" dir="rtl" data-testid="home-hero-layout">

            {/* Big hero card */}
            <Link href={newsHref(heroItem)} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
              <div
                className="relative rounded-2xl overflow-hidden cursor-pointer group shadow-md ring-1 ring-black/5 dark:ring-white/10"
                style={{ aspectRatio: "16/9" }}
                data-testid={`hero-card-${heroItem.id}`}
              >
                <img
                  src={getNewsImage(heroItem, "hero")}
                  alt={heroItem.category === "debunk" ? getCleanDebunkTitle(heroItem.title) : heroItem.title}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-in-out"
                  onError={(e) => { (e.target as HTMLImageElement).src = getNewsFallbackImage(heroItem.category || heroItem.id); }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/10" />

                {heroItem.isBreaking && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    عاجل
                  </div>
                )}

                {!heroItem.isBreaking && heroItem.category === "debunk" && (() => {
                  const v = getVerdictFromTitle(heroItem.title);
                  const VIcon = v?.icon;
                  return v ? (
                    <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold shadow-lg ${v.chipClass}`}>
                      {VIcon && <VIcon className="h-3.5 w-3.5" />}
                      {v.label}
                    </div>
                  ) : null;
                })()}

                <AIImageBadge imageUrl={heroItem.imageUrl} />

                <div className="absolute bottom-0 right-0 left-0 p-5 md:p-6">
                  <Badge
                    className={`${heroItem.isBreaking ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200" : categoryColors[heroItem.category] || ""} mb-2.5 text-xs font-semibold`}
                    data-testid={`hero-badge-category-${heroItem.id}`}
                  >
                    {heroItem.isBreaking ? "عاجل" : (categoryLabels[heroItem.category] || heroItem.category)}
                  </Badge>
                  <h2 className="text-white font-bold text-xl md:text-3xl leading-snug line-clamp-3 drop-shadow-lg mb-2">
                    {heroItem.category === "debunk"
                      ? getCleanDebunkTitle(heroItem.title)
                      : heroItem.title}
                  </h2>
                  {(heroItem.summary || heroItem.seoDescription) && (
                    <p className="hidden md:block text-white/80 text-sm leading-relaxed line-clamp-2 mb-3 max-w-2xl">
                      {heroItem.summary || heroItem.seoDescription}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-white/70 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(heroItem.publishedAt) || formatDate(heroItem.publishedAt)}
                    </span>
                    {heroItem.sourceUrl && (
                      <span className="flex items-center gap-1 opacity-70">
                        <ExternalLink className="h-3 w-3" />
                        المصدر
                      </span>
                    )}
                    <span className="ms-auto hidden sm:inline-flex items-center gap-1 text-white/90 text-xs font-medium group-hover:gap-2 transition-all">
                      اقرأ الخبر
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Side cards — scroll on mobile, stack on desktop */}
            {heroSideItems.length > 0 && (
              <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 -mx-1 px-1 snap-x snap-mandatory lg:snap-none scrollbar-thin">
                {heroSideItems.map((item) => {
                  const isDebunk = item.category === "debunk";
                  const verdict = isDebunk ? getVerdictFromTitle(item.title) : null;
                  const VerdictIcon = verdict?.icon;
                  const displayTitle = isDebunk ? getCleanDebunkTitle(item.title) : item.title;
                  return (
                    <Link key={item.id} href={newsHref(item)} className="min-w-[85%] sm:min-w-[70%] lg:min-w-0 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
                      <div
                        className="flex gap-3 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 hover:border-primary/25 hover:shadow-sm transition-all cursor-pointer group h-full"
                        data-testid={`side-card-${item.id}`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={getNewsImage(item, "thumb")}
                            alt={displayTitle}
                            className="w-28 h-[84px] lg:w-24 lg:h-[76px] object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                            loading="eager"
                            decoding="async"
                            onError={(e) => { (e.target as HTMLImageElement).src = getNewsFallbackImage(item.category || item.id); }}
                          />
                          {item.isBreaking && (
                            <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-bold px-1 py-0.5 rounded">
                              عاجل
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-0.5 flex flex-col" dir="rtl">
                          {isDebunk && verdict ? (
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mb-1 w-fit ${verdict.chipClass}`}
                              data-testid={`side-verdict-${item.id}`}
                            >
                              {VerdictIcon && <VerdictIcon className="h-2.5 w-2.5" />}
                              {verdict.label}
                            </span>
                          ) : (
                            <Badge
                              className={`${item.isBreaking ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200" : categoryColors[item.category] || ""} text-[10px] py-0 h-4 mb-1 w-fit`}
                              data-testid={`side-badge-${item.id}`}
                            >
                              {item.isBreaking ? "عاجل" : (categoryLabels[item.category] || item.category)}
                            </Badge>
                          )}
                          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors flex-1">
                            {displayTitle}
                          </h3>
                          <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5 shrink-0" />
                            {formatRelativeTime(item.publishedAt) || formatDate(item.publishedAt)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        <AdBanner position="below_featured" className="mt-4" />

        {/* Quick categories */}
        <nav className="mt-5 md:mt-6 -mx-1" aria-label="تصنيفات سريعة" data-testid="home-quick-categories">
          <div className="flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin">
            <Link href="/news">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-semibold shadow-sm hover:opacity-95 transition-opacity">
                <Newspaper className="h-3.5 w-3.5" />
                كل الأخبار
              </span>
            </Link>
            {quickCategories.map((cat) => (
              <Link key={cat.slug} href={`/news?category=${cat.slug}`}>
                <span className="inline-flex items-center whitespace-nowrap rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors">
                  {cat.label}
                </span>
              </Link>
            ))}
            <Link href="/ask-capsule">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 px-3.5 py-1.5 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors">
                <Send className="h-3.5 w-3.5" />
                أرسل شائعة
              </span>
            </Link>
          </div>
        </nav>
      </div>
      </div>
      <div className="h-5 md:h-7" />

      {/* ── Debunk Block ── */}
      <section className="relative border-y border-border/70 bg-muted/35 py-10 md:py-12" dir="rtl">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="relative max-w-2xl pr-4">
              <span
                aria-hidden
                className="absolute bottom-1 top-1 right-0 w-1 rounded-full bg-primary"
              />
              <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                <ShieldAlert className="h-3.5 w-3.5" />
                حقيقة أم خرافة؟
              </p>
              <h2 className="text-2xl font-bold leading-tight tracking-tight text-foreground md:text-[1.75rem]">
                تفنيد الشائعات الصحية
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground md:text-[15px]">
                شارك مع أهلك — قد تنقذ حياة
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/ask-capsule">
                <Button
                  size="sm"
                  className="h-9 gap-1.5 px-3.5"
                  data-testid="button-debunk-submit"
                  onClick={() => trackDebunkCta()}
                >
                  <Send className="h-3.5 w-3.5" />
                  أرسل شائعة
                </Button>
              </Link>
              <Link href="/news?category=debunk">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-3.5"
                  data-testid="button-debunk-view-all"
                >
                  عرض الكل
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          <div
            onMouseEnter={() => { isPaused.current = true; }}
            onMouseLeave={() => { isPaused.current = false; }}
            style={{ transition: "opacity 0.35s ease", opacity: visible ? 1 : 0 }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {debunksLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3 rounded-xl border bg-background p-5">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-3 border-t pt-3">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                ))}
              </>
            ) : latestDebunks.length > 0 ? (
              latestDebunks.map((item) => {
                const verdict = getVerdictFromTitle(item.title);
                const VerdictIcon = verdict?.icon;
                const cleanTitle = getCleanDebunkTitle(item.title);
                const itemUrl = `${siteOrigin}${newsHref(item)}`;
                const shareText = `${verdict?.label ? verdict.label + ": " : ""}${cleanTitle}`;
                const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText + "\n" + itemUrl)}`;
                const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(itemUrl)}`;
                const accent =
                  verdict?.label === "خرافة"
                    ? "border-r-red-500"
                    : verdict?.label === "صحيح"
                      ? "border-r-primary"
                      : verdict?.label === "صحيح جزئياً"
                        ? "border-r-amber-500"
                        : "border-r-border";
                return (
                  <article
                    key={item.id}
                    className={`flex flex-col overflow-hidden rounded-xl border border-border bg-background border-r-[3px] ${accent} transition-shadow hover:shadow-md`}
                    data-testid={`debunk-card-${item.id}`}
                  >
                    <Link
                      href={item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`}
                      className="flex flex-1 flex-col gap-3 p-4 md:p-5"
                    >
                      {verdict && VerdictIcon && (
                        <span className={`inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold ${verdict.chipClass}`}>
                          <VerdictIcon className={`h-3.5 w-3.5 ${verdict.iconColor}`} />
                          {verdict.label}
                        </span>
                      )}
                      <p className="line-clamp-3 text-[15px] font-semibold leading-snug text-foreground transition-colors hover:text-primary">
                        {cleanTitle}
                      </p>
                    </Link>

                    <div className="flex items-center gap-3 border-t border-border/80 bg-muted/20 px-4 py-2.5 md:px-5">
                      <span className="ml-auto text-xs text-muted-foreground">شارك</span>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-medium text-foreground/70 transition-colors hover:text-primary"
                        data-testid={`share-whatsapp-${item.id}`}
                        title="شارك عبر واتساب"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.136.558 4.136 1.535 5.873L.057 23.537a.5.5 0 0 0 .605.662l5.913-1.55A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.733 9.733 0 0 1-5.031-1.396l-.361-.214-3.735.978.997-3.645-.235-.374A9.709 9.709 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                        </svg>
                        واتساب
                      </a>
                      <a
                        href={twUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-medium text-foreground/70 transition-colors hover:text-sky-600"
                        data-testid={`share-twitter-${item.id}`}
                        title="شارك عبر تويتر"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        تويتر
                      </a>
                      <button
                        onClick={() => handleCopy(item.id, itemUrl)}
                        className="flex items-center gap-1 text-xs font-medium text-foreground/70 transition-colors hover:text-primary"
                        data-testid={`copy-link-${item.id}`}
                        title="نسخ الرابط"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-primary" />
                            <span className="text-primary">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            نسخ
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center" data-testid="debunks-empty">
                <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">لا توجد شائعات مُفنَّدة بعد</p>
                <p className="mt-1 text-xs text-muted-foreground">كن أول من يرسل شائعة للتحليل</p>
              </div>
            )}
          </div>

          {totalSets > 1 && (
            <div className="mt-5 flex justify-center gap-2" data-testid="debunk-dots">
              {Array.from({ length: totalSets }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setVisible(false);
                    setTimeout(() => {
                      setCurrentSet(i);
                      setVisible(true);
                    }, 350);
                  }}
                  className={`rounded-full transition-all ${i === currentSet ? "h-2 w-5 bg-primary" : "h-2 w-2 bg-border"}`}
                  data-testid={`debunk-dot-${i}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Latest News ── */}
      <div className="px-4 md:px-6 pb-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mt-6 md:mt-8">
          <div className="flex items-end justify-between gap-3 mb-5 md:mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 tracking-tight">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Newspaper className="h-5 w-5" />
                </span>
                آخر الأخبار
              </h2>
              <p className="text-xs text-muted-foreground mt-1 me-11">تحديث مستمر لأهم المستجدات الصحية</p>
            </div>
            <Link href="/news">
              <Button variant="outline" size="sm" className="shrink-0 gap-1 rounded-full" data-testid="button-all-news">
                المزيد <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {newsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[16/10] w-full rounded-xl" />
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>
              ))}
            </div>
          ) : latestNews.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {latestNews.map((item, index) => {
                const displayTitle = item.category === "debunk" ? getCleanDebunkTitle(item.title) : item.title;
                return (
                <Link key={item.id} href={newsHref(item)} className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
                  <article
                    className={`overflow-hidden h-full rounded-xl border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/25 ${item.isBreaking ? "border-red-400/60 ring-1 ring-red-500/30" : "border-border/70"}`}
                    data-testid={`card-latest-news-${item.id}`}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      <img
                        src={getNewsImage(item, "card")}
                        alt={displayTitle}
                        loading={index < 4 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={index < 2 ? "high" : "auto"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        onError={(e) => { (e.target as HTMLImageElement).src = getNewsFallbackImage(item.category); }}
                      />
                      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />
                      {item.isBreaking && (
                        <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 bg-red-600 text-white px-1.5 py-0.5 rounded-md text-[10px] font-bold shadow-lg z-10">
                          <AlertTriangle className="h-3 w-3" />
                          عاجل
                        </span>
                      )}
                      {isAiGeneratedImage(item.imageUrl) && (
                        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/55 text-white px-1.5 py-0.5 text-[10px]">
                          <Brain className="h-3 w-3 text-sky-300" />
                          ذكاء اصطناعي
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Badge className={`${item.isBreaking ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200" : categoryColors[item.category] || ""} text-[10px] py-0 h-5`}>
                          {item.isBreaking ? "عاجل" : (categoryLabels[item.category] || item.category)}
                        </Badge>
                      </div>
                      <h3 className={`font-semibold text-xs md:text-sm leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors ${item.isBreaking ? "text-red-700 dark:text-red-400" : ""}`}>
                        {displayTitle}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        {formatRelativeTime(item.publishedAt) || formatDate(item.publishedAt)}
                      </div>
                    </div>
                  </article>
                </Link>
              );
              })}
            </div>
          ) : null}
        </div>
      </div>
      </div>

      {/* ── Hajj Block — ضيوف الرحمن (مخفي حالياً) ── */}
      {false && (hajjLoading || hajjNews.length > 0) && (
      <section
        className="py-10 md:py-14 relative overflow-hidden"
        dir="rtl"
        style={{ background: "linear-gradient(160deg, #0d2a1a 0%, #1a3d28 35%, #0f2318 65%, #1b2f0e 100%)" }}
      >
        {/* Decorative geometric overlay */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M30 0l8.66 15H21.34L30 0zm0 60l-8.66-15h17.32L30 60zM0 30l15-8.66v17.32L0 30zm60 0l-15 8.66V21.34L60 30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        {/* Gold shimmer top border */}
        <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: "linear-gradient(90deg, transparent, #D4AF37, #F5D06B, #D4AF37, transparent)" }} />
        {/* Gold shimmer bottom border */}
        <div className="absolute bottom-0 inset-x-0 h-[3px]" style={{ background: "linear-gradient(90deg, transparent, #D4AF37, #F5D06B, #D4AF37, transparent)" }} />

        <div className="container mx-auto max-w-7xl px-4 md:px-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              {/* Crescent & star emblem */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-yellow-500/40 bg-yellow-500/10 text-2xl shrink-0">
                🕌
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-yellow-300" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", textShadow: "0 0 20px rgba(212,175,55,0.4)" }}>
                  ضيوف الرحمن
                </h2>
                <p className="text-yellow-200/60 text-sm mt-0.5">تغطية موسم الحج</p>
              </div>
            </div>
            <Link href="/keyword/موسم الحج">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/10 hover:text-yellow-200 bg-transparent"
                data-testid="button-hajj-view-all"
              >
                المزيد
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Cards grid */}
          {hajjLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl bg-white/10" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="hajj-grid">
              {hajjNews.map((item) => (
                <Link
                  key={item.id}
                  href={item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`}
                  data-testid={`card-hajj-${item.id}`}
                >
                  <div className="group rounded-xl overflow-hidden border border-yellow-500/20 bg-white/5 hover:bg-white/10 hover:border-yellow-400/40 transition-all duration-300 cursor-pointer h-full flex flex-col"
                    style={{ backdropFilter: "blur(4px)" }}>
                    {/* Image */}
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={getNewsImage(item, "card")}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).src = getNewsFallbackImage(item.category); }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                    {/* Title */}
                    <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                      <p className="text-sm font-semibold text-yellow-50 leading-snug line-clamp-3 group-hover:text-yellow-200 transition-colors">
                        {item.title}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      )}


      <div className="px-4 md:px-6 pb-6">
      <div className="container mx-auto max-w-7xl">
        {/* ── WhatsApp Subscribe Banner ──────────────────────────── */}
        <Link href="/whatsapp" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
          <div
            className="mt-8 rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-l from-green-700 via-emerald-700 to-teal-600 text-white p-5 md:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-900/10 hover:shadow-xl hover:brightness-[1.03] transition-all"
            data-testid="banner-whatsapp-subscribe"
          >
            <div className="flex items-center gap-4 text-right">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.558 4.136 1.535 5.873L.057 23.537a.5.5 0 0 0 .605.662l5.913-1.55A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.733 9.733 0 0 1-5.031-1.396l-.361-.214-3.735.978.997-3.645-.235-.374A9.709 9.709 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white/80 mb-1">كبسولة الصباح الصحية</p>
                <h3 className="text-xl md:text-2xl font-bold leading-snug">
                  اشترك في نشرتنا اليومية عبر واتساب
                </h3>
                <p className="text-sm text-white/80 mt-1 max-w-md">
                  ملخص صحي مختصر كل صباح — مجاناً ومخصص لاهتماماتك
                </p>
              </div>
            </div>
            <Button
              className="shrink-0 bg-white text-green-700 hover:bg-green-50 font-bold px-6 py-2.5 rounded-lg text-base shadow"
              data-testid="button-whatsapp-subscribe-banner"
              asChild
            >
              <span>اشترك الآن</span>
            </Button>
          </div>
        </Link>

        {/* ── ترند الأسبوع ──────────────────────────────────────── */}
        {trendingNews && trendingNews.length > 0 && (
          <div className="my-8 md:my-12">
            <div className="flex items-end justify-between gap-3 mb-5 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight">ترند الأسبوع</h2>
                  <p className="text-xs text-muted-foreground">الأكثر قراءة خلال الأيام الماضية</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {trendingNews.slice(0, 5).map((item) => (
                <Link key={item.id} href={newsHref(item)} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
                  <Card className="hover-elevate overflow-hidden cursor-pointer min-w-[220px] w-[220px] md:min-w-[240px] md:w-[240px] shrink-0 group" data-testid={`card-trending-${item.id}`}>
                    <div className="relative">
                      <img
                        src={getNewsImage(item, "card")}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-32 md:h-36 object-cover"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[11px] font-semibold">
                        <Eye className="h-3 w-3" />
                        {(item.viewCount || 0).toLocaleString('ar-SA-u-nu-latn')}
                      </div>
                      <Badge className={`absolute top-2 right-2 text-[10px] ${categoryColors[item.category] || ""}`}>
                        {categoryLabels[item.category] || item.category}
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-relaxed">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.publishedAt)}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="my-8 md:my-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 tracking-tight">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Lightbulb className="h-5 w-5" />
                </span>
                نصائح صحية
              </h2>
              <p className="text-xs text-muted-foreground mt-1 me-11">عادات بسيطة ليوم أصح</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {healthTips.map((tip, index) => (
              <Card key={index} className="bg-primary/5 dark:bg-primary/10 border-primary/20 hover:border-primary/40 hover:shadow-sm transition-all">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <tip.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{tip.title}</h4>
                      <p className="text-sm text-muted-foreground">{tip.tip}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="my-8 md:my-12">
          <div className="flex items-end justify-between gap-3 mb-5 md:mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 tracking-tight">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </span>
                تقارير ومقالات
              </h2>
              <p className="text-xs text-muted-foreground mt-1 me-11">محتوى طبي مراجع بعناية</p>
            </div>
            <Link href="/articles">
              <Button variant="outline" size="sm" className="shrink-0 gap-1 rounded-full" data-testid="button-more-articles">
                المزيد <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {articlesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-36 w-full rounded-xl" />
              ))}
            </div>
          ) : latestArticles.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {latestArticles.map((article) => (
                <Link key={article.id} href={`/articles/${article.slug}`} className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
                  <article
                    className="overflow-hidden rounded-xl border border-border/70 bg-card hover:border-primary/25 hover:shadow-md transition-all"
                    data-testid={`card-article-${article.id}`}
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-48 md:w-56 h-40 sm:h-auto sm:min-h-[140px] flex-shrink-0 overflow-hidden bg-muted">
                        <img
                          src={article.imageUrl || getNewsFallbackImage(article.category || article.id.toString())}
                          alt={article.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          onError={(e) => { (e.target as HTMLImageElement).src = getNewsFallbackImage(article.category || "health"); }}
                        />
                      </div>
                      <div className="flex-1 p-4 md:p-5 flex flex-col">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {categoryLabels[article.category] || article.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {article.readTime} دقائق قراءة
                          </span>
                        </div>
                        <h3 className="font-bold text-base md:text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>مراجعة: {article.reviewedBy}</span>
                          <span className="inline-flex items-center gap-1 text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            اقرأ المقال <ArrowLeft className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-10 text-center bg-muted/20">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-60" />
              <p className="text-muted-foreground text-sm">لا توجد مقالات حالياً</p>
            </div>
          )}
        </div>

        {isAuthenticated ? (
          <div className="bg-gradient-to-l from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-2xl border border-primary/15 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-center tracking-tight">خدماتك الصحية</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/assistant">
                <Button variant="outline" className="w-full h-16 flex flex-col gap-1 text-sm" data-testid="button-quick-assistant">
                  <Heart className="h-5 w-5 text-primary" />
                  المساعد الصحي
                </Button>
              </Link>
              <Link href="/nutrition">
                <Button variant="outline" className="w-full h-16 flex flex-col gap-1 text-sm" data-testid="button-quick-nutrition">
                  <Apple className="h-5 w-5 text-primary" />
                  متتبع التغذية
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" className="w-full h-16 flex flex-col gap-1 text-sm" data-testid="button-quick-profile">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  ملفي الصحي
                </Button>
              </Link>
              <Link href="/articles">
                <Button variant="outline" className="w-full h-16 flex flex-col gap-1 text-sm" data-testid="button-quick-articles">
                  <BookOpen className="h-5 w-5 text-primary" />
                  المقالات
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-l from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-2xl border border-primary/15 p-6 md:p-10 text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-3 tracking-tight">
              هل تريد متابعة صحتك بشكل أفضل؟
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              سجّل مجاناً للوصول إلى المساعد الصحي الذكي، متتبع التغذية، وملفك الصحي الشخصي
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto rounded-full px-8" data-testid="button-register-cta">
                  إنشاء حساب مجاناً
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-8" data-testid="button-login">
                  تسجيل الدخول
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
