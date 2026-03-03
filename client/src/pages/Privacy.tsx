import { Card } from "@/components/ui/card";
import { Shield, Eye, Cookie, BarChart, Mail, Lock } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-white dark:from-background to-primary/5 dark:to-primary/10 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Shield className="h-8 w-8 md:h-10 md:w-10" />
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6" dir="rtl">
              سياسة الخصوصية
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed" dir="rtl">
              نحن في موقع كبسولة (capsulah.com) نلتزم بحماية خصوصية زوارنا واحترام بياناتهم
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16" dir="rtl">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          <Card className="p-6 md:p-8">
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
              تهدف هذه السياسة إلى توضيح كيفية جمع المعلومات واستخدامها والكشف عنها عند زيارتك لموقعنا.
            </p>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              نؤكد أننا لا نقوم بجمع معلومات تعريف شخصية من الزائرين بشكل مباشر، ولا نطلب تسجيل دخول أو إدخال أي بيانات إلزامية لعرض المحتوى. تصفّحك للموقع يعني موافقتك الضمنية على سياسة الخصوصية الموضحة أدناه.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <div className="flex items-start gap-3 md:gap-4 mb-4">
              <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Eye className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">جمع المعلومات واستخدامها</h2>
              </div>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
              قد نقوم تلقائيًا بجمع بعض المعلومات غير الشخصية لأغراض تحليلية وتحسين تجربة الاستخدام، مثل:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-muted-foreground ms-4">
              <li>نوع المتصفح وإصداره</li>
              <li>الجهاز المستخدم</li>
              <li>الصفحات التي تمت زيارتها</li>
              <li>وقت وتاريخ التصفح</li>
            </ul>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mt-4">
              تُستخدم هذه البيانات لتحسين أداء الموقع ومعرفة الاهتمامات العامة للزوار دون ربطها بهويتك.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <div className="flex items-start gap-3 md:gap-4 mb-4">
              <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Cookie className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">الكوكيز</h2>
              </div>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              في الوقت الحالي، لا يستخدم موقع كبسولة أي ملفات تعريف ارتباط (Cookies) لتخزين بيانات الزوار أو تتبعهم.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <div className="flex items-start gap-3 md:gap-4 mb-4">
              <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <BarChart className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">أدوات التحليل</h2>
              </div>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              قد نستخدم أدوات تحليلية من طرف ثالث مثل Google Analytics لفهم أنماط التصفح وتحسين أداء الموقع. هذه الأدوات قد تجمع بيانات غير شخصية مثل عنوان الـIP أو مدة التصفح أو الصفحات الأكثر زيارة، مع الالتزام الكامل بسياسات الخصوصية الخاصة بهذه الأدوات.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <div className="flex items-start gap-3 md:gap-4 mb-4">
              <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">الاتصالات والنشرات</h2>
              </div>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              إذا اخترت الاشتراك في نشرتنا البريدية مستقبلًا، فسيُطلب منك إدخال بريدك الإلكتروني طوعًا. سنستخدمه فقط لإرسال تحديثات أو محتوى قد يهمك، ويمكنك إلغاء الاشتراك في أي وقت من خلال رابط الإلغاء الموجود في نهاية كل رسالة.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <div className="flex items-start gap-3 md:gap-4 mb-4">
              <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">الحماية</h2>
              </div>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              نلتزم باتخاذ التدابير التقنية والتنظيمية اللازمة لحماية الموقع من الوصول غير المصرح به أو إساءة الاستخدام. كما لا تتم مشاركة أي معلومات (عند جمعها) مع أي طرف ثالث خارج إطار الخدمة.
            </p>
          </Card>

          <Card className="p-6 md:p-8 bg-primary/5 dark:bg-primary/10">
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">التعديلات على سياسة الخصوصية</h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              قد نقوم بتحديث سياسة الخصوصية من وقت لآخر، وسيتم نشر النسخة المحدثة على هذه الصفحة مع توضيح تاريخ التعديل.
            </p>
            <p className="text-sm font-semibold mt-4">
              تاريخ آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
