import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Radar, Rss, Globe, RefreshCw, Search, XCircle, Play, Plus, FlaskConical,
  ExternalLink, Trash2, Zap, Brain, CheckCircle, AlertTriangle,
  LayoutDashboard, Newspaper, BookOpen, Download, Settings,
  Users, Shield, LogOut, Menu, ChevronRight, ChevronLeft,
  LayoutTemplate, Wand2, TrendingUp, Activity, Clock, Filter,
  CheckSquare, Square,
} from "lucide-react";
import type { RadarSource, RadarItem, RadarKeyword } from "@shared/schema";
import logoImage from "@assets/LOGO-L_1769253692563.png";

/* ─── helpers ─────────────────────────────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
  published: "منشور",
  archived: "مؤرشف",
};

const STATUS_CLASS: Record<string, string> = {
  pending:  "bg-amber-100  text-amber-800  dark:bg-amber-900/30  dark:text-amber-200",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
  rejected: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-200",
  published:"bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-200",
  archived: "bg-muted      text-muted-foreground",
};

const CAT_LABEL: Record<string, string> = {
  "health-news":      "أخبار صحية",
  "saudi-health":     "الصحة السعودية",
  "health-community": "مجتمع صحي",
  "health-reports":   "تقارير صحية",
  "nutrition":        "تغذية",
  "quality-life":     "جودة الحياة",
  "arab-news":        "أخبار عربية",
  "misc":             "منوعات",
};

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("ar-SA", {
    timeZone: "Asia/Riyadh", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

/* ─── SidebarItem (same as AdminDashboard) ─────────────────────────── */
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


