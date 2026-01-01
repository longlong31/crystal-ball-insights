import { Sparkles } from "lucide-react";
import { ProjectDocumentation } from "@/components/ProjectDocumentation";

const Documentation = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Crystal Ball</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Mô phỏng cơ bản
            </a>
            <a href="/project" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Phân tích dự án
            </a>
            <a href="/docs" className="text-sm text-foreground font-medium transition-colors">
              Tài liệu
            </a>
          </nav>
        </div>
      </header>

      {/* Documentation Content */}
      <ProjectDocumentation />

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Crystal Ball - Công cụ phân tích rủi ro và dự báo Monte Carlo</p>
        </div>
      </footer>
    </div>
  );
};

export default Documentation;
