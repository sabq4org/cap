import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ShieldCheck, FlaskConical, AlertTriangle, CheckCircle, XCircle,
  Send, ExternalLink, Share2, Clock
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { SiX } from "react-icons/si";
import type { RumorSubmission } from "@shared/schema";

const platformOptions = [
  { value: "tiktok", label: "تيك توك" },
  { value: "whatsapp", label: "واتساب" },
  { value: "facebook", label: "فيسبوك" },
  { value: "twitter", label: "تويتر/X" },
  { value: "other", label: "أخرى" },
];

const submitSchema = z.object({
  rumorText: z.string().min(20, "يجب أن تكون الشائعة 20 حرفاً على الأقل").max(2000, "الحد الأقصى 2000 حرف"),
  sourcePlatform: z.string().min(1, "يرجى اختيار المنصة"),
  sourceUrl: z.string().url("رابط غير صالح").optional().or(z.literal("")),
});

type SubmitForm = z.infer<typeof submitSchema>;

const verdictConfig = {
  "خرافة": {
    label: "خرافة",
    color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700",
    icon: XCircle,
    iconColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-800",
    bgColor: "bg-red-50 dark:bg-red-950/20",
  },
  "صحيح جزئياً": {
    label: "صحيح جزئياً",
    color: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700",
    icon: AlertTriangle,
    iconColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-800",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
  "صحيح": {
    label: "صحيح",
    color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700",
    icon: CheckCircle,
    iconColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
} as const;

function VerdictBadge({ verdict }: { verdict: string }) {
  const cfg = verdictConfig[verdict as keyof typeof verdictConfig] || verdictConfig["صحيح جزئياً"];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${cfg.color}`}>
      <Icon className="h-4 w-4" />
      {cfg.label}
    </span>
  );
}

function RumorCard({ rumor }: { rumor: RumorSubmission }) {
  const verdict = rumor.aiResponse?.verdict || "";
  const cfg = verdictConfig[verdict as keyof typeof verdictConfig] || verdictConfig["صحيح جزئياً"];

  const shareUrl = rumor.publishedNewsId
    ? `${window.location.origin}/news/${rumor.publishedNewsId}`
    : window.location.href;

  const shareText = `تفنيد طبي: ${rumor.aiResponse?.shortSummary || rumor.rumorText.substring(0, 80)}`;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank", "width=600,height=400");
  };

  return (
    <Card className={`border-2 ${cfg.borderColor} ${cfg.bgColor} overflow-hidden`} data-testid={`rumor-card-${rumor.id}`}>
      <CardContent className="p-4" dir="rtl">
        <div className="mb-3">
          <VerdictBadge verdict={verdict} />
        </div>

        <p className="text-sm text-muted-foreground mb-2 line-clamp-2 italic">
          "{rumor.rumorText.substring(0, 120)}{rumor.rumorText.length > 120 ? "..." : ""}"
        </p>

        {rumor.aiResponse?.shortSummary && (
          <p className="font-semibold text-foreground mb-3 text-sm leading-relaxed">
            {rumor.aiResponse.shortSummary}
          </p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-current/10">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(rumor.createdAt!).toLocaleDateString("ar-EG-u-nu-latn", {
              year: "numeric", month: "short", day: "numeric"
            })}
          </div>
          <div className="flex items-center gap-1">
            {rumor.publishedNewsId && (
              <Link href={`/news/${rumor.publishedNewsId}`}>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" data-testid={`link-read-more-${rumor.id}`}>
                  اقرأ التفنيد
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={shareWhatsApp} data-testid={`button-share-whatsapp-${rumor.id}`}>
              <SiWhatsapp className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={shareTwitter} data-testid={`button-share-twitter-${rumor.id}`}>
              <SiX className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AskCapsule() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<SubmitForm>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      rumorText: "",
      sourcePlatform: "",
      sourceUrl: "",
    },
  });

  const { data: publishedRumors, isLoading } = useQuery<RumorSubmission[]>({
    queryKey: ["/api/rumors/published"],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmitForm) => {
      const payload: any = {
        rumorText: data.rumorText,
        sourcePlatform: data.sourcePlatform,
      };
      if (data.sourceUrl) payload.sourceUrl = data.sourceUrl;
      const res = await apiRequest("POST", "/api/rumors", payload);
      return res.json();
    },
    onSuccess: (data: { id: string }) => {
      form.reset();
      // No need to invalidate ["/api/rumors/published"]: a newly submitted rumor
      // is pending review (not published), so refetching shows nothing new.
      const stored = JSON.parse(localStorage.getItem("capsulah_rumor_ids") || "[]");
      stored.unshift(data.id);
      localStorage.setItem("capsulah_rumor_ids", JSON.stringify(stored.slice(0, 20)));
      navigate(`/ask-capsule/status/${data.id}`);
    },
    onError: (error: Error) => {
      const isRateLimit = error.message?.startsWith("429");
      toast({
        title: isRateLimit ? "تم تجاوز الحد المسموح به" : "خطأ",
        description: isRateLimit
          ? "لقد تجاوزت الحد المسموح به من الطلبات. يُسمح بـ 5 طلبات فقط في الساعة. يرجى المحاولة لاحقاً."
          : "حدث خطأ أثناء إرسال الشائعة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SubmitForm) => {
    submitMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto max-w-5xl px-4 py-8">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <FlaskConical className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">اسأل كبسولة</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            هل رأيت شائعة طبية على تيك توك أو واتساب؟ أرسلها لنا وسيردّ الذكاء الاصطناعي بتفنيد علمي موثق يراجعه فريقنا التحريري قبل نشره.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Submit Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  أرسل شائعة للتفنيد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="rumorText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نص الشائعة *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="اكتب الشائعة الطبية هنا... مثلاً: 'الثوم يعالج السرطان'"
                                className="min-h-[120px] resize-none"
                                data-testid="input-rumor-text"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sourcePlatform"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المنصة المصدر *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-platform">
                                  <SelectValue placeholder="اختر المنصة" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {platformOptions.map((p) => (
                                  <SelectItem key={p.value} value={p.value} data-testid={`option-platform-${p.value}`}>
                                    {p.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sourceUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رابط المصدر (اختياري)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://..."
                                data-testid="input-source-url"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full gap-2"
                        disabled={submitMutation.isPending}
                        data-testid="button-submit-rumor"
                      >
                        {submitMutation.isPending ? (
                          <>جاري الإرسال...</>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            أرسل للتفنيد
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
              </CardContent>
            </Card>
          </div>

          {/* Published Debunks */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-xl font-bold">آخر الشائعات المُفنَّدة</h2>
              <Badge variant="secondary">{publishedRumors?.length || 0}</Badge>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-24 mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : publishedRumors && publishedRumors.length > 0 ? (
              <div className="space-y-4">
                {publishedRumors.map((rumor) => (
                  <RumorCard key={rumor.id} rumor={rumor} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FlaskConical className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">لا توجد شائعات مُفنَّدة بعد. كن أول من يرسل شائعة!</p>
                </CardContent>
              </Card>
            )}

            {/* Legend */}
            <Card className="mt-6 bg-muted/30">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-sm">دليل الأحكام</h3>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span><strong>خرافة</strong> — معلومة خاطئة علمياً</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span><strong>صحيح جزئياً</strong> — تحتاج توضيحاً</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span><strong>صحيح</strong> — مدعوم علمياً</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
