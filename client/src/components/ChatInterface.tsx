import { useState, useEffect } from "react";
import { Send, Bot, User, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChatSession, ChatMessage } from "@shared/schema";

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Get or create chat session
  const { data: sessions } = useQuery<ChatSession[]>({
    queryKey: ["/api/chat/sessions"],
  });

  useEffect(() => {
    if (sessions && sessions.length > 0 && !sessionId) {
      setSessionId(sessions[0].id);
    }
  }, [sessions, sessionId]);

  // Create new session if none exists
  const createSession = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/chat/sessions", { title: "محادثة جديدة" });
      return await res.json() as ChatSession;
    },
    onSuccess: (session) => {
      setSessionId(session.id);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
    },
  });

  useEffect(() => {
    if (!sessions || sessions.length === 0) {
      createSession.mutate();
    }
  }, [sessions]);

  // Get messages for current session
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/sessions", sessionId, "messages"],
    enabled: !!sessionId,
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/chat/messages", { sessionId, content });
      return await res.json() as {
        userMessage: ChatMessage;
        assistantMessage: ChatMessage;
        tldr?: string;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/chat/sessions", sessionId, "messages"] 
      });
    },
  });

  const handleSend = () => {
    if (!input.trim() || !sessionId || sendMessage.isPending) return;
    sendMessage.mutate(input);
    setInput("");
  };

  return (
    <Card className="flex flex-col h-[600px] w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b p-4 bg-muted/30">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">المساعد الصحي الذكي</h3>
          <p className="text-sm text-muted-foreground">متصل ومستعد لمساعدتك</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4" dir="rtl">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="h-16 w-16 text-primary/40 mb-4" />
              <p className="text-lg text-muted-foreground">
                مرحباً! أنا مساعدك الصحي الذكي من كبسولة.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                كيف يمكنني مساعدتك اليوم؟
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  message.role === "user" ? "bg-secondary" : "bg-primary/10"
                }`}>
                  {message.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                </div>

                <div className={`flex flex-col gap-2 max-w-[80%] ${message.role === "user" ? "items-end" : ""}`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}>
                    <p className="text-base leading-relaxed">{message.content}</p>
                  </div>

                  {message.citations && message.citations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {message.citations.map((citation, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="gap-1 hover-elevate cursor-pointer"
                          data-testid={`citation-${idx}`}
                          onClick={() => window.open(citation.url, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {citation.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {sendMessage.isPending && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-muted">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !sendMessage.isPending && handleSend()}
            placeholder="اكتب سؤالك الصحي هنا..."
            className="flex-1 h-12 rounded-full text-base"
            data-testid="input-chat"
            disabled={sendMessage.isPending || !sessionId}
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="h-12 w-12 rounded-full shrink-0"
            data-testid="button-send"
            disabled={sendMessage.isPending || !sessionId || !input.trim()}
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          هذه معلومات عامة لا تغني عن استشارة طبية متخصصة
        </p>
      </div>
    </Card>
  );
}
