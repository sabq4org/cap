import { Apple, TrendingUp, Target } from "lucide-react";
import NutritionLogger from "@/components/NutritionLogger";
import StatsCard from "@/components/StatsCard";
import SymptomChecker from "@/components/SymptomChecker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Nutrition() {
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
            <StatsCard
              title="السعرات اليوم"
              value="1,130"
              description="من أصل 2,000"
              icon={Apple}
              trend={{ value: 5, isPositive: false }}
            />
            <StatsCard
              title="متوسط الأسبوع"
              value="1,850"
              description="سعرة يومياً"
              icon={TrendingUp}
              trend={{ value: 3, isPositive: true }}
            />
            <StatsCard
              title="الهدف"
              value="85%"
              description="من الهدف المحقق"
              icon={Target}
              trend={{ value: 12, isPositive: true }}
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
                        تناولت كمية قليلة من الخضروات اليوم، حاول إضافة سلطة للعشاء
                      </p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                      <p className="text-muted-foreground">
                        استهلاكك من الماء جيد! استمر في شرب 8 أكواب يومياً
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
