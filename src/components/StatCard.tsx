import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  delay?: number;
  className?: string;
}

export const StatCard = ({ label, value, icon, trend, delay = 0, className }: StatCardProps) => {
  const trendColors = {
    up: "text-success",
    down: "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "glass rounded-xl p-4 flex flex-col gap-2",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon && <span className="text-primary">{icon}</span>}
      </div>
      <div className={cn("text-2xl font-semibold font-mono", trend && trendColors[trend])}>
        {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
      </div>
    </motion.div>
  );
};
