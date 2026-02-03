import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Plus, MessageSquare, Calendar, FileText, 
  Image, Video, FileIcon, Send, Heart, Share2,
  Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { CommunityPostForm } from "@/components/community/CommunityPostForm";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { CommunityAdminPanel } from "@/components/community/CommunityAdminPanel";

export default function Community() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const { toast } = useToast();

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
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Cộng đồng</h1>
            </div>
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
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="feed" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="feed" className="data-[state=active]:bg-primary/20">
              <MessageSquare className="w-4 h-4 mr-2" />
              Bài viết
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

          <TabsContent value="events">
            <CommunityFeed postType="event" />
          </TabsContent>

          <TabsContent value="blogs">
            <CommunityFeed postType="blog" />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <CommunityAdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </main>

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
