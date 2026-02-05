import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter } from "lucide-react";
import ArticleCard from "@/components/ArticleCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { articles as articlesTable } from "@shared/schema";
import newsImage1 from "@assets/stock_images/medical_health_healt_fdb22ee1.jpg";
import newsImage2 from "@assets/stock_images/medical_health_healt_2bc2bc37.jpg";
import newsImage3 from "@assets/stock_images/medical_health_healt_af440b4a.jpg";
import newsImage4 from "@assets/stock_images/medical_health_healt_981aee81.jpg";
import newsImage5 from "@assets/stock_images/medical_health_healt_8bccc8a3.jpg";
import newsImage6 from "@assets/stock_images/medical_health_healt_46b1b20f.jpg";

const articleImages = [newsImage1, newsImage2, newsImage3, newsImage4, newsImage5, newsImage6];

type Article = typeof articlesTable.$inferSelect;

export default function Articles() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const categories = ["الكل", ...Array.from(new Set(articles.map(a => a.category)))];

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === "الكل" || article.category === selectedCategory;
    return matchesSearch && matchesCategory && article.status === "published";
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              مركز المحتوى الطبي
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              مقالات صحية شاملة مراجعة من أطباء معتمدين لمساعدتك على فهم صحتك بشكل أفضل
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في المقالات..."
                className="pr-10 h-12"
                data-testid="input-search-articles"
              />
            </div>
            <Button variant="outline" className="gap-2 h-12" data-testid="button-filter">
              <Filter className="h-4 w-4" />
              تصفية
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category || (category === "الكل" && !selectedCategory) ? "default" : "outline"}
                className="cursor-pointer hover-elevate"
                onClick={() => setSelectedCategory(category === "الكل" ? null : category)}
                data-testid={`category-${category}`}
              >
                {category}
              </Badge>
            ))}
          </div>

          {filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                {articles.length === 0 ? "لا توجد مقالات متاحة حالياً" : "لم يتم العثور على مقالات مطابقة لبحثك"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article, index) => (
                <ArticleCard
                  key={article.id}
                  title={article.title}
                  excerpt={article.excerpt || ""}
                  category={article.category}
                  readTime={article.readTime}
                  reviewedBy={article.reviewedBy}
                  imageUrl={articleImages[index % articleImages.length]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
