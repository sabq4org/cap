import { useState, useEffect } from "react";
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
  AlertTriangle
} from "lucide-react";
import { isAiGeneratedImage } from "@/components/AIImageBadge";
import { getNewsImage, getNewsFallbackImage, newsImages } from "@/lib/newsImages";
import type { News, Article } from "@shared/schema";

const categoryLabels: Record<string, string> = {
  "health": "صحة عامة",
  "health-news": "أخبار صحية",
  "saudi-health": "صحة السعودية",
  "health-community": "المجتمع الصحي",
  "health-reports": "تقارير صحية",
  "health-events": "فعاليات صحية",
  "quality-life": "جودة حياة",
  "nutrition": "تغذية",
  "misc": "منوعات"
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
    <div className="min-h-screen p-6 bg-background" dir="rtl">
      <div className="container mx-auto max-w-7xl">
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
                    <Card className={`overflow-hidden hover-elevate group cursor-pointer ${item.isBreaking ? "ring-2 ring-red-500" : ""}`} data-testid={`card-featured-news-${index}`}>
                      <div className="grid md:grid-cols-2">
                        <div className="relative order-1 aspect-video md:aspect-auto md:h-full">
                          <img 
                            src={getNewsImage(item)} 
                            alt={item.title}
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
                  <Card className={`hover-elevate overflow-hidden cursor-pointer h-full ${item.isBreaking ? "ring-2 ring-red-500 shadow-red-100 dark:shadow-red-950/30" : ""}`} data-testid={`card-latest-news-${item.id}`}>
                    <div className="relative">
                      <img 
                        src={getNewsImage(item)} 
                        alt={item.title}
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
  );
}
