import { MessageSquare, Apple, Activity, BookOpen, ArrowLeft, Sparkles, XCircle, CheckCircle, AlertTriangle, Clock, ShieldAlert, Bot, Send, ChevronLeft, MousePointerClick, ExternalLink, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import Hero from "@/components/Hero";
import StatsCard from "@/components/StatsCard";
import ArticleCard from "@/components/ArticleCard";
import { getNewsImage } from "@/lib/newsImages";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import type { News as NewsType } from "@shared/schema";

interface PaginatedResponse {
  news: NewsType[];
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

const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('ar-EG-u-nu-latn', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory'
  });
};

export default function Home() {
  const features = [
    {
      icon: MessageSquare,
      title: "المساعد الصحي الذكي",
      description: "احصل على إجابات فورية لأسئلتك الصحية مع استشهادات من مصادر طبية موثوقة",
      href: "/assistant",
    },
    {
      icon: Activity,
      title: "متتبع المؤشرات الصحية",
      description: "راقب ضغط الدم، سكر الدم، الوزن، وغيرها من المؤشرات الحيوية بسهولة",
      href: "/profile",
    },
    {
      icon: Apple,
      title: "مسجل التغذية الذكي",
      description: "سجل وجباتك واحصل على تحليل دقيق للسعرات والعناصر الغذائية",
      href: "/nutrition",
    },
    {
      icon: BookOpen,
      title: "مركز المحتوى الطبي",
      description: "مقالات صحية شاملة مراجعة من أطباء معتمدين وموثوقين",
      href: "/articles",
    },
  ];

  const { data: debunksData, isLoading: debunksLoading } = useQuery<PaginatedResponse>({
    queryKey: ["/api/news?page=1&perPage=6&category=debunk"],
  });

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

  const { data: latestNewsData, isLoading: latestNewsLoading } = useQuery<PaginatedResponse>({
    queryKey: ["/api/news?page=1&perPage=9"],
  });

  const latestNews = latestNewsData?.news || [];
  const heroNews = latestNews[0];
  const sideNews = latestNews.slice(1, 5);
  const extraNews = latestNews.slice(5, 9);

  const { data: ctaTotalData } = useQuery<{ total: number }>({
    queryKey: ["/api/rumors/cta/total"],
  });

  const ctaClickMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/rumors/cta"),
  });

  return (
    <div className="flex flex-col">
      <Hero />

      {/* ── آخر الأخبار الصحية ── */}
      <section className="py-10 md:py-14 border-b" dir="rtl">
        <div className="container mx-auto px-4">

          {/* Section header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="block w-1.5 h-8 bg-primary rounded-full shrink-0" />
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">آخر الأخبار الصحية</h2>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:text-primary/80 font-semibold" asChild>
              <Link href="/news">
                كل الأخبار
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {latestNewsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3 mb-5">
              <Skeleton className="aspect-[16/9] rounded-2xl" />
              <div className="flex flex-col gap-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3 p-2.5 rounded-xl border border-border/50">
                    <Skeleton className="w-24 h-[76px] rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : heroNews ? (
            <>
              {/* Hero + side layout */}
              <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3 mb-3">

                {/* Big hero card */}
                <Link href={heroNews.shortCode ? `/n/${heroNews.shortCode}` : `/news/${heroNews.id}`}>
                  <div
                    className="relative rounded-2xl overflow-hidden cursor-pointer group"
                    style={{ aspectRatio: "16/9" }}
                    data-testid={`home-hero-${heroNews.id}`}
                  >
                    <img
                      src={getNewsImage(heroNews, "hero")}
                      alt={heroNews.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-in-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
                    {heroNews.isBreaking && (
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        عاجل
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 left-0 p-5 md:p-6">
                      <h2 className="text-white font-bold text-xl md:text-2xl leading-snug line-clamp-3 drop-shadow-lg mb-2">
                        {heroNews.title.replace(/^تفنيد\s*\|\s*[❌✅⚠️]\s*/, "").trim()}
                      </h2>
                      <div className="flex items-center gap-3 text-white/70 text-xs">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {formatDate(heroNews.publishedAt)}
                        </span>
                        {heroNews.sourceUrl && (
                          <span className="flex items-center gap-1 opacity-70">
                            <ExternalLink className="h-3 w-3" />
                            المصدر
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>

                {/* 3 side cards */}
                {sideNews.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    {sideNews.map((item) => {
                      const cleanTitle = item.title.replace(/^تفنيد\s*\|\s*[❌✅⚠️]\s*/, "").trim();
                      return (
                        <Link key={item.id} href={item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`}>
                          <div
                            className="flex gap-3 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer group h-full"
                            data-testid={`home-side-${item.id}`}
                          >
                            <img
                              src={getNewsImage(item, "card")}
                              alt={cleanTitle}
                              loading="lazy"
                              className="w-24 h-[76px] object-cover rounded-lg shrink-0 group-hover:opacity-90 transition-opacity"
                            />
                            <div className="flex-1 min-w-0 py-0.5">
                              {item.isBreaking && (
                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-1.5 py-0.5 rounded text-[10px] font-bold mb-1">
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  عاجل
                                </span>
                              )}
                              <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                {cleanTitle}
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

              {/* Extra 3 items as horizontal strip */}
              {extraNews.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3">
                  {extraNews.map((item) => {
                    const cleanTitle = item.title.replace(/^تفنيد\s*\|\s*[❌✅⚠️]\s*/, "").trim();
                    return (
                      <Link key={item.id} href={item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`}>
                        <div
                          className="flex gap-2.5 p-2 rounded-xl border border-border/50 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer group"
                          data-testid={`home-extra-${item.id}`}
                        >
                          <img
                            src={getNewsImage(item, "card")}
                            alt={cleanTitle}
                            loading="lazy"
                            className="w-16 h-12 object-cover rounded-lg shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-xs leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                              {cleanTitle}
                            </h3>
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
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
            </>
          ) : null}
        </div>
      </section>

      {/* ── Debunk Block ── */}
      <section
        className="relative py-16 md:py-20 overflow-hidden"
        dir="rtl"
        style={{
          background: "linear-gradient(135deg, #1e1040 0%, #0f2d3d 50%, #162436 100%)",
        }}
      >
        {/* decorative glowing orbs */}
        <div className="pointer-events-none absolute -top-24 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} />
        <div className="pointer-events-none absolute bottom-0 left-10 w-72 h-72 rounded-full opacity-15 blur-3xl" style={{ background: "radial-gradient(circle, #0891b2, transparent 70%)" }} />

        <div className="relative container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">

            {/* Left column – CTA */}
            <div className="space-y-6 text-white">
              {/* AI badge */}
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold border border-violet-400/40 bg-violet-500/20 text-violet-200">
                <Bot className="h-3.5 w-3.5" />
                مدعوم بالذكاء الاصطناعي · AI-Powered
              </div>

              <div>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
                  تفنيد الشائعات
                  <span className="block text-violet-300">الصحية بالذكاء الاصطناعي</span>
                </h2>
                <p className="text-slate-300 text-lg leading-relaxed">
                  انشر الحقيقة، لا الشائعة — أرسل لنا ما سمعته ونحللها بالذكاء الاصطناعي ليردّ فريقنا الطبي بتفنيد علمي موثق.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/ask">
                  <Button
                    size="lg"
                    className="gap-2 bg-violet-600 hover:bg-violet-500 text-white border-0 h-12 px-6 font-semibold"
                    data-testid="button-cta-submit-rumor"
                    onClick={() => ctaClickMutation.mutate()}
                  >
                    <Send className="h-4 w-4" />
                    أرسل شائعة للتحقق منها
                  </Button>
                </Link>
                <Link href="/news?category=debunk">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="gap-2 text-slate-300 hover:text-white hover:bg-white/10 h-12 px-6"
                    data-testid="button-view-all-debunks"
                  >
                    عرض جميع الشائعات المُفنَّدة
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {(ctaTotalData?.total ?? 0) > 0 && (
                <div
                  className="inline-flex items-center gap-2 text-sm text-violet-300/80"
                  data-testid="text-debunk-cta-social-proof"
                >
                  <MousePointerClick className="h-3.5 w-3.5" />
                  {ctaTotalData!.total.toLocaleString("ar-SA-u-nu-latn")} شائعة مُرسلة حتى الآن
                </div>
              )}
            </div>

            {/* Right column – Debunk cards */}
            <div
              className="space-y-3"
              dir="rtl"
              onMouseEnter={() => { isPaused.current = true; }}
              onMouseLeave={() => { isPaused.current = false; }}
              style={{ transition: "opacity 0.35s ease", opacity: visible ? 1 : 0 }}
            >
              {debunksLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="rounded-xl p-4 border border-white/10 bg-white/5"
                    >
                      <Skeleton className="h-5 w-24 mb-3 bg-white/10" />
                      <Skeleton className="h-4 w-full mb-2 bg-white/10" />
                      <Skeleton className="h-3 w-1/3 bg-white/10" />
                    </div>
                  ))}
                </>
              ) : latestDebunks.length > 0 ? (
                <>
                  {latestDebunks.map((item) => {
                    const verdict = getVerdictFromTitle(item.title);
                    const cleanTitle = getCleanDebunkTitle(item.title);
                    const href = item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`;
                    const VerdictIcon = verdict?.icon;
                    return (
                      <Link key={item.id} href={href}>
                        <div
                          className="group rounded-xl p-4 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-violet-400/40 transition-all cursor-pointer"
                          data-testid={`debunk-card-${item.id}`}
                        >
                          <div className="flex items-start gap-3">
                            {/* verdict chip */}
                            {verdict && (
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 mt-0.5 ${verdict.chipClass}`}
                                data-testid={`badge-verdict-${item.id}`}
                              >
                                {VerdictIcon && <VerdictIcon className={`h-3 w-3 ${verdict.iconColor}`} />}
                                {verdict.label}
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-violet-200 transition-colors">
                                {cleanTitle}
                              </h3>
                              <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
                                <Clock className="h-3 w-3 shrink-0" />
                                {formatDate(item.publishedAt)}
                              </div>
                            </div>
                            <ChevronLeft className="h-4 w-4 text-slate-500 group-hover:text-violet-300 transition-colors shrink-0 mt-1" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </>
              ) : (
                <div
                  className="rounded-xl p-10 border border-white/10 bg-white/5 text-center"
                  data-testid="debunks-empty"
                >
                  <ShieldAlert className="h-10 w-10 mx-auto mb-3 text-violet-400 opacity-60" />
                  <p className="text-slate-300 font-medium mb-1">لا توجد شائعات مفنَّدة بعد</p>
                  <p className="text-slate-500 text-sm">كن أول من يرسل شائعة للتحليل</p>
                </div>
              )}

              {/* Dot indicators — only when there are multiple sets */}
              {allDebunks.length > CARDS_PER_PAGE && (
                <div className="flex justify-center gap-2 pt-1" data-testid="debunk-dots">
                  {Array.from({ length: totalSets }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setVisible(false);
                        setTimeout(() => { setCurrentSet(i); setVisible(true); }, 350);
                      }}
                      data-testid={`debunk-dot-${i}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSet ? "w-5 bg-violet-400" : "w-1.5 bg-white/25 hover:bg-white/50"}`}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── Why Capsule ── */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              لماذا كبسولة؟
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              كل ما تحتاجه لحياة صحية أفضل
            </h2>
            <p className="text-lg text-muted-foreground">
              منصة صحية متكاملة تجمع الذكاء الاصطناعي مع الخبرة الطبية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Link key={idx} href={feature.href}>
                  <Card className="h-full hover-elevate active-elevate-2 transition-all cursor-pointer group">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="rounded-full p-3 bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Latest Articles ── */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">أحدث المقالات الطبية</h2>
            <p className="text-lg text-muted-foreground">
              محتوى صحي موثوق مُراجع من أطباء معتمدين
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
            <ArticleCard
              title="فوائد التغذية المتوازنة للصحة العامة"
              excerpt="التغذية السليمة هي حجر الأساس للصحة الجيدة. تعرف على أهم العناصر الغذائية..."
              category="التغذية"
              readTime={5}
              reviewedBy="أحمد الشمري"
            />
            <ArticleCard
              title="كيفية التعامل مع ارتفاع ضغط الدم"
              excerpt="ارتفاع ضغط الدم حالة شائعة يمكن التحكم فيها. اكتشف الطرق الطبيعية والطبية..."
              category="أمراض مزمنة"
              readTime={7}
              reviewedBy="فاطمة العلي"
            />
            <ArticleCard
              title="أهمية النشاط البدني اليومي"
              excerpt="ممارسة الرياضة المنتظمة تحسن الصحة البدنية والنفسية. تعلم كيف تبدأ روتين..."
              category="اللياقة"
              readTime={6}
              reviewedBy="محمد الزهراني"
            />
          </div>

          <div className="text-center">
            <Link href="/articles">
              <Button size="lg" variant="outline" className="gap-2" data-testid="button-view-all-articles">
                عرض جميع المقالات
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 md:py-20 bg-primary/5 border-y">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              ابدأ رحلتك الصحية اليوم
            </h2>
            <p className="text-lg text-muted-foreground">
              انضم إلى آلاف المستخدمين الذين يثقون بكبسولة لإدارة صحتهم
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/assistant">
                <Button size="lg" className="gap-2 text-lg h-14" data-testid="button-cta-start">
                  <MessageSquare className="h-5 w-5" />
                  ابدأ الآن مجاناً
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-lg h-14"
                data-testid="button-cta-learn"
              >
                تعرف على المزيد
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
