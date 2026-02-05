import { MessageSquare, Apple, Activity, BookOpen, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "wouter";
import Hero from "@/components/Hero";
import StatsCard from "@/components/StatsCard";
import ArticleCard from "@/components/ArticleCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const features = [
    {
      icon: MessageSquare,
      title: "المساعد الصحي الذكي",
      description: "احصل على إجابات فورية لأسئلتك الصحية مع استشهادات من مصادر طبية موثوقة",
      href: "/assistant",
    },
    {
      icon: Activity,
      title: "متتبع المؤشرات الصحية",
      description: "راقب ضغط الدم، سكر الدم، الوزن، وغيرها من المؤشرات الحيوية بسهولة",
      href: "/profile",
    },
    {
      icon: Apple,
      title: "مسجل التغذية الذكي",
      description: "سجل وجباتك واحصل على تحليل دقيق للسعرات والعناصر الغذائية",
      href: "/nutrition",
    },
    {
      icon: BookOpen,
      title: "مركز المحتوى الطبي",
      description: "مقالات صحية شاملة مراجعة من أطباء معتمدين وموثوقين",
      href: "/articles",
    },
  ];

  return (
    <div className="flex flex-col">
      <Hero />

      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              لماذا كبسولة؟
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              كل ما تحتاجه لحياة صحية أفضل
            </h2>
            <p className="text-lg text-muted-foreground">
              منصة صحية متكاملة تجمع الذكاء الاصطناعي مع الخبرة الطبية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Link key={idx} href={feature.href}>
                  <Card className="h-full hover-elevate active-elevate-2 transition-all cursor-pointer group">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="rounded-full p-3 bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">أحدث المقالات الطبية</h2>
            <p className="text-lg text-muted-foreground">
              محتوى صحي موثوق مُراجع من أطباء معتمدين
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
            <ArticleCard
              title="فوائد التغذية المتوازنة للصحة العامة"
              excerpt="التغذية السليمة هي حجر الأساس للصحة الجيدة. تعرف على أهم العناصر الغذائية..."
              category="التغذية"
              readTime={5}
              reviewedBy="أحمد الشمري"
            />
            <ArticleCard
              title="كيفية التعامل مع ارتفاع ضغط الدم"
              excerpt="ارتفاع ضغط الدم حالة شائعة يمكن التحكم فيها. اكتشف الطرق الطبيعية والطبية..."
              category="أمراض مزمنة"
              readTime={7}
              reviewedBy="فاطمة العلي"
            />
            <ArticleCard
              title="أهمية النشاط البدني اليومي"
              excerpt="ممارسة الرياضة المنتظمة تحسن الصحة البدنية والنفسية. تعلم كيف تبدأ روتين..."
              category="اللياقة"
              readTime={6}
              reviewedBy="محمد الزهراني"
            />
          </div>

          <div className="text-center">
            <Link href="/articles">
              <Button size="lg" variant="outline" className="gap-2" data-testid="button-view-all-articles">
                عرض جميع المقالات
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-primary/5 border-y">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              ابدأ رحلتك الصحية اليوم
            </h2>
            <p className="text-lg text-muted-foreground">
              انضم إلى آلاف المستخدمين الذين يثقون بكبسولة لإدارة صحتهم
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/assistant">
                <Button size="lg" className="gap-2 text-lg h-14" data-testid="button-cta-start">
                  <MessageSquare className="h-5 w-5" />
                  ابدأ الآن مجاناً
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-lg h-14"
                data-testid="button-cta-learn"
              >
                تعرف على المزيد
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
