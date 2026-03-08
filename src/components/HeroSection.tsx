import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CrystalBallIcon } from "./CrystalBallIcon";
import { Sparkles, Target, BarChart3, Shield, ArrowRight, Zap, TrendingUp, Brain, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const FloatingParticle = ({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/20"
    style={{ left: x, top: y, width: size, height: size }}
    animate={{
      y: [0, -20, 0],
      opacity: [0.3, 0.7, 0.3],
      scale: [1, 1.2, 1],
    }}
    transition={{ duration: 3 + delay, repeat: Infinity, delay }}
  />
);

const StatBadge = ({ value, label, delay }: { value: string; label: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: "spring", stiffness: 200 }}
    className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl glass border border-border/50"
  >
    <span className="text-xl font-bold text-primary font-mono">{value}</span>
    <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</span>
  </motion.div>
);

export const HeroSection = () => {
  const { t, language } = useLanguage();

  const features = [
    { icon: <Target className="w-5 h-5" />, text: t("hero.feature1") },
    { icon: <BarChart3 className="w-5 h-5" />, text: t("hero.feature2") },
    { icon: <Shield className="w-5 h-5" />, text: t("hero.feature3") },
  ];

  const modules = [
    { icon: TrendingUp, label: language === "vi" ? "Phân tích cổ phiếu" : "Stock Analysis", color: "text-emerald-400" },
    { icon: Brain, label: language === "vi" ? "AI Insights" : "AI Insights", color: "text-violet-400" },
    { icon: Zap, label: language === "vi" ? "Tối ưu danh mục" : "Portfolio Optimizer", color: "text-amber-400" },
    { icon: FlaskConical, label: language === "vi" ? "Phòng thí nghiệm" : "Algorithm Lab", color: "text-cyan-400" },
  ];

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/[0.07] blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-500/[0.05] blur-[80px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Floating particles */}
      <FloatingParticle delay={0} x="10%" y="20%" size={6} />
      <FloatingParticle delay={1.2} x="80%" y="15%" size={4} />
      <FloatingParticle delay={0.5} x="65%" y="70%" size={8} />
      <FloatingParticle delay={2} x="25%" y="80%" size={5} />
      <FloatingParticle delay={1.5} x="90%" y="50%" size={3} />

      <div className="container relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="flex-1 text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6"
            >
              <Sparkles className="w-4 h-4" />
              {t("hero.badge")}
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="block text-foreground"
              >
                Crystal Ball
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="block bg-gradient-to-r from-primary via-primary/80 to-violet-400 bg-clip-text text-transparent"
              >
                {t("hero.subtitle")}
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              {t("hero.description")}
            </motion.p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-border/50 text-sm cursor-default"
                >
                  <span className="text-primary">{feature.icon}</span>
                  <span className="text-foreground">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex flex-wrap justify-center lg:justify-start gap-3"
            >
              <Link to="/platform">
                <Button size="xl" variant="glow" className="gap-2 text-base font-semibold">
                  <Sparkles className="w-5 h-5" />
                  {language === "vi" ? "Khám phá Quant Platform" : "Launch Quant Platform"}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/algorithms">
                <Button size="lg" variant="crystal" className="gap-2 text-base">
                  <FlaskConical className="w-4 h-4" />
                  {language === "vi" ? "Phòng thí nghiệm" : "Algorithm Lab"}
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right side - Crystal ball + modules grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex-shrink-0 relative"
          >
            {/* Glow behind crystal ball */}
            <div className="absolute inset-0 bg-primary/10 blur-[60px] rounded-full scale-150" />

            <div className="relative">
              <CrystalBallIcon className="w-52 h-52 md:w-64 md:h-64 relative z-10" />

              {/* Orbiting modules */}
              {modules.map((mod, i) => {
                const Icon = mod.icon;
                const angle = (i * 90 - 45) * (Math.PI / 180);
                const radius = 140;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + i * 0.15, type: "spring" }}
                    className="absolute top-1/2 left-1/2 z-20"
                    style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.15 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg glass border border-border/50 shadow-lg cursor-default whitespace-nowrap"
                    >
                      <Icon className={`w-4 h-4 ${mod.color}`} />
                      <span className="text-xs font-medium text-foreground">{mod.label}</span>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* Stats below crystal ball */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="flex justify-center gap-3 mt-8"
            >
              <StatBadge value="15K+" label={language === "vi" ? "Mô phỏng" : "Simulations"} delay={1.6} />
              <StatBadge value="6+" label={language === "vi" ? "Mô-đun" : "Modules"} delay={1.7} />
              <StatBadge value="AI" label={language === "vi" ? "Hỗ trợ" : "Powered"} delay={1.8} />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
