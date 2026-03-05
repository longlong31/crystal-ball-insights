import { Link, useLocation } from "react-router-dom";
import { Sparkles, Bell, BarChart3 } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { MobileNav } from "@/components/MobileNav";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AuthForm } from "@/components/auth/AuthForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: Date;
  read: boolean;
  type: "post" | "comment" | "news" | "system";
}

export const AppHeader = () => {
  const location = useLocation();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [
    { path: "/", label: t("nav.home") },
    { path: "/project", label: t("nav.project") },
    { path: "/platform", label: t("nav.platform"), highlight: true },
    { path: "/community", label: t("nav.community") },
    { path: "/docs", label: t("nav.docs") },
  ];

  // Listen for realtime notifications
  useEffect(() => {
    const channel = supabase
      .channel("header-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_posts" },
        (payload) => {
          const newNotif: Notification = {
            id: (payload.new as any).id,
            title: language === "vi" ? "Bài viết mới" : "New post",
            description: (payload.new as any).title,
            time: new Date(),
            read: false,
            type: "post",
          };
          setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
          setUnreadCount((c) => c + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_comments" },
        () => {
          const newNotif: Notification = {
            id: crypto.randomUUID(),
            title: language === "vi" ? "Bình luận mới" : "New comment",
            description: language === "vi" ? "Ai đó vừa bình luận" : "Someone just commented",
            time: new Date(),
            read: false,
            type: "comment",
          };
          setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
          setUnreadCount((c) => c + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "news_articles" },
        (payload) => {
          const newNotif: Notification = {
            id: (payload.new as any).id,
            title: language === "vi" ? "Tin tức mới" : "New article",
            description: (payload.new as any).title,
            time: new Date(),
            read: false,
            type: "news",
          };
          setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
          setUnreadCount((c) => c + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [language]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return language === "vi" ? "vừa xong" : "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}${language === "vi" ? " phút trước" : "m ago"}`;
    const hours = Math.floor(minutes / 60);
    return `${hours}${language === "vi" ? " giờ trước" : "h ago"}`;
  };

  return (
    <>
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none">
          <AuthForm onSuccess={() => setShowAuthDialog(false)} />
        </DialogContent>
      </Dialog>

      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <MobileNav />
            <Link to="/" className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">Crystal Ball</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === "/platform" && location.pathname.startsWith("/platform"));
              const isHighlight = (item as any).highlight;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm transition-all duration-200 ${
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  } ${isHighlight && !isActive ? "flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:text-primary font-medium" : ""}`}
                >
                  {isHighlight && <BarChart3 className="w-3.5 h-3.5" />}
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1.5">
            {/* Notification Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center bg-destructive text-destructive-foreground border-0">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-3 border-b border-border/50">
                  <span className="text-sm font-semibold">
                    {language === "vi" ? "Thông báo" : "Notifications"}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary hover:underline"
                    >
                      {language === "vi" ? "Đọc tất cả" : "Mark all read"}
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      {language === "vi" ? "Chưa có thông báo" : "No notifications"}
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-3 py-2.5 border-b border-border/30 last:border-0 transition-colors ${
                          !n.read ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            n.type === "post" ? "bg-primary" :
                            n.type === "comment" ? "bg-blue-500" :
                            n.type === "news" ? "bg-emerald-500" :
                            "bg-muted-foreground"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{n.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{n.description}</p>
                            <p className="text-[10px] text-muted-foreground/70 mt-0.5">{timeAgo(n.time)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <LanguageSwitcher variant="minimal" />
            <UserMenu onAuthClick={() => setShowAuthDialog(true)} />
          </div>
        </div>
      </header>
    </>
  );
};