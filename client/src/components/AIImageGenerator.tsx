import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, Wand2, Loader2, Download, RefreshCw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AIImageGeneratorProps {
  title?: string;
  content?: string;
  newsId?: string;
  onImageGenerated?: (imageUrl: string) => void;
  showQuickGenerate?: boolean;
}

interface GenerationSettings {
  defaultGenerationType: string;
  defaultQuality: string;
  defaultSize: string;
  autoGenerateFromContent: boolean;
}

interface UsageData {
  remaining: number;
  quota: number;
}

const generationTypes = [
  { value: "artistic", label: "رسومي توضيحي", description: "تصميم فيكتور مسطح واحترافي" },
  { value: "realistic", label: "واقعي", description: "تصوير فوتوغرافي احترافي" },
  { value: "hybrid", label: "هجين", description: "مزيج بين الواقعية والفن" },
];

const imageSizes = [
  { value: "1024x1024", label: "مربع (1024x1024)" },
  { value: "1792x1024", label: "أفقي (1792x1024)" },
  { value: "1024x1792", label: "عمودي (1024x1792)" },
];

const imageQualities = [
  { value: "standard", label: "قياسي" },
  { value: "hd", label: "عالي الدقة (HD)" },
];

export default function AIImageGenerator({ title, content, newsId, onImageGenerated, showQuickGenerate = true }: AIImageGeneratorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generationType, setGenerationType] = useState("artistic");
  const [size, setSize] = useState("1024x1024");
  const [quality, setQuality] = useState("hd");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isQuickGenerating, setIsQuickGenerating] = useState(false);

  const { data: usage } = useQuery<UsageData>({
    queryKey: ["/api/admin/generation/usage"],
    enabled: isOpen || isQuickGenerating,
  });

  const { data: settings } = useQuery<GenerationSettings>({
    queryKey: ["/api/admin/generation/settings"],
  });

  const generatePromptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/generation/generate-prompt", {
        title,
        content,
        generationType,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setPrompt(data.prompt);
      toast({
        title: "تم توليد الوصف",
        description: "يمكنك تعديل الوصف قبل توليد الصورة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في توليد الوصف",
        variant: "destructive",
      });
    },
  });

  const generateImageMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/generation/image", {
        prompt,
        newsId,
        quality,
        size,
        generationType,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl);
      toast({
        title: "تم توليد الصورة",
        description: `تم التوليد في ${(data.generationTimeMs / 1000).toFixed(1)} ثانية`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التوليد",
        description: error.message || "فشل في توليد الصورة",
        variant: "destructive",
      });
    },
  });

  const handleGeneratePrompt = () => {
    if (!title && !content) {
      toast({
        title: "محتوى مطلوب",
        description: "يرجى إدخال عنوان أو محتوى الخبر أولاً",
        variant: "destructive",
      });
      return;
    }
    generatePromptMutation.mutate();
  };

  const handleGenerateImage = () => {
    if (!prompt) {
      toast({
        title: "وصف مطلوب",
        description: "يرجى إدخال وصف الصورة المطلوبة",
        variant: "destructive",
      });
      return;
    }
    generateImageMutation.mutate();
  };

  const handleUseImage = () => {
    if (generatedImage && onImageGenerated) {
      onImageGenerated(generatedImage);
      setIsOpen(false);
      toast({
        title: "تم استخدام الصورة",
        description: "تم إضافة الصورة للخبر",
      });
    }
  };

  const handleQuickGenerate = async () => {
    if (!title && !content) {
      toast({
        title: "محتوى مطلوب",
        description: "يرجى إدخال عنوان أو محتوى الخبر أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsQuickGenerating(true);
    
    try {
      const useSettings = settings || {
        defaultGenerationType: "realistic",
        defaultQuality: "hd",
        defaultSize: "1792x1024"
      };

      const promptRes = await apiRequest("POST", "/api/admin/generation/generate-prompt", {
        title,
        content,
        generationType: useSettings.defaultGenerationType,
      });
      const promptData = await promptRes.json();
      
      if (!promptRes.ok) {
        throw new Error(promptData.message || "فشل في توليد الوصف");
      }

      const imageRes = await apiRequest("POST", "/api/admin/generation/image", {
        prompt: promptData.prompt,
        newsId,
        quality: useSettings.defaultQuality,
        size: useSettings.defaultSize,
        generationType: useSettings.defaultGenerationType,
      });
      const imageData = await imageRes.json();

      if (!imageRes.ok) {
        throw new Error(imageData.message || "فشل في توليد الصورة");
      }

      if (onImageGenerated) {
        onImageGenerated(imageData.imageUrl);
      }
      
      toast({
        title: "تم توليد الصورة البارزة",
        description: `تم التوليد في ${(imageData.generationTimeMs / 1000).toFixed(1)} ثانية`,
      });
    } catch (error: any) {
      toast({
        title: "خطأ في التوليد السريع",
        description: error.message || "حدث خطأ أثناء التوليد",
        variant: "destructive",
      });
    } finally {
      setIsQuickGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      {showQuickGenerate && (
        <Button 
          onClick={handleQuickGenerate}
          disabled={isQuickGenerating || (!title && !content)}
          className="gap-2 w-full"
          data-testid="button-quick-generate-image"
        >
          {isQuickGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري توليد الصورة البارزة...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              توليد صورة بارزة سريع
            </>
          )}
        </Button>
      )}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2 w-full" data-testid="button-ai-image-generator">
            <Wand2 className="h-4 w-4" />
            {showQuickGenerate ? "خيارات متقدمة" : "توليد صورة بالذكاء الاصطناعي"}
          </Button>
        </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            توليد صورة بالذكاء الاصطناعي
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {usage && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">الرصيد الشهري</span>
              <div className="flex items-center gap-2">
                <Badge variant={usage.remaining > 10 ? "default" : "destructive"}>
                  {usage.remaining} / {usage.quota} متبقي
                </Badge>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>نوع التوليد</Label>
              <Select value={generationType} onValueChange={setGenerationType}>
                <SelectTrigger data-testid="select-generation-type">
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
              <Label>حجم الصورة</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger data-testid="select-image-size">
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

            <div className="space-y-2">
              <Label>الجودة</Label>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger data-testid="select-image-quality">
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
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt">وصف الصورة (Prompt)</Label>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={handleGeneratePrompt}
                disabled={generatePromptMutation.isPending}
                data-testid="button-generate-prompt"
              >
                {generatePromptMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                توليد تلقائي من المحتوى
              </Button>
            </div>
            <Textarea
              id="prompt"
              placeholder="اكتب وصفاً تفصيلياً للصورة المطلوبة باللغة الإنجليزية..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] text-left"
              dir="ltr"
              data-testid="textarea-image-prompt"
            />
            <p className="text-xs text-muted-foreground">
              نصيحة: اكتب الوصف بالإنجليزية للحصول على نتائج أفضل
            </p>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleGenerateImage}
            disabled={!prompt || generateImageMutation.isPending}
            data-testid="button-generate-image"
          >
            {generateImageMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري التوليد...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                توليد الصورة
              </>
            )}
          </Button>

          {generateImageMutation.isPending && (
            <Card>
              <CardContent className="p-4">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري توليد الصورة، قد يستغرق هذا حوالي 20-30 ثانية...
                </div>
              </CardContent>
            </Card>
          )}

          {generatedImage && !generateImageMutation.isPending && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">الصورة المولدة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={generatedImage}
                    alt="الصورة المولدة"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleUseImage}
                    data-testid="button-use-generated-image"
                  >
                    <Download className="h-4 w-4" />
                    استخدام هذه الصورة
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGenerateImage}
                    disabled={generateImageMutation.isPending}
                    data-testid="button-regenerate-image"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}

