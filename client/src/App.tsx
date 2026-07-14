import { lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Critical public pages — keep eager for fast first paint
import Landing from "@/pages/Landing";
import News from "@/pages/News";
import NewsDetail from "@/pages/NewsDetail";
import AskCapsule from "@/pages/AskCapsule";
import NotFound from "@/pages/not-found";

// Heavy / secondary routes — code-split out of the initial bundle
const Home = lazy(() => import("@/pages/Home"));
const Assistant = lazy(() => import("@/pages/Assistant"));
const Nutrition = lazy(() => import("@/pages/Nutrition"));
const Profile = lazy(() => import("@/pages/Profile"));
const Articles = lazy(() => import("@/pages/Articles"));
const ArticleDetail = lazy(() => import("@/pages/ArticleDetail"));
const KeywordPage = lazy(() => import("@/pages/KeywordPage"));
const About = lazy(() => import("@/pages/About"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const RumorStatus = lazy(() => import("@/pages/RumorStatus"));
const Podcast = lazy(() => import("@/pages/Podcast"));
const Capsule = lazy(() => import("@/pages/Capsule"));
const Drugs = lazy(() => import("@/pages/Drugs"));
const Authors = lazy(() => import("@/pages/Authors"));
const AuthorProfile = lazy(() => import("@/pages/AuthorProfile"));
const AuthorRegister = lazy(() => import("@/pages/AuthorRegister"));
const WhatsAppSubscribe = lazy(() => import("@/pages/WhatsAppSubscribe"));
const ArchiveChatbot = lazy(() => import("@/components/ArchiveChatbot"));

const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const AdminAccounts = lazy(() => import("@/pages/AdminAccounts"));
const AdminRadar = lazy(() => import("@/pages/AdminRadar"));
const AdminInfographic = lazy(() => import("@/pages/AdminInfographic"));
const AdminGenerationSettings = lazy(() => import("@/pages/AdminGenerationSettings"));
const AdminCapsule = lazy(() => import("@/pages/AdminCapsule"));
const AdminTrends = lazy(() => import("@/pages/AdminTrends"));
const AdminWhatsApp = lazy(() => import("@/pages/AdminWhatsApp"));
const AdminRumors = lazy(() => import("@/pages/AdminRumors"));
const AdminPodcast = lazy(() => import("@/pages/AdminPodcast"));
const AdminAuthors = lazy(() => import("@/pages/AdminAuthors"));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  );
}

function isAuthGatedPath(path: string): boolean {
  return (
    path === "/portal" ||
    path === "/assistant" ||
    path === "/ask" ||
    path === "/profile" ||
    path === "/login" ||
    path === "/register"
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Don't block public pages (/, /news, …) on /api/auth/user
  if (isLoading && isAuthGatedPath(location)) {
    return <RouteFallback />;
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/portal">{isAuthenticated ? <Home /> : <Login />}</Route>
        <Route path="/assistant">{isAuthenticated ? <Assistant /> : <Login />}</Route>
        <Route path="/ask">{isAuthenticated ? <Assistant /> : <Login />}</Route>
        <Route path="/nutrition" component={Nutrition} />
        <Route path="/profile">{isAuthenticated ? <Profile /> : <Login />}</Route>
        <Route path="/capsule" component={Capsule} />
        <Route path="/articles" component={Articles} />
        <Route path="/articles/:slug" component={ArticleDetail} />
        <Route path="/news" component={News} />
        <Route path="/news/:id" component={NewsDetail} />
        <Route path="/n/:shortCode" component={NewsDetail} />
        <Route path="/keyword/:keyword" component={KeywordPage} />
        <Route path="/ask-capsule" component={AskCapsule} />
        <Route path="/drugs" component={Drugs} />
        <Route path="/authors" component={Authors} />
        <Route path="/authors/register" component={AuthorRegister} />
        <Route path="/authors/:slug" component={AuthorProfile} />
        <Route path="/whatsapp" component={WhatsAppSubscribe} />
        <Route path="/ask-capsule/status/:id" component={RumorStatus} />
        <Route path="/podcast" component={Podcast} />
        <Route path="/about" component={About} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/login">{isAuthenticated ? <Landing /> : <Login />}</Route>
        <Route path="/register">{isAuthenticated ? <Landing /> : <Register />}</Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AdminRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/admin" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/news" component={AdminDashboard} />
        <Route path="/admin/news/new" component={AdminDashboard} />
        <Route path="/admin/news/edit/:id" component={AdminDashboard} />
        <Route path="/admin/articles" component={AdminDashboard} />
        <Route path="/admin/articles/new" component={AdminDashboard} />
        <Route path="/admin/articles/edit/:id" component={AdminDashboard} />
        <Route path="/admin/import" component={AdminDashboard} />
        <Route path="/admin/categories" component={AdminDashboard} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/accounts" component={AdminAccounts} />
        <Route path="/admin/ads" component={AdminDashboard} />
        <Route path="/admin/radar" component={AdminRadar} />
        <Route path="/admin/infographic" component={AdminInfographic} />
        <Route path="/admin/generation-settings" component={AdminGenerationSettings} />
        <Route path="/admin/capsule" component={AdminCapsule} />
        <Route path="/admin/trends" component={AdminTrends} />
        <Route path="/admin/rumors" component={AdminRumors} />
        <Route path="/admin/whatsapp" component={AdminWhatsApp} />
        <Route path="/admin/podcast" component={AdminPodcast} />
        <Route path="/admin/authors" component={AdminAuthors} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {isAdminRoute ? (
          <AdminRouter />
        ) : (
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              <Router />
            </main>
            <Footer />
            <Suspense fallback={null}>
              <ArchiveChatbot />
            </Suspense>
          </div>
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
