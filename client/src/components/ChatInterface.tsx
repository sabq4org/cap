import { useState, useRef, useEffect } from "react";
import { useChatHistory, useSendMessage } from "@/hooks/use-health-tools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export function ChatInterface() {
  const { data: messages, isLoading: loadingHistory } = useChatHistory();
  const { mutate: sendMessage, isPending } = useSendMessage();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <Card className="flex flex-col h-[600px] border-none shadow-xl shadow-primary/5 ring-1 ring-border bg-white/50 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-4 border-b">
        <CardTitle className="flex items-center gap-2 font-display text-primary">
          <Bot className="h-6 w-6" />
          Dr. Capsulah AI <span className="text-xs font-normal text-muted-foreground ml-auto bg-white/50 px-2 py-1 rounded-full border">Beta</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 relative">
        <ScrollArea className="h-[460px] p-4">
           <div className="space-y-4" ref={scrollRef}>
             {/* Welcome Message */}
             <div className="flex gap-3">
               <Avatar className="h-8 w-8 bg-primary/10 border border-primary/20">
                 <AvatarFallback><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
               </Avatar>
               <div className="bg-muted p-3 rounded-lg rounded-tl-none text-sm max-w-[80%]">
                 Hello! I'm your AI health assistant. I can help answer general health questions, suggest lifestyle tips, or help you understand symptoms.
                 <br/><br/>
                 <span className="text-xs text-muted-foreground italic">Note: I am an AI, not a doctor. Always consult a professional for medical advice.</span>
               </div>
             </div>

             {messages?.map((msg) => (
               <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                 <Avatar className={`h-8 w-8 ${msg.sender === 'user' ? 'bg-blue-100' : 'bg-primary/10'}`}>
                   {msg.sender === 'user' ? (
                     <AvatarFallback>{user?.firstName?.[0] || <User className="h-4 w-4" />}</AvatarFallback>
                   ) : (
                     <AvatarFallback><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
                   )}
                 </Avatar>
                 <div className={`p-3 rounded-lg text-sm max-w-[80%] ${
                   msg.sender === 'user' 
                     ? 'bg-primary text-primary-foreground rounded-tr-none' 
                     : 'bg-muted rounded-tl-none'
                 }`}>
                   {msg.message}
                 </div>
               </div>
             ))}
             
             {isPending && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 bg-primary/10">
                    <AvatarFallback><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-muted p-3 rounded-lg rounded-tl-none text-sm flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                  </div>
                </div>
             )}
           </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t bg-background/50">
        <form onSubmit={handleSend} className="flex w-full gap-2">
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Ask a health question..." 
            className="flex-1 bg-white focus-visible:ring-primary"
            disabled={isPending}
          />
          <Button type="submit" size="icon" disabled={isPending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
