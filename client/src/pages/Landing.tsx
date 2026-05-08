import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Star,
  Brain,
  AlertTriangle,
  Eye,
  Flame,
  Bot,
  Send,
  XCircle,
  CheckCircle,
  ShieldAlert
} from "lucide-react";
import { isAiGeneratedImage } from "@/components/AIImageBadge";
import { getNewsImage, getNewsFallbackImage, newsImages } from "@/lib/newsImages";
import AdBanner from "@/components/AdBanner";
import type { News, Article } from "@shared/schema";

interface PaginatedResponse {
  news: News[];
  total: number;
  page: number;
  totalPages: number;
}

const getVerdictFromTitle = (title: string) => {
  if (title.includes("❌")) return { label: "خرافة", icon: XCircle, chipClass: "bg-red-500/20 text-red-200 border border-red-400/30", iconColor: "text-red-300" };
  if (title.includes("✅")) return { label: "صحيح", icon: CheckCircle, chipClass: "bg-green-500/20 text-green-200 border border-green-400/30", iconColor: "text-green-300" };
  if (title.includes("⚠️")) return { label: "صحيح جزئياً", icon: AlertTriangle, chipClass: "bg-orange-500/20 text-orange-200 border border-orange-400/30", iconColor: "text-orange-300" };
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

const healthTips = [
  { icon: Heart, title: "صحة القلب", tip: "المشي 30 دقيقة يومياً يقلل خطر أمراض القلب بنسبة 30%" },
  { icon: Apple, title: "التغذية السليمة", tip: "تناول 5 حصص من الفواكه والخضروات يومياً لصحة أفضل" },
  { icon: TrendingUp, title: "النشاط البدني", tip: "التمارين المنتظمة تحسن المزاج وتقوي المناعة" }
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const { data: news, isLoading: newsLoading } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  const { data: articles, isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const { data: trendingNews } = useQuery<News[]>({
    queryKey: ["/api/news/trending"],
  });

  const { data: debunksData, isLoading: debunksLoading } = useQuery<PaginatedResponse>({
    queryKey: ["/api/news?page=1&perPage=6&category=debunk"],
  });

  const { data: hajjNewsRaw, isLoading: hajjLoading } = useQuery<News[]>({
    queryKey: ["/api/news/keyword/موسم الحج"],
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
  
  // Carousel state for featured news
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (featuredNewsList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % featuredNewsList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredNewsList.length]);
  
  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % featuredNewsList.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + featuredNewsList.length) % featuredNewsList.length);
  
  // Show all news in latest section (featured + non-featured)
  const latestNews = allNewsList.slice(0, 28);
  const latestArticles = articles?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden" dir="rtl">
      <div className="px-4 md:px-6 pt-6">
      <div className="container mx-auto max-w-7xl">
        <AdBanner position="above_featured" className="mb-4" />
        {newsLoading ? (
          <Skeleton className="h-[200px] md:h-[300px] w-full rounded-lg" />
        ) : featuredNewsList.length > 0 ? (
          <div className="relative" data-testid="featured-carousel">
            <div className="relative overflow-hidden rounded-xl">
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(${currentSlide * 100}%)` }}
              >
                {featuredNewsList.map((item, index) => (
                  <Link key={item.id} href={item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`} className="w-full flex-shrink-0">
                    <Card className={`overflow-hidden hover-elevate group cursor-pointer ${item.isBreaking ? "ring-2 ring-red-500 bg-red-50/60 dark:bg-red-950/20" : ""}`} data-testid={`card-featured-news-${index}`}>
                      <div className="grid md:grid-cols-2">
                        <div className="relative order-1 aspect-video md:aspect-auto md:h-full">
                          <img 
                            src={getNewsImage(item)} 
                            alt={item.title}
                            loading={index === 0 ? "eager" : "lazy"}
                            decoding={index === 0 ? "sync" : "async"}
                            fetchPriority={index === 0 ? "high" : "auto"}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          {item.isBreaking && (
                            <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold animate-pulse shadow-lg z-10">
                              <AlertTriangle className="h-4 w-4" />
                              خبر عاجل
                            </span>
                          )}
                        </div>
                        <div className="p-4 md:p-6 flex flex-col justify-center order-2 min-h-[300px] md:min-h-[400px]">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {item.isBreaking && (
                              <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 w-fit text-sm">
                                عاجل
                              </Badge>
                            )}
                            <Badge className={`${categoryColors[item.category] || ""} w-fit text-sm`}>
                              {categoryLabels[item.category] || item.category}
                            </Badge>
                            {isAiGeneratedImage(item.imageUrl) && (
                              <Brain className="h-4 w-4 text-sky-500" />
                            )}
                          </div>
                          <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold mb-3 transition-colors ${item.isBreaking ? "text-red-700 dark:text-red-400" : "group-hover:text-primary"}`}>
                            {item.title}
                          </h2>
                          <p className="text-sm md:text-base text-muted-foreground line-clamp-3 mb-4">
                            {item.summary}
                          </p>
                          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-3">
                            <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                            <span>{formatDate(item.publishedAt)}</span>
                            {item.source && (
                              <>
                                <span className="mx-2">|</span>
                                <span>{item.source}</span>
                              </>
                            )}
                          </div>
                          <Button variant="ghost" className="p-0 h-auto text-primary w-fit" data-testid="button-read-more-featured">
                            اقرأ المزيد <ArrowLeft className="h-4 w-4 mr-1" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
              
              {featuredNewsList.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-1/2 right-2 -translate-y-1/2 bg-background/80 backdrop-blur-sm z-10"
                    onClick={(e) => { e.preventDefault(); nextSlide(); }}
                    data-testid="button-carousel-next"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-1/2 left-2 -translate-y-1/2 bg-background/80 backdrop-blur-sm z-10"
                    onClick={(e) => { e.preventDefault(); prevSlide(); }}
                    data-testid="button-carousel-prev"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {featuredNewsList.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${index === currentSlide ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                        onClick={(e) => { e.preventDefault(); setCurrentSlide(index); }}
                        data-testid={`button-carousel-dot-${index}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}

        <AdBanner position="below_featured" className="mt-4" />
      </div>
      </div>

      {/* ── Hajj Block — ضيوف الرحمن ── */}
      {(hajjLoading || hajjNews.length > 0) && (
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
                        src={getNewsImage(item)}
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

      {/* ── Debunk Block — full width light green ── */}
      <section className="py-10 md:py-14 mt-6 bg-green-50 dark:bg-green-950/20 border-y border-green-100 dark:border-green-900/30" dir="rtl">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-8 items-center">

            {/* CTA column */}
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border border-green-300 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                <Bot className="h-3.5 w-3.5" />
                مدعوم بالذكاء الاصطناعي · AI-Powered
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 leading-tight mb-2">
                  تفنيد الشائعات الصحية
                  <span className="block text-primary">بالذكاء الاصطناعي</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
                  أرسل لنا ما سمعته ونحللها علمياً — ليردّ فريقنا الطبي بتفنيد موثق.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/ask-capsule">
                  <Button
                    size="lg"
                    className="gap-2 h-11 px-6 font-semibold"
                    data-testid="button-cta-submit-rumor"
                  >
                    <Send className="h-4 w-4" />
                    أرسل شائعة للتحقق منها
                  </Button>
                </Link>
                <Link href="/news?category=debunk">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 h-11 px-6 border-green-300 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                    data-testid="button-view-all-debunks"
                  >
                    عرض جميع الشائعات المُفنَّدة
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Cards column — titles only */}
            <div
              onMouseEnter={() => { isPaused.current = true; }}
              onMouseLeave={() => { isPaused.current = false; }}
              style={{ transition: "opacity 0.35s ease", opacity: visible ? 1 : 0 }}
              className="space-y-2"
            >
              {debunksLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg p-3 bg-white dark:bg-slate-800/50 border border-green-100 dark:border-green-900/40">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </>
              ) : latestDebunks.length > 0 ? (
                <>
                  {latestDebunks.map((item) => {
                    const verdict = getVerdictFromTitle(item.title);
                    const VerdictIcon = verdict?.icon;
                    const cleanTitle = getCleanDebunkTitle(item.title);
                    return (
                      <Link key={item.id} href={item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`}>
                        <div
                          className="rounded-lg p-3 bg-white dark:bg-slate-800/50 border border-green-100 dark:border-green-900/40 hover:border-green-300 hover:shadow-sm transition-all cursor-pointer"
                          data-testid={`debunk-card-${item.id}`}
                        >
                          <div className="flex items-center gap-2">
                            {verdict && VerdictIcon && (
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${verdict.chipClass}`}>
                                <VerdictIcon className={`h-3 w-3 ${verdict.iconColor}`} />
                                {verdict.label}
                              </span>
                            )}
                            <p className="text-slate-700 dark:text-slate-200 font-medium text-sm leading-snug line-clamp-1 flex-1">{cleanTitle}</p>
                            <ChevronLeft className="h-4 w-4 text-slate-400 shrink-0" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {totalSets > 1 && (
                    <div className="flex justify-center gap-2 pt-1" data-testid="debunk-dots">
                      {Array.from({ length: totalSets }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => { setVisible(false); setTimeout(() => { setCurrentSet(i); setVisible(true); }, 350); }}
                          className={`rounded-full transition-all ${i === currentSet ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-slate-300 dark:bg-slate-600"}`}
                          data-testid={`debunk-dot-${i}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-slate-400" data-testid="debunks-empty">
                  <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium text-sm">لا توجد شائعات مُفنَّدة بعد</p>
                  <p className="text-slate-400 text-xs mt-1">كن أول من يرسل شائعة للتحليل</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="px-4 md:px-6 pb-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              آخر الأخبار
            </h2>
            <Link href="/news">
              <Button variant="ghost" size="sm" data-testid="button-all-news">
                المزيد <ArrowLeft className="h-4 w-4 mr-1" />
              </Button>
            </Link>
          </div>
          {newsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[...Array(20)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : latestNews.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {latestNews.map((item, index) => (
                <Link key={item.id} href={item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`}>
                  <Card className={`hover-elevate overflow-hidden cursor-pointer h-full ${item.isBreaking ? "ring-2 ring-red-500 bg-red-50/60 dark:bg-red-950/20 shadow-red-100 dark:shadow-red-950/30" : ""}`} data-testid={`card-latest-news-${item.id}`}>
                    <div className="relative">
                      <img 
                        src={getNewsImage(item)} 
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-24 md:h-28 object-cover"
                      />
                      {item.isBreaking && (
                        <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold animate-pulse shadow-lg z-10">
                          <AlertTriangle className="h-3 w-3" />
                          عاجل
                        </span>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        {item.isBreaking && (
                          <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm">
                            عاجل
                          </Badge>
                        )}
                        <Badge className={`${categoryColors[item.category] || ""} text-sm`}>
                          {categoryLabels[item.category] || item.category}
                        </Badge>
                        {isAiGeneratedImage(item.imageUrl) && (
                          <Brain className="h-3.5 w-3.5 text-sky-500" />
                        )}
                      </div>
                      <h4 className={`font-semibold text-xs md:text-sm line-clamp-2 mb-1 ${item.isBreaking ? "text-red-700 dark:text-red-400" : ""}`}>
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.publishedAt)}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {/* ── WhatsApp Subscribe Banner ──────────────────────────── */}
        <Link href="/whatsapp">
          <div
            className="mt-8 rounded-xl overflow-hidden cursor-pointer bg-gradient-to-l from-green-700 via-emerald-700 to-teal-600 text-white p-5 md:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 hover:opacity-95 transition-opacity"
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
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold">ترند الأسبوع</h2>
                <p className="text-xs text-muted-foreground">أكثر الأخبار مشاهدة هذا الأسبوع</p>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {trendingNews.slice(0, 5).map((item) => (
                <Link key={item.id} href={item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`}>
                  <Card className="hover-elevate overflow-hidden cursor-pointer min-w-[220px] w-[220px] md:min-w-[240px] md:w-[240px] shrink-0 group" data-testid={`card-trending-${item.id}`}>
                    <div className="relative">
                      <img
                        src={getNewsImage(item)}
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
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-primary" />
              نصائح صحية
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {healthTips.map((tip, index) => (
              <Card key={index} className="bg-primary/5 dark:bg-primary/10 border-primary/20">
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              تقارير ومقالات
            </h2>
            <Link href="/articles">
              <Button variant="ghost" size="sm" data-testid="button-more-articles">
                المزيد <ArrowLeft className="h-4 w-4 mr-1" />
              </Button>
            </Link>
          </div>
          {articlesLoading ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : latestArticles.length > 0 ? (
            <div className="space-y-4">
              {latestArticles.map((article, index) => (
                <Card key={article.id} className="hover-elevate group overflow-hidden" data-testid={`card-article-${article.id}`}>
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-48 md:w-56 h-40 sm:h-auto flex-shrink-0">
                      <img 
                        src={getNewsFallbackImage(article.id.toString())}
                        alt={article.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {article.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{article.readTime} دقائق قراءة</span>
                      </div>
                      <h3 className="font-bold text-base md:text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {article.excerpt}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        مراجعة: {article.reviewedBy}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد مقالات حالياً</p>
            </Card>
          )}
        </div>

        {isAuthenticated ? (
          <div className="bg-gradient-to-l from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">خدماتك الصحية</h2>
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
          <div className="bg-gradient-to-l from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg p-6 md:p-8 text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-3">
              هل تريد متابعة صحتك بشكل أفضل؟
            </h2>
            <p className="text-muted-foreground mb-4 max-w-xl mx-auto">
              سجّل دخولك للوصول إلى المساعد الصحي الذكي، متتبع المؤشرات الحيوية، ومتتبع التغذية
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/register">
                <Button size="lg" data-testid="button-register-cta">
                  إنشاء حساب مجاناً
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" data-testid="button-login">
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
