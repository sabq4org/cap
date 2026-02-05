import { Link } from "wouter";
import { type Article, type Category } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface ArticleCardProps {
  article: Article & { category?: Category };
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="group overflow-hidden border-border hover:shadow-lg hover:border-primary/20 transition-all duration-300 h-full flex flex-col">
      <div className="relative h-48 overflow-hidden bg-muted">
        {article.imageUrl ? (
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/30 text-secondary-foreground">
            <span className="font-display font-medium text-lg">No Image</span>
          </div>
        )}
        <div className="absolute top-4 left-4">
          <Badge className="bg-white/90 text-primary hover:bg-white shadow-sm backdrop-blur-sm">
            {article.category?.name || "General"}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <h3 className="font-display font-bold text-xl leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4">
        <p className="text-muted-foreground text-sm line-clamp-3">
          {article.summary || article.content.substring(0, 120) + "..."}
        </p>
      </CardContent>
      
      <CardFooter className="pt-0 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center">
          <CalendarDays className="mr-1.5 h-4 w-4" />
          {article.publishedAt ? format(new Date(article.publishedAt), 'MMM d, yyyy') : 'Draft'}
        </div>
        <Link href={`/articles/${article.slug}`} className="flex items-center font-medium text-primary hover:underline">
          Read More <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}
