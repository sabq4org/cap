import { Sparkles, Shield, Zap } from "lucide-react";
import ChatInterface from "@/components/ChatInterface";
import { Card, CardContent } from "@/components/ui/card";

export default function Assistant() {
  const features = [
    {
      icon: Sparkles,
      title: "ذكاء اصطناعي متقدم",
      description: "مدعوم بأحدث تقنيات الذكاء الاصطناعي",
    },
    {
      icon: Shield,
      title: "معلومات موثوقة",
      description: "جميع الإجابات مدعومة بمراجع طبية",
    },
    {
      icon: Zap,
      title: "سريع ودقيق",
      description: "إجابات فورية على أسئلتك الصحية",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              المساعد الصحي الذكي
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              اطرح أسئلتك الصحية واحصل على إجابات موثوقة مدعومة بمراجع طبية من مصادر معتمدة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="rounded-full p-2 bg-primary/10 shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <ChatInterface />

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-6 text-center">
            <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">
              تنبيه: المعلومات المقدمة هي لأغراض تعليمية عامة فقط ولا تغني عن استشارة طبيب مختص. 
              في حالة الطوارئ الطبية، يرجى الاتصال بخدمات الطوارئ فوراً.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
