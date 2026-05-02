import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Loader2, Share2, Video, Image } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SocialContent {
  xThread: string[];
  reelsScript: Array<{ scene: number; duration: string; dialogue: string }>;
  instagramPoints: { points: string[]; hashtags: string[] };
}

interface Props {
  open: boolean;
  onClose: () => void;
  articleId: string;
  articleTitle: string;
}

export function SocialContentModal({ open, onClose, articleId, articleTitle }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<SocialContent | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [xTweets, setXTweets] = useState<string[]>([]);
  const [scenes, setScenes] = useState<Array<{ scene: number; duration: string; dialogue: string }>>([]);
  const [igPoints, setIgPoints] = useState<string[]>([]);
  const [igHashtags, setIgHashtags] = useState<string[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", `/api/articles/${articleId}/social-content`, {});
      const data = await res.json();
      setContent(data);
      setXTweets(data.xThread || []);
      setScenes(data.reelsScript || []);
      setIgPoints(data.instagramPoints?.points || []);
      setIgHashtags(data.instagramPoints?.hashtags || []);
      queryClient.invalidateQueries({ queryKey: ["/api/articles?includeAll=true"] });
      toast({ title: "تم التوليد بنجاح", description: "المحتوى جاهز للنسخ والنشر" });
    } catch (err) {
      toast({ title: "خطأ في التوليد", description: "تعذر توليد المحتوى، يرجى المحاولة مجدداً", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast({ title: "تم النسخ" });
  };

  const CopyBtn = ({ text, copyKey }: { text: string; copyKey: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={() => copyText(text, copyKey)}
      data-testid={`button-copy-${copyKey}`}
    >
      {copiedKey === copyKey ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Share2 className="h-5 w-5 text-emerald-600" />
            توليد محتوى السوشيال ميديا
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-right line-clamp-1">{articleTitle}</p>
        </DialogHeader>

        {!content && !loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Share2 className="h-16 w-16 text-muted-foreground/40" />
            <p className="text-muted-foreground text-center">
              اضغط على الزر لتوليد محتوى جاهز لثلاث منصات من هذا المقال
            </p>
            <Button onClick={handleGenerate} className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-generate-social">
              <Share2 className="h-4 w-4 ml-2" />
              توليد المحتوى
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
            <p className="text-muted-foreground">جاري توليد المحتوى للمنصات الثلاث...</p>
            <p className="text-xs text-muted-foreground">قد يستغرق ذلك 15-30 ثانية</p>
          </div>
        )}

        {content && !loading && (
          <div className="flex-1 overflow-hidden flex flex-col gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              className="self-end"
              data-testid="button-regenerate-social"
            >
              <Loader2 className="h-3.5 w-3.5 ml-1" />
              إعادة التوليد
            </Button>
            <Tabs defaultValue="x" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="x" data-testid="tab-x-thread">
                  <span className="font-bold ml-1">X</span> تويتر
                </TabsTrigger>
                <TabsTrigger value="reels" data-testid="tab-reels">
                  <Video className="h-3.5 w-3.5 ml-1" /> ريلز
                </TabsTrigger>
                <TabsTrigger value="instagram" data-testid="tab-instagram">
                  <Image className="h-3.5 w-3.5 ml-1" /> إنستغرام
                </TabsTrigger>
              </TabsList>

              {/* X Thread Tab */}
              <TabsContent value="x" className="flex-1 overflow-y-auto mt-3 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">{xTweets.length} تغريدات</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyText(xTweets.map((t, i) => `${i + 1}/ ${t}`).join("\n\n"), "x-all")}
                    data-testid="button-copy-x-all"
                  >
                    <Copy className="h-3.5 w-3.5 ml-1" />
                    نسخ الثريد كاملاً
                  </Button>
                </div>
                {xTweets.map((tweet, i) => (
                  <div key={i} className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">{i + 1}</Badge>
                      <Textarea
                        value={tweet}
                        onChange={(e) => {
                          const updated = [...xTweets];
                          updated[i] = e.target.value;
                          setXTweets(updated);
                        }}
                        className="flex-1 resize-none text-sm min-h-[60px] bg-transparent border-0 focus-visible:ring-0 p-0"
                        data-testid={`textarea-tweet-${i}`}
                      />
                      <CopyBtn text={tweet} copyKey={`tweet-${i}`} />
                    </div>
                    <div className="text-xs text-muted-foreground text-left mt-1">
                      {tweet.length}/280
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* Reels Tab */}
              <TabsContent value="reels" className="flex-1 overflow-y-auto mt-3 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">{scenes.length} مشاهد</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyText(
                      scenes.map(s => `مشهد ${s.scene} (${s.duration}):\n${s.dialogue}`).join("\n\n"),
                      "reels-all"
                    )}
                    data-testid="button-copy-reels-all"
                  >
                    <Copy className="h-3.5 w-3.5 ml-1" />
                    نسخ السكريبت كاملاً
                  </Button>
                </div>
                {scenes.map((scene, i) => (
                  <div key={i} className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-emerald-600 text-white shrink-0 text-xs">مشهد {scene.scene}</Badge>
                      <span className="text-xs text-muted-foreground">{scene.duration}</span>
                      <CopyBtn text={scene.dialogue} copyKey={`scene-${i}`} />
                    </div>
                    <Textarea
                      value={scene.dialogue}
                      onChange={(e) => {
                        const updated = [...scenes];
                        updated[i] = { ...updated[i], dialogue: e.target.value };
                        setScenes(updated);
                      }}
                      className="w-full resize-none text-sm min-h-[70px] bg-transparent border rounded p-2"
                      data-testid={`textarea-scene-${i}`}
                    />
                  </div>
                ))}
              </TabsContent>

              {/* Instagram Tab */}
              <TabsContent value="instagram" className="flex-1 overflow-y-auto mt-3 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">النقاط ({igPoints.length})</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyText(igPoints.join("\n"), "ig-points")}
                      data-testid="button-copy-ig-points"
                    >
                      <Copy className="h-3.5 w-3.5 ml-1" />
                      نسخ النقاط
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {igPoints.map((point, i) => (
                      <div key={i} className="border rounded-lg p-2 bg-muted/30 flex items-start gap-2">
                        <Textarea
                          value={point}
                          onChange={(e) => {
                            const updated = [...igPoints];
                            updated[i] = e.target.value;
                            setIgPoints(updated);
                          }}
                          className="flex-1 resize-none text-sm min-h-[40px] bg-transparent border-0 focus-visible:ring-0 p-0"
                          data-testid={`textarea-ig-point-${i}`}
                        />
                        <CopyBtn text={point} copyKey={`ig-point-${i}`} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">الهاشتاقات</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyText(igHashtags.join(" "), "ig-hashtags")}
                      data-testid="button-copy-ig-hashtags"
                    >
                      <Copy className="h-3.5 w-3.5 ml-1" />
                      نسخ الهاشتاقات
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {igHashtags.map((tag, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="cursor-pointer text-xs hover:bg-emerald-100"
                        onClick={() => copyText(tag, `hashtag-${i}`)}
                        data-testid={`badge-hashtag-${i}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => copyText(
                      igPoints.join("\n") + "\n\n" + igHashtags.join(" "),
                      "ig-all"
                    )}
                    data-testid="button-copy-ig-all"
                  >
                    <Copy className="h-3.5 w-3.5 ml-1" />
                    نسخ النقاط والهاشتاقات معاً
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
