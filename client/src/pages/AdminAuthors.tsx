import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  CheckCircle2, XCircle, Trash2, GraduationCap, Building2, Mail, Phone,
  ExternalLink, Eye, ChevronRight, UserPlus, Users
} from "lucide-react";
import { insertAuthorSchema, type Author, type InsertAuthor } from "@shared/schema";

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

function AddAuthorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const form = useForm<InsertAuthor>({
    resolver: zodResolver(insertAuthorSchema),
    defaultValues: {
      fullName: "", email: "", phone: "", bio: "", specialty: "",
      qualification: "", organization: "", profileImageUrl: "",
      twitterUrl: "", linkedinUrl: "", websiteUrl: "", credentialsImageUrl: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertAuthor) => {
      const cleaned = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === "" ? undefined : v])
      ) as InsertAuthor;
      return await apiRequest('POST', '/api/admin/authors', cleaned);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/authors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/authors'] });
      toast({ title: "تم إضافة الكاتب", description: "الكاتب معتمد وظاهر للعموم" });
      form.reset();
      onOpenChange(false);
    },
    onError: async (e: any) => {
      let msg = e.message || "فشل الإنشاء";
      try {
        const m = e.message?.match(/\{.*\}/);
        if (m) msg = JSON.parse(m[0]).message || msg;
      } catch {}
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة كاتب جديد</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>الاسم الكامل *</FormLabel><FormControl><Input {...field} data-testid="input-fullname" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>البريد الإلكتروني *</FormLabel><FormControl><Input type="email" {...field} dir="ltr" data-testid="input-email" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="specialty" render={({ field }) => (
                <FormItem><FormLabel>التخصص *</FormLabel><FormControl><Input {...field} placeholder="مثل: طب الأطفال" data-testid="input-specialty" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>الجوال</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" data-testid="input-phone" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="qualification" render={({ field }) => (
                <FormItem><FormLabel>المؤهل العلمي</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="مثل: دكتوراه في الطب" data-testid="input-qualification" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="organization" render={({ field }) => (
                <FormItem><FormLabel>جهة العمل</FormLabel><FormControl><Input {...field} value={field.value || ""} data-testid="input-organization" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="bio" render={({ field }) => (
              <FormItem><FormLabel>السيرة الذاتية * (20 حرف على الأقل)</FormLabel><FormControl><Textarea rows={4} {...field} data-testid="textarea-bio" /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="profileImageUrl" render={({ field }) => (
              <FormItem><FormLabel>رابط الصورة الشخصية</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" placeholder="https://..." data-testid="input-profile-image" /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid md:grid-cols-3 gap-4">
              <FormField control={form.control} name="twitterUrl" render={({ field }) => (
                <FormItem><FormLabel>تويتر/X</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" placeholder="https://x.com/..." data-testid="input-twitter" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
                <FormItem><FormLabel>لينكدإن</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" placeholder="https://linkedin.com/in/..." data-testid="input-linkedin" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="websiteUrl" render={({ field }) => (
                <FormItem><FormLabel>الموقع الشخصي</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" placeholder="https://..." data-testid="input-website" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="credentialsImageUrl" render={({ field }) => (
              <FormItem><FormLabel>رابط إثبات الانتساب المهني (سري)</FormLabel><FormControl><Input {...field} value={field.value || ""} dir="ltr" placeholder="https://..." data-testid="input-credentials" /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">إلغاء</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-author">
                {createMutation.isPending ? "جاري الحفظ..." : "إضافة واعتماد"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminAuthors() {
  const { toast } = useToast();
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [addOpen, setAddOpen] = useState(false);

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
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        {/* Admin-style header with back button */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back-dashboard">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary-foreground" />
                </div>
                إدارة الكتّاب
              </h1>
              <p className="text-sm text-muted-foreground mt-1">مراجعة طلبات الانضمام واعتماد الكتّاب وإضافة كتّاب جدد</p>
            </div>
          </div>
          <Button onClick={() => setAddOpen(true)} data-testid="button-open-add-author">
            <UserPlus className="h-4 w-4 ml-2" />
            إضافة كاتب جديد
          </Button>
        </div>

        <AddAuthorDialog open={addOpen} onOpenChange={setAddOpen} />

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
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                لا يوجد كتّاب في هذه الفئة
                {tab === 'approved' && (
                  <div className="mt-4">
                    <Button variant="outline" onClick={() => setAddOpen(true)} data-testid="button-add-first-author">
                      <UserPlus className="h-4 w-4 ml-2" />أضف أول كاتب
                    </Button>
                  </div>
                )}
              </CardContent></Card>
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
    </div>
  );
}
