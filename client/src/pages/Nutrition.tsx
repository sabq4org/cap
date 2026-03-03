import { useQuery } from "@tanstack/react-query";
import { Apple, TrendingUp, Target, Flame } from "lucide-react";
import NutritionLogger from "@/components/NutritionLogger";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { NutritionEntry } from "@shared/schema";

const TARGET_CALORIES = 2000;

function StatCard({ title, value, sub, icon: Icon, loading }: {
  title: string;
  value: string;
  sub: string;
  icon: any;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6 pb-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-bold">{value}</p>
        )}
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

export default function Nutrition() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const { data: todayEntries, isLoading: loadingToday } = useQuery<NutritionEntry[]>({
    queryKey: ["/api/nutrition", "today"],
    queryFn: async () => {
      const res = await fetch(
        `/api/nutrition?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`,
        { credentials: "include" }
      );
      if (!res.ok) return [];
      return res.json();
    },
    retry: false,
  });

  const { data: weekEntries, isLoading: loadingWeek } = useQuery<NutritionEntry[]>({
    queryKey: ["/api/nutrition", "week"],
    queryFn: async () => {
      const res = await fetch(
        `/api/nutrition?startDate=${sevenDaysAgo.toISOString()}&endDate=${tomorrow.toISOString()}`,
        { credentials: "include" }
      );
      if (!res.ok) return [];
      return res.json();
    },
    retry: false,
  });

  const todayCalories = todayEntries?.reduce((s, e) => s + e.calories, 0) ?? 0;

  const weeklyAvg = weekEntries && weekEntries.length > 0
    ? Math.round(weekEntries.reduce((s, e) => s + e.calories, 0) / 7)
    : 0;

  const goalPercent = Math.min(Math.round((todayCalories / TARGET_CALORIES) * 100), 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              التغذية واللياقة
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              تتبع تغذيتك اليومية واحصل على توصيات ذكية لتحقيق أهدافك الصحية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="السعرات اليوم"
              value={todayCalories.toLocaleString("ar")}
              sub={`من أصل ${TARGET_CALORIES.toLocaleString("ar")}`}
              icon={Flame}
              loading={loadingToday}
            />
            <StatCard
              title="متوسط الأسبوع"
              value={weeklyAvg > 0 ? weeklyAvg.toLocaleString("ar") : "—"}
              sub="سعرة يومياً"
              icon={TrendingUp}
              loading={loadingWeek}
            />
            <StatCard
              title="الهدف اليومي"
              value={`${goalPercent}%`}
              sub="من الهدف المحقق"
              icon={Target}
              loading={loadingToday}
            />
          </div>

          <Tabs defaultValue="logger" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="logger" data-testid="tab-nutrition-logger">
                مسجل الوجبات
              </TabsTrigger>
              <TabsTrigger value="tips" data-testid="tab-nutrition-tips">
                نصائح ذكية
              </TabsTrigger>
            </TabsList>

            <TabsContent value="logger" className="mt-8 flex justify-center">
              <NutritionLogger />
            </TabsContent>

            <TabsContent value="tips" className="mt-8 flex justify-center">
              <div className="w-full max-w-2xl space-y-6">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
                  <h3 className="text-xl font-semibold text-primary">نصائح تغذية مخصصة لك</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                      <p className="text-muted-foreground">
                        حاول زيادة تناول البروتين في وجبة الإفطار لتحسين الشعور بالشبع
                      </p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                      <p className="text-muted-foreground">
                        احرص على تناول الخضروات في كل وجبة للحصول على الألياف الضرورية
                      </p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                      <p className="text-muted-foreground">
                        اشرب ما لا يقل عن 8 أكواب من الماء يومياً للحفاظ على الترطيب
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
