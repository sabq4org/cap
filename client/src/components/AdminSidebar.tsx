import { useLocation } from "wouter";
import {
  LayoutDashboard, Users, Newspaper, BookOpen, MessageSquare,
  Activity, Utensils, Settings, BarChart3, Download, Radar, Wand2, LayoutTemplate, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import logoImage from "@assets/LOGO-L_1769253692563.png";

interface AdminSidebarProps {
  activeRoute?: string;
}

function SidebarItem({ icon: Icon, label, active, count, onClick }: { 
  icon: any; 
  label: string; 
  active?: boolean; 
  count?: number | string; 
  onClick?: () => void;
}) {
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

export default function AdminSidebar({ activeRoute }: AdminSidebarProps) {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    setLocation("/admin");
  };

  const navigateTo = (route: string) => {
    setLocation(route);
  };

  return (
    <aside className="w-64 border-l bg-card flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="كبسولة" className="h-10 w-auto" />
          <div>
            <h2 className="font-bold text-lg">كبسولة</h2>
            <p className="text-xs text-muted-foreground">لوحة الإدارة</p>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-1">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="الرئيسية" 
            active={activeRoute === '/admin/dashboard'} 
            onClick={() => navigateTo('/admin/dashboard')} 
          />
          <SidebarItem 
            icon={Newspaper} 
            label="الأخبار" 
            active={activeRoute === '/admin/news'} 
            onClick={() => navigateTo('/admin/dashboard')} 
          />
          <SidebarItem 
            icon={BookOpen} 
            label="المقالات" 
            active={activeRoute === '/admin/articles'} 
            onClick={() => navigateTo('/admin/dashboard')} 
          />
          <SidebarItem 
            icon={Download} 
            label="استيراد WordPress" 
            active={activeRoute === '/admin/import'} 
            onClick={() => navigateTo('/admin/dashboard')} 
          />
          <SidebarItem 
            icon={Settings} 
            label="التصنيفات" 
            active={activeRoute === '/admin/categories'} 
            onClick={() => navigateTo('/admin/dashboard')} 
          />
          <SidebarItem 
            icon={Users} 
            label="المستخدمين" 
            active={activeRoute === '/admin/users'} 
            onClick={() => navigateTo('/admin/users')} 
          />
          <SidebarItem 
            icon={Radar} 
            label="رادار الأخبار" 
            active={activeRoute === '/admin/radar'} 
            onClick={() => navigateTo('/admin/radar')} 
          />
          <SidebarItem 
            icon={LayoutTemplate} 
            label="توليد إنفوجرافيك" 
            active={activeRoute === '/admin/infographic'} 
            onClick={() => navigateTo('/admin/infographic')} 
          />
          <SidebarItem 
            icon={Wand2} 
            label="إعدادات التوليد" 
            active={activeRoute === '/admin/generation-settings'} 
            onClick={() => navigateTo('/admin/generation-settings')} 
          />
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
    </aside>
  );
}
