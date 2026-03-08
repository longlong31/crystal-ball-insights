import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Plus, MessageSquare, Calendar, FileText, AlertCircle, Newspaper,
  Sparkles, TrendingUp, Activity, Globe, Zap
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CommunityPostForm } from "@/components/community/CommunityPostForm";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { CommunityAdminPanel } from "@/components/community/CommunityAdminPanel";
import { NewsFeed } from "@/components/community/NewsFeed";
import { Footer } from "@/components/Footer";

const statCards = [
  { icon: MessageSquare, label: "Bài viết", value: "∞", color: "from-primary to-primary/60" },
  { icon: Users, label: "Thành viên", value: "Live", color: "from-secondary to-secondary/60" },
  { icon: Activity, label: "Hoạt động", value: "24/7", color: "from-[hsl(var(--quant-green))] to-[hsl(var(--quant-green)/0.6)]" },
  { icon: Globe, label: "Kết nối", value: "Real-time", color: "from-[hsl(var(--quant-cyan))] to-[hsl(var(--quant-cyan)/0.6)]" },
];

const tabs = [
  { key: "feed", icon: MessageSquare, label: "Bài viết", desc: "Thảo luận cộng đồng" },
  { key: "news", icon: Newspaper, label: "Tin tức", desc: "Cập nhật thị trường" },
  { key: "events", icon: Calendar, label: "Sự kiện", desc: "Sự kiện & hội thảo" },
  { key: "blogs", icon: FileText, label: "Blog", desc: "Bài viết chuyên sâu" },
];

export default function Community() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();
        
        setIsAdmin(!!roles);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[hsl(var(--quant-cyan)/0.03)] rounded-full blur-[150px]" />
        {/* Scan line */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary) / 0.1) 2px, transparent 4px)',
        }} />
      </div>

      <AppHeader />

      <main className="container py-8 relative">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card via-card/80 to-primary/5 p-8 md:p-10">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />

            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <motion.div 
                  className="relative"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary blur-xl opacity-40 rounded-2xl" />
                  <div className="relative p-4 bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 rounded-2xl backdrop-blur-sm">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </motion.div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
                      Cộng đồng
                    </h1>
                    <Badge className="bg-primary/10 text-primary border-primary/30 font-mono text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--quant-green))] mr-1.5 animate-pulse" />
                      LIVE
                    </Badge>
                  </div>
                  <p className="text-muted-foreground max-w-lg">
                    <Sparkles className="w-4 h-4 text-primary inline mr-1.5" />
                    Kết nối với cộng đồng nhà đầu tư, chia sẻ phân tích và cập nhật xu hướng thị trường mới nhất
                  </p>
                </div>
              </div>

              {user && (
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button 
                    onClick={() => setShowPostForm(true)}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/20 text-base px-6 py-5"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Đăng bài mới
                    <Zap className="w-4 h-4 ml-1 opacity-60" />
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Stat Cards */}
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
              {statCards.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="group p-4 rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                      <stat.icon className="w-4 h-4 text-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="font-mono font-semibold text-sm">{stat.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="relative">
              <TabsList className="w-full flex bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl p-1.5 gap-1 h-auto">
                {tabs.map(tab => (
                  <TabsTrigger 
                    key={tab.key} 
                    value={tab.key} 
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/15 data-[state=active]:to-secondary/10 data-[state=active]:border-primary/30 data-[state=active]:border data-[state=active]:shadow-lg data-[state=active]:shadow-primary/5 transition-all duration-300"
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">{tab.label}</span>
                  </TabsTrigger>
                ))}
                {isAdmin && (
                  <TabsTrigger 
                    value="admin" 
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg data-[state=active]:bg-destructive/10 data-[state=active]:border-destructive/30 data-[state=active]:border transition-all duration-300"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Duyệt bài</span>
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Active tab description */}
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-3 flex items-center gap-2"
              >
                <div className="w-1 h-4 rounded-full bg-primary" />
                <p className="text-sm text-muted-foreground font-mono">
                  {tabs.find(t => t.key === activeTab)?.desc || "Quản lý nội dung"}
                </p>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="feed" className="mt-0">
                  <CommunityFeed postType="discussion" />
                </TabsContent>

                <TabsContent value="news" className="mt-0">
                  <NewsFeed category="news" />
                </TabsContent>

                <TabsContent value="events" className="mt-0">
                  <NewsFeed category="event" />
                </TabsContent>

                <TabsContent value="blogs" className="mt-0">
                  <NewsFeed category="blog" />
                </TabsContent>

                {isAdmin && (
                  <TabsContent value="admin" className="mt-0">
                    <CommunityAdminPanel />
                  </TabsContent>
                )}
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </main>

      <Footer />

      {/* Post Form Modal */}
      <AnimatePresence>
        {showPostForm && (
          <CommunityPostForm 
            onClose={() => setShowPostForm(false)} 
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
