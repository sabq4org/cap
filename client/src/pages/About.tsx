import { Card } from "@/components/ui/card";
import { Heart, Target, MessageSquare, Users } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-white dark:from-background to-primary/5 dark:to-primary/10 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Heart className="h-8 w-8 md:h-10 md:w-10" fill="currentColor" />
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6" dir="rtl">
              من نحن
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed" dir="rtl">
              في "كبسولة"، نؤمن أن المعلومة الصحية الموثوقة يجب أن تكون في متناول الجميع، بلغة بسيطة، وصياغة عصرية، وتجربة قراءة خفيفة تشبه "الكبسولة" اليومية التي تحميك وتفيدك.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16" dir="rtl">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">من نحن؟</h2>
            <p className="text-muted-foreground leading-relaxed mb-4 text-sm md:text-base">
              نحن منصّة رقمية سعودية مستقلة، متخصصة في نشر الأخبار والمقالات الصحية بأسلوب سهل ومُبسط، بعيدًا عن التعقيد والمصطلحات الغامضة. نتابع أحدث الدراسات والاكتشافات العلمية من مصادر موثوقة، ونقدمها لك بلهجة عربية واضحة، حتى تكون أقرب لصحتك… وأكثر وعيًا في حياتك.
            </p>
          </Card>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">ماذا نقدم؟</h2>
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <Card className="p-4 md:p-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 text-base md:text-lg">مقالات موثوقة</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      مقالات طبية وتغذوية تستند إلى دراسات موثقة من جامعات ومراكز أبحاث عالمية
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Target className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 text-base md:text-lg">أخبار حديثة</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      أخبار صحية حديثة من السعودية والعالم، تُنشر بسرعة ودقّة
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 text-base md:text-lg">محتوى توعوي</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      محتوى اجتماعي وتوعوي يساعدك على فهم التغيرات الصحية من حولك، والتفاعل معها بذكاء
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Heart className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 text-base md:text-lg">لغة متوازنة</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      لغة متوازنة تجمع بين البساطة والاحتراف، لتخاطب الجميع: من القارئ العادي إلى المتخصص
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <Card className="p-6 md:p-8 bg-primary/5 dark:bg-primary/10">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">رؤيتنا</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                أن نصنع جيلاً عربيًا أكثر وعيًا بصحته، من خلال محتوى رقمي موثوق، سلس، ومستدام.
              </p>
            </Card>

            <Card className="p-6 md:p-8 bg-primary/5 dark:bg-primary/10">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">رسالتنا</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                تقديم محتوى عربي صحي، يُغني القارئ ويثري وعيه، بعيدًا عن التهويل، الإشاعات، والمعلومات المضللة.
              </p>
            </Card>
          </div>

          <Card className="p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">فريقنا</h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              يضم فريق "كبسولة" مجموعة من المحررين المتخصصين في الصحة والعلوم، يعملون بدقّة وسرعة لمتابعة المستجدات، وتحويلها إلى كبسولات معرفية تُنشر يوميًا.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
