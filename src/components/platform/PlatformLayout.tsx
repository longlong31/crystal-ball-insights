import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, TrendingUp, Bitcoin, Briefcase, ShieldAlert,
  Brain, ChevronLeft, ChevronRight, Home, Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/layout/AppHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface PlatformLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/platform", icon: LayoutDashboard, label: "Dashboard", labelVi: "Tổng quan" },
  { path: "/platform/stocks", icon: TrendingUp, label: "Stock Analysis", labelVi: "Phân tích cổ phiếu" },
  { path: "/platform/crypto", icon: Bitcoin, label: "Crypto Intel", labelVi: "Crypto" },
  { path: "/platform/portfolio", icon: Briefcase, label: "Portfolio", labelVi: "Danh mục" },
  { path: "/platform/risk", icon: ShieldAlert, label: "Risk Engine", labelVi: "Rủi ro" },
  { path: "/platform/ai-insights", icon: Brain, label: "AI Insights", labelVi: "AI" },
];

function SidebarContent({ collapsed, location, language }: { collapsed: boolean; location: any; language: string }) {
  return (
    <>
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all group relative",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r"
                />
              )}
              <item.icon className={cn("w-4 h-4 shrink-0", isActive && "text-primary")} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="truncate"
                  >
                    {language === "vi" ? item.labelVi : item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {language === "vi" ? item.labelVi : item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/30 p-2 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Home className="w-4 h-4 shrink-0" />
          {!collapsed && <span>{language === "vi" ? "Trang chủ" : "Home"}</span>}
        </Link>
      </div>
    </>
  );
}

export function PlatformLayout({ children }: PlatformLayoutProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Global Header */}
      <AppHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[240px] p-0 bg-card/95 backdrop-blur-xl border-r border-border/30">
            <div className="flex items-center gap-2 px-4 h-14 border-b border-border/30">
              <Sparkles className="w-5 h-5 text-primary" />
              <div>
                <span className="text-sm font-semibold">Crystall</span>
                <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground ml-1">Quant</span>
              </div>
            </div>
            <SidebarContent collapsed={false} location={location} language={language} />
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar */}
        <motion.aside
          animate={{ width: collapsed ? 64 : 220 }}
          transition={{ duration: 0.2 }}
          className="hidden md:flex flex-col border-r border-border/30 bg-card/50 backdrop-blur-sm relative z-10"
        >
          {/* Logo */}
          <div className="flex items-center gap-2 px-4 h-12 border-b border-border/30">
            <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col"
                >
                  <span className="text-sm font-semibold tracking-tight">Crystall</span>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Quant Platform</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <SidebarContent collapsed={collapsed} location={location} language={language} />

          {/* Collapse button */}
          <div className="border-t border-border/30 p-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {!collapsed && <span>{language === "vi" ? "Thu gọn" : "Collapse"}</span>}
            </button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile bar */}
          <div className="md:hidden flex items-center gap-2 px-4 h-10 border-b border-border/30 bg-card/30">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileOpen(true)}>
              <Menu className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground">
              {navItems.find(n => n.path === location.pathname)?.[language === "vi" ? "labelVi" : "label"] || "Platform"}
            </span>
          </div>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
