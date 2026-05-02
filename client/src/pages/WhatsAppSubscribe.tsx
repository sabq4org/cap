import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageCircle, Heart, Leaf, Baby, Brain, Activity, Apple, Check, Phone, User, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const INTERESTS = [
  { id: "heart", label: "القلب والأوعية الدموية", icon: Heart, color: "text-red-500", bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800" },
  { id: "nutrition", label: "التغذية والغذاء", icon: Apple, color: "text-green-600", bg: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" },
  { id: "diabetes", label: "السكري", icon: Activity, color: "text-blue-500", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800" },
  { id: "pressure", label: "ضغط الدم", icon: Activity, color: "text-purple-500", bg: "bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800" },
  { id: "mother", label: "صحة الأم والحمل", icon: Baby, color: "text-pink-500", bg: "bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800" },
  { id: "child", label: "صحة الطفل", icon: Baby, color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800" },
  { id: "mental", label: "الصحة النفسية", icon: Brain, color: "text-indigo-500", bg: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800" },
  { id: "fitness", label: "اللياقة البدنية", icon: Activity, color: "text-teal-500", bg: "bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800" },
  { id: "general", label: "صحة عامة", icon: Leaf, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" },
];

export default function WhatsAppSubscribe() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFaq, setShowFaq] = useState<number | null>(null);
  const { toast } = useToast();

  const subscribeMutation = useMutation({
    mutationFn: (data: { phone: string; name: string; interests: string[] }) =>
      apiRequest("POST", "/api/whatsapp/subscribe", data),
    onSuccess: () => {
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (error: any) => {
      const msg = error?.message || "حدث خطأ، يرجى المحاولة مرة أخرى";
      toast({ title: "خطأ في الاشتراك", description: msg, variant: "destructive" });
    },
  });

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast({ title: "رقم الهاتف مطلوب", description: "يرجى إدخال رقم هاتفك", variant: "destructive" });
      return;
    }
    subscribeMutation.mutate({ phone: phone.trim(), name: name.trim(), interests: selectedInterests });
  };

  const faqs = [
    { q: "كم مرة أتلقى الرسالة؟", a: "مرة واحدة كل صباح في الوقت المحدد (٧ صباحاً بالتوقيت السعودي)." },
    { q: "هل الاشتراك مجاني؟", a: "نعم، الاشتراك في كبسولة الصباح مجاني تماماً." },
    { q: "كيف ألغي اشتراكي؟", a: "أرسل كلمة «إيقاف» أو «stop» في أي وقت على واتساب وسيتوقف الإرسال فوراً." },
    { q: "هل بياناتي آمنة؟", a: "نعم، نستخدم رقم هاتفك فقط لإرسال النشرة ولا نشاركه مع أي طرف ثالث." },
  ];

  if (showSuccess) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4" dir="rtl">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">تم الاشتراك بنجاح! 🎉</h1>
            <p className="text-muted-foreground leading-relaxed">
              سيصلك رسالة واتساب للتأكيد. ردّ بـ <strong>«نعم»</strong> لتفعيل اشتراكك وابدأ تلقي كبسولة الصباح الصحية كل يوم.
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 text-sm text-green-800 dark:text-green-300 text-right">
            <p className="font-semibold mb-1">📱 تحقق من واتساب الآن</p>
            <p>ستصل رسالة ترحيبية خلال دقيقة. ردّ بـ «نعم» للتأكيد.</p>
          </div>
          <Button variant="outline" onClick={() => setShowSuccess(false)} className="w-full">
            العودة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-emerald-700 to-teal-600 text-white py-16 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-emerald-200 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <MessageCircle className="h-4 w-4" />
            <span>كبسولة الصباح الصحية</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            نشرتك الصحية اليومية<br />
            <span className="text-emerald-200">مباشرة على واتساب</span>
          </h1>
          <p className="text-lg text-white/85 leading-relaxed max-w-xl mx-auto mb-8">
            اشترك واستقبل كل صباح ملخصاً صحياً مختصراً ومفيداً مخصصاً لاهتماماتك — من المصدر الطبي الموثوق بدلاً من المعلومات المضللة.
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-sm">
            {[
              { icon: "🌿", text: "يومي كل صباح" },
              { icon: "🎯", text: "مخصص لاهتماماتك" },
              { icon: "✅", text: "موثوق وموثّق" },
            ].map((b) => (
              <div key={b.text} className="bg-white/10 border border-white/20 rounded-xl p-3 text-center">
                <div className="text-xl mb-1">{b.icon}</div>
                <p className="text-white/90 text-xs leading-tight">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-card border rounded-2xl shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground mb-1">اشترك الآن — مجاناً</h2>
          <p className="text-muted-foreground text-sm mb-6">أدخل رقمك واختر اهتماماتك الصحية</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium">
                رقم الهاتف (واتساب) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  data-testid="input-phone"
                  type="tel"
                  placeholder="+966 5XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pr-10 text-left"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-muted-foreground">أدخل الرقم مع رمز البلد (مثال: 966+ للسعودية)</p>
            </div>

            {/* Name (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                الاسم <span className="text-muted-foreground font-normal">(اختياري)</span>
              </Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  data-testid="input-name"
                  type="text"
                  placeholder="اسمك"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-2.5">
              <Label className="text-sm font-medium">
                اهتماماتك الصحية <span className="text-muted-foreground font-normal">(اختياري — اختر ما يناسبك)</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INTERESTS.map((interest) => {
                  const Icon = interest.icon;
                  const selected = selectedInterests.includes(interest.id);
                  return (
                    <button
                      key={interest.id}
                      type="button"
                      data-testid={`interest-${interest.id}`}
                      onClick={() => toggleInterest(interest.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all ${
                        selected
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium ring-1 ring-emerald-400"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50/50"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${selected ? "bg-emerald-600 text-white" : "bg-muted"}`}>
                        {selected ? <Check className="h-3.5 w-3.5" /> : <Icon className={`h-3.5 w-3.5 ${interest.color}`} />}
                      </div>
                      <span className="leading-tight text-xs">{interest.label}</span>
                    </button>
                  );
                })}
              </div>
              {selectedInterests.length > 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  ✓ اخترت {selectedInterests.length} اهتمام — ستصلك نشرة مخصصة
                </p>
              )}
            </div>

            <Button
              type="submit"
              data-testid="button-subscribe"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 text-base"
              disabled={subscribeMutation.isPending}
            >
              {subscribeMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الاشتراك...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  اشترك في كبسولة الصباح
                </span>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              بالاشتراك توافق على تلقي رسائل واتساب منا. يمكنك الإلغاء في أي وقت بإرسال «إيقاف».
            </p>
          </form>
        </div>

        {/* Sample Message Preview */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 text-center">مثال على رسالة كبسولة الصباح</h3>
          <div className="bg-[#128C7E] rounded-2xl p-1 max-w-sm mx-auto shadow-lg">
            <div className="bg-[#ECE5DD] dark:bg-[#1a1a2e] rounded-xl p-4 text-right" dir="rtl">
              <div className="bg-white dark:bg-[#262d31] rounded-xl p-3 shadow-sm space-y-2">
                <p className="text-[#128C7E] font-bold text-sm">🌿 كبسولة الصباح الصحية</p>
                <p className="text-xs text-gray-500">📅 الأحد، ٢ مايو ٢٠٢٦</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">أبرز ما في صحتك اليوم</p>
                <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                  <p>1. دراسة جديدة تكشف فوائد المشي ٣٠ دقيقة يومياً</p>
                  <p>2. نصيحة: تجنب السكر المضاف بعد المغرب لصحة أفضل</p>
                  <p>3. الوزارة تُطلق حملة للكشف المبكر عن السكري</p>
                </div>
                <p className="text-xs text-[#128C7E]">📖 اقرأ المزيد: capsulah.com</p>
                <div className="border-t pt-2 text-xs text-gray-400">للإلغاء أرسل: إيقاف</div>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 text-left">7:00 ص ✓✓</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-10">
          <h3 className="text-lg font-bold text-foreground mb-4">أسئلة شائعة</h3>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border rounded-xl overflow-hidden">
                <button
                  data-testid={`faq-${i}`}
                  className="w-full flex items-center justify-between p-4 text-right hover:bg-muted/30 transition-colors"
                  onClick={() => setShowFaq(showFaq === i ? null : i)}
                >
                  <span className="font-medium text-sm">{faq.q}</span>
                  {showFaq === i ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>
                {showFaq === i && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
