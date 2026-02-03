import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Bot, 
  User,
  Sparkles,
  Loader2,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

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
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const { data, error } = await supabase.functions.invoke("chatbot-ai", {
        body: { 
          message: userMessage.trim(),
          conversationHistory,
        },
      });

      if (error) throw error;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "Xin lỗi, tôi không thể trả lời lúc này.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau! 🙏",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => sendMessage(input);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleOpen = () => {
    if (!isOpen) {
      setIsMinimized(false);
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: "Xin chào! 👋 Tôi là Crystal Ball AI. Hỏi tôi về phân tích dự án đầu tư, Monte Carlo, hoặc bất cứ điều gì! ✨",
        timestamp: new Date(),
      }]);
    }
    setIsOpen(!isOpen);
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
            style={{ 
              bottom: isMobile ? 16 : 24, 
              right: isMobile ? 16 : 24 
            }}
          >
            <Button
              onClick={toggleOpen}
              className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 hover:opacity-90 shadow-xl transition-all duration-300 border-2 border-white/20"
            >
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
              <MessageCircle className="w-6 h-6 text-primary-foreground" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300" />
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
            transition={{ duration: 0.2 }}
            className="fixed z-50 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ 
              width: isMobile ? "calc(100vw - 32px)" : "360px",
              height: isMinimized ? "auto" : (isMobile ? "60vh" : "450px"),
              maxHeight: isMobile ? "70vh" : "500px",
              bottom: isMobile ? 16 : 24,
              right: isMobile ? 16 : 24,
              left: isMobile ? 16 : "auto",
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 p-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground flex items-center gap-1">
                    Crystal Ball AI
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                  </h3>
                  <p className="text-[10px] text-muted-foreground">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-7 w-7 hover:bg-white/10 rounded-full"
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleOpen}
                  className="h-7 w-7 hover:bg-destructive/20 hover:text-destructive rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Chat Content */}
            {!isMinimized && (
              <>
                {/* Messages - Simple scrollable div */}
                <div 
                  className="flex-1 overflow-y-auto p-3 space-y-3"
                  style={{ minHeight: 0 }}
                >
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === "user" 
                          ? "bg-gradient-to-br from-blue-500 to-cyan-400" 
                          : "bg-gradient-to-br from-primary via-purple-500 to-pink-500"
                      }`}>
                        {message.role === "user" 
                          ? <User className="w-3.5 h-3.5 text-white" />
                          : <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                        }
                      </div>
                      <div className={`max-w-[80%] p-2.5 rounded-2xl text-sm ${
                        message.role === "user"
                          ? "bg-primary/20 border border-primary/30 rounded-br-md"
                          : "bg-muted border border-border rounded-bl-md"
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        <span className="text-[9px] text-muted-foreground mt-1 block">
                          {message.timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                      <div className="bg-muted border border-border rounded-2xl rounded-bl-md p-2.5">
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Đang suy nghĩ...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-border bg-card flex-shrink-0">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Nhập câu hỏi..."
                      disabled={isTyping}
                      className="flex-1 bg-background border-border focus:border-primary rounded-xl text-sm h-9"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping}
                      size="icon"
                      className="bg-gradient-to-r from-primary to-purple-500 hover:opacity-90 rounded-xl h-9 w-9"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-[9px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Powered by Crystal Ball AI
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
