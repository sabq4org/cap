import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  LayoutDashboard, Users, Newspaper, BookOpen, MessageSquare, 
  TrendingUp, Eye, LogOut, Plus, Edit, Trash2, Search,
  Activity, Utensils, Heart, Settings, ChevronLeft, BarChart3,
  Calendar, Clock, ArrowUpRight, ArrowDownRight, Sparkles, Menu, X,
  Save, Loader2, ChevronRight, Image, Upload, ImagePlus, Download, Globe, Check, AlertCircle, CheckSquare, Square, Star, Shield, Apple, Radar, Wand2, LayoutTemplate, ChevronsLeft, ChevronsRight, ArrowUpDown, Rss, AlertTriangle, MessageCircle,
  Megaphone, RefreshCw, ToggleLeft, ToggleRight, ExternalLink, Link2, Weight, Timer, RotateCcw, MousePointerClick, FlaskConical, Share2, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import logoImage from "@assets/LOGO-L_1769253692563.png";
import { AdminDashboardOverview } from "@/components/admin/AdminDashboardOverview";
import { SocialContentModal } from "@/components/SocialContentModal";
import AIImageGenerator from "@/components/AIImageGenerator";
import type { SocialContent } from "@shared/schema";

interface ArticleFormPayload {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  readTime: number;
  reviewedBy: string;
  author: string;
  imageUrl: string;
  imageAlt: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  status: "draft" | "published" | "scheduled";
  scheduledAt: string | null;
}

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: "up" | "down";
  icon: any;
  color: string;
}

const PIE_COLORS = ["#16a34a","#3b82f6","#8b5cf6","#f59e0b","#14b8a6","#f43f5e","#64748b","#a855f7"];

const categories = [
  { value: "health-news", label: "أخبار صحية", color: "bg-green-500" },
  { value: "saudi-health", label: "صحة السعودية", color: "bg-emerald-500" },
  { value: "health-community", label: "المجتمع الصحي", color: "bg-blue-500" },
  { value: "health-reports", label: "تقارير صحية", color: "bg-purple-500" },
  { value: "health-events", label: "فعاليات صحية", color: "bg-orange-500" },
  { value: "quality-life", label: "جودة حياة", color: "bg-teal-500" },
  { value: "nutrition", label: "تغذية", color: "bg-lime-500" },
  { value: "misc", label: "منوعات", color: "bg-gray-500" },
];

type ActiveSection = 'dashboard' | 'news' | 'articles' | 'import' | 'categories' | 'users' | 'radar' | 'ads';
type NewsStatusTab = 'published' | 'scheduled' | 'draft' | 'deleted';
type PublishMode = 'now' | 'schedule';

interface Category {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string | null;
  color: string;
  icon: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

// ─── Saudi Timezone Helpers (UTC+3, Asia/Riyadh) ─────────────────────────────
const SAUDI_TZ = 'Asia/Riyadh';

/** Current time as a datetime-local string in Saudi timezone (for min/value) */
function getSaudiNow(): string {
  const now = new Date();
  const saudi = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return saudi.toISOString().slice(0, 16);
}

/** Convert datetime-local value (Saudi time) to UTC ISO string for the server */
function saudiInputToISO(localStr: string): string {
  if (!localStr) return '';
  return new Date(localStr + ':00+03:00').toISOString();
}

/** Convert UTC ISO string from DB to datetime-local value in Saudi timezone */
function isoToSaudiInput(isoStr: string): string {
  if (!isoStr) return '';
  const saudi = new Date(new Date(isoStr).getTime() + 3 * 60 * 60 * 1000);
  return saudi.toISOString().slice(0, 16);
}

/** Format a UTC date string for display in Saudi timezone */
function fmtSaudiDate(isoStr: string | null | undefined, opts: Intl.DateTimeFormatOptions = {}): string {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleString('ar-SA', { timeZone: SAUDI_TZ, ...opts });
}

/** Format date only in Saudi timezone */
function fmtSaudiDateOnly(isoStr: string | null | undefined): string {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('ar-SA', { timeZone: SAUDI_TZ, year: 'numeric', month: 'long', day: 'numeric' });
}

/** Format time only in Saudi timezone */
function fmtSaudiTimeOnly(isoStr: string | null | undefined): string {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleTimeString('ar-SA', { timeZone: SAUDI_TZ, hour: '2-digit', minute: '2-digit' });
}

/** Format date in English: "10 Mar 2026" */
function fmtDateEnglish(isoStr: string | null | undefined): string {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('en-GB', { timeZone: SAUDI_TZ, year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Returns a human-readable Arabic relative-time label for a scheduled date.
 * Future  → "يبدأ خلال 3 أيام" / "يبدأ خلال ساعتين" / "يبدأ خلال دقيقة"
 * Past    → "انتهى منذ 2 يوم"  / "انتهى منذ 5 ساعات" / "انتهى منذ دقيقة"
 */
function relativeScheduledTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  const diffMs = new Date(isoStr).getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const isFuture = diffMs > 0;

  let amount: number;
  let unit: Intl.RelativeTimeFormatUnit;

  if (abs < 60_000) {
    amount = Math.round(abs / 1_000);
    unit = 'second';
  } else if (abs < 3_600_000) {
    amount = Math.round(abs / 60_000);
    unit = 'minute';
  } else if (abs < 86_400_000) {
    amount = Math.round(abs / 3_600_000);
    unit = 'hour';
  } else {
    amount = Math.round(abs / 86_400_000);
    unit = 'day';
  }

  const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' });
  const relative = rtf.format(isFuture ? amount : -amount, unit);

  return isFuture ? `يبدأ ${relative}` : `انتهى ${relative}`;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<7 | 30>(7);
  const [adminUser, setAdminUser] = useState<{ displayName: string; role: string } | null>(null);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newTag, setNewTag] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [newsStatusTab, setNewsStatusTab] = useState<NewsStatusTab>('published');
  const [publishMode, setPublishMode] = useState<PublishMode>('now');
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [selectedNewsIds, setSelectedNewsIds] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [socialModalArticle, setSocialModalArticle] = useState<{ id: string; title: string; socialContentData?: SocialContent | null } | null>(null);
  const [socialModalNews, setSocialModalNews] = useState<{ id: string; title: string } | null>(null);
  const { toast } = useToast();

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    slug: "",
    nameAr: "",
    nameEn: "",
    color: "emerald-600",
    description: "",
    sortOrder: 0,
    isActive: true,
  });

  // Derive active section from URL
  const getActiveSectionFromPath = (): ActiveSection => {
    if (location.includes('/admin/news/new') || location.includes('/admin/news/edit')) return 'news';
    if (location.includes('/admin/news')) return 'news';
    if (location.includes('/admin/articles/new') || location.includes('/admin/articles/edit')) return 'articles';
    if (location.includes('/admin/articles')) return 'articles';
    if (location.includes('/admin/import')) return 'import';
    if (location.includes('/admin/categories')) return 'categories';
    if (location.includes('/admin/ads')) return 'ads';
    return 'dashboard';
  };

  const activeSection = getActiveSectionFromPath();

  // Check for form states from URL
  useEffect(() => {
    if (location.includes('/admin/news/new')) {
      setShowNewsForm(true);
      setEditingNewsId(null);
      resetForm();
      // Pre-fill from localStorage (AdminCapsule feature)
      const prefill = localStorage.getItem("capsule_prefill_news");
      if (prefill) {
        try {
          const data = JSON.parse(prefill);
          setFormData(prev => ({
            ...prev,
            title: data.title || "",
            content: data.content || "",
            summary: data.summary || "",
          }));
          localStorage.removeItem("capsule_prefill_news");
        } catch { }
      }

      // Pre-fill from trend radar URL params (e.g. /admin/news/new?title=...&keywords=...)
      try {
        const params = new URLSearchParams(window.location.search);
        const preTitle = params.get("title");
        const preKeywords = params.get("keywords");
        if (preTitle || preKeywords) {
          const decoded = preTitle ? decodeURIComponent(preTitle) : "";
          const kwList = preKeywords
            ? decodeURIComponent(preKeywords).split(",").map((k) => k.trim()).filter(Boolean)
            : [];
          setFormData((prev) => ({
            ...prev,
            title: decoded || prev.title,
            keywords: kwList.length > 0 ? kwList : prev.keywords,
          }));
        }
      } catch {
        // URL parsing is best-effort; silently ignore errors
      }
    } else if (location.includes('/admin/news/edit/')) {
      const id = location.split('/admin/news/edit/')[1];
      if (id) {
        setEditingNewsId(id);
        setShowNewsForm(true);
        fetch(`/api/news/${id}`)
          .then(res => res.ok ? res.json() : null)
          .then(newsItem => {
            if (newsItem) {
              setFormData({
                title: newsItem.title || "",
                subtitle: newsItem.subtitle || "",
                content: newsItem.content || "",
                summary: newsItem.summary || "",
                category: newsItem.category || "",
                source: newsItem.source || "",
                imageUrl: newsItem.imageUrl || "",
                imageAlt: newsItem.imageAlt || "",
                seoTitle: newsItem.seoTitle || "",
                seoDescription: newsItem.seoDescription || "",
                keywords: newsItem.keywords || [],
                isFeatured: newsItem.isFeatured || false,
              });
              if (newsItem.status === 'scheduled' && newsItem.scheduledAt) {
                setPublishMode('schedule');
                setScheduledDateTime(isoToSaudiInput(newsItem.scheduledAt));
              } else {
                setPublishMode('now');
                setScheduledDateTime('');
              }
            }
          })
          .catch(() => {});
      }
    } else if (location.includes('/admin/articles/new')) {
      setShowArticleForm(true);
      setEditingArticleId(null);
      resetArticleForm();
    } else if (location.includes('/admin/articles/edit/')) {
      const id = location.split('/admin/articles/edit/')[1];
      if (id) {
        setEditingArticleId(id);
        setShowArticleForm(true);
        fetch(`/api/admin/articles/${id}`, { credentials: 'include' })
          .then(res => res.ok ? res.json() : null)
          .then(article => {
            if (article) {
              setArticleFormData({
                title: article.title || "",
                slug: article.slug || "",
                excerpt: article.excerpt || "",
                content: article.content || "",
                category: article.category || "",
                tags: article.tags || [],
                readTime: article.readTime || 5,
                reviewedBy: article.reviewedBy || "",
                author: article.author || "",
                imageUrl: article.imageUrl || "",
                imageAlt: article.imageAlt || "",
                seoTitle: article.seoTitle || "",
                seoDescription: article.seoDescription || "",
                keywords: article.keywords || [],
                status: article.status || "draft",
              });
              if (article.status === 'scheduled' && article.scheduledAt) {
                setArticlePublishMode('schedule');
                setArticleScheduledDateTime(isoToSaudiInput(article.scheduledAt));
              } else {
                setArticlePublishMode('now');
                setArticleScheduledDateTime("");
              }
            }
          })
          .catch(() => {});
      }
    } else {
      // Reset forms when navigating away
      if (!location.includes('/news/')) setShowNewsForm(false);
      if (!location.includes('/articles/')) setShowArticleForm(false);
    }
  }, [location]);

  // Navigation helper
  const navigateTo = (section: ActiveSection) => {
    setShowNewsForm(false);
    setShowArticleForm(false);
    setSidebarOpen(false); // Close mobile sidebar
    switch (section) {
      case 'dashboard':
        setLocation('/admin/dashboard');
        break;
      case 'news':
        setLocation('/admin/news');
        break;
      case 'articles':
        setLocation('/admin/articles');
        break;
      case 'import':
        setLocation('/admin/import');
        break;
      case 'categories':
        setLocation('/admin/categories');
        break;
      case 'users':
        setLocation('/admin/users');
        break;
      case 'radar':
        setLocation('/admin/radar');
        break;
      case 'ads':
        setLocation('/admin/ads');
        break;
    }
  };
  
