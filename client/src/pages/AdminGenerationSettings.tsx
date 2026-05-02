import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Settings, Save, Loader2, Wand2,
  TrendingUp, Image as ImageIcon, LayoutTemplate, AlertCircle,
  LayoutDashboard, Newspaper, BookOpen, Download, Shield,
  Users, Radar, Globe, LogOut, Menu, ChevronLeft, FlaskConical,
  Cpu, Zap, CheckCircle, SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import logoImage from "@assets/LOGO-L_1769253692563.png";

/* ─── types ─────────────────────────────────────────────────────── */
interface GenerationSettings {
  id: string;
  monthlyQuota: number;
  defaultGenerationType: string;
  defaultQuality: string;
  defaultSize: string;
  enabledModels: string[];
  maxPromptLength: number;
  autoGenerateFromContent: boolean;
}

interface UsageData {
  images: number;
  infographics: number;
  credits: number;
  month: string;
  quota: number;
  remaining: number;
}

/* ─── static data ─────────────────────────────────────────────── */
const GEN_TYPES = [
  { value: "realistic", label: "واقعي",  desc: "تصوير فوتوغرافي احترافي" },
  { value: "artistic",  label: "فني",    desc: "رسم فني وألوان إبداعية" },
  { value: "hybrid",    label: "هجين",   desc: "مزيج بين الواقعية والفن" },
];
const SIZES = [
  { value: "1024x1024", label: "مربع (1024×1024)" },
  { value: "1792x1024", label: "أفقي (1792×1024)" },
  { value: "1024x1792", label: "عمودي (1024×1792)" },
];
const QUALITIES = [
  { value: "standard", label: "قياسي — أسرع" },
  { value: "hd",       label: "عالي الدقة HD — أفضل جودة" },
];

