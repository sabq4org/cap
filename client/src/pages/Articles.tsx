import { useArticles, useCategories } from "@/hooks/use-articles";
import { ArticleCard } from "@/components/ArticleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Articles() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  
  // In a real app, search would be a server query param too. Here filtering client side for simplicity if dataset small, 
  // but better to pass to hook. The hook supports category filter.
  const { data: articles, isLoading: loadingArticles } = useArticles({ category: selectedCategory });
  const { data: categories } = useCategories();

  // Simple client-side search filtering
  const filteredArticles = articles?.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.summary?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-12 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Health News & Articles</h1>
          <p className="text-muted-foreground">Stay informed with the latest medical research and wellness tips.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search articles..." 
            className="pl-9 bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-10 pb-4 border-b">
        <Badge 
          variant={selectedCategory === undefined ? "default" : "outline"}
          className="cursor-pointer text-sm px-4 py-1.5 h-auto hover:bg-primary/90 hover:text-white transition-colors"
          onClick={() => setSelectedCategory(undefined)}
        >
          All Topics
        </Badge>
        {categories?.map(cat => (
          <Badge 
            key={cat.id}
            variant={selectedCategory === String(cat.id) ? "default" : "outline"}
            className="cursor-pointer text-sm px-4 py-1.5 h-auto hover:bg-primary/90 hover:text-white transition-colors"
            onClick={() => setSelectedCategory(String(cat.id))}
          >
            {cat.name}
          </Badge>
        ))}
      </div>

      {/* Grid */}
      {loadingArticles ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array(6).fill(0).map((_, i) => (
             <div key={i} className="space-y-4">
                <Skeleton className="h-56 w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
             </div>
          ))}
        </div>
      ) : filteredArticles?.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">No articles found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles?.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <ArticleCard article={article} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
