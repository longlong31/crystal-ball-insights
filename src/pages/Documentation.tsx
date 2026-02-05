import { useState, useEffect } from "react";
 import {
  BookOpen, 
  TrendingUp, 
  BarChart3, 
  Dice5, 
  HelpCircle, 
  BookMarked, 
  Lightbulb, 
  CheckCircle2, 
  MessageCircleQuestion, 
  Shield, 
  ExternalLink, 
  Zap,
  PanelLeftClose,
  PanelLeft,
  ChevronRight
} from "lucide-react";
import { ProjectDocumentation } from "@/components/ProjectDocumentation";
import { Footer } from "@/components/Footer";
 import { AppHeader } from "@/components/layout/AppHeader";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type SectionId = 'overview' | 'metrics' | 'sensitivity' | 'montecarlo' | 'guide' | 'glossary' | 'examples' | 'best-practices' | 'faq' | 'standards' | 'references' | 'version';

const tocSections = [
  { id: 'overview', label: 'Tổng quan', icon: BookOpen, description: 'Giới thiệu Crystal Ball' },
  { id: 'metrics', label: 'Chỉ số tài chính', icon: TrendingUp, description: 'NPV, IRR, DPP, DSCR' },
  { id: 'sensitivity', label: 'Phân tích độ nhạy', icon: BarChart3, description: 'Tornado, Spider, Ma trận' },
  { id: 'montecarlo', label: 'Monte Carlo', icon: Dice5, description: 'Mô phỏng xác suất' },
  { id: 'guide', label: 'Hướng dẫn', icon: HelpCircle, description: 'Cách sử dụng công cụ' },
  { id: 'glossary', label: 'Thuật ngữ', icon: BookMarked, description: 'Định nghĩa các khái niệm' },
  { id: 'examples', label: 'Ví dụ thực tế', icon: Lightbulb, description: 'Case studies' },
  { id: 'best-practices', label: 'Best Practices', icon: CheckCircle2, description: 'Thực hành tốt nhất' },
  { id: 'faq', label: 'FAQ', icon: MessageCircleQuestion, description: 'Câu hỏi thường gặp' },
  { id: 'standards', label: 'Tiêu chuẩn', icon: Shield, description: 'Đánh giá dự án' },
  { id: 'references', label: 'Tham khảo', icon: ExternalLink, description: 'Tài liệu tham khảo' },
  { id: 'version', label: 'Phiên bản', icon: Zap, description: 'Lịch sử cập nhật' },
] as const;

const Documentation = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = tocSections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id)
      }));

      for (const section of sections.reverse()) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
       <AppHeader />

      <div className="flex">
        {/* Sidebar - Table of Contents */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] border-r border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden flex-shrink-0"
            >
               <div className="flex items-center justify-end p-2 border-b border-border/30">
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => setSidebarOpen(false)}
                 >
                   <PanelLeftClose className="w-4 h-4" />
                 </Button>
               </div>
               <ScrollArea className="h-[calc(100%-48px)]">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4 px-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-lg">Mục lục</h2>
                  </div>
                  
                  <nav className="space-y-1">
                    {tocSections.map((section, index) => {
                      const Icon = section.icon;
                      const isActive = activeSection === section.id;
                      
                      return (
                        <motion.button
                          key={section.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => scrollToSection(section.id)}
                          className={cn(
                            "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 group",
                            isActive 
                              ? "bg-primary/10 border border-primary/30" 
                              : "hover:bg-muted/50 border border-transparent"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-lg transition-colors flex-shrink-0",
                            isActive ? "bg-primary/20" : "bg-muted/50 group-hover:bg-muted"
                          )}>
                            <Icon className={cn(
                              "w-4 h-4 transition-colors",
                              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "font-medium text-sm truncate transition-colors",
                              isActive ? "text-primary" : "text-foreground"
                            )}>
                              {section.label}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {section.description}
                            </div>
                          </div>
                          <ChevronRight className={cn(
                            "w-4 h-4 flex-shrink-0 mt-1 transition-all",
                            isActive 
                              ? "text-primary opacity-100 translate-x-0" 
                              : "text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                          )} />
                        </motion.button>
                      );
                    })}
                  </nav>

                  {/* Quick Stats */}
                  <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-2">Nội dung tài liệu</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span>12 mục</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-chart-2" />
                        <span>5+ ví dụ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile TOC Toggle */}
        <div className="lg:hidden fixed bottom-6 left-6 z-50">
          <Button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-full shadow-lg shadow-primary/25"
            size="icon"
          >
            <BookOpen className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="lg:hidden fixed left-0 top-16 bottom-0 z-50 w-[280px] border-r border-border/50 bg-card/95 backdrop-blur-xl overflow-hidden"
              >
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg">Mục lục</h2>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                        <PanelLeftClose className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <nav className="space-y-1">
                      {tocSections.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;
                        
                        return (
                          <button
                            key={section.id}
                            onClick={() => {
                              scrollToSection(section.id);
                              setSidebarOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200",
                              isActive 
                                ? "bg-primary/10 border border-primary/30" 
                                : "hover:bg-muted/50 border border-transparent"
                            )}
                          >
                            <div className={cn(
                              "p-2 rounded-lg transition-colors flex-shrink-0",
                              isActive ? "bg-primary/20" : "bg-muted/50"
                            )}>
                              <Icon className={cn(
                                "w-4 h-4 transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground"
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={cn(
                                "font-medium text-sm truncate transition-colors",
                                isActive ? "text-primary" : "text-foreground"
                              )}>
                                {section.label}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {section.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </ScrollArea>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Documentation Content */}
        <main className="flex-1 min-w-0">
          <div className="container py-8">
            <ProjectDocumentation />
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Documentation;
