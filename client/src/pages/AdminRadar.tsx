import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowRight, Radar, Rss, Globe, RefreshCw, Search, 
  CheckCircle, XCircle, Clock, Play, Pause, Plus,
  ExternalLink, Trash2, Edit2, Zap, Brain, Send,
  LayoutDashboard, Newspaper, BookOpen, Download, Settings,
  Users, MessageSquare, Activity, Utensils, BarChart3,
  LogOut, Menu, ChevronLeft
} from "lucide-react";
import type { RadarSource, RadarItem, RadarKeyword } from "@shared/schema";
import logoImage from "@assets/LOGO-L_1769253692563.png";

function SidebarItem({ icon: Icon, label, active, count, onClick }: { icon: any; label: string; active?: boolean; count?: number | string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
        active 
          ? 'bg-primary text-primary-foreground' 
          : 'hover-elevate text-muted-foreground hover:text-foreground'
      }`}
    >
      {count !== undefined && (
        <Badge variant={active ? "secondary" : "outline"} className="text-xs min-w-[28px] justify-center">
          {count}
        </Badge>
      )}
      <span className="flex-1 text-right">{label}</span>
      <Icon className="h-5 w-5" />
    </button>
  );
}

const statusLabels: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
  published: "منشور",
  archived: "مؤرشف",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
  published: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200",
};

const categoryLabels: Record<string, string> = {
  "health-news": "أخبار صحية",
  "saudi-health": "الصحة السعودية",
  "health-community": "مجتمع صحي",
  "health-reports": "تقارير صحية",
  "nutrition": "تغذية",
  "quality-life": "جودة الحياة",
  "misc": "منوعات",
};

export default function AdminRadar() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("items");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddSource, setShowAddSource] = useState(false);
  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newKeywordForm, setNewKeywordForm] = useState({
    keyword: "",
    keywordAr: "",
    category: "health-news",
    weight: 1,
    isExclude: false,
  });
  const [newSource, setNewSource] = useState({
    name: "",
    nameAr: "",
    url: "",
    type: "rss",
    category: "health-news",
    language: "ar",
    priority: 3,
    reliability: 80,
  });

  const { data: sources, isLoading: sourcesLoading } = useQuery<RadarSource[]>({
    queryKey: ["/api/radar/sources"],
  });

  const { data: items, isLoading: itemsLoading } = useQuery<RadarItem[]>({
    queryKey: ["/api/radar/items", statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/radar/items?status=${statusFilter}`);
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();
    },
  });

  const { data: keywords, isLoading: keywordsLoading } = useQuery<RadarKeyword[]>({
    queryKey: ["/api/radar/keywords"],
  });

  const { data: stats } = useQuery<{ total: number; pending: number; approved: number; rejected: number; published: number }>({
    queryKey: ["/api/radar/items/stats"],
  });

  const fetchAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/radar/fetch");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/sources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items/stats"] });
      toast({
        title: "تم جلب الأخبار",
        description: `${data.totalNewItems} خبر جديد من ${data.successfulSources} مصدر`,
      });
    },
    onError: () => {
      toast({ title: "فشل في جلب الأخبار", variant: "destructive" });
    },
  });

  const classifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/radar/classify", { limit: 20 });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      toast({
        title: "تم التصنيف",
        description: `تم تصنيف ${data.classified} خبر بالذكاء الاصطناعي`,
      });
    },
    onError: () => {
      toast({ title: "فشل في التصنيف", variant: "destructive" });
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/radar/seed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/sources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/keywords"] });
      toast({
        title: "تم إضافة البيانات الافتراضية",
        description: `${data.sourcesAdded} مصدر، ${data.keywordsAdded} كلمة مفتاحية`,
      });
    },
    onError: () => {
      toast({ title: "فشل في إضافة البيانات", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/radar/items/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items/stats"] });
      toast({ title: "تم تحديث الحالة" });
    },
  });

  const publishItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/radar/items/${id}/publish`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items/stats"] });
      toast({ title: "تم نشر الخبر كمسودة" });
    },
    onError: () => {
      toast({ title: "فشل في نشر الخبر", variant: "destructive" });
    },
  });

  // Advanced translation mutation
  const translateItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/radar/items/${id}/translate`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      toast({ 
        title: "تمت الترجمة التحريرية",
        description: `درجة الأهمية: ${data.translation?.importanceScore || 0}/10`,
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "فشل في الترجمة", 
        description: error?.message || "حدث خطأ",
        variant: "destructive" 
      });
    },
  });

  // Process and publish with image download
  const processAndPublishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/radar/items/${id}/process-and-publish`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items/stats"] });
      toast({ 
        title: "تم نشر الخبر بنجاح",
        description: data.imageUploaded ? "تم رفع الصورة أيضاً" : "بدون صورة",
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "فشل في المعالجة والنشر", 
        description: error?.message || "حدث خطأ",
        variant: "destructive" 
      });
    },
  });

  // Batch translate mutation
  const batchTranslateMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const res = await apiRequest("POST", `/api/radar/batch-translate`, { itemIds });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      const successful = data.results?.filter((r: any) => r.success).length || 0;
      toast({ 
        title: "تمت الترجمة الجماعية",
        description: `تمت ترجمة ${successful} من ${data.results?.length || 0} خبر`,
      });
    },
    onError: () => {
      toast({ title: "فشل في الترجمة الجماعية", variant: "destructive" });
    },
  });

  // Evaluate importance mutation
  const evaluateMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const res = await apiRequest("POST", `/api/radar/evaluate`, { itemIds });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/radar/items/stats"] });
      toast({ 
        title: "تم تقييم الأخبار",
        description: `تم تقييم ${data.evaluations?.length || 0} خبر بالذكاء الاصطناعي`,
      });
    },
    onError: () => {
      toast({ title: "فشل في تقييم الأخبار", variant: "destructive" });
    },
  });

  const addSourceMutation = useMutation({
    mutationFn: async (source: typeof newSource) => {
      const res = await apiRequest("POST", "/api/radar/sources", source);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/sources"] });
      setShowAddSource(false);
      setNewSource({
        name: "",
        nameAr: "",
        url: "",
        type: "rss",
        category: "health-news",
        language: "ar",
        priority: 3,
        reliability: 80,
      });
      toast({ title: "تم إضافة المصدر" });
    },
    onError: () => {
      toast({ title: "فشل في إضافة المصدر", variant: "destructive" });
    },
  });

  const deleteSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/radar/sources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/sources"] });
      toast({ title: "تم حذف المصدر" });
    },
  });

  const addKeywordMutation = useMutation({
    mutationFn: async (data: typeof newKeywordForm) => {
      const res = await apiRequest("POST", "/api/radar/keywords", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/keywords"] });
      setShowAddKeyword(false);
      setNewKeywordForm({ keyword: "", keywordAr: "", category: "health-news", weight: 1, isExclude: false });
      toast({ title: "تمت إضافة الكلمة المفتاحية" });
    },
    onError: () => {
      toast({ title: "فشل في إضافة الكلمة", variant: "destructive" });
    },
  });

  const deleteKeywordMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/radar/keywords/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radar/keywords"] });
      toast({ title: "تم حذف الكلمة المفتاحية" });
    },
  });

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("ar-SA", { 
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const navigateTo = (section: string) => {
    setSidebarOpen(false);
    if (section === 'radar') return;
    if (section === 'users') {
      setLocation('/admin/users');
    } else {
      setLocation(`/admin${section === 'dashboard' ? '' : '/' + section}`);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout");
      localStorage.removeItem("adminAuthenticated");
      setLocation("/admin/login");
    } catch (error) {
      toast({ title: "حدث خطأ أثناء تسجيل الخروج", variant: "destructive" });
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="كبسولة" className="h-10" />
          <div>
            <h2 className="font-bold text-sm">لوحة التحكم</h2>
            <p className="text-xs text-muted-foreground">إدارة النظام</p>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="الرئيسية" onClick={() => navigateTo('dashboard')} />
          <SidebarItem icon={Newspaper} label="الأخبار" onClick={() => navigateTo('news')} />
          <SidebarItem icon={BookOpen} label="المقالات" onClick={() => navigateTo('articles')} />
          <SidebarItem icon={Download} label="استيراد WordPress" onClick={() => navigateTo('import')} />
          <SidebarItem icon={Settings} label="التصنيفات" onClick={() => navigateTo('categories')} />
          <SidebarItem icon={Users} label="المستخدمين" onClick={() => navigateTo('users')} />
          <SidebarItem icon={Radar} label="رادار الأخبار" active onClick={() => navigateTo('radar')} />
          <SidebarItem icon={MessageSquare} label="المحادثات" count="89" />
          <SidebarItem icon={Activity} label="التتبع الصحي" />
          <SidebarItem icon={Utensils} label="التغذية" />
          <SidebarItem icon={BarChart3} label="الإحصائيات" />
          <SidebarItem icon={Settings} label="الإعدادات" />
        </nav>
      </ScrollArea>
      
      <div className="p-3 border-t mt-auto">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          onClick={handleLogout}
          data-testid="button-admin-logout"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30 overflow-x-hidden w-full max-w-full" dir="rtl">
      {/* Mobile Header */}
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
          <span className="text-sm font-bold text-primary truncate">رادار الأخبار</span>
        </div>
        <Link href="/">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      <div className="flex w-full max-w-full">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 min-h-screen bg-card border-l fixed right-0 top-0 z-40 flex-col">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:mr-64 p-3 md:p-6 w-full max-w-full overflow-x-hidden">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/admin" className="hover:text-primary">لوحة التحكم</Link>
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>رادار الأخبار</span>
          </div>

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Radar className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">رادار الأخبار</h1>
                <p className="text-muted-foreground">مراقبة وجمع الأخبار الصحية من المصادر الموثوقة</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              data-testid="button-seed"
            >
              <Plus className="h-4 w-4 ml-2" />
              بيانات افتراضية
            </Button>
            <Button 
              variant="outline"
              onClick={() => classifyMutation.mutate()}
              disabled={classifyMutation.isPending}
              data-testid="button-classify"
              >
                <Brain className="h-4 w-4 ml-2" />
                {classifyMutation.isPending ? "جاري التصنيف..." : "تصنيف ذكي"}
              </Button>
            <Button 
              onClick={() => fetchAllMutation.mutate()}
              disabled={fetchAllMutation.isPending}
              data-testid="button-fetch-all"
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${fetchAllMutation.isPending ? "animate-spin" : ""}`} />
              {fetchAllMutation.isPending ? "جاري الجلب..." : "جلب الأخبار"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats?.total || 0}</div>
                <div className="text-sm text-muted-foreground">إجمالي الأخبار</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{stats?.pending || 0}</div>
                <div className="text-sm text-muted-foreground">قيد المراجعة</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats?.approved || 0}</div>
                <div className="text-sm text-muted-foreground">معتمدة</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{sources?.length || 0}</div>
                <div className="text-sm text-muted-foreground">مصادر نشطة</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="items" data-testid="tab-items">الأخبار المجمعة</TabsTrigger>
            <TabsTrigger value="sources" data-testid="tab-sources">المصادر</TabsTrigger>
            <TabsTrigger value="keywords" data-testid="tab-keywords">الكلمات المفتاحية</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle>الأخبار المجمعة</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const pendingIds = items?.filter(i => i.status === 'pending' && !i.titleAr).slice(0, 10).map(i => i.id) || [];
                        if (pendingIds.length > 0) batchTranslateMutation.mutate(pendingIds);
                      }}
                      disabled={batchTranslateMutation.isPending || !items?.some(i => i.status === 'pending' && !i.titleAr)}
                      data-testid="button-batch-translate"
                    >
                      <Brain className={`h-4 w-4 ml-2 ${batchTranslateMutation.isPending ? "animate-pulse" : ""}`} />
                      ترجمة جماعية
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const pendingIds = items?.filter(i => i.status === 'pending').slice(0, 10).map(i => i.id) || [];
                        if (pendingIds.length > 0) evaluateMutation.mutate(pendingIds);
                      }}
                      disabled={evaluateMutation.isPending || !items?.some(i => i.status === 'pending')}
                      data-testid="button-evaluate-all"
                    >
                      <Zap className={`h-4 w-4 ml-2 ${evaluateMutation.isPending ? "animate-pulse" : ""}`} />
                      تقييم تلقائي
                    </Button>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40" data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">قيد المراجعة</SelectItem>
                        <SelectItem value="approved">معتمد</SelectItem>
                        <SelectItem value="rejected">مرفوض</SelectItem>
                        <SelectItem value="published">منشور</SelectItem>
                        <SelectItem value="archived">مؤرشف</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {itemsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : items?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Radar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد أخبار في هذه الفئة</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => fetchAllMutation.mutate()}
                    >
                      جلب أخبار جديدة
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items?.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <div className="flex">
                          {item.imageUrl && (
                            <div className="w-32 h-24 flex-shrink-0">
                              <img 
                                src={item.imageUrl} 
                                alt="" 
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                              />
                            </div>
                          )}
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold line-clamp-1 mb-1">
                                  {item.titleAr || item.title}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {item.summaryAr || item.summary}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <Badge variant="outline" className={statusColors[item.status]}>
                                    {statusLabels[item.status]}
                                  </Badge>
                                  {item.category && (
                                    <Badge variant="secondary">
                                      {categoryLabels[item.category] || item.category}
                                    </Badge>
                                  )}
                                  {item.relevanceScore !== null && item.relevanceScore > 0 && (
                                    <Badge variant="outline">
                                      أهمية: {item.relevanceScore}%
                                    </Badge>
                                  )}
                                  <span className="text-muted-foreground">
                                    {formatDate(item.publishedAt || item.fetchedAt)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <a 
                                  href={item.originalUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                                {!item.titleAr && (
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    className="h-8 w-8 text-purple-600"
                                    onClick={() => translateItemMutation.mutate(item.id)}
                                    disabled={translateItemMutation.isPending}
                                    title="ترجمة تحريرية"
                                    data-testid={`button-translate-${item.id}`}
                                  >
                                    <Brain className={`h-4 w-4 ${translateItemMutation.isPending ? "animate-pulse" : ""}`} />
                                  </Button>
                                )}
                                {item.status === "pending" && (
                                  <>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      className="h-8 w-8 text-green-600"
                                      onClick={() => updateStatusMutation.mutate({ id: item.id, status: "approved" })}
                                      data-testid={`button-approve-${item.id}`}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      className="h-8 w-8 text-red-600"
                                      onClick={() => updateStatusMutation.mutate({ id: item.id, status: "rejected" })}
                                      data-testid={`button-reject-${item.id}`}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {item.status === "approved" && (
                                  <>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      className="h-8 w-8 text-blue-600"
                                      onClick={() => publishItemMutation.mutate(item.id)}
                                      title="نشر سريع"
                                      data-testid={`button-publish-${item.id}`}
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      className="h-8 w-8 text-emerald-600"
                                      onClick={() => processAndPublishMutation.mutate(item.id)}
                                      disabled={processAndPublishMutation.isPending}
                                      title="معالجة ونشر (مع الصورة)"
                                      data-testid={`button-process-${item.id}`}
                                    >
                                      <Download className={`h-4 w-4 ${processAndPublishMutation.isPending ? "animate-pulse" : ""}`} />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>مصادر الأخبار</CardTitle>
                  <Dialog open={showAddSource} onOpenChange={setShowAddSource}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-source">
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة مصدر
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md" dir="rtl">
                      <DialogHeader>
                        <DialogTitle>إضافة مصدر جديد</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>الاسم (إنجليزي)</Label>
                          <Input
                            value={newSource.name}
                            onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                            placeholder="WHO News"
                            data-testid="input-source-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>الاسم (عربي)</Label>
                          <Input
                            value={newSource.nameAr}
                            onChange={(e) => setNewSource({ ...newSource, nameAr: e.target.value })}
                            placeholder="أخبار منظمة الصحة العالمية"
                            data-testid="input-source-name-ar"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>رابط RSS</Label>
                          <Input
                            value={newSource.url}
                            onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                            placeholder="https://example.com/rss"
                            dir="ltr"
                            data-testid="input-source-url"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>التصنيف</Label>
                            <Select 
                              value={newSource.category} 
                              onValueChange={(v) => setNewSource({ ...newSource, category: v })}
                            >
                              <SelectTrigger data-testid="select-source-category">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(categoryLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>اللغة</Label>
                            <Select 
                              value={newSource.language} 
                              onValueChange={(v) => setNewSource({ ...newSource, language: v })}
                            >
                              <SelectTrigger data-testid="select-source-language">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ar">العربية</SelectItem>
                                <SelectItem value="en">الإنجليزية</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>الأولوية (1-5)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              value={newSource.priority}
                              onChange={(e) => setNewSource({ ...newSource, priority: parseInt(e.target.value) })}
                              data-testid="input-source-priority"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>الموثوقية (%)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={newSource.reliability}
                              onChange={(e) => setNewSource({ ...newSource, reliability: parseInt(e.target.value) })}
                              data-testid="input-source-reliability"
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => addSourceMutation.mutate(newSource)}
                          disabled={!newSource.name || !newSource.url || addSourceMutation.isPending}
                          data-testid="button-save-source"
                        >
                          {addSourceMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {sourcesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : sources?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Rss className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد مصادر مضافة</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => seedMutation.mutate()}
                    >
                      إضافة مصادر افتراضية
                    </Button>
                  </div>
                ) : (
                  <Table dir="rtl">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المصدر</TableHead>
                        <TableHead className="text-right">النوع</TableHead>
                        <TableHead className="text-right">التصنيف</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">آخر جلب</TableHead>
                        <TableHead className="text-right">الأخبار</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sources?.map((source) => (
                        <TableRow key={source.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{source.nameAr || source.name}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {source.url}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {source.type === "rss" ? "RSS" : source.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {categoryLabels[source.category || ""] || source.category}
                          </TableCell>
                          <TableCell>
                            {source.isActive ? (
                              <Badge className="bg-green-100 text-green-800">نشط</Badge>
                            ) : (
                              <Badge variant="secondary">متوقف</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {source.lastFetchAt ? (
                              <div>
                                <div>{formatDate(source.lastFetchAt)}</div>
                                {source.lastFetchStatus === "error" && (
                                  <div className="text-xs text-red-500">خطأ</div>
                                )}
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>{source.itemsCount || 0}</TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500"
                              onClick={() => {
                                if (confirm("هل تريد حذف هذا المصدر؟")) {
                                  deleteSourceMutation.mutate(source.id);
                                }
                              }}
                              data-testid={`button-delete-source-${source.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keywords" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>الكلمات المفتاحية</CardTitle>
                    <CardDescription>
                      الكلمات المستخدمة لتصفية وتصنيف الأخبار
                    </CardDescription>
                  </div>
                  <Dialog open={showAddKeyword} onOpenChange={setShowAddKeyword}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-keyword">
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة كلمة
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md" dir="rtl">
                      <DialogHeader>
                        <DialogTitle>إضافة كلمة مفتاحية جديدة</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>الكلمة (إنجليزي / عربي)</Label>
                          <Input
                            value={newKeywordForm.keyword}
                            onChange={(e) => setNewKeywordForm({ ...newKeywordForm, keyword: e.target.value })}
                            placeholder="diabetes / سكري"
                            data-testid="input-keyword"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>الكلمة بالعربي (اختياري)</Label>
                          <Input
                            value={newKeywordForm.keywordAr}
                            onChange={(e) => setNewKeywordForm({ ...newKeywordForm, keywordAr: e.target.value })}
                            placeholder="داء السكري"
                            data-testid="input-keyword-ar"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>التصنيف</Label>
                            <Select
                              value={newKeywordForm.category}
                              onValueChange={(v) => setNewKeywordForm({ ...newKeywordForm, category: v })}
                            >
                              <SelectTrigger data-testid="select-keyword-category">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(categoryLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>الوزن (1-10)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              value={newKeywordForm.weight}
                              onChange={(e) => setNewKeywordForm({ ...newKeywordForm, weight: parseInt(e.target.value) || 1 })}
                              data-testid="input-keyword-weight"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg border">
                          <div className="flex-1">
                            <div className="font-medium text-sm">كلمة استبعاد</div>
                            <div className="text-xs text-muted-foreground">استبعاد الأخبار التي تحتوي على هذه الكلمة</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewKeywordForm({ ...newKeywordForm, isExclude: !newKeywordForm.isExclude })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${newKeywordForm.isExclude ? "bg-destructive" : "bg-muted"}`}
                            data-testid="toggle-keyword-exclude"
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newKeywordForm.isExclude ? "translate-x-1" : "translate-x-6"}`} />
                          </button>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => addKeywordMutation.mutate(newKeywordForm)}
                          disabled={!newKeywordForm.keyword || addKeywordMutation.isPending}
                          data-testid="button-save-keyword"
                        >
                          {addKeywordMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {keywordsLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {[...Array(8)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-24 rounded-full" />
                    ))}
                  </div>
                ) : keywords?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد كلمات مفتاحية</p>
                    <div className="flex gap-2 justify-center mt-4">
                      <Button 
                        variant="outline"
                        onClick={() => seedMutation.mutate()}
                      >
                        إضافة كلمات افتراضية
                      </Button>
                      <Button onClick={() => setShowAddKeyword(true)}>
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة كلمة
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {keywords?.map((kw) => (
                      <div
                        key={kw.id}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                          kw.isExclude
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                        data-testid={`keyword-badge-${kw.id}`}
                      >
                        <span>{kw.keywordAr || kw.keyword}</span>
                        {kw.weight && kw.weight > 1 && (
                          <span className="opacity-50 text-xs">×{kw.weight}</span>
                        )}
                        {kw.isExclude && (
                          <span className="opacity-60 text-xs">(استبعاد)</span>
                        )}
                        <button
                          onClick={() => deleteKeywordMutation.mutate(kw.id)}
                          disabled={deleteKeywordMutation.isPending}
                          className="opacity-40 hover:opacity-100 transition-opacity mr-1"
                          title="حذف"
                          data-testid={`button-delete-keyword-${kw.id}`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </main>
      </div>
    </div>
  );
}
