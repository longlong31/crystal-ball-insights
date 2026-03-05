import { useState } from "react";
import { Menu, X, Sparkles, BarChart2, FileText, Users, BarChart3 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const navItemsDef = [
  { href: "/", labelKey: "nav.home", icon: BarChart2 },
  { href: "/project", labelKey: "nav.project", icon: FileText },
  { href: "/platform", labelKey: "nav.platform", icon: BarChart3 },
  { href: "/community", labelKey: "nav.community", icon: Users },
  { href: "/docs", labelKey: "nav.docs", icon: FileText },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const navItems = navItemsDef.map((item) => ({ ...item, label: t(item.labelKey) }));

  const handleNavigation = (href: string) => {
    navigate(href);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden relative overflow-hidden group"
        >
          <motion.div
            initial={false}
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </motion.div>
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 bg-background/95 backdrop-blur-xl border-r border-border/50">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 p-6 border-b border-border/50">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <Sparkles className="w-8 h-8 text-primary relative z-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Crystal Ball
              </h2>
              <p className="text-xs text-muted-foreground">Monte Carlo Simulation</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2">
            <AnimatePresence>
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <motion.button
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 group ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className={`p-2 rounded-lg transition-colors ${
                      isActive ? "bg-primary-foreground/20" : "bg-muted group-hover:bg-primary/10"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto w-2 h-2 rounded-full bg-primary-foreground"
                      />
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border/50">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <p className="text-sm font-medium text-foreground mb-1">
                Phân tích rủi ro thông minh
              </p>
              <p className="text-xs text-muted-foreground">
                Sử dụng AI để dự đoán và phân tích
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
