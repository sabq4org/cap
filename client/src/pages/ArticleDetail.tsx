import { useArticle } from "@/hooks/use-articles";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, Share2 } from "lucide-react";
import { format } from "date-fns";

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useArticle(slug || "");

  if (isLoading) {
    return (
      <div className="container py-12 px-4 max-w-3xl space-y-8">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !article) {
     return (
       <div className="container py-20 text-center">
         <h2 className="text-2xl font-bold mb-4">Article not found</h2>
         <Button asChild><Link href="/articles">Back to Articles</Link></Button>
       </div>
     );
  }

  return (
    <article className="min-h-screen pb-20">
      {/* Header Image */}
      <div className="w-full h-[40vh] md:h-[50vh] relative bg-muted">
        {article.imageUrl && (
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        <div className="absolute top-6 left-4 md:left-8">
           <Button variant="secondary" size="sm" className="backdrop-blur-md bg-white/80" asChild>
             <Link href="/articles"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
           </Button>
        </div>
      </div>

      <div className="container px-4 md:px-6 -mt-20 relative z-10">
        <div className="max-w-3xl mx-auto bg-card rounded-3xl p-6 md:p-12 shadow-xl border border-border">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
               {article.category?.name || "General"}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center">
              <CalendarDays className="mr-1.5 h-4 w-4" />
              {article.publishedAt ? format(new Date(article.publishedAt), 'MMMM d, yyyy') : 'Draft'}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-bold leading-tight mb-8 text-foreground">
            {article.title}
          </h1>

          <div className="prose prose-lg prose-blue max-w-none prose-headings:font-display prose-img:rounded-xl">
             {/* If this was rich text, we'd use a parser. Assuming plain text/markdown for now */}
             <div className="whitespace-pre-line text-muted-foreground leading-relaxed">
               {article.content}
             </div>
          </div>
          
          <div className="mt-12 pt-8 border-t flex justify-between items-center">
             <div className="text-sm text-muted-foreground">
               By <span className="font-semibold text-foreground">Capsulah Medical Team</span>
             </div>
             <Button variant="outline" size="sm">
               <Share2 className="mr-2 h-4 w-4" /> Share
             </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
