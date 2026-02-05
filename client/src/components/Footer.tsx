import { Link } from "wouter";
import { Pill, Facebook, Twitter, Instagram, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-primary/10 rounded-lg p-1.5 text-primary">
                <Pill className="h-6 w-6" />
              </div>
              <span className="font-display font-bold text-xl">Capsulah</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Empowering your health journey with trusted information, smart tools, and AI-driven insights. Your wellness, simplified.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Explore</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/articles" className="hover:text-primary transition-colors">Health News</Link></li>
              <li><Link href="/tools" className="hover:text-primary transition-colors">Symptom Checker</Link></li>
              <li><Link href="/tools" className="hover:text-primary transition-colors">Nutrition Tracker</Link></li>
              <li><Link href="/chat" className="hover:text-primary transition-colors">AI Assistant</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
             <h3 className="font-semibold mb-4 text-foreground">Connect</h3>
             <div className="flex space-x-4 text-muted-foreground">
               <a href="#" className="hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
               <a href="#" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
               <a href="#" className="hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
               <a href="#" className="hover:text-primary transition-colors"><Mail className="h-5 w-5" /></a>
             </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Capsulah Health. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
             <span className="hidden md:inline">Designed for better living.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
