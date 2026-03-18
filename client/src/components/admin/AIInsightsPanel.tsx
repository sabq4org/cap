import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Brain, Sparkles, TrendingUp, Lightbulb, Target, Rocket,
  ChevronDown, ChevronUp, Loader2, RefreshCw, ArrowUpRight,
  BarChart3, Plus, AlertTriangle, CheckCircle2, Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";

const CATEGORY_LABELS: Record<string, string> = {
  "saudi-health": "صحة سعودية",
  "health-news": "أخبار صحية",
  "medical-research": "أبحاث طبية",
  "nutrition": "تغذية",
  "mental-health": "صحة نفسية",
  "medications": "أدوية",
  "health-tech": "تقنية صحية",
  "fitness": "لياقة بدنية",
  "misc": "منوعات",
  "منوعات": "منوعات",
  "local": "محلي",
  "global": "دولي",
  "pharma": "أدوية",
  "awareness": "توعية صحية",
  "women-health": "صحة المرأة",
  "child-health": "صحة الطفل",
};

const priorityConfig = {
  high: { label: "عالية", color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200", icon: AlertTriangle },
  medium: { label: "متوسطة", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200", icon: Info },
  low: { label: "منخفضة", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200", icon: CheckCircle2 },
};

export default function AIInsightsPanel() {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery<{
    success: boolean;
    insights: {
      summary: string;
      categoryRecommendations: { category: string; action: string; reason: string; priority: "high" | "medium" | "low" }[];
      newSectionSuggestions: { name: string; description: string; reasoning: string }[];
      contentStrategy: string[];
      growthTips: string[];
    };
    analyticsData: {
      categoryPerformance: { category: string; count: number; views: number; avgViews: number }[];
      totalStats: { published: number; totalViews: number; avgViewsPerNews: number; daysActive: number };
    };
  }>({
    queryKey: ["/api/admin/ai-insights"],
    enabled: isExpanded,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const insights = data?.insights;
  const analytics = data?.analyticsData;

  return (
    <Card className="border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/20" data-testid="ai-insights-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                المستشار التحريري الذكي
                <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px]">
                  <Sparkles className="h-3 w-3 ml-1" />
                  AI
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                تحليل ذكي لأداء المحتوى وتوصيات تحريرية مبنية على البيانات
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-8"
                data-testid="button-refresh-insights"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8"
              data-testid="button-toggle-insights"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="mr-1 text-xs">{isExpanded ? "إخفاء" : "عرض التحليل"}</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-6">
          {isLoading || isFetching ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-emerald-600 animate-pulse" />
                </div>
                <Loader2 className="h-6 w-6 text-emerald-500 animate-spin absolute -top-1 -left-1" />
              </div>
              <p className="text-sm text-muted-foreground">جارِ تحليل البيانات وإعداد التوصيات...</p>
              <p className="text-xs text-muted-foreground/60">قد يستغرق الأمر بضع ثوانٍ</p>
            </div>
          ) : insights ? (
            <>
              {/* Summary */}
              <div className="p-4 rounded-xl bg-gradient-to-l from-emerald-100/60 to-teal-100/60 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm mb-1 text-emerald-900 dark:text-emerald-100">الملخص التحليلي</h4>
                    <p className="text-sm leading-relaxed text-emerald-800 dark:text-emerald-200" data-testid="text-ai-summary">
                      {insights.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Recommendations */}
              {insights.categoryRecommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-emerald-600" />
                    توصيات التصنيفات
                  </h4>
                  <div className="grid gap-2">
                    {insights.categoryRecommendations.map((rec, i) => {
                      const pConfig = priorityConfig[rec.priority] || priorityConfig.medium;
                      const PIcon = pConfig.icon;
                      return (
                        <div
                          key={i}
                          className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                          data-testid={`card-category-rec-${i}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-medium text-sm">{CATEGORY_LABELS[rec.category] || rec.category}</span>
                                <Badge variant="outline" className="text-[10px] h-5">
                                  {rec.action}
                                </Badge>
                                <Badge className={`text-[10px] h-5 ${pConfig.color}`}>
                                  <PIcon className="h-3 w-3 ml-0.5" />
                                  {pConfig.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{rec.reason}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* New Section Suggestions */}
              {insights.newSectionSuggestions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-teal-600" />
                    أبواب جديدة مقترحة
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {insights.newSectionSuggestions.map((suggestion, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg border-2 border-dashed border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20 hover:border-teal-400 dark:hover:border-teal-600 transition-colors"
                        data-testid={`card-new-section-${i}`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Lightbulb className="h-4 w-4 text-teal-600" />
                          <span className="font-semibold text-sm text-teal-900 dark:text-teal-100">{suggestion.name}</span>
                        </div>
                        <p className="text-xs text-teal-700 dark:text-teal-300 mb-1">{suggestion.description}</p>
                        <p className="text-[11px] text-muted-foreground">{suggestion.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Strategy + Growth Tips */}
              <div className="grid gap-4 sm:grid-cols-2">
                {insights.contentStrategy.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Rocket className="h-4 w-4 text-violet-600" />
                      استراتيجية المحتوى
                    </h4>
                    <div className="space-y-2">
                      {insights.contentStrategy.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
                          <ArrowUpRight className="h-3.5 w-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {insights.growthTips.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-amber-600" />
                      نصائح النمو
                    </h4>
                    <div className="space-y-2">
                      {insights.growthTips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Performance Table */}
              {analytics?.categoryPerformance && analytics.categoryPerformance.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    أداء التصنيفات بالأرقام
                  </h4>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-right p-2 font-medium text-xs">التصنيف</th>
                          <th className="text-center p-2 font-medium text-xs">عدد الأخبار</th>
                          <th className="text-center p-2 font-medium text-xs">المشاهدات</th>
                          <th className="text-center p-2 font-medium text-xs">متوسط/خبر</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.categoryPerformance.slice(0, 8).map((cat, i) => (
                          <tr key={i} className="border-t hover:bg-muted/30 transition-colors" data-testid={`row-cat-perf-${i}`}>
                            <td className="p-2 font-medium text-xs">{CATEGORY_LABELS[cat.category] || cat.category}</td>
                            <td className="p-2 text-center text-xs">{cat.count.toLocaleString("ar-SA-u-nu-latn")}</td>
                            <td className="p-2 text-center text-xs">{cat.views.toLocaleString("ar-SA-u-nu-latn")}</td>
                            <td className="p-2 text-center">
                              <Badge variant={cat.avgViews > 100 ? "default" : "secondary"} className="text-[10px]">
                                {cat.avgViews.toLocaleString("ar-SA-u-nu-latn")}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">تعذر تحميل التحليل. اضغط زر التحديث للمحاولة مرة أخرى.</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
