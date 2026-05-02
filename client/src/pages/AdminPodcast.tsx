import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Headphones, Plus, RefreshCw, Trash2, Play, Pause, Mic,
  Calendar, Newspaper, AlertCircle, CheckCircle2, Clock, Loader2, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminSidebar from "@/components/AdminSidebar";
import type { PodcastEpisode } from "@shared/schema";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ar-SA", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Riyadh",
  });
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ready":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 gap-1">
          <CheckCircle2 className="h-3 w-3" /> جاهزة
        </Badge>
      );
    case "generating":
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 gap-1 animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin" /> جارٍ التوليد
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" /> في الانتظار
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 gap-1">
          <AlertCircle className="h-3 w-3" /> فشل
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function AdminPodcast() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: episodes = [], isLoading, refetch } = useQuery<PodcastEpisode[]>({
    queryKey: ["/api/podcast/episodes"],
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasGenerating = data?.some(
        (e) => e.status === "generating" || e.status === "pending"
      );
      return hasGenerating ? 4000 : false;
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/podcast/generate", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/podcast/episodes"] });
      toast({ title: "بدأ التوليد", description: "جارٍ توليد حلقة البودكاست..." });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في بدء التوليد",
        variant: "destructive",
      });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/admin/podcast/episodes/${id}/regenerate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/podcast/episodes"] });
      toast({ title: "بدأ إعادة التوليد" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/admin/podcast/episodes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/podcast/episodes"] });
      setDeleteId(null);
      toast({ title: "تم الحذف", description: "تم حذف الحلقة بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const readyCount = episodes.filter((e) => e.status === "ready").length;
  const generatingCount = episodes.filter(
    (e) => e.status === "generating" || e.status === "pending"
  ).length;

  return (
    <div className="flex h-screen bg-background" dir="rtl">
      <AdminSidebar activeRoute="/admin/podcast" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">الكبسولة الصوتية</h1>
              <p className="text-sm text-muted-foreground">
                توليد وإدارة حلقات البودكاست اليومي
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              data-testid="button-refresh-episodes"
            >
              <RefreshCw className="h-4 w-4 ml-1" />
              تحديث
            </Button>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending || generatingCount > 0}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              data-testid="button-generate-episode"
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              توليد حلقة اليوم
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                    <Mic className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{episodes.length}</div>
                    <div className="text-sm text-muted-foreground">إجمالي الحلقات</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{readyCount}</div>
                    <div className="text-sm text-muted-foreground">حلقات جاهزة</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                    <Loader2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{generatingCount}</div>
                    <div className="text-sm text-muted-foreground">جارٍ التوليد</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Generation status banner */}
            {generatingCount > 0 && (
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                <CardContent className="p-4 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-700 dark:text-blue-300">
                      جارٍ توليد الحلقة الآن
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      يتضمن كتابة السكريبت وتحويله إلى صوت. قد يستغرق ذلك دقيقة أو أكثر.
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Episodes list */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">قائمة الحلقات</CardTitle>
                <CardDescription>
                  انقر على زر التوليد لإنشاء حلقة جديدة من أبرز أخبار اليوم
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : episodes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Headphones className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">لا توجد حلقات بعد</p>
                    <p className="text-sm mt-1">
                      انقر على "توليد حلقة اليوم" للبدء
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {episodes.map((episode) => (
                      <div
                        key={episode.id}
                        className="py-4 flex items-center gap-4"
                        data-testid={`row-episode-${episode.id}`}
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 ${
                          episode.status === "ready"
                            ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                            : episode.status === "generating" || episode.status === "pending"
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                            : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                        }`}>
                          {episode.status === "ready" ? (
                            <Play className="h-4 w-4" />
                          ) : episode.status === "generating" || episode.status === "pending" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate" data-testid={`text-ep-title-${episode.id}`}>
                            {episode.title}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(episode.episodeDate)}
                            </span>
                            {episode.newsCount && episode.newsCount > 0 ? (
                              <span className="flex items-center gap-1">
                                <Newspaper className="h-3 w-3" />
                                {episode.newsCount} خبر
                              </span>
                            ) : null}
                            {episode.errorMessage && (
                              <span className="text-red-500 truncate max-w-xs">
                                {episode.errorMessage}
                              </span>
                            )}
                          </div>
                        </div>

                        <StatusBadge status={episode.status} />

                        <div className="flex items-center gap-1 shrink-0">
                          {episode.status === "ready" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              data-testid={`button-view-episode-${episode.id}`}
                            >
                              <a href="/podcast" target="_blank" rel="noopener noreferrer">
                                <ChevronRight className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => regenerateMutation.mutate(episode.id)}
                            disabled={
                              regenerateMutation.isPending ||
                              episode.status === "generating" ||
                              episode.status === "pending"
                            }
                            data-testid={`button-regenerate-${episode.id}`}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(episode.id)}
                            data-testid={`button-delete-${episode.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذه الحلقة؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} data-testid="button-cancel-delete">
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حذف"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
