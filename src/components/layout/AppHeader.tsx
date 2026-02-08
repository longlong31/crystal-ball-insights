import { Link, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { MobileNav } from "@/components/MobileNav";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AuthForm } from "@/components/auth/AuthForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

export const AppHeader = () => {
  const location = useLocation();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { t } = useLanguage();

  const navItems = [
    { path: "/", label: t("nav.home") },
    { path: "/project", label: t("nav.project") },
    { path: "/community", label: t("nav.community") },
    { path: "/docs", label: t("nav.docs") },
  ];

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
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm transition-colors ${
                  location.pathname === item.path
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="minimal" />
            <UserMenu onAuthClick={() => setShowAuthDialog(true)} />
          </div>
        </div>
      </header>
    </>
  );
};