/* ─── TranslationPreviewDialog ──────────────────────────────────────── */
type TranslationPreview = {
  id: string;
  titleOrig: string;
  title: string;
  summary: string;
  content: string;
  importance: number;
  keywords: string[];
  category: string;
  isBreaking: boolean;
};
function TranslationPreviewDialog({
  preview,
  onClose,
  onPublish,
  isPublishing,
}: {
  preview: TranslationPreview | null;
  onClose: () => void;
  onPublish: (id: string) => void;
  isPublishing: boolean;
}) {
  return (
    <Dialog open={!!preview} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="max-w-2xl w-full sm:w-[95vw] p-0 gap-0 flex flex-col
          h-[100dvh] sm:h-auto sm:max-h-[92vh]
          top-0 sm:top-[50%] translate-y-0 sm:translate-y-[-50%]
          rounded-none sm:rounded-xl"
        dir="rtl"
      >
        {preview && (
          <>
            {/* Header — fixed */}
            <DialogHeader className="px-4 sm:px-6 pt-5 pb-4 border-b shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-semibold text-violet-700 dark:text-violet-400">معاينة المادة المترجمة</span>
                {preview.isBreaking && (
                  <Badge className="bg-red-100 text-red-700 text-[10px] px-2">عاجل</Badge>
                )}
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold leading-snug text-right">
                {preview.title}
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground mt-1 text-right line-clamp-2">
                العنوان الأصلي: {preview.titleOrig}
              </p>
            </DialogHeader>

            {/* Scrollable body — native scroll for full touch support */}
            <div className="flex-1 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch px-4 sm:px-6 py-5 space-y-5">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="outline" className="text-xs gap-1 border-emerald-300 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="h-3 w-3" />
                  أهمية: {preview.importance} من 10
                </Badge>
                {preview.category && (
                  <Badge variant="outline" className="text-xs text-blue-700 border-blue-200 dark:text-blue-400">
                    {preview.category}
                  </Badge>
                )}
                {preview.keywords.slice(0, 5).map(kw => (
                  <Badge key={kw} variant="secondary" className="text-[10px]">{kw}</Badge>
                ))}
              </div>

              {preview.summary && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">الملخص</p>
                  <p className="text-sm leading-relaxed text-foreground">{preview.summary}</p>
                </div>
              )}

              {preview.content && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">المحتوى الكامل</p>
                  <p className="text-sm leading-loose whitespace-pre-wrap text-foreground/90 pb-2">{preview.content}</p>
                </div>
              )}
            </div>

            {/* Footer — fixed */}
            <div className="px-4 sm:px-6 py-4 border-t shrink-0 flex items-center justify-between gap-3 bg-muted/30">
              <Button variant="outline" onClick={onClose} className="text-sm" data-testid="button-preview-close">
                إغلاق فقط
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-sm"
                onClick={() => { onPublish(preview.id); }}
                disabled={isPublishing}
                data-testid="button-preview-publish"
              >
                {isPublishing
                  ? <RefreshCw className="h-4 w-4 animate-spin" />
                  : <Zap className="h-4 w-4" />}
                نقل إلى المسودات
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
/* ─── StatCard ──────────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number | string; icon: any; color: string;
}) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────────────── */
export default function AdminRadar() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  /* ui state */
  const [activeTab, setActiveTab]           = useState<"items"|"sources"|"keywords">("items");
  const [statusFilter, setStatusFilter]     = useState("pending");
  const [searchQuery, setSearchQuery]       = useState("");
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [processingId, setProcessingId]     = useState<string | null>(null);
  const [translatingId, setTranslatingId]   = useState<string | null>(null);
  const [translationPreview, setTranslationPreview] = useState<TranslationPreview | null>(null);
  const [selected, setSelected]             = useState<Set<string>>(new Set());
  const [showAddSource, setShowAddSource]   = useState(false);
  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [adminUser, setAdminUser]           = useState<{ displayName: string; role: string } | null>(null);

  /* forms */
  const [newSource, setNewSource] = useState({
    name: "", nameAr: "", url: "", type: "rss",
    category: "health-news", language: "ar", priority: 3, reliability: 80,
  });
  const [newKw, setNewKw] = useState({
    keyword: "", keywordAr: "", category: "health-news", weight: 1, isExclude: false,
  });

  /* session */
  useEffect(() => {
    fetch("/api/admin/check-session", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.authenticated && d.displayName) setAdminUser({ displayName: d.displayName, role: d.role }); })
      .catch(() => {});
  }, []);

  /* queries */
  const { data: stats } = useQuery<{ total:number; pending:number; approved:number; rejected:number; published:number }>({
    queryKey: ["/api/radar/items/stats"],
  });
  type RadarQuota = {
    day: string;
    fetchesUsed: number;
    fetchesLimit: number;
    fetchesRemaining: number;
    editsUsed: number;
    editsLimit: number;
    editsRemaining: number;
  };
  const { data: quota } = useQuery<RadarQuota>({
    queryKey: ["/api/radar/quota"],
    refetchInterval: 60_000,
  });
  const fetchBlocked = (quota?.fetchesRemaining ?? 1) <= 0;
  const editBlocked = (quota?.editsRemaining ?? 1) <= 0;
  const quotaErrorMessage = (err: unknown) => {
    const raw = err instanceof Error ? err.message : String(err ?? "");
    const body = raw.replace(/^\d+:\s*/, "");
    try {
      const parsed = JSON.parse(body) as { message?: string };
      if (parsed.message) return parsed.message;
    } catch { /* plain text */ }
    return body || "فشلت العملية";
  };
  const { data: sources, isLoading: srcLoad } = useQuery<RadarSource[]>({
    queryKey: ["/api/radar/sources"],
  });
  const { data: items, isLoading: itemsLoad } = useQuery<RadarItem[]>({
    queryKey: ["/api/radar/items", statusFilter],
    queryFn: async () => {
      const r = await fetch(`/api/radar/items?status=${statusFilter}`);
      if (!r.ok) throw new Error("fetch failed");
      return r.json();
    },
  });
  const { data: keywords, isLoading: kwLoad } = useQuery<RadarKeyword[]>({
    queryKey: ["/api/radar/keywords"],
  });

  /* filtered items */
  const filteredItems = (items || []).filter(it => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (it.titleAr || it.title || "").toLowerCase().includes(q) ||
           (it.summaryAr || it.summary || "").toLowerCase().includes(q);
  });

  /* toggle select */
  const toggleSelect = (id: string) =>
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () =>
    setSelected(selected.size === filteredItems.length ? new Set() : new Set(filteredItems.map(i => i.id)));

  /* mutations */
  const fetchMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/radar/fetch").then(r => r.json()),
    onSuccess: d => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/quota"] });
      toast({ title: "تم جلب الأخبار", description: `${d.totalNewItems} خبر جديد من ${d.successfulSources} مصدر` });
    },
    onError: (err) => toast({ title: "فشل في جلب الأخبار", description: quotaErrorMessage(err), variant: "destructive" }),
  });

  const classifyMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/radar/classify", { limit: 10 }).then(r => r.json()),
    onSuccess: d => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/quota"] });
      toast({ title: "تم التصنيف", description: `تم تصنيف ${d.classified} خبر` });
    },
    onError: (err) => toast({ title: "فشل في التصنيف", description: quotaErrorMessage(err), variant: "destructive" }),
  });

  const cleanupMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/radar/cleanup-non-health").then(r => r.json()),
    onSuccess: d => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items/stats"] });
      toast({ title: "تم التنظيف", description: `حُذف ${d.deleted} خبر غير صحي` });
    },
    onError: () => toast({ title: "فشل في التنظيف", variant: "destructive" }),
  });

  const cleanupReviewedMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/radar/cleanup-reviewed").then(r => r.json()),
    onSuccess: d => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items/stats"] });
      toast({ title: "تم الحذف", description: `حُذف ${d.deleted} خبر مراجع` });
    },
    onError: () => toast({ title: "فشل في الحذف", variant: "destructive" }),
  });

  const deleteSelectedMut = useMutation({
    mutationFn: (ids: string[]) =>
      apiRequest("POST", "/api/radar/items/batch-delete", { ids }).then(r => r.json()),
    onSuccess: (d) => {
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items/stats"] });
      toast({ title: "تم الحذف", description: `حُذف ${d.deleted} خبر` });
    },
    onError: () => toast({ title: "فشل في الحذف", variant: "destructive" }),
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/radar/items/${id}/status`, { status }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items/stats"] });
    },
  });

  const toggleBreakingMut = useMutation({
    mutationFn: ({ id, isBreaking }: { id: string; isBreaking: boolean }) =>
      apiRequest("PATCH", `/api/radar/items/${id}/breaking`, { isBreaking }).then(r => r.json()),
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      toast({ title: v.isBreaking ? "تم تمييزه كخبر عاجل" : "تمت إزالة علامة العاجل" });
    },
    onError: () => toast({ title: "فشل في تحديث الحالة", variant: "destructive" }),
  });

  const translateItemMut = useMutation({
    mutationFn: async ({ id, titleOrig }: { id: string; titleOrig: string }) => {
      setTranslatingId(id);
      const d = await apiRequest("POST", `/api/radar/items/${id}/translate`).then(r => r.json());
      return { id, titleOrig, ...d };
    },
    onSuccess: (d) => {
      setTranslatingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/radar/quota"] });
      const t = d.translation ?? {};
      setTranslationPreview({
        id: d.id,
        titleOrig: d.titleOrig,
        title: t.title ?? "",
        summary: t.summary ?? "",
        content: t.content ?? "",
        importance: t.importanceScore ?? 0,
        keywords: Array.isArray(t.keywords) ? t.keywords : [],
        category: t.category ?? "",
        isBreaking: !!t.isBreaking,
      });
    },
    onError: (err) => {
      setTranslatingId(null);
      toast({ title: "فشل في الترجمة", description: quotaErrorMessage(err), variant: "destructive" });
    },
  });

  const publishTranslatedMut = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/radar/items/${id}/publish`).then(r => r.json()),
    onSuccess: () => {
      setTranslationPreview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items/stats"] });
      toast({ title: "تم نقل المادة إلى المسودات" });
    },
    onError: () => toast({ title: "فشل في النشر", variant: "destructive" }),
  });

  const processAndPublishMut = useMutation({
    mutationFn: async (id: string) => {
      setProcessingId(id);
      return apiRequest("POST", `/api/radar/items/${id}/process-and-publish`).then(r => r.json());
    },
    onSuccess: d => {
      setProcessingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/quota"] });
      toast({ title: "تم إنشاء المسودة", description: d.imageUploaded ? "مع رفع الصورة" : "بدون صورة" });
    },
    onError: (err) => {
      setProcessingId(null);
      toast({ title: "فشل في المعالجة", description: quotaErrorMessage(err), variant: "destructive" });
    },
  });

  const batchTranslateMut = useMutation({
    mutationFn: (ids: string[]) => apiRequest("POST", "/api/radar/batch-translate", { itemIds: ids }).then(r => r.json()),
    onSuccess: d => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/quota"] });
      const ok = d.results?.filter((r: any) => r.success).length || 0;
      toast({ title: "ترجمة جماعية", description: `تمت ترجمة ${ok} خبر` });
    },
    onError: (err) => toast({ title: "فشل في الترجمة الجماعية", description: quotaErrorMessage(err), variant: "destructive" }),
  });

  const evaluateMut = useMutation({
    mutationFn: (ids: string[]) => apiRequest("POST", "/api/radar/evaluate", { itemIds: ids }).then(r => r.json()),
    onSuccess: d => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/quota"] });
      toast({ title: "تم التقييم", description: `تم تقييم ${d.evaluations?.length || 0} خبر` });
    },
    onError: (err) => toast({ title: "فشل في التقييم", description: quotaErrorMessage(err), variant: "destructive" }),
  });

  const seedMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/radar/seed").then(r => r.json()),
    onSuccess: d => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/sources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/keywords"] });
      toast({ title: "تمت إضافة البيانات الافتراضية", description: `${d.sourcesAdded} مصدر، ${d.keywordsAdded} كلمة` });
    },
    onError: () => toast({ title: "فشل في الإضافة", variant: "destructive" }),
  });

  const addSourceMut = useMutation({
    mutationFn: (s: typeof newSource) => apiRequest("POST", "/api/radar/sources", s).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/sources"] });
      setShowAddSource(false);
      setNewSource({ name:"", nameAr:"", url:"", type:"rss", category:"health-news", language:"ar", priority:3, reliability:80 });
      toast({ title: "تم إضافة المصدر" });
    },
    onError: () => toast({ title: "فشل في الإضافة", variant: "destructive" }),
  });

  const deleteSourceMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/radar/sources/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/radar/sources"] }); toast({ title: "تم حذف المصدر" }); },
  });

  const addKwMut = useMutation({
    mutationFn: (d: typeof newKw) => apiRequest("POST", "/api/radar/keywords", d).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/keywords"] });
      setShowAddKeyword(false);
      setNewKw({ keyword:"", keywordAr:"", category:"health-news", weight:1, isExclude:false });
      toast({ title: "تمت إضافة الكلمة" });
    },
    onError: () => toast({ title: "فشل في الإضافة", variant: "destructive" }),
  });

  const deleteKwMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/radar/keywords/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/radar/keywords"] }); toast({ title: "تم الحذف" }); },
  });

  const navigateTo = (path: string) => {
    setSidebarOpen(false);
    setLocation(path);
  };

  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout").catch(() => {});
    localStorage.removeItem("adminAuthenticated");
    setLocation("/admin/login");
  };

  /* ── Sidebar ── */
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
              <p className="text-[10px] text-white/50">مرحباً بك 👋</p>
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
              <SidebarItem icon={Radar} label="رادار الأخبار" active count={stats?.pending} onClick={() => navigateTo("/admin/radar")} />
              <SidebarItem icon={TrendingUp} label="رادار الترند الصحي" onClick={() => navigateTo("/admin/trends")} />
              <SidebarItem icon={Download} label="استيراد الأخبار" onClick={() => navigateTo("/admin/import")} />
              <SidebarItem icon={LayoutTemplate} label="توليد إنفوجرافيك" onClick={() => navigateTo("/admin/infographic")} />
              <SidebarItem icon={Wand2} label="إعدادات التوليد" onClick={() => navigateTo("/admin/generation-settings")} />
              <SidebarItem icon={FlaskConical} label="مفنّد الشائعات" onClick={() => navigateTo("/admin/rumors")} />
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

  /* ── Status filter pills ── */
  const STATUS_TABS = [
    { key: "pending",  label: "قيد المراجعة", count: stats?.pending,  color: "amber" },
    { key: "approved", label: "معتمدة",       count: stats?.approved, color: "emerald" },
    { key: "rejected", label: "مرفوضة",       count: stats?.rejected, color: "red" },
    { key: "published",label: "منشورة",       count: stats?.published,color: "blue" },
    { key: "archived", label: "مؤرشفة",       count: undefined,      color: "gray" },
  ] as const;

  const MAIN_TABS = [
    { key: "items",    label: "الأخبار المجمعة", icon: Activity },
    { key: "sources",  label: "المصادر",         icon: Rss },
    { key: "keywords", label: "الكلمات المفتاحية", icon: Search },
  ] as const;

  /* ── render ── */
  return (
    <div className="min-h-screen bg-muted/30 overflow-x-hidden w-full" dir="rtl">

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card border-b px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0 flex flex-col">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <img src={logoImage} alt="كبسولة" className="h-7 shrink-0" />
          <span className="text-sm font-bold text-emerald-700 truncate">رادار الأخبار</span>
        </div>
        <Link href="/">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      <div className="flex w-full">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 min-h-screen bg-card border-l fixed right-0 top-0 z-40 flex-col">
          <SidebarContent />
        </aside>

        {/* Main */}
        <main className="flex-1 lg:mr-64 p-3 md:p-6 w-full max-w-full overflow-x-hidden">

          {/* Page header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                <Radar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold leading-tight">رادار الأخبار</h1>
                <p className="text-xs text-muted-foreground">مراقبة وجمع الأخبار الصحية تلقائياً</p>
              </div>
            </div>
            {/* Primary actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {quota && (
                <div
                  className="text-xs text-muted-foreground bg-muted/60 border rounded-lg px-2.5 py-1.5 leading-relaxed"
                  data-testid="radar-daily-quota"
                  title="الحد اليومي بتوقيت الرياض"
                >
                  <span className={fetchBlocked ? "text-destructive font-medium" : ""}>
                    جلب {quota.fetchesUsed}/{quota.fetchesLimit}
                  </span>
                  <span className="mx-1.5 text-border">|</span>
                  <span className={editBlocked ? "text-destructive font-medium" : ""}>
                    تحرير AI {quota.editsUsed}/{quota.editsLimit}
                  </span>
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => classifyMut.mutate()}
                disabled={classifyMut.isPending || editBlocked}
                data-testid="button-classify"
                className="gap-1.5"
                title={editBlocked ? "انتهى حد التحرير اليومي" : undefined}
              >
                <Brain className={`h-4 w-4 ${classifyMut.isPending ? "animate-pulse" : ""}`} />
                تصنيف ذكي
              </Button>
              <Button
                size="sm"
                onClick={() => fetchMut.mutate()}
                disabled={fetchMut.isPending || fetchBlocked}
                data-testid="button-fetch-all"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                title={fetchBlocked ? "انتهى حد الجلب اليومي (مرتان)" : undefined}
              >
                <RefreshCw className={`h-4 w-4 ${fetchMut.isPending ? "animate-spin" : ""}`} />
                {fetchMut.isPending ? "جاري الجلب..." : fetchBlocked ? "اكتمل جلب اليوم" : "جلب الأخبار"}
              </Button>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="إجمالي الأخبار"  value={stats?.total    || 0} icon={Activity}     color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" />
            <StatCard label="قيد المراجعة"    value={stats?.pending  || 0} icon={Clock}        color="bg-amber-100   text-amber-700   dark:bg-amber-900/30" />
            <StatCard label="منشورة كمسودة"   value={stats?.published|| 0} icon={CheckCircle}  color="bg-blue-100    text-blue-700    dark:bg-blue-900/30" />
            <StatCard label="مصادر نشطة"      value={sources?.filter(s=>s.isActive).length || 0} icon={Rss} color="bg-violet-100 text-violet-700 dark:bg-violet-900/30" />
          </div>

          {/* Main tabs */}
          <div className="flex items-center gap-1 mb-4 border-b pb-2">
            {MAIN_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === t.key
                    ? "bg-emerald-100/70 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* ──────────── TAB: ITEMS ──────────── */}
          {activeTab === "items" && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status filter pills */}
                <div className="flex items-center gap-1 flex-wrap">
                  {STATUS_TABS.map(s => (
                    <button
                      key={s.key}
                      onClick={() => { setStatusFilter(s.key); setSelected(new Set()); }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                        statusFilter === s.key
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-card text-muted-foreground border-border/50 hover:border-emerald-300 hover:text-foreground"
                      }`}
                    >
                      {s.label}
                      {s.count !== undefined && (
                        <span className={`text-[10px] px-1 rounded ${statusFilter === s.key ? "bg-white/20 text-white" : "bg-muted"}`}>
                          {s.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex-1 min-w-[160px] max-w-xs relative">
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="بحث في الأخبار..."
                    className="w-full h-8 pr-8 pl-3 text-xs rounded-lg border border-border/50 bg-card focus:outline-none focus:border-emerald-400"
                    data-testid="input-radar-search"
                  />
                </div>

                {/* Bulk actions when items selected */}
                {selected.size > 0 && (
                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{selected.size} محدد</span>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 text-xs gap-1"
                      onClick={() => batchTranslateMut.mutate(Array.from(selected))}
                      disabled={batchTranslateMut.isPending || editBlocked}
                      title={editBlocked ? "انتهى حد التحرير اليومي" : undefined}
                    >
                      <Brain className="h-3.5 w-3.5" />ترجمة
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 text-xs gap-1"
                      onClick={() => evaluateMut.mutate(Array.from(selected))}
                      disabled={evaluateMut.isPending || editBlocked}
                      title={editBlocked ? "انتهى حد التحرير اليومي" : undefined}
                    >
                      <Zap className="h-3.5 w-3.5" />تقييم
                    </Button>
                    <div className="w-px h-4 bg-emerald-200 dark:bg-emerald-700 mx-0.5" />
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 text-xs gap-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700"
                      onClick={() => { if (confirm(`حذف ${selected.size} خبر محدد؟`)) deleteSelectedMut.mutate(Array.from(selected)); }}
                      disabled={deleteSelectedMut.isPending}
                      data-testid="button-delete-selected"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deleteSelectedMut.isPending ? "جاري الحذف..." : "حذف المحدد"}
                    </Button>
                  </div>
                )}

                {/* Cleanup buttons */}
                <div className="flex items-center gap-1 mr-auto">
                  <Button
                    size="sm" variant="ghost"
                    className="h-8 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1"
                    onClick={() => { if (confirm("حذف كل الأخبار غير الصحية؟")) cleanupMut.mutate(); }}
                    disabled={cleanupMut.isPending}
                    data-testid="button-cleanup"
                  >
                    <Trash2 className="h-3.5 w-3.5" />غير صحي
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    className="h-8 text-xs text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 gap-1"
                    onClick={() => { if (confirm("حذف كل الأخبار المراجعة؟")) cleanupReviewedMut.mutate(); }}
                    disabled={cleanupReviewedMut.isPending}
                    data-testid="button-cleanup-reviewed"
                  >
                    <Trash2 className="h-3.5 w-3.5" />المراجعة
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                {itemsLoad ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                    <Radar className="h-12 w-12 opacity-20" />
                    <p className="text-sm">لا توجد أخبار في هذه الفئة</p>
                    <Button variant="outline" size="sm" onClick={() => fetchMut.mutate()} disabled={fetchBlocked || fetchMut.isPending}>
                      <RefreshCw className="h-4 w-4 ml-2" />{fetchBlocked ? "اكتمل جلب اليوم" : "جلب أخبار جديدة"}
                    </Button>
                  </div>
                ) : (
                  <table className="w-full text-sm" dir="rtl">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="p-3 w-9">
                          <button onClick={toggleAll} className="text-muted-foreground hover:text-primary">
                            {selected.size === filteredItems.length && filteredItems.length > 0
                              ? <CheckSquare className="h-4 w-4 text-primary" />
                              : <Square className="h-4 w-4" />}
                          </button>
                        </th>
                        <th className="p-3 text-right font-medium text-muted-foreground text-xs">الخبر</th>
                        <th className="p-3 text-right font-medium text-muted-foreground text-xs hidden md:table-cell w-24">التصنيف</th>
                        <th className="p-3 text-center font-medium text-muted-foreground text-xs hidden md:table-cell w-24">الحالة</th>
                        <th className="p-3 text-center font-medium text-muted-foreground text-xs hidden lg:table-cell w-20">الأهمية</th>
                        <th className="p-3 text-right font-medium text-muted-foreground text-xs hidden lg:table-cell w-32">التاريخ</th>
                        <th className="p-3 text-center font-medium text-muted-foreground text-xs w-28">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredItems.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={`group transition-colors ${item.isBreaking ? "bg-red-50/60 dark:bg-red-950/20 hover:bg-red-100/60 dark:hover:bg-red-950/30 border-r-[3px] border-r-red-500" : "hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"} ${selected.has(item.id) ? "bg-primary/5" : ""}`}
                          data-testid={`row-radar-${idx}`}
                        >
                          {/* Checkbox */}
                          <td className="p-3">
                            <button onClick={() => toggleSelect(item.id)} className="text-muted-foreground hover:text-primary">
                              {selected.has(item.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                            </button>
                          </td>

                          {/* Title */}
                          <td className="p-3">
                            <div className="flex items-start gap-3">
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl} alt=""
                                  className="w-11 h-11 object-cover rounded-lg shrink-0 hidden sm:block bg-muted border border-border/50"
                                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {item.isBreaking && (
                                    <span className="inline-flex items-center gap-0.5 bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 animate-pulse">
                                      <AlertTriangle className="h-3 w-3" />
                                      عاجل
                                    </span>
                                  )}
                                  <p className={`font-semibold line-clamp-2 leading-snug text-[13px] transition-colors ${item.isBreaking ? "text-red-700 dark:text-red-400 group-hover:text-red-800 dark:group-hover:text-red-300" : "text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400"}`}>
                                    {item.titleAr || item.title}
                                  </p>
                                </div>
                                {(item.summaryAr || item.summary) && (
                                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                    {item.summaryAr || item.summary}
                                  </p>
                                )}
                                {/* Mobile metadata */}
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground md:hidden flex-wrap">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium ${STATUS_CLASS[item.status]}`}>
                                    {STATUS_LABEL[item.status]}
                                  </span>
                                  {item.titleAr && (
                                    <span className="bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 px-1.5 py-0.5 rounded-md text-[10px]">مترجم</span>
                                  )}
                                  <span>{fmtDate(item.publishedAt || item.fetchedAt)}</span>
                                </div>
                                {/* Source */}
                                {item.originalUrl && (
                                  <a
                                    href={item.originalUrl} target="_blank" rel="noopener noreferrer"
                                    className="text-[10px] text-muted-foreground/60 hover:text-emerald-600 flex items-center gap-0.5 mt-0.5 truncate max-w-[200px]"
                                  >
                                    <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                    {new URL(item.originalUrl).hostname.replace("www.", "").slice(0, 30)}
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="p-3 hidden md:table-cell">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-medium bg-muted text-muted-foreground">
                              {CAT_LABEL[item.category || ""] || item.category || "—"}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="p-3 text-center hidden md:table-cell">
                            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-medium ${STATUS_CLASS[item.status]}`}>
                              {STATUS_LABEL[item.status]}
                            </span>
                            {item.titleAr && (
                              <span className="block mt-1 text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 px-1.5 py-0.5 rounded-md">مترجم</span>
                            )}
                          </td>

                          {/* Importance */}
                          <td className="p-3 text-center hidden lg:table-cell">
                            {item.relevanceScore ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className={`text-sm font-bold ${item.relevanceScore >= 70 ? "text-emerald-600" : item.relevanceScore >= 40 ? "text-amber-600" : "text-muted-foreground"}`}>
                                  {item.relevanceScore}%
                                </span>
                                <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${item.relevanceScore >= 70 ? "bg-emerald-500" : item.relevanceScore >= 40 ? "bg-amber-500" : "bg-muted-foreground/40"}`}
                                    style={{ width: `${item.relevanceScore}%` }}
                                  />
                                </div>
                              </div>
                            ) : <span className="text-muted-foreground/40 text-xs">—</span>}
                          </td>

                          {/* Date */}
                          <td className="p-3 hidden lg:table-cell">
                            <p className="text-[11px] text-muted-foreground">{fmtDate(item.publishedAt || item.fetchedAt)}</p>
                          </td>

                          {/* Actions */}
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              <Button
                                size="icon" variant="ghost"
                                className={`h-7 w-7 ${item.isBreaking ? "text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50" : "text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"}`}
                                onClick={() => toggleBreakingMut.mutate({ id: item.id, isBreaking: !item.isBreaking })}
                                title={item.isBreaking ? "إزالة علامة عاجل" : "تمييز كخبر عاجل"}
                                data-testid={`button-breaking-${item.id}`}
                              >
                                <AlertTriangle className="h-3.5 w-3.5" />
                              </Button>
                              {/* Translate only — shows result in row before publishing */}
                              {item.status !== "published" && item.status !== "rejected" && !item.titleAr && (
                                <Button
                                  size="icon" variant="ghost"
                                  className="h-7 w-7 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                                  onClick={() => translateItemMut.mutate({ id: item.id, titleOrig: item.title })}
                                  disabled={translatingId === item.id || processingId === item.id || editBlocked}
                                  title={editBlocked ? "انتهى حد التحرير اليومي" : "ترجمة فقط (لمراجعة النص قبل النشر)"}
                                  data-testid={`button-translate-${item.id}`}
                                >
                                  {translatingId === item.id
                                    ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    : <Brain className="h-3.5 w-3.5" />}
                                </Button>
                              )}
                              {/* Publish as draft */}
                              {item.status !== "published" && item.status !== "rejected" && (
                                <Button
                                  size="sm"
                                  className="h-7 text-[11px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2"
                                  onClick={() => processAndPublishMut.mutate(item.id)}
                                  disabled={processingId === item.id || translatingId === item.id || (!item.titleAr && editBlocked)}
                                  title={!item.titleAr && editBlocked ? "انتهى حد التحرير اليومي" : "ترجمة ونشر مسودة"}
                                  data-testid={`button-publish-${item.id}`}
                                >
                                  {processingId === item.id
                                    ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    : <Zap className="h-3.5 w-3.5" />}
                                  <span className="hidden sm:inline">نشر مسودة</span>
                                </Button>
                              )}
                              {item.status === "published" && (
                                <span className="text-[11px] text-blue-600 flex items-center gap-0.5">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">منشور</span>
                                </span>
                              )}
                              {item.status !== "published" && (
                                <Button
                                  size="icon" variant="ghost"
                                  className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  onClick={() => updateStatusMut.mutate({ id: item.id, status: "rejected" })}
                                  title="رفض"
                                  data-testid={`button-reject-${item.id}`}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {filteredItems.length > 0 && (
                <p className="text-xs text-muted-foreground text-left">
                  {filteredItems.length} خبر
                  {selected.size > 0 && ` — ${selected.size} محدد`}
                </p>
              )}
            </div>
          )}

          {/* ──────────── TAB: SOURCES ──────────── */}
          {activeTab === "sources" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm" variant="outline"
                    onClick={() => seedMut.mutate()}
                    disabled={seedMut.isPending}
                    data-testid="button-seed"
                    className="gap-1.5"
                  >
                    <Plus className="h-4 w-4" />بيانات افتراضية
                  </Button>
                </div>
                <Dialog open={showAddSource} onOpenChange={setShowAddSource}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-source" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Plus className="h-4 w-4" />إضافة مصدر
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>إضافة مصدر جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">الاسم (إنجليزي)</Label>
                          <Input value={newSource.name} onChange={e => setNewSource({...newSource, name: e.target.value})} placeholder="WHO News" data-testid="input-source-name" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">الاسم (عربي)</Label>
                          <Input value={newSource.nameAr} onChange={e => setNewSource({...newSource, nameAr: e.target.value})} placeholder="منظمة الصحة" data-testid="input-source-name-ar" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">رابط RSS</Label>
                        <Input value={newSource.url} onChange={e => setNewSource({...newSource, url: e.target.value})} placeholder="https://example.com/rss" dir="ltr" data-testid="input-source-url" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">التصنيف</Label>
                          <Select value={newSource.category} onValueChange={v => setNewSource({...newSource, category: v})}>
                            <SelectTrigger data-testid="select-source-category"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(CAT_LABEL).map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">اللغة</Label>
                          <Select value={newSource.language} onValueChange={v => setNewSource({...newSource, language: v})}>
                            <SelectTrigger data-testid="select-source-language"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ar">العربية</SelectItem>
                              <SelectItem value="en">الإنجليزية</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">الأولوية (1-5)</Label>
                          <Input type="number" min={1} max={5} value={newSource.priority} onChange={e => setNewSource({...newSource, priority: parseInt(e.target.value)})} data-testid="input-source-priority" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">الموثوقية (%)</Label>
                          <Input type="number" min={0} max={100} value={newSource.reliability} onChange={e => setNewSource({...newSource, reliability: parseInt(e.target.value)})} data-testid="input-source-reliability" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => addSourceMut.mutate(newSource)} disabled={!newSource.name || !newSource.url || addSourceMut.isPending} data-testid="button-save-source">
                        {addSourceMut.isPending ? "جاري الحفظ..." : "حفظ"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                {srcLoad ? (
                  <div className="p-4 space-y-3">{[...Array(4)].map((_,i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
                ) : !sources?.length ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                    <Rss className="h-10 w-10 opacity-20" />
                    <p className="text-sm">لا توجد مصادر مضافة</p>
                    <Button variant="outline" size="sm" onClick={() => seedMut.mutate()}>إضافة مصادر افتراضية</Button>
                  </div>
                ) : (
                  <table className="w-full text-sm" dir="rtl">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="p-3 text-right font-medium text-muted-foreground text-xs">المصدر</th>
                        <th className="p-3 text-right font-medium text-muted-foreground text-xs hidden md:table-cell w-20">النوع</th>
                        <th className="p-3 text-right font-medium text-muted-foreground text-xs hidden md:table-cell w-28">التصنيف</th>
                        <th className="p-3 text-center font-medium text-muted-foreground text-xs w-16">الحالة</th>
                        <th className="p-3 text-center font-medium text-muted-foreground text-xs hidden lg:table-cell w-16">الأخبار</th>
                        <th className="p-3 text-right font-medium text-muted-foreground text-xs hidden lg:table-cell w-36">آخر جلب</th>
                        <th className="p-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {sources?.map(src => (
                        <tr key={src.id} className="group hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                          <td className="p-3">
                            <p className="font-semibold text-[13px]">{src.nameAr || src.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[200px]" dir="ltr">{src.url}</p>
                            <div className="flex items-center gap-2 mt-0.5 md:hidden">
                              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{src.type?.toUpperCase()}</span>
                              <span className="text-[10px] text-muted-foreground">{CAT_LABEL[src.category||""]||src.category}</span>
                            </div>
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            <span className="text-[11px] bg-muted text-muted-foreground px-2 py-1 rounded-lg">{src.type?.toUpperCase()}</span>
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            <span className="text-[11px] text-muted-foreground">{CAT_LABEL[src.category||""]||src.category}</span>
                          </td>
                          <td className="p-3 text-center">
                            {src.isActive
                              ? <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-0.5 rounded-lg"><CheckCircle className="h-3 w-3" />نشط</span>
                              : <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-lg">متوقف</span>
                            }
                            {src.lastFetchStatus === "error" && (
                              <p className="text-[10px] text-red-500 mt-0.5">خطأ</p>
                            )}
                          </td>
                          <td className="p-3 text-center hidden lg:table-cell">
                            <span className="text-sm font-semibold">{src.itemsCount || 0}</span>
                          </td>
                          <td className="p-3 hidden lg:table-cell">
                            <p className="text-[11px] text-muted-foreground">{fmtDate(src.lastFetchAt)}</p>
                          </td>
                          <td className="p-3">
                            <Button
                              size="icon" variant="ghost"
                              className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => { if (confirm("حذف هذا المصدر؟")) deleteSourceMut.mutate(src.id); }}
                              data-testid={`button-delete-source-${src.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ──────────── TAB: KEYWORDS ──────────── */}
          {activeTab === "keywords" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  الكلمات المستخدمة لتصفية الأخبار الصحية وتصنيفها
                </p>
                <Dialog open={showAddKeyword} onOpenChange={setShowAddKeyword}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-keyword" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Plus className="h-4 w-4" />إضافة كلمة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>إضافة كلمة مفتاحية</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">الكلمة (إنجليزي / عربي)</Label>
                          <Input value={newKw.keyword} onChange={e => setNewKw({...newKw, keyword: e.target.value})} placeholder="diabetes" data-testid="input-keyword" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">الكلمة بالعربي</Label>
                          <Input value={newKw.keywordAr} onChange={e => setNewKw({...newKw, keywordAr: e.target.value})} placeholder="سكري" data-testid="input-keyword-ar" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">التصنيف</Label>
                          <Select value={newKw.category} onValueChange={v => setNewKw({...newKw, category: v})}>
                            <SelectTrigger data-testid="select-keyword-category"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(CAT_LABEL).map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">الوزن (1-10)</Label>
                          <Input type="number" min={1} max={10} value={newKw.weight} onChange={e => setNewKw({...newKw, weight: parseInt(e.target.value)||1})} data-testid="input-keyword-weight" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl border">
                        <div>
                          <p className="text-sm font-medium">كلمة استبعاد</p>
                          <p className="text-xs text-muted-foreground">يُرفض كل خبر يحتوي على هذه الكلمة</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewKw({...newKw, isExclude: !newKw.isExclude})}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${newKw.isExclude ? "bg-destructive" : "bg-muted"}`}
                          data-testid="toggle-keyword-exclude"
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newKw.isExclude ? "translate-x-1" : "translate-x-6"}`} />
                        </button>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => addKwMut.mutate(newKw)} disabled={!newKw.keyword || addKwMut.isPending} data-testid="button-save-keyword">
                        {addKwMut.isPending ? "جاري الحفظ..." : "حفظ"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {kwLoad ? (
                <div className="flex flex-wrap gap-2">{[...Array(10)].map((_,i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}</div>
              ) : !keywords?.length ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3 bg-card border border-border/50 rounded-xl">
                  <Search className="h-10 w-10 opacity-20" />
                  <p className="text-sm">لا توجد كلمات مفتاحية</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => seedMut.mutate()}>إضافة افتراضية</Button>
                    <Button size="sm" onClick={() => setShowAddKeyword(true)}><Plus className="h-4 w-4 ml-2" />إضافة كلمة</Button>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  {/* Group by exclude / include */}
                  {[false, true].map(isExclude => {
                    const group = keywords.filter(k => !!k.isExclude === isExclude);
                    if (!group.length) return null;
                    return (
                      <div key={String(isExclude)} className="mb-4 last:mb-0">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2 px-1">
                          {isExclude ? "كلمات الاستبعاد" : "كلمات التصفية"}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {group.map(kw => (
                            <div
                              key={kw.id}
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                                isExclude
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                                  : "bg-emerald-100/60 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                              }`}
                              data-testid={`keyword-badge-${kw.id}`}
                            >
                              <span>{kw.keywordAr || kw.keyword}</span>
                              {kw.weight && kw.weight > 1 && (
                                <span className="opacity-50">×{kw.weight}</span>
                              )}
                              <button
                                onClick={() => deleteKwMut.mutate(kw.id)}
                                disabled={deleteKwMut.isPending}
                                className="opacity-40 hover:opacity-100 transition-opacity"
                                title="حذف"
                                data-testid={`button-delete-keyword-${kw.id}`}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </main>

      <TranslationPreviewDialog
        preview={translationPreview}
        onClose={() => setTranslationPreview(null)}
        onPublish={(id) => { publishTranslatedMut.mutate(id); }}
        isPublishing={publishTranslatedMut.isPending}
      />

      </div>
    </div>
  );
}
