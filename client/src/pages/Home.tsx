import { useArticles } from "@/hooks/use-articles";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/components/ArticleCard";
import { ArrowRight, Activity, MessageSquare, ShieldCheck, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: featuredArticles, isLoading } = useArticles({ featured: true, limit: 3 });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-secondary/30 py-20 lg:py-32">
        <div className="container relative z-10 px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                The Future of Personal Health
              </div>
              <h1 className="text-4xl font-display font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 text-foreground">
                Your Health Journey Starts Here
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Capsulah empowers you with trusted medical information, AI-driven symptom checking, and smart tools to manage your well-being.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" className="shadow-lg shadow-primary/25" asChild>
                   <Link href="/tools">Try Health Tools</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                   <Link href="/articles">Read Articles</Link>
                </Button>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative hidden lg:block"
            >
               {/* Hero Image */}
               {/* medical professional tablet consultation */}
               <img 
                 src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1000" 
                 alt="Doctor using digital tablet" 
                 className="rounded-2xl shadow-2xl ring-1 ring-border object-cover h-[500px] w-full"
               />
               
               {/* Floating Card Element */}
               <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-border max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                  <div className="flex items-center gap-3">
                     <div className="bg-green-100 p-2 rounded-full">
                        <ShieldCheck className="h-6 w-6 text-green-600" />
                     </div>
                     <div>
                        <p className="font-bold text-sm">Verified Content</p>
                        <p className="text-xs text-muted-foreground">Reviewed by professionals</p>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
        
        {/* Background Decorations */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl z-0 pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-secondary blur-3xl z-0 pointer-events-none" />
      </section>

      {/* Features Grid */}
      <section className="container py-20 px-4 md:px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-display font-bold tracking-tight">Comprehensive Health Tools</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to monitor, understand, and improve your health in one place.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { 
               icon: <Stethoscope className="h-8 w-8 text-primary" />, 
               title: "Symptom Checker", 
               desc: "Identify potential causes for your symptoms with our step-by-step wizard.",
               link: "/tools"
             },
             { 
               icon: <Activity className="h-8 w-8 text-accent" />, 
               title: "Health Tracker", 
               desc: "Log vital signs, nutrition, and daily habits to visualize your progress.",
               link: "/tools"
             },
             { 
               icon: <MessageSquare className="h-8 w-8 text-blue-500" />, 
               title: "AI Assistant", 
               desc: "Get instant answers to your general health questions 24/7.",
               link: "/chat"
             }
           ].map((feature, i) => (
             <Link key={i} href={feature.link} className="block group">
               <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                 <div className="bg-muted w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                   {feature.icon}
                 </div>
                 <h3 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                 <p className="text-muted-foreground leading-relaxed">
                   {feature.desc}
                 </p>
               </div>
             </Link>
           ))}
        </div>
      </section>

      {/* Featured Articles */}
      <section className="bg-muted/30 py-20">
         <div className="container px-4 md:px-6">
            <div className="flex items-center justify-between mb-10">
               <h2 className="text-3xl font-display font-bold">Latest Health Insights</h2>
               <Button variant="ghost" className="text-primary hover:bg-primary/5" asChild>
                 <Link href="/articles">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
               </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              ) : (
                featuredArticles?.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))
              )}
            </div>
         </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="container px-4 text-center relative z-10">
           <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Take Control of Your Health Today</h2>
           <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8 text-lg">
             Join thousands of users who are making better health decisions with Capsulah.
           </p>
           <Button size="lg" variant="secondary" className="font-bold text-primary" asChild>
             <a href="/api/login">Sign Up Now</a>
           </Button>
        </div>
        {/* Abstract shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
           <div className="absolute -top-[50%] -left-[10%] w-[50%] h-[150%] bg-white rounded-full mix-blend-overlay blur-3xl" />
           <div className="absolute top-[20%] right-[10%] w-[20%] h-[50%] bg-white rounded-full mix-blend-overlay blur-3xl" />
        </div>
      </section>
    </div>
  );
}
