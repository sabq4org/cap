import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Settings, Save, Loader2, Wand2, 
  TrendingUp, Image as ImageIcon, LayoutTemplate, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminSidebar from "@/components/AdminSidebar";

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

const generationTypes = [
  { value: "realistic", label: "واقعي", description: "تصوير فوتوغرافي احترافي" },
  { value: "artistic", label: "فني", description: "رسم فني وألوان إبداعية" },
  { value: "hybrid", label: "هجين", description: "مزيج بين الواقعية والفن" },
];

const imageSizes = [
  { value: "1024x1024", label: "مربع (1024x1024)" },
  { value: "1792x1024", label: "أفقي (1792x1024)" },
  { value: "1024x1792", label: "عمودي (1024x1792)" },
];

const imageQualities = [
  { value: "standard", label: "قياسي (أسرع)" },
  { value: "hd", label: "عالي الدقة HD (أفضل جودة)" },
];

export default function AdminGenerationSettings() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<GenerationSettings>>({});

  const { data: settings, isLoading: settingsLoading } = useQuery<GenerationSettings>({
    queryKey: ["/api/admin/generation/settings"],
  });

  const { data: usage, isLoading: usageLoading } = useQuery<UsageData>({
    queryKey: ["/api/admin/generation/usage"],
  });

  const { data: imageHistory } = useQuery({
    queryKey: ["/api/admin/generation/images"],
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<GenerationSettings>) => {
      const res = await apiRequest("PUT", "/api/admin/generation/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generation/settings"] });
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم تحديث إعدادات التوليد بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate(formData);
  };

  const usagePercentage = usage ? ((usage.quota - usage.remaining) / usage.quota) * 100 : 0;

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      <AdminSidebar activeRoute="/admin/generation-settings" />
      
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-lg font-semibold">إعدادات توليد الصور</span>
              <Button
                onClick={handleSave}
                disabled={updateSettingsMutation.isPending}
                className="gap-2"
                data-testid="button-save-settings"
              >
                {updateSettingsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                حفظ الإعدادات
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                الرصيد المستخدم
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <div className="h-12 animate-pulse bg-muted rounded" />
              ) : usage ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{usage.quota - usage.remaining}</span>
                    <span className="text-muted-foreground">/ {usage.quota}</span>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {usage.remaining} رصيد متبقي لشهر {usage.month}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                الصور المولدة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <div className="h-12 animate-pulse bg-muted rounded" />
              ) : usage ? (
                <div className="space-y-1">
                  <span className="text-3xl font-bold">{usage.images}</span>
                  <p className="text-xs text-muted-foreground">هذا الشهر</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4" />
                الإنفوجرافيك المولد
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <div className="h-12 animate-pulse bg-muted rounded" />
              ) : usage ? (
                <div className="space-y-1">
                  <span className="text-3xl font-bold">{usage.infographics}</span>
                  <p className="text-xs text-muted-foreground">هذا الشهر</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                الحصة الشهرية
              </CardTitle>
              <CardDescription>تحكم في عدد الصور والإنفوجرافيك المسموح توليدها شهرياً</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyQuota">الحد الأقصى الشهري (رصيد)</Label>
                <Input
                  id="monthlyQuota"
                  type="number"
                  min="10"
                  max="10000"
                  value={formData.monthlyQuota || 100}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyQuota: parseInt(e.target.value) || 100 }))}
                  data-testid="input-monthly-quota"
                />
                <p className="text-xs text-muted-foreground">
                  كل صورة = 1 رصيد، كل إنفوجرافيك = 2 رصيد
                </p>
              </div>

              {usagePercentage >= 80 && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">تحذير: الرصيد منخفض</p>
                    <p className="text-xs">استُهلك {usagePercentage.toFixed(0)}% من الحصة الشهرية</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                الإعدادات الافتراضية
              </CardTitle>
              <CardDescription>القيم الافتراضية عند توليد صور جديدة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>نوع التوليد الافتراضي</Label>
                <Select
                  value={formData.defaultGenerationType || "realistic"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, defaultGenerationType: value }))}
                >
                  <SelectTrigger data-testid="select-default-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {generationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col">
                          <span>{type.label}</span>
                          <span className="text-xs text-muted-foreground">{type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الجودة الافتراضية</Label>
                <Select
                  value={formData.defaultQuality || "hd"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, defaultQuality: value }))}
                >
                  <SelectTrigger data-testid="select-default-quality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {imageQualities.map((q) => (
                      <SelectItem key={q.value} value={q.value}>
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الحجم الافتراضي</Label>
                <Select
                  value={formData.defaultSize || "1024x1024"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, defaultSize: value }))}
                >
                  <SelectTrigger data-testid="select-default-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {imageSizes.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                خيارات التوليد
              </CardTitle>
              <CardDescription>تخصيص سلوك التوليد الذكي</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>التوليد التلقائي من المحتوى</Label>
                  <p className="text-xs text-muted-foreground">
                    توليد وصف الصورة تلقائياً من عنوان ومحتوى الخبر
                  </p>
                </div>
                <Switch
                  checked={formData.autoGenerateFromContent ?? true}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoGenerateFromContent: checked }))}
                  data-testid="switch-auto-generate"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="maxPromptLength">الحد الأقصى لطول الوصف</Label>
                <Input
                  id="maxPromptLength"
                  type="number"
                  min="100"
                  max="4000"
                  value={formData.maxPromptLength || 1000}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxPromptLength: parseInt(e.target.value) || 1000 }))}
                  data-testid="input-max-prompt"
                />
                <p className="text-xs text-muted-foreground">
                  عدد الأحرف المسموحة في وصف الصورة
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>النماذج المتاحة</CardTitle>
              <CardDescription>نماذج الذكاء الاصطناعي المستخدمة للتوليد</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                      <Wand2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">DALL-E 3</p>
                      <p className="text-xs text-muted-foreground">نموذج OpenAI للتوليد عالي الجودة</p>
                    </div>
                  </div>
                  <Badge variant="default">مفعّل</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>سجل التوليد الأخير</CardTitle>
            <CardDescription>آخر الصور المولدة</CardDescription>
          </CardHeader>
          <CardContent>
            {imageHistory && Array.isArray(imageHistory) && imageHistory.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {imageHistory.slice(0, 6).map((img: any) => (
                  <div key={img.id} className="space-y-2">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      {img.imageUrl ? (
                        <img
                          src={img.imageUrl}
                          alt="صورة مولدة"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={img.status === "completed" ? "default" : img.status === "failed" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {img.status === "completed" ? "مكتمل" : img.status === "failed" ? "فشل" : "جاري"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا يوجد سجل توليد بعد</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/admin/infographic">
              <Button variant="outline" className="gap-2">
                <LayoutTemplate className="h-4 w-4" />
                الذهاب لتوليد الإنفوجرافيك
              </Button>
            </Link>
          </CardFooter>
        </Card>
        </main>
      </div>
    </div>
  );
}
