import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, Loader2, KeyRound, CheckCircle, ArrowLeft } from "lucide-react";
import { CrystalBallIcon } from "@/components/CrystalBallIcon";
import { z } from "zod";

const resetSchema = z.object({
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user arrived via recovery link
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");

    if (type === "recovery") {
      setIsValidSession(true);
      setChecking(false);
      return;
    }

    // Also check via session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
      setChecking(false);
    };

    // Listen for auth state changes (recovery event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true);
        setChecking(false);
      }
    });

    checkSession();
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      resetSchema.parse({ password, confirmPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) newErrors[err.path[0] as string] = err.message;
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setIsSuccess(true);
      toast.success("Đã đổi mật khẩu thành công!");
    } catch (error: any) {
      toast.error(error.message || "Không thể đổi mật khẩu");
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <CrystalBallIcon className="w-10 h-10" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Crystal Ball
            </span>
          </Link>
        </div>

        {isSuccess ? (
          <Card className="border-border/30 bg-card/60 backdrop-blur-sm">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-[hsl(var(--quant-green)/0.2)] blur-2xl rounded-full" />
                <CheckCircle className="w-16 h-16 text-[hsl(var(--quant-green))] relative" />
              </div>
              <h2 className="text-xl font-bold mb-2">Đổi mật khẩu thành công!</h2>
              <p className="text-muted-foreground mb-6">Mật khẩu mới đã được cập nhật. Bạn có thể đăng nhập với mật khẩu mới.</p>
              <Button onClick={() => navigate("/")} className="bg-gradient-to-r from-primary to-secondary">
                Về trang chủ
              </Button>
            </CardContent>
          </Card>
        ) : !isValidSession ? (
          <Card className="border-border/30 bg-card/60 backdrop-blur-sm">
            <CardContent className="pt-8 pb-8 text-center">
              <KeyRound className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Liên kết không hợp lệ</h2>
              <p className="text-muted-foreground mb-6">Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu gửi lại.</p>
              <Button onClick={() => navigate("/")} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" /> Về trang chủ
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/30 bg-card/60 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <KeyRound className="w-6 h-6 text-primary" />
                Đặt mật khẩu mới
              </CardTitle>
              <CardDescription>Nhập mật khẩu mới cho tài khoản của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" /> Mật khẩu mới
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: "" })); }}
                    className={`border-border/30 ${errors.password ? "border-destructive" : ""}`}
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" /> Xác nhận mật khẩu
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: "" })); }}
                    className={`border-border/30 ${errors.confirmPassword ? "border-destructive" : ""}`}
                  />
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang xử lý...</> : <><KeyRound className="w-4 h-4 mr-2" /> Đặt mật khẩu mới</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
