import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Newspaper, Clock, ExternalLink, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, AlertTriangle, Pencil, Check, Pill,
  BookOpen, Lock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AIImageBadge } from "@/components/AIImageBadge";
import { getNewsImage } from "@/lib/newsImages";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Category, News as NewsType, Article as ArticleType } from "@shared/schema";

const categoryColors: Record<string, string> = {
  "health-news":      "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  "saudi-health":     "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200",
  "health-community": "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  "health-reports":   "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200",
  "health-events":    "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200",
  "quality-life":     "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200",
  "nutrition":        "bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-200",
  "misc":             "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200",
};

const PER_PAGE = 20;

type FeedItem =
  | { type: "news"; item: NewsType }
  | { type: "article"; item: ArticleType };

interface FeedResponse {
  items: FeedItem[];
  total: number;
  page: number;
  totalPages: number;
}

interface InterestsResponse {
  interests: string[];
}

// ── Interests Selector ────────────────────────────────────────────────────────

function InterestsSelector({
  categories,
  current,
  onSave,
  isSaving,
  isOnboarding = false,
}: {
  categories: Category[];
  current: string[];
  onSave: (selected: string[]) => void;
  isSaving: boolean;
  isOnboarding?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(current);

  const toggle = (value: string) => {
    setSelected(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  return (
    <div dir="rtl" className="space-y-6">
      {isOnboarding && (
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Pill className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold">اختر اهتماماتك الصحية</h2>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">
            اختر الموضوعات التي تهمك لنعرض لك الأخبار والمقالات الأكثر صلة بك يومياً
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categories.map(cat => {
          const isSelected = selected.includes(cat.slug);
          return (
            <button
              key={cat.slug}
              onClick={() => toggle(cat.slug)}
              data-testid={`interest-${cat.slug}`}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover-elevate
                ${isSelected
                  ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                  : "border-border bg-muted/40 hover:border-primary/40"
                }`}
            >
              {isSelected && (
                <span className="absolute top-2 left-2 rounded-full bg-primary p-0.5">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </span>
              )}
              <div className={`p-2 rounded-full bg-background shadow-sm text-${cat.color}`}>
                <Newspaper className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-center">{cat.nameAr}</span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={() => onSave(selected)}
          disabled={isSaving || selected.length === 0}
          data-testid="button-save-interests"
          size="lg"
          className="gap-2 px-8"
        >
          <Check className="h-5 w-5" />
          {isSaving ? "جاري الحفظ..." : "حفظ الاهتمامات"}
          {selected.length > 0 && <Badge variant="secondary">{selected.length}</Badge>}
        </Button>
      </div>
    </div>
  );
}

// ── Card for a news item ──────────────────────────────────────────────────────

function NewsCard({
  item,
  getCategoryLabel,
}: {
  item: NewsType;
  getCategoryLabel: (cat: string) => string;
}) {
  const formatDate = (date: Date | string | null) =>
    date
      ? new Date(date).toLocaleDateString("ar-EG-u-nu-latn", {
          timeZone: "Asia/Riyadh",
          year: "numeric",
          month: "long",
          day: "numeric",
          calendar: "gregory",
        })
      : "";

  return (
    <Link href={item.shortCode ? `/n/${item.shortCode}` : `/news/${item.id}`}>
      <Card
        className={`hover-elevate cursor-pointer transition-all overflow-hidden h-full ${item.isBreaking ? "ring-2 ring-red-500" : ""}`}
        data-testid={`capsule-card-news-${item.id}`}
      >
        <div className="relative">
          <img
            src={getNewsImage(item)}
            alt={item.title}
            loading="lazy"
            decoding="async"
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
            data-testid={`badge-capsule-news-${item.id}`}
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
              <span className="text-primary flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Card for an article ───────────────────────────────────────────────────────

function ArticleCard({
  item,
  getCategoryLabel,
}: {
  item: ArticleType;
  getCategoryLabel: (cat: string) => string;
}) {
  const formatDate = (date: Date | string | null) =>
    date
      ? new Date(date).toLocaleDateString("ar-EG-u-nu-latn", {
          timeZone: "Asia/Riyadh",
          year: "numeric",
          month: "long",
          day: "numeric",
          calendar: "gregory",
        })
      : "";

  return (
    <Link href={`/articles/${item.slug}`}>
      <Card
        className="hover-elevate cursor-pointer transition-all overflow-hidden h-full border-dashed"
        data-testid={`capsule-card-article-${item.id}`}
      >
        <div className="relative">
          <div className="w-full aspect-video bg-muted flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/50" />
          </div>
        </div>
        <CardContent className="p-3" dir="rtl">
          <div className="flex items-center gap-1 mb-2">
            <Badge
              className={`${categoryColors[item.category] || ""} text-sm`}
              data-testid={`badge-capsule-article-${item.id}`}
            >
              {getCategoryLabel(item.category)}
            </Badge>
            <Badge variant="outline" className="text-xs gap-1">
              <BookOpen className="h-2.5 w-2.5" />
              مقال
            </Badge>
          </div>
          <h3 className="font-semibold text-sm line-clamp-2 mb-2">{item.title}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatDate(item.publishedAt)}
            {item.readTime && (
              <span className="mr-2">{item.readTime} دقيقة قراءة</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Capsule() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [editingInterests, setEditingInterests] = useState(false);

  // Fetch DB categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories?active=true"],
    queryFn: async () => {
      const res = await fetch("/api/categories?active=true");
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json();
    },
  });

  const { data: interestsData, isLoading: interestsLoading } = useQuery<InterestsResponse>({
    queryKey: ["/api/capsule/interests"],
    enabled: isAuthenticated,
  });

  const interests = interestsData?.interests ?? [];
  const hasInterests = interests.length > 0;
  const isOnboarding = !interestsLoading && !hasInterests && !editingInterests;

  const { data, isLoading: feedLoading } = useQuery<FeedResponse>({
    queryKey: ["/api/capsule/feed", page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), perPage: String(PER_PAGE) });
      const res = await fetch(`/api/capsule/feed?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
    enabled: isAuthenticated && hasInterests && !editingInterests,
  });

  const interestsMutation = useMutation({
    mutationFn: async (newInterests: string[]) => {
      await apiRequest("PUT", "/api/capsule/interests", { interests: newInterests });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/capsule/interests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/capsule/feed"] });
      setEditingInterests(false);
      setPage(1);
      toast({ title: "تم حفظ الاهتمامات", description: "ستظهر الأخبار والمقالات المخصصة لك الآن" });
    },
    onError: () => {
      toast({ title: "حدث خطأ", description: "لم نتمكن من حفظ اهتماماتك", variant: "destructive" });
    },
  });

  const getCategoryLabel = (cat: string) =>
    categories.find(c => c.slug === cat)?.nameAr || cat;

  const totalPages = data?.totalPages || 1;

  const getPageNumbers = () => {
    const pages: (number | "dots")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("dots");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("dots");
      pages.push(totalPages);
    }
    return pages;
  };

  const navigateToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Lock className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">جرعتك اليومية</h2>
              <p className="text-muted-foreground">
                سجّل دخولك للوصول إلى صفحة الأخبار الشخصية المخصصة لك
              </p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              <Button onClick={() => setLocation("/login")} size="lg" data-testid="button-capsule-login">
                تسجيل الدخول
              </Button>
              <Button onClick={() => setLocation("/register")} variant="outline" size="lg" data-testid="button-capsule-register">
                إنشاء حساب
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || interestsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="container mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  // ── Onboarding (first visit) ────────────────────────────────────────────────
  if (isOnboarding) {
    return (
      <div className="min-h-screen p-6" dir="rtl">
        <div className="container mx-auto max-w-2xl">
          <Card className="p-6 sm:p-8">
            <InterestsSelector
              categories={categories}
              current={[]}
              onSave={newInterests => interestsMutation.mutate(newInterests)}
              isSaving={interestsMutation.isPending}
              isOnboarding
            />
          </Card>
        </div>
      </div>
    );
  }

  // ── Edit interests panel ────────────────────────────────────────────────────
  if (editingInterests) {
    return (
      <div className="min-h-screen p-6" dir="rtl">
        <div className="container mx-auto max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">تعديل الاهتمامات</h1>
            <Button variant="outline" onClick={() => setEditingInterests(false)} data-testid="button-cancel-interests">
              إلغاء
            </Button>
          </div>
          <Card className="p-6">
            <InterestsSelector
              categories={categories}
              current={interests}
              onSave={newInterests => interestsMutation.mutate(newInterests)}
              isSaving={interestsMutation.isPending}
            />
          </Card>
        </div>
      </div>
    );
  }

  // ── Personalized feed ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4" dir="rtl">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Pill className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">جرعتك اليومية</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              أخبارك الصحية المخصصة بناءً على اهتماماتك
              {data?.total != null && data.total > 0 && (
                <span className="text-sm me-2">({data.total} عنصر)</span>
              )}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {interests.map(cat => {
                const info = categories.find(c => c.slug === cat);
                return info ? (
                  <Badge key={cat} variant="secondary" data-testid={`active-interest-${cat}`}>
                    {info.nameAr}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-2"
            onClick={() => setEditingInterests(true)}
            data-testid="button-edit-interests"
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">تعديل الاهتمامات</span>
          </Button>
        </div>

        {/* Feed */}
        {feedLoading ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {data.items.map(entry =>
                entry.type === "news" ? (
                  <NewsCard
                    key={`news-${entry.item.id}`}
                    item={entry.item}
                    getCategoryLabel={getCategoryLabel}
                  />
                ) : (
                  <ArticleCard
                    key={`article-${entry.item.id}`}
                    item={entry.item}
                    getCategoryLabel={getCategoryLabel}
                  />
                )
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-8" dir="rtl" data-testid="capsule-pagination">
                <Button variant="outline" size="icon" onClick={() => navigateToPage(1)} disabled={page === 1} data-testid="button-first-page-capsule">
                  <ChevronsRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateToPage(page - 1)} disabled={page === 1} data-testid="button-prev-page-capsule">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {getPageNumbers().map((p, i) =>
                  p === "dots" ? (
                    <span key={`dots-${i}`} className="px-2 text-muted-foreground">...</span>
                  ) : (
                    <Button key={p} variant={page === p ? "default" : "outline"} size="icon" onClick={() => navigateToPage(p)} data-testid={`button-capsule-page-${p}`}>
                      {p}
                    </Button>
                  )
                )}
                <Button variant="outline" size="icon" onClick={() => navigateToPage(page + 1)} disabled={page === totalPages} data-testid="button-next-page-capsule">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateToPage(totalPages)} disabled={page === totalPages} data-testid="button-last-page-capsule">
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground mr-3" data-testid="text-capsule-page-info">
                  صفحة {page} من {totalPages}
                </span>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12" dir="rtl">
              <Newspaper className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-4">
                لا توجد أخبار أو مقالات متاحة لاهتماماتك المختارة حالياً
              </p>
              <Button variant="outline" onClick={() => setEditingInterests(true)} data-testid="button-edit-interests-empty">
                تعديل الاهتمامات
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
