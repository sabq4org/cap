import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/AdminSidebar";
import {
  ShieldCheck, FileText, BookOpen, Loader2, Upload, CheckCircle2,
  AlertTriangle, XCircle, BarChart2, FileUp, Save, ChevronRight, Link
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// ─── Shared URL Fetcher ───────────────────────────────────────────────────────

interface UrlFetcherProps {
  onTextFetched: (text: string) => void;
}

function UrlFetcher({ onTextFetched }: UrlFetcherProps) {
  const [url, setUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast({ title: "أدخل رابطاً", description: "الرجاء إدخال رابط المقال قبل المتابعة", variant: "destructive" });
      return;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      toast({ title: "رابط غير صالح", description: "يجب أن يبدأ الرابط بـ https:// أو http://", variant: "destructive" });
      return;
    }
    setIsFetching(true);
    try {
      const res = await fetch("/api/admin/capsule/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        onTextFetched(data.text);
        toast({ title: "تم استخراج النص", description: "راجع النص المستخرج قبل المتابعة" });
        setUrl("");
      } else {
        toast({ title: "خطأ في الاستخراج", description: data.error || "فشل استخراج النص من الرابط", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ في الاتصال", description: "تعذر الوصول إلى الخادم", variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 p-4 space-y-3">
      <p className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
        <Link className="h-4 w-4" />
        استخرج من رابط
      </p>
      <div className="flex gap-2">
        <Input
          data-testid="input-article-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFetch()}
          placeholder="https://..."
          dir="ltr"
          className="flex-1 text-sm"
          disabled={isFetching}
        />
        <Button
          data-testid="button-fetch-url"
          onClick={handleFetch}
          disabled={isFetching || !url.trim()}
          variant="secondary"
          className="gap-2 shrink-0"
        >
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link className="h-4 w-4" />}
          {isFetching ? "جاري الاستخراج..." : "استخرج"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">أدخل رابط المقال الطبي وسيتم استخراج نصه تلقائياً في حقل الإدخال أدناه</p>
    </div>
  );
}

// ─── Fact Check ──────────────────────────────────────────────────────────────

interface FactCheckResult {
  verdict: "موثوق" | "مشكوك فيه" | "مضلل";
  credibilityScore: number;
  explanation: string;
  notes: Array<{ claim: string; assessment: string }>;
}

function verdictConfig(verdict: string) {
  switch (verdict) {
    case "موثوق":
      return { color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle2, iconColor: "text-green-600", bar: "bg-green-500" };
    case "مشكوك فيه":
      return { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: AlertTriangle, iconColor: "text-yellow-600", bar: "bg-yellow-500" };
    case "مضلل":
      return { color: "bg-red-100 text-red-800 border-red-300", icon: XCircle, iconColor: "text-red-600", bar: "bg-red-500" };
    default:
      return { color: "bg-gray-100 text-gray-800 border-gray-300", icon: AlertTriangle, iconColor: "text-gray-600", bar: "bg-gray-500" };
  }
}

const WARN_THRESHOLD = 5000;
const MAX_CHARS = 10000;

function LengthWarningBanner({ charCount }: { charCount: number }) {
  if (charCount <= WARN_THRESHOLD) return null;
  return (
    <div
      className="flex items-start gap-2.5 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300"
      data-testid="banner-length-warning"
    >
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400" />
      <span>
        النص طويل جداً ({charCount.toLocaleString("ar-EG")} حرف). سيتم معالجة النص كاملاً لكن النصوص التي تتجاوز 5,000 حرف قد تستغرق وقتاً أطول وتؤثر على جودة النتائج.
      </span>
    </div>
  );
}

function FactCheckerTab() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const { toast } = useToast();

  const handleCheck = async () => {
    if (text.trim().length < 10) {
      toast({ title: "النص قصير جداً", description: "أدخل نصاً طبياً لتدقيقه (10 أحرف على الأقل)", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setResult(null);
    try {
      const res = await apiRequest("POST", "/api/admin/capsule/fact-check", { text });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
      } else {
        toast({ title: "خطأ", description: data.error || "فشل التدقيق", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ في الاتصال", description: "تعذر الوصول إلى الخادم", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const cfg = result ? verdictConfig(result.verdict) : null;

  return (
    <div className="space-y-5">
      <UrlFetcher onTextFetched={(fetched) => { setText(fetched); setResult(null); }} />

      <div className="space-y-2">
        <Label htmlFor="fact-check-input" className="text-base font-semibold">الخبر أو المحتوى الطبي للتدقيق</Label>
        <Textarea
          id="fact-check-input"
          data-testid="textarea-fact-check"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="الصق هنا النص الطبي أو الخبر الصحي الذي تريد التحقق من دقته..."
          className="min-h-[200px] text-base leading-relaxed"
          dir="rtl"
        />
        <p className={`text-xs text-left ${text.length > WARN_THRESHOLD ? "text-yellow-600 font-medium" : "text-muted-foreground"}`} data-testid="text-char-count-fact-check">
          {text.length.toLocaleString("ar-EG")} / {MAX_CHARS.toLocaleString("ar-EG")} حرف
        </p>
        <LengthWarningBanner charCount={text.length} />
      </div>

      <Button
        onClick={handleCheck}
        disabled={isLoading || text.trim().length < 10}
        data-testid="button-fact-check"
        className="gap-2"
        size="lg"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        {isLoading ? "جاري التدقيق..." : "تحقق"}
      </Button>

      {isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-muted-foreground">يحلل الذكاء الاصطناعي المحتوى الطبي...</span>
          </CardContent>
        </Card>
      )}

      {result && cfg && (
        <Card data-testid="card-fact-check-result" className={`border ${cfg.color.includes("green") ? "border-green-200" : cfg.color.includes("yellow") ? "border-yellow-200" : "border-red-200"}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <cfg.icon className={`h-5 w-5 ${cfg.iconColor}`} />
                نتيجة التدقيق الطبي
              </CardTitle>
              <Badge className={`text-sm px-3 py-1 border ${cfg.color}`} data-testid="badge-verdict">
                {result.verdict}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><BarChart2 className="h-4 w-4" /> درجة الموثوقية</span>
                <span className="font-bold text-base" data-testid="text-credibility-score">{result.credibilityScore}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-700 ${cfg.bar}`}
                  style={{ width: `${result.credibilityScore}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-semibold">الحكم العام</p>
              <p className="text-sm text-foreground leading-relaxed bg-muted/50 rounded-lg p-3" data-testid="text-explanation">
                {result.explanation}
              </p>
            </div>

            {result.notes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">الملاحظات التفصيلية</p>
                <div className="space-y-2">
                  {result.notes.map((note, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-1.5 bg-card" data-testid={`card-note-${idx}`}>
                      <p className="text-sm font-medium text-foreground flex items-start gap-1.5">
                        <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                        {note.claim}
                      </p>
                      <p className="text-sm text-muted-foreground pr-5">{note.assessment}</p>
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
}

// ─── Simplify Tab ────────────────────────────────────────────────────────────

function SimplifyTab() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [simplified, setSimplified] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSimplify = async () => {
    if (text.trim().length < 10) {
      toast({ title: "النص قصير جداً", description: "أدخل نصاً طبياً لتبسيطه (10 أحرف على الأقل)", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setSimplified(null);
    try {
      const res = await apiRequest("POST", "/api/admin/capsule/simplify", { text });
      const data = await res.json();
      if (data.success) {
        setSimplified(data.simplified);
      } else {
        toast({ title: "خطأ", description: data.error || "فشل التبسيط", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ في الاتصال", description: "تعذر الوصول إلى الخادم", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <UrlFetcher onTextFetched={(fetched) => { setText(fetched); setSimplified(null); }} />

      <div className="space-y-2">
        <Label htmlFor="simplify-input" className="text-base font-semibold">النص الطبي المعقد</Label>
        <Textarea
          id="simplify-input"
          data-testid="textarea-simplify"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="الصق هنا النص الطبي المعقد الذي تريد تبسيطه للقارئ العام..."
          className="min-h-[200px] text-base leading-relaxed"
          dir="rtl"
        />
        <p className={`text-xs text-left ${text.length > WARN_THRESHOLD ? "text-yellow-600 font-medium" : "text-muted-foreground"}`} data-testid="text-char-count-simplify">
          {text.length.toLocaleString("ar-EG")} / {MAX_CHARS.toLocaleString("ar-EG")} حرف
        </p>
        <LengthWarningBanner charCount={text.length} />
      </div>

      <Button
        onClick={handleSimplify}
        disabled={isLoading || text.trim().length < 10}
        data-testid="button-simplify"
        className="gap-2"
        size="lg"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
        {isLoading ? "جاري التبسيط..." : "بسّط"}
      </Button>

      {isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-muted-foreground">يُعيد الذكاء الاصطناعي صياغة النص بلغة مبسطة...</span>
          </CardContent>
        </Card>
      )}

      {(text || simplified) && !isLoading && simplified && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="section-simplify-result">
          <Card className="border-muted">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" /> النص الأصلي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap" dir="rtl">{text}</p>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-primary flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> النص المبسط
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap" dir="rtl" data-testid="text-simplified">
                {simplified}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── PDF Capsule Tab ─────────────────────────────────────────────────────────

interface PdfResult {
  headline: string;
  summary: string;
  keyStats: string[];
  advice: string;
  fullDraft: string;
}

function PdfCapsuleTab() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PdfResult | null>(null);
  const [draftText, setDraftText] = useState("");
  const [extractedChars, setExtractedChars] = useState<number | null>(null);
  const [sentChars, setSentChars] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.type !== "application/pdf") {
        toast({ title: "صيغة غير مدعومة", description: "يرجى رفع ملف PDF فقط", variant: "destructive" });
        return;
      }
      setFile(f);
      setResult(null);
      setDraftText("");
      setExtractedChars(null);
      setSentChars(null);
    }
  };

  const handleExtract = async () => {
    if (!file) {
      toast({ title: "لم يتم اختيار ملف", description: "يرجى اختيار ملف PDF أولاً", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const res = await fetch("/api/admin/capsule/extract-pdf", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
        setDraftText(data.result.fullDraft || "");
        if (data.extractedChars != null) setExtractedChars(data.extractedChars);
        if (data.sentChars != null) setSentChars(data.sentChars);
      } else {
        toast({ title: "خطأ", description: data.error || "فشل استخراج الخبر", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ في الاتصال", description: "تعذر الوصول إلى الخادم", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsNews = () => {
    if (!result) return;
    localStorage.setItem("capsule_prefill_news", JSON.stringify({
      title: result.headline,
      content: draftText,
      summary: result.summary,
    }));
    setLocation("/admin/news/new");
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-base font-semibold">رفع الدراسة العلمية (PDF)</Label>
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${file ? "border-primary/50 bg-primary/5" : "border-muted-foreground/30 hover:border-primary/40 hover:bg-muted/40"}`}
          onClick={() => fileInputRef.current?.click()}
          data-testid="dropzone-pdf"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
            data-testid="input-pdf"
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileUp className="h-8 w-8 text-primary" />
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · اضغط لتغيير الملف</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">اضغط لاختيار ملف PDF</p>
              <p className="text-xs text-muted-foreground">PDF فقط · حجم أقصى 20MB</p>
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={handleExtract}
        disabled={isLoading || !file}
        data-testid="button-extract-pdf"
        className="gap-2"
        size="lg"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        {isLoading ? "جاري استخراج الخبر..." : "استخرج الخبر"}
      </Button>

      {isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-muted-foreground">يقرأ الذكاء الاصطناعي الدراسة ويحوّلها إلى خبر صحفي...</span>
          </CardContent>
        </Card>
      )}

      {result && extractedChars != null && sentChars != null && (
        <div
          className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${extractedChars > sentChars ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300" : "border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-700 text-green-800 dark:text-green-300"}`}
          data-testid="banner-pdf-char-info"
        >
          <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${extractedChars > sentChars ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`} />
          <span>
            {extractedChars > sentChars
              ? `تم استخراج ${extractedChars.toLocaleString("ar-EG")} حرف من الملف، وأُرسل ${sentChars.toLocaleString("ar-EG")} حرف فقط إلى الذكاء الاصطناعي (تم اقتطاع النص الزائد).`
              : `تم استخراج ${extractedChars.toLocaleString("ar-EG")} حرف من الملف وإرسالها كاملةً إلى الذكاء الاصطناعي.`}
          </span>
        </div>
      )}

      {result && (
        <div className="space-y-4" data-testid="section-pdf-result">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">العنوان الإخباري</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-foreground leading-relaxed" dir="rtl" data-testid="text-headline">
                {result.headline}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">الملخص</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground" dir="rtl" data-testid="text-pdf-summary">
                {result.summary}
              </p>
            </CardContent>
          </Card>

          {result.keyStats.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" /> الأرقام والإحصاءات الرئيسية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.keyStats.map((stat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm" dir="rtl" data-testid={`text-stat-${idx}`}>
                      <span className="text-primary font-bold mt-0.5 shrink-0">•</span>
                      {stat}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">النصيحة العملية للقارئ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground" dir="rtl" data-testid="text-advice">
                {result.advice}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">مسودة الخبر الكاملة</CardTitle>
              <CardDescription>يمكنك تعديل المسودة قبل الحفظ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                className="min-h-[300px] text-sm leading-relaxed"
                dir="rtl"
                data-testid="textarea-full-draft"
              />
              <Button
                onClick={handleSaveAsNews}
                className="gap-2 w-full sm:w-auto"
                size="lg"
                data-testid="button-save-as-news"
              >
                <Save className="h-4 w-4" />
                حفظ كخبر
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminCapsule() {
  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <AdminSidebar activeRoute="/admin/capsule" />
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">كبسولة المحتوى الطبي</h1>
            <p className="text-muted-foreground">أدوات ذكاء اصطناعي لمساعدة المحررين في إنتاج محتوى طبي دقيق وواضح</p>
          </div>

          <Tabs defaultValue="fact-check" dir="rtl">
            <TabsList className="w-full justify-start gap-1 h-auto p-1 flex-wrap">
              <TabsTrigger value="fact-check" className="gap-2 py-2.5 px-4" data-testid="tab-fact-check">
                <ShieldCheck className="h-4 w-4" />
                المدقق الطبي
              </TabsTrigger>
              <TabsTrigger value="simplify" className="gap-2 py-2.5 px-4" data-testid="tab-simplify">
                <BookOpen className="h-4 w-4" />
                مبسّط المصطلحات
              </TabsTrigger>
              <TabsTrigger value="pdf-capsule" className="gap-2 py-2.5 px-4" data-testid="tab-pdf-capsule">
                <FileText className="h-4 w-4" />
                من دراسة إلى خبر
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fact-check" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    المدقق الطبي
                  </CardTitle>
                  <CardDescription>
                    الصق خبراً أو نصاً طبياً وسيقوم الذكاء الاصطناعي بتقييم دقته الطبية مقارنةً بالإجماع العلمي وتوصيات منظمة الصحة العالمية
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FactCheckerTab />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="simplify" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    مبسّط المصطلحات الطبية
                  </CardTitle>
                  <CardDescription>
                    الصق نصاً طبياً معقداً وسيعيد الذكاء الاصطناعي صياغته بلغة عربية سهلة يفهمها القارئ العام مع الحفاظ على المعنى الكامل
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SimplifyTab />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pdf-capsule" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    من دراسة إلى خبر
                  </CardTitle>
                  <CardDescription>
                    ارفع دراسة طبية بصيغة PDF وسيحوّلها الذكاء الاصطناعي إلى خبر صحفي عربي جاهز للنشر مع عنوان وملخص وأبرز الإحصاءات
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PdfCapsuleTab />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
