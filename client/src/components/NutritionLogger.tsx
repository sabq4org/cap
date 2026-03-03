import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Apple, Flame, Beef, Wheat, Droplets, Trash2, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { NutritionEntry } from "@shared/schema";
import { Link } from "wouter";

const TARGET_CALORIES = 2000;

function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

export default function NutritionLogger() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    mealName: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: entries, isLoading, error } = useQuery<NutritionEntry[]>({
    queryKey: ["/api/nutrition", today.toISOString()],
    queryFn: async () => {
      const res = await fetch(
        `/api/nutrition?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`,
        { credentials: "include" }
      );
      if (res.status === 401) throw new Error("unauthorized");
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    retry: false,
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("POST", "/api/nutrition", {
        mealName: data.mealName,
        calories: parseInt(data.calories) || 0,
        protein: parseFloat(data.protein) || null,
        carbs: parseFloat(data.carbs) || null,
        fat: parseFloat(data.fat) || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition"] });
      setForm({ mealName: "", calories: "", protein: "", carbs: "", fat: "" });
      setShowForm(false);
      toast({ title: "تمت الإضافة", description: "تم تسجيل الوجبة بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في إضافة الوجبة", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mealName.trim() || !form.calories) return;
    addMutation.mutate(form);
  };

  if (error?.message === "unauthorized") {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">تسجيل الدخول مطلوب</h3>
          <p className="text-muted-foreground text-sm">سجّل دخولك لتتبع تغذيتك اليومية وحفظ وجباتك</p>
          <Button asChild className="mt-2">
            <Link href="/api/auth/login">تسجيل الدخول</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalCalories = entries?.reduce((s, e) => s + e.calories, 0) ?? 0;
  const totalProtein = entries?.reduce((s, e) => s + (e.protein ?? 0), 0) ?? 0;
  const totalCarbs = entries?.reduce((s, e) => s + (e.carbs ?? 0), 0) ?? 0;
  const totalFat = entries?.reduce((s, e) => s + (e.fat ?? 0), 0) ?? 0;
  const progress = Math.min((totalCalories / TARGET_CALORIES) * 100, 100);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4 space-y-0">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-primary/10">
            <Apple className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl">متتبع التغذية اليومي</CardTitle>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2" data-testid="button-add-meal">
          <Plus className="h-4 w-4" />
          إضافة وجبة
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {showForm && (
          <form onSubmit={handleSubmit} className="p-4 bg-muted/50 rounded-lg space-y-4 border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <Label htmlFor="mealName">اسم الوجبة *</Label>
                <Input
                  id="mealName"
                  value={form.mealName}
                  onChange={(e) => setForm(p => ({ ...p, mealName: e.target.value }))}
                  placeholder="مثال: وجبة الغداء"
                  data-testid="input-meal-name"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="calories">السعرات (كيلو كالوري) *</Label>
                <Input
                  id="calories"
                  type="number"
                  min="0"
                  value={form.calories}
                  onChange={(e) => setForm(p => ({ ...p, calories: e.target.value }))}
                  placeholder="مثال: 500"
                  data-testid="input-calories"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="protein">بروتين (جرام)</Label>
                <Input
                  id="protein"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.protein}
                  onChange={(e) => setForm(p => ({ ...p, protein: e.target.value }))}
                  placeholder="اختياري"
                  data-testid="input-protein"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="carbs">كربوهيدرات (جرام)</Label>
                <Input
                  id="carbs"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.carbs}
                  onChange={(e) => setForm(p => ({ ...p, carbs: e.target.value }))}
                  placeholder="اختياري"
                  data-testid="input-carbs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fat">دهون (جرام)</Label>
                <Input
                  id="fat"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.fat}
                  onChange={(e) => setForm(p => ({ ...p, fat: e.target.value }))}
                  placeholder="اختياري"
                  data-testid="input-fat"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={addMutation.isPending} data-testid="button-save-meal">
                {addMutation.isPending ? "جاري الحفظ..." : "حفظ الوجبة"}
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              <span className="font-semibold">السعرات اليومية</span>
            </div>
            <div className="text-left" dir="ltr">
              <span className="text-2xl font-bold">{totalCalories}</span>
              <span className="text-muted-foreground"> / {TARGET_CALORIES}</span>
            </div>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-muted-foreground">
            {totalCalories >= TARGET_CALORIES
              ? "وصلت إلى هدفك اليومي!"
              : `متبقي ${TARGET_CALORIES - totalCalories} سعرة حرارية`}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
              <Beef className="h-3 w-3" />
              <span>بروتين</span>
            </div>
            <p className="text-lg font-bold text-primary">{totalProtein.toFixed(1)}g</p>
          </div>
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
              <Wheat className="h-3 w-3" />
              <span>كربوهيدرات</span>
            </div>
            <p className="text-lg font-bold text-primary">{totalCarbs.toFixed(1)}g</p>
          </div>
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
              <Droplets className="h-3 w-3" />
              <span>دهون</span>
            </div>
            <p className="text-lg font-bold text-primary">{totalFat.toFixed(1)}g</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            وجبات اليوم
            {isLoading ? (
              <Skeleton className="h-5 w-6 rounded-full" />
            ) : (
              <Badge variant="secondary" className="text-xs">{entries?.length ?? 0}</Badge>
            )}
          </h4>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : entries && entries.length > 0 ? (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate"
                  data-testid={`meal-${entry.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Apple className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{entry.mealName}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(entry.loggedAt)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1 shrink-0">
                    <Flame className="h-3 w-3" />
                    {entry.calories} كالوري
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Apple className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">لم تسجّل أي وجبات اليوم</p>
              <p className="text-sm mt-1">اضغط "إضافة وجبة" لبدء التتبع</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
