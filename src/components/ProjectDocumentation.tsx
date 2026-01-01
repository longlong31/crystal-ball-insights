import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Calculator, 
  TrendingUp, 
  Percent, 
  Clock, 
  Scale, 
  BarChart3, 
  Dice5,
  FileSpreadsheet,
  Save,
  GitCompare,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  MessageCircleQuestion,
  ExternalLink,
  Target,
  Zap,
  Shield,
  Sparkles,
  ChevronRight,
  GraduationCap,
  LineChart,
  PieChart,
  Activity,
  Award,
  BookMarked,
  Play,
  ArrowRight
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SectionId = 'overview' | 'metrics' | 'sensitivity' | 'montecarlo' | 'guide' | 'glossary' | 'examples' | 'best-practices' | 'faq' | 'standards' | 'references' | 'version';

const sections = [
  { id: 'overview', label: 'Tổng quan', icon: BookOpen },
  { id: 'metrics', label: 'Chỉ số tài chính', icon: TrendingUp },
  { id: 'sensitivity', label: 'Phân tích độ nhạy', icon: BarChart3 },
  { id: 'montecarlo', label: 'Monte Carlo', icon: Dice5 },
  { id: 'guide', label: 'Hướng dẫn', icon: HelpCircle },
  { id: 'glossary', label: 'Thuật ngữ', icon: BookMarked },
  { id: 'examples', label: 'Ví dụ thực tế', icon: Lightbulb },
  { id: 'best-practices', label: 'Best Practices', icon: CheckCircle2 },
  { id: 'faq', label: 'FAQ', icon: MessageCircleQuestion },
  { id: 'standards', label: 'Tiêu chuẩn', icon: Shield },
  { id: 'references', label: 'Tham khảo', icon: ExternalLink },
  { id: 'version', label: 'Phiên bản', icon: Zap },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const GlassCard = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={cn(
      "relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-6",
      "shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]",
      "transition-all duration-500 group",
      className
    )}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

const FeatureCard = ({ icon: Icon, title, description, color }: { icon: any; title: string; description: string; color: string }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -4 }}
    className={cn(
      "relative p-5 rounded-xl border border-border/30 bg-gradient-to-br overflow-hidden",
      "transition-all duration-300 cursor-pointer group"
    )}
    style={{ background: `linear-gradient(135deg, hsl(var(--${color}) / 0.1), hsl(var(--${color}) / 0.05))` }}
  >
    <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40")}
      style={{ background: `hsl(var(--${color}))` }} />
    <Icon className={cn("w-8 h-8 mb-3")} style={{ color: `hsl(var(--${color}))` }} />
    <h3 className="font-bold text-base mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </motion.div>
);

const MetricBadge = ({ value, label, trend }: { value: string; label: string; trend?: 'up' | 'down' | 'neutral' }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
    <div className="flex-1">
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
    {trend && (
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center",
        trend === 'up' && "bg-green-500/20 text-green-500",
        trend === 'down' && "bg-red-500/20 text-red-500",
        trend === 'neutral' && "bg-yellow-500/20 text-yellow-500"
      )}>
        <Activity className="w-4 h-4" />
      </div>
    )}
  </div>
);

