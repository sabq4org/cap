import { MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@assets/generated_images/Healthcare_wellness_hero_image_83f0ff25.png";

export default function Hero() {
  return (
    <section className="relative w-full aspect-[21/9] min-h-[400px] overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="أشخاص يعيشون حياة صحية"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
      </div>

      <div className="relative container mx-auto px-4 py-20 md:py-32 lg:py-40">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 backdrop-blur-md px-4 py-2 text-sm font-medium text-white border border-white/20">
            <Sparkles className="h-4 w-4" />
            بوابتك الصحية الذكية
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            مساعدك الصحي الموثوق
            <br />
            <span className="text-primary">بالعربية</span>
          </h1>

          <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl">
            احصل على استشارات صحية موثوقة، تتبع تغذيتك ولياقتك، وتعلّم من محتوى طبي مُراجع من أطباء معتمدين. كل ذلك في مكان واحد.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              size="lg"
              className="gap-2 text-lg h-14 rounded-full bg-primary/90 backdrop-blur-md border border-primary-border hover:bg-primary"
              data-testid="button-start-chat"
            >
              <MessageSquare className="h-5 w-5" />
              ابدأ المحادثة الآن
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-lg h-14 rounded-full bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
              data-testid="button-learn-more"
            >
              اكتشف المزيد
            </Button>
          </div>

          <div className="flex items-center gap-6 pt-6 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>مدعوم بالذكاء الاصطناعي</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>محتوى مُراجع طبياً</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
