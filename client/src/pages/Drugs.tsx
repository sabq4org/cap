import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Search, Pill, AlertTriangle, ShieldAlert, Thermometer,
  FlaskConical, BookOpen, Info, Heart, RefreshCw, Star,
  ChevronLeft, ArrowLeft, Zap, Eye
} from "lucide-react";
import type { Drug } from "@shared/schema";

const categoryColors: Record<string, string> = {
  "مضاد حيوي": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "مسكن": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "خافض حرارة": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "مضاد للالتهاب": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "خافض ضغط": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "مضاد للسكري": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
};

function DrugCard({ drug, onClick }: { drug: Drug; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-right group"
      data-testid={`drug-card-${drug.id}`}
    >
      <Card className="hover-elevate cursor-pointer border border-border/50 hover:border-primary/30 transition-all h-full">
        <CardContent className="p-4 flex flex-col gap-2 h-full">
          <div className="flex items-start justify-between gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Pill className="h-4 w-4 text-primary" />
            </div>
            {drug.category && (
              <Badge className={`text-xs shrink-0 ${categoryColors[drug.category] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                {drug.category}
              </Badge>
            )}
          </div>
          <div>
            <p className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug">
              {drug.nameAr}
            </p>
            {drug.nameEn && (
              <p className="text-xs text-muted-foreground mt-0.5">{drug.nameEn}</p>
            )}
            {drug.genericName && (
              <p className="text-xs text-muted-foreground">{drug.genericName}</p>
            )}
          </div>
          {drug.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{drug.description}</p>
          )}
          <div className="flex items-center gap-1 mt-auto pt-1">
            <Eye className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{drug.viewCount}</span>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

function Section({ icon: Icon, title, items, color }: { icon: React.ElementType; title: string; items: string[]; color: string }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 className={`flex items-center gap-2 font-bold text-base mb-3 ${color}`}>
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
            <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${color.replace("text-", "bg-")}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DrugDetail({ drug, onBack }: { drug: Drug; onBack: () => void }) {
  return (
    <div className="space-y-6" data-testid="drug-detail">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" />
        العودة للموسوعة
      </button>

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-emerald-50 to-teal-50 dark:from-primary/20 dark:via-emerald-950/30 dark:to-teal-950/20 p-6 border border-primary/10">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 border border-primary/20">
            <Pill className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{drug.nameAr}</h1>
              {drug.category && (
                <Badge className={categoryColors[drug.category] || "bg-slate-100 text-slate-600"}>
                  {drug.category}
                </Badge>
              )}
            </div>
            {drug.nameEn && <p className="text-sm text-muted-foreground">{drug.nameEn}</p>}
            {drug.genericName && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">المادة الفعّالة:</span> {drug.genericName}
              </p>
            )}
          </div>
        </div>
        {drug.description && (
          <p className="mt-4 text-sm leading-relaxed text-foreground/80 border-t border-primary/10 pt-4">{drug.description}</p>
        )}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4">
        <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
          المعلومات الواردة هنا للتثقيف العام فقط — لا تُغني عن استشارة طبيب أو صيدلاني مختص قبل استخدام أي دواء.
        </p>
      </div>

      {/* Grid sections */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {drug.uses && drug.uses.length > 0 && (
            <div className="rounded-xl border border-border/50 p-5 bg-card">
              <Section icon={Heart} title="الاستخدامات والفوائد" items={drug.uses} color="text-green-600 dark:text-green-400" />
            </div>
          )}
          {drug.dosage && (
            <div className="rounded-xl border border-border/50 p-5 bg-card">
              <h3 className="flex items-center gap-2 font-bold text-base mb-3 text-blue-600 dark:text-blue-400">
                <FlaskConical className="h-4 w-4" />
                الجرعة المعتادة
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{drug.dosage}</p>
            </div>
          )}
          {drug.storage && (
            <div className="rounded-xl border border-border/50 p-5 bg-card">
              <h3 className="flex items-center gap-2 font-bold text-base mb-3 text-slate-600 dark:text-slate-400">
                <BookOpen className="h-4 w-4" />
                طريقة التخزين
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{drug.storage}</p>
            </div>
          )}
        </div>
        <div className="space-y-6">
          {drug.sideEffects && drug.sideEffects.length > 0 && (
            <div className="rounded-xl border border-orange-200 dark:border-orange-800/40 p-5 bg-orange-50/50 dark:bg-orange-950/20">
              <Section icon={Thermometer} title="الأعراض الجانبية" items={drug.sideEffects} color="text-orange-600 dark:text-orange-400" />
            </div>
          )}
          {drug.contraindications && drug.contraindications.length > 0 && (
            <div className="rounded-xl border border-red-200 dark:border-red-800/40 p-5 bg-red-50/50 dark:bg-red-950/20">
              <Section icon={AlertTriangle} title="موانع الاستخدام" items={drug.contraindications} color="text-red-600 dark:text-red-400" />
            </div>
          )}
          {drug.warnings && drug.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 p-5 bg-amber-50/50 dark:bg-amber-950/20">
              <Section icon={ShieldAlert} title="تحذيرات مهمة" items={drug.warnings} color="text-amber-600 dark:text-amber-400" />
            </div>
          )}
          {drug.interactions && drug.interactions.length > 0 && (
            <div className="rounded-xl border border-purple-200 dark:border-purple-800/40 p-5 bg-purple-50/50 dark:bg-purple-950/20">
              <Section icon={Zap} title="التفاعلات الدوائية" items={drug.interactions} color="text-purple-600 dark:text-purple-400" />
            </div>
          )}
          {drug.pregnancy && (
            <div className="rounded-xl border border-pink-200 dark:border-pink-800/40 p-5 bg-pink-50/50 dark:bg-pink-950/20">
              <h3 className="flex items-center gap-2 font-bold text-base mb-3 text-pink-600 dark:text-pink-400">
                <Info className="h-4 w-4" />
                الحمل والرضاعة
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{drug.pregnancy}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Drugs() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: popularDrugs, isLoading: popularLoading } = useQuery<Drug[]>({
    queryKey: ["/api/drugs"],
  });

  const generateMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/drugs/generate", { name });
      return res.json() as Promise<Drug>;
    },
    onSuccess: (drug) => {
      setSelectedDrug(drug);
    },
    onError: (err: any) => {
      toast({
        title: "لم يُعثر على الدواء",
        description: err?.message || "تأكد من اسم الدواء وأعد المحاولة",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    const q = searchInput.trim();
    if (!q) return;
    generateMutation.mutate(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const commonDrugs = [
    "باراسيتامول", "إيبوبروفين", "أموكسيسيلين", "أوميبرازول",
    "ميتفورمين", "أتورفاستاتين", "سيتريزين", "أزيثروميسين",
  ];

  if (selectedDrug) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <DrugDetail drug={selectedDrug} onBack={() => setSelectedDrug(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-emerald-50/60 to-background dark:from-primary/20 dark:via-emerald-950/20 dark:to-background border-b border-border/40">
        <div className="container mx-auto max-w-4xl px-4 py-12 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary/15 border border-primary/20 mb-5">
            <Pill className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">موسوعة الأدوية</h1>
          <p className="text-muted-foreground text-base mb-8 max-w-xl mx-auto">
            ابحث عن أي دواء واحصل على معلومات شاملة بالعربية — الاستخدامات، الأعراض الجانبية، التحذيرات، وأكثر.
          </p>

          {/* Search */}
          <div className="flex gap-2 max-w-lg mx-auto">
            <Input
              ref={inputRef}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اسم الدواء (مثال: باراسيتامول، أموكسيسيلين...)"
              className="text-right h-12 text-base"
              data-testid="input-drug-search"
              disabled={generateMutation.isPending}
            />
            <Button
              onClick={handleSearch}
              disabled={generateMutation.isPending || !searchInput.trim()}
              className="h-12 px-5 shrink-0 gap-2"
              data-testid="button-drug-search"
            >
              {generateMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {generateMutation.isPending ? "جاري البحث..." : "بحث"}
            </Button>
          </div>

          {/* Quick shortcuts */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {commonDrugs.map((d) => (
              <button
                key={d}
                onClick={() => { setSearchInput(d); generateMutation.mutate(d); }}
                disabled={generateMutation.isPending}
                className="text-xs px-3 py-1.5 rounded-full border border-primary/20 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                data-testid={`chip-drug-${d}`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            <span>المعلومات للتثقيف فقط — استشر طبيبك أو صيدلانيك قبل تناول أي دواء</span>
          </div>
        </div>
      </div>

      {/* Popular drugs */}
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center gap-2 mb-6">
          <Star className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">الأدوية الأكثر بحثاً</h2>
        </div>

        {popularLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : popularDrugs && popularDrugs.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="drugs-grid">
            {popularDrugs.map((drug) => (
              <DrugCard key={drug.id} drug={drug} onClick={() => setSelectedDrug(drug)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Pill className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">ابدأ بالبحث عن دواء لتظهر هنا</p>
            <p className="text-sm mt-1">كل دواء تبحث عنه يُحفظ للاستخدام اللاحق</p>
          </div>
        )}
      </div>
    </div>
  );
}
