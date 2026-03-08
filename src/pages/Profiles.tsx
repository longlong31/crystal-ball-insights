import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  User, Mail, Phone, Save, ArrowLeft, Loader2, Camera, GraduationCap,
  FolderOpen, Trash2, Eye, Calendar, Calculator, TrendingUp, History,
  Sparkles, Shield, Activity, Award, Zap, ChevronRight
} from "lucide-react";
import { CrystalBallIcon } from "@/components/CrystalBallIcon";
import { Footer } from "@/components/Footer";
import { 
  ProjectScenario, loadAllProjectScenarios, deleteProjectScenario 
} from "@/lib/projectScenarioManager";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  education: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function Profiles() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    education: "",
  });
  const [projectScenarios, setProjectScenarios] = useState<ProjectScenario[]>([]);
  const [activeTab, setActiveTab] = useState("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        toast.error("Không thể tải thông tin hồ sơ");
        return;
      }

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          phone: data.phone || "",
          education: data.education || "",
        });
      }
      
      setProjectScenarios(loadAllProjectScenarios());
      setIsLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        phone: formData.phone || null,
        education: formData.education || null,
      })
      .eq("user_id", profile.user_id);

    if (error) {
      toast.error("Không thể cập nhật hồ sơ");
    } else {
      toast.success("Đã cập nhật hồ sơ thành công!");
      setProfile(prev => prev ? { ...prev, ...formData } : null);
    }
    setIsSaving(false);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước ảnh tối đa 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.user_id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", profile.user_id);
      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast.success("Đã cập nhật ảnh đại diện!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Không thể tải lên ảnh đại diện");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteScenario = (id: string) => {
    deleteProjectScenario(id);
    setProjectScenarios(loadAllProjectScenarios());
    toast.success("Đã xóa kịch bản dự án");
  };

  const handleViewScenario = (scenario: ProjectScenario) => {
    navigate("/project-analysis", { state: { scenario } });
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const formatNumber = (num: number) => new Intl.NumberFormat("vi-VN").format(num);

  const memberSince = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })
    : "";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto relative" />
          </div>
          <p className="mt-4 text-muted-foreground font-mono text-sm">Đang tải thông tin...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary) / 0.1) 2px, transparent 4px)',
        }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full group-hover:bg-primary/40 transition-colors" />
                <CrystalBallIcon className="w-10 h-10 relative" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary via-[hsl(var(--crystal-purple))] to-primary bg-clip-text text-transparent">
                Crystal Ball
              </span>
            </Link>
            <Button variant="outline" onClick={() => navigate(-1)} className="border-border/30 hover:bg-primary/10 hover:border-primary/30">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
          
          {/* Profile Hero Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card via-card/80 to-primary/5 mb-8"
          >
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-secondary/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/3" />
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }} />

            <div className="relative p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Avatar Section */}
                <motion.div 
                  className="relative group"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="absolute -inset-3 bg-gradient-to-r from-primary via-secondary to-primary rounded-full opacity-20 blur-lg group-hover:opacity-40 transition-opacity" />
                  <div className="relative">
                    <Avatar className="h-28 w-28 ring-4 ring-primary/20 ring-offset-4 ring-offset-card">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    <Button
                      size="icon"
                      className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 border-2 border-card"
                      onClick={handleAvatarClick}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
                      ) : (
                        <Camera className="w-4 h-4 text-primary-foreground" />
                      )}
                    </Button>
                  </div>
                </motion.div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {profile?.full_name || "Người dùng"}
                    </h1>
                    <Badge className="bg-primary/10 text-primary border-primary/30">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                  <p className="text-muted-foreground flex items-center gap-2 justify-center md:justify-start mb-4">
                    <Mail className="w-4 h-4" />
                    {profile?.email}
                  </p>
                  
                  {/* Quick Stats */}
                  <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/80 border border-border/30 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span className="text-muted-foreground">Thành viên từ</span>
                      <span className="font-mono font-medium">{memberSince}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/80 border border-border/30 text-sm">
                      <FolderOpen className="w-3.5 h-3.5 text-secondary" />
                      <span className="font-mono font-medium">{projectScenarios.length}</span>
                      <span className="text-muted-foreground">dự án</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/80 border border-border/30 text-sm">
                      <Award className="w-3.5 h-3.5 text-[hsl(var(--quant-amber))]" />
                      <span className="text-muted-foreground">Nhà phân tích</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full flex bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl p-1.5 gap-1 h-auto">
              <TabsTrigger 
                value="profile" 
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/15 data-[state=active]:to-secondary/10 data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-lg data-[state=active]:shadow-primary/5 transition-all duration-300"
              >
                <User className="w-4 h-4" />
                <span className="font-medium">Thông tin cá nhân</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/15 data-[state=active]:to-secondary/10 data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-lg data-[state=active]:shadow-primary/5 transition-all duration-300"
              >
                <History className="w-4 h-4" />
                <span className="font-medium">Lịch sử dự án</span>
                {projectScenarios.length > 0 && (
                  <Badge className="ml-1 bg-primary/20 text-primary border-0 font-mono text-xs">
                    {projectScenarios.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <TabsContent value="profile" className="space-y-6 mt-0">
                  {/* Edit Form */}
                  <Card className="border-border/30 bg-card/60 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="border-b border-border/20 bg-gradient-to-r from-primary/5 to-transparent">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Chỉnh sửa hồ sơ
                      </CardTitle>
                      <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        {[
                          { id: "full_name", label: "Họ và tên", icon: User, iconColor: "text-primary", placeholder: "Nguyễn Văn A", value: formData.full_name, field: "full_name" as const },
                          { id: "email", label: "Email", icon: Mail, iconColor: "text-[hsl(var(--quant-cyan))]", placeholder: "", value: profile?.email || "", field: null, disabled: true },
                          { id: "phone", label: "Số điện thoại", icon: Phone, iconColor: "text-[hsl(var(--quant-green))]", placeholder: "0901234567", value: formData.phone, field: "phone" as const },
                          { id: "education", label: "Học vấn", icon: GraduationCap, iconColor: "text-secondary", placeholder: "Đại học Kinh tế TP.HCM", value: formData.education, field: "education" as const },
                        ].map(item => (
                          <div key={item.id} className="space-y-2 group">
                            <Label htmlFor={item.id} className="flex items-center gap-2 text-sm font-medium">
                              <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                              {item.label}
                            </Label>
                            <Input
                              id={item.id}
                              value={item.value}
                              disabled={item.disabled}
                              onChange={item.field ? (e) => setFormData(prev => ({ ...prev, [item.field!]: e.target.value })) : undefined}
                              placeholder={item.placeholder}
                              className={`border-border/30 bg-background/50 focus:border-primary/50 focus:ring-primary/20 transition-all ${item.disabled ? 'bg-muted/30 opacity-60' : 'hover:border-border/60'}`}
                            />
                          </div>
                        ))}
                      </div>

                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <Button 
                          onClick={handleSave} 
                          className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/20 py-5 text-base"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang lưu...</>
                          ) : (
                            <><Save className="w-4 h-4 mr-2" /> Lưu thay đổi</>
                          )}
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>

                  {/* Account Info */}
                  <Card className="border-border/30 bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Thông tin tài khoản
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { label: "Ngày tạo tài khoản", value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" }) : "N/A" },
                        { label: "Cập nhật lần cuối", value: profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" }) : "N/A" },
                      ].map(item => (
                        <div key={item.label} className="flex justify-between items-center py-3 px-4 rounded-xl bg-background/30 border border-border/20 hover:border-border/40 transition-colors">
                          <span className="text-muted-foreground text-sm">{item.label}</span>
                          <Badge variant="outline" className="font-mono text-xs border-border/30">
                            {item.value}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-6 mt-0">
                  <Card className="border-border/30 bg-card/60 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="border-b border-border/20 bg-gradient-to-r from-primary/5 to-transparent">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-primary" />
                            Lịch sử dự án đã lưu
                          </CardTitle>
                          <CardDescription>Quản lý các kịch bản dự án bạn đã tạo</CardDescription>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/30 font-mono text-lg px-4 py-1.5">
                          {projectScenarios.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {projectScenarios.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                          <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-card to-primary/5 border border-border/30">
                              <FolderOpen className="w-16 h-16 text-muted-foreground/30" />
                            </div>
                          </div>
                          <h3 className="text-xl font-semibold mb-2">Chưa có dự án nào</h3>
                          <p className="text-muted-foreground max-w-md mx-auto mb-6">
                            Hãy vào Phân tích dự án để tạo và lưu kịch bản mới
                          </p>
                          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button 
                              className="bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/20"
                              onClick={() => navigate("/project")}
                            >
                              <Calculator className="w-4 h-4 mr-2" />
                              Tạo dự án mới
                              <Zap className="w-4 h-4 ml-1 opacity-60" />
                            </Button>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <div className="space-y-3">
                          <AnimatePresence>
                            {projectScenarios.map((scenario, index) => (
                              <motion.div
                                key={scenario.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-r from-background/80 to-card/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                              >
                                {/* Hover glow */}
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/0 group-hover:from-primary/[0.02] group-hover:to-secondary/[0.02] transition-all duration-500" />
                                
                                <div className="relative p-5">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 border border-primary/20 shrink-0">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <h3 className="font-semibold text-base truncate">{scenario.name}</h3>
                                          <Badge variant="outline" className="text-xs border-border/30 font-mono shrink-0">
                                            {scenario.params.projectName}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3 font-mono">
                                          <Calendar className="w-3 h-3" />
                                          {formatDate(scenario.createdAt)}
                                        </p>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                          {[
                                            { label: "Vốn đầu tư", value: `${formatNumber(scenario.params.fixedAssetValue)} tr`, color: "text-primary" },
                                            { label: "Thời gian", value: `${scenario.params.operationYears} năm`, color: "text-foreground" },
                                            { label: "Tỷ lệ vay", value: `${scenario.params.debtRatio}%`, color: "text-[hsl(var(--quant-amber))]" },
                                            { label: "Lãi suất", value: `${scenario.params.nominalInterestRate}%`, color: "text-[hsl(var(--quant-cyan))]" },
                                          ].map(item => (
                                            <div key={item.label} className="p-2.5 rounded-lg bg-background/50 border border-border/20">
                                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{item.label}</p>
                                              <p className={`font-mono font-semibold text-sm ${item.color}`}>{item.value}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewScenario(scenario)}
                                        className="border-primary/30 hover:bg-primary/10 hover:border-primary group/btn"
                                      >
                                        <Eye className="w-4 h-4 mr-1.5" />
                                        Xem
                                        <ChevronRight className="w-3 h-3 ml-1 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteScenario(scenario.id)}
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
