import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import DOMPurify from "dompurify";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  User,
  Clock,
  Share2,
  MessageCircle,
  Heart,
  Bookmark,
  ArrowRight,
  ExternalLink,
  Lightbulb,
  HelpCircle,
  Activity,
  ChevronDown,
  ChevronUp,
  Send,
  Facebook,
  Linkedin,
  Stethoscope,
  Apple,
  Dumbbell,
  Droplets,
  Tag,
  ImageIcon,
  Brain,
  HeartPulse,
  Pill,
  ShieldCheck,
  Utensils,
  TrendingUp
} from "lucide-react";
import { SiX, SiWhatsapp } from "react-icons/si";
import { AIImageBadge } from "@/components/AIImageBadge";
import type { News } from "@shared/schema";
import newsImage1 from "@assets/stock_images/medical_health_healt_fdb22ee1.jpg";
import newsImage2 from "@assets/stock_images/medical_health_healt_2bc2bc37.jpg";
import newsImage3 from "@assets/stock_images/medical_health_healt_af440b4a.jpg";
import newsImage4 from "@assets/stock_images/medical_health_healt_981aee81.jpg";
import newsImage5 from "@assets/stock_images/medical_health_healt_8bccc8a3.jpg";
import newsImage6 from "@assets/stock_images/medical_health_healt_46b1b20f.jpg";

const newsImages = [newsImage1, newsImage2, newsImage3, newsImage4, newsImage5, newsImage6];

const categoryLabels: Record<string, string> = {
  "health": "صحة عامة",
  "health-news": "أخبار صحية",
  "saudi-health": "صحة السعودية",
  "health-community": "المجتمع الصحي",
  "health-reports": "تقارير صحية",
  "health-events": "فعاليات صحية",
  "quality-life": "جودة حياة",
  "nutrition": "تغذية",
  "misc": "منوعات"
};

const categoryColors: Record<string, string> = {
  "health": "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  "health-news": "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  "saudi-health": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200",
  "health-community": "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  "health-reports": "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200",
  "health-events": "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200",
  "quality-life": "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200",
  "nutrition": "bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-200",
  "misc": "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200"
};

const healthTips = [
  {
    tip: "استشر طبيبك قبل اتخاذ أي قرار صحي مهم",
    icon: Stethoscope,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    iconBg: "bg-blue-100 dark:bg-blue-900/50"
  },
  {
    tip: "حافظ على نمط حياة صحي ومتوازن",
    icon: HeartPulse,
    color: "from-rose-500 to-pink-500",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    iconBg: "bg-rose-100 dark:bg-rose-900/50"
  },
  {
    tip: "مارس الرياضة بانتظام لمدة 30 دقيقة يومياً",
    icon: Dumbbell,
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    iconBg: "bg-orange-100 dark:bg-orange-900/50"
  },
  {
    tip: "اشرب 8 أكواب من الماء يومياً على الأقل",
    icon: Droplets,
    color: "from-sky-500 to-blue-500",
    bgColor: "bg-sky-50 dark:bg-sky-950/30",
    iconBg: "bg-sky-100 dark:bg-sky-900/50"
  }
];

const keywordsMap: Record<string, string[]> = {
  medical: ["طب", "علاج", "تشخيص", "مرض", "صحة", "طبيب"],
  health: ["صحة", "وقاية", "حياة صحية", "عافية", "لياقة"],
  pharmaceutical: ["دواء", "صيدلة", "علاج", "وصفة طبية", "أدوية"],
  conference: ["مؤتمر", "ندوة", "بحث علمي", "أطباء", "اكتشاف"],
  awareness: ["توعية", "وقاية", "تثقيف صحي", "حملة", "مجتمع"],
  nutrition: ["تغذية", "غذاء", "فيتامينات", "حمية", "صحة غذائية"]
};


