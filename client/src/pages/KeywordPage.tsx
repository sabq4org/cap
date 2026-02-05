import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, ArrowRight, Calendar, Newspaper } from "lucide-react";
import type { News } from "@shared/schema";
import newsImage1 from "@assets/stock_images/medical_health_healt_fdb22ee1.jpg";
import newsImage2 from "@assets/stock_images/medical_health_healt_2bc2bc37.jpg";
import newsImage3 from "@assets/stock_images/medical_health_healt_af440b4a.jpg";
import newsImage4 from "@assets/stock_images/medical_health_healt_981aee81.jpg";
import newsImage5 from "@assets/stock_images/medical_health_healt_8bccc8a3.jpg";
import newsImage6 from "@assets/stock_images/medical_health_healt_46b1b20f.jpg";

const newsImages = [newsImage1, newsImage2, newsImage3, newsImage4, newsImage5, newsImage6];

const categoryLabels: Record<string, string> = {
  medical: "أخبار طبية",
  health: "أخبار صحية",
  pharmaceutical: "أخبار الأدوية",
  conference: "مؤتمرات طبية",
  awareness: "أخبار توعوية",
  nutrition: "أخبار التغذية",
  saudi: "أخبار السعودية"
};

const categoryColors: Record<string, string> = {
  medical: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
  health: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  pharmaceutical: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  conference: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200",
  awareness: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
  nutrition: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200",
  saudi: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200"
};

function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  } catch {
    return "";
  }
}

export default function KeywordPage() {
  const [, params] = useRoute("/keyword/:keyword");
  const keyword = params?.keyword ? decodeURIComponent(params.keyword) : "";

  const { data: newsItems = [], isLoading } = useQuery<News[]>({
    queryKey: ["/api/news/keyword", keyword],
    queryFn: async () => {
      const response = await fetch(`/api/news/keyword/${encodeURIComponent(keyword)}`);
      if (!response.ok) throw new Error("Failed to fetch news");
      return response.json();
    },
    enabled: !!keyword
  });

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/news">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-to-news">
              <ArrowRight className="h-4 w-4 ml-1" />
              العودة للأخبار
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <Tag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الكلمة المفتاحية</p>
              <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-keyword-title">
                {keyword}
              </h1>
            </div>
          </div>
          
          <p className="text-muted-foreground mt-2" data-testid="text-news-count">
            {isLoading ? "جاري البحث..." : `${newsItems.length} خبر مرتبط بهذه الكلمة المفتاحية`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        ) : newsItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {newsItems.map((item, index) => (
              <Link key={item.id} href={`/news/${item.id}`}>
                <Card 
                  className="hover-elevate overflow-hidden cursor-pointer h-full" 
                  data-testid={`card-keyword-news-${item.id}`}
                >
                  <img 
                    src={item.imageUrl || newsImages[index % newsImages.length]} 
                    alt={item.title}
                    className="w-full h-24 md:h-28 object-cover"
                  />
                  <CardContent className="p-3">
                    <Badge className={`${categoryColors[item.category]} text-xs mb-2`}>
                      {categoryLabels[item.category]}
                    </Badge>
                    <h4 className="font-semibold text-xs md:text-sm line-clamp-2 mb-1">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.publishedAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
              <Newspaper className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">لا توجد أخبار</h3>
            <p className="text-muted-foreground mb-4">
              لم نجد أخبار مرتبطة بالكلمة المفتاحية "{keyword}"
            </p>
            <Link href="/news">
              <Button data-testid="button-browse-all-news">
                تصفح جميع الأخبار
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
