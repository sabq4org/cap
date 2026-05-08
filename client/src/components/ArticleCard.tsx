import { Clock, ExternalLink, CheckCircle, User } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { ReactNode } from "react";

interface ArticleCardProps {
  slug?: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: number;
  reviewedBy: string;
  author?: string | null;
  imageUrl?: string;
  imageAlt?: string;
}

export default function ArticleCard({
  slug,
  title,
  excerpt,
  category,
  readTime,
  reviewedBy,
  author,
  imageUrl,
  imageAlt,
}: ArticleCardProps) {
  const testIdSuffix = slug || title;
  const inner: ReactNode = (
    <>
      {imageUrl && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={imageAlt || title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            data-testid={`img-article-${testIdSuffix}`}
          />
        </div>
      )}
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-xs">{readTime} دقائق</span>
          </div>
        </div>
        <h3 className="text-xl font-semibold leading-tight line-clamp-2" data-testid={`text-article-title-${testIdSuffix}`}>{title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed line-clamp-3">{excerpt}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-4 pt-4 border-t flex-wrap">
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          {author && (
            <div className="flex items-center gap-2" data-testid={`text-article-author-${testIdSuffix}`}>
              <User className="h-4 w-4 text-primary" />
              <span>{author}</span>
            </div>
          )}
          {reviewedBy && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>د. {reviewedBy}</span>
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" className="gap-2" data-testid="button-read-article">
          اقرأ المزيد
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardFooter>
    </>
  );

  return (
    <Card className="overflow-hidden hover-elevate transition-all group h-full" data-testid={`card-article-${testIdSuffix}`}>
      {slug ? (
        <Link href={`/articles/${slug}`} className="block h-full">
          {inner}
        </Link>
      ) : (
        <div className="block h-full">{inner}</div>
      )}
    </Card>
  );
}
