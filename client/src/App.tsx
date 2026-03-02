import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Articles from "@/pages/Articles";
import News from "@/pages/News";
import NewsDetail from "@/pages/NewsDetail";
import KeywordPage from "@/pages/KeywordPage";
import About from "@/pages/About";
import Privacy from "@/pages/Privacy";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminNewsCreate from "@/pages/AdminNewsCreate";
import AdminUsers from "@/pages/AdminUsers";
import AdminRadar from "@/pages/AdminRadar";
import AdminInfographic from "@/pages/AdminInfographic";
import AdminGenerationSettings from "@/pages/AdminGenerationSettings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/articles" component={Articles} />
      <Route path="/news" component={News} />
      <Route path="/news/:id" component={NewsDetail} />
      <Route path="/n/:shortCode" component={NewsDetail} />
      <Route path="/keyword/:keyword" component={KeywordPage} />
      <Route path="/about" component={About} />
      <Route path="/privacy" component={Privacy} />
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
      <Route path="/admin/radar" component={AdminRadar} />
      <Route path="/admin/infographic" component={AdminInfographic} />
      <Route path="/admin/generation-settings" component={AdminGenerationSettings} />
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
          </div>
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
