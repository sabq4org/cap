import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  UserPlus, Shield, Trash2, Edit2, Key, CheckCircle2, XCircle,
  Users, LayoutDashboard, Newspaper, BookOpen, BarChart3,
  Radar, Settings, LogOut, MessageSquare, Utensils, Activity,
  Download, Menu,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logoImage from "@assets/LOGO-L_1769253692563.png";
import { adminPermissions, roleLabelsAr } from "@shared/schema";

const ALL_PERMISSIONS = adminPermissions;

const roleOptions = [
  { value: "editor_in_chief", label: "رئيس التحرير" },
  { value: "managing_editor", label: "مدير التحرير" },
  { value: "senior_editor", label: "محرر أول" },
  { value: "editor", label: "محرر" },
  { value: "journalist", label: "صحفي" },
];

const navItems = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/admin/news", label: "الأخبار", icon: Newspaper },
  { href: "/admin/articles", label: "المقالات", icon: BookOpen },
  { href: "/admin/radar", label: "رادار الأخبار", icon: Radar },
  { href: "/admin/wordpress", label: "WordPress", icon: Download },
  { href: "/admin/categories", label: "التصنيفات", icon: Settings },
  { href: "/admin/users", label: "المستخدمون", icon: Users },
  { href: "/admin/accounts", label: "الحسابات الإدارية", icon: Shield },
  { href: "/admin/infographic", label: "إنفوجرافيك", icon: Activity },
  { href: "/admin/analytics", label: "الإحصائيات", icon: BarChart3 },
];

interface AdminAccount {
  id: string;
  username: string;
  display_name: string;
  role: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

function AccountForm({
  initial,
  onSave,
  isPending,
}: {
  initial?: Partial<AdminAccount>;
  onSave: (data: any) => void;
  isPending: boolean;
}) {
  const [username, setUsername] = useState(initial?.username || "");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(initial?.display_name || "");
  const [role, setRole] = useState(initial?.role || "editor");
  const [perms, setPerms] = useState<string[]>(initial?.permissions || []);

  const togglePerm = (key: string) =>
    setPerms(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ username, password: password || undefined, displayName, role, permissions: perms });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>اسم المستخدم</Label>
          <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="editor1" required disabled={!!initial?.id} />
        </div>
        <div className="space-y-1">
          <Label>{initial?.id ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور"}</Label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required={!initial?.id} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>الاسم المعروض</Label>
        <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="محرر المحتوى" required />
      </div>
      <div className="space-y-1">
        <Label>الدور الوظيفي</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {roleOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>الصلاحيات</Label>
        <div className="grid grid-cols-1 gap-2 p-3 border rounded-lg bg-muted/30">
          {ALL_PERMISSIONS.map(p => (
            <div key={p.key} className="flex items-center gap-2">
              <Checkbox
                id={p.key}
                checked={perms.includes(p.key)}
                onCheckedChange={() => togglePerm(p.key)}
              />
              <label htmlFor={p.key} className="text-sm cursor-pointer">{p.label}</label>
            </div>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "جارٍ الحفظ..." : initial?.id ? "حفظ التعديلات" : "إنشاء الحساب"}
      </Button>
    </form>
  );
}

export default function AdminAccounts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editAccount, setEditAccount] = useState<AdminAccount | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data: accounts = [], isLoading } = useQuery<AdminAccount[]>({
    queryKey: ["/api/admin/accounts"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/accounts", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      toast({ title: "تم إنشاء الحساب بنجاح" });
      setCreateOpen(false);
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/admin/accounts/${id}`, data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      toast({ title: "تم تحديث الحساب" });
      setEditOpen(false);
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      toast({ title: "تم حذف الحساب" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const toggleActive = (acc: AdminAccount) =>
    updateMutation.mutate({ id: acc.id, isActive: !acc.is_active });

  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout");
    setLocation("/admin/login");
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <img src={logoImage} alt="كبسولة" className="h-10" />
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-auto">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${item.href === "/admin/accounts" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </div>
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t">
        <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start gap-2 text-muted-foreground">
          <LogOut className="h-4 w-4" />تسجيل الخروج
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background" dir="rtl">
      <aside className="hidden lg:flex w-56 border-l flex-col flex-shrink-0">
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="border-b px-4 py-3 flex items-center gap-3 flex-shrink-0 bg-background">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-56 p-0"><Sidebar /></SheetContent>
          </Sheet>
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="font-bold text-lg">الحسابات الإدارية</h1>
          <div className="mr-auto">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-create-account">
                  <UserPlus className="h-4 w-4" />إنشاء حساب
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إنشاء حساب إداري جديد</DialogTitle>
                </DialogHeader>
                <AccountForm onSave={data => createMutation.mutate(data)} isPending={createMutation.isPending} />
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="text-center py-20 text-muted-foreground">جارٍ التحميل...</div>
          ) : accounts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center space-y-3">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground">لا توجد حسابات إدارية بعد</p>
                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />إنشاء أول حساب
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {accounts.length} حساب إداري
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>اسم المستخدم</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>الصلاحيات</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map(acc => (
                      <TableRow key={acc.id} data-testid={`row-account-${acc.id}`}>
                        <TableCell className="font-medium">{acc.display_name}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">{acc.username}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {roleLabelsAr[acc.role as keyof typeof roleLabelsAr] || acc.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {acc.permissions.slice(0, 3).map(p => (
                              <Badge key={p} variant="secondary" className="text-xs">
                                {ALL_PERMISSIONS.find(ap => ap.key === p)?.label || p}
                              </Badge>
                            ))}
                            {acc.permissions.length > 3 && (
                              <Badge variant="secondary" className="text-xs">+{acc.permissions.length - 3}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={acc.is_active}
                              onCheckedChange={() => toggleActive(acc)}
                              className="scale-75"
                            />
                            {acc.is_active
                              ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                              : <XCircle className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => { setEditAccount(acc); setEditOpen(true); }}
                              data-testid={`button-edit-account-${acc.id}`}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm(`حذف حساب "${acc.display_name}"؟`))
                                  deleteMutation.mutate(acc.id);
                              }}
                              data-testid={`button-delete-account-${acc.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل حساب: {editAccount?.display_name}</DialogTitle>
          </DialogHeader>
          {editAccount && (
            <AccountForm
              initial={editAccount}
              onSave={data => updateMutation.mutate({ id: editAccount.id, ...data })}
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
