import { motion } from "framer-motion";

export const CrystalBallIcon = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Crystal ball */}
      <motion.div
        className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 via-secondary/20 to-crystal-blue/30 border border-primary/40 backdrop-blur-sm"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Inner glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/20 to-transparent" />
        
        {/* Highlight */}
        <div className="absolute top-3 left-4 w-4 h-4 rounded-full bg-foreground/30 blur-sm" />
        
        {/* Sparkles */}
        <motion.div
          className="absolute top-6 right-6 w-1.5 h-1.5 rounded-full bg-primary"
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="absolute bottom-8 left-5 w-1 h-1 rounded-full bg-secondary"
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
        />
        <motion.div
          className="absolute top-10 left-8 w-1 h-1 rounded-full bg-crystal-glow"
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.4 }}
        />
      </motion.div>
      
      {/* Base */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-gradient-to-t from-muted to-muted/50 rounded-b-full" />
    </div>
  );
};
