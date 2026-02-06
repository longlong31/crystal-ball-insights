import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
 import { Users, Plus, MessageSquare, Calendar, FileText, AlertCircle, Newspaper } from "lucide-react";
 import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { CommunityPostForm } from "@/components/community/CommunityPostForm";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { CommunityAdminPanel } from "@/components/community/CommunityAdminPanel";
 import { NewsFeed } from "@/components/community/NewsFeed";
 import { Footer } from "@/components/Footer";

export default function Community() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);

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
    <div className="min-h-screen bg-background">
       <AppHeader />

       <main className="container py-8">
         <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-2">
             <Users className="w-6 h-6 text-primary" />
             <h1 className="text-2xl font-bold">Cộng đồng</h1>
           </div>
           {user && (
             <Button 
               onClick={() => setShowPostForm(true)}
               className="bg-gradient-to-r from-primary to-purple-500"
             >
               <Plus className="w-4 h-4 mr-2" />
               Đăng bài
             </Button>
           )}
         </div>
 
        <Tabs defaultValue="feed" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="feed" className="data-[state=active]:bg-primary/20">
              <MessageSquare className="w-4 h-4 mr-2" />
              Bài viết
            </TabsTrigger>
             <TabsTrigger value="news" className="data-[state=active]:bg-primary/20">
               <Newspaper className="w-4 h-4 mr-2" />
               Tin tức
             </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-primary/20">
              <Calendar className="w-4 h-4 mr-2" />
              Sự kiện
            </TabsTrigger>
            <TabsTrigger value="blogs" className="data-[state=active]:bg-primary/20">
              <FileText className="w-4 h-4 mr-2" />
              Blog
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="data-[state=active]:bg-primary/20">
                <AlertCircle className="w-4 h-4 mr-2" />
                Duyệt bài
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="feed">
            <CommunityFeed postType="discussion" />
          </TabsContent>
 
          <TabsContent value="news">
            <NewsFeed category="news" />
          </TabsContent>

          <TabsContent value="events">
            <NewsFeed category="event" />
          </TabsContent>

          <TabsContent value="blogs">
            <NewsFeed category="blog" />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <CommunityAdminPanel />
            </TabsContent>
          )}
        </Tabs>
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
