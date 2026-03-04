import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CrystalBallIcon } from "./CrystalBallIcon";
import { Sparkles, Target, BarChart3, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export const HeroSection = () => {
  const { t } = useLanguage();
  
  const features = [
    { icon: <Target className="w-5 h-5" />, text: t("hero.feature1") },
    { icon: <BarChart3 className="w-5 h-5" />, text: t("hero.feature2") },
    { icon: <Shield className="w-5 h-5" />, text: t("hero.feature3") },
  ];

  return (
    <section className="relative py-16 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-glow opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      
      <div className="container relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
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
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-foreground">Crystal Ball</span>
              <br />
              <span className="text-primary glow-text">{t("hero.subtitle")}</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              {t("hero.description")}
            </p>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border text-sm"
                >
                  <span className="text-primary">{feature.icon}</span>
                  <span className="text-foreground">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-8 flex flex-wrap justify-center lg:justify-start gap-3"
            >
              <Link to="/platform">
                <Button size="lg" className="gap-2 text-base">
                  <Sparkles className="w-4 h-4" />
                  Launch Quant Platform
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex-shrink-0"
          >
            <CrystalBallIcon className="w-48 h-48 md:w-56 md:h-56" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
