import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowRight, Users, Shield, UserPlus, Edit2, 
  UserCheck, UserX, Search, Crown, Newspaper,
  Eye, PenSquare, LayoutDashboard, BookOpen, Download,
  Settings, Radar, MessageSquare, Activity, Utensils,
  BarChart3, LogOut, Menu, ChevronLeft
} from "lucide-react";
import type { User, UserRole } from "@shared/schema";
import { roleLabelsAr, userRoleEnum } from "@shared/schema";
import logoImage from "@assets/LOGO-L_1769253692563.png";

const roleColors: Record<string, string> = {
  super_admin: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
  editor_in_chief: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200",
  managing_editor: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  senior_editor: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  editor: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200",
  journalist: "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200",
  reviewer: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200",
  contributor: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
  subscriber: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200",
};

const roleIcons: Record<string, any> = {
  super_admin: Crown,
  editor_in_chief: Shield,
  managing_editor: Users,
  senior_editor: PenSquare,
  editor: Edit2,
  journalist: Newspaper,
  reviewer: Eye,
  contributor: UserPlus,
  subscriber: UserCheck,
};

const rolePermissionsDesc: Record<string, string[]> = {
  super_admin: [
    "إدارة جميع المستخدمين والأدوار",
    "إدارة إعدادات النظام",
    "جميع صلاحيات المحتوى",
    "الوصول الكامل للنظام"
  ],
  editor_in_chief: [
    "إدارة فريق التحرير",
    "نشر وجدولة الأخبار",
    "تمييز الأخبار المهمة",
    "استيراد المحتوى"
  ],
  managing_editor: [
    "نشر وجدولة الأخبار",
    "تمييز الأخبار المهمة",
    "عرض الإحصائيات",
    "إدارة الوسائط"
  ],
  senior_editor: [
    "نشر الأخبار",
    "جدولة الأخبار",
    "عرض جميع الأخبار",
    "إدارة الوسائط"
  ],
  editor: [
    "كتابة الأخبار",
    "تعديل أخباره فقط",
    "عرض جميع الأخبار",
    "رفع الوسائط"
  ],
  journalist: [
    "كتابة الأخبار",
    "تعديل أخباره فقط",
    "عرض أخباره فقط"
  ],
  reviewer: [
    "عرض جميع الأخبار",
    "إضافة ملاحظات المراجعة"
  ],
  contributor: [
    "كتابة المقالات",
    "تعديل مقالاته فقط"
  ],
  subscriber: [
    "قراءة الأخبار المنشورة فقط"
  ]
};

