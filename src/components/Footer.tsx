import { Sparkles, ExternalLink, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border py-8 bg-card/30 relative z-10">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold">Crystal Ball</span>
            <span className="text-sm text-muted-foreground">
              - {t("footer.tagline")}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Developed with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>by</span>
            <a
              href="https://quachthanhlong.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1"
            >
              Quách Thành Long
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <a
              href="https://quachthanhlong.com/projects"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              {t("footer.projects")}
            </a>
            <a
              href="https://quachthanhlong.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              {t("footer.contact")}
            </a>
          </div>
          <span>© 2025 Crystal Ball. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
