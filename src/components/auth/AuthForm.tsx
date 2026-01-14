import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Mail, Phone, Lock, LogIn, UserPlus, Loader2 } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
});

const signupSchema = z.object({
  fullName: z.string().min(2, "Họ tên ít nhất 2 ký tự").max(100, "Họ tên quá dài"),
  email: z.string().email("Email không hợp lệ").max(255, "Email quá dài"),
  phone: z.string().optional(),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

interface AuthFormProps {
  onSuccess?: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    try {
      if (mode === "login") {
        loginSchema.parse({ email: formData.email, password: formData.password });
      } else {
        signupSchema.parse(formData);
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast.success("Đăng nhập thành công!");
        onSuccess?.();
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
            },
          },
        });

        if (error) throw error;

        // Update phone in profiles if provided
        if (formData.phone) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from("profiles")
              .update({ phone: formData.phone })
              .eq("user_id", user.id);
          }
        }

        toast.success("Đăng ký thành công! Chào mừng bạn đến với Crystal Ball.");
        onSuccess?.();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Có lỗi xảy ra";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === "login" ? "signup" : "login");
    setErrors({});
  };

  return (
    <Card className="glass max-w-md w-full mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          {mode === "login" ? (
            <>
              <LogIn className="w-6 h-6 text-primary" />
              Đăng nhập
            </>
          ) : (
            <>
              <UserPlus className="w-6 h-6 text-primary" />
              Đăng ký tài khoản
            </>
          )}
        </CardTitle>
        <CardDescription>
          {mode === "login" 
            ? "Đăng nhập để sử dụng đầy đủ tính năng Crystal Ball"
            : "Tạo tài khoản mới để lưu trữ và quản lý dự án"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === "signup" && (
              <motion.div
                key="signup-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Họ và tên
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={errors.fullName ? "border-destructive" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    Số điện thoại (tùy chọn)
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="0901234567"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              Mật khẩu
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••"
              value={formData.password}
              onChange={handleInputChange}
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <AnimatePresence mode="wait">
            {mode === "signup" && (
              <motion.div
                key="confirm-password"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    Xác nhận mật khẩu
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? "border-destructive" : ""}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button 
            type="submit" 
            variant="glow" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : mode === "login" ? (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Đăng nhập
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Đăng ký
              </>
            )}
          </Button>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
              <Button
                type="button"
                variant="link"
                className="px-1"
                onClick={toggleMode}
              >
                {mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}
              </Button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
