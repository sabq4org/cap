import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  MessageCircle, Users, Send, Clock, CheckCircle, XCircle,
  AlertCircle, Sparkles, ChevronRight, RefreshCw, ToggleLeft,
  ToggleRight, Phone, Calendar, Eye, EyeOff, Settings, CalendarClock, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const INTEREST_LABELS: Record<string, string> = {
  heart: "القلب",
  nutrition: "التغذية",
  diabetes: "السكري",
  pressure: "ضغط الدم",
  mother: "صحة الأم",
  child: "صحة الطفل",
  mental: "الصحة النفسية",
  fitness: "اللياقة",
  general: "عام",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  unsubscribed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  sending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  scheduled: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  canceled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
  failed: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  active: "فعّال",
  pending: "في الانتظار",
  unsubscribed: "ألغى الاشتراك",
  sent: "مُرسل",
  sending: "يُرسل...",
  draft: "مسودة",
  scheduled: "مجدولة",
  canceled: "ملغاة",
  failed: "فشل الإرسال",
};

function Countdown({ target }: { target: string }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) { setRemaining("الآن"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (h >= 24) setRemaining(`${Math.floor(h / 24)} يوم`);
      else if (h > 0) setRemaining(`${h}س ${m}د`);
      else setRemaining(`${m} دقيقة`);
    };
    calc();
    const id = setInterval(calc, 30000);
    return () => clearInterval(id);
  }, [target]);
  return <span className="text-xs text-purple-600 dark:text-purple-400">بعد {remaining}</span>;
}

type ActiveTab = "subscribers" | "compose" | "newsletters" | "settings";