const infoGraphics = [
  {
    title: "هل تعلم؟",
    content: "النوم الكافي يعزز مناعة الجسم ويحسن الذاكرة",
    icon: Brain,
    gradient: "from-primary/80 to-primary"
  },
  {
    title: "نصيحة اليوم",
    content: "تناول 5 حصص من الفواكه والخضروات يومياً",
    icon: Apple,
    gradient: "from-emerald-600 to-emerald-700"
  },
  {
    title: "معلومة مهمة",
    content: "المشي 10,000 خطوة يومياً يقلل خطر أمراض القلب",
    icon: TrendingUp,
    gradient: "from-teal-600 to-teal-700"
  }
];

const faqs = [
  {
    question: "ما هي أهمية المتابعة الطبية الدورية؟",
    answer: "تساعد المتابعة الدورية في الكشف المبكر عن الأمراض وتحسين فرص العلاج الناجح."
  },
  {
    question: "كيف يمكنني الحفاظ على صحة جيدة؟",
    answer: "من خلال التغذية المتوازنة، ممارسة الرياضة، النوم الكافي، وتجنب التوتر."
  },
  {
    question: "متى يجب استشارة الطبيب؟",
    answer: "عند ظهور أي أعراض غير طبيعية أو مستمرة، أو للفحوصات الدورية."
  }
];

