import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useRoute, useSearch } from "wouter";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Home,
  Newspaper,
  Tag,
} from "lucide-react";
import NewsGridCard from "@/components/NewsGridCard";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { News } from "@shared/schema";

const PER_PAGE = 24;

function decodeKeyword(value: string | undefined): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

function getPageNumbers(currentPage: number, totalPages: number): Array<number | "dots"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages: Array<number | "dots"> = [1];
  if (currentPage > 3) pages.push("dots");
  for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page += 1) {
    pages.push(page);
  }
  if (currentPage < totalPages - 2) pages.push("dots");
  pages.push(totalPages);
  return pages;
}

export default function KeywordPage() {
  const [, params] = useRoute("/keyword/:keyword");
  const [, setLocation] = useLocation();
  const search = useSearch();
  const keyword = decodeKeyword(params?.keyword);
  const requestedPage = Number.parseInt(new URLSearchParams(search).get("page") || "1", 10);
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const { data: newsItems = [], isLoading, isError } = useQuery<News[]>({
    queryKey: ["/api/news/keyword", keyword],
    queryFn: async () => {
      const response = await fetch(`/api/news/keyword/${encodeURIComponent(keyword)}`);
      if (!response.ok) throw new Error("Failed to fetch keyword news");
      return response.json();
    },
    enabled: !!keyword,
  });

  const totalPages = Math.max(1, Math.ceil(newsItems.length / PER_PAGE));
  const displayedPage = Math.min(currentPage, totalPages);
  const visibleItems = newsItems.slice((displayedPage - 1) * PER_PAGE, displayedPage * PER_PAGE);
  const canonicalPath = `/keyword/${encodeURIComponent(keyword)}`;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [keyword, displayedPage]);

  const navigateToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setLocation(nextPage === 1 ? canonicalPath : `${canonicalPath}?page=${nextPage}`);
  };

  const description = `آخر الأخبار والتغطيات الصحية المرتبطة بوسم ${keyword} على كبسولة.`;

  return (
    <div className="min-h-screen bg-muted/20" dir="rtl">
      <SEO
        title={`${keyword} | الأخبار والموضوعات المرتبطة`}
        description={description}
        url={`${window.location.origin}${canonicalPath}`}
        keywords={keyword ? [keyword] : []}
      />

      <div className="container mx-auto max-w-7xl px-4 py-6 md:py-8">
        <nav className="mb-5 flex items-center gap-1.5 overflow-hidden text-sm text-muted-foreground" aria-label="مسار الصفحة">
          <Link href="/" className="inline-flex shrink-0 items-center gap-1 transition-colors hover:text-primary">
            <Home className="h-3.5 w-3.5" />
            الرئيسية
          </Link>
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <Link href="/news" className="shrink-0 transition-colors hover:text-primary">الأخبار</Link>
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span className="truncate text-foreground">{keyword}</span>
        </nav>

        <section className="relative mb-8 overflow-hidden rounded-3xl border bg-card px-5 py-7 shadow-sm md:px-8 md:py-9">
          <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary md:h-14 md:w-14">
              <Tag className="h-6 w-6 md:h-7 md:w-7" />
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-sm font-medium text-primary">وسم صحي</p>
              <h1 className="break-words text-3xl font-black tracking-tight md:text-4xl" data-testid="text-keyword-title">
                {keyword}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground md:text-base" data-testid="text-news-count">
                {isLoading
                  ? "جاري تحميل الأخبار المرتبطة..."
                  : `${newsItems.length.toLocaleString("ar-SA-u-nu-latn")} خبر وموضوع مرتبط`}
              </p>
            </div>
          </div>
        </section>

        {!isLoading && !isError && newsItems.length > 0 && (
          <div className="mb-5 flex items-center gap-3">
            <span className="h-7 w-1.5 shrink-0 rounded-full bg-primary" />
            <h2 className="text-xl font-bold">أحدث الأخبار</h2>
            <div className="h-px flex-1 bg-border/70" />
            <span className="hidden text-sm text-muted-foreground sm:inline">
              صفحة {displayedPage.toLocaleString("ar-SA-u-nu-latn")} من {totalPages.toLocaleString("ar-SA-u-nu-latn")}
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border bg-card">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-3xl border bg-card px-5 py-16 text-center shadow-sm">
            <Newspaper className="mx-auto mb-4 h-11 w-11 text-muted-foreground/50" />
            <h2 className="mb-2 text-xl font-bold">تعذر تحميل الأخبار</h2>
            <p className="mb-5 text-sm text-muted-foreground">حدث خلل مؤقت أثناء جلب أخبار هذا الوسم.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>إعادة المحاولة</Button>
          </div>
        ) : newsItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {visibleItems.map((item) => <NewsGridCard key={item.id} item={item} />)}
            </div>

            {totalPages > 1 && (
              <nav className="mt-10 flex flex-wrap items-center justify-center gap-1" aria-label="صفحات نتائج الوسم" data-testid="keyword-pagination">
                <Button variant="outline" size="icon" className="rounded-lg" onClick={() => navigateToPage(1)} disabled={displayedPage === 1} aria-label="الصفحة الأولى">
                  <ChevronsRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-lg" onClick={() => navigateToPage(displayedPage - 1)} disabled={displayedPage === 1} aria-label="الصفحة السابقة">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {getPageNumbers(displayedPage, totalPages).map((page, index) => page === "dots" ? (
                  <span key={`dots-${index}`} className="px-2 text-sm text-muted-foreground">…</span>
                ) : (
                  <Button
                    key={page}
                    variant={displayedPage === page ? "default" : "outline"}
                    size="icon"
                    className="rounded-lg"
                    onClick={() => navigateToPage(page)}
                    aria-label={`الصفحة ${page}`}
                    aria-current={displayedPage === page ? "page" : undefined}
                  >
                    {page.toLocaleString("ar-SA-u-nu-latn")}
                  </Button>
                ))}
                <Button variant="outline" size="icon" className="rounded-lg" onClick={() => navigateToPage(displayedPage + 1)} disabled={displayedPage === totalPages} aria-label="الصفحة التالية">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-lg" onClick={() => navigateToPage(totalPages)} disabled={displayedPage === totalPages} aria-label="الصفحة الأخيرة">
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </nav>
            )}
          </>
        ) : (
          <div className="rounded-3xl border bg-card px-5 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Newspaper className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-bold">لا توجد أخبار مرتبطة</h2>
            <p className="mx-auto mb-6 max-w-md text-sm leading-6 text-muted-foreground">
              لم نجد أخبارًا مرتبطة بوسم «{keyword}» حاليًا. يمكنك تصفح أحدث الأخبار الصحية.
            </p>
            <Link href="/news">
              <Button data-testid="button-browse-all-news">
                <ArrowRight className="ml-2 h-4 w-4" />
                تصفح جميع الأخبار
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
