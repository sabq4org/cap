import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  FlaskConical, Eye, Check, X, RefreshCw, ExternalLink, 
  ChevronRight, ChevronLeft, LayoutDashboard, LogOut,
  XCircle, AlertTriangle, CheckCircle, Loader2, Newspaper
} from "lucide-react";
import type { RumorSubmission } from "@shared/schema";

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "انتظار", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  ai_responded: { label: "رد الذكاء الاصطناعي جاهز", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  published: { label: "منشور", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

const platformLabels: Record<string, string> = {
  tiktok: "تيك توك",
  whatsapp: "واتساب",
  facebook: "فيسبوك",
  twitter: "تويتر",
  other: "أخرى",
};

const verdictConfig = {
  "خرافة": { icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" },
  "صحيح جزئياً": { icon: AlertTriangle, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800" },
  "صحيح": { icon: CheckCircle, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" },
} as const;

export default function AdminRumors() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRumor, setSelectedRumor] = useState<RumorSubmission | null>(null);
  const [editorNotes, setEditorNotes] = useState("");
  const [editedExplanation, setEditedExplanation] = useState("");

  const { data: rumors, isLoading } = useQuery<RumorSubmission[]>({
    queryKey: ["/api/admin/rumors", statusFilter],
    queryFn: async () => {
      const url = (statusFilter && statusFilter !== "all") ? `/api/admin/rumors?status=${statusFilter}` : "/api/admin/rumors";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const patchMutation = useMutation({
    mutationFn: async (payload: { id: string; action?: string; editorNotes?: string; aiResponse?: any }) => {
      const { id, ...body } = payload;
      return apiRequest("PATCH", `/api/admin/rumors/${id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rumors"] });
      setSelectedRumor(null);
    },
    onError: () => {
      toast({ title: "خطأ", description: "حدث خطأ أثناء تحديث البيانات.", variant: "destructive" });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/rumors/${id}/regenerate`, {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rumors"] });
      if (selectedRumor) {
        setSelectedRumor({ ...selectedRumor, ...data });
        setEditedExplanation(data.aiResponse?.explanation || "");
      }
      toast({ title: "تم", description: "تم إعادة تحليل الشائعة بنجاح." });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل إعادة التحليل.", variant: "destructive" });
    },
  });

  const handleOpenRumor = (rumor: RumorSubmission) => {
    setSelectedRumor(rumor);
    setEditorNotes(rumor.editorNotes || "");
    setEditedExplanation(rumor.aiResponse?.explanation || "");
  };

  const handlePublish = () => {
    if (!selectedRumor) return;
    const aiResponse = selectedRumor.aiResponse
      ? { ...selectedRumor.aiResponse, explanation: editedExplanation }
      : undefined;
    patchMutation.mutate({
      id: selectedRumor.id,
      action: "publish",
      editorNotes,
      aiResponse,
    });
    toast({ title: "تم النشر", description: "تم نشر التفنيد كخبر سريع." });
  };

  const handleReject = () => {
    if (!selectedRumor) return;
    patchMutation.mutate({ id: selectedRumor.id, action: "reject", editorNotes });
    toast({ title: "تم الرفض", description: "تم رفض الشائعة." });
  };

  const handleSaveNotes = () => {
    if (!selectedRumor) return;
    const aiResponse = selectedRumor.aiResponse
      ? { ...selectedRumor.aiResponse, explanation: editedExplanation }
      : undefined;
    patchMutation.mutate({ id: selectedRumor.id, editorNotes, aiResponse });
    toast({ title: "تم الحفظ", description: "تم حفظ الملاحظات." });
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setLocation("/admin");
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top Bar */}
      <div className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">إدارة الشائعات</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/dashboard")} className="gap-1">
            <LayoutDashboard className="h-4 w-4" />
            لوحة التحكم
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1 text-red-600">
            <LogOut className="h-4 w-4" />
            خروج
          </Button>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(statusLabels).map(([status, cfg]) => {
            const count = rumors?.filter(r => r.status === status).length || 0;
            return (
              <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(statusFilter === status ? "" : status)} data-testid={`stat-card-${status}`}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <Badge className={`text-xs mt-1 ${cfg.color}`}>{cfg.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-52" data-testid="select-status-filter">
              <SelectValue placeholder="جميع الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {Object.entries(statusLabels).map(([value, cfg]) => (
                <SelectItem key={value} value={value}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {rumors?.length || 0} شائعة
          </span>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : rumors && rumors.length > 0 ? (
          <div className="space-y-3">
            {rumors.map((rumor) => {
              const statusCfg = statusLabels[rumor.status] || statusLabels.pending;
              const verdict = rumor.aiResponse?.verdict;
              const verdictCfg = verdict ? verdictConfig[verdict as keyof typeof verdictConfig] : null;
              const VerdictIcon = verdictCfg?.icon;

              return (
                <Card
                  key={rumor.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleOpenRumor(rumor)}
                  data-testid={`rumor-row-${rumor.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={`text-xs ${statusCfg.color}`}>{statusCfg.label}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {platformLabels[rumor.sourcePlatform] || rumor.sourcePlatform}
                          </Badge>
                          {verdict && VerdictIcon && verdictCfg && (
                            <span className={`flex items-center gap-1 text-xs font-medium ${verdictCfg.color}`}>
                              <VerdictIcon className="h-3.5 w-3.5" />
                              {verdict}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground line-clamp-2">{rumor.rumorText}</p>
                        {rumor.aiResponse?.shortSummary && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            ملخص الرد: {rumor.aiResponse.shortSummary}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {rumor.viewCount}
                        </div>
                        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <FlaskConical className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">لا توجد شائعات بعد</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRumor} onOpenChange={(open) => { if (!open) setSelectedRumor(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              تفاصيل الشائعة
            </DialogTitle>
          </DialogHeader>

          {selectedRumor && (
            <div className="space-y-4">
              {/* Status & Platform */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${statusLabels[selectedRumor.status]?.color}`}>
                  {statusLabels[selectedRumor.status]?.label}
                </Badge>
                <Badge variant="outline">{platformLabels[selectedRumor.sourcePlatform] || selectedRumor.sourcePlatform}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(selectedRumor.createdAt!).toLocaleDateString("ar-SA")}
                </span>
              </div>

              {/* Rumor text */}
              <div>
                <label className="text-sm font-medium mb-1 block">نص الشائعة</label>
                <div className="bg-muted/50 rounded-lg p-3 text-sm leading-relaxed">
                  {selectedRumor.rumorText}
                </div>
              </div>

              {/* Source URL */}
              {selectedRumor.sourceUrl && (
                <div>
                  <label className="text-sm font-medium mb-1 block">رابط المصدر</label>
                  <a href={selectedRumor.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    {selectedRumor.sourceUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* AI Response */}
              {selectedRumor.aiResponse ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">رد الذكاء الاصطناعي</label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 h-7 text-xs"
                      onClick={() => regenerateMutation.mutate(selectedRumor.id)}
                      disabled={regenerateMutation.isPending}
                      data-testid="button-regenerate"
                    >
                      {regenerateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      إعادة التحليل
                    </Button>
                  </div>
                  {(() => {
                    const v = selectedRumor.aiResponse!.verdict;
                    const cfg = verdictConfig[v as keyof typeof verdictConfig];
                    const Icon = cfg?.icon || AlertTriangle;
                    return (
                      <div className={`rounded-lg border p-3 mb-3 ${cfg?.bg || ""}`}>
                        <div className={`flex items-center gap-2 font-bold mb-2 ${cfg?.color || ""}`}>
                          <Icon className="h-5 w-5" />
                          الحكم: {v}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">الملخص: {selectedRumor.aiResponse!.shortSummary}</p>
                      </div>
                    );
                  })()}
                  <label className="text-sm font-medium mb-1 block">الشرح العلمي (قابل للتعديل)</label>
                  <Textarea
                    value={editedExplanation}
                    onChange={(e) => setEditedExplanation(e.target.value)}
                    className="min-h-[140px] text-sm"
                    data-testid="textarea-explanation"
                  />
                  {selectedRumor.aiResponse!.sources && selectedRumor.aiResponse!.sources.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">المصادر:</p>
                      <ul className="space-y-1">
                        {selectedRumor.aiResponse!.sources.map((src, i) => (
                          <li key={i}>
                            <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                              {src.title}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 bg-muted/30 rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">جاري تحليل الشائعة بالذكاء الاصطناعي...</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => regenerateMutation.mutate(selectedRumor.id)} disabled={regenerateMutation.isPending} data-testid="button-trigger-analysis">
                    <RefreshCw className="h-3 w-3" />
                    تحليل الآن
                  </Button>
                </div>
              )}

              {/* Editor Notes */}
              <div>
                <label className="text-sm font-medium mb-1 block">ملاحظات تحريرية</label>
                <Textarea
                  value={editorNotes}
                  onChange={(e) => setEditorNotes(e.target.value)}
                  placeholder="أضف ملاحظاتك هنا (اختياري)..."
                  className="min-h-[80px] text-sm"
                  data-testid="textarea-editor-notes"
                />
              </div>

              {/* Published news link */}
              {selectedRumor.publishedNewsId && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Newspaper className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">تم النشر</span>
                    <Link href={`/news/${selectedRumor.publishedNewsId}`}>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs gap-1 text-green-700 dark:text-green-300" data-testid="link-published-news">
                        عرض الخبر المنشور
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={handleSaveNotes}
                  disabled={patchMutation.isPending}
                  data-testid="button-save-notes"
                >
                  حفظ الملاحظات
                </Button>

                {selectedRumor.status !== "published" && selectedRumor.status !== "rejected" && (
                  <>
                    <Button
                      size="sm"
                      className="gap-1 bg-green-600 hover:bg-green-700"
                      onClick={handlePublish}
                      disabled={patchMutation.isPending || !selectedRumor.aiResponse}
                      data-testid="button-publish"
                    >
                      <Check className="h-4 w-4" />
                      اعتماد ونشر
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1"
                      onClick={handleReject}
                      disabled={patchMutation.isPending}
                      data-testid="button-reject"
                    >
                      <X className="h-4 w-4" />
                      رفض
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
