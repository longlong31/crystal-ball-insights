import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, X, Send, Minimize2, Bot, User,
  Sparkles, Maximize2, RotateCcw, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot-ai`;

const QUICK_PROMPTS_VI = [
  "NPV là gì?",
  "Hướng dẫn Monte Carlo",
  "So sánh IRR vs WACC",
  "Phân tích rủi ro dự án",
];

const QUICK_PROMPTS_EN = [
  "What is NPV?",
  "Monte Carlo guide",
  "Compare IRR vs WACC",
  "Project risk analysis",
];

export function ChatbotWidget() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMobile = useIsMobile();

  const quickPrompts = language === "en" ? QUICK_PROMPTS_EN : QUICK_PROMPTS_VI;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const streamChat = useCallback(async (userMessage: string) => {
    const conversationHistory = messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        message: userMessage,
        conversationHistory,
        stream: true,
        language,
      }),
      signal: controller.signal,
    });

    if (!resp.ok || !resp.body) {
      // Try parsing as JSON error
      try {
        const errData = await resp.json();
        return errData.reply || t("chatbot.error");
      } catch {
        throw new Error("Stream failed");
      }
    }

    const contentType = resp.headers.get("content-type") || "";
    
    // If not streaming (got JSON back), handle directly
    if (contentType.includes("application/json")) {
      const data = await resp.json();
      return data.reply || t("chatbot.error");
    }

    // SSE streaming
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";
    const assistantId = (Date.now() + 1).toString();

    // Create initial assistant message
    setMessages(prev => [...prev, {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    }]);

    let streamDone = false;
    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullContent += content;
            setMessages(prev =>
              prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m)
            );
          }
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    // Finalize
    setMessages(prev =>
      prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m)
    );

    return null; // Already handled via streaming
  }, [messages, language, t]);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isTyping) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const fallbackReply = await streamChat(userMessage.trim());
      
      // If we got a non-streaming reply
      if (fallbackReply) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: fallbackReply,
          timestamp: new Date(),
        }]);
      }
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error("Chatbot error:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: t("chatbot.error"),
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => sendMessage(input);
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const toggleOpen = () => {
    if (!isOpen) {
      setIsMinimized(false);
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: t("chatbot.welcome"),
        timestamp: new Date(),
      }]);
    } else {
      abortControllerRef.current?.abort();
    }
    setIsOpen(!isOpen);
  };

  const clearChat = () => {
    abortControllerRef.current?.abort();
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: t("chatbot.welcome"),
      timestamp: new Date(),
    }]);
    setIsTyping(false);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed z-50"
            style={{ bottom: isMobile ? 16 : 24, right: isMobile ? 16 : 24 }}
          >
            <Button
              onClick={toggleOpen}
              className="relative w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-400 shadow-2xl shadow-purple-500/30 transition-all duration-300 border border-white/20"
            >
              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
              <MessageCircle className="w-6 h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-50 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{
              width: isMobile ? "calc(100vw - 24px)" : "400px",
              height: isMinimized ? "auto" : (isMobile ? "70vh" : "520px"),
              maxHeight: isMobile ? "80vh" : "600px",
              bottom: isMobile ? 12 : 24,
              right: isMobile ? 12 : 24,
              left: isMobile ? 12 : "auto",
            }}
          >
            {/* Header */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />
              <div className="relative p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      Crystal Ball AI
                      <span className="px-1.5 py-0.5 bg-white/20 rounded text-[9px] font-medium backdrop-blur-sm">PRO</span>
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      <p className="text-[10px] text-white/80">
                        {language === "en" ? "AI-powered • Real-time" : "AI thông minh • Thời gian thực"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={clearChat}
                    className="h-7 w-7 hover:bg-white/20 rounded-lg text-white/80 hover:text-white">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)}
                    className="h-7 w-7 hover:bg-white/20 rounded-lg text-white/80 hover:text-white">
                    {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={toggleOpen}
                    className="h-7 w-7 hover:bg-red-500/30 rounded-lg text-white/80 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Content */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: 0 }}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-blue-500 to-cyan-400"
                          : "bg-gradient-to-br from-violet-500 to-fuchsia-500"
                      }`}>
                        {message.role === "user"
                          ? <User className="w-3.5 h-3.5 text-white" />
                          : <Sparkles className="w-3.5 h-3.5 text-white" />
                        }
                      </div>
                      <div className={`group relative max-w-[82%] ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-blue-500/15 to-cyan-500/10 border border-blue-500/20 rounded-2xl rounded-tr-md"
                          : "bg-muted/60 border border-border/50 rounded-2xl rounded-tl-md"
                      } p-2.5`}>
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_code]:text-xs [&_code]:bg-primary/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:text-xs [&_pre]:bg-primary/5 [&_pre]:p-2 [&_pre]:rounded-lg [&_table]:text-xs [&_th]:p-1 [&_td]:p-1 [&_blockquote]:border-primary/30 [&_blockquote]:text-muted-foreground">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                            {message.isStreaming && (
                              <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 rounded-sm" />
                            )}
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[9px] text-muted-foreground">
                            {message.timestamp.toLocaleTimeString(language === "en" ? "en-US" : "vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {message.role === "assistant" && !message.isStreaming && (
                            <button
                              onClick={() => copyMessage(message.id, message.content)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                            >
                              {copiedId === message.id
                                ? <Check className="w-3 h-3 text-green-500" />
                                : <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  {isTyping && !messages.some(m => m.isStreaming) && (
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-muted/60 border border-border/50 rounded-2xl rounded-tl-md p-3">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
                          <div className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick prompts - show only when few messages */}
                {messages.length <= 1 && (
                  <div className="px-3 pb-2">
                    <div className="flex flex-wrap gap-1.5">
                      {quickPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => sendMessage(prompt)}
                          className="text-[11px] px-2.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t border-border/50 bg-card/80 backdrop-blur-sm flex-shrink-0">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={t("chatbot.placeholder")}
                      disabled={isTyping}
                      className="flex-1 bg-background/80 border-border/50 focus:border-violet-400 rounded-xl text-sm h-9"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping}
                      size="icon"
                      className="bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-400 rounded-xl h-9 w-9 shadow-lg shadow-purple-500/20"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-[9px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-violet-400" />
                    Crystal Ball AI • Streaming • Real-time Data
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
