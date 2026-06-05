import { motion } from "framer-motion";
import { ExternalLink, Code2, TrendingUp, Briefcase, Mail, Sparkles } from "lucide-react";

export const CreatorInfo = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-card via-card/95 to-primary/5 border border-border/50 rounded-2xl p-6 backdrop-blur-sm"
    >
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative flex-shrink-0"
        >
          <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
            <img
              src="https://pjzaexnqorlrpctaqiiv.supabase.co/storage/v1/object/public/images/gallery/1773204699949-e5xy8i.jpg"
              alt="Quách Thành Long"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-primary-foreground" />
          </div>
        </motion.div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-foreground">Quách Thành Long</h3>
            <a
              href="https://quachthanhlong.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          <p className="text-sm text-primary font-medium mb-3">
            Investor | Web/Game Developer | Business Analyst
          </p>
          
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            CTO-level talent với niềm đam mê về công nghệ, kinh tế, và tạo ra những giải pháp sáng tạo 
            kết nối tầm nhìn với hiện thực.
          </p>

          {/* Skills */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
              <Code2 className="w-3.5 h-3.5 text-primary" />
              <span>Full-Stack Dev</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span>Business Analyst</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
              <Briefcase className="w-3.5 h-3.5 text-primary" />
              <span>Investment</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">25+</div>
              <div className="text-xs text-muted-foreground">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">800+</div>
              <div className="text-xs text-muted-foreground">Hours Learning</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">12+</div>
              <div className="text-xs text-muted-foreground">Clients</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 pt-4 border-t border-border/30"
      >
        <p className="text-sm italic text-muted-foreground text-center">
          "Tech gives me the tools, economics gives me the vision."
        </p>
      </motion.div>

      {/* Contact Button */}
      <motion.a
        href="https://quachthanhlong.com/contact"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-sm font-medium"
      >
        <Mail className="w-4 h-4" />
        Liên hệ tác giả
      </motion.a>
    </motion.div>
  );
};
