import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  TrendingUp, TrendingDown, RefreshCw, Bell, BellOff, Menu,
  LayoutDashboard, Newspaper, BookOpen, Settings, Download,
  Users, Shield, LogOut, Globe, Radar, LayoutTemplate, Wand2,
  ArrowUp, ArrowDown, Minus, Zap, FileText, ChevronRight, Check,
  AlertTriangle, Clock, Activity,
} from "lucide-react";
import logoImage from "@assets/LOGO-L_1769253692563.png";
import type { HealthTrend, TrendAlert } from "@shared/schema";

function SidebarItem({ icon: Icon, label, active, count, onClick }: {
  icon: any; label: string; active?: boolean; count?: number | string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 relative group ${
        active
          ? "bg-emerald-100/70 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
      }`}
    >
      {active && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-600 rounded-full" />
      )}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
        active
          ? "bg-emerald-600 text-white"
          : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
      }`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="flex-1 text-right text-[13px]">{label}</span>
      {count !== undefined && count !== null && (
        <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium min-w-[22px] text-center ${
          active ? "bg-emerald-600/20 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground"
        }`}>
          {typeof count === "number" && count > 999 ? "999+" : count}
        </span>
      )}
    </button>
  );
}

const STRENGTH_CONFIG = {
  low:       { label: "منخفض",      color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",   bar: "bg-slate-400",   width: "w-1/4" },
  medium:    { label: "متوسط",      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",  bar: "bg-amber-500",   width: "w-2/4" },
  high:      { label: "مرتفع",      color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", bar: "bg-orange-500", width: "w-3/4" },
  very_high: { label: "جداً مرتفع", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",         bar: "bg-red-500",     width: "w-full" },
} as const;

const CATEGORY_LABEL: Record<string, string> = {
  heart: "قلب", diabetes: "سكري", blood_pressure: "ضغط الدم",
  cancer: "سرطان", mental_health: "الصحة النفسية", weight: "الوزن",
  nutrition: "التغذية", medication: "أدوية", allergy: "حساسية",
  respiratory: "جهاز تنفسي", sleep: "النوم", bones: "عظام",
  liver: "الكبد", kidney: "الكلى", fitness: "لياقة", vitamins: "فيتامينات",
  vaccination: "التطعيم", general: "صحة عامة",
};

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("ar-SA", {
    timeZone: "Asia/Riyadh", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function WeeklyChangeIndicator({ change }: { change: number | null | undefined }) {
  const v = change ?? 0;
  if (v > 10) return (
    <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
      <ArrowUp className="h-3 w-3" />+{v}%
    </span>
  );
  if (v < -10) return (
    <span className="flex items-center gap-0.5 text-red-500 font-semibold text-xs">
      <ArrowDown className="h-3 w-3" />{v}%
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-muted-foreground text-xs">
      <Minus className="h-3 w-3" />{v}%
    </span>
  );
}

function TrendCard({ trend, rank, onCreateArticle }: {
  trend: HealthTrend;
  rank: number;
  onCreateArticle: (trend: HealthTrend) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const strength = (trend.trendStrength as keyof typeof STRENGTH_CONFIG) || "low";
  const cfg = STRENGTH_CONFIG[strength];
  const catLabel = CATEGORY_LABEL[trend.category || ""] || trend.category || "صحة";

  return (
    <div
      className="bg-card border border-border/60 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
      data-testid={`card-trend-${trend.id}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 font-bold text-emerald-700 dark:text-emerald-400 text-sm">
            {rank}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <h3 className="font-bold text-sm leading-tight" data-testid={`text-trend-keyword-${trend.id}`}>
                {trend.keywordAr || trend.keyword}
              </h3>
              <Badge className={`text-[10px] px-2 py-0 h-5 ${cfg.color}`} data-testid={`badge-strength-${trend.id}`}>
                {cfg.label}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 border-blue-200 text-blue-700 dark:text-blue-400">
                {catLabel}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-4 mb-2 text-xs text-muted-foreground">
              {trend.searchVolume ? (
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {trend.searchVolume.toLocaleString("ar-SA")} بحث/شهر
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                قوة: {trend.trendScore}/100
              </span>
              <WeeklyChangeIndicator change={trend.weeklyChange} />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${cfg.bar} transition-all`}
                  style={{ width: `${trend.trendScore}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0">{trend.trendScore}%</span>
            </div>

            {trend.aiContext && (
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed" data-testid={`text-context-${trend.id}`}>
                {trend.aiContext}
              </p>
            )}

            {expanded && trend.articleSuggestions && trend.articleSuggestions.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">مقترحات عناوين:</p>
                {trend.articleSuggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-2"
                  >
                    <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
          <Button
            size="sm"
            className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
            onClick={() => onCreateArticle(trend)}
            data-testid={`button-create-article-${trend.id}`}
          >
            <Zap className="h-3 w-3" />
            أنشئ مقالاً عن هذا
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-expand-${trend.id}`}
          >
            {expanded ? "إخفاء" : "العناوين المقترحة"}
            <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AlertCard({ alert, onMarkRead }: {
  alert: TrendAlert;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div
      className={`border rounded-xl p-4 transition-colors ${
        alert.isRead
          ? "bg-muted/30 border-border/40"
          : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50"
      }`}
      data-testid={`card-alert-${alert.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          alert.isRead ? "bg-muted" : "bg-amber-100 dark:bg-amber-900/30"
        }`}>
          <Bell className={`h-4 w-4 ${alert.isRead ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {!alert.isRead && (
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            )}
            <span className="font-semibold text-sm" data-testid={`text-alert-keyword-${alert.id}`}>
              {alert.keywordAr || alert.keyword}
            </span>
            {alert.spikePercent && alert.spikePercent >= 150 && (
              <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 h-5">
                +{alert.spikePercent}%
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2" data-testid={`text-alert-message-${alert.id}`}>
            {alert.message}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {fmtDate(alert.createdAt)}
            </span>
            {!alert.isRead && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[11px] px-2 gap-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100"
                onClick={() => onMarkRead(alert.id)}
                data-testid={`button-mark-read-${alert.id}`}
              >
                <Check className="h-3 w-3" />
                تعليم كمقروء
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminTrends() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"trends" | "alerts">("trends");
  const [adminUser, setAdminUser] = useState<{ displayName: string; role: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetch("/api/admin/check-session", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.authenticated && d.displayName) setAdminUser({ displayName: d.displayName, role: d.role }); })
      .catch(() => {});
  }, []);

  const { data: trends = [], isLoading: trendsLoading } = useQuery<HealthTrend[]>({
    queryKey: ["/api/admin/trends"],
    queryFn: async () => {
      const r = await fetch("/api/admin/trends?limit=10");
      if (!r.ok) throw new Error("فشل في جلب الترندات");
      return r.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: alertsData, isLoading: alertsLoading } = useQuery<{ alerts: TrendAlert[]; unreadCount: number }>({
    queryKey: ["/api/admin/trends/alerts"],
    queryFn: async () => {
      const r = await fetch("/api/admin/trends/alerts");
      if (!r.ok) throw new Error("فشل في جلب التنبيهات");
      return r.json();
    },
    refetchInterval: 60 * 1000,
  });

  const alerts = alertsData?.alerts ?? [];
  const unreadCount = alertsData?.unreadCount ?? 0;

  const refreshMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/trends/refresh", { region: "SA" }).then(r => r.json()),
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trends/alerts"] });
      setLastUpdated(new Date());
      toast({
        title: "تم تحديث رادار الترند",
        description: `${d.updated} موضوع محدث${d.alerts > 0 ? ` - ${d.alerts} تنبيه جديد` : ""}`,
      });
    },
    onError: () => toast({ title: "فشل في التحديث", variant: "destructive" }),
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/trends/alerts/${id}/read`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trends/alerts"] });
    },
  });

  const markAllReadMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/trends/alerts/read-all").then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trends/alerts"] });
      toast({ title: "تم تعليم جميع التنبيهات كمقروءة" });
    },
  });

  const handleCreateArticle = (trend: HealthTrend) => {
    const suggestions = trend.articleSuggestions || [];
    const title = suggestions[0] || trend.keywordAr || trend.keyword;
    const kws = suggestions.length > 0
      ? [trend.keywordAr || trend.keyword, ...suggestions.slice(0, 2)]
      : [trend.keywordAr || trend.keyword];
    // URLSearchParams encodes values automatically — do not double-encode
    const params = new URLSearchParams({
      title,
      keywords: kws.join(","),
      from: "trends",
    });
    setLocation(`/admin/news/new?${params.toString()}`);
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportReport = async () => {
    if (trends.length === 0) return;
    setIsExporting(true);
    try {
      const r = await fetch("/api/admin/trends/weekly-report");
      if (!r.ok) throw new Error("فشل جلب تقرير الأداء");
      const report = await r.json() as {
        period: string;
        topTrends: Array<{
          keyword: string;
          keywordAr: string;
          trendScore: number;
          weeklyChange: number;
          coveredByUs: boolean;
          publishedArticles: string[];
        }>;
        coverageRate: number;
        totalTrends: number;
        coveredTrends: number;
        uncoveredOpportunities: string[];
      };

      const now = new Date().toLocaleDateString("ar-SA");
      const lines = [
        `تقرير رادار الترند الصحي - ${now}`,
        `=`.repeat(50),
        "",
        `ملخص التغطية الأسبوعية:`,
        `  إجمالي الترندات: ${report.totalTrends}`,
        `  مغطاة بمحتوانا: ${report.coveredTrends} (${report.coverageRate}%)`,
        `  فرص غير مغطاة: ${report.uncoveredOpportunities.length}`,
        "",
        report.uncoveredOpportunities.length > 0
          ? `⚡ مواضيع ساخنة لم تُغطَّ بعد:\n${report.uncoveredOpportunities.map(k => `   - ${k}`).join("\n")}`
          : "✅ جميع المواضيع الساخنة مُغطاة!",
        "",
        `=`.repeat(50),
        `تفاصيل أبرز الترندات:`,
        "",
        ...report.topTrends.map((t, i) => {
          const trend = trends.find(tr => tr.keyword === t.keyword);
          const rows: string[] = [
            `${i + 1}. ${t.keywordAr} ${t.coveredByUs ? "✅ مُغطى" : "⚠️ غير مُغطى"}`,
            `   الدرجة: ${t.trendScore}/100 | التغير الأسبوعي: ${t.weeklyChange >= 0 ? "+" : ""}${t.weeklyChange}%`,
          ];
          if (t.coveredByUs && t.publishedArticles.length > 0) {
            rows.push(`   مقالاتنا المنشورة:`);
            t.publishedArticles.forEach(a => rows.push(`   • ${a}`));
          }
          if (trend?.aiContext) rows.push(`   السياق: ${trend.aiContext}`);
          if (trend?.articleSuggestions?.length) {
            rows.push(`   عناوين مقترحة لم تُكتب بعد:`);
            trend.articleSuggestions.forEach(s => rows.push(`   - ${s}`));
          }
          rows.push("");
          return rows.join("\n");
        }),
      ].join("\n");

      const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trend-report-${new Date().toISOString().split("T")[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "تم تصدير التقرير", description: `تغطية ${report.coverageRate}% من الترندات الأسبوعية` });
    } catch {
      toast({ title: "فشل تصدير التقرير", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const navigateTo = (path: string) => {
    setSidebarOpen(false);
    setLocation(path);
  };

  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout").catch(() => {});
    localStorage.removeItem("adminAuthenticated");
    setLocation("/admin/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="relative overflow-hidden bg-gradient-to-br from-green-700 via-emerald-700 to-teal-700 p-4">
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-emerald-300/10 rounded-full blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <img src={logoImage} alt="كبسولة" className="h-6 w-6 object-contain" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white leading-none">كبسولة</h2>
            <p className="text-[11px] text-white/60 mt-0.5">لوحة التحكم</p>
          </div>
          <div className="mr-auto">
            <span className="text-[10px] bg-white/15 text-white/80 px-2 py-0.5 rounded-full border border-white/20">
              {adminUser?.role === "super_admin" ? "سوبر أدمن" : adminUser?.role === "editor" ? "محرر" : "مدير"}
            </span>
          </div>
        </div>
        {adminUser?.displayName && (
          <div className="relative mt-3 pt-3 border-t border-white/15 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {adminUser.displayName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{adminUser.displayName}</p>
              <p className="text-[10px] text-white/50">مرحباً بك</p>
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-4">
          <div>
            <SidebarItem icon={LayoutDashboard} label="الرئيسية" onClick={() => navigateTo("/admin/dashboard")} />
          </div>
          <div>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">المحتوى</p>
            <div className="space-y-0.5">
              <SidebarItem icon={Newspaper} label="الأخبار" onClick={() => navigateTo("/admin/news")} />
              <SidebarItem icon={BookOpen} label="المقالات" onClick={() => navigateTo("/admin/articles")} />
              <SidebarItem icon={Settings} label="التصنيفات" onClick={() => navigateTo("/admin/categories")} />
            </div>
          </div>
          <div>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">الأدوات</p>
            <div className="space-y-0.5">
              <SidebarItem icon={Radar} label="رادار الأخبار" onClick={() => navigateTo("/admin/radar")} />
              <SidebarItem icon={TrendingUp} label="رادار الترند الصحي" active count={unreadCount || undefined} onClick={() => navigateTo("/admin/trends")} />
              <SidebarItem icon={Download} label="استيراد الأخبار" onClick={() => navigateTo("/admin/import")} />
              <SidebarItem icon={LayoutTemplate} label="توليد إنفوجرافيك" onClick={() => navigateTo("/admin/infographic")} />
              <SidebarItem icon={Wand2} label="إعدادات التوليد" onClick={() => navigateTo("/admin/generation-settings")} />
            </div>
          </div>
          <div>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">الإدارة</p>
            <div className="space-y-0.5">
              <SidebarItem icon={Shield} label="الحسابات الإدارية" onClick={() => navigateTo("/admin/accounts")} />
              <SidebarItem icon={Users} label="المستخدمين" onClick={() => navigateTo("/admin/users")} />
            </div>
          </div>
        </nav>
      </ScrollArea>

      <div className="p-3 border-t bg-muted/30 space-y-1">
        <Link href="/">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Globe className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-right text-xs">عرض الموقع</span>
          </button>
        </Link>
        <button
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          onClick={handleLogout}
          data-testid="button-admin-logout"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-right text-xs">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 overflow-x-hidden w-full" dir="rtl">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card border-b px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" data-testid="button-mobile-menu">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-1.5 min-w-0">
            <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-sm truncate">رادار الترند الصحي</span>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1 shrink-0"
          onClick={() => refreshMut.mutate()}
          disabled={refreshMut.isPending}
          data-testid="button-refresh-mobile"
        >
          <RefreshCw className={`h-3 w-3 ${refreshMut.isPending ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </header>

      <div className="flex h-screen lg:h-auto lg:min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 border-l bg-card h-screen sticky top-0">
          <SidebarContent />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 lg:p-6 space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h1 className="text-xl font-bold" data-testid="title-trend-radar">رادار الترند الصحي</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                الموضوعات الصحية الأكثر بحثاً في السعودية — يتحدث تلقائياً كل 6 ساعات
              </p>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  آخر تحديث: {fmtDate(lastUpdated)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-sm"
                onClick={handleExportReport}
                disabled={trends.length === 0 || isExporting}
                data-testid="button-export-report"
              >
                <Download className="h-3.5 w-3.5" />
                {isExporting ? "جاري التصدير..." : "تصدير التقرير"}
              </Button>
              <Button
                size="sm"
                className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-sm"
                onClick={() => refreshMut.mutate()}
                disabled={refreshMut.isPending}
                data-testid="button-refresh-trends"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshMut.isPending ? "animate-spin" : ""}`} />
                {refreshMut.isPending ? "جاري التحديث..." : "تحديث الآن"}
              </Button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "مواضيع رائجة", value: trends.length, icon: TrendingUp, color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
              { label: "مرتفعة جداً", value: trends.filter(t => t.trendStrength === "very_high").length, icon: Zap, color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
              { label: "تنبيهات جديدة", value: unreadCount, icon: Bell, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
              { label: "إجمالي التنبيهات", value: alerts.length, icon: AlertTriangle, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none" data-testid={`stat-${s.label}`}>{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
            {[
              { key: "trends" as const, label: "الترندات الرائجة", icon: TrendingUp },
              { key: "alerts" as const, label: "التنبيهات", icon: Bell, count: unreadCount },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`tab-${tab.key}`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.count ? (
                  <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {tab.count}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Trends tab */}
          {activeTab === "trends" && (
            <div>
              {trendsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-xl" />
                  ))}
                </div>
              ) : trends.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold mb-1">لا توجد بيانات ترند بعد</p>
                  <p className="text-sm mb-4">اضغط "تحديث الآن" لجلب الموضوعات الرائجة باستخدام الذكاء الاصطناعي</p>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    onClick={() => refreshMut.mutate()}
                    disabled={refreshMut.isPending}
                    data-testid="button-refresh-empty"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshMut.isPending ? "animate-spin" : ""}`} />
                    {refreshMut.isPending ? "جاري التحليل..." : "ابدأ رصد الترندات"}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trends.map((trend, idx) => (
                    <TrendCard
                      key={trend.id}
                      trend={trend}
                      rank={idx + 1}
                      onCreateArticle={handleCreateArticle}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Alerts tab */}
          {activeTab === "alerts" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} تنبيه غير مقروء` : "جميع التنبيهات مقروءة"}
                </p>
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1"
                    onClick={() => markAllReadMut.mutate()}
                    disabled={markAllReadMut.isPending}
                    data-testid="button-mark-all-read"
                  >
                    <BellOff className="h-3 w-3" />
                    تعليم الكل كمقروء
                  </Button>
                )}
              </div>

              {alertsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BellOff className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold mb-1">لا توجد تنبيهات حتى الآن</p>
                  <p className="text-sm">ستظهر التنبيهات عندما يرتفع موضوع صحي بشكل مفاجئ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onMarkRead={(id) => markReadMut.mutate(id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
