import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Clock, ArrowLeft, Sparkles, TrendingUp } from "lucide-react";
import type { News as NewsType } from "@shared/schema";
import newsImage1 from "@assets/stock_images/medical_health_healt_fdb22ee1.jpg";
import newsImage2 from "@assets/stock_images/medical_health_healt_2bc2bc37.jpg";
import newsImage3 from "@assets/stock_images/medical_health_healt_af440b4a.jpg";
import newsImage4 from "@assets/stock_images/medical_health_healt_981aee81.jpg";
import newsImage5 from "@assets/stock_images/medical_health_healt_8bccc8a3.jpg";
import newsImage6 from "@assets/stock_images/medical_health_healt_46b1b20f.jpg";
import logoImage from "@assets/LOGO-L_1769253692563.png";

const fallbackImages = [newsImage1, newsImage2, newsImage3, newsImage4, newsImage5, newsImage6];

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
  "misc": "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200",
};

interface PaginatedResponse {
  news: NewsType[];
  total: number;
  page: number;
  totalPages: number;
}

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
  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["/api/news?page=1&perPage=20"],
  });

  const news = data?.news || [];
  const featuredNews = news.slice(0, 1)[0];
  const topNews = news.slice(1, 5);
  const restNews = news.slice(5);

  return (
    <div className="flex flex-col" dir="rtl">
      {isLoading ? (
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ) : news.length > 0 ? (
        <>
          <section className="container mx-auto px-4 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                <h2 className="text-xl font-bold">آخر الأخبار</h2>
              </div>
              <div className="flex-1 h-px bg-border" />
              <Link href="/news">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" data-testid="link-all-news">
                  عرض الكل
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {featuredNews && (
                <Link href={featuredNews.shortCode ? `/n/${featuredNews.shortCode}` : `/news/${featuredNews.id}`} className="lg:col-span-2">
                  <Card className="overflow-hidden hover-elevate cursor-pointer h-full group" data-testid={`featured-news-${featuredNews.id}`}>
                    <div className="relative aspect-[16/9]">
                      <img
                        src={featuredNews.imageUrl || fallbackImages[0]}
                        alt={featuredNews.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 p-6 text-white space-y-3">
                        <Badge className={`${categoryColors[featuredNews.category] || ""}`}>
                          {categoryLabels[featuredNews.category] || featuredNews.category}
                        </Badge>
                        <h2 className="text-2xl md:text-3xl font-bold leading-tight line-clamp-2">
                          {featuredNews.title}
                        </h2>
                        {featuredNews.summary && (
                          <p className="text-white/80 line-clamp-2 text-sm md:text-base">{featuredNews.summary}</p>
                        )}
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(featuredNews.publishedAt)}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              )}

              <div className="space-y-3">
                {topNews.map((item, index) => (
                  <Link key={item.id} href={item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`}>
                    <Card className="hover-elevate cursor-pointer overflow-hidden group" data-testid={`top-news-${item.id}`}>
                      <div className="flex gap-3 p-3">
                        <img
                          src={item.imageUrl || fallbackImages[(index + 1) % fallbackImages.length]}
                          alt={item.title}
                          className="w-24 h-20 md:w-28 md:h-24 object-cover rounded-lg flex-shrink-0 transition-transform group-hover:scale-105"
                        />
                        <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                          <div>
                            <Badge variant="outline" className="text-[10px] mb-1.5 px-1.5 py-0">
                              {categoryLabels[item.category] || item.category}
                            </Badge>
                            <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{item.title}</h3>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(item.publishedAt)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {restNews.length > 0 && (
            <section className="container mx-auto px-4 py-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 text-primary">
                  <Newspaper className="h-5 w-5" />
                  <h2 className="text-xl font-bold">المزيد من الأخبار</h2>
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {restNews.map((item, index) => (
                  <Link key={item.id} href={item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`}>
                    <Card className="hover-elevate cursor-pointer overflow-hidden h-full group" data-testid={`news-card-${item.id}`}>
                      <img
                        src={item.imageUrl || fallbackImages[(index + 5) % fallbackImages.length]}
                        alt={item.title}
                        className="w-full h-32 md:h-36 object-cover transition-transform group-hover:scale-105"
                      />
                      <CardContent className="p-3">
                        <Badge className={`${categoryColors[item.category] || ""} text-[10px] mb-2`}>
                          {categoryLabels[item.category] || item.category}
                        </Badge>
                        <h3 className="font-semibold text-sm line-clamp-2 mb-2">{item.title}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.publishedAt)}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link href="/news">
                  <Button size="lg" variant="outline" className="gap-2" data-testid="button-view-all-news">
                    عرض جميع الأخبار
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="container mx-auto px-4 py-16">
          <Card>
            <CardContent className="text-center py-16 space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Newspaper className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">مرحباً بك في كبسولة</h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                بوابتك الصحية الذكية باللغة العربية. سيتم نشر الأخبار الصحية قريباً.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>مدعوم بالذكاء الاصطناعي</span>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
