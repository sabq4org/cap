import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FlaskConical, CheckCircle, XCircle, AlertTriangle,
  Clock, ExternalLink, Share2, RotateCw, ArrowRight
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { SiX } from "react-icons/si";
import type { RumorSubmission } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const verdictConfig = {
  "خرافة": {
    label: "خرافة",
    color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700",
    icon: XCircle,
    iconColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-800",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    bannerBg: "from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20",
  },
  "صحيح جزئياً": {
    label: "صحيح جزئياً",
    color: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700",
    icon: AlertTriangle,
    iconColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-800",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    bannerBg: "from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20",
  },
  "صحيح": {
    label: "صحيح",
    color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700",
    icon: CheckCircle,
    iconColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    bannerBg: "from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20",
  },
} as const;

export default function RumorStatus() {
  const { id } = useParams<{ id: string }>();

  const { data: rumor, isLoading, isError } = useQuery<Omit<RumorSubmission, "editorNotes">>({
    queryKey: ["/api/rumors", id],
    queryFn: () => apiRequest("GET", `/api/rumors/${id}`).then((r) => r.json()),
    refetchInterval: (query) => {
      const data = query.state.data as any;
      if (!data) return 4000;
      if (data.status === "pending") return 4000;
      return false;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (rumor && rumor.status !== "pending") {
      apiRequest("POST", `/api/rumors/${id}/view`).catch(() => {});
    }
  }, [rumor?.status]);

  const statusInfo = rumor?.status === "pending"
    ? { label: "جاري التحليل...", icon: RotateCw, iconClass: "animate-spin text-primary" }
    : rumor?.status === "rejected"
    ? { label: "مرفوضة", icon: XCircle, iconClass: "text-muted-foreground" }
    : { label: "تم التحليل", icon: CheckCircle, iconClass: "text-green-500" };

  const verdict = rumor?.aiResponse?.verdict || "";
  const cfg = verdictConfig[verdict as keyof typeof verdictConfig];

  const shareUrl = rumor?.publishedNewsId
    ? `${window.location.origin}/news/${rumor.publishedNewsId}`
    : window.location.href;
  const shareText = `تفنيد طبي: ${rumor?.aiResponse?.shortSummary || rumor?.rumorText?.substring(0, 80) || ""}`;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
  };
  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      "_blank", "width=600,height=400"
    );
  };
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto max-w-2xl px-4 py-10">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <FlaskConical className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1">حالة التفنيد</h1>
          <p className="text-muted-foreground text-sm">تابع نتيجة تحليل الذكاء الاصطناعي لشائعتك</p>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        )}

        {isError && (
          <Card>
            <CardContent className="text-center py-12">
              <XCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">لم يتم العثور على هذه الشائعة أو انتهت صلاحيتها.</p>
              <Link href="/ask-capsule">
                <Button variant="outline" data-testid="button-back-to-ask">
                  العودة لاسأل كبسولة
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {rumor && !isError && (
          <div className="space-y-4">

            {/* Status Banner */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  {(() => {
                    const Icon = statusInfo.icon;
                    return <Icon className={`h-5 w-5 flex-shrink-0 ${statusInfo.iconClass}`} />;
                  })()}
                  <span className="font-semibold text-lg" data-testid="text-status-label">
                    {statusInfo.label}
                  </span>
                  <span className="text-xs text-muted-foreground mr-auto flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(rumor.createdAt!).toLocaleDateString("ar-EG-u-nu-latn", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </span>
                </div>

                <div className="bg-muted/40 rounded-lg p-3 text-sm text-muted-foreground italic leading-relaxed mb-0" data-testid="text-rumor-text">
                  "{rumor.rumorText}"
                </div>
              </CardContent>
            </Card>

            {/* Pending — waiting for AI */}
            {rumor.status === "pending" && (
              <Card>
                <CardContent className="text-center py-10">
                  <RotateCw className="h-10 w-10 mx-auto mb-3 text-primary animate-spin" />
                  <h3 className="font-bold text-base mb-2" data-testid="text-pending-title">جاري التحليل بالذكاء الاصطناعي</h3>
                  <p className="text-muted-foreground text-sm">
                    يعمل الذكاء الاصطناعي الآن على تحليل شائعتك. ستظهر النتيجة هنا خلال لحظات تلقائياً.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* AI responded or published */}
            {(rumor.status === "ai_responded" || rumor.status === "published") && rumor.aiResponse && cfg && (
              <Card className={`border-2 ${cfg.borderColor} ${cfg.bgColor}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    {(() => {
                      const Icon = cfg.icon;
                      return <Icon className={`h-5 w-5 ${cfg.iconColor}`} />;
                    })()}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${cfg.color}`} data-testid="text-verdict">
                      {cfg.label}
                    </span>
                    {rumor.status === "ai_responded" && (
                      <span className="text-xs text-muted-foreground mr-auto bg-muted px-2 py-0.5 rounded-full">
                        قيد المراجعة التحريرية
                      </span>
                    )}
                    {rumor.status === "published" && (
                      <span className="text-xs text-green-600 dark:text-green-400 mr-auto bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full font-medium">
                        منشور
                      </span>
                    )}
                  </div>

                  {rumor.aiResponse.shortSummary && (
                    <p className="font-semibold text-foreground mb-3 leading-relaxed" data-testid="text-short-summary">
                      {rumor.aiResponse.shortSummary}
                    </p>
                  )}

                  {rumor.aiResponse.explanation && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4" data-testid="text-explanation">
                      {rumor.aiResponse.explanation}
                    </p>
                  )}

                  {rumor.aiResponse.sources && rumor.aiResponse.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-current/10">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">المصادر:</p>
                      <ul className="space-y-1">
                        {rumor.aiResponse.sources.map((src, i) => (
                          <li key={i}>
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary underline underline-offset-2 hover:opacity-80 flex items-center gap-1"
                              data-testid={`link-source-${i}`}
                            >
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              {src.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Rejected */}
            {rumor.status === "rejected" && (
              <Card>
                <CardContent className="text-center py-8">
                  <XCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="font-bold mb-2" data-testid="text-rejected-title">لم يتم نشر هذا التفنيد</h3>
                  <p className="text-muted-foreground text-sm">قرر الفريق التحريري عدم نشر هذه الشائعة.</p>
                </CardContent>
              </Card>
            )}

            {/* Published article link */}
            {rumor.status === "published" && rumor.publishedNewsId && (
              <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-200 text-sm mb-0.5">تم نشر التفنيد كمقال كامل!</p>
                    <p className="text-green-700 dark:text-green-300 text-xs">يمكنك الآن قراءة التفنيد المفصل ومشاركته.</p>
                  </div>
                  <Link href={`/news/${rumor.publishedNewsId}`}>
                    <Button size="sm" className="gap-1.5 whitespace-nowrap" data-testid="button-read-article">
                      اقرأ المقال
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Share actions */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-3">شارك هذا التفنيد</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950/30"
                    onClick={shareWhatsApp}
                    data-testid="button-share-whatsapp"
                  >
                    <SiWhatsapp className="h-4 w-4" />
                    واتساب
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={shareTwitter}
                    data-testid="button-share-twitter"
                  >
                    <SiX className="h-4 w-4" />
                    تويتر
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={copyLink}
                    data-testid="button-copy-link"
                  >
                    <Share2 className="h-4 w-4" />
                    نسخ الرابط
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-center pt-2">
              <Link href="/ask-capsule">
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5" data-testid="button-back-to-ask-capsule">
                  <ArrowRight className="h-3.5 w-3.5" />
                  أرسل شائعة أخرى
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
