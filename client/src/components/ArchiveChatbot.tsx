import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, ExternalLink, BookOpen, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";

interface Source {
  title: string;
  url: string;
  type: "news" | "article";
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  foundInArchive?: boolean;
}

const SESSION_STORAGE_KEY = "capsulah_archive_chat_messages";

const SUGGESTED_QUESTIONS = [
  "ما آخر أخبار الصحة السعودية؟",
  "لخّص لي مقالاً عن السكري",
  "ما أعراض ارتفاع ضغط الدم؟",
  "ما فوائد التغذية الصحية للقلب؟",
];

function loadSessionMessages(): Message[] {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Message[];
  } catch {
    // ignore parse errors
  }
  return [];
}

function saveSessionMessages(msgs: Message[]) {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(msgs));
  } catch {
    // ignore storage quota errors
  }
}

export default function ArchiveChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => loadSessionMessages());
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome: Message = {
        id: "welcome",
        role: "assistant",
        content:
          "مرحباً! أنا مساعد كبسولة 👋\n\nيمكنني الإجابة عن أسئلتك من أرشيف موقع كبسولة الصحي. اسألني عن آخر الأخبار الصحية، أو ابحث عن موضوع طبي معين، أو اطلب تلخيص مقال.",
        sources: [],
      };
      const initial = [welcome];
      setMessages(initial);
      saveSessionMessages(initial);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    setInput("");

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };

    const withUser = [...messages, userMsg];
    setMessages(withUser);
    saveSessionMessages(withUser);
    setIsLoading(true);

    try {
      const data = await apiRequest("POST", "/api/assistant/chat", {
        message: text,
      });
      const result = await data.json();

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: result.answer,
        sources: result.sources || [],
        foundInArchive: result.foundInArchive,
      };

      const withAssistant = [...withUser, assistantMsg];
      setMessages(withAssistant);
      saveSessionMessages(withAssistant);
    } catch {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.",
        sources: [],
      };
      const withErr = [...withUser, errMsg];
      setMessages(withErr);
      saveSessionMessages(withErr);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    if (isOpen) {
      const welcome: Message = {
        id: "welcome",
        role: "assistant",
        content:
          "مرحباً! أنا مساعد كبسولة 👋\n\nيمكنني الإجابة عن أسئلتك من أرشيف موقع كبسولة الصحي. اسألني عن آخر الأخبار الصحية، أو ابحث عن موضوع طبي معين، أو اطلب تلخيص مقال.",
        sources: [],
      };
      setMessages([welcome]);
      saveSessionMessages([welcome]);
    } else {
      setMessages([]);
    }
  };

  return (
    <>
      <button
        data-testid="button-archive-chatbot-toggle"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg px-4 py-3 transition-all duration-200 hover:scale-105"
        aria-label="مساعد كبسولة"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
        <span className="text-sm font-medium hidden sm:inline">مساعد كبسولة</span>
      </button>

      {isOpen && (
        <div
          data-testid="panel-archive-chatbot"
          className="fixed bottom-20 left-6 z-50 w-[22rem] sm:w-[26rem] max-h-[75vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          dir="rtl"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white">
            <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">مساعد كبسولة</p>
              <p className="text-xs text-emerald-100">يجيب من أرشيف الموقع</p>
            </div>
            <button
              data-testid="button-archive-chatbot-clear"
              onClick={clearHistory}
              title="مسح المحادثة"
              className="p-1 rounded hover:bg-white/20 transition-colors text-xs opacity-70 hover:opacity-100"
            >
              مسح
            </button>
            <button
              data-testid="button-archive-chatbot-close"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-white/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((msg) => (
              <div
                key={msg.id}
                data-testid={`msg-${msg.role}-${msg.id}`}
                className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"
                  }`}
                >
                  {msg.content}

                  {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        المصادر:
                      </p>
                      <div className="space-y-1.5">
                        {msg.sources.map((src, i) => (
                          <a
                            key={i}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid={`link-source-${i}`}
                            className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                          >
                            {src.type === "article" ? (
                              <BookOpen className="h-3 w-3 shrink-0" />
                            ) : (
                              <Newspaper className="h-3 w-3 shrink-0" />
                            )}
                            <span className="line-clamp-1">{src.title}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 ml-auto" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.role === "assistant" &&
                    msg.foundInArchive === false &&
                    (!msg.sources || msg.sources.length === 0) && (
                      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 italic">
                        لم يتم العثور على محتوى ذي صلة في الأرشيف
                      </p>
                    )}
                </div>
              </div>
            ))}

            {messages.length === 1 && messages[0].id === "welcome" && (
              <div className="flex flex-col gap-2 mt-1">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    data-testid={`button-suggestion-${i}`}
                    onClick={() => sendMessage(q)}
                    disabled={isLoading}
                    className="text-right text-sm px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="flex justify-end">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                data-testid="input-archive-chatbot"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اسأل عن أي موضوع صحي..."
                className="flex-1 min-h-[40px] max-h-[120px] resize-none text-sm rounded-xl border-gray-200 dark:border-gray-700 focus:ring-emerald-500 text-right"
                rows={1}
                dir="rtl"
              />
              <Button
                data-testid="button-archive-chatbot-send"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-emerald-600 hover:bg-emerald-700 rounded-xl shrink-0 h-10 w-10"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
