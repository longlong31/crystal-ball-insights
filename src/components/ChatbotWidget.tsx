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
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface QA {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [qaData, setQaData] = useState<QA[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchQAData();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchQAData = async () => {
    const { data, error } = await supabase
      .from("chatbot_qa")
      .select("*")
      .eq("is_active", true);
    
    if (!error && data) {
      setQaData(data);
    }
  };

  const findBestMatch = (userInput: string): string => {
    const input = userInput.toLowerCase().trim();
    
    // Exact match
    const exactMatch = qaData.find(
      qa => qa.question.toLowerCase().includes(input) || input.includes(qa.question.toLowerCase())
    );
    if (exactMatch) return exactMatch.answer;

    // Keyword match
    for (const qa of qaData) {
      if (qa.keywords && qa.keywords.length > 0) {
        const hasKeyword = qa.keywords.some(keyword => 
          input.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(input)
        );
        if (hasKeyword) return qa.answer;
      }
    }

    // Partial match
    const words = input.split(/\s+/);
    for (const qa of qaData) {
      const questionWords = qa.question.toLowerCase().split(/\s+/);
      const matchCount = words.filter(word => 
        questionWords.some(qWord => qWord.includes(word) || word.includes(qWord))
      ).length;
      if (matchCount >= 2) return qa.answer;
    }

    return "Xin lỗi, tôi chưa có câu trả lời cho câu hỏi này. Vui lòng liên hệ admin để được hỗ trợ! 😊";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const botResponse = findBestMatch(input.trim());
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "bot",
      content: botResponse,
      timestamp: new Date(),
    };

    setIsTyping(false);
    setMessages(prev => [...prev, botMessage]);
  };

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
        role: "bot",
        content: "Xin chào! 👋 Tôi là Crystal Ball Assistant. Tôi có thể giúp gì cho bạn hôm nay?",
        timestamp: new Date(),
      }]);
    }
    setIsOpen(!isOpen);
  };

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
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            whileDrag={{ scale: 1.1 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={toggleOpen}
              className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              {/* Animated rings */}
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
              <div className="absolute inset-[-4px] rounded-full border-2 border-primary/50 animate-pulse" />
              
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <MessageCircle className="w-7 h-7 text-primary-foreground" />
              </motion.div>
              
              {/* Sparkle effect */}
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </motion.div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? "auto" : "500px"
            }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] bg-gradient-to-b from-card to-background border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
            style={{ boxShadow: "0 0 50px hsl(185 80% 50% / 0.15)" }}
          >
            {/* Header - Draggable */}
            <motion.div 
              onPointerDown={(e) => dragControls.start(e)}
              className="bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 p-4 flex items-center justify-between cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <motion.div
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    Crystal Ball AI
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </h3>
                  <p className="text-xs text-muted-foreground">Sẵn sàng hỗ trợ bạn</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <GripVertical className="w-4 h-4 text-muted-foreground mr-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-8 w-8 hover:bg-primary/10"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleOpen}
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>

            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {/* Messages */}
                  <ScrollArea className="h-[340px] p-4" ref={scrollRef}>
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === "user" 
                              ? "bg-gradient-to-br from-blue-500 to-cyan-500" 
                              : "bg-gradient-to-br from-primary to-purple-500"
                          }`}>
                            {message.role === "user" 
                              ? <User className="w-4 h-4 text-white" />
                              : <Bot className="w-4 h-4 text-primary-foreground" />
                            }
                          </div>
                          <div className={`max-w-[260px] p-3 rounded-2xl ${
                            message.role === "user"
                              ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-br-md"
                              : "bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-bl-md"
                          }`}>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <span className="text-[10px] text-muted-foreground mt-1 block">
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
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-primary-foreground" />
                          </div>
                          <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl rounded-bl-md p-3">
                            <div className="flex gap-1">
                              <motion.div
                                className="w-2 h-2 bg-primary rounded-full"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                              />
                              <motion.div
                                className="w-2 h-2 bg-primary rounded-full"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                              />
                              <motion.div
                                className="w-2 h-2 bg-primary rounded-full"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-4 border-t border-border/50 bg-card/50">
                    <div className="flex gap-2">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Nhập câu hỏi của bạn..."
                        className="flex-1 bg-background/50 border-border/50 focus:border-primary"
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-2">
                      Powered by Crystal Ball AI ✨
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