/* ─── SidebarItem (identical to AdminDashboard) ──────────────── */
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
      {active && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-600 rounded-full" />}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
        active ? "bg-emerald-600 text-white" : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
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

/* ─── SettingRow helper ─────────────────────────────────────── */
function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-border/50 last:border-0">
      <div className="min-w-0">
        <p className="text-[13px] font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ─── StatTile ──────────────────────────────────────────────── */
function StatTile({ label, value, sub, icon: Icon, color, progress }: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string; progress?: number;
}) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="text-right min-w-0">
          <p className="text-2xl font-bold leading-none">{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progress >= 80 ? "bg-red-500" : progress >= 50 ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Component ────────────────────────────────────────────── */
export default function AdminGenerationSettings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ displayName: string; role: string } | null>(null);
  const [formData, setFormData] = useState<Partial<GenerationSettings>>({});

  useEffect(() => {
    fetch("/api/admin/check-session", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.authenticated && d.displayName) setAdminUser({ displayName: d.displayName, role: d.role }); })
      .catch(() => {});
  }, []);

  const { data: settings, isLoading: settingsLoading } = useQuery<GenerationSettings>({
    queryKey: ["/api/admin/generation/settings"],
  });
  const { data: usage, isLoading: usageLoading } = useQuery<UsageData>({
    queryKey: ["/api/admin/generation/usage"],
  });
  const { data: imageHistory } = useQuery<any[]>({
    queryKey: ["/api/admin/generation/images"],
  });

  useEffect(() => { if (settings) setFormData(settings); }, [settings]);

  const saveMut = useMutation({
    mutationFn: (data: Partial<GenerationSettings>) =>
      apiRequest("PUT", "/api/admin/generation/settings", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generation/settings"] });
      toast({ title: "تم حفظ الإعدادات" });
    },
    onError: () => toast({ title: "فشل في الحفظ", variant: "destructive" }),
  });

  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout").catch(() => {});
    localStorage.removeItem("adminAuthenticated");
    setLocation("/admin/login");
  };

  const navigateTo = (p: string) => { setSidebarOpen(false); setLocation(p); };

  const usedCredits = usage ? usage.quota - usage.remaining : 0;
  const usagePct    = usage ? Math.round((usedCredits / usage.quota) * 100) : 0;

  /* ── Sidebar ─────────────────────────────────────────────── */
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
              <SidebarItem icon={Radar} label="رادار الأخبار" onClick={() => navigateTo("/admin/radar")} />
              <SidebarItem icon={Download} label="استيراد الأخبار" onClick={() => navigateTo("/admin/import")} />
              <SidebarItem icon={LayoutTemplate} label="توليد إنفوجرافيك" onClick={() => navigateTo("/admin/infographic")} />
              <SidebarItem icon={Wand2} label="إعدادات التوليد" active onClick={() => navigateTo("/admin/generation-settings")} />
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

  /* ── render ─────────────────────────────────────────────── */
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
          <span className="text-sm font-bold text-emerald-700 truncate">إعدادات التوليد</span>
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
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold leading-tight">إعدادات التوليد</h1>
                <p className="text-xs text-muted-foreground">إعدادات توليد الصور والإنفوجرافيك بالذكاء الاصطناعي</p>
              </div>
            </div>
            <Button
              onClick={() => saveMut.mutate(formData)}
              disabled={saveMut.isPending || settingsLoading}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              data-testid="button-save-settings"
            >
              {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ الإعدادات
            </Button>
          </div>

          {/* Usage stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <StatTile
              label="الرصيد المستخدم هذا الشهر"
              value={usageLoading ? "..." : `${usedCredits} / ${usage?.quota || 0}`}
              sub={usageLoading ? undefined : `متبقي: ${usage?.remaining ?? 0} رصيد`}
              icon={TrendingUp}
              color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30"
              progress={usagePct}
            />
            <StatTile
              label="الصور المولدة هذا الشهر"
              value={usageLoading ? "..." : usage?.images ?? 0}
              sub={usageLoading ? undefined : `لشهر ${usage?.month || ""}`}
              icon={ImageIcon}
              color="bg-violet-100 text-violet-700 dark:bg-violet-900/30"
            />
            <StatTile
              label="الإنفوجرافيك المولد هذا الشهر"
              value={usageLoading ? "..." : usage?.infographics ?? 0}
              sub={usageLoading ? undefined : `لشهر ${usage?.month || ""}`}
              icon={LayoutTemplate}
              color="bg-blue-100 text-blue-700 dark:bg-blue-900/30"
            />
          </div>

          {/* Low quota warning */}
          {usagePct >= 80 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl mb-6">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">تحذير: الرصيد منخفض</p>
                <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                  استُهلك {usagePct}% من الحصة الشهرية — تبقّى {usage?.remaining} رصيد فقط
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* ── Card: Quota ── */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-border/50">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">الحصة الشهرية</h3>
                  <p className="text-xs text-muted-foreground">الحد الأقصى لعدد الصور شهرياً</p>
                </div>
              </div>
              <div className="p-4">
                {settingsLoading ? (
                  <Skeleton className="h-10 w-full rounded-lg" />
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs" htmlFor="monthlyQuota">الحد الأقصى الشهري (رصيد)</Label>
                      <Input
                        id="monthlyQuota"
                        type="number"
                        min="10"
                        max="10000"
                        value={formData.monthlyQuota || 100}
                        onChange={e => setFormData(p => ({ ...p, monthlyQuota: parseInt(e.target.value) || 100 }))}
                        data-testid="input-monthly-quota"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">كل صورة = 1 رصيد &nbsp;·&nbsp; كل إنفوجرافيك = 2 رصيد</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Card: Default Settings ── */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-border/50">
                <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <SlidersHorizontal className="h-4 w-4 text-violet-700 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">الإعدادات الافتراضية</h3>
                  <p className="text-xs text-muted-foreground">القيم الافتراضية عند توليد صور جديدة</p>
                </div>
              </div>
              <div className="px-4 divide-y divide-border/50">
                {settingsLoading ? (
                  <div className="py-4 space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}
                  </div>
                ) : (
                  <>
                    <SettingRow label="نوع التوليد الافتراضي">
                      <Select
                        value={formData.defaultGenerationType || "realistic"}
                        onValueChange={v => setFormData(p => ({ ...p, defaultGenerationType: v }))}
                      >
                        <SelectTrigger className="w-44 text-xs h-9" data-testid="select-default-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GEN_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>
                              <span>{t.label}</span>
                              <span className="text-xs text-muted-foreground mr-1">— {t.desc}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </SettingRow>

                    <SettingRow label="الجودة الافتراضية">
                      <Select
                        value={formData.defaultQuality || "hd"}
                        onValueChange={v => setFormData(p => ({ ...p, defaultQuality: v }))}
                      >
                        <SelectTrigger className="w-44 text-xs h-9" data-testid="select-default-quality">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUALITIES.map(q => <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </SettingRow>

                    <SettingRow label="الحجم الافتراضي">
                      <Select
                        value={formData.defaultSize || "1024x1024"}
                        onValueChange={v => setFormData(p => ({ ...p, defaultSize: v }))}
                      >
                        <SelectTrigger className="w-44 text-xs h-9" data-testid="select-default-size">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </SettingRow>
                  </>
                )}
              </div>
            </div>

            {/* ── Card: Generation Options ── */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-border/50">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Wand2 className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">خيارات التوليد الذكي</h3>
                  <p className="text-xs text-muted-foreground">تخصيص سلوك الذكاء الاصطناعي</p>
                </div>
              </div>
              <div className="px-4 divide-y divide-border/50">
                {settingsLoading ? (
                  <div className="py-4 space-y-3">
                    {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}
                  </div>
                ) : (
                  <>
                    <SettingRow
                      label="التوليد التلقائي من المحتوى"
                      desc="توليد وصف الصورة من عنوان ومحتوى الخبر"
                    >
                      <Switch
                        checked={formData.autoGenerateFromContent ?? true}
                        onCheckedChange={v => setFormData(p => ({ ...p, autoGenerateFromContent: v }))}
                        data-testid="switch-auto-generate"
                      />
                    </SettingRow>
                    <SettingRow
                      label="الحد الأقصى لطول الوصف"
                      desc="عدد الأحرف المسموحة في وصف الصورة"
                    >
                      <Input
                        type="number"
                        min="100"
                        max="4000"
                        value={formData.maxPromptLength || 1000}
                        onChange={e => setFormData(p => ({ ...p, maxPromptLength: parseInt(e.target.value) || 1000 }))}
                        className="w-24 text-xs h-9 text-center"
                        data-testid="input-max-prompt"
                      />
                    </SettingRow>
                  </>
                )}
              </div>
            </div>

            {/* ── Card: Available Models ── */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-border/50">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Cpu className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">النماذج المتاحة</h3>
                  <p className="text-xs text-muted-foreground">نماذج الذكاء الاصطناعي المُفعَّلة</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {/* DALL-E 3 */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shrink-0">
                    <Wand2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold">DALL-E 3</p>
                    <p className="text-[11px] text-muted-foreground">نموذج OpenAI — توليد صور عالية الجودة</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-0.5 rounded-lg">
                    <CheckCircle className="h-3 w-3" />مفعّل
                  </span>
                </div>
                {/* Gemini Image */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold">Nano Banana 2</p>
                    <p className="text-[11px] text-muted-foreground">نموذج Google Gemini — إنفوجرافيك ذكي</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-0.5 rounded-lg">
                    <CheckCircle className="h-3 w-3" />مفعّل
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Recent generation history ── */}
          <div className="mt-4 bg-card border border-border/50 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 p-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">سجل التوليد الأخير</h3>
                  <p className="text-xs text-muted-foreground">آخر الصور المولدة بالذكاء الاصطناعي</p>
                </div>
              </div>
              <Link href="/admin/infographic">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  توليد إنفوجرافيك
                </Button>
              </Link>
            </div>
            <div className="p-4">
              {imageHistory && Array.isArray(imageHistory) && imageHistory.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {imageHistory.slice(0, 6).map((img: any) => (
                    <div key={img.id} className="space-y-1.5">
                      <div className="aspect-square rounded-xl overflow-hidden bg-muted border border-border/50">
                        {img.imageUrl ? (
                          <img src={img.imageUrl} alt="صورة مولدة" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <span className={`block text-center text-[10px] px-1.5 py-0.5 rounded-lg font-medium ${
                        img.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : img.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {img.status === "completed" ? "مكتمل" : img.status === "failed" ? "فشل" : "جاري"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <ImageIcon className="h-10 w-10 opacity-20" />
                  <p className="text-sm">لا يوجد سجل توليد بعد</p>
                  <Link href="/admin/infographic">
                    <Button variant="outline" size="sm" className="mt-2 gap-1.5 text-xs">
                      <LayoutTemplate className="h-3.5 w-3.5" />
                      ابدأ بتوليد إنفوجرافيك
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
