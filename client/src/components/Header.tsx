import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Menu,
  X,
  Heart,
  User,
  Home,
  Newspaper,
  Apple,
  Activity,
  Settings,
  LogOut,
  Sparkles,
  MapPin,
  Users,
  FileText,
  Calendar,
  HeartPulse,
  Salad,
  ChevronDown,
  ShieldCheck,
  Search,
  FlaskConical,
  Pill,
} from "lucide-react";
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
import { trackDebunkCta } from "@/lib/debunkCta";
import { cn } from "@/lib/utils";

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

  const navItems = isAuthenticated
    ? [
        { label: "الرئيسية", path: "/", icon: Home, activePaths: ["/"] },
        { label: "الأخبار", path: "/news", icon: Newspaper, activePaths: ["/news"] },
        { label: "جرعتك اليومية", path: "/capsule", icon: Pill, activePaths: ["/capsule"] },
        { label: "المساعد الصحي", path: "/assistant", icon: Heart, activePaths: ["/assistant"] },
        { label: "التغذية", path: "/nutrition", icon: Apple, activePaths: ["/nutrition"] },
        { label: "ملفي الصحي", path: "/profile", icon: Activity, activePaths: ["/profile"] },
      ]
    : [
        { label: "الرئيسية", path: "/", icon: Home, activePaths: ["/"] },
        { label: "الأخبار", path: "/news", icon: Newspaper, activePaths: ["/news"] },
      ];

  const isDebunkActive = location === "/ask-capsule";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3 px-4 md:gap-6 md:px-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex shrink-0 items-center rounded-lg px-1 py-1 transition-opacity hover:opacity-90"
          data-testid="link-home"
        >
          <img src={logoImage} alt="كبسولة" className="h-9 w-auto md:h-10" />
        </Link>

        {/* Center nav */}
        <nav
          className="hidden min-w-0 items-center justify-center gap-0.5 lg:flex"
          data-testid="nav-desktop"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.activePaths.includes(location);
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-1.5 px-2.5 text-sm font-medium",
                    isActive && "bg-secondary",
                  )}
                  data-testid={`link-${item.label}`}
                >
                  <Icon className="h-3.5 w-3.5 opacity-70" />
                  {item.label}
                </Button>
              </Link>
            );
          })}

          <Link href="/ask-capsule">
            <Button
              variant={isDebunkActive ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "gap-1.5 px-2.5 text-sm font-medium",
                !isDebunkActive && "text-primary",
              )}
              data-testid="link-debunk"
              onClick={() => trackDebunkCta()}
            >
              <FlaskConical className="h-3.5 w-3.5 opacity-70" />
              تفنيد الشائعات
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 px-2.5 text-sm font-medium"
                data-testid="button-categories"
              >
                الأقسام
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
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
                      <DropdownMenuItem
                        className="flex cursor-pointer flex-col items-center gap-1 rounded-lg p-3 hover-elevate"
                        data-testid={`link-category-${cat.label}`}
                      >
                        <div className={`rounded-full bg-muted p-2 ${cat.color}`}>
                          <CatIcon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium">{cat.label}</span>
                      </DropdownMenuItem>
                    </Link>
                  );
                })}
              </div>
              <DropdownMenuSeparator />
              <Link href="/drugs">
                <DropdownMenuItem
                  className="flex cursor-pointer items-center justify-center gap-2 py-2 font-medium text-primary hover:bg-primary/5"
                  data-testid="link-drugs-dropdown"
                >
                  <Pill className="h-4 w-4" />
                  موسوعة الأدوية
                </DropdownMenuItem>
              </Link>
              <Link href="/authors">
                <DropdownMenuItem
                  className="flex cursor-pointer items-center justify-center gap-2 py-2 font-medium text-primary hover:bg-primary/5"
                  data-testid="link-authors-dropdown"
                >
                  <Users className="h-4 w-4" />
                  كتّاب كبسولة
                </DropdownMenuItem>
              </Link>
              <Link href="/ask-capsule">
                <DropdownMenuItem
                  onClick={() => trackDebunkCta()}
                  className="flex cursor-pointer items-center justify-center gap-2 py-2 font-medium text-primary hover:bg-primary/5"
                  data-testid="link-ask-capsule-dropdown"
                >
                  <FlaskConical className="h-4 w-4" />
                  اسأل كبسولة - مفنّد الشائعات
                </DropdownMenuItem>
              </Link>
              <Link href="/news">
                <DropdownMenuItem
                  className="cursor-pointer justify-center font-medium text-primary"
                  data-testid="link-all-categories"
                >
                  عرض جميع الأخبار
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1 sm:gap-1.5">
          {searchOpen ? (
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-1"
            >
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="ابحث في الأخبار..."
                className="h-11 w-36 rounded-md border border-input bg-background px-3 text-sm outline-none ring-primary transition-all focus:ring-2 sm:w-48 md:w-56"
                data-testid="input-header-search"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="h-11 w-11 shrink-0"
                aria-label="تنفيذ البحث"
                data-testid="button-header-search-submit"
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-11 w-11 shrink-0"
                aria-label="إغلاق البحث"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchTerm("");
                }}
                data-testid="button-header-search-close"
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              aria-label="فتح البحث"
              onClick={() => setSearchOpen(true)}
              data-testid="button-header-search"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          <ThemeToggle />

          {isAuthenticated ? (
            <div className="hidden items-center gap-1 md:flex">
              {user?.id === "admin" && (
                <Link href="/admin/dashboard">
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800"
                    data-testid="button-admin-dashboard"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    لوحة التحكم
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                data-testid="button-profile"
              >
                <User className="h-4 w-4" />
                <span className="max-w-[7rem] truncate">
                  {user?.firstName || user?.email || "حسابي"}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                aria-label="تسجيل الخروج"
                onClick={() => (window.location.href = "/api/logout")}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 md:flex">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-3"
                  data-testid="button-login-header"
                >
                  تسجيل الدخول
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  variant="default"
                  size="sm"
                  className="px-3"
                  data-testid="button-register-header"
                >
                  إنشاء حساب
                </Button>
              </Link>
            </div>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                aria-label="فتح القائمة"
                data-testid="button-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-4 py-6">
                <div className="flex items-center gap-3 border-b px-2 pb-4">
                  <img src={logoImage} alt="كبسولة" className="h-9 w-auto" />
                </div>
                <nav className="flex flex-col gap-1">
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

                <Link href="/ask-capsule">
                  <Button
                    variant={isDebunkActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 text-primary"
                    onClick={() => {
                      trackDebunkCta();
                      setMobileOpen(false);
                    }}
                    data-testid="link-mobile-debunk"
                  >
                    <FlaskConical className="h-5 w-5" />
                    تفنيد الشائعات
                  </Button>
                </Link>

                <div className="mt-2 border-t pt-4">
                  <div className="mb-3 flex items-center gap-2 px-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">الأقسام</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {categories.map((cat) => {
                      const CatIcon = cat.icon;
                      return (
                        <Link key={cat.label} href={cat.path}>
                          <button
                            onClick={() => setMobileOpen(false)}
                            className="flex w-full flex-col items-center gap-1 rounded-lg p-1.5 hover-elevate"
                            data-testid={`link-mobile-category-${cat.label}`}
                          >
                            <div className={`rounded-full bg-muted p-1.5 ${cat.color}`}>
                              <CatIcon className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-center text-[10px] leading-tight">
                              {cat.label}
                            </span>
                          </button>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-2 border-t pt-3">
                  <Link href="/ask-capsule">
                    <button
                      onClick={() => {
                        trackDebunkCta();
                        setMobileOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
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
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setMobileOpen(false)}
                        >
                          <Button
                            variant="default"
                            className="w-full gap-2 bg-emerald-700 text-white hover:bg-emerald-800"
                            data-testid="button-mobile-admin"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            لوحة التحكم
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        data-testid="button-mobile-profile"
                      >
                        <User className="h-4 w-4" />
                        {user?.firstName || user?.email || "حسابي"}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full gap-2"
                        data-testid="button-mobile-settings"
                      >
                        <Settings className="h-4 w-4" />
                        الإعدادات
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full gap-2"
                        onClick={() => (window.location.href = "/api/logout")}
                        data-testid="button-mobile-logout"
                      >
                        <LogOut className="h-4 w-4" />
                        تسجيل الخروج
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        <Button
                          variant="outline"
                          className="w-full"
                          data-testid="button-mobile-login"
                        >
                          تسجيل الدخول
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setMobileOpen(false)}>
                        <Button
                          variant="default"
                          className="w-full"
                          data-testid="button-mobile-register"
                        >
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