export const ProjectDocumentation = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');

  const scrollToSection = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative mb-12 rounded-3xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-secondary/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        
        {/* Animated Orbs */}
        <div className="absolute top-10 right-10 w-20 h-20 rounded-full bg-primary/30 blur-2xl animate-float" />
        <div className="absolute bottom-10 left-20 w-16 h-16 rounded-full bg-secondary/40 blur-xl animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10 px-8 py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-6 p-4 rounded-2xl bg-primary/20 backdrop-blur-sm border border-primary/30">
              <Sparkles className="w-12 h-12 text-primary animate-pulse-glow" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
              Crystal Ball Documentation
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
              Hướng dẫn toàn diện về phân tích tài chính dự án đầu tư với các công cụ chuyên nghiệp
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 backdrop-blur border border-border/50">
                <Calculator className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">5+ Chỉ số tài chính</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 backdrop-blur border border-border/50">
                <BarChart3 className="w-4 h-4 text-chart-2" />
                <span className="text-sm font-medium">3 Loại phân tích độ nhạy</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 backdrop-blur border border-border/50">
                <Dice5 className="w-4 h-4 text-chart-3" />
                <span className="text-sm font-medium">Monte Carlo Simulation</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Navigation Pills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="sticky top-4 z-50 mb-8"
      >
        <div className="flex flex-wrap justify-center gap-2 p-4 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg max-w-5xl mx-auto">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{section.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8 pb-12"
      >
        {/* Section: Overview */}
        <section id="overview">
          <GlassCard>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-primary/20">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Tổng quan về Crystal Ball</h2>
                <p className="text-muted-foreground">Công cụ phân tích tài chính dự án đầu tư hàng đầu</p>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
              Crystal Ball là bộ công cụ phân tích tài chính dự án đầu tư toàn diện, được thiết kế dành cho các chuyên gia tài chính, 
              nhà đầu tư và doanh nghiệp. Hỗ trợ tính toán các chỉ số hiệu quả đầu tư, phân tích độ nhạy đa chiều, 
              mô phỏng Monte Carlo và so sánh nhiều phương án đầu tư.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FeatureCard
                icon={Calculator}
                title="Tính toán dự án"
                description="NPV, IRR, DPP, DSCR với độ chính xác cao"
                color="primary"
              />
              <FeatureCard
                icon={BarChart3}
                title="Phân tích độ nhạy"
                description="Tornado, Spider, Ma trận 2D"
                color="chart-2"
              />
              <FeatureCard
                icon={Dice5}
                title="Monte Carlo"
                description="Mô phỏng xác suất hàng nghìn kịch bản"
                color="chart-3"
              />
              <FeatureCard
                icon={GitCompare}
                title="So sánh dự án"
                description="Đánh giá đa tiêu chí, xếp hạng tự động"
                color="chart-4"
              />
            </div>
          </GlassCard>
        </section>

        {/* Section: Financial Metrics */}
        <section id="metrics">
          <GlassCard delay={0.1}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-chart-1/20">
                <TrendingUp className="w-8 h-8 text-chart-1" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Các chỉ số tài chính</h2>
                <p className="text-muted-foreground">Hiểu rõ các thước đo quan trọng trong đánh giá dự án</p>
              </div>
            </div>
            
            <Accordion type="multiple" className="w-full space-y-3">
              <AccordionItem value="npv" className="border border-border/30 rounded-xl px-4 bg-card/30 backdrop-blur">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-chart-1/20">
                      <Calculator className="w-5 h-5 text-chart-1" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">NPV - Giá trị hiện tại ròng</div>
                      <div className="text-sm text-muted-foreground">Net Present Value</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4 pt-2">
                    <p className="text-muted-foreground">
                      NPV đo lường giá trị hiện tại của tất cả dòng tiền tương lai, chiết khấu về thời điểm hiện tại.
                      Đây là chỉ số quan trọng nhất để đánh giá tính khả thi của dự án.
                    </p>
                    <div className="p-4 bg-muted/30 rounded-xl font-mono text-sm border border-border/30">
                      <div className="text-primary font-semibold mb-2">Công thức:</div>
                      NPV = Σ [CFₜ / (1 + r)ᵗ] - I₀
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <ChevronRight className="w-4 h-4 text-primary" />
                          Các thành phần
                        </h4>
                        <ul className="text-sm space-y-1 text-muted-foreground pl-6">
                          <li><strong>CFₜ</strong>: Dòng tiền năm t</li>
                          <li><strong>r</strong>: Tỷ lệ chiết khấu (WACC)</li>
                          <li><strong>I₀</strong>: Vốn đầu tư ban đầu</li>
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2 text-green-500 font-semibold text-sm mb-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Tiêu chuẩn đánh giá
                        </div>
                        <p className="text-sm text-muted-foreground">NPV &gt; 0 → Dự án khả thi về tài chính</p>
                      </div>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 text-sm">
                      <strong className="text-primary">💡 Lưu ý:</strong> Công cụ tính cả NPV theo quan điểm Tổng đầu tư (TIPV) và Chủ sở hữu (EPV).
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="irr" className="border border-border/30 rounded-xl px-4 bg-card/30 backdrop-blur">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-chart-2/20">
                      <Percent className="w-5 h-5 text-chart-2" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">IRR - Tỷ suất hoàn vốn nội bộ</div>
                      <div className="text-sm text-muted-foreground">Internal Rate of Return</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4 pt-2">
                    <p className="text-muted-foreground">
                      IRR là tỷ lệ chiết khấu làm cho NPV bằng 0. Đây là tỷ suất sinh lời thực tế của dự án,
                      cho phép so sánh hiệu quả giữa các dự án có quy mô khác nhau.
                    </p>
                    <div className="p-4 bg-muted/30 rounded-xl font-mono text-sm border border-border/30">
                      <div className="text-chart-2 font-semibold mb-2">Phương trình:</div>
                      0 = Σ [CFₜ / (1 + IRR)ᵗ] - I₀
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <MetricBadge value="&gt; WACC" label="Dự án khả thi" trend="up" />
                      <MetricBadge value="= WACC" label="Hòa vốn" trend="neutral" />
                      <MetricBadge value="&lt; WACC" label="Không khả thi" trend="down" />
                    </div>
                    <div className="p-4 bg-chart-2/10 rounded-xl border border-chart-2/20 text-sm">
                      <strong className="text-chart-2">🔧 Phương pháp tính:</strong> Newton-Raphson iteration với độ chính xác 0.0001%
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="dpp" className="border border-border/30 rounded-xl px-4 bg-card/30 backdrop-blur">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-chart-3/20">
                      <Clock className="w-5 h-5 text-chart-3" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">DPP - Thời gian hoàn vốn có chiết khấu</div>
                      <div className="text-sm text-muted-foreground">Discounted Payback Period</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4 pt-2">
                    <p className="text-muted-foreground">
                      DPP là thời gian cần thiết để dòng tiền chiết khấu tích lũy bù đắp vốn đầu tư ban đầu.
                      Khác với Payback Period thông thường, DPP có tính đến giá trị thời gian của tiền.
                    </p>
                    <div className="p-4 bg-muted/30 rounded-xl font-mono text-sm border border-border/30">
                      <div className="text-chart-3 font-semibold mb-2">Công thức:</div>
                      DPP = n + |Cumulative PVₙ| / PVₙ₊₁
                    </div>
                    <div className="p-4 rounded-xl bg-chart-3/10 border border-chart-3/20">
                      <h4 className="font-semibold text-sm mb-2">Ý nghĩa:</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• <strong>n</strong>: Năm cuối cùng có tích lũy âm</li>
                        <li>• DPP ngắn hơn → Rủi ro thanh khoản thấp hơn</li>
                        <li>• Phù hợp đánh giá dự án có yêu cầu hoàn vốn nhanh</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="dscr" className="border border-border/30 rounded-xl px-4 bg-card/30 backdrop-blur">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-chart-4/20">
                      <Scale className="w-5 h-5 text-chart-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">DSCR - Tỷ lệ khả năng trả nợ</div>
                      <div className="text-sm text-muted-foreground">Debt Service Coverage Ratio</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4 pt-2">
                    <p className="text-muted-foreground">
                      DSCR đo lường khả năng trả nợ của dự án từ dòng tiền hoạt động. Đây là chỉ số 
                      quan trọng nhất mà ngân hàng và tổ chức tài trợ xem xét khi cấp vốn vay.
                    </p>
                    <div className="p-4 bg-muted/30 rounded-xl font-mono text-sm border border-border/30">
                      <div className="text-chart-4 font-semibold mb-2">Công thức:</div>
                      DSCR = CFADS / Nghĩa vụ nợ (Gốc + Lãi)
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                        <div className="text-red-500 font-bold text-lg">&lt; 1.0</div>
                        <div className="text-xs text-muted-foreground">Không đủ trả nợ</div>
                      </div>
                      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
                        <div className="text-yellow-500 font-bold text-lg">1.0 - 1.2</div>
                        <div className="text-xs text-muted-foreground">Mức tối thiểu</div>
                      </div>
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                        <div className="text-green-500 font-bold text-lg">&gt; 1.5</div>
                        <div className="text-xs text-muted-foreground">An toàn</div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="wacc" className="border border-border/30 rounded-xl px-4 bg-card/30 backdrop-blur">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-chart-5/20">
                      <PieChart className="w-5 h-5 text-chart-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">WACC - Chi phí vốn bình quân gia quyền</div>
                      <div className="text-sm text-muted-foreground">Weighted Average Cost of Capital</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4 pt-2">
                    <p className="text-muted-foreground">
                      WACC là tỷ lệ chiết khấu phản ánh chi phí cơ hội của vốn đầu tư, được tính dựa trên 
                      cấu trúc vốn của dự án (tỷ lệ nợ/vốn chủ sở hữu).
                    </p>
                    <div className="p-4 bg-muted/30 rounded-xl font-mono text-sm border border-border/30">
                      <div className="text-chart-5 font-semibold mb-2">Công thức:</div>
                      WACC = D/(D+E) × rD × (1-T) + E/(D+E) × rE
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Các thành phần:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• <strong>D, E</strong>: Tỷ lệ nợ vay, vốn chủ sở hữu</li>
                          <li>• <strong>rD</strong>: Lãi suất vay</li>
                          <li>• <strong>rE</strong>: Tỷ suất sinh lời kỳ vọng của vốn CSH</li>
                          <li>• <strong>T</strong>: Thuế suất TNDN</li>
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl bg-chart-5/10 border border-chart-5/20 text-sm">
                        <strong>Lưu ý:</strong> WACC được tự động tính toán dựa trên thông số đầu vào của dự án.
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </GlassCard>
        </section>

        {/* Section: Sensitivity Analysis */}
        <section id="sensitivity">
          <GlassCard delay={0.2}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-chart-2/20">
                <BarChart3 className="w-8 h-8 text-chart-2" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Phân tích độ nhạy</h2>
                <p className="text-muted-foreground">Đánh giá tác động của các biến số đến kết quả dự án</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-2xl border border-border/30 bg-gradient-to-br from-orange-500/10 to-red-500/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl" />
                <div className="relative">
                  <LineChart className="w-10 h-10 text-orange-500 mb-4" />
                  <h3 className="font-bold text-lg mb-2">Biểu đồ Tornado</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Hiển thị mức độ ảnh hưởng của từng biến số đến kết quả. Biến có thanh dài nhất 
                    có ảnh hưởng lớn nhất.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-orange-500">
                    <Activity className="w-4 h-4" />
                    <span>Phân tích một chiều</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-2xl border border-border/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl" />
                <div className="relative">
                  <Activity className="w-10 h-10 text-blue-500 mb-4" />
                  <h3 className="font-bold text-lg mb-2">Biểu đồ Spider</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Thể hiện độ nhạy tương đối khi các biến thay đổi theo %. Độ dốc càng lớn, 
                    độ nhạy càng cao.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-blue-500">
                    <TrendingUp className="w-4 h-4" />
                    <span>So sánh đa biến</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-2xl border border-border/30 bg-gradient-to-br from-purple-500/10 to-pink-500/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl" />
                <div className="relative">
                  <PieChart className="w-10 h-10 text-purple-500 mb-4" />
                  <h3 className="font-bold text-lg mb-2">Ma trận 2D</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Phân tích đồng thời 2 biến số, tạo ma trận kết quả với màu sắc thể hiện 
                    mức độ khả thi.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-purple-500">
                    <Target className="w-4 h-4" />
                    <span>Phân tích hai chiều</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </GlassCard>
        </section>

        {/* Section: Monte Carlo */}
        <section id="montecarlo">
          <GlassCard delay={0.3}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-chart-3/20">
                <Dice5 className="w-8 h-8 text-chart-3" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Mô phỏng Monte Carlo</h2>
                <p className="text-muted-foreground">Đánh giá rủi ro qua hàng nghìn kịch bản ngẫu nhiên</p>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-chart-3" />
                  Các phân phối xác suất
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'Normal', desc: 'Phân phối chuẩn (μ, σ) - Dữ liệu đối xứng', color: 'bg-blue-500' },
                    { name: 'Triangular', desc: 'Min, Most likely, Max - Ước lượng 3 điểm', color: 'bg-green-500' },
                    { name: 'Uniform', desc: 'Phân phối đều (a, b) - Không có xu hướng', color: 'bg-yellow-500' },
                    { name: 'Lognormal', desc: 'Cho các giá trị luôn dương, có extreme', color: 'bg-orange-500' },
                    { name: 'PERT', desc: 'Cải tiến từ Triangular - Khuyến nghị', color: 'bg-purple-500' },
                  ].map((dist, i) => (
                    <motion.div 
                      key={dist.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30"
                    >
                      <div className={cn("w-3 h-3 rounded-full", dist.color)} />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{dist.name}</div>
                        <div className="text-xs text-muted-foreground">{dist.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-chart-3" />
                  Kết quả phân tích
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-chart-3/20 to-chart-3/5 border border-chart-3/20">
                    <div className="text-2xl font-bold text-chart-3">P10</div>
                    <div className="text-sm text-muted-foreground">10% kết quả thấp hơn</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-chart-1/20 to-chart-1/5 border border-chart-1/20">
                    <div className="text-2xl font-bold text-chart-1">P50</div>
                    <div className="text-sm text-muted-foreground">Giá trị trung vị</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-chart-2/20 to-chart-2/5 border border-chart-2/20">
                    <div className="text-2xl font-bold text-chart-2">P90</div>
                    <div className="text-sm text-muted-foreground">90% kết quả thấp hơn</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/5 border border-destructive/20">
                    <div className="text-2xl font-bold text-destructive">VaR</div>
                    <div className="text-sm text-muted-foreground">Value at Risk</div>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-500 font-semibold mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Xác suất NPV &gt; 0
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Phần trăm các kịch bản mô phỏng cho kết quả NPV dương
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-5 rounded-2xl bg-gradient-to-r from-chart-3/10 via-card to-chart-4/10 border border-border/30">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-chart-3" />
                Quy trình mô phỏng 5 bước
              </h4>
              <div className="grid md:grid-cols-5 gap-4">
                {[
                  { step: 1, title: 'Xác định biến', desc: 'Chọn biến không chắc chắn' },
                  { step: 2, title: 'Gán phân phối', desc: 'Chọn loại phân phối phù hợp' },
                  { step: 3, title: 'Chạy mô phỏng', desc: '1,000 - 10,000 lần' },
                  { step: 4, title: 'Tính toán', desc: 'NPV, IRR cho mỗi lần' },
                  { step: 5, title: 'Phân tích', desc: 'Thống kê và đánh giá' },
                ].map((item, i) => (
                  <div key={item.step} className="relative">
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-chart-3/20 text-chart-3 font-bold text-lg flex items-center justify-center mx-auto mb-2">
                        {item.step}
                      </div>
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                    {i < 4 && (
                      <ArrowRight className="absolute top-5 -right-2 w-4 h-4 text-muted-foreground hidden md:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Section: Guide */}
        <section id="guide">
          <GlassCard delay={0.4}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <HelpCircle className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Hướng dẫn sử dụng</h2>
                <p className="text-muted-foreground">Các bước thao tác chi tiết với công cụ</p>
              </div>
            </div>
            
            <Accordion type="multiple" className="w-full space-y-3">
              <AccordionItem value="excel" className="border border-border/30 rounded-xl px-4 bg-card/30">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <FileSpreadsheet className="w-5 h-5 text-green-500" />
                    </div>
                    <span className="font-semibold">Nhập dữ liệu từ Excel</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4 pt-2">
                    <div className="grid md:grid-cols-5 gap-3">
                      {[
                        { step: 1, text: 'Tải file mẫu Excel' },
                        { step: 2, text: 'Điền thông số dự án' },
                        { step: 3, text: 'Điền công suất theo năm' },
                        { step: 4, text: 'Upload và xem trước' },
                        { step: 5, text: 'Nhấn "Nhập dữ liệu"' },
                      ].map((item) => (
                        <div key={item.step} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                          <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 font-bold text-xs flex items-center justify-center">
                            {item.step}
                          </div>
                          <span className="text-sm text-muted-foreground">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="scenario" className="border border-border/30 rounded-xl px-4 bg-card/30">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Save className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="font-semibold">Lưu và tải kịch bản</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4 pt-2">
                    <ol className="space-y-2">
                      {[
                        'Điền đầy đủ thông số dự án',
                        'Đặt tên cho kịch bản và mô tả',
                        'Nhấn "Lưu kịch bản" để lưu vào bộ nhớ',
                        'Các kịch bản đã lưu hiển thị trong danh sách',
                        'Nhấn "Tải" để khôi phục kịch bản',
                      ].map((text, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 font-bold text-xs flex items-center justify-center">
                            {i + 1}
                          </div>
                          <span className="text-sm text-muted-foreground">{text}</span>
                        </li>
                      ))}
                    </ol>
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
                      <span className="text-yellow-500">⚠️</span> Kịch bản được lưu trong localStorage của trình duyệt
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="compare" className="border border-border/30 rounded-xl px-4 bg-card/30">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <GitCompare className="w-5 h-5 text-purple-500" />
                    </div>
                    <span className="font-semibold">So sánh nhiều dự án</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4 pt-2">
                    <ol className="space-y-2">
                      {[
                        'Chuyển sang tab "So sánh dự án"',
                        'Thêm dự án mới hoặc nhân bản từ dự án hiện tại',
                        'Điều chỉnh thông số cho từng dự án',
                        'Nhấn "Tính toán & So sánh"',
                        'Xem biểu đồ so sánh và bảng tổng hợp',
                        'Hệ thống sẽ đề xuất dự án tối ưu',
                      ].map((text, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 font-bold text-xs flex items-center justify-center">
                            {i + 1}
                          </div>
                          <span className="text-sm text-muted-foreground">{text}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </GlassCard>
        </section>

        {/* Section: Glossary */}
        <section id="glossary">
          <GlassCard delay={0.5}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-secondary/20">
                <BookMarked className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Thuật ngữ chuyên ngành</h2>
                <p className="text-muted-foreground">Giải thích các khái niệm tài chính quan trọng</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { term: 'TIPV', full: 'Total Investment Point of View', desc: 'Quan điểm tổng đầu tư - không tính cấu trúc vốn' },
                { term: 'EPV', full: 'Equity Point of View', desc: 'Quan điểm chủ sở hữu - sau khi trả nợ' },
                { term: 'CFADS', full: 'Cash Flow Available for Debt Service', desc: 'Dòng tiền khả dụng cho trả nợ' },
                { term: 'FCF', full: 'Free Cash Flow', desc: 'Dòng tiền tự do sau đầu tư' },
                { term: 'EBITDA', full: 'Earnings Before Interest, Taxes, Depreciation', desc: 'Lợi nhuận trước lãi vay, thuế, khấu hao' },
                { term: 'Working Capital', full: 'Vốn lưu động', desc: 'Vốn lưu động ròng = TSNH - NNH' },
              ].map((item, i) => (
                <motion.div
                  key={item.term}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="p-4 rounded-xl bg-muted/30 border border-border/30 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <GraduationCap className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <dt className="font-bold text-primary">{item.term}</dt>
                      <dd className="text-xs text-muted-foreground mb-1">{item.full}</dd>
                      <dd className="text-sm">{item.desc}</dd>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </section>

        {/* Section: Real Examples */}
        <section id="examples">
          <GlassCard delay={0.6}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <Lightbulb className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Ví dụ thực tế</h2>
                <p className="text-muted-foreground">Case studies từ các dự án điển hình</p>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="p-6 rounded-2xl border border-border/30 bg-gradient-to-br from-yellow-500/10 via-card to-orange-500/10 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-yellow-500/20">
                      <Zap className="w-6 h-6 text-yellow-500" />
                    </div>
                    <h3 className="font-bold text-xl">Dự án điện mặt trời 50MW</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-yellow-500">Thông số đầu vào</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Công suất: 50 MW</li>
                        <li>• Tổng vốn đầu tư: 1,000 tỷ VND</li>
                        <li>• Tỷ lệ vay: 70%</li>
                        <li>• Lãi suất: 10%/năm</li>
                        <li>• Giá bán điện: 1,900 VND/kWh</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-green-500">Kết quả phân tích</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• NPV (TIPV): <span className="text-green-500 font-medium">250 tỷ VND</span></li>
                        <li>• IRR (TIPV): <span className="text-green-500 font-medium">14.5%</span></li>
                        <li>• DPP: 8.5 năm</li>
                        <li>• DSCR trung bình: 1.35</li>
                        <li>• P(NPV &gt; 0): <span className="text-green-500 font-medium">85%</span></li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 inline mr-2" />
                    <strong className="text-green-500">Kết luận:</strong> Dự án khả thi với IRR cao hơn WACC
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                className="p-6 rounded-2xl border border-border/30 bg-gradient-to-br from-blue-500/10 via-card to-cyan-500/10 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-blue-500/20">
                      <Target className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="font-bold text-xl">Nhà máy sản xuất công nghiệp</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-blue-500">Thông số đầu vào</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Công suất: 100,000 sp/năm</li>
                        <li>• Tổng vốn đầu tư: 500 tỷ VND</li>
                        <li>• Tỷ lệ vay: 60%</li>
                        <li>• Giá bán: 5 triệu/sp</li>
                        <li>• Chi phí biến đổi: 3 triệu/sp</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-orange-500">Phân tích độ nhạy</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Biến nhạy nhất: <span className="text-orange-500">Giá bán</span></li>
                        <li>• -15% giá → NPV âm</li>
                        <li>• Chi phí NL: ảnh hưởng TB</li>
                        <li>• Điểm hòa vốn: 75,000 sp/năm</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 inline mr-2" />
                    <strong className="text-yellow-500">Lưu ý:</strong> Cần kiểm soát chặt giá bán và công suất
                  </div>
                </div>
              </motion.div>
            </div>
          </GlassCard>
        </section>

        {/* Section: Best Practices */}
        <section id="best-practices">
          <GlassCard delay={0.7}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-green-500/20">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Best Practices</h2>
                <p className="text-muted-foreground">Thực hành tốt nhất khi phân tích dự án</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                  Nên làm
                </h3>
                {[
                  { title: 'Xác thực dữ liệu đầu vào', desc: 'Kiểm tra tính hợp lý: giá cả thị trường, chi phí đầu tư chuẩn ngành' },
                  { title: 'Sử dụng nhiều kịch bản', desc: 'Tạo ít nhất 3 kịch bản: Bi quan, Cơ sở, Lạc quan' },
                  { title: 'Chạy Monte Carlo đủ lần', desc: 'Tối thiểu 1,000 lần, khuyến nghị 5,000-10,000 lần' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                  Tránh làm
                </h3>
                {[
                  { title: 'Ước tính quá lạc quan', desc: 'Không đánh giá thấp chi phí, không đánh giá cao doanh thu' },
                  { title: 'Bỏ qua chi phí ẩn', desc: 'Tính đủ: vốn lưu động, chi phí tài chính, dự phòng' },
                  { title: 'Chỉ xem DSCR trung bình', desc: 'Kiểm tra DSCR từng năm, đặc biệt các năm đầu vay nợ' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Section: FAQ */}
        <section id="faq">
          <GlassCard delay={0.8}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <MessageCircleQuestion className="w-8 h-8 text-purple-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Câu hỏi thường gặp</h2>
                <p className="text-muted-foreground">Giải đáp các thắc mắc phổ biến</p>
              </div>
            </div>
            
            <Accordion type="multiple" className="w-full space-y-3">
              {[
                {
                  q: 'NPV âm nhưng IRR vẫn dương, tại sao?',
                  a: 'IRR là tỷ lệ chiết khấu làm NPV = 0. Nếu IRR < WACC, dự án vẫn có IRR dương nhưng NPV âm vì chi phí vốn cao hơn tỷ suất sinh lời thực tế. Trong trường hợp này, dự án không khả thi.'
                },
                {
                  q: 'Nên sử dụng NPV TIPV hay EPV để đánh giá dự án?',
                  a: 'TIPV để so sánh các dự án khác nhau (không phụ thuộc cấu trúc vốn). EPV để ra quyết định đầu tư cuối cùng (lợi ích thực tế của nhà đầu tư). Khuyến nghị: Sử dụng cả hai để có cái nhìn toàn diện.'
                },
                {
                  q: 'Số lần mô phỏng Monte Carlo bao nhiêu là đủ?',
                  a: '500-1,000: Ước lượng sơ bộ. 1,000-5,000: Đủ cho hầu hết dự án. 5,000-10,000: Kết quả ổn định, độ tin cậy cao. >10,000: Dự án phức tạp. Khuyến nghị: 5,000 lần cho báo cáo chính thức.'
                },
                {
                  q: 'WACC nên tính như thế nào cho dự án mới?',
                  a: 'rD (lãi suất vay): Lãi suất ngân hàng hiện tại. rE (chi phí vốn CSH): Có thể dùng CAPM hoặc benchmark ngành, thông thường 12-18% tùy rủi ro. Nếu không có CAPM, dùng rE = rD + 4-6% risk premium.'
                },
                {
                  q: 'Làm thế nào để chọn phân phối xác suất phù hợp?',
                  a: 'Normal: Dữ liệu lịch sử nhiều, biến đổi đối xứng. Triangular/PERT: Chỉ ước lượng được Min, Max, Most Likely. Uniform: Không có thông tin về xu hướng tập trung. Lognormal: Giá trị luôn dương, có extreme values.'
                },
                {
                  q: 'Dữ liệu có được lưu trữ an toàn không?',
                  a: 'Tất cả dữ liệu được lưu trong localStorage của trình duyệt. Dữ liệu chỉ lưu trên máy tính của bạn, không gửi lên server. Xóa cache trình duyệt sẽ mất dữ liệu. Nên xuất file Excel để backup.'
                },
              ].map((item, i) => (
                <AccordionItem key={i} value={`faq${i}`} className="border border-border/30 rounded-xl px-4 bg-card/30">
                  <AccordionTrigger className="hover:no-underline py-4 text-left">
                    <span className="font-semibold">{item.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <p className="text-muted-foreground p-4 bg-muted/30 rounded-xl">{item.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </GlassCard>
        </section>

        {/* Section: Standards */}
        <section id="standards">
          <GlassCard delay={0.9}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Tiêu chuẩn đánh giá dự án</h2>
                <p className="text-muted-foreground">Ngưỡng tham khảo cho các chỉ số quan trọng</p>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-border/30">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/30">
                    <th className="text-left p-4 font-semibold">Chỉ số</th>
                    <th className="text-center p-4 font-semibold text-red-500">❌ Không đạt</th>
                    <th className="text-center p-4 font-semibold text-yellow-500">⚠️ Chấp nhận</th>
                    <th className="text-center p-4 font-semibold text-green-500">✓ Tốt</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    { metric: 'NPV', bad: '< 0', ok: '0 - 10% vốn ĐT', good: '> 10% vốn ĐT' },
                    { metric: 'IRR', bad: '< WACC', ok: 'WACC - WACC+5%', good: '> WACC + 5%' },
                    { metric: 'DPP', bad: '> 70% vòng đời', ok: '50-70% vòng đời', good: '< 50% vòng đời' },
                    { metric: 'DSCR (min)', bad: '< 1.0', ok: '1.0 - 1.2', good: '> 1.2' },
                    { metric: 'DSCR (avg)', bad: '< 1.2', ok: '1.2 - 1.5', good: '> 1.5' },
                    { metric: 'P(NPV > 0)', bad: '< 60%', ok: '60% - 80%', good: '> 80%' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-medium text-foreground">{row.metric}</td>
                      <td className="p-4 text-center">{row.bad}</td>
                      <td className="p-4 text-center">{row.ok}</td>
                      <td className="p-4 text-center">{row.good}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm">
              <strong className="text-blue-500">📌 Lưu ý:</strong> Tiêu chuẩn trên mang tính tham khảo. Mỗi ngành và loại dự án 
              có thể có tiêu chuẩn riêng. Ngân hàng thường yêu cầu DSCR min ≥ 1.2 và DSCR avg ≥ 1.3-1.5.
            </div>
          </GlassCard>
        </section>

        {/* Section: References */}
        <section id="references">
          <GlassCard delay={1.0}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-cyan-500/20">
                <ExternalLink className="w-8 h-8 text-cyan-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Tài liệu tham khảo</h2>
                <p className="text-muted-foreground">Nguồn tài liệu và phương pháp học thuật</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="p-5 rounded-xl bg-card/50 border border-border/30">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-500" />
                  Sách và giáo trình
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {[
                    'Brealey, Myers & Allen - "Principles of Corporate Finance"',
                    'Damodaran - "Investment Valuation"',
                    'Yescombe - "Principles of Project Finance"',
                    'Vose - "Risk Analysis: A Quantitative Guide"',
                  ].map((book, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-500" />
                      <span>{book}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="p-5 rounded-xl bg-card/50 border border-border/30">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-cyan-500" />
                  Tiêu chuẩn và hướng dẫn
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {[
                    'IFC - Project Finance Guidelines',
                    'ADB - Financial Management Guidelines',
                    'World Bank - Economic Analysis Guidelines',
                    'PMI - Project Risk Management Standard',
                  ].map((doc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <FileSpreadsheet className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-500" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-muted/30 border border-border/30">
              <h3 className="font-semibold mb-4">Công thức và phương pháp được sử dụng</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div className="p-3 rounded-lg bg-card/50">
                  <h4 className="font-medium text-foreground mb-1">IRR Calculation</h4>
                  <p>Newton-Raphson iteration với độ chính xác 0.0001%</p>
                </div>
                <div className="p-3 rounded-lg bg-card/50">
                  <h4 className="font-medium text-foreground mb-1">Monte Carlo</h4>
                  <p>Box-Muller transform, Inverse CDF methods</p>
                </div>
                <div className="p-3 rounded-lg bg-card/50">
                  <h4 className="font-medium text-foreground mb-1">Sensitivity</h4>
                  <p>One-at-a-time (OAT) analysis</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Section: Version */}
        <section id="version">
          <GlassCard delay={1.1}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-primary/20">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Phiên bản & Tính năng</h2>
                <p className="text-muted-foreground">Lịch sử phát triển và cập nhật</p>
              </div>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="p-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-secondary/10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
              <div className="relative flex items-start gap-6">
                <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl font-bold text-primary">1.0</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-xl">Crystal Ball v1.0</h3>
                    <span className="px-3 py-1 rounded-full text-xs bg-primary/20 text-primary font-medium">Latest</span>
                  </div>
                  <p className="text-muted-foreground mb-4">Phiên bản đầu tiên với đầy đủ tính năng phân tích tài chính dự án</p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      '✓ NPV, IRR, DPP, DSCR',
                      '✓ Phân tích độ nhạy',
                      '✓ Monte Carlo Simulation',
                      '✓ So sánh nhiều dự án',
                      '✓ Import/Export Excel',
                      '✓ Lưu và tải kịch bản',
                      '✓ Biểu đồ dòng tiền',
                      '✓ Xuất báo cáo PDF',
                    ].map((feature, i) => (
                      <div key={i} className="text-sm text-muted-foreground px-3 py-2 rounded-lg bg-card/50">
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </GlassCard>
        </section>
      </motion.div>
    </div>
  );
};
