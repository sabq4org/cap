import { Card } from "@/components/ui/card";
import { FileText, BookOpen, AlertTriangle, Copyright, Link2, ShieldAlert, RefreshCw, Stethoscope } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-white dark:from-background to-primary/5 dark:to-primary/10 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <FileText className="h-8 w-8 md:h-10 md:w-10" />
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6" dir="rtl" data-testid="text-terms-title">
              شروط الاستخدام
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed" dir="rtl">
              نرحب بك في موقع كبسولة (capsulah.com). يُرجى قراءة شروط الاستخدام التالية بعناية قبل تصفح الموقع أو الاستفادة من خدماته
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16" dir="rtl">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          <Card className="p-6 md:p-8">
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              تحكم شروط الاستخدام هذه علاقتك بموقع كبسولة وجميع المحتويات والخدمات المتاحة عليه. باستخدامك للموقع أو دخولك إليه فإنك تُقرّ بموافقتك الكاملة على هذه الشروط. وفي حال عدم موافقتك على أيٍّ منها، نرجو التوقف عن استخدام الموقع.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <div className="flex items-start gap-3 md:gap-4 mb-4">
              <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">طبيعة المحتوى</h2>
              </div>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              كبسولة صحيفة إلكترونية متخصصة في الأخبار والمحتوى الصحي والطبي باللغة العربية. يهدف الموقع إلى تقديم معلومات موثوقة ومبسّطة لرفع الوعي الصحي العام، ويتم إعداد المحتوى ومراجعته بعناية اعتمادًا على مصادر موثوقة.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <div className="flex items-start gap-3 md:gap-4 mb-4">
              <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Stethoscope className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">إخلاء المسؤولية الطبية</h2>
              </div>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              جميع المعلومات والمقالات والإجابات المقدّمة على الموقع — بما في ذلك المحتوى المُولَّد عبر أدوات الذكاء الاصطناعي — هي لأغراض تثقيفية وتوعوية عامة فقط، ولا تُعدّ بديلًا عن الاستشارة الطبية المتخصصة أو التشخيص أو العلاج. ننصح دائمًا بالرجوع إلى الطبيب أو المختص المؤهّل قبل اتخاذ أي قرار يتعلق بصحتك أو دوائك، ولا يتحمّل الموقع أي مسؤولية عن قرارات تُتّخذ بناءً على محتواه.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <div className="flex items-start gap-3 md:gap-4 mb-4">
              <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">الاستخدام المقبول</h2>
              </div>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
              يلتزم المستخدم باستخدام الموقع لأغراض مشروعة فقط، ويُمنع على وجه الخصوص:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-muted-foreground ms-4">
              <li>إساءة استخدام الموقع أو محاولة الإضرار به أو بأنظمته أو المساس بأمنه</li>
              <li>نشر أو بث أي محتوى مخالف للأنظمة أو الآداب العامة عبر أي وسيلة تفاعلية في الموقع</li>
              <li>محاولة الوصول غير المصرّح به إلى أي جزء من الموقع أو بياناته</li>
              <li>استخدام المحتوى لأغراض تجارية دون إذن خطّي مسبق من الموقع</li>
            </ul>
          </Card>

          <Card className="p-6 md:p-8">
            <div className="flex items-start gap-3 md:gap-4 mb-4">
              <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Copyright className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">الملكية الفكرية</h2>
              </div>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              جميع الحقوق المتعلقة بالمحتوى المنشور على الموقع من نصوص وصور وتصاميم وشعارات محفوظة لموقع كبسولة، ما لم يُذكر خلاف ذلك. يُسمح بالاقتباس أو إعادة النشر لأغراض غير تجارية شريطة الإشارة إلى المصدر بوضوح ووضع رابط للموقع، ويُمنع النسخ الكامل أو إعادة الإنتاج التجاري دون إذن مكتوب مسبق.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <div className="flex items-start gap-3 md:gap-4 mb-4">
              <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Link2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">الروابط الخارجية</h2>
              </div>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              قد يحتوي الموقع على روابط لمواقع أو مصادر خارجية لأغراض الإثراء المعرفي. هذه الروابط لا تخضع لسيطرتنا، ولا يتحمّل الموقع أي مسؤولية عن محتواها أو سياسات الخصوصية الخاصة بها، ويبقى تصفّحك لها على مسؤوليتك الشخصية.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <div className="flex items-start gap-3 md:gap-4 mb-4">
              <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <ShieldAlert className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">حدود المسؤولية</h2>
              </div>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              يبذل الموقع جهده لضمان دقة المعلومات وحداثتها، إلا أنه لا يضمن خلوّها التام من الأخطاء أو انقطاع الخدمة في بعض الأوقات. ولا يتحمّل الموقع أو القائمون عليه أي مسؤولية عن أضرار مباشرة أو غير مباشرة قد تنتج عن استخدام الموقع أو تعذّر الوصول إليه.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <div className="flex items-start gap-3 md:gap-4 mb-4">
              <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <RefreshCw className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">تعديل الشروط</h2>
              </div>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              يحتفظ الموقع بحقه في تعديل أو تحديث شروط الاستخدام في أي وقت ودون إشعار مسبق، وتُنشر النسخة المحدّثة على هذه الصفحة. ويُعدّ استمرارك في استخدام الموقع بعد نشر التعديلات موافقةً ضمنية عليها.
            </p>
          </Card>

          <Card className="p-6 md:p-8 bg-primary/5 dark:bg-primary/10">
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">القانون المعمول به والتواصل</h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              تخضع شروط الاستخدام هذه وتُفسَّر وفقًا للأنظمة المعمول بها في المملكة العربية السعودية. ولأي استفسار يتعلق بهذه الشروط يمكنك التواصل معنا عبر البريد الإلكتروني: info@capsulah.com
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
