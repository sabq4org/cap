import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { 
  ChevronRight, Save, Sparkles, Image, FileText, Tag, 
  Search, Loader2, ArrowLeft, Eye, X, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import logoImage from "@assets/LOGO-L_1769253692563.png";
import AIImageGenerator from "@/components/AIImageGenerator";

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

export default function AdminNewsCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    summary: "",
    content: "",
    category: "",
    source: "",
    sourceUrl: "",
    imageUrl: "",
    seoTitle: "",
    seoDescription: "",
    keywords: [] as string[],
    isFeatured: false,
  });
  
  const [newKeyword, setNewKeyword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const isAdmin = localStorage.getItem("adminAuthenticated");
    if (!isAdmin) {
      setLocation("/admin");
    }
  }, [setLocation]);

  const createNewsMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/news", {
        ...data,
        publishedAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({
        title: "تم نشر الخبر بنجاح",
        description: "تمت إضافة الخبر إلى قاعدة البيانات",
      });
      setLocation("/admin/dashboard");
    },
    onError: (error) => {
      toast({
        title: "خطأ في نشر الخبر",
        description: "حدث خطأ أثناء حفظ الخبر",
        variant: "destructive",
      });
    },
  });

  const handleGenerateAI = async () => {
    if (!formData.content || formData.content.length < 50) {
      toast({
        title: "المحتوى قصير جداً",
        description: "يرجى إدخال محتوى الخبر أولاً (50 حرف على الأقل)",
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
      
      if (!res.ok) {
        throw new Error(data.message || "فشل التوليد");
      }
      
      if (data && data.title) {
        setFormData(prev => ({
          ...prev,
          title: data.title || prev.title,
          subtitle: data.subtitle || prev.subtitle,
          summary: data.summary || prev.summary,
          seoTitle: data.seoTitle || prev.seoTitle,
          seoDescription: data.seoDescription || prev.seoDescription,
          keywords: data.keywords || prev.keywords,
        }));
        
        toast({
          title: "تم التوليد بنجاح",
          description: "تم توليد البيانات الوصفية من المحتوى",
        });
      } else {
        throw new Error("لم يتم توليد بيانات");
      }
    } catch (error: any) {
      toast({
        title: "خطأ في التوليد",
        description: error.message || "حدث خطأ أثناء التوليد الذكي",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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
    if (!formData.title || !formData.content || !formData.category || !formData.source) {
      toast({
        title: "حقول مطلوبة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    createNewsMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="icon">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
            <img src={logoImage} alt="كبسولة" className="h-8" />
            <div>
              <h1 className="font-bold text-sm md:text-base">إضافة خبر جديد</h1>
              <p className="text-xs text-muted-foreground hidden md:block">لوحة تحكم كبسولة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-2 hidden md:flex"
              onClick={handleGenerateAI}
              disabled={isGenerating}
              data-testid="button-generate-ai"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              توليد ذكي
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createNewsMutation.isPending}
              className="gap-2"
              data-testid="button-save-news"
            >
              {createNewsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden md:inline">نشر الخبر</span>
              <span className="md:hidden">نشر</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile AI Button */}
      <div className="md:hidden p-4 pb-0">
        <Button 
          variant="outline" 
          className="w-full gap-2"
          onClick={handleGenerateAI}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          التوليد الذكي الشامل
        </Button>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-6">
        <Tabs defaultValue="content" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content" className="gap-2">
              <FileText className="h-4 w-4 hidden md:block" />
              المحتوى
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <Image className="h-4 w-4 hidden md:block" />
              الوسائط
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-2">
              <Search className="h-4 w-4 hidden md:block" />
              SEO
            </TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">محتوى الخبر</CardTitle>
                <CardDescription>أدخل تفاصيل الخبر الأساسية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">العنوان الرئيسي *</Label>
                  <Input
                    id="title"
                    placeholder="أدخل العنوان الرئيسي للخبر"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    data-testid="input-news-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">العنوان الفرعي</Label>
                  <Input
                    id="subtitle"
                    placeholder="أدخل العنوان الفرعي (اختياري)"
                    value={formData.subtitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    data-testid="input-news-subtitle"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">التصنيف *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger data-testid="select-news-category">
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
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
                    <Label htmlFor="source">المصدر *</Label>
                    <Input
                      id="source"
                      placeholder="اسم المصدر"
                      value={formData.source}
                      onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                      data-testid="input-news-source"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-amber-500" />
                    <div>
                      <Label htmlFor="is-featured" className="font-semibold">خبر مميز</Label>
                      <p className="text-xs text-muted-foreground">سيظهر في الكاروسيل الرئيسي (بحد أقصى 3 أخبار)</p>
                    </div>
                  </div>
                  <Switch
                    id="is-featured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                    data-testid="switch-featured"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceUrl">رابط المصدر</Label>
                  <Input
                    id="sourceUrl"
                    type="url"
                    placeholder="https://example.com/article"
                    value={formData.sourceUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, sourceUrl: e.target.value }))}
                    className="text-left"
                    dir="ltr"
                    data-testid="input-news-source-url"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">الموجز الذكي *</Label>
                  <Textarea
                    id="summary"
                    placeholder="ملخص قصير للخبر (سيظهر في قائمة الأخبار)"
                    value={formData.summary}
                    onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                    rows={3}
                    data-testid="input-news-summary"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.summary.length}/300 حرف
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">تفاصيل الخبر *</Label>
                  <Textarea
                    id="content"
                    placeholder="أدخل المحتوى الكامل للخبر هنا..."
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={12}
                    className="min-h-[300px]"
                    data-testid="input-news-content"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.content.length} حرف | يمكنك استخدام التوليد الذكي بعد إدخال المحتوى
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">الصورة البارزة</CardTitle>
                <CardDescription>أضف صورة رئيسية للخبر أو قم بتوليدها بالذكاء الاصطناعي</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AIImageGenerator
                  title={formData.title}
                  content={formData.content}
                  onImageGenerated={(imageUrl) => setFormData(prev => ({ ...prev, imageUrl }))}
                />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">أو أدخل رابط الصورة</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">رابط الصورة</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="text-left"
                    dir="ltr"
                    data-testid="input-news-image"
                  />
                </div>

                {formData.imageUrl && (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={formData.imageUrl} 
                      alt="معاينة الصورة"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/800x450?text=خطأ+في+الصورة";
                      }}
                    />
                  </div>
                )}

                {!formData.imageUrl && (
                  <div className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">أدخل رابط الصورة لمعاينتها</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">تحسين محركات البحث (SEO)</CardTitle>
                <CardDescription>تحسين ظهور الخبر في نتائج البحث</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">عنوان SEO</Label>
                  <Input
                    id="seoTitle"
                    placeholder="عنوان محسن لمحركات البحث"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                    data-testid="input-news-seo-title"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.seoTitle.length}/60 حرف (الموصى به)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seoDescription">وصف SEO</Label>
                  <Textarea
                    id="seoDescription"
                    placeholder="وصف مختصر يظهر في نتائج البحث"
                    value={formData.seoDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                    rows={3}
                    data-testid="input-news-seo-description"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.seoDescription.length}/160 حرف (الموصى به)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>الكلمات المفتاحية</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="أضف كلمة مفتاحية"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addKeyword();
                        }
                      }}
                      data-testid="input-news-keyword"
                    />
                    <Button type="button" variant="outline" onClick={addKeyword}>
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {formData.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="gap-1 pr-1">
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(keyword)}
                            className="hover:bg-muted rounded p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* SEO Preview */}
                <div className="mt-6 p-4 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">معاينة نتيجة البحث:</p>
                  <div className="space-y-1">
                    <p className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                      {formData.seoTitle || formData.title || "عنوان الخبر"}
                    </p>
                    <p className="text-green-700 text-sm" dir="ltr">
                      capsulah.replit.app/news/...
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {formData.seoDescription || formData.summary || "وصف الخبر سيظهر هنا..."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
