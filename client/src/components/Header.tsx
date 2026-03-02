import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Heart, Home, BookOpen, Newspaper, Sparkles, MapPin, Users, FileText, Calendar, HeartPulse, Salad, ChevronDown } from "lucide-react";
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
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "الرئيسية", path: "/", icon: Home },
    { label: "المقالات", path: "/articles", icon: BookOpen },
    { label: "الأخبار", path: "/news", icon: Newspaper },
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
            const isActive = location === item.path;
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
              <Link href="/news">
                <DropdownMenuItem className="justify-center text-primary font-medium cursor-pointer" data-testid="link-all-categories">
                  عرض جميع الأخبار
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

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
                    const isActive = location === item.path;
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
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
