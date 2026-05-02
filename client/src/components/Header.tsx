import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Heart, User, Home, Newspaper, Apple, Activity, Settings, LogOut, Sparkles, MapPin, Users, FileText, Calendar, HeartPulse, Salad, ChevronDown, LayoutDashboard, ShieldCheck, Search, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoImage from "@assets/LOGO-L_1769253692563.png";

const categories = [
  { label: "أخبار صحية", icon: Newspaper, color: "text-green-600", path: "/news?category=health-news" },
  { label: "صحة السعودية", icon: MapPin, color: "text-emerald-600", path: "/news?category=saudi-health" },
  { label: "المجتمع الصحي", icon: Users, color: "text-blue-600", path: "/news?category=health-community" },
  { label: "تقارير صحية", icon: FileText, color: "text-purple-600", path: "/news?category=health-reports" },
  { label: "فعاليات صحية", icon: Calendar, color: "text-orange-600", path: "/news?category=health-events" },
  { label: "جودة حياة", icon: HeartPulse, color: "text-teal-600", path: "/news?category=quality-life" },
  { label: "تغذية", icon: Salad, color: "text-lime-600", path: "/news?category=nutrition" },
  { label: "منوعات", icon: Sparkles, color: "text-gray-600", path: "/news?category=misc" },
];

