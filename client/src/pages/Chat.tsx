import { ChatInterface } from "@/components/ChatInterface";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export default function Chat() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="container py-12 px-4 md:px-6 min-h-[calc(100vh-64px)] flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-4">
           <h1 className="text-3xl font-display font-bold">Dr. Capsulah AI Assistant</h1>
           <p className="text-muted-foreground">
             Get instant answers to your health questions. Private, secure, and always available.
           </p>
        </div>

        {isAuthenticated ? (
           <ChatInterface />
        ) : (
          <Card className="text-center py-16 px-6">
            <div className="flex flex-col items-center gap-6">
              <div className="bg-primary/10 p-6 rounded-full">
                <Lock className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-display">Sign in to Chat</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  To ensure privacy and maintain a history of your conversations, please log in to access the AI assistant.
                </p>
              </div>
              <Button size="lg" asChild className="px-8 shadow-lg shadow-primary/20">
                <a href="/api/login">Log In Securely</a>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
