import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SimulationCardProps {
  children: ReactNode;
  className?: string;
  glowing?: boolean;
}

export const SimulationCard = ({ children, className, glowing = false }: SimulationCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "glass rounded-xl p-6 relative overflow-hidden",
        glowing && "glow",
        className
      )}
    >
      {glowing && (
        <div className="absolute inset-0 gradient-glow pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
