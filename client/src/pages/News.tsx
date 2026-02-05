import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Search, Clock, ExternalLink } from "lucide-react";
import type { News } from "@shared/schema";
import newsImage1 from "@assets/stock_images/medical_health_healt_fdb22ee1.jpg";
import newsImage2 from "@assets/stock_images/medical_health_healt_2bc2bc37.jpg";
import newsImage3 from "@assets/stock_images/medical_health_healt_af440b4a.jpg";
import newsImage4 from "@assets/stock_images/medical_health_healt_981aee81.jpg";
import newsImage5 from "@assets/stock_images/medical_health_healt_8bccc8a3.jpg";
import newsImage6 from "@assets/stock_images/medical_health_healt_46b1b20f.jpg";

const newsImages = [newsImage1, newsImage2, newsImage3, newsImage4, newsImage5, newsImage6];

const categories = [
  { value: "", label: "جميع الأخبار" },
  { value: "health-news", label: "أخبار صحية" },
  { value: "saudi-health", label: "صحة السعودية" },
  { value: "health-community", label: "المجتمع الصحي" },
  { value: "health-reports", label: "تقارير صحية" },
  { value: "health-events", label: "فعاليات صحية" },
  { value: "quality-life", label: "جودة حياة" },
  { value: "nutrition", label: "تغذية" },
  { value: "misc", label: "منوعات" }
];

const categoryColors: Record<string, string> = {
  "health-news": "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  "saudi-health": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200",
  "health-community": "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  "health-reports": "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200",
  "health-events": "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200",
  "quality-life": "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200",
  "nutrition": "bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-200",
  "misc": "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200"
};

export default function News() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get category from URL on every location change
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromUrl = urlParams.get("category") || "";
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category") || "";
    setSelectedCategory(category);
  }, [location]);

  const { data: news, isLoading } = useQuery<News[]>({
    queryKey: selectedCategory 
      ? [`/api/news?category=${selectedCategory}`]
      : ["/api/news"],
  });

  const filteredNews = news?.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
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

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8" dir="rtl">
          <div className="flex items-center gap-3 mb-3">
            <Newspaper className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">كل الأخبار</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            آخر الأخبار والتطورات في المجال الطبي والصحي
          </p>
        </div>

        <div className="mb-8 space-y-4" dir="rtl">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث في الأخبار..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
              data-testid="input-search-news"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.value}
                variant={selectedCategory === category.value ? "default" : "outline"}
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => setSelectedCategory(category.value)}
                data-testid={`category-${category.value || 'all'}`}
              >
                {category.label}
              </Badge>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-32 w-full" />
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredNews && filteredNews.length > 0 ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {filteredNews.map((item, index) => (
              <Link key={item.id} href={item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`}>
                <Card 
                  className="hover-elevate cursor-pointer transition-all overflow-hidden h-full"
                  data-testid={`news-card-${item.id}`}
                >
                  <img 
                    src={item.imageUrl || newsImages[index % newsImages.length]} 
                    alt={item.title}
                    className="w-full h-32 md:h-36 object-cover"
                  />
                  <CardContent className="p-3" dir="rtl">
                    <Badge 
                      className={`${categoryColors[item.category] || ""} text-xs mb-2`}
                      data-testid={`badge-category-${item.category}`}
                    >
                      {getCategoryLabel(item.category)}
                    </Badge>
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.publishedAt)}
                      </div>
                      {item.sourceUrl && (
                        <span
                          className="text-primary flex items-center gap-1"
                          data-testid={`link-source-${item.id}`}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12" dir="rtl">
              <Newspaper className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                لا توجد أخبار متاحة حالياً
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
