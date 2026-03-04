import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Wand2, Loader2, Download, RefreshCw,
  LayoutTemplate, Plus, Image as ImageIcon, Sparkles,
  FileText, CheckCircle2, Palette, AlignLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminSidebar from "@/components/AdminSidebar";
import InfographicRenderer, { type InfographicData } from "@/components/InfographicRenderer";

interface InfographicTemplate {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  category: string;
  previewImageUrl: string | null;
  defaultWidth: number;
  defaultHeight: number;
  colorScheme: string[];
  isActive: boolean;
}

interface InfographicJob {
  id: string;
  title: string;
  status: string;
  resultImageUrl: string | null;
  createdAt: string;
  generationTimeMs: number | null;
}

const categoryLabels: Record<string, string> = {
  statistics: "إحصائيات",
  tips: "نصائح",
  comparison: "مقارنة",
  timeline: "جدول زمني",
  process: "عمليات",
  health: "صحة عامة",
};

export default function AdminInfographic() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [title, setTitle] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [contentData, setContentData] = useState<Record<string, string>>({
    stat1: "",
    stat2: "",
    stat3: "",
    description: "",
  });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const [rawText, setRawText] = useState("");
  const [extractedData, setExtractedData] = useState<InfographicData | null>(null);

  const { data: templates, isLoading: templatesLoading } = useQuery<InfographicTemplate[]>({
    queryKey: ["/api/admin/infographic/templates"],
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery<InfographicJob[]>({
    queryKey: ["/api/admin/infographic/jobs"],
  });

  const { data: usage } = useQuery({
    queryKey: ["/api/admin/generation/usage"],
  });

  const seedTemplatesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/infographic/seed-templates");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/infographic/templates"] });
      toast({
        title: "تم إضافة القوالب",
        description: `تم إضافة ${data.created} قالب جديد`,
      });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/infographic/generate", {
        templateId: selectedTemplate || undefined,
        title,
        contentData,
        customPrompt: customPrompt || undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/infographic/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generation/usage"] });
      toast({
        title: "تم توليد الإنفوجرافيك",
        description: `تم التوليد في ${(data.generationTimeMs / 1000).toFixed(1)} ثانية`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التوليد",
        description: error.message || "فشل في توليد الإنفوجرافيك",
        variant: "destructive",
      });
    },
  });

  const extractMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/infographic/extract-from-text", { text: rawText });
      return res.json() as Promise<InfographicData>;
    },
    onSuccess: (data) => {
      setExtractedData(data);
      toast({ title: "تم استخراج البيانات", description: "تمت معالجة النص بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ في المعالجة", description: error.message || "فشل في استخراج البيانات", variant: "destructive" });
    },
  });

  const handleGenerate = () => {
    if (!title) {
      toast({
        title: "العنوان مطلوب",
        description: "يرجى إدخال عنوان الإنفوجرافيك",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate();
  };

  const selectedTemplateData = templates?.find(t => t.id === selectedTemplate);

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      <AdminSidebar activeRoute="/admin/infographic" />
      
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-lg font-semibold">توليد الإنفوجرافيك</span>
              {usage && (
                <Badge variant={usage.remaining > 10 ? "secondary" : "destructive"}>
                  {usage.remaining} / {usage.quota} رصيد متبقي
                </Badge>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
        <Tabs defaultValue="from-text" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="from-text" className="gap-2">
              <FileText className="h-4 w-4" />
              من نص
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2">
              <Wand2 className="h-4 w-4" />
              يدوي
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              السجل
            </TabsTrigger>
          </TabsList>

          <TabsContent value="from-text" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      الصق النص أو السيناريو
                    </CardTitle>
                    <CardDescription>
                      ضع أي نص صحي أو مقالة أو سيناريو وسيستخرج الذكاء الاصطناعي منه إنفوجرافيك احترافي
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="مثال: أظهرت دراسة حديثة أن 85% من البالغين يعانون من نقص فيتامين د... أو: نصائح للوقاية من السكري: أولاً..."
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      className="min-h-[220px] text-sm leading-relaxed"
                      data-testid="textarea-raw-text"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{rawText.length} حرف</span>
                      <Button
                        onClick={() => extractMutation.mutate()}
                        disabled={rawText.trim().length < 20 || extractMutation.isPending}
                        className="gap-2"
                        data-testid="button-extract-infographic"
                      >
                        {extractMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            جاري التحليل...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            استخرج إنفوجرافيك
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {extractedData && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        البيانات المستخرجة
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Title */}
                      <div className="space-y-1">
                        <p className="font-bold text-sm">{extractedData.title}</p>
                        {extractedData.subtitle && (
                          <p className="text-xs text-muted-foreground">{extractedData.subtitle}</p>
                        )}
                      </div>

                      {/* Visual Design */}
                      {extractedData.visualDesign && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Palette className="h-3 w-3" />
                            {extractedData.visualDesign.layout}
                          </Badge>
                          <Badge variant="outline" className="gap-1 text-xs">
                            <AlignLeft className="h-3 w-3" />
                            {extractedData.visualDesign.style}
                          </Badge>
                          <div className="flex gap-1">
                            <div className="w-5 h-5 rounded-full border border-border" style={{ background: extractedData.visualDesign.primaryColor }} title="اللون الأساسي" />
                            <div className="w-5 h-5 rounded-full border border-border" style={{ background: extractedData.visualDesign.secondaryColor }} title="اللون الثانوي" />
                          </div>
                        </div>
                      )}

                      {/* Bullet points */}
                      {extractedData.bulletPoints && extractedData.bulletPoints.length > 0 && (
                        <ul className="space-y-1.5">
                          {extractedData.bulletPoints.map((pt, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs">
                              <span className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
                              <span className="flex-1 text-foreground">{pt.text}</span>
                              {pt.highlight && (
                                <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                                  {pt.highlight}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}

                      {extractedData.conclusion && (
                        <div className="bg-muted rounded-lg p-2 text-xs italic text-muted-foreground border-r-2 border-primary">
                          {extractedData.conclusion}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => extractMutation.mutate()}
                          disabled={extractMutation.isPending}
                          className="gap-1"
                        >
                          <RefreshCw className="h-3 w-3" />
                          أعد الاستخراج
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                {extractedData ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-primary" />
                      معاينة الإنفوجرافيك
                    </div>
                    <InfographicRenderer data={extractedData} />
                  </div>
                ) : (
                  <Card className="h-full min-h-[300px] flex items-center justify-center border-dashed">
                    <CardContent className="text-center text-muted-foreground py-12">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">ضع النص وانتظر المعاينة هنا</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LayoutTemplate className="h-5 w-5" />
                      اختر القالب
                    </CardTitle>
                    <CardDescription>اختر قالباً جاهزاً أو ابدأ من الصفر</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {templatesLoading ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <Skeleton key={i} className="aspect-video rounded-lg" />
                        ))}
                      </div>
                    ) : templates && templates.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button
                          onClick={() => setSelectedTemplate("")}
                          className={`aspect-video rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-colors ${
                            !selectedTemplate ? "border-primary bg-primary/10" : "border-dashed border-muted-foreground/25 hover:border-muted-foreground/50"
                          }`}
                          data-testid="button-no-template"
                        >
                          <Plus className="h-6 w-6 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">بدون قالب</span>
                        </button>
                        {templates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => setSelectedTemplate(template.id)}
                            className={`aspect-video rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-colors ${
                              selectedTemplate === template.id ? "border-primary bg-primary/10" : "border-muted hover:border-muted-foreground/50"
                            }`}
                            data-testid={`button-template-${template.id}`}
                          >
                            <div 
                              className="w-8 h-8 rounded-full"
                              style={{ backgroundColor: template.colorScheme[0] || "#10B981" }}
                            />
                            <span className="text-sm font-medium">{template.nameAr}</span>
                            <Badge variant="outline" className="text-xs">
                              {categoryLabels[template.category] || template.category}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <LayoutTemplate className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">لا توجد قوالب بعد</p>
                        <Button
                          onClick={() => seedTemplatesMutation.mutate()}
                          disabled={seedTemplatesMutation.isPending}
                          className="gap-2"
                        >
                          {seedTemplatesMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          إضافة قوالب افتراضية
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>محتوى الإنفوجرافيك</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">العنوان *</Label>
                      <Input
                        id="title"
                        placeholder="عنوان الإنفوجرافيك"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        data-testid="input-infographic-title"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stat1">إحصائية 1</Label>
                        <Input
                          id="stat1"
                          placeholder="مثال: 85%"
                          value={contentData.stat1}
                          onChange={(e) => setContentData(prev => ({ ...prev, stat1: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stat2">إحصائية 2</Label>
                        <Input
                          id="stat2"
                          placeholder="مثال: 1000+"
                          value={contentData.stat2}
                          onChange={(e) => setContentData(prev => ({ ...prev, stat2: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stat3">إحصائية 3</Label>
                        <Input
                          id="stat3"
                          placeholder="مثال: 24/7"
                          value={contentData.stat3}
                          onChange={(e) => setContentData(prev => ({ ...prev, stat3: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">وصف إضافي</Label>
                      <Textarea
                        id="description"
                        placeholder="أضف وصفاً أو نقاط إضافية للإنفوجرافيك..."
                        value={contentData.description}
                        onChange={(e) => setContentData(prev => ({ ...prev, description: e.target.value }))}
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customPrompt">وصف مخصص للتوليد (اختياري)</Label>
                      <Textarea
                        id="customPrompt"
                        placeholder="اكتب وصفاً مخصصاً بالإنجليزية للحصول على نتائج أفضل..."
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        className="min-h-[80px] text-left"
                        dir="ltr"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      التوليد
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedTemplateData && (
                      <div className="p-3 bg-muted rounded-lg space-y-2">
                        <p className="text-sm font-medium">{selectedTemplateData.nameAr}</p>
                        <p className="text-xs text-muted-foreground">{selectedTemplateData.descriptionAr}</p>
                        <div className="flex gap-1">
                          {selectedTemplateData.colorScheme.map((color, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full border"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full gap-2"
                      size="lg"
                      onClick={handleGenerate}
                      disabled={!title || generateMutation.isPending}
                      data-testid="button-generate-infographic"
                    >
                      {generateMutation.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          جاري التوليد...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-5 w-5" />
                          توليد الإنفوجرافيك
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      يستهلك التوليد 2 رصيد
                    </p>
                  </CardContent>
                </Card>

                {generateMutation.isPending && (
                  <Card>
                    <CardContent className="p-4">
                      <Skeleton className="aspect-video w-full rounded-lg" />
                      <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جاري التوليد...
                      </div>
                    </CardContent>
                  </Card>
                )}

                {generatedImage && !generateMutation.isPending && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">النتيجة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={generatedImage}
                          alt="الإنفوجرافيك المولد"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1 gap-2" asChild>
                          <a href={generatedImage} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                            تحميل
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleGenerate}
                          disabled={generateMutation.isPending}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>سجل التوليد</CardTitle>
                <CardDescription>جميع الإنفوجرافيك التي تم توليدها</CardDescription>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="aspect-video rounded-lg" />
                    ))}
                  </div>
                ) : jobs && jobs.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {jobs.map((job) => (
                      <div key={job.id} className="space-y-2">
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                          {job.resultImageUrl ? (
                            <img
                              src={job.resultImageUrl}
                              alt={job.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {job.status === "generating" ? (
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                              ) : (
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">{job.title}</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={job.status === "completed" ? "default" : job.status === "failed" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {job.status === "completed" ? "مكتمل" : job.status === "failed" ? "فشل" : "جاري"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(job.createdAt).toLocaleDateString("ar-SA")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">لا يوجد سجل توليد بعد</p>
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
