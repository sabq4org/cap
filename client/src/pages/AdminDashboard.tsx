import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  LayoutDashboard, Users, Newspaper, BookOpen, MessageSquare, 
  TrendingUp, Eye, LogOut, Plus, Edit, Trash2, Search,
  Activity, Utensils, Heart, Settings, ChevronLeft, BarChart3,
  Calendar, Clock, ArrowUpRight, ArrowDownRight, Sparkles, Menu, X,
  Save, Loader2, ChevronRight, Image, Upload, ImagePlus, Download, Globe, Check, AlertCircle, CheckSquare, Square, Star, Shield, Apple, Radar, Wand2, LayoutTemplate
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

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: "up" | "down";
  icon: any;
  color: string;
}

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

type ActiveSection = 'dashboard' | 'news' | 'articles' | 'import' | 'categories' | 'users' | 'radar';
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

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    return 'dashboard';
  };

  const activeSection = getActiveSectionFromPath();

  // Check for form states from URL
  useEffect(() => {
    if (location.includes('/admin/news/new')) {
      setShowNewsForm(true);
      setEditingNewsId(null);
      resetForm();
    } else if (location.includes('/admin/news/edit/')) {
      const id = location.split('/admin/news/edit/')[1];
      if (id) {
        setEditingNewsId(id);
        setShowNewsForm(true);
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
    status: "draft" as "draft" | "published",
  });

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
    }
  }, [setLocation]);

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
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    totalUsers: number;
    totalChatSessions: number;
    totalChatMessages: number;
  }>({ queryKey: ["/api/admin/stats"] });
  // Admin news with status filter
  const { data: adminNews, isLoading: isLoadingAdminNews } = useQuery<any[]>({ 
    queryKey: ["/api/admin/news", newsStatusTab],
    queryFn: async () => {
      const res = await fetch(`/api/admin/news?status=${newsStatusTab}`);
      return res.json();
    },
    enabled: activeSection === 'news',
  });
  const { data: articles } = useQuery<any[]>({ 
    queryKey: ["/api/articles?includeAll=true"],
  });

  // Categories query
  const { data: categoriesList, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: activeSection === 'categories',
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
        description: publishMode === 'schedule' ? `سيتم نشره في: ${new Date(scheduledDateTime).toLocaleString('ar-SA')}` : "تم إضافة الخبر الجديد للمنصة",
      });
      setShowNewsForm(false);
      resetForm();
      setPublishMode('now');
      setScheduledDateTime("");
    },
    onError: (error) => {
      toast({
        title: "خطأ في النشر",
        description: "حدث خطأ أثناء نشر الخبر",
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
    mutationFn: async (data: typeof articleFormData) => {
      const res = await apiRequest("POST", "/api/articles", {
        ...data,
        publishedAt: data.status === "published" ? new Date().toISOString() : null,
      });
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
    mutationFn: async ({ id, data }: { id: string; data: typeof articleFormData }) => {
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
    
    if (publishMode === 'schedule' && !scheduledDateTime) {
      toast({
        title: "تاريخ الجدولة مطلوب",
        description: "يرجى تحديد تاريخ ووقت النشر",
        variant: "destructive",
      });
      return;
    }
    
    const newsData = {
      ...formData,
      status: publishMode === 'schedule' ? 'scheduled' : 'published',
      scheduledAt: publishMode === 'schedule' ? scheduledDateTime : undefined,
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
      status: "draft",
    });
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
      status: article.status || "draft",
    });
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
    
    if (editingArticleId) {
      updateArticleMutation.mutate({ id: editingArticleId, data: articleFormData });
    } else {
      createArticleMutation.mutate(articleFormData);
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

    setIsGeneratingImage(true);
    try {
      const res = await apiRequest("POST", "/api/admin/generate-image-ai", {
        title: formData.title,
        content: formData.content,
        style: 'artistic',
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

  const stats: StatCard[] = [
    { 
      title: "الأخبار المنشورة", 
      value: String(dashboardStats?.publishedNews || 0), 
      change: `${dashboardStats?.draftNews || 0} مسودة`,
      changeType: "up",
      icon: Newspaper,
      color: "from-sky-50 to-sky-100 dark:from-sky-950/20 dark:to-sky-900/20"
    },
    { 
      title: "المقالات", 
      value: String(dashboardStats?.publishedArticles || 0), 
      change: `${dashboardStats?.draftArticles || 0} مسودة`,
      changeType: "up",
      icon: BookOpen,
      color: "from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20"
    },
    { 
      title: "المستخدمين", 
      value: String(dashboardStats?.totalUsers || 0), 
      change: `${dashboardStats?.totalChatSessions || 0} محادثة`,
      changeType: "up",
      icon: Users,
      color: "from-violet-50 to-violet-100 dark:from-violet-950/20 dark:to-violet-900/20"
    },
    { 
      title: "المحادثات", 
      value: String(dashboardStats?.totalChatMessages || 0), 
      change: "رسالة",
      changeType: "up",
      icon: MessageSquare,
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
          <SidebarItem icon={LayoutDashboard} label="الرئيسية" active={activeSection === 'dashboard'} onClick={() => navigateTo('dashboard')} />
          <SidebarItem icon={Newspaper} label="الأخبار" active={activeSection === 'news'} count={news?.length} onClick={() => navigateTo('news')} />
          <SidebarItem icon={BookOpen} label="المقالات" active={activeSection === 'articles'} count={articles?.length} onClick={() => navigateTo('articles')} />
          <SidebarItem icon={Download} label="استيراد الأخبار" active={activeSection === 'import'} onClick={() => navigateTo('import')} />
          <SidebarItem icon={Settings} label="التصنيفات" active={activeSection === 'categories'} count={categoriesList?.length} onClick={() => navigateTo('categories')} />
          <SidebarItem icon={Users} label="المستخدمين" onClick={() => navigateTo('users')} />
          <SidebarItem icon={Radar} label="رادار الأخبار" onClick={() => navigateTo('radar')} />
          <SidebarItem icon={LayoutTemplate} label="توليد إنفوجرافيك" onClick={() => setLocation('/admin/infographic')} />
          <SidebarItem icon={Wand2} label="إعدادات التوليد" onClick={() => setLocation('/admin/generation-settings')} />
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
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="schedule-datetime">تاريخ ووقت النشر *</Label>
                    <Input
                      id="schedule-datetime"
                      type="datetime-local"
                      value={scheduledDateTime}
                      onChange={(e) => setScheduledDateTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="text-right"
                      data-testid="input-schedule-datetime"
                    />
                    {scheduledDateTime && (
                      <p className="text-xs text-primary">
                        سيتم نشر الخبر: {new Date(scheduledDateTime).toLocaleString('ar-SA')}
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
                {new Date().toLocaleDateString('ar-SA')}
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
  const [newsSearchQuery, setNewsSearchQuery] = useState("");
  const [newsCategoryFilter, setNewsCategoryFilter] = useState("all");
  
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

    // Filter news by search and category
    const filteredNews = adminNews?.filter((item: any) => {
      const matchesSearch = !newsSearchQuery || 
        item.title?.toLowerCase().includes(newsSearchQuery.toLowerCase()) ||
        item.summary?.toLowerCase().includes(newsSearchQuery.toLowerCase());
      const matchesCategory = newsCategoryFilter === 'all' || item.category === newsCategoryFilter;
      return matchesSearch && matchesCategory;
    }) || [];

    return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">الرئيسية › نظرة عامة</div>
          <h1 className="text-2xl md:text-3xl font-bold">إدارة الأخبار</h1>
          <p className="text-muted-foreground">إدارة المحتوى الإخباري</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setPublishMode('now'); setScheduledDateTime(""); setLocation('/admin/news/new'); }}
          className="gap-2"
          data-testid="button-add-news"
        >
          <Plus className="h-4 w-4" />
          خبر جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-primary rounded-full" />
          إحصائيات الأخبار
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statusCards.map((card) => (
            <button
              key={card.id}
              onClick={() => setNewsStatusTab(card.id)}
              className={`p-4 rounded-xl transition-all ${card.color} ${
                newsStatusTab === card.id ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-[1.02]'
              }`}
              data-testid={`stat-card-${card.id}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                  <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
              </div>
              <div className={`text-3xl font-bold ${card.textColor}`}>{card.count.toLocaleString('en-US')}</div>
              <div className={`text-sm ${card.textColor} opacity-80`}>{card.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-1 h-6 bg-primary rounded-full" />
            البحث والفلاتر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="البحث عن خبر..."
                value={newsSearchQuery}
                onChange={(e) => setNewsSearchQuery(e.target.value)}
                className="w-full"
                data-testid="input-news-search"
              />
            </div>
            <Select value={newsCategoryFilter} onValueChange={setNewsCategoryFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-news-category-filter">
                <SelectValue placeholder="كل التصنيفات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل التصنيفات</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => { setNewsSearchQuery(""); setNewsCategoryFilter("all"); }}
              className="gap-2"
            >
              مسح
            </Button>
          </div>
        </CardContent>
      </Card>

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

      {/* News Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-1 h-6 bg-primary rounded-full" />
            قائمة الأخبار
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingAdminNews ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : filteredNews.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="p-3 text-right w-10">
                      <button onClick={toggleSelectAll} className="hover:text-primary">
                        {selectedNewsIds.size === filteredNews.length && filteredNews.length > 0 ? (
                          <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </th>
                    <th className="p-3 text-right font-medium">العنوان</th>
                    <th className="p-3 text-right font-medium hidden md:table-cell">النوع</th>
                    <th className="p-3 text-right font-medium hidden lg:table-cell">المصدر</th>
                    <th className="p-3 text-right font-medium hidden md:table-cell">التصنيف</th>
                    <th className="p-3 text-center font-medium w-16">مميز</th>
                    <th className="p-3 text-center font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredNews.map((item: any, index: number) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-muted/30 transition-colors ${selectedNewsIds.has(item.id) ? 'bg-primary/5' : ''}`}
                      data-testid={`row-news-${index}`}
                    >
                      <td className="p-3">
                        <button onClick={() => toggleSelectNews(item.id)} data-testid={`checkbox-news-${index}`}>
                          {selectedNewsIds.has(item.id) ? (
                            <CheckSquare className="h-5 w-5 text-primary" />
                          ) : (
                            <Square className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-start gap-3">
                          {item.imageUrl && (
                            <img 
                              src={item.imageUrl} 
                              alt=""
                              className="w-12 h-12 object-cover rounded-lg shrink-0 hidden sm:block"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium line-clamp-2 mb-1">{item.title}</div>
                            {item.status === 'scheduled' && item.scheduledAt && (
                              <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mb-1">
                                <Clock className="h-3 w-3" />
                                <span>تم جدولة الخبر في {new Date(item.scheduledAt).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Riyadh' })}, الساعة {new Date(item.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' })}</span>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <span>{new Date(item.publishedAt || item.createdAt).toLocaleDateString('en-US', { timeZone: 'Asia/Riyadh' })}</span>
                              <span>-</span>
                              <span>{new Date(item.publishedAt || item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' })}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {item.status === 'published' ? 'منشور' : 
                           item.status === 'scheduled' ? 'مجدول' : 
                           item.status === 'draft' ? 'مسودة' : 'محذوف'}
                        </Badge>
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <span className="text-muted-foreground text-xs truncate block max-w-[120px]">
                          {item.source || '-'}
                        </span>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <Badge variant="secondary" className="text-xs">
                          {categories.find((c) => c.value === item.category)?.label || item.category}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleFeaturedMutation.mutate({ id: item.id, isFeatured: !item.isFeatured })}
                          disabled={toggleFeaturedMutation.isPending}
                          className={`${item.isFeatured ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'} transition-colors`}
                          title={item.isFeatured ? 'إلغاء التمييز' : 'تمييز الخبر'}
                          data-testid={`button-toggle-featured-${index}`}
                        >
                          <Star className={`h-5 w-5 ${item.isFeatured ? 'fill-current' : ''}`} />
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          {newsStatusTab === 'deleted' ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRestoreNews(item.id)}
                                className="h-8 w-8 text-green-600"
                                title="استعادة"
                                data-testid={`button-restore-news-${index}`}
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteNews(item.id)}
                                className="h-8 w-8 text-destructive"
                                title="حذف نهائي"
                                data-testid={`button-delete-news-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditNews(item)}
                                className="h-8 w-8"
                                title="تعديل"
                                data-testid={`button-edit-news-${index}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteNews(item.id)}
                                className="h-8 w-8 text-destructive"
                                title="حذف"
                                data-testid={`button-delete-news-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
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
            <div className="p-8 text-center">
              <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {newsSearchQuery || newsCategoryFilter !== 'all' 
                  ? 'لا توجد نتائج مطابقة للبحث'
                  : newsStatusTab === 'deleted' ? 'لا توجد أخبار محذوفة' :
                    newsStatusTab === 'draft' ? 'لا توجد مسودات' :
                    newsStatusTab === 'scheduled' ? 'لا توجد أخبار مجدولة' :
                    'لا توجد أخبار منشورة'}
              </p>
              {newsStatusTab === 'published' && !newsSearchQuery && newsCategoryFilter === 'all' && (
                <Button 
                  className="mt-4"
                  onClick={() => { resetForm(); setPublishMode('now'); setScheduledDateTime(""); setLocation('/admin/news/new'); }}
                >
                  إضافة أول خبر
                </Button>
              )}
            </div>
          )}
        </CardContent>
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
        <Button 
          onClick={() => { resetArticleForm(); setLocation('/admin/articles/new'); }}
          className="gap-2 w-full sm:w-auto"
          data-testid="button-add-article"
        >
          <Plus className="h-4 w-4" />
          إضافة مقال جديد
        </Button>
      </div>

      {/* Articles List */}
      <div className="grid gap-4">
        {articles?.map((article: any, index: number) => (
          <Card key={article.id} className="hover-elevate" data-testid={`card-article-${index}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant={article.status === 'published' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {article.status === 'published' ? 'منشور' : 'مسودة'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {categories.find((c: any) => c.value === article.category)?.label || article.category}
                    </Badge>
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
                <div className="flex items-center gap-2 shrink-0">
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

      <div className="flex gap-2">
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
                              {new Date(item.publishedDate).toLocaleDateString('ar-SA')}
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
                        {new Date(post.date).toLocaleDateString('ar-SA')}
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
        <Button 
          onClick={handleSubmitArticle}
          disabled={createArticleMutation.isPending || updateArticleMutation.isPending}
          className="gap-2 w-full sm:w-auto"
          data-testid="button-save-article"
        >
          {(createArticleMutation.isPending || updateArticleMutation.isPending) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {editingArticleId ? "تحديث المقال" : "حفظ المقال"}
        </Button>
      </div>

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
                  value={articleFormData.status}
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
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <span className="text-2xl md:text-3xl font-bold">م</span>
                </div>
                <div>
                  <p className="text-white/80 text-sm">{getGreeting()}</p>
                  <h1 className="text-2xl md:text-3xl font-bold">محمد الحيدر</h1>
                  <p className="text-white/70 text-xs md:text-sm flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    مسؤول النظام
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
                <p className="text-base md:text-2xl font-bold text-white">{dashboardStats?.publishedNews || 0}</p>
                <p className="text-[10px] md:text-xs text-white/60">أخبار</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 md:p-4 border border-white/10 text-center">
                <Users className="h-4 w-4 md:h-6 md:w-6 mx-auto text-white/80 mb-0.5 md:mb-1" />
                <p className="text-base md:text-2xl font-bold text-white">{dashboardStats?.totalUsers || 0}</p>
                <p className="text-[10px] md:text-xs text-white/60">مستخدم</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 md:p-4 border border-white/10 text-center">
                <BookOpen className="h-4 w-4 md:h-6 md:w-6 mx-auto text-white/80 mb-0.5 md:mb-1" />
                <p className="text-base md:text-2xl font-bold text-white">{dashboardStats?.publishedArticles || 0}</p>
                <p className="text-[10px] md:text-xs text-white/60">مقال</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 md:p-4 border border-white/10 text-center">
                <Eye className="h-4 w-4 md:h-6 md:w-6 mx-auto text-white/80 mb-0.5 md:mb-1" />
                <p className="text-base md:text-2xl font-bold text-white">{dashboardStats?.totalNews || 0}</p>
                <p className="text-[10px] md:text-xs text-white/60">إجمالي</p>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
                      <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.publishedAt).toLocaleDateString('ar-SA')}
                      </span>
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

        {/* Activity Feed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-1 h-6 bg-primary rounded-full" />
              آخر النشاطات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3" data-testid={`activity-${index}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    activity.type === 'news' ? 'bg-blue-500' :
                    activity.type === 'user' ? 'bg-purple-500' :
                    activity.type === 'article' ? 'bg-green-500' :
                    'bg-orange-500'
                  }`} />
                  <div>
                    <p className="text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
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
          ) : (
            <DashboardContent />
          )}
        </main>
      </div>
    </div>
  );
}

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