export default function NewsDetail() {
  // Support both /news/:id and /n/:shortCode routes
  const [, idParams] = useRoute("/news/:id");
  const [, shortCodeParams] = useRoute("/n/:shortCode");
  
  const newsId = idParams?.id || null;
  const shortCode = shortCodeParams?.shortCode || null;
  
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [comment, setComment] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Fetch by ID if available, otherwise by shortCode
  const { data: news, isLoading } = useQuery<News>({
    queryKey: shortCode ? ["/api/n", shortCode] : ["/api/news", newsId],
    enabled: !!(newsId || shortCode),
  });

  const { data: relatedNews } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  // Fire-and-forget view count increment
  useEffect(() => {
    if (news?.id) {
      fetch(`/api/news/${news.id}/view`, { method: "POST" }).catch(() => {});
    }
  }, [news?.id]);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('ar-EG-u-nu-latn', {
      timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    });
    const timeStr = d.toLocaleTimeString('ar-SA', {
      timeZone: 'Asia/Riyadh',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${dateStr} - ${timeStr}`;
  };

  const getReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const shareOnSocial = (platform: string) => {
    // Use short URL with shortCode if available
    const shareUrl = news?.shortCode 
      ? `${window.location.origin}/n/${news.shortCode}`
      : `${window.location.origin}/news/${newsId}`;
    const title = news?.title || "";
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + shareUrl)}`
    };
    
    window.open(urls[platform], "_blank", "width=600,height=400");
  };
  
  const copyShareLink = () => {
    // Use short URL with shortCode if available
    const shareUrl = news?.shortCode 
      ? `${window.location.origin}/n/${news.shortCode}`
      : `${window.location.origin}/news/${newsId}`;
    navigator.clipboard.writeText(shareUrl);
  };

  const related = relatedNews?.filter(n => n.id !== newsId && news && n.category === news.category).slice(0, 3) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" dir="rtl">
        <div className="container mx-auto max-w-4xl">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full mb-6 rounded-lg" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" dir="rtl">
        <Card className="p-8 text-center">
          <p className="text-lg text-muted-foreground mb-4">الخبر غير موجود</p>
          <Link href="/news">
            <Button data-testid="button-back-to-news">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للأخبار
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const imageIndex = news.id ? news.id.charCodeAt(0) % newsImages.length : 0;

  const seoDescription = news.summary || news.seoDescription || `${news.title} - اقرأ المزيد على كبسولة`;
  const seoImage = news.imageUrl || newsImages[0];

  return (
    <>
      <SEO
        title={news.seoTitle || news.title}
        description={seoDescription}
        image={seoImage}
        type="article"
        publishedTime={news.publishedAt?.toString()}
        author={news.source || "كبسولة"}
        keywords={news.keywords as string[] || []}
      />
      <div className="min-h-screen p-4 md:p-6 bg-background" dir="rtl">
        <div className="container mx-auto max-w-7xl">
          <Link href="/news">
            <Button variant="ghost" className="mb-4" data-testid="button-back">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للأخبار
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <article>
              <header className="mb-6">
                <Badge className={`${categoryColors[news.category] || ""} mb-4 text-sm`}>
                  {categoryLabels[news.category] || news.category}
                </Badge>
                
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-2" data-testid="text-news-title">
                  {news.title}
                </h1>
                
                {news.subtitle && (
                  <p className="text-lg md:text-xl text-muted-foreground font-medium mb-4" data-testid="text-news-subtitle">
                    {news.subtitle}
                  </p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span data-testid="text-publish-date">{formatDate(news.publishedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>فريق التحرير</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{getReadTime(news.content)} دقائق للقراءة</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant={liked ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLiked(!liked)}
                    data-testid="button-like"
                  >
                    <Heart className={`h-4 w-4 ml-1 ${liked ? "fill-current" : ""}`} />
                    أعجبني
                  </Button>
                  <Button
                    variant={bookmarked ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBookmarked(!bookmarked)}
                    data-testid="button-bookmark"
                  >
                    <Bookmark className={`h-4 w-4 ml-1 ${bookmarked ? "fill-current" : ""}`} />
                    حفظ
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={() => shareOnSocial("whatsapp")} data-testid="button-share-whatsapp" className="text-green-600">
                      <SiWhatsapp className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => shareOnSocial("twitter")} data-testid="button-share-twitter">
                      <SiX className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => shareOnSocial("facebook")} data-testid="button-share-facebook">
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => shareOnSocial("linkedin")} data-testid="button-share-linkedin">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </header>

              <figure className="relative mb-6 rounded-xl overflow-hidden shadow-lg bg-muted/30">
                <img 
                  src={news.imageUrl || newsImages[imageIndex]} 
                  alt={news.imageAlt || news.title}
                  className="w-full h-auto"
                  data-testid="img-news-cover"
                />
                <AIImageBadge imageUrl={news.imageUrl} size="md" />
                {news.imageAlt && (
                  <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
                    <div className="flex items-center gap-2 text-white/90">
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-sm" data-testid="text-image-caption">
                        {news.imageAlt}
                      </span>
                    </div>
                  </figcaption>
                )}
              </figure>

              <div className="flex flex-wrap gap-2 mb-6" data-testid="keywords-section">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span>الكلمات المفتاحية:</span>
                </div>
                {(news.keywords && news.keywords.length > 0 ? news.keywords : keywordsMap[news.category] || []).map((keyword, idx) => (
                  <Link key={idx} href={`/keyword/${encodeURIComponent(keyword)}`}>
                    <Badge 
                      className="text-xs hover-elevate cursor-pointer bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                      data-testid={`badge-keyword-${idx}`}
                    >
                      {keyword}
                    </Badge>
                  </Link>
                ))}
              </div>

              {news.summary && (
                <Card className="mb-6 overflow-hidden border-primary/20" data-testid="summary-box">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b border-primary/10">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">الموجز الذكي</span>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-base leading-relaxed text-foreground" data-testid="text-news-summary">
                      {news.summary}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
                <Separator className="my-6" />
                
                <div 
                  className="leading-relaxed text-foreground news-content"
                  data-testid="text-news-content"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(news.content, {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'hr', 'code', 'pre'],
                    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'style'],
                    ALLOW_DATA_ATTR: false,
                  }) }}
                />
              </div>

              {news.source && (
                <div className="mb-8 relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 via-background to-primary/10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                  <div className="relative p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ExternalLink className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground mb-1">المصدر</p>
                        {news.sourceUrl ? (
                          <a 
                            href={news.sourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-lg font-semibold text-primary hover:underline inline-flex items-center gap-2"
                            data-testid="link-source"
                          >
                            {news.source}
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-lg font-semibold text-foreground" data-testid="text-source">
                            {news.source}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="flex items-center gap-2 text-xl font-bold mb-6">
                  <Lightbulb className="h-6 w-6 text-primary" />
                  نصائح صحية مستخلصة
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {healthTips.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <div 
                        key={index} 
                        className={`relative ${item.bgColor} rounded-xl p-4 border border-transparent hover:shadow-md transition-all overflow-hidden group`}
                        data-testid={`tip-card-${index}`}
                      >
                        <div className="absolute top-0 left-0 w-24 h-24 opacity-10">
                          <div className={`w-full h-full bg-gradient-to-br ${item.color} rounded-full blur-2xl`} />
                        </div>
                        <div className="relative flex items-start gap-3">
                          <div className={`${item.iconBg} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <IconComponent className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-muted-foreground mb-1">نصيحة {index + 1}</div>
                            <p className="font-medium text-foreground leading-relaxed">{item.tip}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="flex items-center gap-2 text-xl font-bold mb-6">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  معلومات صحية مهمة
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {infoGraphics.map((info, index) => {
                    const IconComponent = info.icon;
                    return (
                      <div 
                        key={index}
                        className="relative overflow-hidden rounded-xl shadow-lg"
                        data-testid={`infographic-${index}`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${info.gradient}`} />
                        <div className="relative p-5 text-white">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-lg">{info.title}</span>
                          </div>
                          <p className="text-white/90 text-sm leading-relaxed">{info.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    أسئلة شائعة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {faqs.map((faq, index) => (
                    <div 
                      key={index} 
                      className="border rounded-lg overflow-hidden"
                    >
                      <button
                        className="w-full p-4 text-right flex items-center justify-between hover-elevate"
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        data-testid={`button-faq-${index}`}
                      >
                        <span className="font-medium">{faq.question}</span>
                        {expandedFaq === index ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      {expandedFaq === index && (
                        <div className="px-4 pb-4 text-muted-foreground">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

            </article>
          </div>

          <aside className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">أخبار ذات صلة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {related.length > 0 ? (
                  related.map((item, index) => (
                    <Link key={item.id} href={`/news/${item.id}`}>
                      <div className="flex gap-3 p-2 rounded-lg hover-elevate cursor-pointer" data-testid={`card-related-${item.id}`}>
                        <img 
                          src={item.imageUrl || newsImages[index % newsImages.length]} 
                          alt={item.title}
                          className="w-20 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-2 mb-1">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(item.publishedAt)}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد أخبار ذات صلة</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-primary/5 dark:bg-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  شارك الخبر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    className="flex-1 text-green-600" 
                    variant="outline"
                    onClick={() => shareOnSocial("whatsapp")}
                    data-testid="button-share-whatsapp-sidebar"
                  >
                    <SiWhatsapp className="h-4 w-4" />
                  </Button>
                  <Button 
                    className="flex-1" 
                    variant="outline"
                    onClick={() => shareOnSocial("twitter")}
                    data-testid="button-share-twitter-sidebar"
                  >
                    <SiX className="h-4 w-4" />
                  </Button>
                  <Button 
                    className="flex-1" 
                    variant="outline"
                    onClick={() => shareOnSocial("facebook")}
                    data-testid="button-share-facebook-sidebar"
                  >
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button 
                    className="flex-1" 
                    variant="outline"
                    onClick={() => shareOnSocial("linkedin")}
                    data-testid="button-share-linkedin-sidebar"
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تابع صحتك</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/chat">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-goto-chat">
                    <MessageCircle className="h-4 w-4 ml-2" />
                    المساعد الصحي الذكي
                  </Button>
                </Link>
                <Link href="/nutrition">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-goto-nutrition">
                    <Activity className="h-4 w-4 ml-2" />
                    متتبع التغذية
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-goto-profile">
                    <User className="h-4 w-4 ml-2" />
                    ملفي الصحي
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
    </>
  );
}
