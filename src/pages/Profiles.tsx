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
  User, 
  Mail, 
  Phone, 
  Save, 
  ArrowLeft, 
  Loader2, 
  Camera, 
  GraduationCap,
  FolderOpen,
  Trash2,
  Eye,
  Calendar,
  Calculator,
  TrendingUp,
  History,
  Sparkles
} from "lucide-react";
import { CrystalBallIcon } from "@/components/CrystalBallIcon";
import { Footer } from "@/components/Footer";
import { 
  ProjectScenario, 
  loadAllProjectScenarios, 
  deleteProjectScenario 
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
      
      // Load project scenarios from localStorage
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

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
    // Navigate to project analysis with the scenario loaded
    navigate("/project-analysis", { state: { scenario } });
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải thông tin...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full group-hover:bg-primary/50 transition-colors" />
                <CrystalBallIcon className="w-12 h-12 relative" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Crystal Ball
              </span>
            </Link>
            <Button variant="outline" onClick={() => navigate(-1)} className="border-border/50 hover:bg-primary/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Hero Section */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 blur-xl opacity-50" />
              <div className="relative p-4 bg-gradient-to-r from-primary to-purple-500 rounded-2xl">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Hồ sơ cá nhân
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Quản lý thông tin tài khoản và lịch sử dự án
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
              <TabsTrigger 
                value="profile" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <User className="w-4 h-4" />
                Thông tin cá nhân
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <History className="w-4 h-4" />
                Lịch sử dự án
                {projectScenarios.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {projectScenarios.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-purple-500/5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary">
                          {getInitials(profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                      <Button
                        size="icon"
                        className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
                        onClick={handleAvatarClick}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <Camera className="w-4 h-4 text-white" />
                        )}
                      </Button>
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{profile?.full_name || "Người dùng"}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4" />
                        {profile?.email}
                      </CardDescription>
                      <p className="text-xs text-muted-foreground mt-2">
                        📷 Nhấn vào biểu tượng camera để đổi ảnh đại diện
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="flex items-center gap-2 text-sm font-medium">
                        <User className="w-4 h-4 text-primary" />
                        Họ và tên
                      </Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Nguyễn Văn A"
                        className="border-border/50 focus:border-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="w-4 h-4 text-blue-500" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        value={profile?.email || ""}
                        disabled
                        className="bg-muted/50 border-border/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="w-4 h-4 text-green-500" />
                        Số điện thoại
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="0901234567"
                        className="border-border/50 focus:border-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="education" className="flex items-center gap-2 text-sm font-medium">
                        <GraduationCap className="w-4 h-4 text-purple-500" />
                        Học vấn
                      </Label>
                      <Input
                        id="education"
                        value={formData.education}
                        onChange={e => setFormData(prev => ({ ...prev, education: e.target.value }))}
                        placeholder="Đại học Kinh tế TP.HCM"
                        className="border-border/50 focus:border-primary"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSave} 
                    className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Account Info Card */}
              <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Thông tin tài khoản
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">Ngày tạo tài khoản</span>
                    <Badge variant="outline">
                      {profile?.created_at 
                        ? new Date(profile.created_at).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                          })
                        : "N/A"
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">Cập nhật lần cuối</span>
                    <Badge variant="outline">
                      {profile?.updated_at 
                        ? new Date(profile.updated_at).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                          })
                        : "N/A"
                      }
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Project History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card className="border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-purple-500/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-primary" />
                        Lịch sử dự án đã lưu
                      </CardTitle>
                      <CardDescription>
                        Xem lại và quản lý các kịch bản dự án bạn đã tạo
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-1">
                      {projectScenarios.length} dự án
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {projectScenarios.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16"
                    >
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                        <FolderOpen className="w-20 h-20 text-muted-foreground/30 relative" />
                      </div>
                      <h3 className="mt-6 text-lg font-medium">Chưa có dự án nào được lưu</h3>
                      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                        Bạn chưa lưu kịch bản dự án nào. Hãy vào phần Phân tích dự án để tạo và lưu kịch bản mới.
                      </p>
                      <Button 
                        className="mt-6"
                        onClick={() => navigate("/project-analysis")}
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Tạo dự án mới
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {projectScenarios.map((scenario, index) => (
                          <motion.div
                            key={scenario.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative p-5 rounded-xl border border-border/50 bg-gradient-to-r from-background to-muted/20 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-4 flex-1">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20">
                                  <TrendingUp className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-lg">{scenario.name}</h3>
                                    <Badge variant="outline" className="text-xs">
                                      {scenario.params.projectName}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                                    <Calendar className="w-3 h-3" />
                                    Tạo lúc: {formatDate(scenario.createdAt)}
                                  </p>
                                  
                                  {/* Project Details */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="p-2 rounded-lg bg-muted/30">
                                      <p className="text-xs text-muted-foreground">Vốn đầu tư</p>
                                      <p className="font-semibold text-primary">
                                        {formatNumber(scenario.params.fixedAssetValue)} tr
                                      </p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted/30">
                                      <p className="text-xs text-muted-foreground">Thời gian</p>
                                      <p className="font-semibold">
                                        {scenario.params.operationYears} năm
                                      </p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted/30">
                                      <p className="text-xs text-muted-foreground">Tỷ lệ vay</p>
                                      <p className="font-semibold">
                                        {scenario.params.debtRatio}%
                                      </p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted/30">
                                      <p className="text-xs text-muted-foreground">Lãi suất vay</p>
                                      <p className="font-semibold">
                                        {scenario.params.nominalInterestRate}%
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewScenario(scenario)}
                                  className="border-primary/30 hover:bg-primary/10 hover:border-primary"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Xem
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteScenario(scenario.id)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
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
          </Tabs>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
