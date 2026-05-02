import { MessageSquare, Apple, Activity, BookOpen, ArrowLeft, Sparkles, XCircle, CheckCircle, AlertTriangle, Clock, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Hero from "@/components/Hero";
import StatsCard from "@/components/StatsCard";
import ArticleCard from "@/components/ArticleCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getNewsImage } from "@/lib/newsImages";
import type { News as NewsType } from "@shared/schema";

interface PaginatedResponse {
  news: NewsType[];
  total: number;
  page: number;
  totalPages: number;
}

const getVerdictFromTitle = (title: string) => {
  if (title.includes("❌")) return { label: "خرافة", icon: XCircle, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", iconColor: "text-red-600 dark:text-red-400" };
  if (title.includes("✅")) return { label: "صحيح", icon: CheckCircle, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", iconColor: "text-green-600 dark:text-green-400" };
  if (title.includes("⚠️")) return { label: "صحيح جزئياً", icon: AlertTriangle, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", iconColor: "text-orange-600 dark:text-orange-400" };
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
    queryKey: ["/api/news?page=1&perPage=4&category=debunk"],
  });

  const latestDebunks = debunksData?.news || [];

  return (
    <div className="flex flex-col">
      <Hero />

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

      <section className="py-16 md:py-20 bg-violet-50/50 dark:bg-violet-950/10 border-y border-violet-100 dark:border-violet-900/30" dir="rtl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto mb-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-900/30 px-4 py-2 text-sm font-medium text-violet-700 dark:text-violet-300 mb-3">
                <ShieldAlert className="h-4 w-4" />
                تفنيد الشائعات الصحية
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">أحدث الشائعات المُفنَّدة</h2>
              <p className="text-muted-foreground mt-1">نكشف الحقيقة وراء الشائعات الصحية المنتشرة</p>
            </div>
            <Link href="/news?category=debunk">
              <Button variant="outline" className="gap-2 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/30" data-testid="button-view-all-debunks">
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {debunksLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-1/3 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : latestDebunks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {latestDebunks.map((item) => {
                const verdict = getVerdictFromTitle(item.title);
                const cleanTitle = getCleanDebunkTitle(item.title);
                const href = item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`;
                const VerdictIcon = verdict?.icon;
                return (
                  <Link key={item.id} href={href}>
                    <Card
                      className="hover-elevate cursor-pointer transition-all overflow-hidden h-full border-violet-100 dark:border-violet-900/30"
                      data-testid={`debunk-card-${item.id}`}
                    >
                      <div className="relative">
                        <img
                          src={getNewsImage(item)}
                          alt={cleanTitle}
                          loading="lazy"
                          decoding="async"
                          className="w-full aspect-video object-cover"
                        />
                        {verdict && (
                          <span
                            className={`absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold shadow-lg z-10 ${verdict.color}`}
                            data-testid={`badge-verdict-${item.id}`}
                          >
                            {VerdictIcon && <VerdictIcon className="h-3.5 w-3.5" />}
                            {verdict.label}
                          </span>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm line-clamp-3 mb-3 leading-relaxed">
                          {cleanTitle}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.publishedAt)}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground max-w-6xl mx-auto" data-testid="debunks-empty">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>لا توجد شائعات مفنَّدة بعد</p>
            </div>
          )}
        </div>
      </section>

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
