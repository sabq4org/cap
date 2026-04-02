import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Newspaper, Eye, TrendingUp, Users, Radar, Calendar,
  Sparkles, Zap, AlertCircle, ArrowUpRight, Activity,
  Clock, Star, Shield, ChevronRight, Loader2, BookOpen,
  CheckCircle2, XCircle, Hourglass, Globe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AIInsightsPanel from "./AIInsightsPanel";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getSaudiTime(): { date: string; time: string; greeting: string } {
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions = { timeZone: "Asia/Riyadh" };
  const hour = parseInt(now.toLocaleString("en-SA", { ...opts, hour: "numeric", hour12: false }));
  const dateStr = now.toLocaleDateString("ar-SA", { ...opts, weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("ar-SA", { ...opts, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const greeting = hour < 12 ? "صباح الخير" : hour < 17 ? "مساء الخير" : "مساء النور";
  return { date: dateStr, time: timeStr, greeting };
}

function formatNumber(n: number): string {
  return n.toLocaleString("ar-SA-u-nu-latn");
}

const CATEGORY_LABELS: Record<string, string> = {
  "saudi-health": "صحة سعودية",
  "health-news": "أخبار صحية",
  "medical": "طبي",
  "pharmaceutical": "صيدلانيات",
  "nutrition": "تغذية",
  "awareness": "توعية",
  "conference": "مؤتمرات",
  "arab-news": "أخبار عربية",
  "misc": "منوعات",
  "health": "صحة",
  "quality-life": "جودة حياة",
  "mental-health": "صحة نفسية",
  "diseases": "أمراض",
  "medications": "أدوية",
  "health-community": "مجتمع صحي",
  "health-reports": "تقارير",
  "health-events": "فعاليات",
};

const CHART_COLORS = ["#16a34a","#3b82f6","#8b5cf6","#f59e0b","#14b8a6","#f43f5e","#64748b","#a855f7","#0ea5e9","#ef4444"];

// ── AI Insights Engine (rule-based) ─────────────────────────────────────────

interface Stats {
  totalNews: number; publishedNews: number; draftNews: number;
  scheduledNews: number; todayNews: number; miscNews: number;
  totalTranslated: number; totalViews: number; todayViews: number;
  totalUsers: number; activeRadarSources: number; totalRadarSources: number;
  totalContent: number; publishedContent: number; unclassified: number;
  featuredNews: number;
}

interface RadarStats { total: number; pending: number; approved: number; rejected: number; published: number; }

interface ChartData {
  timeseries: { date: string; newsCount: number; views: number }[];
  categories: { name: string; count: number }[];
  radarSourcesActivity: { name: string; count: number }[];
}

function buildInsights(stats: Stats, radarStats: RadarStats | undefined, chartData: ChartData | undefined): { icon: string; text: string; type: "success" | "info" | "warning" | "ai" }[] {
  const insights: { icon: string; text: string; type: "success" | "info" | "warning" | "ai" }[] = [];

  if (stats.todayNews > 0) {
    const avgPerDay = chartData ? (chartData.timeseries.slice(0, -1).reduce((s, d) => s + d.newsCount, 0) / Math.max(1, chartData.timeseries.length - 1)) : 0;
    if (stats.todayNews > avgPerDay * 1.2) {
      insights.push({ icon: "🚀", text: `زخم النشر اليوم ممتاز — تم نشر ${stats.todayNews} خبر، أعلى من المتوسط اليومي بنسبة ${Math.round(((stats.todayNews / Math.max(1, avgPerDay)) - 1) * 100)}%`, type: "success" });
    } else {
      insights.push({ icon: "📰", text: `تم نشر ${stats.todayNews} خبر اليوم، وهو أداء طبيعي مقارنة بالمتوسط اليومي`, type: "info" });
    }
  } else {
    insights.push({ icon: "⏳", text: "لم يُنشر أي خبر حتى الآن اليوم — الوقت مناسب لإضافة محتوى جديد", type: "warning" });
  }

  if (chartData?.categories.length) {
    const top = chartData.categories[0];
    const total = chartData.categories.reduce((s, c) => s + c.count, 0);
    const pct = Math.round((top.count / Math.max(1, total)) * 100);
    insights.push({ icon: "🏆", text: `تصنيف "${CATEGORY_LABELS[top.name] || top.name}" يتصدر المحتوى بنسبة ${pct}% من إجمالي الأخبار المنشورة`, type: "ai" });
  }

  if (stats.totalViews > 0 && stats.publishedNews > 0) {
    const avg = Math.round(stats.totalViews / stats.publishedNews);
    insights.push({ icon: "👁️", text: `متوسط مشاهدات كل خبر ${formatNumber(avg)} مشاهدة — ${avg > 500 ? "أداء تفاعلي ممتاز" : avg > 100 ? "أداء جيد" : "هناك فرصة لزيادة التفاعل"}`, type: avg > 100 ? "success" : "info" });
  }

  if (radarStats && radarStats.pending > 0) {
    insights.push({ icon: "⚡", text: `مخزون الرادار: ${radarStats.pending} خبر قيد المراجعة — يُنصح بمعالجتها لتحسين سرعة النشر`, type: radarStats.pending > 50 ? "warning" : "info" });
  }

  if (stats.unclassified > 0) {
    insights.push({ icon: "🔍", text: `يوجد ${stats.unclassified} خبر غير مصنّف — استخدم التصنيف الذكي لتحسين تنظيم المحتوى`, type: "warning" });
  }

  if (stats.totalTranslated > 0) {
    const pct = Math.round((stats.totalTranslated / Math.max(1, stats.totalNews)) * 100);
    insights.push({ icon: "🌍", text: `${pct}% من المحتوى مترجم تلقائياً — المنصة تخدم قراء ناطقين بالعربية على مستوى عالمي`, type: "ai" });
  }

  return insights.slice(0, 5);
}

// ── Mini Sparkline ───────────────────────────────────────────────────────────

let _sparkId = 0;
function Sparkline({ data, color = "#16a34a" }: { data: number[]; color?: string }) {
  const id = useState(() => `spk-${++_sparkId}`)[0];
  if (!data || data.length < 2) {
    // Flat line placeholder when data is empty/uniform
    return (
      <svg width={60} height={28} viewBox="0 0 60 28" opacity={0.3}>
        <line x1="2" y1="14" x2="58" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
      </svg>
    );
  }
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);
  const w = 60, h = 28, pad = 2;
  const coords = data.map((v, i) => ({
    x: pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2),
    y: h - pad - (((v - min) / range) * (h - pad * 2)),
  }));
  const linePts = coords.map(c => `${c.x},${c.y}`).join(" ");
  // Area path: line + close to bottom
  const areaPath = [
    `M ${coords[0].x},${coords[0].y}`,
    ...coords.slice(1).map(c => `L ${c.x},${c.y}`),
    `L ${coords[coords.length - 1].x},${h - pad}`,
    `L ${coords[0].x},${h - pad}`,
    "Z",
  ].join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
        <style>{`
          @keyframes ${id}-draw {
            from { stroke-dashoffset: 200; opacity: 0.3; }
            to   { stroke-dashoffset: 0;   opacity: 1;   }
          }
        `}</style>
      </defs>
      <path d={areaPath} fill={`url(#${id}-g)`} />
      <polyline
        points={linePts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="200"
        style={{ animation: `${id}-draw 1.2s ease-out forwards` }}
      />
    </svg>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ title, value, sub, icon: Icon, color, sparkData, sparkColor, trend }: {
  title: string; value: string; sub?: string;
  icon: any; color: string; sparkData?: number[];
  sparkColor?: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
      <div className={`absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity ${color}`} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-opacity-15`}>
            <Icon className={`h-5 w-5 ${color.replace("bg-", "text-")}`} />
          </div>
          {sparkData && <Sparkline data={sparkData} color={sparkColor || "#16a34a"} />}
        </div>
        <p className="text-2xl font-bold text-foreground mb-0.5">{value}</p>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {sub && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
            {trend === "up" && <ArrowUpRight className="h-3 w-3" />}
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Radar Pipeline ───────────────────────────────────────────────────────────

function RadarPipeline({ stats }: { stats: RadarStats }) {
  const total = Math.max(1, stats.total);
  const bars = [
    { label: "قيد المراجعة", value: stats.pending, color: "bg-amber-400", icon: Hourglass },
    { label: "معتمد", value: stats.approved, color: "bg-emerald-500", icon: CheckCircle2 },
    { label: "مرفوض", value: stats.rejected, color: "bg-red-400", icon: XCircle },
    { label: "منشور", value: stats.published, color: "bg-blue-500", icon: Globe },
  ];
  return (
    <div className="space-y-3">
      {bars.map(b => (
        <div key={b.label} className="flex items-center gap-3">
          <b.icon className={`h-4 w-4 shrink-0 ${b.color.replace("bg-", "text-")}`} />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{b.label}</span>
              <span className="font-semibold">{b.value}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${b.color} transition-all duration-700`}
                style={{ width: `${Math.round((b.value / total) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground text-center pt-1">الإجمالي: {total} عنصر</p>
    </div>
  );
}

// ── Custom Donut Label ────────────────────────────────────────────────────────

function DonutLabel({ viewBox, total }: { viewBox?: any; total: number }) {
  const { cx, cy } = viewBox || { cx: 0, cy: 0 };
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-6" fontSize="22" fontWeight="bold" fill="currentColor">{formatNumber(total)}</tspan>
      <tspan x={cx} dy="20" fontSize="11" fill="gray">خبر</tspan>
    </text>
  );
}

// ── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
      {label && <p className="font-medium text-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold">{formatNumber(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

interface Props {
  adminUser?: { displayName?: string; role?: string } | null;
  onNavigate?: (section: string) => void;
}

export function AdminDashboardOverview({ adminUser, onNavigate }: Props) {
  const [clock, setClock] = useState(getSaudiTime());
  const [chartDays, setChartDays] = useState(7);
  const [insightIdx, setInsightIdx] = useState(0);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(getSaudiTime()), 1000);
    return () => clearInterval(t);
  }, []);

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 60_000,
  });

  const { data: chartData, isLoading: chartLoading } = useQuery<ChartData>({
    queryKey: ["/api/admin/charts", chartDays],
    queryFn: async () => {
      const res = await fetch(`/api/admin/charts?days=${chartDays}`, { credentials: "include" });
      return res.json();
    },
    refetchInterval: 120_000,
  });

  const { data: radarStats } = useQuery<RadarStats>({
    queryKey: ["/api/radar/items/stats"],
    refetchInterval: 60_000,
  });

  const { data: countryStats, isLoading: countryLoading } = useQuery<{ countryCode: string; countryName: string; views: number }[]>({
    queryKey: ["/api/admin/country-stats"],
    refetchInterval: 120_000,
  });

  const { data: referrerStats, isLoading: referrerLoading } = useQuery<{ source: string; sourceLabel: string; views: number }[]>({
    queryKey: ["/api/admin/referrer-stats"],
    refetchInterval: 120_000,
  });

  const { data: recentNews } = useQuery<any[]>({
    queryKey: ["/api/admin/news", "recent"],
    queryFn: async () => {
      const res = await fetch("/api/admin/news?status=published&perPage=6&page=1&sortBy=publishedAt&sortOrder=desc", { credentials: "include" });
      const d = await res.json();
      return d.items || d;
    },
  });

  // Rotate insights
  const insights = stats ? buildInsights(stats, radarStats, chartData) : [];
  useEffect(() => {
    if (!insights.length) return;
    const t = setInterval(() => setInsightIdx(i => (i + 1) % insights.length), 5000);
    return () => clearInterval(t);
  }, [insights.length]);

  // Sparkline data from timeseries
  const sparkNews = chartData?.timeseries.map(d => d.newsCount) || [];
  const sparkViews = chartData?.timeseries.map(d => d.views) || [];

  // Donut data
  const donutData = (chartData?.categories || []).map((c, i) => ({
    name: CATEGORY_LABELS[c.name] || c.name,
    value: c.count,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Timeseries labels
  const timeLabels = (chartData?.timeseries || []).map(d => {
    const parts = d.date.split("-");
    return `${parts[2]}/${parts[1]}`;
  });

  const isLoading = statsLoading || chartLoading;

  return (
    <div className="space-y-6">

      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 via-emerald-700 to-teal-700 shadow-xl">
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-emerald-300/10 rounded-full blur-3xl" />
        <div className="absolute top-0 left-1/2 w-px h-full bg-white/5" />

        <div className="relative px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: greeting */}
            <div className="text-white">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-white/70 text-sm font-medium">{clock.greeting}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                {adminUser?.displayName || "محمد الحيدر"}
              </h1>
              <div className="flex items-center gap-2 text-white/60 text-xs">
                <Shield className="h-3 w-3" />
                <span>{adminUser?.role === "super_admin" ? "مسؤول النظام" : adminUser?.role === "editor" ? "محرر" : "مدير محتوى"}</span>
                <span className="mx-1">•</span>
                <Clock className="h-3 w-3" />
                <span dir="ltr">{clock.time}</span>
              </div>
              <p className="text-white/60 text-xs mt-2">{clock.date}</p>
            </div>

            {/* Right: compact stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "أخبار", val: stats?.publishedNews ?? "—", icon: Newspaper },
                { label: "اليوم", val: stats?.todayNews ?? "—", icon: Calendar },
                { label: "مشاهدات", val: stats ? formatNumber(stats.todayViews) : "—", icon: Eye },
                { label: "مستخدمون", val: stats?.totalUsers ?? "—", icon: Users },
              ].map(s => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10 hover:bg-white/15 transition-colors">
                  <s.icon className="h-4 w-4 mx-auto text-white/70 mb-1" />
                  <p className="text-lg font-bold text-white leading-none">{isLoading ? "…" : s.val}</p>
                  <p className="text-[10px] text-white/50 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Insights Strip ───────────────────────────────────────────── */}
      {insights.length > 0 && (
        <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400">تحليل ذكي</p>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                    {insightIdx + 1}/{insights.length}
                  </Badge>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  <span className="ml-1">{insights[insightIdx]?.icon}</span>
                  {insights[insightIdx]?.text}
                </p>
              </div>
              {/* Dots */}
              <div className="flex gap-1 items-center self-center shrink-0">
                {insights.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setInsightIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === insightIdx ? "bg-green-600 w-3" : "bg-green-200 dark:bg-green-800"}`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── KPI Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          title="أخبار منشورة"
          value={isLoading ? "…" : formatNumber(stats?.publishedNews || 0)}
          sub={stats?.draftNews ? `${stats.draftNews} مسودة` : undefined}
          icon={Newspaper}
          color="bg-green-500"
          sparkData={sparkNews}
          sparkColor="#16a34a"
        />
        <KpiCard
          title="أخبار اليوم"
          value={isLoading ? "…" : String(stats?.todayNews || 0)}
          sub={stats?.todayNews ? "نُشر حديثاً" : "لا يوجد حتى الآن"}
          icon={Calendar}
          color="bg-blue-500"
          sparkData={sparkNews.slice(-5)}
          sparkColor="#3b82f6"
          trend={stats?.todayNews ? "up" : "neutral"}
        />
        <KpiCard
          title="إجمالي المشاهدات"
          value={isLoading ? "…" : formatNumber(stats?.totalViews || 0)}
          sub="تراكمي"
          icon={Eye}
          color="bg-purple-500"
          sparkData={sparkViews}
          sparkColor="#8b5cf6"
        />
        <KpiCard
          title="مشاهدات اليوم"
          value={isLoading ? "…" : formatNumber(stats?.todayViews || 0)}
          sub={stats?.todayViews ? "مشاهدة اليوم" : "لا مشاهدات بعد"}
          icon={TrendingUp}
          color="bg-orange-500"
          sparkData={sparkViews.slice(-5)}
          sparkColor="#f59e0b"
          trend={stats?.todayViews ? "up" : "neutral"}
        />
        <KpiCard
          title="المستخدمون"
          value={isLoading ? "…" : formatNumber(stats?.totalUsers || 0)}
          sub="مسجّل في المنصة"
          icon={Users}
          color="bg-pink-500"
          sparkColor="#ec4899"
        />
        <KpiCard
          title="مصادر الرادار"
          value={isLoading ? "…" : `${stats?.activeRadarSources || 0}`}
          sub={stats ? `من ${stats.totalRadarSources} مصدر إجمالاً` : undefined}
          icon={Radar}
          color="bg-teal-500"
          sparkColor="#14b8a6"
        />
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Area Chart */}
        <Card className="xl:col-span-2 border-0 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                نشاط النشر والمشاهدات
              </CardTitle>
              <div className="flex gap-1">
                {([7, 14, 30] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setChartDays(d)}
                    className={`text-xs px-2 py-0.5 rounded-md transition-colors ${chartDays === d ? "bg-green-600 text-white" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    {d} يوم
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="h-52 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData?.timeseries.map((d, i) => ({ ...d, label: timeLabels[i] })) || []}>
                  <defs>
                    <linearGradient id="gNews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "gray" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="news" orientation="right" tick={{ fontSize: 10, fill: "gray" }} axisLine={false} tickLine={false} width={28} />
                  <YAxis yAxisId="views" orientation="left" tick={{ fontSize: 10, fill: "gray" }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area yAxisId="news" type="monotone" dataKey="newsCount" name="أخبار" stroke="#16a34a" strokeWidth={2} fill="url(#gNews)" dot={false} />
                  <Area yAxisId="views" type="monotone" dataKey="views" name="مشاهدات" stroke="#3b82f6" strokeWidth={2} fill="url(#gViews)" dot={false} />
                  <Legend formatter={(v) => v === "newsCount" ? "أخبار" : "مشاهدات"} iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-600" />
              توزيع التصنيفات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="h-52 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : donutData.length ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={72}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                      <DonutLabel total={donutData.reduce((s, d) => s + d.value, 0)} />
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {donutData.slice(0, 6).map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.fill }} />
                      <span className="truncate">{d.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-10">لا توجد بيانات</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Bar Chart: Radar Sources */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Radar className="h-4 w-4 text-teal-600" />
              أنشط مصادر الرادار
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : chartData?.radarSourcesActivity.length ? (
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={chartData.radarSourcesActivity} layout="vertical" margin={{ right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 9, fill: "gray" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: "gray" }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="مقالات" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-10">لا توجد بيانات</p>
            )}
          </CardContent>
        </Card>

        {/* Radar Pipeline */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              خط أنابيب الرادار
            </CardTitle>
          </CardHeader>
          <CardContent>
            {radarStats ? (
              <RadarPipeline stats={radarStats} />
            ) : (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Health */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              صحة المحتوى
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "منشور", val: stats?.publishedNews || 0, total: stats?.totalNews || 1, color: "bg-green-500" },
              { label: "مجدول", val: stats?.scheduledNews || 0, total: stats?.totalNews || 1, color: "bg-blue-500" },
              { label: "مسودة", val: stats?.draftNews || 0, total: stats?.totalNews || 1, color: "bg-amber-400" },
              { label: "مميّز", val: stats?.featuredNews || 0, total: stats?.totalNews || 1, color: "bg-purple-500" },
              { label: "غير مصنّف", val: stats?.miscNews || 0, total: stats?.totalNews || 1, color: "bg-red-400" },
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-semibold">{r.val} <span className="text-muted-foreground font-normal">({Math.round((r.val / r.total) * 100)}%)</span></span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${r.color} transition-all duration-700`} style={{ width: `${Math.round((r.val / r.total) * 100)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Country Distribution ────────────────────────────────────────── */}
      <Card className="border-0 shadow-md" data-testid="card-country-stats">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600" />
            توزيع الزوار حسب الدولة
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 mr-auto">آخر 30 يوم</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {countryLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : countryStats && countryStats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={countryStats.slice(0, 10)} layout="vertical" margin={{ right: 10, left: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 9, fill: "gray" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="countryName" type="category" tick={{ fontSize: 11, fill: "gray" }} axisLine={false} tickLine={false} width={75} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="views" name="مشاهدات" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                {countryStats.map((c, i) => {
                  const maxViews = countryStats[0]?.views || 1;
                  const pct = Math.round((c.views / maxViews) * 100);
                  return (
                    <div key={c.countryCode} className="flex items-center gap-2 group" data-testid={`country-row-${c.countryCode}`}>
                      <span className="text-xs font-medium w-5 text-muted-foreground">{i + 1}</span>
                      <span className="text-lg leading-none" role="img" aria-label={c.countryName}>
                        {String.fromCodePoint(...c.countryCode.split('').map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65))}
                      </span>
                      <span className="text-sm font-medium flex-1 truncate">{c.countryName}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[100px]">
                        <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold tabular-nums min-w-[40px] text-left">{formatNumber(c.views)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground text-sm space-y-2">
              <Globe className="h-8 w-8 mx-auto opacity-30" />
              <p>لا توجد بيانات جغرافية بعد</p>
              <p className="text-xs">ستظهر البيانات تلقائياً مع زيادة المشاهدات</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Referrer Sources ─────────────────────────────────────────────── */}
      <Card className="border-0 shadow-md" data-testid="card-referrer-stats">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-violet-600" />
            من أين يأتي الزوار؟
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 mr-auto">آخر 30 يوم</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrerLoading ? (
            <div className="h-32 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : referrerStats && referrerStats.length > 0 ? (() => {
            const totalViews = referrerStats.reduce((sum, r) => sum + r.views, 0);
            const SOURCE_META: Record<string, { icon: string; color: string }> = {
              google: { icon: "🔍", color: "#3b82f6" },
              google_news: { icon: "📰", color: "#60a5fa" },
              bing: { icon: "🔎", color: "#14b8a6" },
              yahoo: { icon: "🔎", color: "#a855f7" },
              yandex: { icon: "🔎", color: "#f87171" },
              duckduckgo: { icon: "🦆", color: "#fb923c" },
              direct: { icon: "🔗", color: "#22c55e" },
              twitter: { icon: "𝕏", color: "#1d9bf0" },
              facebook: { icon: "📘", color: "#1877f2" },
              instagram: { icon: "📸", color: "#e4405f" },
              tiktok: { icon: "🎵", color: "#25f4ee" },
              snapchat: { icon: "👻", color: "#fffc00" },
              linkedin: { icon: "💼", color: "#0a66c2" },
              youtube: { icon: "▶️", color: "#ff0000" },
              telegram: { icon: "✈️", color: "#0088cc" },
              whatsapp: { icon: "💬", color: "#25d366" },
              reddit: { icon: "🤖", color: "#ff4500" },
              other: { icon: "🌐", color: "#9ca3af" },
            };
            return (
              <div className="space-y-2.5">
                {referrerStats.map((r) => {
                  const pct = Math.round((r.views / totalViews) * 100);
                  const meta = SOURCE_META[r.source] || SOURCE_META.other;
                  return (
                    <div key={r.source} data-testid={`referrer-row-${r.source}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm leading-none">{meta.icon}</span>
                          <span className="text-xs font-medium">{r.sourceLabel}</span>
                        </div>
                        <span className="text-xs font-bold">{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })() : (
            <div className="text-center py-8 text-muted-foreground text-sm space-y-1">
              <ArrowUpRight className="h-7 w-7 mx-auto opacity-30" />
              <p>لا توجد بيانات بعد</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Recent News ─────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              آخر الأخبار المنشورة
            </CardTitle>
            {onNavigate && (
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => onNavigate("news")}>
                عرض الكل <ChevronRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!recentNews ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(Array.isArray(recentNews) ? recentNews : []).slice(0, 6).map((item: any) => (
                <div key={item.id} className="py-2.5 flex items-start gap-3 group hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="" className="w-12 h-10 object-cover rounded-lg shrink-0 bg-muted" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug line-clamp-1 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Eye className="h-2.5 w-2.5" />
                        {formatNumber(item.viewCount || 0)}
                      </span>
                      {item.todayViews > 0 && (
                        <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                          <TrendingUp className="h-2.5 w-2.5" />
                          {item.todayViews} اليوم
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(!recentNews || recentNews.length === 0) && (
                <p className="text-muted-foreground text-sm text-center py-6">لا توجد أخبار منشورة</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Editorial Insights */}
      <AIInsightsPanel />

    </div>
  );
}