export default function Header() {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (q) {
      setLocation(`/news?q=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setSearchTerm("");
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearchOpen(false);
      setSearchTerm("");
    }
  };

  const navItems = isAuthenticated ? [
    { label: "الرئيسية", path: "/", icon: Home, activePaths: ["/"] },
    { label: "الأخبار", path: "/news", icon: Newspaper, activePaths: ["/news"] },
    { label: "بوابتي الصحية", path: "/portal", icon: LayoutDashboard, activePaths: ["/portal"] },
    { label: "المساعد الصحي", path: "/assistant", icon: Heart, activePaths: ["/assistant"] },
    { label: "التغذية", path: "/nutrition", icon: Apple, activePaths: ["/nutrition"] },
    { label: "ملفي الصحي", path: "/profile", icon: Activity, activePaths: ["/profile"] },
  ] : [
    { label: "الرئيسية", path: "/", icon: Home, activePaths: ["/"] },
    { label: "الأخبار", path: "/news", icon: Newspaper, activePaths: ["/news"] },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-lg px-3 py-2 transition-colors" data-testid="link-home">
          <img src={logoImage} alt="كبسولة" className="h-12 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-1" data-testid="nav-desktop">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.activePaths.includes(location);
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="gap-2"
                  data-testid={`link-${item.label}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2" data-testid="button-categories">
                <Sparkles className="h-4 w-4 text-primary" />
                الأقسام
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>استكشف الأقسام</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="grid grid-cols-2 gap-1 p-2">
                {categories.map((cat) => {
                  const CatIcon = cat.icon;
                  return (
                    <Link key={cat.label} href={cat.path}>
                      <DropdownMenuItem className="flex flex-col items-center gap-1 p-3 cursor-pointer hover-elevate rounded-lg" data-testid={`link-category-${cat.label}`}>
                        <div className={`p-2 rounded-full bg-muted ${cat.color}`}>
                          <CatIcon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium">{cat.label}</span>
                      </DropdownMenuItem>
                    </Link>
                  );
                })}
              </div>
              <DropdownMenuSeparator />
              <Link href="/ask-capsule">
                <DropdownMenuItem className="flex items-center justify-center gap-2 py-2 cursor-pointer text-violet-700 dark:text-violet-400 font-medium hover:bg-violet-50 dark:hover:bg-violet-950/30" data-testid="link-ask-capsule-dropdown">
                  <FlaskConical className="h-4 w-4" />
                  اسأل كبسولة - مفنّد الشائعات
                </DropdownMenuItem>
              </Link>
              <Link href="/news">
                <DropdownMenuItem className="justify-center text-primary font-medium cursor-pointer" data-testid="link-all-categories">
                  عرض جميع الأخبار
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-2">
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="ابحث في الأخبار..."
                className="h-9 w-48 md:w-64 rounded-md border border-input bg-background px-3 text-sm outline-none ring-primary focus:ring-2 transition-all"
                data-testid="input-header-search"
              />
              <Button type="submit" size="icon" variant="ghost" className="shrink-0" data-testid="button-header-search-submit">
                <Search className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="shrink-0" onClick={() => { setSearchOpen(false); setSearchTerm(""); }} data-testid="button-header-search-close">
                <X className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} data-testid="button-header-search">
              <Search className="h-5 w-5" />
            </Button>
          )}
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              {user?.id === "admin" && (
                <Link href="/admin/dashboard">
                  <Button variant="default" size="sm" className="hidden md:flex gap-2 bg-emerald-700 hover:bg-emerald-800 text-white" data-testid="button-admin-dashboard">
                    <ShieldCheck className="h-4 w-4" />
                    لوحة التحكم
                  </Button>
                </Link>
              )}
              <Button variant="outline" className="hidden md:flex gap-2" data-testid="button-profile">
                <User className="h-4 w-4" />
                {user?.firstName || user?.email || "حسابي"}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden md:flex" 
                onClick={() => window.location.href = "/api/logout"}
                data-testid="button-logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" data-testid="button-login-header">
                  تسجيل الدخول
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="default" data-testid="button-register-header">
                  إنشاء حساب
                </Button>
              </Link>
            </div>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" data-testid="button-menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-4 py-6">
                <div className="flex items-center gap-3 px-2 pb-4 border-b">
                  <img src={logoImage} alt="كبسولة" className="h-10 w-auto" />
                </div>
                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.activePaths.includes(location);
                    return (
                      <Link key={item.path} href={item.path}>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className="w-full justify-start gap-3"
                          onClick={() => setMobileOpen(false)}
                          data-testid={`link-mobile-${item.label}`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                </nav>
                
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center gap-2 px-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">الأقسام</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {categories.map((cat) => {
                      const CatIcon = cat.icon;
                      return (
                        <Link key={cat.label} href={cat.path}>
                          <button
                            onClick={() => setMobileOpen(false)}
                            className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover-elevate w-full"
                            data-testid={`link-mobile-category-${cat.label}`}
                          >
                            <div className={`p-1.5 rounded-full bg-muted ${cat.color}`}>
                              <CatIcon className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-[10px] text-center leading-tight">{cat.label}</span>
                          </button>
                        </Link>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-2 border-t pt-3">
                  <Link href="/ask-capsule">
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                      data-testid="link-mobile-ask-capsule"
                    >
                      <FlaskConical className="h-4 w-4" />
                      اسأل كبسولة - مفنّد الشائعات
                    </button>
                  </Link>
                </div>
                <div className="mt-2 flex flex-col gap-2 border-t pt-4">
                  {isAuthenticated ? (
                    <>
                      {user?.id === "admin" && (
                        <Link href="/admin/dashboard" onClick={() => setMobileOpen(false)}>
                          <Button variant="default" className="w-full gap-2 bg-emerald-700 hover:bg-emerald-800 text-white" data-testid="button-mobile-admin">
                            <ShieldCheck className="h-4 w-4" />
                            لوحة التحكم
                          </Button>
                        </Link>
                      )}
                      <Button variant="outline" className="w-full gap-2" data-testid="button-mobile-profile">
                        <User className="h-4 w-4" />
                        {user?.firstName || user?.email || "حسابي"}
                      </Button>
                      <Button variant="ghost" className="w-full gap-2" data-testid="button-mobile-settings">
                        <Settings className="h-4 w-4" />
                        الإعدادات
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full gap-2" 
                        onClick={() => window.location.href = "/api/logout"}
                        data-testid="button-mobile-logout"
                      >
                        <LogOut className="h-4 w-4" />
                        تسجيل الخروج
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        <Button variant="outline" className="w-full" data-testid="button-mobile-login">
                          تسجيل الدخول
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setMobileOpen(false)}>
                        <Button variant="default" className="w-full" data-testid="button-mobile-register">
                          إنشاء حساب جديد
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
