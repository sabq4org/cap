import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Newspaper, Search, Clock, ExternalLink,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  AlertTriangle, XCircle, CheckCircle, MessageCircle,
} from "lucide-react";
import { AIImageBadge } from "@/components/AIImageBadge";
import type { News as NewsType } from "@shared/schema";
import { getNewsImage } from "@/lib/newsImages";

const categories = [
  { value: "", label: "جميع الأخبار" },
  { value: "health-news", label: "أخبار صحية" },
  { value: "saudi-health", label: "صحة السعودية" },
  { value: "health-community", label: "المجتمع الصحي" },
  { value: "health-reports", label: "تقارير صحية" },
  { value: "health-events", label: "فعاليات صحية" },
  { value: "quality-life", label: "جودة حياة" },
  { value: "nutrition", label: "تغذية" },
  { value: "debunk", label: "تفنيد الشائعات" },
  { value: "misc", label: "منوعات" },
];

const categoryColors: Record<string, string> = {
  "health": "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  "health-news": "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  "saudi-health": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200",
  "health-community": "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  "health-reports": "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200",
  "health-events": "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200",
  "quality-life": "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200",
  "nutrition": "bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-200",
  "debunk": "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200",
  "misc": "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200",
};

const getVerdictFromTitle = (title: string) => {
  if (title.includes("❌")) return { label: "خرافة", icon: XCircle, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
  if (title.includes("✅")) return { label: "صحيح", icon: CheckCircle, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" };
  if (title.includes("⚠️")) return { label: "صحيح جزئياً", icon: AlertTriangle, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" };
  return null;
};

const getCleanDebunkTitle = (title: string) =>
  title.replace(/^تفنيد\s*\|\s*[❌✅⚠️]\s*/, "").trim();

const PER_PAGE = 28;

interface PaginatedResponse {
  news: NewsType[];
  total: number;
  page: number;
  totalPages: number;
}

export default function News() {
  const [, setLocation] = useLocation();
  const search = useSearch();

  const urlParams = new URLSearchParams(search);
  const currentPage = parseInt(urlParams.get("page") || "1", 10);
  const selectedCategory = urlParams.get("category") || "";
  const searchQuery = urlParams.get("q") || "";

  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(new URLSearchParams(search).get("q") || "");
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (localSearch) params.set("q", localSearch);
      params.set("page", "1");
      const newSearch = params.toString();
      const currentSearch = new URLSearchParams(search);
      if ((currentSearch.get("q") || "") !== localSearch) {
        setLocation(`/news?${newSearch}`);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const buildQueryKey = () => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("perPage", String(PER_PAGE));
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);
    return `/api/news?${params.toString()}`;
  };

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: [buildQueryKey()],
  });

  const filteredNews = data?.news || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    params.set("page", String(page));
    setLocation(`/news?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("page", "1");
    setLocation(`/news?${params.toString()}`);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("ar-EG-u-nu-latn", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "long",
      day: "numeric",
      calendar: "gregory",
    });
  };

  const getCategoryLabel = (category: string) =>
    categories.find((c) => c.value === category)?.label || category;

  const getPageNumbers = () => {
    const pages: (number | "dots")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("dots");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("dots");
      pages.push(totalPages);
    }
    return pages;
  };

  const heroItem = filteredNews[0];
  const sideItems = filteredNews.slice(1, 4);
  const gridItems = filteredNews.slice(4);

  const sectionTitle = selectedCategory
    ? getCategoryLabel(selectedCategory)
    : "أبرز الأخبار";

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 py-6">

        {/* ── Page header ── */}
        <div className="mb-6" dir="rtl">
          <div className="flex items-center gap-3 mb-1.5">
            <Newspaper className="w-7 h-7 text-primary shrink-0" />
            <h1 className="text-3xl font-bold tracking-tight">كل الأخبار</h1>
          </div>
          <p className="text-muted-foreground">
            آخر الأخبار والتطورات في المجال الطبي والصحي
            {total > 0 && (
              <span className="text-sm mr-1.5 text-muted-foreground/70">
                ({total} خبر)
              </span>
            )}
          </p>
        </div>

        {/* ── Search ── */}
        <div className="relative mb-4" dir="rtl">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ابحث في الأخبار..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pr-10 h-11 rounded-xl border-border/70"
            data-testid="input-search-news"
          />
        </div>

        {/* ── Category pills ── */}
        <div className="flex flex-wrap gap-2 mb-6" dir="rtl">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => handleCategoryChange(category.value)}
              data-testid={`category-${category.value || "all"}`}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                selectedCategory === category.value
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* ── WhatsApp Subscribe Widget ── */}
        <Link href="/whatsapp">
          <div
            className="mb-7 rounded-2xl bg-gradient-to-l from-green-700 via-emerald-700 to-teal-600 text-white px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:opacity-95 transition-opacity"
            data-testid="widget-whatsapp-subscribe"
            dir="rtl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">اشترك في كبسولة الصباح</p>
                <p className="text-xs text-white/80">نشرة صحية يومية على واتساب — مجاناً</p>
              </div>
            </div>
            <Button
              size="sm"
              className="shrink-0 bg-white text-green-700 hover:bg-green-50 font-semibold text-xs px-3"
              data-testid="button-whatsapp-subscribe-widget"
              asChild
            >
              <span>اشترك</span>
            </Button>
          </div>
        </Link>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="space-y-8">
            {/* Hero skeleton */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <Skeleton className="h-7 w-1.5 rounded-full" />
                <Skeleton className="h-5 w-40" />
                <div className="flex-1 h-px bg-border/40" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3">
                <Skeleton className="aspect-[16/10] rounded-2xl" />
                <div className="flex flex-col gap-2.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 p-2.5 rounded-xl border border-border/50">
                      <Skeleton className="w-24 h-[72px] rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Grid skeleton */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-border/50">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredNews.length > 0 ? (
          <>
            {/* ── Section header ── */}
            <div className="flex items-center gap-3 mb-5" dir="rtl">
              <span className="block w-1.5 h-7 bg-primary rounded-full shrink-0" />
              <h2 className="text-xl font-bold tracking-tight">{sectionTitle}</h2>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            {/* ── Hero + Side layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3 mb-8" dir="rtl">

              {/* Big hero card */}
              <Link href={heroItem.shortCode ? `/n/${heroItem.shortCode}` : `/news/${heroItem.id}`}>
                <div
                  className="relative rounded-2xl overflow-hidden cursor-pointer group"
                  style={{ aspectRatio: "16/10" }}
                  data-testid={`hero-card-${heroItem.id}`}
                >
                  <img
                    src={getNewsImage(heroItem, "hero")}
                    alt={heroItem.category === "debunk" ? getCleanDebunkTitle(heroItem.title) : heroItem.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-in-out"
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
                      <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold shadow-lg ${v.color}`}>
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
                      {heroItem.isBreaking ? "عاجل" : getCategoryLabel(heroItem.category)}
                    </Badge>
                    <h2 className="text-white font-bold text-xl md:text-2xl leading-snug line-clamp-3 drop-shadow-lg mb-2.5">
                      {heroItem.category === "debunk"
                        ? getCleanDebunkTitle(heroItem.title)
                        : heroItem.title}
                    </h2>
                    <div className="flex items-center gap-3 text-white/70 text-xs">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {formatDate(heroItem.publishedAt)}
                      </span>
                      {heroItem.sourceUrl && (
                        <span className="flex items-center gap-1 opacity-70">
                          <ExternalLink className="h-3 w-3" />
                          المصدر
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>

              {/* Side cards */}
              {sideItems.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  {sideItems.map((item) => {
                    const isDebunk = item.category === "debunk";
                    const verdict = isDebunk ? getVerdictFromTitle(item.title) : null;
                    const VerdictIcon = verdict?.icon;
                    const displayTitle = isDebunk ? getCleanDebunkTitle(item.title) : item.title;
                    const href = item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`;
                    return (
                      <Link key={item.id} href={href}>
                        <div
                          className="flex gap-3 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer group h-full"
                          data-testid={`side-card-${item.id}`}
                        >
                          <div className="relative shrink-0">
                            <img
                              src={getNewsImage(item, "thumb")}
                              alt={displayTitle}
                              className="w-24 h-[76px] object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                              loading="lazy"
                            />
                            {item.isBreaking && (
                              <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-bold px-1 py-0.5 rounded">
                                عاجل
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 py-0.5" dir="rtl">
                            {isDebunk && verdict ? (
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mb-1 ${verdict.color}`}
                                data-testid={`side-verdict-${item.id}`}
                              >
                                {VerdictIcon && <VerdictIcon className="h-2.5 w-2.5" />}
                                {verdict.label}
                              </span>
                            ) : (
                              <Badge
                                className={`${item.isBreaking ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200" : categoryColors[item.category] || ""} text-[10px] py-0 h-4 mb-1`}
                                data-testid={`side-badge-${item.id}`}
                              >
                                {item.isBreaking ? "عاجل" : getCategoryLabel(item.category)}
                              </Badge>
                            )}
                            <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                              {displayTitle}
                            </h3>
                            <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground">
                              <Clock className="h-2.5 w-2.5 shrink-0" />
                              {formatDate(item.publishedAt)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Remaining grid ── */}
            {gridItems.length > 0 && (
              <>
                <div className="flex items-center gap-3 mb-5" dir="rtl">
                  <span className="block w-1.5 h-7 bg-primary/50 rounded-full shrink-0" />
                  <h2 className="text-xl font-bold tracking-tight">المزيد من الأخبار</h2>
                  <div className="flex-1 h-px bg-border/60" />
                </div>

                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {gridItems.map((item) => {
                    const isDebunk = item.category === "debunk";
                    const verdict = isDebunk ? getVerdictFromTitle(item.title) : null;
                    const VerdictIcon = verdict?.icon;
                    const displayTitle = isDebunk ? getCleanDebunkTitle(item.title) : item.title;
                    return (
                      <Link key={item.id} href={item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`}>
                        <div
                          className={`rounded-xl overflow-hidden border cursor-pointer group transition-all hover:-translate-y-0.5 hover:shadow-md bg-card h-full flex flex-col ${item.isBreaking ? "border-red-400/60 shadow-red-100 dark:shadow-red-950/20" : "border-border/60"}`}
                          data-testid={`news-card-${item.id}`}
                        >
                          <div className="relative overflow-hidden">
                            <img
                              src={getNewsImage(item, "card")}
                              alt={displayTitle}
                              loading="lazy"
                              decoding="async"
                              className="w-full aspect-[4/3] object-cover group-hover:scale-[1.04] transition-transform duration-500"
                            />
                            <AIImageBadge imageUrl={item.imageUrl} size="sm" />
                            {item.isBreaking && (
                              <span className="absolute top-2 right-2 inline-flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded-full text-[11px] font-bold animate-pulse shadow-lg z-10">
                                <AlertTriangle className="h-3 w-3" />
                                عاجل
                              </span>
                            )}
                            {isDebunk && verdict && !item.isBreaking && (
                              <span
                                className={`absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shadow-lg z-10 ${verdict.color}`}
                                data-testid={`badge-verdict-${item.id}`}
                              >
                                {VerdictIcon && <VerdictIcon className="h-3 w-3" />}
                                {verdict.label}
                              </span>
                            )}
                          </div>
                          <div className="p-3 flex flex-col gap-1.5 flex-1" dir="rtl">
                            <Badge
                              className={`${item.isBreaking ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200" : categoryColors[item.category] || ""} text-[11px] w-fit`}
                              data-testid={`badge-category-${item.category}`}
                            >
                              {item.isBreaking ? "عاجل" : getCategoryLabel(item.category)}
                            </Badge>
                            <h3 className={`font-semibold text-sm leading-snug line-clamp-2 flex-1 ${item.isBreaking ? "text-red-700 dark:text-red-400" : "group-hover:text-primary transition-colors"}`}>
                              {displayTitle}
                            </h3>
                            <div className="flex items-center justify-between gap-1 text-[11px] text-muted-foreground mt-auto pt-1 border-t border-border/40">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 shrink-0" />
                                {formatDate(item.publishedAt)}
                              </div>
                              {item.sourceUrl && (
                                <ExternalLink className="w-3 h-3 text-primary/60 shrink-0" data-testid={`link-source-${item.id}`} />
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-10" dir="rtl" data-testid="pagination">
                <Button variant="outline" size="icon" className="rounded-lg" onClick={() => navigateToPage(1)} disabled={currentPage === 1} data-testid="button-first-page">
                  <ChevronsRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-lg" onClick={() => navigateToPage(currentPage - 1)} disabled={currentPage === 1} data-testid="button-prev-page">
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {getPageNumbers().map((p, i) =>
                  p === "dots" ? (
                    <span key={`dots-${i}`} className="px-2 text-muted-foreground text-sm">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={currentPage === p ? "default" : "outline"}
                      size="icon"
                      className="rounded-lg"
                      onClick={() => navigateToPage(p)}
                      data-testid={`button-page-${p}`}
                    >
                      {p}
                    </Button>
                  )
                )}

                <Button variant="outline" size="icon" className="rounded-lg" onClick={() => navigateToPage(currentPage + 1)} disabled={currentPage === totalPages} data-testid="button-next-page">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-lg" onClick={() => navigateToPage(totalPages)} disabled={currentPage === totalPages} data-testid="button-last-page">
                  <ChevronsLeft className="h-4 w-4" />
                </Button>

                <span className="text-sm text-muted-foreground mr-2" data-testid="text-page-info">
                  صفحة {currentPage} من {totalPages}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center" dir="rtl">
            <div className="rounded-full bg-muted p-6 mb-5">
              <Newspaper className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-xl font-semibold text-foreground mb-2">لا توجد أخبار متاحة</p>
            <p className="text-muted-foreground text-sm">
              {selectedCategory || searchQuery ? "جرّب تغيير الفلتر أو كلمة البحث" : "لا توجد أخبار حالياً، تفقّد لاحقاً"}
            </p>
            {(selectedCategory || searchQuery) && (
              <Button variant="outline" className="mt-4" onClick={() => setLocation("/news")}>
                إظهار جميع الأخبار
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