function SidebarItem({ icon: Icon, label, active, count, onClick }: { icon: any; label: string; active?: boolean; count?: number | string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
        active 
          ? 'bg-primary text-primary-foreground' 
          : 'hover-elevate text-muted-foreground hover:text-foreground'
      }`}
    >
      {count !== undefined && (
        <Badge variant={active ? "secondary" : "outline"} className="text-xs min-w-[28px] justify-center">
          {count}
        </Badge>
      )}
      <span className="flex-1 text-right">{label}</span>
      <Icon className="h-5 w-5" />
    </button>
  );
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "تم تحديث الدور بنجاح" });
      setEditingUser(null);
    },
    onError: () => {
      toast({ title: "حدث خطأ", variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "تم تحديث الحالة بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ", variant: "destructive" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, firstName, lastName, email }: { userId: string; firstName: string; lastName: string; email: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/profile`, { firstName, lastName, email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "تم تحديث البيانات بنجاح" });
      setEditingUser(null);
    },
    onError: () => {
      toast({ title: "حدث خطأ", variant: "destructive" });
    },
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !selectedRole || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    const d = new Date(date);
    return d.toLocaleDateString('ar-EG-u-nu-latn', { 
      timeZone: 'Asia/Riyadh',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      calendar: 'gregory'
    });
  };

  const navigateTo = (section: string) => {
    setSidebarOpen(false);
    if (section === 'users') return;
    if (section === 'radar') {
      setLocation('/admin/radar');
    } else {
      setLocation(`/admin${section === 'dashboard' ? '' : '/' + section}`);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout");
      localStorage.removeItem("adminAuthenticated");
      setLocation("/admin/login");
    } catch (error) {
      toast({ title: "حدث خطأ أثناء تسجيل الخروج", variant: "destructive" });
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="كبسولة" className="h-10" />
          <div>
            <h2 className="font-bold text-sm">لوحة التحكم</h2>
            <p className="text-xs text-muted-foreground">إدارة النظام</p>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="الرئيسية" onClick={() => navigateTo('dashboard')} />
          <SidebarItem icon={Newspaper} label="الأخبار" onClick={() => navigateTo('news')} />
          <SidebarItem icon={BookOpen} label="المقالات" onClick={() => navigateTo('articles')} />
          <SidebarItem icon={Download} label="استيراد WordPress" onClick={() => navigateTo('import')} />
          <SidebarItem icon={Settings} label="التصنيفات" onClick={() => navigateTo('categories')} />
          <SidebarItem icon={Users} label="المستخدمين" active onClick={() => navigateTo('users')} />
          <SidebarItem icon={Shield} label="الحسابات الإدارية" onClick={() => setLocation('/admin/accounts')} />
          <SidebarItem icon={Radar} label="رادار الأخبار" onClick={() => navigateTo('radar')} />
          <SidebarItem icon={MessageSquare} label="المحادثات" count="89" />
          <SidebarItem icon={Activity} label="التتبع الصحي" />
          <SidebarItem icon={Utensils} label="التغذية" />
          <SidebarItem icon={BarChart3} label="الإحصائيات" />
          <SidebarItem icon={Settings} label="الإعدادات" />
        </nav>
      </ScrollArea>
      
      <div className="p-3 border-t mt-auto">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          onClick={handleLogout}
          data-testid="button-admin-logout"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30 overflow-x-hidden w-full max-w-full" dir="rtl">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card border-b px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0 flex flex-col">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <img src={logoImage} alt="كبسولة" className="h-7 shrink-0" />
          <span className="text-sm font-bold text-primary truncate">إدارة المستخدمين</span>
        </div>
        <Link href="/">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      <div className="flex w-full max-w-full">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 min-h-screen bg-card border-l fixed right-0 top-0 z-40 flex-col">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:mr-64 p-3 md:p-6 w-full max-w-full overflow-x-hidden">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/admin" className="hover:text-primary">لوحة التحكم</Link>
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>إدارة المستخدمين</span>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">إدارة المستخدمين والأدوار</h1>
                <p className="text-muted-foreground">إدارة فريق العمل وصلاحياتهم</p>
              </div>
            </div>
          </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">المستخدمين النشطين</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users?.filter(u => u.isActive).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">المحررين</CardTitle>
              <Edit2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {users?.filter(u => 
                  ["editor_in_chief", "managing_editor", "senior_editor", "editor"].includes(u.role || "")
                ).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              دليل الأدوار والصلاحيات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userRoleEnum.map((role) => {
                const Icon = roleIcons[role] || UserCheck;
                return (
                  <div key={role} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                      <Badge className={roleColors[role]}>
                        {roleLabelsAr[role as UserRole]}
                      </Badge>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {rolePermissionsDesc[role]?.map((perm, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {perm}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <CardTitle>قائمة المستخدمين</CardTitle>
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 w-full md:w-64"
                    data-testid="input-search-users"
                  />
                </div>
                <Select value={selectedRole || "all"} onValueChange={(val) => setSelectedRole(val === "all" ? "" : val)}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-filter-role">
                    <SelectValue placeholder="جميع الأدوار" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأدوار</SelectItem>
                    {userRoleEnum.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabelsAr[role as UserRole]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => {
                    const Icon = roleIcons[user.role || "subscriber"] || UserCheck;
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {user.profileImageUrl ? (
                              <img 
                                src={user.profileImageUrl} 
                                alt="" 
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                {user.firstName} {user.lastName}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={roleColors[user.role || "subscriber"]}>
                            {roleLabelsAr[user.role as UserRole] || "مشترك"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                              نشط
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                              معطل
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingUser(user);
                                    setNewRole(user.role || "subscriber");
                                    setEditFirstName(user.firstName || "");
                                    setEditLastName(user.lastName || "");
                                    setEditEmail(user.email || "");
                                  }}
                                  data-testid={`button-edit-user-${user.id}`}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent dir="rtl">
                                <DialogHeader>
                                  <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                      <Icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-lg">
                                        {user.firstName} {user.lastName}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                      <Label>الاسم الأول</Label>
                                      <Input
                                        value={editFirstName}
                                        onChange={(e) => setEditFirstName(e.target.value)}
                                        placeholder="الاسم الأول"
                                        data-testid="input-edit-first-name"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>الاسم الأخير</Label>
                                      <Input
                                        value={editLastName}
                                        onChange={(e) => setEditLastName(e.target.value)}
                                        placeholder="الاسم الأخير"
                                        data-testid="input-edit-last-name"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label>البريد الإلكتروني</Label>
                                    <Input
                                      type="email"
                                      value={editEmail}
                                      onChange={(e) => setEditEmail(e.target.value)}
                                      placeholder="example@email.com"
                                      dir="ltr"
                                      className="text-left"
                                      data-testid="input-edit-email"
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label>الدور</Label>
                                    <Select value={newRole} onValueChange={setNewRole}>
                                      <SelectTrigger data-testid="select-new-role">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {userRoleEnum.map((role) => (
                                          <SelectItem key={role} value={role}>
                                            {roleLabelsAr[role as UserRole]}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="flex gap-2 pt-2">
                                    <Button 
                                      className="flex-1"
                                      onClick={() => {
                                        if (editingUser) {
                                          updateProfileMutation.mutate({
                                            userId: editingUser.id,
                                            firstName: editFirstName,
                                            lastName: editLastName,
                                            email: editEmail
                                          });
                                          if (newRole !== editingUser.role) {
                                            updateRoleMutation.mutate({
                                              userId: editingUser.id,
                                              role: newRole
                                            });
                                          }
                                        }
                                      }}
                                      disabled={updateProfileMutation.isPending || updateRoleMutation.isPending}
                                      data-testid="button-save-user"
                                    >
                                      {updateProfileMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleStatusMutation.mutate({
                                userId: user.id,
                                isActive: !user.isActive
                              })}
                              data-testid={`button-toggle-status-${user.id}`}
                            >
                              {user.isActive ? (
                                <UserX className="w-4 h-4 text-red-500" />
                              ) : (
                                <UserCheck className="w-4 h-4 text-green-500" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        </main>
      </div>
    </div>
  );
}
