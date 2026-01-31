import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Gem, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

type Message = { role: "user" | "model"; content: string };

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API;
const GEMINI_MODEL = "gemini-1.5-flash"; // Stable model alias
const CHAT_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

async function streamChat({
  messages,
  sessionToken,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  sessionToken: string;
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}) {
  try {
    if (!sessionToken) {
      throw new Error("Please sign in to use the chat assistant");
    }

    if (!GEMINI_API_KEY) {
      setTimeout(() => {
        onDelta("I am the RUBY Concierge. Gemini API key is not configured. Please check your .env file.");
        onDone();
      }, 1000);
      return;
    }

    // Move logic to "contents" for maximum compatibility
    const contents = [
      {
        role: "user",
        parts: [{ text: "Instructions: You are the RUBY Concierge, a helpful assistant for the RUBY network (AirForce Comprehensive School Yola Ex Airborne Alumni). You help alumni connect, find information about the association, and navigate the platform. Be professional, warm, and helpful. Keep responses concise and relevant to the alumni community." }]
      },
      {
        role: "model",
        parts: [{ text: "Understood. I am the RUBY Concierge, ready to assist our Ex Airborne alumni. How can I help you today?" }]
      },
      ...messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }))
    ];

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `Request failed: ${resp.status}`;
      throw new Error(errorMessage);
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let lineIndex;
      while ((lineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, lineIndex).trim();
        textBuffer = textBuffer.slice(lineIndex + 1);

        if (line.startsWith("data: ")) {
          try {
            const jsonStr = line.slice(6);
            const data = JSON.parse(jsonStr);
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) onDelta(content);
          } catch (e) {
            console.error("Error parsing SSE line:", e);
          }
        }
      }
    }

    onDone();
  } catch (error) {
    onError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

export function AIChatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading || !user) return;

    const userMsg: Message = { role: "user", content: trimmedInput };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "model") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "model", content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: [...messages, userMsg],
      sessionToken: user.id || 'demo-token',
      onDelta: (chunk) => upsertAssistant(chunk),
      onDone: () => setIsLoading(false),
      onError: (error) => {
        console.error("Chat error:", error);
        toast.error(error.message || "Failed to get response");
        setIsLoading(false);
      },
    });
  }, [input, isLoading, messages, user]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) return null;

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-ruby transition-all duration-300",
          "bg-gradient-ruby hover:shadow-lg hover:scale-105 active:scale-95",
          isOpen && "scale-0 opacity-0"
        )}
        size="icon"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>

      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] rounded-2xl border bg-background shadow-2xl transition-all duration-300 flex flex-col overflow-hidden",
          isOpen ? "h-[500px] opacity-100 translate-y-0" : "h-0 opacity-0 translate-y-10 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between border-b bg-gradient-ruby px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Gem className="h-5 w-5 animate-pulse" />
            <span className="font-bold tracking-tight">RUBY Concierge</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4 py-10">
              <div className="w-16 h-16 rounded-2xl bg-ruby/10 flex items-center justify-center mb-4">
                <Gem className="h-8 w-8 text-ruby" />
              </div>
              <p className="text-sm font-bold text-ruby mb-1">Welcome to RUBY Concierge!</p>
              <p className="text-xs">
                How can I help you navigate the RUBY Network legacy today?
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "model" && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-ruby/10 flex items-center justify-center">
                      <Gem className="h-4 w-4 text-ruby" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                      msg.role === "user"
                        ? "bg-gradient-ruby text-white rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none"
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-ruby flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "model" && (
                <div className="flex gap-2 justify-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-ruby/10 flex items-center justify-center">
                    <Gem className="h-4 w-4 text-ruby animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-none px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-3 bg-muted/30">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1 rounded-full bg-background border-border shadow-inner"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0 rounded-full bg-gradient-ruby shadow-ruby translate-y-0 active:translate-y-0.5 transition-transform"
            >
              <Send className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
