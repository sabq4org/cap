// Blueprint: javascript_log_in_with_replit
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Assistant from "@/pages/Assistant";
import Nutrition from "@/pages/Nutrition";
import Profile from "@/pages/Profile";
import Articles from "@/pages/Articles";
import News from "@/pages/News";
import NewsDetail from "@/pages/NewsDetail";
import KeywordPage from "@/pages/KeywordPage";
import About from "@/pages/About";
import Privacy from "@/pages/Privacy";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsers from "@/pages/AdminUsers";
import AdminAccounts from "@/pages/AdminAccounts";
import AdminRadar from "@/pages/AdminRadar";
import AdminInfographic from "@/pages/AdminInfographic";
import AdminGenerationSettings from "@/pages/AdminGenerationSettings";
import AdminCapsule from "@/pages/AdminCapsule";
import AdminTrends from "@/pages/AdminTrends";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AskCapsule from "@/pages/AskCapsule";
import AdminRumors from "@/pages/AdminRumors";
import NotFound from "@/pages/not-found";
import ArchiveChatbot from "@/components/ArchiveChatbot";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/portal">{isAuthenticated ? <Home /> : <Login />}</Route>
      <Route path="/assistant">{isAuthenticated ? <Assistant /> : <Login />}</Route>
      <Route path="/nutrition" component={Nutrition} />
      <Route path="/profile">{isAuthenticated ? <Profile /> : <Login />}</Route>
      <Route path="/articles" component={Articles} />
      <Route path="/news" component={News} />
      <Route path="/news/:id" component={NewsDetail} />
      <Route path="/n/:shortCode" component={NewsDetail} />
      <Route path="/keyword/:keyword" component={KeywordPage} />
      <Route path="/ask-capsule" component={AskCapsule} />
      <Route path="/about" component={About} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/login">{isAuthenticated ? <Landing /> : <Login />}</Route>
      <Route path="/register">{isAuthenticated ? <Landing /> : <Register />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminRouter() {
  return (
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
    </Switch>
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
            <ArchiveChatbot />
          </div>
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