export default function AdminWhatsApp() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<ActiveTab>("subscribers");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newsletterTitle, setNewsletterTitle] = useState("");
  const [newsletterContent, setNewsletterContent] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showContent, setShowContent] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<{ total: number; active: number; pending: number; unsubscribed: number }>({
    queryKey: ["/api/admin/whatsapp/stats"],
  });

  const { data: subscribers = [], isLoading: subsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/whatsapp/subscribers"],
  });

  const { data: newsletters = [], isLoading: nlLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/whatsapp/newsletters"],
  });

  const { data: settings } = useQuery<any>({
    queryKey: ["/api/admin/whatsapp/settings"],
  });

  const generateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/whatsapp/generate-newsletter", { interests: selectedInterests }),
    onSuccess: (data: any) => {
      const { formatNewsletterMessage } = { formatNewsletterMessage: null };
      const points: string[] = data.points || [];
      const formatted = [
        `🌿 *كبسولة الصباح الصحية*`,
        `📅 ${new Date().toLocaleDateString("ar-SA", { timeZone: "Asia/Riyadh", weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
        ``,
        `*${data.title || "أبرز الأخبار الصحية اليوم"}*`,
        ``,
        ...points.map((p: string, i: number) => `${i + 1}. ${p}`),
        ``,
        `📖 اقرأ المزيد: https://capsulah.net`,
        ``,
        `━━━━━━━━━━━━━━━━━━`,
        `للإلغاء أرسل: *إيقاف*`,
      ].join("\n");
      setNewsletterTitle(data.title || "أبرز الأخبار الصحية اليوم");
      setNewsletterContent(formatted);
      setShowContent(true);
      toast({ title: "تم توليد المحتوى بنجاح", description: "راجع النشرة قبل الإرسال" });
    },
    onError: () => toast({ title: "خطأ في التوليد", variant: "destructive" }),
  });

  const sendMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/whatsapp/send-newsletter", {
      title: newsletterTitle,
      content: newsletterContent,
      interests: selectedInterests,
      ...(scheduleMode && scheduledAt ? { scheduledAtMs: new Date(scheduledAt).getTime() } : {}),
    }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp/newsletters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp/stats"] });
      toast({ title: data.scheduled ? "تمت الجدولة بنجاح" : "تم الإرسال بنجاح", description: data.message });
      setNewsletterTitle("");
      setNewsletterContent("");
      setScheduleMode(false);
      setScheduledAt("");
      setActiveTab("newsletters");
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error?.message || "حدث خطأ", variant: "destructive" });
    },
  });

  const cancelNewsletterMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/whatsapp/newsletters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp/newsletters"] });
      toast({ title: "تم إلغاء الجدولة" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ في الإلغاء", description: error?.message || "حدث خطأ", variant: "destructive" });
    },
  });

  const toggleSubscriberMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/whatsapp/subscribers/${id}`, {
        isActive,
        status: isActive ? "active" : "unsubscribed",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp/subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp/stats"] });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", "/api/admin/whatsapp/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp/settings"] });
      toast({ title: "تم حفظ الإعدادات" });
    },
    onError: () => toast({ title: "خطأ في الحفظ", variant: "destructive" }),
  });

  const filteredSubscribers = subscribers.filter((s: any) => {
    if (filterStatus === "all") return true;
    return s.status === filterStatus;
  });

  const tabs: { id: ActiveTab; label: string; icon: any }[] = [
    { id: "subscribers", label: "المشتركون", icon: Users },
    { id: "compose", label: "إنشاء نشرة", icon: Send },
    { id: "newsletters", label: "سجل النشرات", icon: Calendar },
    { id: "settings", label: "الإعدادات", icon: Settings },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="icon">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            واتساب — كبسولة الصباح
          </h1>
          <p className="text-sm text-muted-foreground">إدارة الاشتراكات وإرسال النشرة الصحية اليومية</p>
        </div>
        {settings?.apiMode && (
          <Badge className="mr-auto" variant={settings.apiMode === "mock" ? "secondary" : "default"}>
            {settings.apiMode === "mock" ? "وضع المحاكاة" : "واتساب حقيقي"}
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "إجمالي المشتركين", value: stats?.total ?? "—", icon: Users, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
          { label: "فعّالون", value: stats?.active ?? "—", icon: CheckCircle, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
          { label: "في الانتظار", value: stats?.pending ?? "—", icon: Clock, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30" },
          { label: "ألغوا الاشتراك", value: stats?.unsubscribed ?? "—", icon: XCircle, color: "text-red-600 bg-red-50 dark:bg-red-950/30" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{statsLoading ? "..." : s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-testid={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Subscribers Tab ─── */}
      {activeTab === "subscribers" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">قائمة المشتركين</CardTitle>
              <div className="flex gap-2">
                {["all", "active", "pending", "unsubscribed"].map(f => (
                  <button
                    key={f}
                    data-testid={`filter-${f}`}
                    onClick={() => setFilterStatus(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filterStatus === f
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {f === "all" ? "الكل" : STATUS_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {subsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>لا يوجد مشتركون بعد</p>
                <p className="text-xs mt-1">شارك رابط الاشتراك: <a href="/whatsapp" className="text-primary hover:underline" target="_blank">/whatsapp</a></p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredSubscribers.map((sub: any) => (
                  <div key={sub.id} data-testid={`subscriber-${sub.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{sub.name || "غير محدد"}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[sub.status] || STATUS_COLORS.draft}`}>
                          {STATUS_LABELS[sub.status] || sub.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{sub.phone}</p>
                      {sub.interests && sub.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(sub.interests as string[]).slice(0, 4).map((i: string) => (
                            <span key={i} className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-md">
                              {INTEREST_LABELS[i] || i}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-xs text-muted-foreground hidden md:block">
                        {sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString("ar-SA") : "—"}
                      </p>
                      <Switch
                        data-testid={`toggle-${sub.id}`}
                        checked={sub.isActive}
                        onCheckedChange={(checked) =>
                          toggleSubscriberMutation.mutate({ id: sub.id, isActive: checked })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Compose Tab ─── */}
      {activeTab === "compose" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                توليد النشرة بالذكاء الاصطناعي
              </CardTitle>
              <CardDescription>حدد الاهتمامات ثم اضغط «توليد» لإنشاء محتوى مخصص</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm mb-2 block">تخصيص حسب الاهتمامات (اختياري)</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(INTEREST_LABELS).map(([id, label]) => (
                    <button
                      key={id}
                      data-testid={`interest-btn-${id}`}
                      type="button"
                      onClick={() => setSelectedInterests(prev =>
                        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                      )}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selectedInterests.includes(id)
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-muted/30 text-muted-foreground border-border hover:border-emerald-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                data-testid="button-generate"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="gap-2"
              >
                {generateMutation.isPending ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" />جاري التوليد...</>
                ) : (
                  <><Sparkles className="h-4 w-4" />توليد بالذكاء الاصطناعي</>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">محتوى النشرة</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowContent(!showContent)} className="gap-1.5">
                  {showContent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showContent ? "إخفاء" : "معاينة"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nl-title" className="text-sm">عنوان النشرة</Label>
                <Input
                  id="nl-title"
                  data-testid="input-newsletter-title"
                  value={newsletterTitle}
                  onChange={(e) => setNewsletterTitle(e.target.value)}
                  placeholder="عنوان النشرة الصحية"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nl-content" className="text-sm">محتوى الرسالة</Label>
                <Textarea
                  id="nl-content"
                  data-testid="input-newsletter-content"
                  value={newsletterContent}
                  onChange={(e) => setNewsletterContent(e.target.value)}
                  placeholder="اكتب محتوى رسالة واتساب هنا..."
                  rows={10}
                  className="font-mono text-sm"
                  dir="rtl"
                />
                {newsletterContent && (
                  <p className="text-xs text-muted-foreground">{newsletterContent.length} حرف</p>
                )}
              </div>

              {/* Preview */}
              {showContent && newsletterContent && (
                <div className="border rounded-xl p-4 bg-[#ECE5DD] dark:bg-[#1a1a2e]" dir="rtl">
                  <p className="text-xs text-muted-foreground mb-2">معاينة رسالة واتساب:</p>
                  <div className="bg-white dark:bg-[#262d31] rounded-xl p-3 shadow-sm whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans leading-relaxed max-w-sm">
                    {newsletterContent}
                  </div>
                </div>
              )}

              {/* Schedule toggle */}
              <div className="border rounded-xl p-3 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium">جدولة الإرسال</span>
                  </div>
                  <Switch
                    data-testid="toggle-schedule-mode"
                    checked={scheduleMode}
                    onCheckedChange={setScheduleMode}
                  />
                </div>
                {scheduleMode && (
                  <div className="space-y-1.5">
                    <Label htmlFor="scheduled-at" className="text-sm">وقت الإرسال</Label>
                    <Input
                      id="scheduled-at"
                      data-testid="input-scheduled-at"
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      min={(() => { const d = new Date(Date.now() + 60 * 1000); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })()}
                    />
                    <p className="text-xs text-muted-foreground">حسب توقيت جهازك — يُحوَّل إلى UTC عند الحفظ</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  data-testid="button-send-newsletter"
                  onClick={() => sendMutation.mutate()}
                  disabled={
                    sendMutation.isPending ||
                    !newsletterTitle ||
                    !newsletterContent ||
                    (scheduleMode && !scheduledAt)
                  }
                  className={`gap-2 text-white ${scheduleMode ? "bg-purple-600 hover:bg-purple-700" : "bg-green-600 hover:bg-green-700"}`}
                >
                  {sendMutation.isPending ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" />{scheduleMode ? "جاري الجدولة..." : "جاري الإرسال..."}</>
                  ) : scheduleMode ? (
                    <><CalendarClock className="h-4 w-4" />جدولة الإرسال</>
                  ) : (
                    <><Send className="h-4 w-4" />إرسال إلى {stats?.active ?? 0} مشترك</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {scheduleMode ? "سيُرسل تلقائياً في الوقت المحدد" : "سيُرسل إلى المشتركين الفعّالين فقط"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Newsletters Tab ─── */}
      {activeTab === "newsletters" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">سجل النشرات المرسلة</CardTitle>
          </CardHeader>
          <CardContent>
            {nlLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : newsletters.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Send className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>لم يتم إرسال أي نشرة بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {newsletters.map((nl: any) => (
                  <div key={nl.id} data-testid={`newsletter-${nl.id}`} className={`flex items-start gap-3 p-3 rounded-lg ${nl.status === "scheduled" ? "bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800" : "bg-muted/30"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      nl.status === "sent" ? "bg-blue-100 dark:bg-blue-900/30"
                      : nl.status === "scheduled" ? "bg-purple-100 dark:bg-purple-900/30"
                      : "bg-yellow-100 dark:bg-yellow-900/30"
                    }`}>
                      {nl.status === "sent" ? <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                       : nl.status === "scheduled" ? <CalendarClock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                       : <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{nl.title}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[nl.status] || STATUS_COLORS.draft}`}>
                          {STATUS_LABELS[nl.status] || nl.status}
                        </span>
                        {nl.status === "scheduled" && nl.scheduledAt && (
                          <>
                            <span className="text-xs text-muted-foreground">
                              {new Date(nl.scheduledAt).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}
                            </span>
                            <Countdown target={nl.scheduledAt} />
                          </>
                        )}
                        {nl.status !== "scheduled" && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {nl.recipientsCount} مستلم
                          </span>
                        )}
                        {nl.sentAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(nl.sentAt).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}
                          </span>
                        )}
                        {nl.sentBy && (
                          <span className="text-xs text-muted-foreground">بواسطة: {nl.sentBy}</span>
                        )}
                      </div>
                    </div>
                    {nl.status === "scheduled" && (
                      <Button
                        data-testid={`cancel-newsletter-${nl.id}`}
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => cancelNewsletterMutation.mutate(nl.id)}
                        disabled={cancelNewsletterMutation.isPending}
                        title="إلغاء الجدولة"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Settings Tab ─── */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">إعدادات الإرسال التلقائي</CardTitle>
              <CardDescription>تحكم في توقيت الإرسال اليومي لكبسولة الصباح</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-xl">
                <div>
                  <p className="text-sm font-medium">الإرسال التلقائي اليومي</p>
                  <p className="text-xs text-muted-foreground">تفعيل إرسال النشرة كل صباح تلقائياً</p>
                </div>
                <Switch
                  data-testid="toggle-auto-send"
                  checked={settings?.isAutoSendEnabled ?? false}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ isAutoSendEnabled: checked })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">ساعة الإرسال</Label>
                  <Input
                    data-testid="input-send-hour"
                    type="number"
                    min="0"
                    max="23"
                    defaultValue={settings?.sendHour ?? 7}
                    onBlur={(e) => updateSettingsMutation.mutate({ sendHour: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">بتوقيت السعودية (0-23)</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">الدقيقة</Label>
                  <Input
                    data-testid="input-send-minute"
                    type="number"
                    min="0"
                    max="59"
                    defaultValue={settings?.sendMinute ?? 0}
                    onBlur={(e) => updateSettingsMutation.mutate({ sendMinute: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">0-59</p>
                </div>
              </div>

              <div className="p-3 border rounded-xl bg-muted/30">
                <p className="text-sm font-medium mb-1">وضع الإرسال الحالي</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${settings?.apiMode === "mock" ? "bg-yellow-500" : "bg-green-500"}`} />
                  <p className="text-sm">
                    {settings?.apiMode === "mock"
                      ? "وضع المحاكاة — الرسائل تُسجَّل في السجلات فقط"
                      : "واتساب حقيقي — Meta Cloud API"}
                  </p>
                </div>
                {settings?.apiMode === "mock" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    لتفعيل الإرسال الحقيقي: أضف <code className="bg-muted px-1 rounded">WHATSAPP_API_KEY</code> و<code className="bg-muted px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code> في متغيرات البيئة.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">رسالة الترحيب</CardTitle>
              <CardDescription>الرسالة التي تُرسل عند الاشتراك الجديد</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                data-testid="input-welcome-message"
                defaultValue={settings?.welcomeMessage || ""}
                rows={6}
                placeholder="اكتب رسالة ترحيب مخصصة..."
                className="font-mono text-sm"
                dir="rtl"
                onBlur={(e) => updateSettingsMutation.mutate({ welcomeMessage: e.target.value })}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
