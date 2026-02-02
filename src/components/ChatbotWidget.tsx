import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Bot, 
  User,
  Sparkles,
  GripVertical,
  Loader2,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
      // Prepare conversation history (last 10 messages for context)
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
        content: "Xin chào! 👋 Tôi là Crystal Ball AI Assistant. Tôi có thể giúp bạn tìm hiểu về phân tích dự án đầu tư, mô phỏng Monte Carlo và các chỉ số tài chính. Hãy hỏi tôi bất cứ điều gì! ✨",
        timestamp: new Date(),
      }]);
    }
    setIsOpen(!isOpen);
  };

  // Mobile-specific dimensions
  const chatWidth = isMobile ? "calc(100vw - 32px)" : "380px";
  const chatHeight = isMobile ? "70vh" : "500px";
  const chatPosition = isMobile 
    ? { bottom: 16, left: 16, right: 16 } 
    : { bottom: 24, right: 24 };

  return (
    <>
      {/* Invisible constraints container */}
      <div 
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-40"
      />

      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            drag={!isMobile}
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            whileDrag={{ scale: 1.1 }}
            className="fixed z-50"
            style={{ 
              bottom: isMobile ? 16 : 24, 
              right: isMobile ? 16 : 24 
            }}
          >
            <Button
              onClick={toggleOpen}
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 hover:from-primary/90 hover:via-purple-500/90 hover:to-pink-500/90 shadow-2xl hover:shadow-primary/25 transition-all duration-300 group border-2 border-white/20"
            >
              {/* Animated rings */}
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
              <div className="absolute inset-[-4px] rounded-full border-2 border-primary/40 animate-pulse" />
              
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
              </motion.div>
              
              {/* Sparkle effect */}
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 drop-shadow-lg" />
              </motion.div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag={!isMobile}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? "auto" : chatHeight
            }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed z-50 bg-gradient-to-b from-card via-card to-background/95 backdrop-blur-xl border border-border/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
            style={{ 
              width: chatWidth,
              maxWidth: isMobile ? "calc(100vw - 32px)" : "400px",
              boxShadow: "0 0 60px hsl(var(--primary) / 0.2), 0 20px 40px -20px rgba(0,0,0,0.5)",
              ...chatPosition
            }}
          >
            {/* Header - Draggable */}
            <motion.div 
              onPointerDown={(e) => !isMobile && dragControls.start(e)}
              className="relative bg-gradient-to-r from-primary/30 via-purple-500/30 to-pink-500/30 p-3 sm:p-4 flex items-center justify-between cursor-grab active:cursor-grabbing overflow-hidden"
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
              
              <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                <div className="relative">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                  </div>
                  <motion.div
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-card shadow-lg"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-1.5 sm:gap-2">
                    Crystal Ball AI
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    >
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
                    </motion.div>
                  </h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Trợ lý AI thông minh</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1 relative z-10">
                {!isMobile && <GripVertical className="w-4 h-4 text-muted-foreground/50 mr-1" />}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-white/10 rounded-full"
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleOpen}
                  className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-destructive/20 hover:text-destructive rounded-full"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </motion.div>

            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col"
                  style={{ height: isMobile ? "calc(70vh - 120px)" : "calc(500px - 80px)" }}
                >
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollRef}>
                    <div className="space-y-3 sm:space-y-4">
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: index * 0.03 }}
                          className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                            message.role === "user" 
                              ? "bg-gradient-to-br from-blue-500 to-cyan-400" 
                              : "bg-gradient-to-br from-primary via-purple-500 to-pink-500"
                          }`}>
                            {message.role === "user" 
                              ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                              : <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
                            }
                          </div>
                          <div className={`max-w-[75%] sm:max-w-[80%] p-2.5 sm:p-3 rounded-2xl shadow-md ${
                            message.role === "user"
                              ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-br-md"
                              : "bg-gradient-to-br from-card to-muted/50 border border-border/50 rounded-bl-md"
                          }`}>
                            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 block opacity-70">
                              {message.timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                      
                      {/* Typing indicator */}
                      {isTyping && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-2"
                        >
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                            <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
                          </div>
                          <div className="bg-gradient-to-br from-card to-muted/50 border border-border/50 rounded-2xl rounded-bl-md p-2.5 sm:p-3 shadow-md">
                            <div className="flex items-center gap-1.5">
                              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-primary" />
                              <span className="text-[10px] sm:text-xs text-muted-foreground">Đang suy nghĩ...</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-3 sm:p-4 border-t border-border/30 bg-gradient-to-b from-transparent to-muted/20">
                    <div className="flex gap-2">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Nhập câu hỏi của bạn..."
                        disabled={isTyping}
                        className="flex-1 bg-background/60 border-border/50 focus:border-primary/50 rounded-xl text-xs sm:text-sm h-9 sm:h-10 placeholder:text-muted-foreground/50"
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        size="icon"
                        className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 hover:from-primary/90 hover:via-purple-500/90 hover:to-pink-500/90 rounded-xl h-9 w-9 sm:h-10 sm:w-10 shadow-lg disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 text-center mt-2 flex items-center justify-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      Powered by Crystal Ball AI
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
