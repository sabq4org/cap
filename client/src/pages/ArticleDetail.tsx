import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Clock, CheckCircle, User, Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { Helmet } from "react-helmet-async";
import { articles as articlesTable } from "@shared/schema";

type Article = typeof articlesTable.$inferSelect;

export default function ArticleDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: ["/api/articles", slug],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-64 bg-muted rounded" />
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <SEO title="المقال غير متوفر" description="المقال المطلوب غير متوفر." noIndex />
        <Helmet>
          <meta name="robots" content="noindex, follow" />
        </Helmet>
        <h1 className="text-2xl font-bold mb-4">المقال غير متوفر</h1>
        <p className="text-muted-foreground mb-6">قد يكون المقال محذوفاً أو غير منشور بعد.</p>
        <Link href="/articles">
          <Button variant="outline" className="gap-2" data-testid="button-back-to-articles">
            <ArrowRight className="h-4 w-4" />
            العودة إلى المقالات
          </Button>
        </Link>
      </div>
    );
  }

  const publishedTime = article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined;
  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <>
      <SEO
        title={article.seoTitle || article.title}
        description={article.seoDescription || article.excerpt || ""}
        image={article.imageUrl || undefined}
        url={typeof window !== "undefined" ? `${window.location.origin}/articles/${article.slug}` : undefined}
        type="article"
        publishedTime={publishedTime}
        author={article.author || article.reviewedBy || undefined}
        keywords={(article.keywords && article.keywords.length > 0) ? article.keywords : (article.tags || [])}
      />
      <article className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="space-y-3">
            <Badge variant="secondary" data-testid="badge-article-category">{article.category}</Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight" data-testid="text-article-title">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-lg text-muted-foreground leading-relaxed" data-testid="text-article-excerpt">
                {article.excerpt}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
              {article.author && (
                <div className="flex items-center gap-2" data-testid="text-article-author">
                  <User className="h-4 w-4 text-primary" />
                  <span>{article.author}</span>
                </div>
              )}
              {article.reviewedBy && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>مراجعة: د. {article.reviewedBy}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{article.readTime} دقائق قراءة</span>
              </div>
              {formattedDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span data-testid="text-article-date">{formattedDate}</span>
                </div>
              )}
            </div>
          </div>

          {article.imageUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-xl border bg-muted">
              <img
                src={article.imageUrl}
                alt={article.imageAlt || article.title}
                className="h-full w-full object-cover"
                data-testid="img-article-featured"
              />
            </div>
          )}

          <div
            className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: article.content }}
            data-testid="article-content"
          />

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {article.tags.map((tag, idx) => (
                <Badge key={idx} variant="outline" data-testid={`badge-article-tag-${idx}`}>{tag}</Badge>
              ))}
            </div>
          )}

          {article.sources && article.sources.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-semibold">المصادر</h3>
              <ul className="list-disc list-inside space-y-1">
                {article.sources.map((s: any, idx: number) => (
                  <li key={idx}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-6">
            <Link href="/articles">
              <Button variant="outline" className="gap-2" data-testid="button-back-to-articles">
                <ArrowRight className="h-4 w-4" />
                العودة إلى المقالات
              </Button>
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
