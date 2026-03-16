import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Search, Clock, ExternalLink, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertTriangle } from "lucide-react";
import { AIImageBadge } from "@/components/AIImageBadge";
import type { News as NewsType } from "@shared/schema";
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

  const buildQueryKey = () => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("perPage", String(PER_PAGE));
    if (selectedCategory) params.set("category", selectedCategory);
    return `/api/news?${params.toString()}`;
  };

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: [buildQueryKey()],
  });

  const filteredNews = localSearch
    ? data?.news?.filter((item) =>
        item.title.toLowerCase().includes(localSearch.toLowerCase()) ||
        (item.summary?.toLowerCase().includes(localSearch.toLowerCase()) ?? false)
      )
    : data?.news;

  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    params.set("page", String(page));
    setLocation(`/news?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("page", "1");
    setLocation(`/news?${params.toString()}`);
  };

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

  const getPageNumbers = () => {
    const pages: (number | 'dots')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('dots');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('dots');
      pages.push(totalPages);
    }
    return pages;
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
            {total > 0 && <span className="text-sm me-2">({total} خبر)</span>}
          </p>
        </div>

        <div className="mb-8 space-y-4" dir="rtl">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث في الأخبار..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
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
                onClick={() => handleCategoryChange(category.value)}
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
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredNews && filteredNews.length > 0 ? (
          <>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {filteredNews.map((item, index) => (
                <Link key={item.id} href={item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`}>
                  <Card 
                    className={`hover-elevate cursor-pointer transition-all overflow-hidden h-full ${item.isBreaking ? "ring-2 ring-red-500 shadow-red-100 dark:shadow-red-950/30" : ""}`}
                    data-testid={`news-card-${item.id}`}
                  >
                    <div className="relative">
                      <img 
                        src={item.imageUrl || newsImages[index % newsImages.length]} 
                        alt={item.title}
                        className="w-full aspect-video object-cover"
                      />
                      <AIImageBadge imageUrl={item.imageUrl} size="sm" />
                      {item.isBreaking && (
                        <span className="absolute top-2 right-2 inline-flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold animate-pulse shadow-lg z-10">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          عاجل
                        </span>
                      )}
                    </div>
                    <CardContent className="p-3" dir="rtl">
                      <Badge 
                        className={`${item.isBreaking ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200" : categoryColors[item.category] || ""} text-sm mb-2`}
                        data-testid={`badge-category-${item.category}`}
                      >
                        {item.isBreaking ? "عاجل" : getCategoryLabel(item.category)}
                      </Badge>
                      <h3 className={`font-semibold text-sm line-clamp-2 mb-2 ${item.isBreaking ? "text-red-700 dark:text-red-400" : ""}`}>
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between gap-1 text-xs text-muted-foreground">
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

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-8" dir="rtl" data-testid="pagination">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateToPage(1)}
                  disabled={currentPage === 1}
                  data-testid="button-first-page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {getPageNumbers().map((p, i) =>
                  p === 'dots' ? (
                    <span key={`dots-${i}`} className="px-2 text-muted-foreground">...</span>
                  ) : (
                    <Button
                      key={p}
                      variant={currentPage === p ? "default" : "outline"}
                      size="icon"
                      onClick={() => navigateToPage(p)}
                      data-testid={`button-page-${p}`}
                    >
                      {p}
                    </Button>
                  )
                )}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  data-testid="button-last-page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>

                <span className="text-sm text-muted-foreground mr-3" data-testid="text-page-info">
                  صفحة {currentPage} من {totalPages}
                </span>
              </div>
            )}
          </>
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
