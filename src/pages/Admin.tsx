import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  ArrowLeft, 
  Loader2, 
  Search, 
  Shield, 
  ShieldCheck,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Edit,
  Trash2,
  RefreshCw,
  Crown,
  UserCheck,
  Activity,
  TrendingUp,
  Sparkles,
  Bot,
  MessageSquare,
  Newspaper,
  FlaskConical
} from "lucide-react";
import { CrystalBallIcon } from "@/components/CrystalBallIcon";
import { Footer } from "@/components/Footer";
import { ChatbotQAManager } from "@/components/admin/ChatbotQAManager";
import { AlgorithmReviewPanel } from "@/components/admin/AlgorithmReviewPanel";
import { NewsManager } from "@/components/admin/NewsManager";

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  education: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  role: "admin" | "user";
}

export default function Admin() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAndFetchUsers();
  }, []);

  const checkAdminAndFetchUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Vui lòng đăng nhập");
        navigate("/");
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError || !roleData) {
        toast.error("Bạn không có quyền truy cập trang này");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await fetchUsers();
    } catch (error) {
      console.error("Error checking admin:", error);
      navigate("/");
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: (userRole?.role as "admin" | "user") || "user",
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "admin" | "user") => {
    setIsUpdating(true);
    try {
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      setUsers(prev => 
        prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u)
      );
      
      toast.success(`Đã cập nhật vai trò thành ${newRole === 'admin' ? 'Quản trị viên' : 'Người dùng'}`);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Không thể cập nhật vai trò");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      setUsers(prev => prev.filter(u => u.user_id !== userId));
      toast.success("Đã xóa người dùng");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Không thể xóa người dùng");
    }
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

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;
  const recentUsers = users.filter(u => {
    const createdDate = new Date(u.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return createdDate > sevenDaysAgo;
  }).length;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <Loader2 className="w-16 h-16 animate-spin text-primary relative" />
          </div>
          <p className="mt-4 text-muted-foreground">Đang xác thực quyền truy cập...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-full blur-3xl" />
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
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Crystal Ball
                </span>
                <p className="text-xs text-muted-foreground">Admin Dashboard</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Badge className="px-4 py-2 bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 text-primary">
                <Crown className="w-4 h-4 mr-2" />
                Super Admin
              </Badge>
              <Button variant="outline" onClick={() => navigate(-1)} className="border-border/50 hover:bg-primary/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 blur-xl opacity-50" />
                <div className="relative p-4 bg-gradient-to-r from-primary to-purple-500 rounded-2xl">
                  <Shield className="w-10 h-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Quản trị hệ thống
                </h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Quản lý người dùng, phân quyền và chatbot
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-card/50 border border-border/50 p-1">
            <TabsTrigger value="users" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2">
              <Users className="w-4 h-4" />
              Người dùng
            </TabsTrigger>
            <TabsTrigger value="chatbot" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2">
              <Bot className="w-4 h-4" />
              Chatbot Q&A
            </TabsTrigger>
            <TabsTrigger value="news" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2">
              <Newspaper className="w-4 h-4" />
              Tin tức / Sự kiện
            </TabsTrigger>
            <TabsTrigger value="algorithms" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2">
              <FlaskConical className="w-4 h-4" />
              Mô hình
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* Refresh Button */}
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={fetchUsers} 
                disabled={isLoading}
                className="border-primary/30 hover:bg-primary/10 hover:border-primary"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-primary/5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Tổng người dùng
              </CardDescription>
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                {users.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Activity className="w-3 h-3" />
                Tất cả tài khoản
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-yellow-500/5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl" />
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                Quản trị viên
              </CardDescription>
              <CardTitle className="text-4xl font-bold text-yellow-500">
                {adminCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ShieldCheck className="w-3 h-3" />
                Quyền cao nhất
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-blue-500/5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl" />
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-500" />
                Người dùng thường
              </CardDescription>
              <CardTitle className="text-4xl font-bold text-blue-500">
                {userCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                Tài khoản cơ bản
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-green-500/5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl" />
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Mới trong 7 ngày
              </CardDescription>
              <CardTitle className="text-4xl font-bold text-green-500">
                {recentUsers}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                Đăng ký gần đây
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6 border-border/50 bg-background/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="🔍 Tìm kiếm theo tên, email hoặc số điện thoại..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-lg border-border/50 bg-background/50 focus:border-primary focus:ring-primary/20"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-purple-500/5">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Danh sách người dùng
                <Badge variant="secondary" className="ml-2">
                  {filteredUsers.length} kết quả
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
                  </div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Users className="w-16 h-16 text-muted-foreground/30" />
                  <p className="mt-4 text-muted-foreground">Không tìm thấy người dùng nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="font-semibold">Người dùng</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Số điện thoại</TableHead>
                        <TableHead className="font-semibold">Học vấn</TableHead>
                        <TableHead className="font-semibold">Ngày tạo</TableHead>
                        <TableHead className="font-semibold">Vai trò</TableHead>
                        <TableHead className="text-right font-semibold">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-border/50 hover:bg-primary/5 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar className="h-12 w-12 ring-2 ring-border/50">
                                  <AvatarImage src={user.avatar_url || undefined} />
                                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-semibold">
                                    {getInitials(user.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                {user.role === 'admin' && (
                                  <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                                    <Crown className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="font-semibold">{user.full_name || "Chưa đặt tên"}</span>
                                {user.role === 'admin' && (
                                  <Badge variant="outline" className="ml-2 text-xs border-yellow-500/50 text-yellow-500">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              {user.phone || "—"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <GraduationCap className="w-4 h-4" />
                              {user.education || "—"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {new Date(user.created_at).toLocaleDateString("vi-VN")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value: "admin" | "user") => 
                                handleRoleChange(user.user_id, value)
                              }
                              disabled={isUpdating}
                            >
                              <SelectTrigger className={`w-40 ${user.role === 'admin' ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-border/50'}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">
                                  <div className="flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-blue-500" />
                                    Người dùng
                                  </div>
                                </SelectItem>
                                <SelectItem value="admin">
                                  <div className="flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-yellow-500" />
                                    Quản trị viên
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setSelectedUser(user)}
                                    className="hover:bg-primary/10 hover:text-primary"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="border-border/50 bg-background/95 backdrop-blur-xl">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <Users className="w-5 h-5 text-primary" />
                                      Thông tin người dùng
                                    </DialogTitle>
                                    <DialogDescription>
                                      Chi tiết tài khoản
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedUser && (
                                    <div className="space-y-6 mt-4">
                                      <div className="flex items-center gap-4">
                                        <div className="relative">
                                          <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                                            <AvatarImage src={selectedUser.avatar_url || undefined} />
                                            <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary">
                                              {getInitials(selectedUser.full_name)}
                                            </AvatarFallback>
                                          </Avatar>
                                          {selectedUser.role === 'admin' && (
                                            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1.5">
                                              <Crown className="w-4 h-4 text-white" />
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <h3 className="font-bold text-xl">
                                            {selectedUser.full_name || "Chưa đặt tên"}
                                          </h3>
                                          <Badge 
                                            className={selectedUser.role === 'admin' 
                                              ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' 
                                              : 'bg-blue-500/20 text-blue-500 border-blue-500/30'
                                            }
                                          >
                                            {selectedUser.role === 'admin' ? '👑 Quản trị viên' : '👤 Người dùng'}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="space-y-4 p-4 rounded-xl bg-muted/30">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 rounded-lg bg-primary/10">
                                            <Mail className="w-4 h-4 text-primary" />
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Email</p>
                                            <p className="font-medium">{selectedUser.email}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 rounded-lg bg-green-500/10">
                                            <Phone className="w-4 h-4 text-green-500" />
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Số điện thoại</p>
                                            <p className="font-medium">{selectedUser.phone || "Chưa cập nhật"}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 rounded-lg bg-purple-500/10">
                                            <GraduationCap className="w-4 h-4 text-purple-500" />
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Học vấn</p>
                                            <p className="font-medium">{selectedUser.education || "Chưa cập nhật"}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 rounded-lg bg-orange-500/10">
                                            <Calendar className="w-4 h-4 text-orange-500" />
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Ngày tham gia</p>
                                            <p className="font-medium">
                                              {new Date(selectedUser.created_at).toLocaleDateString("vi-VN", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric"
                                              })}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteUser(user.user_id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
          </TabsContent>

          <TabsContent value="chatbot">
            <ChatbotQAManager />
          </TabsContent>

          <TabsContent value="news">
            <NewsManager />
          </TabsContent>

          <TabsContent value="algorithms">
            <AlgorithmReviewPanel />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
