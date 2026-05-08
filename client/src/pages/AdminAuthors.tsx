import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Trash2, GraduationCap, Building2, Mail, Phone, ExternalLink, Eye } from "lucide-react";
import type { Author } from "@shared/schema";

function AuthorRow({ author, onAction }: { author: Author; onAction: (id: string, action: 'approve' | 'reject' | 'delete', notes?: string) => void }) {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  return (
    <Card data-testid={`author-row-${author.id}`}>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="h-20 w-20 shrink-0 rounded-full overflow-hidden bg-muted">
            {author.profileImageUrl ? (
              <img src={author.profileImageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xl">
                {author.fullName.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
              <div>
                <h3 className="font-bold text-lg">{author.fullName}</h3>
                <Badge variant="secondary" className="mt-1">{author.specialty}</Badge>
              </div>
              <Badge variant={author.status === 'approved' ? 'default' : author.status === 'rejected' ? 'destructive' : 'outline'}>
                {author.status === 'pending' && 'قيد المراجعة'}
                {author.status === 'approved' && 'معتمد'}
                {author.status === 'rejected' && 'مرفوض'}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{author.bio}</p>

            <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{author.email}</div>
              {author.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" dir="ltr" />{author.phone}</div>}
              {author.qualification && <div className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{author.qualification}</div>}
              {author.organization && <div className="flex items-center gap-1"><Building2 className="h-3 w-3" />{author.organization}</div>}
            </div>

            {author.credentialsImageUrl && (
              <a href={author.credentialsImageUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-xs text-primary mb-3">
                <Eye className="h-3 w-3" />عرض إثبات الانتساب<ExternalLink className="h-3 w-3" />
              </a>
            )}

            {showNotes && (
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات المراجعة (اختياري)" rows={2} className="mb-2" data-testid={`textarea-notes-${author.id}`} />
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {author.status !== 'approved' && (
                <Button size="sm" onClick={() => onAction(author.id, 'approve', notes)} data-testid={`button-approve-${author.id}`}>
                  <CheckCircle2 className="h-4 w-4 ml-1" />اعتماد
                </Button>
              )}
              {author.status !== 'rejected' && (
                <Button size="sm" variant="outline" onClick={() => { if (!showNotes) { setShowNotes(true); return; } onAction(author.id, 'reject', notes); }} data-testid={`button-reject-${author.id}`}>
                  <XCircle className="h-4 w-4 ml-1" />رفض
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onAction(author.id, 'delete')} data-testid={`button-delete-${author.id}`}>
                <Trash2 className="h-4 w-4 ml-1" />حذف
              </Button>
              {author.status === 'approved' && (
                <a href={`/authors/${author.slug}`} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="ghost"><ExternalLink className="h-4 w-4 ml-1" />عرض الملف</Button>
                </a>
              )}
            </div>

            {author.reviewNotes && (
              <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">ملاحظة سابقة: {author.reviewNotes}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminAuthors() {
  const { toast } = useToast();
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const { data: authors, isLoading } = useQuery<Author[]>({
    queryKey: ['/api/admin/authors', tab],
    queryFn: async () => {
      const url = tab === 'all' ? '/api/admin/authors' : `/api/admin/authors?status=${tab}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('فشل الجلب');
      return res.json();
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action, notes }: { id: string; action: 'approve' | 'reject' | 'delete'; notes?: string }) => {
      if (action === 'delete') {
        return await apiRequest('DELETE', `/api/admin/authors/${id}`);
      }
      const status = action === 'approve' ? 'approved' : 'rejected';
      return await apiRequest('PATCH', `/api/admin/authors/${id}/status`, { status, reviewNotes: notes });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/authors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/authors'] });
      toast({ title: vars.action === 'approve' ? 'تم الاعتماد' : vars.action === 'reject' ? 'تم الرفض' : 'تم الحذف' });
    },
    onError: (e: any) => toast({ title: 'خطأ', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">إدارة الكتّاب</h1>
        <p className="text-muted-foreground">مراجعة طلبات الانضمام واعتماد الكتّاب</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending" data-testid="tab-pending">قيد المراجعة</TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">معتمدون</TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">مرفوضون</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">الكل</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
            </div>
          ) : !authors || authors.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">لا يوجد كتّاب في هذه الفئة</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {authors.map((a) => (
                <AuthorRow key={a.id} author={a} onAction={(id, action, notes) => actionMutation.mutate({ id, action, notes })} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