  // Clear selection when changing tabs
  useEffect(() => {
    setSelectedNewsIds(new Set());
  }, [newsStatusTab]);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    content: "",
    summary: "",
    category: "",
    source: "",
    imageUrl: "",
    imageAlt: "",
    seoTitle: "",
    seoDescription: "",
    keywords: [] as string[],
    isFeatured: false,
  });

  const [articleFormData, setArticleFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    tags: [] as string[],
    readTime: 5,
    reviewedBy: "",
    author: "",
    imageUrl: "",
    imageAlt: "",
    seoTitle: "",
    seoDescription: "",
    keywords: [] as string[],
    status: "draft" as "draft" | "published" | "scheduled",
  });
  const [articlePublishMode, setArticlePublishMode] = useState<'now' | 'schedule'>('now');
  const [articleScheduledDateTime, setArticleScheduledDateTime] = useState("");
  const [newArticleKeyword, setNewArticleKeyword] = useState("");
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [articleAiBrief, setArticleAiBrief] = useState("");

  // WordPress Import State
  const [wpSiteUrl, setWpSiteUrl] = useState("");
  const [wpPerPage, setWpPerPage] = useState(10);
  const [wpPage, setWpPage] = useState(1);
  const [wpDefaultCategory, setWpDefaultCategory] = useState("health");
  const [wpPreviewData, setWpPreviewData] = useState<any>(null);
  const [wpImportResult, setWpImportResult] = useState<any>(null);
  const [isPreviewingWp, setIsPreviewingWp] = useState(false);
  const [isImportingWp, setIsImportingWp] = useState(false);
  const [isBulkImportingWp, setIsBulkImportingWp] = useState(false);
  const [bulkImportProgress, setBulkImportProgress] = useState({ currentPage: 0, totalPages: 0, imported: 0, errors: 0, isRunning: false });
  const [isClearingNews, setIsClearingNews] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
  const [autoCategorizeResult, setAutoCategorizeResult] = useState<{ categorized: number; errors: number; total: number } | null>(null);
  const [classifyJobId, setClassifyJobId] = useState<string | null>(null);
  const [classifyProgress, setClassifyProgress] = useState<{
    status: 'running' | 'done' | 'error';
    processed: number;
    total: number;
    articlesClassified: number;
    newsClassified: number;
    errors: number;
    currentLabel: string;
    message?: string;
    remaining?: number;
  } | null>(null);

  // Admin News Pagination & Sorting State
  const [newsSearchQuery, setNewsSearchQuery] = useState("");
  const [newsCategoryFilter, setNewsCategoryFilter] = useState("all");
  const [adminNewsPage, setAdminNewsPage] = useState(1);
  const [adminNewsSortBy, setAdminNewsSortBy] = useState("publishedAt");
  const [adminNewsSortOrder, setAdminNewsSortOrder] = useState("desc");
  const ADMIN_NEWS_PER_PAGE = 30;

  // Google News State
  const [googleNewsQuery, setGoogleNewsQuery] = useState("أخبار صحية");
  const [googleNewsResults, setGoogleNewsResults] = useState<any[]>([]);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [isImportingGoogleNews, setIsImportingGoogleNews] = useState<string | null>(null);
  const [googleNewsPage, setGoogleNewsPage] = useState(1);
  const [googleHasMore, setGoogleHasMore] = useState(false);
  const [importTab, setImportTab] = useState<'google' | 'wordpress'>('google');

  useEffect(() => {
    const isAdmin = localStorage.getItem("adminAuthenticated");
    if (!isAdmin) {
      setLocation("/admin");
    } else {
      fetch("/api/admin/check-session", { credentials: "include" })
        .then(r => r.json())
        .then(data => {
          if (data.authenticated && data.displayName) {
            setAdminUser({ displayName: data.displayName, role: data.role });
          } else if (!data.authenticated) {
            localStorage.removeItem("adminAuthenticated");
            setLocation("/admin");
          }
        })
        .catch(() => {
          localStorage.removeItem("adminAuthenticated");
          setLocation("/admin");
        });
    }
  }, [setLocation]);

  // Polling for classify job progress
  useEffect(() => {
    if (!classifyJobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/auto-classify-misc/progress/${classifyJobId}`);
        if (!res.ok) { clearInterval(interval); return; }
        const data = await res.json();
        setClassifyProgress(data);
        if (data.status === 'done' || data.status === 'error') {
          clearInterval(interval);
          setClassifyJobId(null);
          if (data.status === 'done') {
            queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
            queryClient.invalidateQueries({ queryKey: ["/api/news"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/category-stats"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
          }
        }
      } catch { clearInterval(interval); }
    }, 1500);
    return () => clearInterval(interval);
  }, [classifyJobId]);

  // Public news for dashboard
  const { data: news } = useQuery<any[]>({ queryKey: ["/api/news"] });
  
  // Dashboard stats
  const { data: dashboardStats } = useQuery<{
    totalNews: number;
    publishedNews: number;
    draftNews: number;
    scheduledNews: number;
    deletedNews: number;
    featuredNews: number;
    todayNews: number;
    miscNews: number;
    totalTranslated: number;
    todayTranslated: number;
    totalViews: number;
    todayViews: number;
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    miscArticles: number;
    totalContent: number;
    publishedContent: number;
    unclassified: number;
    totalUsers: number;
    totalChatSessions: number;
    totalChatMessages: number;
    totalRadarSources: number;
    activeRadarSources: number;
  }>({ queryKey: ["/api/admin/stats"] });

  const { data: chartData } = useQuery<{
    timeseries: { date: string; newsCount: number; views: number }[];
    categories: { name: string; count: number }[];
    radarSourcesActivity: { name: string; count: number }[];
  }>({
    queryKey: ["/api/admin/charts", chartPeriod],
    queryFn: async () => {
      const res = await fetch(`/api/admin/charts?days=${chartPeriod}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch chart data");
      return res.json();
    },
    staleTime: 60000,
  });

  // Admin news with server-side pagination
  const { data: adminNewsData, isLoading: isLoadingAdminNews } = useQuery<{ news: any[]; total: number; page: number; totalPages: number }>({ 
    queryKey: ["/api/admin/news", newsStatusTab, adminNewsPage, newsSearchQuery, newsCategoryFilter, adminNewsSortBy, adminNewsSortOrder],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("status", newsStatusTab);
      params.set("page", String(adminNewsPage));
      params.set("perPage", String(ADMIN_NEWS_PER_PAGE));
      if (newsStatusTab === 'scheduled') {
        params.set("sortBy", "scheduledAt");
        params.set("sortOrder", "asc");
      } else {
        params.set("sortBy", adminNewsSortBy);
        params.set("sortOrder", adminNewsSortOrder);
      }
      if (newsSearchQuery) params.set("search", newsSearchQuery);
      if (newsCategoryFilter !== 'all') params.set("category", newsCategoryFilter);
      const res = await fetch(`/api/admin/news?${params.toString()}`);
      return res.json();
    },
    enabled: activeSection === 'news',
  });
  const adminNews = adminNewsData?.news;
  const adminNewsTotalPages = adminNewsData?.totalPages || 1;
  const adminNewsTotal = adminNewsData?.total || 0;
  const { data: articles } = useQuery<any[]>({ 
    queryKey: ["/api/articles?includeAll=true"],
  });

  // Categories query
  const { data: categoriesList, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: activeSection === 'categories',
  });

  // Category stats (news + article count per slug)
  const { data: categoryStats, refetch: refetchCategoryStats } = useQuery<Record<string, { news: number; articles: number; total: number }>>({
    queryKey: ["/api/admin/category-stats"],
    enabled: activeSection === 'categories',
    refetchInterval: classifyJobId ? 5000 : false,
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof categoryFormData) => {
      const res = await apiRequest("POST", "/api/admin/categories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "تم إضافة التصنيف بنجاح" });
      setShowCategoryForm(false);
      resetCategoryForm();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة التصنيف",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof categoryFormData }) => {
      const res = await apiRequest("PATCH", `/api/admin/categories/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "تم تحديث التصنيف بنجاح" });
      setShowCategoryForm(false);
      setEditingCategoryId(null);
      resetCategoryForm();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث التصنيف",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/categories/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "تم حذف التصنيف بنجاح" });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف التصنيف",
        variant: "destructive",
      });
    },
  });

  const createNewsMutation = useMutation({
    mutationFn: async (data: typeof formData & { status?: string; scheduledAt?: string }) => {
      const res = await apiRequest("POST", "/api/news", {
        ...data,
        publishedAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all admin news queries (all status tabs)
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/admin/news" });
      const statusMsg = publishMode === 'schedule' ? 'تم جدولة الخبر بنجاح' : 'تم نشر الخبر بنجاح';
      toast({
        title: statusMsg,
        description: publishMode === 'schedule' ? `سيتم نشره في: ${fmtSaudiDate(saudiInputToISO(scheduledDateTime), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : "تم إضافة الخبر الجديد للمنصة",
      });
      setShowNewsForm(false);
      resetForm();
      setPublishMode('now');
      setScheduledDateTime("");
    },
    onError: (error: any) => {
      const msg = error?.message?.includes("401") || error?.message?.includes("Unauthorized")
        ? "انتهت الجلسة — أعد تسجيل الدخول"
        : error?.message || "حدث خطأ أثناء نشر الخبر";
      toast({
        title: "خطأ في النشر",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const updateNewsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await apiRequest("PATCH", `/api/news/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/admin/news" });
      toast({
        title: "تم تحديث الخبر بنجاح",
        description: "تم حفظ التعديلات",
      });
      setShowNewsForm(false);
      setEditingNewsId(null);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث الخبر",
        variant: "destructive",
      });
    },
  });

  // Toggle featured status
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
      const res = await apiRequest("PATCH", `/api/news/${id}`, { isFeatured });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/admin/news" });
      toast({
        title: variables.isFeatured ? "تم تمييز الخبر" : "تم إلغاء التمييز",
        description: variables.isFeatured ? "الخبر الآن مميز" : "الخبر لم يعد مميزاً",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تغيير حالة التمييز",
        variant: "destructive",
      });
    },
  });

  const toggleBreakingMutation = useMutation({
    mutationFn: async ({ id, isBreaking }: { id: string; isBreaking: boolean }) => {
      const res = await apiRequest("PATCH", `/api/news/${id}`, { isBreaking });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith("/api/news") });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/admin/news" });
      toast({
        title: variables.isBreaking ? "تم تمييزه كخبر عاجل" : "تمت إزالة علامة العاجل",
      });
    },
    onError: () => {
      toast({ title: "خطأ", description: "حدث خطأ أثناء تحديث حالة العاجل", variant: "destructive" });
    },
  });

  // Soft delete (move to trash)
  const trashNewsMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/news/${id}/trash`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/admin/news" });
      toast({
        title: "تم نقل الخبر للمحذوفات",
        description: "يمكنك استعادته من قسم المحذوفات",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء نقل الخبر للمحذوفات",
        variant: "destructive",
      });
    },
  });

  // Restore from trash
  const restoreNewsMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/news/${id}/restore`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/admin/news" });
      toast({
        title: "تم استعادة الخبر",
        description: "تم استعادة الخبر بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الاستعادة",
        description: "حدث خطأ أثناء استعادة الخبر",
        variant: "destructive",
      });
    },
  });

  // Permanent delete
  const deleteNewsMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/news/${id}/permanent`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/admin/news" });
      toast({
        title: "تم حذف الخبر نهائياً",
        description: "تم حذف الخبر بشكل نهائي",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الخبر",
        variant: "destructive",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest("POST", "/api/admin/news/bulk-delete", { ids, permanent: newsStatusTab === 'deleted' });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/admin/news" });
      setSelectedNewsIds(new Set());
      toast({
        title: newsStatusTab === 'deleted' ? "تم الحذف النهائي" : "تم النقل للمحذوفات",
        description: `تم حذف ${data.deleted} خبر بنجاح`,
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الأخبار",
        variant: "destructive",
      });
    },
  });

  // Selection helpers
  const toggleSelectNews = (id: string) => {
    setSelectedNewsIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!adminNews) return;
    if (selectedNewsIds.size === adminNews.length) {
      setSelectedNewsIds(new Set());
    } else {
      setSelectedNewsIds(new Set(adminNews.map((n: any) => n.id)));
    }
  };

  const handleBulkDelete = () => {
    const count = selectedNewsIds.size;
    const message = newsStatusTab === 'deleted' 
      ? `هل أنت متأكد من حذف ${count} خبر نهائياً؟ لن يمكن استعادتها.`
      : `هل أنت متأكد من نقل ${count} خبر للمحذوفات؟`;
    
    if (confirm(message)) {
      bulkDeleteMutation.mutate(Array.from(selectedNewsIds));
    }
  };

  // Article mutations
  const createArticleMutation = useMutation({
    mutationFn: async (data: ArticleFormPayload) => {
      const res = await apiRequest("POST", "/api/articles", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles?includeAll=true"] });
      toast({
        title: "تم حفظ المقال بنجاح",
        description: "تم إضافة المقال الجديد",
      });
      setShowArticleForm(false);
      resetArticleForm();
    },
    onError: () => {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ المقال",
        variant: "destructive",
      });
    },
  });

  const updateArticleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ArticleFormPayload }) => {
      const res = await apiRequest("PATCH", `/api/articles/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles?includeAll=true"] });
      toast({
        title: "تم تحديث المقال",
        description: "تم تحديث المقال بنجاح",
      });
      setShowArticleForm(false);
      setEditingArticleId(null);
      resetArticleForm();
    },
    onError: () => {
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث المقال",
        variant: "destructive",
      });
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/articles/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles?includeAll=true"] });
      toast({
        title: "تم حذف المقال",
        description: "تم حذف المقال بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف المقال",
        variant: "destructive",
      });
    },
  });

  const autoClassifyMiscMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/auto-classify-misc");
      return res.json();
    },
    onSuccess: (data: any) => {
      if (!data.jobId) {
        toast({ title: "لا يوجد محتوى", description: data.message || "لا يوجد محتوى في تصنيف منوعات" });
        return;
      }
      setClassifyProgress({
        status: 'running', processed: 0, total: data.total,
        articlesClassified: 0, newsClassified: 0, errors: 0,
        currentLabel: 'جاري التحليل...',
      });
      setClassifyJobId(data.jobId);
      toast({ title: "🚀 بدأ التصنيف التلقائي", description: `${data.total} عنصر قيد المعالجة` });
    },
    onError: () => {
      toast({
        title: "خطأ في التصنيف",
        description: "حدث خطأ أثناء بدء التصنيف التلقائي",
        variant: "destructive",
      });
    },
  });

  const handleEditNews = (newsItem: any) => {
    setFormData({
      title: newsItem.title || "",
      subtitle: newsItem.subtitle || "",
      content: newsItem.content || "",
      summary: newsItem.summary || "",
      category: newsItem.category || "",
      source: newsItem.source || "",
      imageUrl: newsItem.imageUrl || "",
      imageAlt: newsItem.imageAlt || "",
      seoTitle: newsItem.seoTitle || "",
      seoDescription: newsItem.seoDescription || "",
      keywords: newsItem.keywords || [],
      isFeatured: newsItem.isFeatured || false,
    });
    setEditingNewsId(newsItem.id);
    setLocation(`/admin/news/edit/${newsItem.id}`);
  };

  const handleDeleteNews = (id: string) => {
    if (newsStatusTab === 'deleted') {
      // Permanent delete from trash
      if (confirm("هل أنت متأكد من حذف هذا الخبر نهائياً؟ لن يمكن استعادته بعد ذلك.")) {
        deleteNewsMutation.mutate(id);
      }
    } else {
      // Soft delete (move to trash)
      if (confirm("هل أنت متأكد من نقل هذا الخبر للمحذوفات؟")) {
        trashNewsMutation.mutate(id);
      }
    }
  };

  const handleRestoreNews = (id: string) => {
    restoreNewsMutation.mutate(id);
  };

  const handleSubmitNews = () => {
    if (!formData.title || !formData.content || !formData.category) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    if (publishMode === 'schedule' && scheduledDateTime.length < 16) {
      toast({
        title: "تاريخ الجدولة مطلوب",
        description: "يرجى تحديد التاريخ والوقت معاً قبل الجدولة",
        variant: "destructive",
      });
      return;
    }
    
    const newsData = {
      ...formData,
      status: publishMode === 'schedule' ? 'scheduled' : 'published',
      scheduledAt: publishMode === 'schedule' ? saudiInputToISO(scheduledDateTime) : undefined,
    };
    
    if (editingNewsId) {
      updateNewsMutation.mutate({ id: editingNewsId, data: newsData });
    } else {
      createNewsMutation.mutate(newsData);
    }
  };

  // Save as draft
  const handleSaveDraft = () => {
    if (!formData.title) {
      toast({
        title: "العنوان مطلوب",
        description: "يرجى إدخال عنوان الخبر على الأقل",
        variant: "destructive",
      });
      return;
    }
    
    const draftData = {
      ...formData,
      status: 'draft',
    };
    
    if (editingNewsId) {
      updateNewsMutation.mutate({ id: editingNewsId, data: draftData });
    } else {
      createNewsMutation.mutate(draftData);
    }
    
    toast({
      title: "تم حفظ المسودة",
      description: "يمكنك متابعة التحرير أو النشر لاحقاً",
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      content: "",
      summary: "",
      category: "",
      source: "",
      imageUrl: "",
      imageAlt: "",
      seoTitle: "",
      seoDescription: "",
      keywords: [],
      isFeatured: false,
    });
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      slug: "",
      nameAr: "",
      nameEn: "",
      color: "emerald-600",
      description: "",
      sortOrder: 0,
      isActive: true,
    });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setCategoryFormData({
      slug: category.slug,
      nameAr: category.nameAr,
      nameEn: category.nameEn || "",
      color: category.color,
      description: category.description || "",
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
    setShowCategoryForm(true);
  };

  const handleSubmitCategory = () => {
    if (!categoryFormData.slug || !categoryFormData.nameAr) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال المعرف والاسم العربي",
        variant: "destructive",
      });
      return;
    }
    
    if (editingCategoryId) {
      updateCategoryMutation.mutate({ id: editingCategoryId, data: categoryFormData });
    } else {
      createCategoryMutation.mutate(categoryFormData);
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا التصنيف؟")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const resetArticleForm = () => {
    setArticleFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category: "",
      tags: [],
      readTime: 5,
      reviewedBy: "",
      author: "",
      imageUrl: "",
      imageAlt: "",
      seoTitle: "",
      seoDescription: "",
      keywords: [],
      status: "draft",
    });
    setArticlePublishMode('now');
    setArticleScheduledDateTime("");
    setArticleAiBrief("");
    setNewArticleKeyword("");
  };

  const handleEditArticle = (article: any) => {
    setArticleFormData({
      title: article.title || "",
      slug: article.slug || "",
      excerpt: article.excerpt || "",
      content: article.content || "",
      category: article.category || "",
      tags: article.tags || [],
      readTime: article.readTime || 5,
      reviewedBy: article.reviewedBy || "",
      author: article.author || "",
      imageUrl: article.imageUrl || "",
      imageAlt: article.imageAlt || "",
      seoTitle: article.seoTitle || "",
      seoDescription: article.seoDescription || "",
      keywords: article.keywords || [],
      status: article.status || "draft",
    });
    if (article.status === 'scheduled' && article.scheduledAt) {
      setArticlePublishMode('schedule');
      setArticleScheduledDateTime(isoToSaudiInput(article.scheduledAt));
    } else {
      setArticlePublishMode('now');
      setArticleScheduledDateTime("");
    }
    setEditingArticleId(article.id);
    setLocation(`/admin/articles/edit/${article.id}`);
  };

  const handleDeleteArticle = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المقال؟")) {
      deleteArticleMutation.mutate(id);
    }
  };

  const handleSubmitArticle = () => {
    if (!articleFormData.title || !articleFormData.content || !articleFormData.category || !articleFormData.slug) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة (العنوان، المحتوى، الفئة، الرابط)",
        variant: "destructive",
      });
      return;
    }
    if (articlePublishMode === 'schedule' && articleScheduledDateTime.length < 16) {
      toast({
        title: "تاريخ الجدولة مطلوب",
        description: "يرجى تحديد التاريخ والوقت قبل الجدولة",
        variant: "destructive",
      });
      return;
    }
    // Build payload with status/scheduling overrides
    const payloadStatus: "draft" | "published" | "scheduled" =
      articleFormData.status === 'draft'
        ? 'draft'
        : (articlePublishMode === 'schedule' ? 'scheduled' : 'published');
    const payloadScheduledAt = articlePublishMode === 'schedule' && articleFormData.status !== 'draft'
      ? saudiInputToISO(articleScheduledDateTime)
      : null;
    const payload: ArticleFormPayload = {
      ...articleFormData,
      status: payloadStatus,
      scheduledAt: payloadScheduledAt,
    };
    if (editingArticleId) {
      updateArticleMutation.mutate({ id: editingArticleId, data: payload });
    } else {
      createArticleMutation.mutate(payload);
    }
  };

  const handleGenerateArticleAI = async () => {
    const brief = articleAiBrief.trim() || articleFormData.title.trim();
    if (!brief || brief.length < 10) {
      toast({
        title: "أدخل موجز/عنوان أولاً",
        description: "اكتب موجزاً أو عنواناً (10 أحرف على الأقل) قبل التوليد",
        variant: "destructive",
      });
      return;
    }
    setIsGeneratingArticle(true);
    try {
      const res = await apiRequest("POST", "/api/admin/generate-article-content", { brief });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل التوليد");
      setArticleFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        slug: prev.slug || generateSlug(data.title || prev.title),
        excerpt: data.excerpt || prev.excerpt,
        content: data.content || prev.content,
        tags: data.tags?.length ? data.tags : prev.tags,
        readTime: data.readTime || prev.readTime,
        seoTitle: data.seoTitle || prev.seoTitle,
        seoDescription: data.seoDescription || prev.seoDescription,
        keywords: data.keywords?.length ? data.keywords : prev.keywords,
      }));
      toast({ title: "تم توليد المقال", description: "راجع المحتوى قبل النشر" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ";
      toast({ title: "خطأ في التوليد", description: message, variant: "destructive" });
    } finally {
      setIsGeneratingArticle(false);
    }
  };

  const handleArticleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: "خطأ", description: "يرجى اختيار ملف صورة", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "الصورة كبيرة جداً", description: "الحد الأقصى 10 ميجابايت", variant: "destructive" });
      return;
    }
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mimeType: file.type }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل الرفع');
      setArticleFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
      toast({ title: "تم رفع الصورة بنجاح" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "فشل الرفع";
      toast({ title: "خطأ في رفع الصورة", description: message, variant: "destructive" });
    } finally {
      e.target.value = '';
    }
  };

  const generateSlug = (title: string) => {
    // For Arabic titles, create a URL-safe slug using the title or random ID
    const arabicToSlug = title
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\u0621-\u064A\u0660-\u0669a-z0-9-]/gi, '')
      .substring(0, 50);
    
    // If mostly Arabic, use a timestamp-based approach for uniqueness
    if (arabicToSlug.length < 3 || !/[a-z0-9]/i.test(title)) {
      return `article-${Date.now().toString(36)}`;
    }
    return arabicToSlug.toLowerCase();
  };

  const handleGenerateAI = async () => {
    if (!formData.content || formData.content.length < 50) {
      toast({
        title: "محتوى غير كافٍ",
        description: "يجب أن يكون المحتوى 50 حرفاً على الأقل للتوليد الذكي",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/admin/generate-news-meta", { 
        content: formData.content 
      });
      const data = await res.json();
      
      if (data) {
        setFormData(prev => ({
          ...prev,
          title: data.title || "",
          subtitle: data.subtitle || "",
          summary: data.summary || "",
          seoTitle: data.seoTitle || "",
          seoDescription: data.seoDescription || "",
          keywords: data.keywords || [],
        }));
        
        toast({
          title: "تم التوليد بنجاح",
          description: "تم توليد البيانات الوصفية من المحتوى",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في التوليد",
        description: "حدث خطأ أثناء التوليد الذكي",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFeaturedImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف صورة صالح",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const response = await fetch('/api/uploads/request-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        throw new Error('فشل في الحصول على رابط الرفع');
      }

      const { uploadURL, objectPath } = await response.json();

      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error('فشل في رفع الصورة');
      }

      setFormData(prev => ({ ...prev, imageUrl: objectPath }));
      toast({
        title: "تم رفع الصورة",
        description: "تم رفع الصورة البارزة بنجاح",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "خطأ في الرفع",
        description: "حدث خطأ أثناء رفع الصورة",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleGenerateImageAI = async () => {
    if (!formData.title && !formData.content) {
      toast({
        title: "محتوى غير كافٍ",
        description: "يجب إدخال العنوان أو المحتوى لتوليد صورة",
        variant: "destructive",
      });
      return;
    }

    if (formData.imageUrl) {
      const confirmed = window.confirm(
        'لديك صورة غلاف محملة بالفعل.\nهل تريد استبدالها بصورة جديدة مُولَّدة من الذكاء الاصطناعي؟'
      );
      if (!confirmed) return;
    }

    setIsGeneratingImage(true);
    try {
      const res = await apiRequest("POST", "/api/admin/generate-image-ai", {
        title: formData.title,
        summary: formData.subtitle || formData.summary || '',
        content: formData.content,
        category: formData.category || 'health',
        style: 'photorealistic',
        mood: 'neutral',
      });
      const data = await res.json();

      if (data.imageUrl) {
        setFormData(prev => ({ ...prev, imageUrl: data.imageUrl, imageAlt: formData.title }));
        toast({
          title: "تم توليد الصورة",
          description: "تم إنشاء صورة رسومية معبرة بنجاح",
        });
      }
    } catch (error) {
      console.error('Error generating AI image:', error);
      toast({
        title: "خطأ في التوليد",
        description: "فشل في توليد الصورة، حاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()],
      }));
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmitNews();
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    setLocation("/admin");
  };

  const formatViews = (n: number) => {
    return n.toLocaleString("ar-SA-u-nu-latn");
  };

  const stats: StatCard[] = [
    { 
      title: "إجمالي المحتوى", 
      value: String(dashboardStats?.totalContent || 0), 
      change: `${dashboardStats?.publishedContent || 0} منشور`,
      changeType: "up",
      icon: Newspaper,
      color: "from-sky-50 to-sky-100 dark:from-sky-950/20 dark:to-sky-900/20"
    },
    { 
      title: "أُضيف اليوم", 
      value: String(dashboardStats?.todayNews || 0), 
      change: `${dashboardStats?.scheduledNews || 0} مجدول`,
      changeType: "up",
      icon: Clock,
      color: "from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20"
    },
    { 
      title: "الأخبار المترجمة", 
      value: String(dashboardStats?.totalTranslated || 0), 
      change: `${dashboardStats?.todayTranslated || 0} اليوم`,
      changeType: "up",
      icon: Globe,
      color: "from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20"
    },
    { 
      title: "المشاهدات الإجمالية", 
      value: formatViews(dashboardStats?.totalViews || 0), 
      change: `${formatViews(dashboardStats?.todayViews || 0)} اليوم`,
      changeType: "up",
      icon: Eye,
      color: "from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20"
    },
    { 
      title: "غير مصنّف", 
      value: String(dashboardStats?.unclassified || 0), 
      change: `${dashboardStats?.miscNews || 0} خبر + ${dashboardStats?.miscArticles || 0} مقال`,
      changeType: (dashboardStats?.unclassified || 0) > 50 ? "down" : "up",
      icon: AlertCircle,
      color: (dashboardStats?.unclassified || 0) > 50 
        ? "from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20"
        : "from-violet-50 to-violet-100 dark:from-violet-950/20 dark:to-violet-900/20"
    },
    { 
      title: "مصادر الرادار", 
      value: String(dashboardStats?.totalRadarSources || 0), 
      change: `${dashboardStats?.activeRadarSources || 0} نشطة`,
      changeType: "up",
      icon: Rss,
      color: "from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20"
    },
  ];

  const recentActivities = [
    { action: "تمت إضافة خبر جديد", time: "منذ 5 دقائق", type: "news" },
    { action: "تسجيل مستخدم جديد", time: "منذ 15 دقيقة", type: "user" },
    { action: "تم تحديث مقال", time: "منذ ساعة", type: "article" },
    { action: "محادثة جديدة مع المساعد", time: "منذ ساعتين", type: "chat" },
    { action: "تم نشر مقال جديد", time: "منذ 3 ساعات", type: "article" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* ── Header: green gradient ── */}
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
              {adminUser?.role === 'super_admin' ? 'سوبر أدمن' : adminUser?.role === 'editor' ? 'محرر' : 'مدير'}
            </span>
          </div>
        </div>
        {/* User greeting */}
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

      {/* ── Navigation ── */}
      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-4">

          {/* Main */}
          <div>
            <SidebarItem icon={LayoutDashboard} label="الرئيسية" active={activeSection === 'dashboard'} onClick={() => navigateTo('dashboard')} />
          </div>

          {/* Content */}
          <div>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">المحتوى</p>
            <div className="space-y-0.5">
              <SidebarItem icon={Newspaper} label="الأخبار" active={activeSection === 'news'} count={dashboardStats?.publishedNews ?? undefined} onClick={() => navigateTo('news')} />
              <SidebarItem icon={BookOpen} label="المقالات" active={activeSection === 'articles'} count={articles?.length} onClick={() => navigateTo('articles')} />
              <SidebarItem icon={Settings} label="التصنيفات" active={activeSection === 'categories'} count={categoriesList?.length} onClick={() => navigateTo('categories')} />
            </div>
          </div>

          {/* Tools */}
          <div>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">الأدوات</p>
            <div className="space-y-0.5">
              <SidebarItem icon={Radar} label="رادار الأخبار" active={activeSection === 'radar'} onClick={() => navigateTo('radar')} />
              <SidebarItem icon={TrendingUp} label="رادار الترند الصحي" onClick={() => setLocation('/admin/trends')} />
              <SidebarItem icon={Download} label="استيراد الأخبار" active={activeSection === 'import'} onClick={() => navigateTo('import')} />
              <SidebarItem icon={LayoutTemplate} label="توليد إنفوجرافيك" onClick={() => setLocation('/admin/infographic')} />
              <SidebarItem icon={Wand2} label="إعدادات التوليد" onClick={() => setLocation('/admin/generation-settings')} />
              <SidebarItem icon={FlaskConical} label="مفنّد الشائعات" onClick={() => setLocation('/admin/rumors')} />
              <SidebarItem icon={Megaphone} label="الإعلانات" active={activeSection === 'ads'} onClick={() => navigateTo('ads')} />
              <SidebarItem icon={MessageCircle} label="كبسولة الصباح (واتساب)" onClick={() => setLocation('/admin/whatsapp')} />
              <SidebarItem icon={UserPlus} label="الكتّاب" onClick={() => setLocation('/admin/authors')} />
            </div>
          </div>

          {/* Ads */}
          <div>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">الإعلانات</p>
            <div className="space-y-0.5">
              <SidebarItem icon={BarChart3} label="الإعلانات" active={activeSection === 'ads'} onClick={() => navigateTo('ads')} />
            </div>
          </div>

          {/* Admin */}
          <div>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">الإدارة</p>
            <div className="space-y-0.5">
              <SidebarItem icon={Shield} label="الحسابات الإدارية" onClick={() => setLocation('/admin/accounts')} />
              <SidebarItem icon={Users} label="المستخدمين" onClick={() => navigateTo('users')} />
            </div>
          </div>

        </nav>
      </ScrollArea>

      {/* ── Footer ── */}
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

  // News Form Component
  const NewsFormContent = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/admin/news')}>
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-lg md:text-xl font-bold">{editingNewsId ? 'تعديل الخبر' : 'إضافة خبر جديد'}</h2>
            <p className="text-xs md:text-sm text-muted-foreground">أدخل تفاصيل الخبر واستخدم التوليد الذكي</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            className="gap-2 flex-1 sm:flex-none"
            onClick={handleGenerateAI}
            disabled={isGenerating}
            data-testid="button-generate-ai"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">توليد ذكي</span>
            <span className="sm:hidden">ذكي</span>
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={!formData.title}
            className="gap-2"
            data-testid="button-preview-news"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">معاينة</span>
          </Button>
          <Button 
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={createNewsMutation.isPending || updateNewsMutation.isPending}
            className="gap-2"
            data-testid="button-save-draft"
          >
            {(createNewsMutation.isPending || updateNewsMutation.isPending) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">مسودة</span>
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createNewsMutation.isPending || updateNewsMutation.isPending}
            className="gap-2 flex-1 sm:flex-none"
            data-testid="button-publish-news"
          >
            {(createNewsMutation.isPending || updateNewsMutation.isPending) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {editingNewsId ? "تحديث" : "نشر"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">المحتوى الرئيسي</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">العنوان الرئيسي *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="أدخل عنوان الخبر"
                  data-testid="input-news-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">العنوان الفرعي</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="عنوان فرعي توضيحي"
                  data-testid="input-news-subtitle"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">المحتوى *</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  placeholder="اكتب محتوى الخبر هنا... (50 حرف على الأقل للتوليد الذكي)"
                  onAIGenerate={handleGenerateAI}
                  isGenerating={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">الموجز الذكي</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="ملخص قصير للخبر"
                  className="min-h-[80px]"
                  data-testid="textarea-news-summary"
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" />
                تحسين محركات البحث (SEO)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">عنوان SEO</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder="عنوان محسن لمحركات البحث"
                  data-testid="input-seo-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoDescription">وصف SEO</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                  placeholder="وصف مختصر للظهور في نتائج البحث"
                  className="min-h-[60px]"
                  data-testid="textarea-seo-description"
                />
              </div>

              <div className="space-y-2">
                <Label>الكلمات المفتاحية</Label>
                <div className="flex gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="أضف كلمة مفتاحية"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                    data-testid="input-keyword"
                  />
                  <Button type="button" variant="outline" onClick={addKeyword}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {keyword}
                      <button type="button" onClick={() => removeKeyword(keyword)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">التصنيف والمصدر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>التصنيف *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">المصدر</Label>
                <Input
                  id="source"
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  placeholder="مصدر الخبر (اختياري)"
                  data-testid="input-source"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="is-featured" className="text-sm font-medium">خبر مميز</Label>
                  <p className="text-xs text-muted-foreground">
                    يظهر في قسم الهيرو بالصفحة الرئيسية
                  </p>
                </div>
                <Switch
                  id="is-featured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                  data-testid="switch-featured"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="h-4 w-4" />
                الصورة البارزة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formData.imageUrl ? (
                  <>
                    <div className="relative rounded-lg overflow-hidden border">
                      <img 
                        src={formData.imageUrl} 
                        alt={formData.imageAlt || "معاينة"} 
                        className="w-full h-40 object-cover"
                        onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/400x200?text=صورة'}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFeaturedImageUpload(file);
                            }}
                            data-testid="input-change-image"
                          />
                          <Button type="button" variant="secondary" size="sm" className="gap-1" asChild>
                            <span>
                              <Upload className="h-3 w-3" />
                              تغيير
                            </span>
                          </Button>
                        </label>
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, imageUrl: '', imageAlt: '' }))}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => document.getElementById('change-image-input')?.click()}
                        data-testid="button-change-image"
                      >
                        تغيير الصورة
                      </Button>
                      <input
                        id="change-image-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFeaturedImageUpload(file);
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '', imageAlt: '' }))}
                        data-testid="button-delete-image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageAlt">وصف الصورة</Label>
                      <Input
                        id="imageAlt"
                        value={formData.imageAlt}
                        onChange={(e) => setFormData(prev => ({ ...prev, imageAlt: e.target.value }))}
                        placeholder="وصف توضيحي للصورة"
                        data-testid="input-image-alt"
                      />
                      <p className="text-xs text-muted-foreground">يظهر هذا الوصف أسفل الصورة في الخبر</p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFeaturedImageUpload(file);
                        }}
                        data-testid="input-featured-image"
                      />
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary hover:bg-muted/50 transition-colors">
                        {isUploadingImage ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">جاري الرفع...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <ImagePlus className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm font-medium">اضغط لرفع صورة</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG حتى 10MB</p>
                          </div>
                        )}
                      </div>
                    </label>
                    <div className="text-center text-xs text-muted-foreground">أو</div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={handleGenerateImageAI}
                      disabled={isGeneratingImage || (!formData.title && !formData.content)}
                      data-testid="button-generate-image-ai"
                    >
                      {isGeneratingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      {isGeneratingImage ? 'جاري توليد الصورة...' : 'توليد صورة بالذكاء الاصطناعي'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Publishing Options Card */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                خيارات النشر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div 
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${publishMode === 'now' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}
                  onClick={() => setPublishMode('now')}
                  data-testid="option-publish-now"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${publishMode === 'now' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                      {publishMode === 'now' && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">نشر الآن</p>
                      <p className="text-xs text-muted-foreground">سيتم نشر الخبر مباشرة</p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${publishMode === 'schedule' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}
                  onClick={() => setPublishMode('schedule')}
                  data-testid="option-schedule"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${publishMode === 'schedule' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                      {publishMode === 'schedule' && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">جدولة النشر</p>
                      <p className="text-xs text-muted-foreground">حدد تاريخ ووقت النشر</p>
                    </div>
                  </div>
                </div>

                {publishMode === 'schedule' && (
                  <div className="space-y-3 pt-2">
                    <Label>تاريخ ووقت النشر *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Date picker */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">التاريخ</Label>
                        <Input
                          id="schedule-date"
                          type="date"
                          value={scheduledDateTime.slice(0, 10)}
                          onChange={(e) => {
                            const datePart = e.target.value;
                            const timePart = scheduledDateTime.slice(11, 16) || '09:00';
                            setScheduledDateTime(datePart ? `${datePart}T${timePart}` : '');
                          }}
                          min={getSaudiNow().slice(0, 10)}
                          className="text-center"
                          data-testid="input-schedule-date"
                        />
                      </div>
                      {/* Time picker — two selects (hour + minute) */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">الوقت (توقيت الرياض)</Label>
                        <div className="flex items-center gap-1">
                          {/* Hour select */}
                          <Select
                            value={scheduledDateTime.slice(11, 13) || ''}
                            onValueChange={(h) => {
                              const datePart = scheduledDateTime.slice(0, 10) || getSaudiNow().slice(0, 10);
                              const minPart = scheduledDateTime.slice(14, 16) || '00';
                              setScheduledDateTime(`${datePart}T${h}:${minPart}`);
                            }}
                          >
                            <SelectTrigger className="flex-1 text-center" data-testid="select-schedule-hour">
                              <SelectValue placeholder="ساعة" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, h) => {
                                const hh = h.toString().padStart(2, '0');
                                const label = h === 0 ? '12 ص' : h < 12 ? `${h} ص` : h === 12 ? '12 م' : `${h - 12} م`;
                                return <SelectItem key={hh} value={hh}>{label} ({hh})</SelectItem>;
                              })}
                            </SelectContent>
                          </Select>
                          <span className="text-muted-foreground font-bold">:</span>
                          {/* Minute select */}
                          <Select
                            value={(() => {
                              const m = parseInt(scheduledDateTime.slice(14, 16) || '0');
                              const steps = Array.from({length: 12}, (_, i) => i * 5);
                              const snapped = steps.reduce((prev, cur) => Math.abs(cur - m) < Math.abs(prev - m) ? cur : prev, 0);
                              return snapped.toString().padStart(2, '0');
                            })()}
                            onValueChange={(min) => {
                              const datePart = scheduledDateTime.slice(0, 10) || getSaudiNow().slice(0, 10);
                              const hourPart = scheduledDateTime.slice(11, 13) || '09';
                              setScheduledDateTime(`${datePart}T${hourPart}:${min}`);
                            }}
                          >
                            <SelectTrigger className="w-20 text-center" data-testid="select-schedule-minute">
                              <SelectValue placeholder="دقيقة" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({length: 12}, (_, i) => (i * 5).toString().padStart(2, '0')).map(m => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    {scheduledDateTime && scheduledDateTime.length >= 16 && (
                      <p className="text-xs text-primary font-medium">
                        📅 سيتم نشر الخبر: {fmtSaudiDate(saudiInputToISO(scheduledDateTime), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">معاينة الخبر</DialogTitle>
            <DialogDescription>هذه معاينة للخبر قبل النشر</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Image Preview */}
            {formData.imageUrl && (
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                <img 
                  src={formData.imageUrl} 
                  alt={formData.imageAlt || formData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Category Badge */}
            {formData.category && (
              <Badge className={`${categories.find(c => c.value === formData.category)?.color || 'bg-gray-500'} text-white`}>
                {categories.find(c => c.value === formData.category)?.label || formData.category}
              </Badge>
            )}
            
            {/* Title */}
            <h1 className="text-2xl font-bold leading-tight">{formData.title || 'بدون عنوان'}</h1>
            
            {/* Subtitle */}
            {formData.subtitle && (
              <p className="text-lg text-muted-foreground">{formData.subtitle}</p>
            )}
            
            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-b pb-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date().toLocaleDateString('ar-SA', { timeZone: SAUDI_TZ, year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              {formData.source && (
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {formData.source}
                </span>
              )}
            </div>
            
            {/* Summary */}
            {formData.summary && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-muted-foreground">{formData.summary}</p>
              </div>
            )}
            
            {/* Content */}
            <div 
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: formData.content || '<p>لا يوجد محتوى</p>' }}
            />
            
            {/* Keywords */}
            {formData.keywords && formData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {formData.keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="outline">{keyword}</Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              إغلاق
            </Button>
            <Button onClick={() => { setShowPreview(false); handleSubmitNews(); }}>
              <Save className="h-4 w-4 ml-2" />
              نشر الآن
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // News Section Component with status tabs (Redesigned like Sabq)
  const NewsSection = () => {
    // Stats for each status
    const publishedCount = dashboardStats?.publishedNews || 0;
    const scheduledCount = dashboardStats?.scheduledNews || 0;
    const draftCount = dashboardStats?.draftNews || 0;
    const deletedCount = dashboardStats?.deletedNews || 0;

    const statusCards = [
      { id: 'published' as NewsStatusTab, label: 'منشورة', count: publishedCount, color: 'bg-green-50 dark:bg-green-950/20', textColor: 'text-green-600 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-900/50', iconColor: 'text-green-500', icon: Check },
      { id: 'scheduled' as NewsStatusTab, label: 'مجدولة', count: scheduledCount, color: 'bg-blue-50 dark:bg-blue-950/20', textColor: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/50', iconColor: 'text-blue-500', icon: Clock },
      { id: 'draft' as NewsStatusTab, label: 'مسودة', count: draftCount, color: 'bg-amber-50 dark:bg-amber-950/20', textColor: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-900/50', iconColor: 'text-amber-500', icon: Edit },
      { id: 'deleted' as NewsStatusTab, label: 'مؤرشفة', count: deletedCount, color: 'bg-slate-50 dark:bg-slate-900/20', textColor: 'text-slate-600 dark:text-slate-400', iconBg: 'bg-slate-100 dark:bg-slate-800/50', iconColor: 'text-slate-500', icon: Trash2 },
    ];

    const filteredNews = adminNews || [];

    const categoryLabel = (cat: string) => categories.find(c => c.value === cat)?.label || cat;
    const statusBadge = (status: string) => {
      const map: Record<string, { label: string; cls: string }> = {
        published: { label: "منشور", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
        scheduled: { label: "مجدول", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
        draft: { label: "مسودة", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
        deleted: { label: "محذوف", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
      };
      const s = map[status] || { label: status, cls: "bg-muted text-muted-foreground" };
      return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.cls}`}>{s.label}</span>;
    };

    const featuredCount = dashboardStats?.featuredNews || 0;

    return (
    <div className="space-y-5">

      {/* ── Hero Header (GREEN - same as Dashboard) ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 via-emerald-700 to-teal-700 shadow-xl">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-1/2 w-px h-full bg-white/5 pointer-events-none" />
        <div className="relative px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Title */}
            <div className="text-white">
              <p className="text-white/50 text-xs mb-1.5 flex items-center gap-1.5">
                <span>الرئيسية</span>
                <ChevronRight className="h-3 w-3" />
                <span>إدارة الأخبار</span>
              </p>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">إدارة الأخبار</h1>
              <p className="text-white/60 text-sm">إدارة وتنظيم ونشر المحتوى الإخباري</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={() => { resetForm(); setPublishMode('now'); setScheduledDateTime(""); setLocation('/admin/news/new'); }}
                  className="gap-1.5 bg-white text-green-800 hover:bg-white/90 text-xs h-8 font-semibold shadow-md"
                  data-testid="button-add-news"
                >
                  <Plus className="h-3.5 w-3.5" />
                  خبر جديد
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => autoClassifyMiscMutation.mutate()}
                  disabled={autoClassifyMiscMutation.isPending || !!classifyJobId}
                  className="gap-1.5 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-xs h-8"
                  data-testid="button-auto-classify"
                >
                  {(autoClassifyMiscMutation.isPending || !!classifyJobId)
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Sparkles className="h-3.5 w-3.5" />
                  }
                  تصنيف ذكي
                </Button>
              </div>
            </div>
            {/* Compact Stats */}
            <div className="grid grid-cols-4 gap-2 shrink-0">
              {[
                { label: "منشور", val: publishedCount, icon: Check },
                { label: "مجدول", val: scheduledCount, icon: Clock },
                { label: "مسودة", val: draftCount, icon: Edit },
                { label: "مميز", val: featuredCount, icon: Star },
              ].map(s => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10 hover:bg-white/15 transition-colors">
                  <s.icon className="h-4 w-4 mx-auto text-white/70 mb-1" />
                  <p className="text-lg font-bold text-white leading-none">{s.val.toLocaleString('en-US')}</p>
                  <p className="text-[10px] text-white/50 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-1 w-fit">
        {statusCards.map((card) => (
          <button
            key={card.id}
            onClick={() => { setNewsStatusTab(card.id); setAdminNewsPage(1); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              newsStatusTab === card.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
            data-testid={`stat-card-${card.id}`}
          >
            <card.icon className={`h-3.5 w-3.5 ${newsStatusTab === card.id ? card.iconColor : ''}`} />
            {card.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              newsStatusTab === card.id
                ? `${card.iconBg} ${card.iconColor}`
                : 'bg-muted text-muted-foreground'
            }`}>
              {card.count.toLocaleString('en-US')}
            </span>
          </button>
        ))}
      </div>

      {/* ── Classify Progress Banner ── */}
      {/* Classify Progress Banner in News Section */}
      {classifyProgress && (
        <Card className={`border-2 ${classifyProgress.status === 'done' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : classifyProgress.status === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-primary/40 bg-primary/5'}`}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {classifyProgress.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {classifyProgress.status === 'done' && <Check className="h-4 w-4 text-green-600" />}
                {classifyProgress.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                <span className="font-semibold text-sm">
                  {classifyProgress.status === 'running' ? 'جاري التصنيف التلقائي...' : classifyProgress.status === 'done' ? 'اكتمل التصنيف ✅' : 'خطأ في التصنيف'}
                </span>
              </div>
              <span className="text-sm font-mono text-muted-foreground">
                {classifyProgress.processed} / {classifyProgress.total}
                {' '}({classifyProgress.total > 0 ? Math.round((classifyProgress.processed / classifyProgress.total) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${classifyProgress.status === 'done' ? 'bg-green-500' : classifyProgress.status === 'error' ? 'bg-red-500' : 'bg-primary'}`}
                style={{ width: `${classifyProgress.total > 0 ? (classifyProgress.processed / classifyProgress.total) * 100 : 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{classifyProgress.currentLabel}</span>
              <span className="flex gap-3">
                <span className="text-emerald-600">مقالات: {classifyProgress.articlesClassified}</span>
                <span className="text-blue-600">أخبار: {classifyProgress.newsClassified}</span>
                {classifyProgress.errors > 0 && <span className="text-red-500">أخطاء: {classifyProgress.errors}</span>}
              </span>
            </div>
            {classifyProgress.status === 'done' && classifyProgress.message && (
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">{classifyProgress.message}</p>
            )}
            {classifyProgress.status !== 'running' && (
              <div className="flex items-center gap-3">
                {classifyProgress.status === 'done' && (classifyProgress.remaining ?? 0) > 0 && (
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => { setClassifyProgress(null); setClassifyJobId(null); setTimeout(() => handleAutoCategorize(), 100); }}>
                    <Sparkles className="h-3 w-3" />
                    متابعة التصنيف ({(classifyProgress.remaining ?? 0).toLocaleString('ar-SA')} متبقي)
                  </Button>
                )}
                <button onClick={() => { setClassifyProgress(null); setClassifyJobId(null); queryClient.invalidateQueries({ queryKey: ['/api/admin/category-stats'] }); }} className="text-xs text-muted-foreground hover:text-foreground underline">إغلاق</button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Search & Filters Bar ── */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ابحث عن خبر..."
            value={newsSearchQuery}
            onChange={(e) => { setNewsSearchQuery(e.target.value); setAdminNewsPage(1); }}
            className="pr-9 h-9 text-sm"
            data-testid="input-news-search"
          />
        </div>
        <Select value={newsCategoryFilter} onValueChange={(v) => { setNewsCategoryFilter(v); setAdminNewsPage(1); }}>
          <SelectTrigger className="w-full sm:w-44 h-9 text-sm" data-testid="select-news-category-filter">
            <SelectValue placeholder="كل التصنيفات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل التصنيفات</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Select value={adminNewsSortBy} onValueChange={(v) => { setAdminNewsSortBy(v); setAdminNewsPage(1); }}>
            <SelectTrigger className="w-36 h-9 text-sm" data-testid="select-sort-by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="publishedAt">تاريخ النشر</SelectItem>
              <SelectItem value="createdAt">تاريخ الإنشاء</SelectItem>
              <SelectItem value="title">العنوان</SelectItem>
              <SelectItem value="category">التصنيف</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setAdminNewsSortOrder(adminNewsSortOrder === 'desc' ? 'asc' : 'desc')}
            data-testid="button-toggle-sort-order"
            title={adminNewsSortOrder === 'desc' ? 'تنازلي' : 'تصاعدي'}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </Button>
          {(newsSearchQuery || newsCategoryFilter !== 'all') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => { setNewsSearchQuery(""); setNewsCategoryFilter("all"); setAdminNewsPage(1); }}
              title="مسح الفلاتر"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedNewsIds.size > 0 && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{selectedNewsIds.size} محدد</Badge>
            <button onClick={() => setSelectedNewsIds(new Set())} className="text-sm text-muted-foreground hover:text-foreground">
              إلغاء التحديد
            </button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
            className="gap-2"
            data-testid="button-bulk-delete"
          >
            {bulkDeleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {newsStatusTab === 'deleted' ? 'حذف نهائي' : 'نقل للمحذوفات'} ({selectedNewsIds.size})
          </Button>
        </div>
      )}

      {/* ── Professional News Table ── */}
      <Card className="border-0 shadow-md overflow-hidden">
        {/* Table Header */}
        <div className="px-5 py-3.5 border-b bg-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={toggleSelectAll} className="hover:text-primary transition-colors" title="تحديد الكل">
              {selectedNewsIds.size === filteredNews.length && filteredNews.length > 0
                ? <CheckSquare className="h-4 w-4 text-primary" />
                : <Square className="h-4 w-4 text-muted-foreground" />
              }
            </button>
            <div className="h-4 w-px bg-border" />
            <p className="text-sm font-semibold text-foreground">قائمة الأخبار</p>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{adminNewsTotal} خبر</span>
          </div>
          {isLoadingAdminNews
            ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            : <span className="text-xs text-muted-foreground">صفحة {adminNewsPage} من {adminNewsTotalPages}</span>
          }
        </div>

        {isLoadingAdminNews ? (
          <div className="p-12 text-center">
            <Loader2 className="h-7 w-7 mx-auto animate-spin text-primary mb-3" />
            <p className="text-muted-foreground text-sm">جاري التحميل...</p>
          </div>
        ) : filteredNews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* thead */}
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="w-10 p-3 text-right" />
                  <th className="p-3 text-right font-medium text-muted-foreground text-xs">الخبر</th>
                  <th className="p-3 text-right font-medium text-muted-foreground text-xs hidden md:table-cell w-28">التصنيف</th>
                  <th className="p-3 text-center font-medium text-muted-foreground text-xs hidden md:table-cell w-20">الحالة</th>
                  <th className="p-3 text-right font-medium text-muted-foreground text-xs hidden lg:table-cell w-32">المصدر</th>
                  <th className="p-3 text-right font-medium text-muted-foreground text-xs hidden lg:table-cell w-36">التاريخ</th>
                  <th className="p-3 text-center font-medium text-muted-foreground text-xs hidden lg:table-cell w-20">المشاهدات</th>
                  <th className="p-3 text-center font-medium text-muted-foreground text-xs w-12">⭐</th>
                  <th className="p-3 text-center font-medium text-muted-foreground text-xs w-12">🔴</th>
                  <th className="p-3 text-center font-medium text-muted-foreground text-xs w-24">إجراءات</th>
                </tr>
              </thead>
              {/* tbody */}
              <tbody className="divide-y divide-border/50">
                {filteredNews.map((item: any, index: number) => (
                  <tr
                    key={item.id}
                    className={`group transition-colors ${item.isBreaking ? "bg-red-50/60 dark:bg-red-950/20 hover:bg-red-100/60 dark:hover:bg-red-950/30 border-r-[3px] border-r-red-500" : "hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"} ${selectedNewsIds.has(item.id) ? 'bg-primary/5' : ''}`}
                    data-testid={`row-news-${index}`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 w-10">
                      <button onClick={() => toggleSelectNews(item.id)} className="text-muted-foreground hover:text-primary transition-colors" data-testid={`checkbox-news-${index}`}>
                        {selectedNewsIds.has(item.id)
                          ? <CheckSquare className="h-4 w-4 text-primary" />
                          : <Square className="h-4 w-4" />
                        }
                      </button>
                    </td>

                    {/* Title + Thumbnail */}
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="w-11 h-11 object-cover rounded-lg shrink-0 hidden sm:block bg-muted border border-border/50" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-muted shrink-0 hidden sm:flex items-center justify-center border border-border/50">
                            <Newspaper className="h-4 w-4 text-muted-foreground/40" />
                          </div>
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
                              {item.title}
                            </p>
                          </div>
                          {/* Mobile: status + date + time */}
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[11px] text-muted-foreground md:hidden">
                            {statusBadge(item.status)}
                            <span>{fmtSaudiDateOnly(item.publishedAt || item.createdAt)}</span>
                            <span className="opacity-40">·</span>
                            <span>{fmtSaudiTimeOnly(item.publishedAt || item.createdAt)}</span>
                            {item.createdBy && (
                              <>
                                <span className="opacity-40">·</span>
                                <span className="text-muted-foreground/70">{item.createdBy}</span>
                              </>
                            )}
                          </div>
                          {/* Mobile: views count */}
                          <div className="flex items-center gap-1.5 mt-0.5 lg:hidden">
                            <span className="text-[11px] font-semibold text-foreground/70">
                              {(item.viewCount ?? 0).toLocaleString('ar-SA-u-nu-latn')}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50">مشاهدة</span>
                            {item.todayViews > 0 && (
                              <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                                <TrendingUp className="h-2.5 w-2.5" />+{item.todayViews}
                              </span>
                            )}
                          </div>
                          {item.status === 'scheduled' && item.scheduledAt && (
                            <p
                              className={`text-[11px] flex items-center gap-1 mt-0.5 md:hidden ${new Date(item.scheduledAt).getTime() > Date.now() ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}
                              title={`${fmtSaudiDateOnly(item.scheduledAt)} ${fmtSaudiTimeOnly(item.scheduledAt)}`}
                              data-testid={`text-scheduled-relative-${item.id}`}
                            >
                              <Clock className="h-3 w-3 shrink-0" />
                              {relativeScheduledTime(item.scheduledAt)}
                            </p>
                          )}
                          {item.createdBy && (
                            <p className="text-[11px] text-muted-foreground/60 mt-0.5 hidden lg:block">بواسطة: {item.createdBy}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3 hidden md:table-cell">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-medium bg-muted text-muted-foreground">
                        {categoryLabel(item.category)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3 text-center hidden md:table-cell">
                      <div className="flex flex-col items-center gap-1">
                        {statusBadge(item.status)}
                        {item.status === 'scheduled' && item.scheduledAt && (
                          <span
                            className={`text-[10px] font-medium leading-tight ${new Date(item.scheduledAt).getTime() > Date.now() ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}
                            title={`${fmtSaudiDateOnly(item.scheduledAt)} ${fmtSaudiTimeOnly(item.scheduledAt)}`}
                            data-testid={`text-scheduled-countdown-${item.id}`}
                          >
                            {relativeScheduledTime(item.scheduledAt)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Source */}
                    <td className="p-3 hidden lg:table-cell">
                      <span className="text-[11px] text-muted-foreground truncate block max-w-[120px]" title={item.source || ''}>
                        {item.source || <span className="opacity-40">—</span>}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="p-3 hidden lg:table-cell">
                      <p className="text-[11px] text-muted-foreground">{fmtSaudiDateOnly(item.publishedAt || item.createdAt)}</p>
                      <p className="text-[10px] text-muted-foreground/60">{fmtSaudiTimeOnly(item.publishedAt || item.createdAt)}</p>
                    </td>

                    {/* Views */}
                    <td className="p-3 text-center hidden lg:table-cell" data-testid={`text-views-${index}`}>
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold text-foreground">{(item.viewCount ?? 0).toLocaleString('ar-SA-u-nu-latn')}</span>
                        {item.todayViews > 0 && (
                          <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                            <TrendingUp className="h-2.5 w-2.5" />{item.todayViews}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Featured */}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleFeaturedMutation.mutate({ id: item.id, isFeatured: !item.isFeatured })}
                        disabled={toggleFeaturedMutation.isPending}
                        className={`w-7 h-7 mx-auto flex items-center justify-center rounded-lg transition-all ${item.isFeatured ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'text-muted-foreground/40 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 opacity-0 group-hover:opacity-100'}`}
                        title={item.isFeatured ? 'إلغاء التمييز' : 'تمييز'}
                        data-testid={`button-toggle-featured-${index}`}
                      >
                        <Star className={`h-3.5 w-3.5 ${item.isFeatured ? 'fill-current' : ''}`} />
                      </button>
                    </td>

                    {/* Breaking */}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleBreakingMutation.mutate({ id: item.id, isBreaking: !item.isBreaking })}
                        disabled={toggleBreakingMutation.isPending}
                        className={`w-7 h-7 mx-auto flex items-center justify-center rounded-lg transition-all ${item.isBreaking ? 'text-red-600 bg-red-50 dark:bg-red-900/30' : 'text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100'}`}
                        title={item.isBreaking ? 'إزالة علامة عاجل' : 'تمييز كخبر عاجل'}
                        data-testid={`button-toggle-breaking-${index}`}
                      >
                        <AlertTriangle className={`h-3.5 w-3.5 ${item.isBreaking ? 'fill-current' : ''}`} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {newsStatusTab === 'deleted' ? (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" onClick={() => handleRestoreNews(item.id)} title="استعادة" data-testid={`button-restore-news-${index}`}>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => handleDeleteNews(item.id)} title="حذف نهائي" data-testid={`button-delete-news-${index}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 ${item.socialContentGenerated ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" : "hover:bg-muted hover:text-emerald-700"}`}
                              onClick={() => setSocialModalNews({ id: item.id, title: item.title })}
                              title="توليد محتوى السوشيال ميديا"
                              data-testid={`button-social-news-${index}`}
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted hover:text-emerald-700" onClick={() => handleEditNews(item)} title="تعديل" data-testid={`button-edit-news-${index}`}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => handleDeleteNews(item.id)} title="حذف" data-testid={`button-delete-news-${index}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Newspaper className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium mb-1">
              {newsSearchQuery || newsCategoryFilter !== 'all'
                ? 'لا توجد نتائج مطابقة للبحث'
                : newsStatusTab === 'deleted' ? 'لا توجد أخبار محذوفة'
                : newsStatusTab === 'draft' ? 'لا توجد مسودات'
                : newsStatusTab === 'scheduled' ? 'لا توجد أخبار مجدولة'
                : 'لا توجد أخبار منشورة بعد'}
            </p>
            {newsStatusTab === 'published' && !newsSearchQuery && newsCategoryFilter === 'all' && (
              <Button className="mt-4 gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => { resetForm(); setPublishMode('now'); setScheduledDateTime(""); setLocation('/admin/news/new'); }}>
                <Plus className="h-4 w-4" />
                إضافة أول خبر
              </Button>
            )}
          </div>
        )}

          {/* Pagination */}
          {adminNewsTotalPages > 1 && (
            <div className="flex items-center justify-between gap-2 p-4 border-t" dir="rtl">
              <span className="text-sm text-muted-foreground">
                صفحة {adminNewsPage} من {adminNewsTotalPages} ({adminNewsTotal} خبر)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAdminNewsPage(1)}
                  disabled={adminNewsPage === 1}
                  data-testid="button-admin-first-page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAdminNewsPage(adminNewsPage - 1)}
                  disabled={adminNewsPage === 1}
                  data-testid="button-admin-prev-page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {(() => {
                  const pages: (number | 'dots')[] = [];
                  if (adminNewsTotalPages <= 7) {
                    for (let i = 1; i <= adminNewsTotalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (adminNewsPage > 3) pages.push('dots');
                    const start = Math.max(2, adminNewsPage - 1);
                    const end = Math.min(adminNewsTotalPages - 1, adminNewsPage + 1);
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (adminNewsPage < adminNewsTotalPages - 2) pages.push('dots');
                    pages.push(adminNewsTotalPages);
                  }
                  return pages.map((p, i) =>
                    p === 'dots' ? (
                      <span key={`dots-${i}`} className="px-2 text-muted-foreground">...</span>
                    ) : (
                      <Button
                        key={p}
                        variant={adminNewsPage === p ? "default" : "outline"}
                        size="icon"
                        onClick={() => setAdminNewsPage(p)}
                        data-testid={`button-admin-page-${p}`}
                      >
                        {p}
                      </Button>
                    )
                  );
                })()}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAdminNewsPage(adminNewsPage + 1)}
                  disabled={adminNewsPage === adminNewsTotalPages}
                  data-testid="button-admin-next-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAdminNewsPage(adminNewsTotalPages)}
                  disabled={adminNewsPage === adminNewsTotalPages}
                  data-testid="button-admin-last-page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
      </Card>
    </div>
  );
  };

  // Articles Section Component
  const ArticlesSection = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            إدارة المقالات
          </h1>
          <p className="text-sm text-muted-foreground">عرض وتعديل وحذف المقالات الطبية</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={() => autoClassifyMiscMutation.mutate()}
            disabled={autoClassifyMiscMutation.isPending || !!classifyJobId}
            className="gap-2 w-full sm:w-auto"
            data-testid="button-auto-classify"
          >
            {autoClassifyMiscMutation.isPending || classifyJobId ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري التصنيف...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                تصنيف منوعات تلقائياً
              </>
            )}
          </Button>
          <Button 
            onClick={() => { resetArticleForm(); setLocation('/admin/articles/new'); }}
            className="gap-2 w-full sm:w-auto"
            data-testid="button-add-article"
          >
            <Plus className="h-4 w-4" />
            إضافة مقال جديد
          </Button>
        </div>
      </div>

      {/* Classify Progress Card */}
      {classifyProgress && (
        <Card className={`border-2 ${classifyProgress.status === 'done' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : classifyProgress.status === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-primary/40 bg-primary/5'}`}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {classifyProgress.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {classifyProgress.status === 'done' && <Check className="h-4 w-4 text-green-600" />}
                {classifyProgress.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                <span className="font-semibold text-sm">
                  {classifyProgress.status === 'running' ? 'جاري التصنيف التلقائي...' : classifyProgress.status === 'done' ? 'اكتمل التصنيف ✅' : 'خطأ في التصنيف'}
                </span>
              </div>
              <span className="text-sm font-mono text-muted-foreground">
                {classifyProgress.processed} / {classifyProgress.total}
                {' '}({classifyProgress.total > 0 ? Math.round((classifyProgress.processed / classifyProgress.total) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${classifyProgress.status === 'done' ? 'bg-green-500' : classifyProgress.status === 'error' ? 'bg-red-500' : 'bg-primary'}`}
                style={{ width: `${classifyProgress.total > 0 ? (classifyProgress.processed / classifyProgress.total) * 100 : 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{classifyProgress.currentLabel}</span>
              <span className="flex gap-3">
                <span className="text-emerald-600">مقالات: {classifyProgress.articlesClassified}</span>
                <span className="text-blue-600">أخبار: {classifyProgress.newsClassified}</span>
                {classifyProgress.errors > 0 && <span className="text-red-500">أخطاء: {classifyProgress.errors}</span>}
              </span>
            </div>
            {classifyProgress.status === 'done' && classifyProgress.message && (
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">{classifyProgress.message}</p>
            )}
            {classifyProgress.status !== 'running' && (
              <div className="flex items-center gap-3">
                {classifyProgress.status === 'done' && (classifyProgress.remaining ?? 0) > 0 && (
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => { setClassifyProgress(null); setClassifyJobId(null); setTimeout(() => handleAutoCategorize(), 100); }}>
                    <Sparkles className="h-3 w-3" />
                    متابعة ({(classifyProgress.remaining ?? 0).toLocaleString('ar-SA')} متبقي)
                  </Button>
                )}
                <button onClick={() => { setClassifyProgress(null); setClassifyJobId(null); queryClient.invalidateQueries({ queryKey: ['/api/admin/category-stats'] }); }} className="text-xs text-muted-foreground hover:text-foreground underline">إغلاق</button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Articles List */}
      <div className="grid gap-4">
        {articles?.map((article: any, index: number) => (
          <Card key={article.id} className="hover-elevate" data-testid={`card-article-${index}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge 
                      variant={article.status === 'published' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {article.status === 'published' ? 'منشور' : 'مسودة'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {categories.find((c: any) => c.value === article.category)?.label || article.category}
                    </Badge>
                    {article.socialContentData && (
                      <Badge className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300" data-testid={`badge-generated-${index}`}>
                        <Share2 className="h-2.5 w-2.5 ml-1" />
                        محتوى محفوظ
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-lg mb-1 truncate">{article.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{article.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.readTime} دقائق للقراءة
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {article.reviewedBy}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                  <Button
                    variant={article.socialContentGenerated ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setSocialModalArticle({ id: article.id, title: article.title, socialContentData: article.socialContentData })}
                    data-testid={`button-social-article-${index}`}
                    className={`gap-1.5 text-xs ${article.socialContentGenerated ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40" : ""}`}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    انشر على السوشيال ميديا
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditArticle(article)}
                      data-testid={`button-edit-article-${index}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteArticle(article.id)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-article-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!articles || articles.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد مقالات حالياً</p>
              <Button 
                className="mt-4"
                onClick={() => { resetArticleForm(); setLocation('/admin/articles/new'); }}
              >
                إضافة أول مقال
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  // Google News Search & Import
  const handleSearchGoogleNews = async (page = 1) => {
    setIsSearchingGoogle(true);
    try {
      const res = await fetch(`/api/admin/google-news?q=${encodeURIComponent(googleNewsQuery)}&page=${page}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('فشل في البحث');
      const data = await res.json();
      if (page === 1) {
        setGoogleNewsResults(data.results);
      } else {
        setGoogleNewsResults(prev => [...prev, ...data.results]);
      }
      setGoogleNewsPage(page);
      setGoogleHasMore(data.hasMore);
    } catch (error: any) {
      toast({ title: "خطأ في البحث", description: error.message, variant: "destructive" });
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  const handleImportGoogleNewsItem = async (item: any) => {
    setIsImportingGoogleNews(item.link);
    try {
      const res = await apiRequest("POST", "/api/admin/google-news/import", {
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        source: item.source,
        imageUrl: item.imageUrl,
        category: 'health-news',
      });
      const data = await res.json();
      toast({ title: "تم الاستيراد", description: `تم استيراد "${item.title}" كمسودة` });
      setGoogleNewsResults(prev => prev.filter(r => r.link !== item.link));
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news"] });
    } catch (error: any) {
      toast({ title: "خطأ في الاستيراد", description: error.message || "فشل في الاستيراد", variant: "destructive" });
    } finally {
      setIsImportingGoogleNews(null);
    }
  };

  // WordPress Import Section
  const handlePreviewWordPress = async () => {
    if (!wpSiteUrl) {
      toast({ title: "خطأ", description: "الرجاء إدخال رابط موقع WordPress", variant: "destructive" });
      return;
    }
    setIsPreviewingWp(true);
    setWpPreviewData(null);
    setWpImportResult(null);
    try {
      const res = await apiRequest("POST", "/api/import/wordpress/preview", {
        siteUrl: wpSiteUrl,
        perPage: wpPerPage,
        page: wpPage
      });
      const data = await res.json();
      setWpPreviewData(data);
      toast({ title: "تم", description: `تم العثور على ${data.pagination.totalPosts} خبر` });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في الاتصال بموقع WordPress", variant: "destructive" });
    } finally {
      setIsPreviewingWp(false);
    }
  };

  const handleImportWordPress = async () => {
    if (!wpSiteUrl) {
      toast({ title: "خطأ", description: "الرجاء إدخال رابط موقع WordPress", variant: "destructive" });
      return;
    }
    setIsImportingWp(true);
    setWpImportResult(null);
    try {
      const res = await apiRequest("POST", "/api/import/wordpress", {
        siteUrl: wpSiteUrl,
        perPage: wpPerPage,
        page: wpPage,
        category: wpDefaultCategory,
        importImages: true
      });
      const data = await res.json();
      setWpImportResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ 
        title: "تم الاستيراد", 
        description: `تم استيراد ${data.imported} خبر بنجاح${data.errors > 0 ? ` (${data.errors} أخطاء)` : ''}` 
      });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في استيراد الأخبار", variant: "destructive" });
    } finally {
      setIsImportingWp(false);
    }
  };

  const handleClearAllNews = async () => {
    setIsClearingNews(true);
    try {
      const res = await apiRequest("DELETE", "/api/admin/clear-news");
      const data = await res.json();
      toast({ title: "تم الحذف", description: `تم حذف ${data.deletedCount} خبر بنجاح` });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في حذف الأخبار", variant: "destructive" });
    } finally {
      setIsClearingNews(false);
      setShowClearConfirm(false);
    }
  };

  const handleAutoCategorize = () => {
    autoClassifyMiscMutation.mutate();
  };

  const handleBulkImportWordPress = async () => {
    if (!wpSiteUrl) {
      toast({ title: "خطأ", description: "الرجاء إدخال رابط موقع WordPress", variant: "destructive" });
      return;
    }
    setIsBulkImportingWp(true);
    setWpImportResult(null);
    setBulkImportProgress({ currentPage: 0, totalPages: 0, imported: 0, errors: 0, isRunning: true });

    try {
      const previewRes = await apiRequest("POST", "/api/import/wordpress/preview", {
        siteUrl: wpSiteUrl,
        perPage: 100,
        page: 1
      });
      const previewData = await previewRes.json();
      const totalPages = previewData.pagination.totalPages;
      const totalPosts = previewData.pagination.totalPosts;

      setBulkImportProgress(prev => ({ ...prev, totalPages }));

      toast({ title: "بدء الاستيراد الشامل", description: `سيتم استيراد ${totalPosts} خبر على ${totalPages} دفعة` });

      let totalImported = 0;
      let totalErrors = 0;

      for (let page = 1; page <= totalPages; page++) {
        setBulkImportProgress(prev => ({ ...prev, currentPage: page }));

        try {
          const res = await apiRequest("POST", "/api/import/wordpress", {
            siteUrl: wpSiteUrl,
            perPage: 100,
            page,
            category: wpDefaultCategory,
            importImages: true
          });
          const data = await res.json();
          totalImported += data.imported;
          totalErrors += data.errors;

          setBulkImportProgress(prev => ({
            ...prev,
            imported: totalImported,
            errors: totalErrors,
          }));
        } catch (pageError: any) {
          const remainingInPage = Math.min(100, totalPosts - (page - 1) * 100);
          totalErrors += remainingInPage;
          setBulkImportProgress(prev => ({ ...prev, errors: totalErrors }));
          console.error(`Error importing page ${page}:`, pageError);
        }
      }

      setBulkImportProgress(prev => ({ ...prev, isRunning: false }));
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news"] });
      toast({
        title: "اكتمل الاستيراد الشامل",
        description: `تم استيراد ${totalImported} خبر${totalErrors > 0 ? ` مع ${totalErrors} خطأ` : ' بنجاح'}`
      });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في الاستيراد الشامل", variant: "destructive" });
      setBulkImportProgress(prev => ({ ...prev, isRunning: false }));
    } finally {
      setIsBulkImportingWp(false);
    }
  };

  // Color options for categories
  const colorOptions = [
    { value: "emerald-600", label: "أخضر زمردي", bg: "bg-emerald-600" },
    { value: "blue-600", label: "أزرق", bg: "bg-blue-600" },
    { value: "red-600", label: "أحمر", bg: "bg-red-600" },
    { value: "purple-600", label: "بنفسجي", bg: "bg-purple-600" },
    { value: "amber-600", label: "كهرماني", bg: "bg-amber-600" },
    { value: "rose-600", label: "وردي", bg: "bg-rose-600" },
    { value: "orange-600", label: "برتقالي", bg: "bg-orange-600" },
    { value: "green-600", label: "أخضر", bg: "bg-green-600" },
    { value: "teal-600", label: "أزرق مخضر", bg: "bg-teal-600" },
    { value: "cyan-600", label: "سماوي", bg: "bg-cyan-600" },
    { value: "indigo-600", label: "نيلي", bg: "bg-indigo-600" },
    { value: "pink-600", label: "زهري", bg: "bg-pink-600" },
  ];

  const CategoriesSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            إدارة التصنيفات
          </h1>
          <p className="text-muted-foreground">إضافة وتعديل تصنيفات الأخبار والمقالات</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            onClick={handleAutoCategorize}
            disabled={autoClassifyMiscMutation.isPending || classifyProgress?.status === 'running'}
            variant="outline"
            className="gap-2"
            data-testid="button-auto-categorize"
          >
            {(autoClassifyMiscMutation.isPending || classifyProgress?.status === 'running') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            تصنيف تلقائي بالذكاء الاصطناعي
          </Button>
          <Button 
            onClick={() => {
              resetCategoryForm();
              setEditingCategoryId(null);
              setShowCategoryForm(true);
            }}
            className="gap-2"
            data-testid="button-add-category"
          >
            <Plus className="h-4 w-4" />
            إضافة تصنيف
          </Button>
        </div>
      </div>

      {classifyProgress && (
        <Card className={`border-2 ${classifyProgress.status === 'done' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : classifyProgress.status === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-primary/40 bg-primary/5'}`}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {classifyProgress.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {classifyProgress.status === 'done' && <Check className="h-4 w-4 text-green-600" />}
                {classifyProgress.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                <span className="font-semibold text-sm">
                  {classifyProgress.status === 'running' ? 'جاري التصنيف التلقائي...' : classifyProgress.status === 'done' ? 'اكتمل التصنيف ✅' : 'خطأ في التصنيف'}
                </span>
              </div>
              <span className="text-sm font-mono text-muted-foreground">
                {classifyProgress.processed} / {classifyProgress.total} ({classifyProgress.total > 0 ? Math.round((classifyProgress.processed / classifyProgress.total) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${classifyProgress.status === 'done' ? 'bg-green-500' : classifyProgress.status === 'error' ? 'bg-red-500' : 'bg-primary'}`}
                style={{ width: `${classifyProgress.total > 0 ? (classifyProgress.processed / classifyProgress.total) * 100 : 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{classifyProgress.currentLabel}</span>
              <span className="flex gap-3">
                <span className="text-emerald-600">مقالات: {classifyProgress.articlesClassified}</span>
                <span className="text-blue-600">أخبار: {classifyProgress.newsClassified}</span>
                {classifyProgress.errors > 0 && <span className="text-red-500">أخطاء: {classifyProgress.errors}</span>}
              </span>
            </div>
            {classifyProgress.status === 'done' && (
              <div className="flex items-center justify-between flex-wrap gap-2">
                {classifyProgress.message && <p className="text-sm text-green-700 dark:text-green-400 font-medium flex-1">{classifyProgress.message}</p>}
                <div className="flex items-center gap-2">
                  {(classifyProgress.remaining ?? 0) > 0 && (
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => { setClassifyProgress(null); setClassifyJobId(null); setTimeout(() => handleAutoCategorize(), 100); }}>
                      <Sparkles className="h-3 w-3" />
                      متابعة ({(classifyProgress.remaining ?? 0).toLocaleString('ar-SA')})
                    </Button>
                  )}
                  <button onClick={() => { setClassifyProgress(null); setClassifyJobId(null); queryClient.invalidateQueries({ queryKey: ['/api/admin/category-stats'] }); }} className="text-xs text-muted-foreground hover:text-foreground underline">إغلاق</button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Category Form Dialog */}
      <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategoryId ? "تعديل التصنيف" : "إضافة تصنيف جديد"}</DialogTitle>
            <DialogDescription>أدخل بيانات التصنيف</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4" dir="rtl">
            <div className="space-y-2">
              <Label>المعرف (slug) *</Label>
              <Input
                placeholder="مثال: medical"
                value={categoryFormData.slug}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                disabled={!!editingCategoryId}
                data-testid="input-category-slug"
              />
              <p className="text-xs text-muted-foreground">المعرف الفريد للتصنيف (بالإنجليزية)</p>
            </div>
            <div className="space-y-2">
              <Label>الاسم بالعربية *</Label>
              <Input
                placeholder="مثال: طبي"
                value={categoryFormData.nameAr}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                data-testid="input-category-name-ar"
              />
            </div>
            <div className="space-y-2">
              <Label>الاسم بالإنجليزية</Label>
              <Input
                placeholder="مثال: Medical"
                value={categoryFormData.nameEn}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                data-testid="input-category-name-en"
              />
            </div>
            <div className="space-y-2">
              <Label>اللون</Label>
              <Select
                value={categoryFormData.color}
                onValueChange={(value) => setCategoryFormData(prev => ({ ...prev, color: value }))}
              >
                <SelectTrigger data-testid="select-category-color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${color.bg}`} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                placeholder="وصف مختصر للتصنيف"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                data-testid="input-category-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الترتيب</Label>
                <Input
                  type="number"
                  min={0}
                  value={categoryFormData.sortOrder}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  data-testid="input-category-order"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={categoryFormData.isActive}
                  onCheckedChange={(checked) => setCategoryFormData(prev => ({ ...prev, isActive: checked }))}
                  data-testid="switch-category-active"
                />
                <Label>فعّال</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCategoryForm(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmitCategory}
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              data-testid="button-save-category"
            >
              {(createCategoryMutation.isPending || updateCategoryMutation.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>التصنيفات الحالية</CardTitle>
          <CardDescription>جميع التصنيفات المتاحة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : categoriesList && categoriesList.length > 0 ? (
            <div className="space-y-2">
              {categoriesList.map((category) => (
                <div 
                  key={category.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded bg-${category.color}`} />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {category.nameAr}
                        {!category.isActive && (
                          <Badge variant="secondary" className="text-xs">غير فعّال</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{category.slug}</span>
                        {category.nameEn && <span>• {category.nameEn}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {categoryStats?.[category.slug] ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Newspaper className="h-3 w-3" />
                          {categoryStats[category.slug].news}
                        </Badge>
                        <Badge variant="outline" className="text-xs gap-1">
                          <BookOpen className="h-3 w-3" />
                          {categoryStats[category.slug].articles}
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">0</Badge>
                    )}
                    <Badge variant="outline">{category.sortOrder}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => handleEditCategory(category)} data-testid={`button-edit-category-${category.id}`}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-category-${category.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد تصنيفات. أضف تصنيفاً جديداً للبدء.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const ImportSection = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Download className="h-6 w-6 text-primary" />
          استيراد الأخبار
        </h1>
        <p className="text-muted-foreground">استيراد الأخبار من مصادر متعددة</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={importTab === 'google' ? 'default' : 'outline'}
          onClick={() => setImportTab('google')}
          className="gap-2"
          data-testid="button-tab-google-news"
        >
          <Globe className="h-4 w-4" />
          أخبار Google
        </Button>
        <Button
          variant={importTab === 'wordpress' ? 'default' : 'outline'}
          onClick={() => setImportTab('wordpress')}
          className="gap-2"
          data-testid="button-tab-wordpress"
        >
          <Download className="h-4 w-4" />
          WordPress
        </Button>
        <div className="mr-auto" />
        {!showClearConfirm ? (
          <Button
            variant="outline"
            onClick={() => setShowClearConfirm(true)}
            className="gap-2 text-destructive border-destructive/30"
            data-testid="button-clear-news-start"
          >
            <Trash2 className="h-4 w-4" />
            حذف جميع الأخبار
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-destructive">هل أنت متأكد؟</span>
            <Button
              variant="outline"
              onClick={handleClearAllNews}
              disabled={isClearingNews}
              className="gap-2 text-destructive border-destructive"
              data-testid="button-clear-news-confirm"
            >
              {isClearingNews ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              نعم، احذف الكل
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
              data-testid="button-clear-news-cancel"
            >
              إلغاء
            </Button>
          </div>
        )}
      </div>

      {importTab === 'google' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                البحث في أخبار Google
              </CardTitle>
              <CardDescription>ابحث عن أخبار صحية عربية من Google واستوردها كمسودات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="بحث عن أخبار صحية..."
                  value={googleNewsQuery}
                  onChange={(e) => setGoogleNewsQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchGoogleNews(1)}
                  data-testid="input-google-news-query"
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSearchGoogleNews(1)}
                  disabled={isSearchingGoogle || !googleNewsQuery.trim()}
                  className="gap-2"
                  data-testid="button-search-google-news"
                >
                  {isSearchingGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  بحث
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {['أخبار صحية', 'تغذية وصحة', 'أمراض مزمنة', 'صحة المرأة', 'صحة الطفل', 'كورونا', 'لقاحات'].map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover-elevate"
                    onClick={() => { setGoogleNewsQuery(tag); handleSearchGoogleNews(1); }}
                    data-testid={`badge-quick-search-${tag}`}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {googleNewsResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5" />
                  نتائج البحث ({googleNewsResults.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {googleNewsResults.map((item: any, index: number) => (
                    <div key={index} className="flex gap-3 p-3 border rounded-lg items-start">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="w-20 h-16 object-cover rounded-lg shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                          {item.title}
                        </a>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.snippet}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{item.source}</Badge>
                          {item.publishedDate && (
                            <span className="text-xs text-muted-foreground">
                              {fmtSaudiDateOnly(item.publishedDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1"
                        onClick={() => handleImportGoogleNewsItem(item)}
                        disabled={isImportingGoogleNews === item.link}
                        data-testid={`button-import-google-news-${index}`}
                      >
                        {isImportingGoogleNews === item.link ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        استيراد
                      </Button>
                    </div>
                  ))}
                </div>
                {googleHasMore && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => handleSearchGoogleNews(googleNewsPage + 1)}
                      disabled={isSearchingGoogle}
                      className="gap-2"
                      data-testid="button-load-more-google-news"
                    >
                      {isSearchingGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      تحميل المزيد
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {importTab === 'wordpress' && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            إعدادات الاستيراد
          </CardTitle>
          <CardDescription>أدخل رابط موقع WordPress الخاص بك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>رابط الموقع</Label>
            <Input
              placeholder="https://your-wordpress-site.com"
              value={wpSiteUrl}
              onChange={(e) => setWpSiteUrl(e.target.value)}
              dir="ltr"
              data-testid="input-wp-url"
            />
            <p className="text-xs text-muted-foreground">
              تأكد من أن WordPress REST API مفعل على موقعك
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>عدد الأخبار</Label>
              <Select value={String(wpPerPage)} onValueChange={(v) => setWpPerPage(Number(v))}>
                <SelectTrigger data-testid="select-wp-per-page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الصفحة</Label>
              <Input
                type="number"
                min={1}
                value={wpPage}
                onChange={(e) => setWpPage(Number(e.target.value) || 1)}
                data-testid="input-wp-page"
              />
            </div>

            <div className="space-y-2">
              <Label>التصنيف الافتراضي</Label>
              <Select value={wpDefaultCategory} onValueChange={setWpDefaultCategory}>
                <SelectTrigger data-testid="select-wp-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handlePreviewWordPress}
              disabled={isPreviewingWp || !wpSiteUrl || isBulkImportingWp}
              className="gap-2"
              data-testid="button-wp-preview"
            >
              {isPreviewingWp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              معاينة الأخبار
            </Button>
            <Button 
              onClick={handleImportWordPress}
              disabled={isImportingWp || !wpSiteUrl || isBulkImportingWp}
              className="gap-2"
              data-testid="button-wp-import"
            >
              {isImportingWp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              استيراد صفحة واحدة
            </Button>
            <Button 
              onClick={handleBulkImportWordPress}
              disabled={isBulkImportingWp || !wpSiteUrl || isImportingWp}
              className="gap-2 bg-emerald-600"
              data-testid="button-wp-bulk-import"
            >
              {isBulkImportingWp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              استيراد الكل (تلقائي)
            </Button>
          </div>

          {isBulkImportingWp && (
            <div className="mt-4 p-4 border rounded-lg space-y-3" data-testid="bulk-import-progress">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                  جاري الاستيراد الشامل...
                </span>
                <span className="text-muted-foreground">
                  الدفعة {bulkImportProgress.currentPage} من {bulkImportProgress.totalPages}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: bulkImportProgress.totalPages > 0 ? `${(bulkImportProgress.currentPage / bulkImportProgress.totalPages) * 100}%` : '0%' }}
                />
              </div>
              <div className="flex gap-6 text-sm">
                <span className="text-emerald-600 dark:text-emerald-400">
                  تم استيراد: <strong>{bulkImportProgress.imported}</strong>
                </span>
                {bulkImportProgress.errors > 0 && (
                  <span className="text-red-600 dark:text-red-400">
                    أخطاء: <strong>{bulkImportProgress.errors}</strong>
                  </span>
                )}
              </div>
            </div>
          )}

          {!isBulkImportingWp && bulkImportProgress.totalPages > 0 && !bulkImportProgress.isRunning && (
            <div className="mt-4 p-4 border border-emerald-500 rounded-lg space-y-2" data-testid="bulk-import-result">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="h-5 w-5" />
                اكتمل الاستيراد الشامل
              </div>
              <div className="flex gap-6 text-sm">
                <span>تم استيراد: <strong>{bulkImportProgress.imported}</strong> خبر</span>
                {bulkImportProgress.errors > 0 && (
                  <span className="text-red-600 dark:text-red-400">أخطاء: <strong>{bulkImportProgress.errors}</strong></span>
                )}
                <span className="text-muted-foreground">عدد الدفعات: {bulkImportProgress.totalPages}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {importTab === 'wordpress' && wpPreviewData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              معاينة الأخبار ({wpPreviewData.pagination.totalPosts} خبر)
            </CardTitle>
            <CardDescription>
              الصفحة {wpPreviewData.pagination.currentPage} من {wpPreviewData.pagination.totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {wpPreviewData.posts.map((post: any) => (
                <div key={post.id} className="flex gap-3 p-3 border rounded-lg">
                  {post.imageUrl && (
                    <img 
                      src={post.imageUrl} 
                      alt="" 
                      className="w-16 h-16 object-cover rounded-lg shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">{post.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{post.excerpt}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {post.categories.slice(0, 2).map((cat: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{cat}</Badge>
                      ))}
                      {post.sticky && <Badge className="text-xs bg-amber-500">مميز</Badge>}
                      <span className="text-xs text-muted-foreground">
                        {fmtSaudiDateOnly(post.date)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {importTab === 'wordpress' && wpImportResult && (
        <Card className={wpImportResult.errors > 0 ? "border-amber-500" : "border-green-500"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {wpImportResult.errors > 0 ? (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              ) : (
                <Check className="h-5 w-5 text-green-500" />
              )}
              نتيجة الاستيراد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">{wpImportResult.imported}</div>
                <div className="text-sm text-green-600 dark:text-green-400">تم استيرادها</div>
              </div>
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">{wpImportResult.errors}</div>
                <div className="text-sm text-red-600 dark:text-red-400">أخطاء</div>
              </div>
            </div>

            {wpImportResult.importedNews.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">الأخبار المستوردة:</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {wpImportResult.importedNews.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 border rounded text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wpImportResult.errorDetails.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-red-600">الأخطاء:</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {wpImportResult.errorDetails.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 border border-red-200 rounded text-sm">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <span className="truncate">{item.title}: {item.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Article Form Component
  const ArticleFormContent = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/admin/articles')}>
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-lg md:text-xl font-bold">{editingArticleId ? 'تعديل المقال' : 'إضافة مقال جديد'}</h2>
            <p className="text-xs md:text-sm text-muted-foreground">أدخل تفاصيل المقال الطبي</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleSubmitArticle}
            disabled={createArticleMutation.isPending || updateArticleMutation.isPending}
            className="gap-2 flex-1 sm:flex-none"
            data-testid="button-save-article"
          >
            {(createArticleMutation.isPending || updateArticleMutation.isPending) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {editingArticleId ? "تحديث المقال" : "حفظ المقال"}
          </Button>
          <Button
            variant="outline"
            className="gap-2 flex-1 sm:flex-none"
            onClick={handleGenerateArticleAI}
            disabled={isGeneratingArticle}
            data-testid="button-generate-article-ai"
          >
            {isGeneratingArticle ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            توليد المقال بالذكاء الاصطناعي
          </Button>
          <Button
            variant="outline"
            className="gap-2 flex-1 sm:flex-none"
            disabled={!editingArticleId}
            onClick={() => {
              if (editingArticleId) {
                setSocialModalArticle({ id: editingArticleId, title: articleFormData.title });
              }
            }}
            data-testid="button-generate-social-content"
          >
            <Share2 className="h-4 w-4" />
            توليد محتوى السوشيال
          </Button>
        </div>
      </div>

      {/* AI brief input */}
      <Card>
        <CardContent className="pt-4 space-y-2">
          <Label htmlFor="article-ai-brief" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            موجز للتوليد الذكي (اختياري)
          </Label>
          <Textarea
            id="article-ai-brief"
            value={articleAiBrief}
            onChange={(e) => setArticleAiBrief(e.target.value)}
            placeholder="مثال: اكتب مقالاً عن فوائد المشي اليومي للقلب والصحة النفسية..."
            rows={2}
            data-testid="input-article-ai-brief"
          />
          <p className="text-xs text-muted-foreground">
            اكتب موجزاً مختصراً ثم اضغط زر "توليد المقال" لتوليد العنوان والمحتوى وSEO تلقائياً.
          </p>
        </CardContent>
      </Card>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">المحتوى الأساسي</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="article-title">عنوان المقال *</Label>
                <Input
                  id="article-title"
                  value={articleFormData.title}
                  onChange={(e) => {
                    setArticleFormData(prev => ({ 
                      ...prev, 
                      title: e.target.value,
                      slug: prev.slug || generateSlug(e.target.value)
                    }));
                  }}
                  placeholder="عنوان المقال الطبي"
                  data-testid="input-article-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-slug">الرابط (Slug) *</Label>
                <Input
                  id="article-slug"
                  value={articleFormData.slug}
                  onChange={(e) => setArticleFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="رابط-المقال"
                  dir="ltr"
                  data-testid="input-article-slug"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-excerpt">المقتطف *</Label>
                <Textarea
                  id="article-excerpt"
                  value={articleFormData.excerpt}
                  onChange={(e) => setArticleFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="ملخص قصير للمقال يظهر في قائمة المقالات"
                  rows={3}
                  data-testid="input-article-excerpt"
                />
              </div>
              <div className="space-y-2">
                <Label>محتوى المقال *</Label>
                <RichTextEditor
                  content={articleFormData.content}
                  onChange={(content) => setArticleFormData(prev => ({ ...prev, content }))}
                  placeholder="اكتب محتوى المقال هنا..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">إعدادات المقال</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select
                  value={articleFormData.status === 'scheduled' ? 'published' : articleFormData.status}
                  onValueChange={(value: "draft" | "published") => setArticleFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger data-testid="select-article-status">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="published">منشور</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {articleFormData.status !== 'draft' && (
                <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    وقت النشر
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={articlePublishMode === 'now' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setArticlePublishMode('now')}
                      data-testid="button-article-publish-now"
                    >
                      نشر فوري
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={articlePublishMode === 'schedule' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => {
                        setArticlePublishMode('schedule');
                        if (!articleScheduledDateTime) {
                          const future = new Date(Date.now() + 60 * 60 * 1000);
                          setArticleScheduledDateTime(isoToSaudiInput(future.toISOString()));
                        }
                      }}
                      data-testid="button-article-publish-schedule"
                    >
                      جدولة
                    </Button>
                  </div>
                  {articlePublishMode === 'schedule' && (
                    <div className="space-y-1">
                      <Input
                        type="datetime-local"
                        value={articleScheduledDateTime}
                        onChange={(e) => setArticleScheduledDateTime(e.target.value)}
                        data-testid="input-article-scheduled-at"
                      />
                      <p className="text-[11px] text-muted-foreground">بتوقيت الرياض (UTC+3)</p>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="article-author">الكاتب</Label>
                <Input
                  id="article-author"
                  value={articleFormData.author}
                  onChange={(e) => setArticleFormData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="اسم الكاتب"
                  data-testid="input-article-author"
                />
              </div>
              <div className="space-y-2">
                <Label>الفئة *</Label>
                <Select
                  value={articleFormData.category}
                  onValueChange={(value) => setArticleFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger data-testid="select-article-category">
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-readtime">وقت القراءة (دقائق)</Label>
                <Input
                  id="article-readtime"
                  type="number"
                  min="1"
                  value={articleFormData.readTime}
                  onChange={(e) => setArticleFormData(prev => ({ ...prev, readTime: parseInt(e.target.value) || 5 }))}
                  data-testid="input-article-readtime"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-reviewer">المراجع الطبي</Label>
                <Input
                  id="article-reviewer"
                  value={articleFormData.reviewedBy}
                  onChange={(e) => setArticleFormData(prev => ({ ...prev, reviewedBy: e.target.value }))}
                  placeholder="اسم الطبيب المراجع"
                  data-testid="input-article-reviewer"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">الوسوم</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="أضف وسم"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTag.trim()) {
                      e.preventDefault();
                      if (!articleFormData.tags.includes(newTag.trim())) {
                        setArticleFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
                      }
                      setNewTag("");
                    }
                  }}
                  data-testid="input-article-tag"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (newTag.trim() && !articleFormData.tags.includes(newTag.trim())) {
                      setArticleFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
                      setNewTag("");
                    }
                  }}
                  data-testid="button-add-tag"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {articleFormData.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => setArticleFormData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== idx) }))}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Featured Image Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-primary" />
                الصورة الرئيسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {articleFormData.imageUrl ? (
                <div className="relative">
                  <img
                    src={articleFormData.imageUrl}
                    alt={articleFormData.imageAlt || 'صورة المقال'}
                    className="w-full h-40 object-cover rounded-md border"
                    data-testid="img-article-featured-preview"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 left-2 h-7 w-7"
                    onClick={() => setArticleFormData(prev => ({ ...prev, imageUrl: '' }))}
                    data-testid="button-remove-article-image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-md border border-dashed bg-muted/30">
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Label
                  htmlFor="article-image-upload"
                  className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover-elevate"
                  data-testid="label-upload-article-image"
                >
                  <Upload className="h-4 w-4" />
                  رفع صورة
                </Label>
                <input
                  id="article-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleArticleImageUpload}
                  data-testid="input-upload-article-image"
                />
                <AIImageGenerator
                  title={articleFormData.title}
                  content={articleFormData.excerpt || articleFormData.content?.replace(/<[^>]+>/g, '').slice(0, 500)}
                  onImageGenerated={(url) => setArticleFormData(prev => ({ ...prev, imageUrl: url }))}
                  showQuickGenerate={true}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-image-url">أو الصق رابط الصورة</Label>
                <Input
                  id="article-image-url"
                  value={articleFormData.imageUrl}
                  onChange={(e) => setArticleFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  dir="ltr"
                  data-testid="input-article-image-url"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-image-alt">نص بديل (Alt)</Label>
                <Input
                  id="article-image-alt"
                  value={articleFormData.imageAlt}
                  onChange={(e) => setArticleFormData(prev => ({ ...prev, imageAlt: e.target.value }))}
                  placeholder="وصف مختصر للصورة"
                  data-testid="input-article-image-alt"
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                إعدادات SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="article-seo-title">عنوان SEO</Label>
                <Input
                  id="article-seo-title"
                  value={articleFormData.seoTitle}
                  onChange={(e) => setArticleFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder="عنوان محسّن لمحركات البحث"
                  maxLength={70}
                  data-testid="input-article-seo-title"
                />
                <p className="text-[11px] text-muted-foreground">{articleFormData.seoTitle.length}/70</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-seo-description">وصف SEO</Label>
                <Textarea
                  id="article-seo-description"
                  value={articleFormData.seoDescription}
                  onChange={(e) => setArticleFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                  placeholder="وصف محسّن لمحركات البحث (150-160 حرف)"
                  rows={3}
                  maxLength={200}
                  data-testid="input-article-seo-description"
                />
                <p className="text-[11px] text-muted-foreground">{articleFormData.seoDescription.length}/200</p>
              </div>
              <div className="space-y-2">
                <Label>الكلمات المفتاحية</Label>
                <div className="flex gap-2">
                  <Input
                    value={newArticleKeyword}
                    onChange={(e) => setNewArticleKeyword(e.target.value)}
                    placeholder="أضف كلمة مفتاحية"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newArticleKeyword.trim()) {
                        e.preventDefault();
                        if (!articleFormData.keywords.includes(newArticleKeyword.trim())) {
                          setArticleFormData(prev => ({ ...prev, keywords: [...prev.keywords, newArticleKeyword.trim()] }));
                        }
                        setNewArticleKeyword("");
                      }
                    }}
                    data-testid="input-article-keyword"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (newArticleKeyword.trim() && !articleFormData.keywords.includes(newArticleKeyword.trim())) {
                        setArticleFormData(prev => ({ ...prev, keywords: [...prev.keywords, newArticleKeyword.trim()] }));
                        setNewArticleKeyword("");
                      }
                    }}
                    data-testid="button-add-article-keyword"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {articleFormData.keywords.map((kw, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1" data-testid={`badge-article-keyword-${idx}`}>
                      {kw}
                      <button
                        type="button"
                        onClick={() => setArticleFormData(prev => ({ ...prev, keywords: prev.keywords.filter((_, i) => i !== idx) }))}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // Inspirational health quotes
  const healthQuotes = [
    { quote: "صحتك تاج على رأسك لا يراه إلا المرضى", icon: "crown" },
    { quote: "الوقاية خير من العلاج", icon: "shield" },
    { quote: "العقل السليم في الجسم السليم", icon: "brain" },
    { quote: "اجعل طعامك دواءك ودواءك طعامك", icon: "apple" },
  ];
  
  // Get current greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "صباح الخير";
    if (hour < 18) return "مساء الخير";
    return "مساء النور";
  };
  
  // Random quote
  const [currentQuoteIndex] = useState(() => Math.floor(Math.random() * healthQuotes.length));
  const currentQuote = healthQuotes[currentQuoteIndex];

  // Dashboard Content
  const DashboardContent = () => (
    <>
      {/* Welcome Hero Section */}
      <div className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br from-primary via-primary/90 to-emerald-600">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full" />
          {/* DNA Helix Pattern */}
          <svg className="absolute right-0 top-0 h-full w-1/3 opacity-10" viewBox="0 0 100 200" fill="none">
            <path d="M20,10 Q50,50 80,10 T80,90 T80,170" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M80,10 Q50,50 20,10 T20,90 T20,170" stroke="white" strokeWidth="2" fill="none"/>
            <circle cx="50" cy="30" r="3" fill="white"/>
            <circle cx="50" cy="70" r="3" fill="white"/>
            <circle cx="50" cy="110" r="3" fill="white"/>
            <circle cx="50" cy="150" r="3" fill="white"/>
          </svg>
        </div>
        
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Welcome Text */}
            <div className="text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-white flex items-center justify-center shrink-0">
                  <img 
                    src="/admin-profile.png" 
                    alt="محمد الحيدر" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-white/80 text-sm">{getGreeting()}</p>
                  <h1 className="text-2xl md:text-3xl font-bold">{adminUser?.displayName || "محمد الحيدر"}</h1>
                  <p className="text-white/70 text-xs md:text-sm flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {adminUser?.role === "super_admin" ? "مسؤول النظام" : adminUser?.role === "editor" ? "مدير محتوى" : adminUser?.role || "محرر"}
                  </p>
                </div>
              </div>
              <p className="text-white/80 mt-4 max-w-md leading-relaxed">
                مرحباً بك في لوحة تحكم كبسولة الصحية. أنت تدير منصة تهدف لنشر الوعي الصحي وتحسين جودة حياة الملايين.
              </p>
            </div>
            
            {/* Stats Summary - Compact on mobile */}
            <div className="grid grid-cols-4 md:grid-cols-2 gap-2 md:gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 md:p-4 border border-white/10 text-center">
                <Newspaper className="h-4 w-4 md:h-6 md:w-6 mx-auto text-white/80 mb-0.5 md:mb-1" />
                <p className="text-base md:text-2xl font-bold text-white">{dashboardStats?.totalContent || 0}</p>
                <p className="text-[10px] md:text-xs text-white/60">إجمالي المحتوى</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 md:p-4 border border-white/10 text-center">
                <Clock className="h-4 w-4 md:h-6 md:w-6 mx-auto text-white/80 mb-0.5 md:mb-1" />
                <p className="text-base md:text-2xl font-bold text-white">{dashboardStats?.todayNews || 0}</p>
                <p className="text-[10px] md:text-xs text-white/60">أُضيف اليوم</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 md:p-4 border border-white/10 text-center">
                <BookOpen className="h-4 w-4 md:h-6 md:w-6 mx-auto text-white/80 mb-0.5 md:mb-1" />
                <p className="text-base md:text-2xl font-bold text-white">{dashboardStats?.publishedContent || 0}</p>
                <p className="text-[10px] md:text-xs text-white/60">منشور</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 md:p-4 border border-white/10 text-center">
                <AlertCircle className="h-4 w-4 md:h-6 md:w-6 mx-auto text-white/80 mb-0.5 md:mb-1" />
                <p className="text-base md:text-2xl font-bold text-white">{dashboardStats?.unclassified || 0}</p>
                <p className="text-[10px] md:text-xs text-white/60">غير مصنّف</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inspirational Quote Card */}
      <div className="mb-6">
        <Card className="overflow-hidden bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30 border-primary/20">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                {currentQuote.icon === 'crown' && (
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )}
                {currentQuote.icon === 'shield' && <Shield className="w-8 h-8 md:w-10 md:h-10 text-primary" />}
                {currentQuote.icon === 'brain' && (
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
                {currentQuote.icon === 'apple' && <Apple className="w-8 h-8 md:w-10 md:h-10 text-primary" />}
              </div>
              <div className="flex-1">
                <p className="text-lg md:text-xl font-bold text-foreground leading-relaxed">
                  "{currentQuote.quote}"
                </p>
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  حكمة صحية اليوم
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="بحث في لوحة التحكم..." 
            className="pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-admin-search"
          />
        </div>
        <Link href="/">
          <Button variant="outline" className="gap-2 w-full sm:w-auto">
            <ChevronLeft className="h-4 w-4" />
            العودة للموقع
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-primary rounded-full" />
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card 
            className="cursor-pointer hover-elevate group" 
            data-testid="card-action-add-news"
            onClick={() => { resetForm(); setPublishMode('now'); setScheduledDateTime(""); setLocation('/admin/news/new'); }}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Newspaper className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-medium text-sm">خبر جديد</span>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover-elevate group" 
            data-testid="card-action-add-article"
            onClick={() => { resetArticleForm(); setLocation('/admin/articles/new'); }}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="font-medium text-sm">مقال جديد</span>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover-elevate group" 
            data-testid="card-action-users"
            onClick={() => setLocation('/admin/users')}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="font-medium text-sm">المستخدمين</span>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover-elevate group" 
            data-testid="card-action-settings"
            onClick={() => setLocation('/admin/settings')}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="font-medium text-sm">الإعدادات</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-primary rounded-full" />
          الإحصائيات
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="overflow-hidden" data-testid={`card-stat-${index}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-slate-700" />
                    </div>
                    <Badge variant={stat.changeType === "up" ? "default" : "destructive"} className="gap-1 text-xs">
                      {stat.changeType === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {stat.change}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ====== Charts Section ====== */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full" />
            الرسوم البيانية
          </h2>
          <div className="flex gap-1.5">
            <button
              onClick={() => setChartPeriod(7)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${chartPeriod === 7 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              data-testid="button-chart-7days"
            >آخر 7 أيام</button>
            <button
              onClick={() => setChartPeriod(30)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${chartPeriod === 30 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              data-testid="button-chart-30days"
            >آخر 30 يوم</button>
          </div>
        </div>

        {/* Area Chart — Views & Published News */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              المشاهدات والأخبار المنشورة
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData?.timeseries || []} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="newsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any, name: string) => [val.toLocaleString('ar-SA'), name === 'views' ? 'المشاهدات' : 'أخبار منشورة']}
                  labelFormatter={(l: string) => `تاريخ: ${l}`}
                  contentStyle={{ fontSize: 12, direction: 'rtl' }}
                />
                <Legend formatter={(v: string) => v === 'views' ? 'المشاهدات' : 'أخبار منشورة'} wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="views" stroke="#16a34a" fill="url(#viewsGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="newsCount" stroke="#3b82f6" fill="url(#newsGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut + Bar row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Donut — Category Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                توزيع الأخبار حسب التصنيف
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={(chartData?.categories || []).map(c => ({
                      name: categories.find(cat => cat.value === c.name)?.label || c.name,
                      count: c.count,
                    }))}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="name"
                  >
                    {(chartData?.categories || []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any, name: string) => [val, name]} contentStyle={{ fontSize: 12, direction: 'rtl' }} />
                  <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar — Radar Sources Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Rss className="h-4 w-4 text-primary" />
                أكثر مصادر الرادار نشاطاً
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={chartData?.radarSourcesActivity || []} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={85} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" name="المقالات" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* ====== End Charts Section ====== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Recent News */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-1 h-6 bg-primary rounded-full" />
                آخر الأخبار
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation('/admin/news')}>عرض الكل</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {news?.slice(0, 5).map((item: any, index: number) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate" data-testid={`news-item-${index}`}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                      <Newspaper className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{categories.find(c => c.value === item.category)?.label || item.category}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground flex-wrap">
                      {item.createdBy && (
                        <>
                          <span>{item.createdBy}</span>
                          <span className="opacity-40">·</span>
                        </>
                      )}
                      <span>{fmtSaudiDateOnly(item.publishedAt || item.createdAt)}</span>
                      <span className="opacity-40">·</span>
                      <span>{fmtSaudiTimeOnly(item.publishedAt || item.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditNews(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!news || news.length === 0) && (
                <p className="text-center text-muted-foreground py-8">لا توجد أخبار حتى الآن</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed - Real Data */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-1 h-6 bg-primary rounded-full" />
                آخر الإضافات
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation('/admin/news')}>عرض الكل</Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                <Newspaper className="h-3 w-3" />
                {dashboardStats?.publishedNews || 0} خبر منشور
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
                <Clock className="h-3 w-3" />
                {dashboardStats?.scheduledNews || 0} مجدول
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium">
                <Edit className="h-3 w-3" />
                {dashboardStats?.draftNews || 0} مسودة
              </span>
              {(dashboardStats?.unclassified || 0) > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium">
                  <AlertCircle className="h-3 w-3" />
                  {dashboardStats?.unclassified} غير مصنّف
                </span>
              )}
            </div>
            <div className="space-y-3">
              {news?.slice(0, 5).map((item: any, index: number) => {
                const addedAt = item.createdAt ? new Date(item.createdAt) : null;
                const diffMs = addedAt ? Date.now() - addedAt.getTime() : 0;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);
                const timeLabel = diffMins < 60 ? `منذ ${diffMins} دقيقة` : diffHours < 24 ? `منذ ${diffHours} ساعة` : `منذ ${diffDays} يوم`;
                return (
                  <div key={item.id} className="flex items-start gap-3 group" data-testid={`activity-${index}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.status === 'published' ? 'bg-blue-500' : item.status === 'scheduled' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-snug">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{timeLabel}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{item.status === 'published' ? 'منشور' : item.status === 'scheduled' ? 'مجدول' : 'مسودة'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!news || news.length === 0) && (
                <p className="text-center text-muted-foreground py-4 text-sm">لا توجد أخبار بعد</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-1 h-6 bg-primary rounded-full" />
              إحصائيات الزيارات
            </CardTitle>
            <CardDescription>تحليل زيارات الموقع خلال الأسبوع</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between gap-2">
              {['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'].map((day, i) => {
                const heights = [60, 80, 45, 90, 75, 100, 85];
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-lg transition-all hover:from-primary/80"
                      style={{ height: `${heights[i]}%` }}
                    />
                    <span className="text-xs text-muted-foreground">{day}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-1 h-6 bg-primary rounded-full" />
              أكثر الأقسام زيارة
            </CardTitle>
            <CardDescription>توزيع الزيارات حسب القسم</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "الأخبار الطبية", percentage: 85, color: "bg-blue-500" },
                { name: "التغذية", percentage: 72, color: "bg-green-500" },
                { name: "الصحة النفسية", percentage: 65, color: "bg-purple-500" },
                { name: "الأدوية", percentage: 48, color: "bg-orange-500" },
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="font-medium">{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30 overflow-x-hidden w-full max-w-full" dir="rtl">
      {/* Mobile Header - Always visible on mobile */}
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
          <span className="text-sm font-bold text-primary truncate">لوحة التحكم</span>
        </div>
        <Link href="/">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      {socialModalArticle && (
        <SocialContentModal
          open={!!socialModalArticle}
          onClose={() => setSocialModalArticle(null)}
          articleId={socialModalArticle.id}
          articleTitle={socialModalArticle.title}
          storedContent={socialModalArticle.socialContentData}
        />
      )}

      {socialModalNews && (
        <SocialContentModal
          open={!!socialModalNews}
          onClose={() => setSocialModalNews(null)}
          articleId={socialModalNews.id}
          articleTitle={socialModalNews.title}
          contentType="news"
        />
      )}

      <div className="flex w-full max-w-full">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 min-h-screen bg-card border-l fixed right-0 top-0 z-40 flex-col">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:mr-64 p-3 md:p-6 w-full max-w-full overflow-x-hidden">
          {activeSection === 'news' && showNewsForm ? (
            NewsFormContent()
          ) : activeSection === 'news' ? (
            <NewsSection />
          ) : activeSection === 'articles' && showArticleForm ? (
            ArticleFormContent()
          ) : activeSection === 'articles' ? (
            <ArticlesSection />
          ) : activeSection === 'import' ? (
            <ImportSection />
          ) : activeSection === 'categories' ? (
            <CategoriesSection />
          ) : activeSection === 'ads' ? (
            <AdsSection />
          ) : activeSection === 'dashboard' ? (
            <AdminDashboardOverview adminUser={adminUser} onNavigate={(section: string) => navigateTo(section as ActiveSection)} />
          ) : (
            <DashboardContent />
          )}
        </main>
      </div>
    </div>
  );
}

// ── Ads Management Section ────────────────────────────────────────────────────

const AD_POSITIONS = [
  { value: "above_featured", label: "فوق الأخبار البارزة", color: "bg-blue-500" },
  { value: "below_featured", label: "أسفل الأخبار البارزة", color: "bg-purple-500" },
  { value: "news_sidebar",   label: "الشريط الجانبي للأخبار", color: "bg-orange-500" },
  { value: "sidebar",        label: "الشريط الجانبي", color: "bg-emerald-500" },
  { value: "header",         label: "الرأس", color: "bg-teal-500" },
] as const;

interface AdFormState {
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  isActive: boolean;
  rotationInterval: number;
  notes: string;
  startsAt: string;
  expiresAt: string;
}

const defaultAdForm: AdFormState = {
  title: "",
  imageUrl: "",
  linkUrl: "",
  position: "sidebar",
  isActive: true,
  rotationInterval: 15,
  notes: "",
  startsAt: "",
  expiresAt: "",
};

function AdsSection() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdFormState>(defaultAdForm);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "يرجى اختيار ملف صورة صالح", variant: "destructive" });
      return;
    }
    setIsUploadingImage(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await apiRequest('POST', '/api/admin/upload-image', { base64, mimeType: file.type });
      const data = await res.json();
      setForm(f => ({ ...f, imageUrl: data.imageUrl }));
      toast({ title: "تم رفع الصورة بنجاح", description: "أكمل بقية الحقول ثم اضغط حفظ" });
    } catch {
      toast({ title: "فشل رفع الصورة", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const { data: allAds = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/ads"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/ads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      setShowForm(false);
      setForm(defaultAdForm);
      toast({ title: "تم إضافة الإعلان بنجاح" });
    },
    onError: () => toast({ title: "فشل إضافة الإعلان", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/admin/ads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      setShowForm(false);
      setEditingId(null);
      setForm(defaultAdForm);
      toast({ title: "تم تحديث الإعلان بنجاح" });
    },
    onError: (err: any) => toast({ title: err?.message || "فشل التحديث", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/ads/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] }),
    onError: () => toast({ title: "فشل التحديث", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/ads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      toast({ title: "تم حذف الإعلان" });
    },
    onError: () => toast({ title: "فشل الحذف", variant: "destructive" }),
  });

  const handleEdit = (ad: any) => {
    setEditingId(ad.id);
    setForm({
      title: ad.title || "",
      imageUrl: ad.imageUrl || "",
      linkUrl: ad.linkUrl || "",
      position: ad.position || "sidebar",
      isActive: ad.isActive ?? true,
      rotationInterval: ad.rotationInterval ?? 15,
      notes: ad.notes || "",
      startsAt: ad.startsAt ? new Date(ad.startsAt).toISOString().slice(0, 16) : "",
      expiresAt: ad.expiresAt ? new Date(ad.expiresAt).toISOString().slice(0, 16) : "",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast({ title: "عنوان الإعلان مطلوب", variant: "destructive" });
      return;
    }
    const payload: any = {
      title: form.title,
      imageUrl: form.imageUrl || null,
      linkUrl: form.linkUrl || null,
      position: form.position,
      isActive: form.isActive,
      rotationInterval: Number(form.rotationInterval) || 15,
      notes: form.notes || null,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const adsByPosition = (position: string) => allAds.filter((a: any) => a.position === position);
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            إدارة الإعلانات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">أضف إعلانات وحدد مدة عرض كل إعلان قبل التبديل للتالي</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setForm(defaultAdForm); }} className="gap-2" data-testid="button-add-ad">
          <Plus className="h-4 w-4" />
          إضافة إعلان
        </Button>
      </div>

      {/* Ad Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) { setEditingId(null); setForm(defaultAdForm); } }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? "تعديل الإعلان" : "إضافة إعلان جديد"}</DialogTitle>
            <DialogDescription>
              أدخل تفاصيل الإعلان وحدد مدة العرض قبل التبديل للإعلان التالي
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label htmlFor="ad-title">عنوان الإعلان *</Label>
              <Input
                id="ad-title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="اسم الإعلان"
                data-testid="input-ad-title"
              />
            </div>
            <div>
              <Label>صورة الإعلان</Label>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <input
                  type="file"
                  accept="image/*"
                  id="ad-image-upload"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                    e.target.value = '';
                  }}
                  data-testid="file-input-ad-image"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingImage}
                  onClick={() => document.getElementById('ad-image-upload')?.click()}
                  data-testid="button-upload-ad-image"
                >
                  {isUploadingImage ? (
                    <><Loader2 className="h-4 w-4 animate-spin ml-1" /> جاري الرفع...</>
                  ) : (
                    <><Upload className="h-4 w-4 ml-1" /> رفع صورة</>
                  )}
                </Button>
                <Input
                  id="ad-image-url"
                  value={form.imageUrl}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="أو ألصق رابط https://..."
                  dir="ltr"
                  className="flex-1 min-w-[200px]"
                  data-testid="input-ad-image-url"
                />
              </div>
              {form.imageUrl && (
                <div className="mt-2 flex items-start gap-2">
                  <img
                    src={form.imageUrl}
                    alt="معاينة"
                    className="h-20 w-32 object-cover rounded-md border"
                    data-testid="img-ad-preview"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}
                    data-testid="button-remove-ad-image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="ad-link-url">رابط الإعلان</Label>
              <Input
                id="ad-link-url"
                value={form.linkUrl}
                onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                placeholder="https://..."
                dir="ltr"
                data-testid="input-ad-link-url"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ad-position">الموضع</Label>
                <Select value={form.position} onValueChange={v => setForm(f => ({ ...f, position: v }))}>
                  <SelectTrigger id="ad-position" data-testid="select-ad-position">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AD_POSITIONS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ad-rotation">
                  <Timer className="inline h-3.5 w-3.5 ml-1" />
                  مدة العرض (ثانية)
                </Label>
                <Input
                  id="ad-rotation"
                  type="number"
                  min={5}
                  max={300}
                  value={form.rotationInterval}
                  onChange={e => setForm(f => ({ ...f, rotationInterval: Number(e.target.value) }))}
                  data-testid="input-ad-rotation-interval"
                />
                <p className="text-[11px] text-muted-foreground mt-1">5 - 300 ثانية</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ad-starts-at">تاريخ البدء</Label>
                <Input
                  id="ad-starts-at"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
                  data-testid="input-ad-starts-at"
                />
              </div>
              <div>
                <Label htmlFor="ad-expires-at">تاريخ الانتهاء</Label>
                <Input
                  id="ad-expires-at"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  data-testid="input-ad-expires-at"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ad-notes">ملاحظات داخلية</Label>
              <Input
                id="ad-notes"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="ملاحظات للفريق الداخلي"
                data-testid="input-ad-notes"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="ad-active"
                checked={form.isActive}
                onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
                data-testid="switch-ad-active"
              />
              <Label htmlFor="ad-active">الإعلان نشط</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setForm(defaultAdForm); }}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-ad">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
              {editingId ? "حفظ التعديلات" : "إضافة الإعلان"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* All ads list by position */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">قائمة الإعلانات</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : allAds.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">لا توجد إعلانات بعد. أضف إعلانك الأول!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {allAds.map((ad: any) => (
              <Card key={ad.id} className={`border ${ad.isActive ? "border-border" : "border-dashed opacity-60"}`} data-testid={`card-ad-${ad.id}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  {ad.imageUrl && (
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-20 h-12 object-cover rounded shrink-0"
                      loading="lazy"
                      data-testid={`img-ad-${ad.id}`}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" data-testid={`text-ad-title-${ad.id}`}>{ad.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant={ad.isActive ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                        {ad.isActive ? "نشط" : "معطل"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Timer className="h-2.5 w-2.5" />
                        <span data-testid={`text-rotation-${ad.id}`}>{ad.rotationInterval ?? 15}ث</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {AD_POSITIONS.find(p => p.value === ad.position)?.label || ad.position}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {ad.linkUrl && (
                      <a
                        href={ad.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="فتح الرابط"
                        data-testid={`link-ad-${ad.id}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleEdit(ad)}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="تعديل"
                      data-testid={`button-edit-ad-${ad.id}`}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toggleMutation.mutate({ id: ad.id, isActive: !ad.isActive })}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title={ad.isActive ? "تعطيل" : "تفعيل"}
                      data-testid={`button-toggle-ad-${ad.id}`}
                    >
                      {ad.isActive ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("هل تريد حذف هذا الإعلان؟")) {
                          deleteMutation.mutate(ad.id);
                        }
                      }}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600 transition-colors"
                      title="حذف"
                      data-testid={`button-delete-ad-${ad.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, count, onClick }: { icon: any; label: string; active?: boolean; count?: number | string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 relative group ${
        active
          ? 'bg-emerald-100/70 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold'
          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
      }`}
    >
      {/* Active left border indicator */}
      {active && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-600 rounded-full" />
      )}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
        active
          ? 'bg-emerald-600 text-white'
          : 'bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground'
      }`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="flex-1 text-right text-[13px]">{label}</span>
      {count !== undefined && count !== null && (
        <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium min-w-[22px] text-center ${
          active
            ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300'
            : 'bg-muted text-muted-foreground'
        }`}>
          {typeof count === 'number' && count > 999 ? '999+' : count}
        </span>
      )}
    </button>
  );
}
