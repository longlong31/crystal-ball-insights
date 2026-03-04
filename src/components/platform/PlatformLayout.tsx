import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, TrendingUp, Bitcoin, Briefcase, ShieldAlert,
  Brain, ChevronLeft, ChevronRight, Activity, Sparkles, Settings,
  BarChart3, Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/UserMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AuthForm } from "@/components/auth/AuthForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PlatformLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/platform", icon: LayoutDashboard, label: "Dashboard", shortLabel: "DASH" },
  { path: "/platform/stocks", icon: TrendingUp, label: "Stock Analysis", shortLabel: "STK" },
  { path: "/platform/crypto", icon: Bitcoin, label: "Crypto Intel", shortLabel: "CRY" },
  { path: "/platform/portfolio", icon: Briefcase, label: "Portfolio", shortLabel: "PRT" },
  { path: "/platform/risk", icon: ShieldAlert, label: "Risk Engine", shortLabel: "RSK" },
  { path: "/platform/ai-insights", icon: Brain, label: "AI Insights", shortLabel: "AI" },
];

export function PlatformLayout({ children }: PlatformLayoutProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col border-r border-border/30 bg-card/50 backdrop-blur-sm relative z-20"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border/30">
          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
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

        {/* Nav */}
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
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border/30 p-2 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Home className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Home</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border/30 flex items-center justify-between px-6 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Activity className="w-3 h-3 text-quant-green animate-pulse" />
              <span>LIVE</span>
              <span className="text-border">|</span>
              <span>{new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="minimal" />
            <UserMenu onAuthClick={() => setShowAuth(true)} />
          </div>
        </header>

        {/* Content */}
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

      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-md">
          <AuthForm onSuccess={() => setShowAuth(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
