import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Send, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface ParamDef {
  key: string;
  label: string;
  defaultValue: string;
  min?: string;
  max?: string;
  unit?: string;
}

export function AlgorithmContributeForm() {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [nameVi, setNameVi] = useState("");
  const [category, setCategory] = useState("financial");
  const [description, setDescription] = useState("");
  const [descriptionVi, setDescriptionVi] = useState("");
  const [code, setCode] = useState("");
  const [params, setParams] = useState<ParamDef[]>([{ key: "", label: "", defaultValue: "0" }]);

  const addParam = () => setParams([...params, { key: "", label: "", defaultValue: "0" }]);
  const removeParam = (idx: number) => setParams(params.filter((_, i) => i !== idx));
  const updateParam = (idx: number, field: keyof ParamDef, value: string) => {
    const updated = [...params];
    updated[idx] = { ...updated[idx], [field]: value };
    setParams(updated);
  };

  const handleSubmit = async () => {
    if (!name || !nameVi || !description || !code) {
      toast.error(language === "vi" ? "Vui lòng điền đầy đủ thông tin" : "Please fill all required fields");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(language === "vi" ? "Vui lòng đăng nhập để đóng góp" : "Please login to contribute");
      return;
    }

    setLoading(true);
    try {
      const paramsJson = params
        .filter(p => p.key && p.label)
        .map(p => ({
          key: p.key,
          label: p.label,
          defaultValue: parseFloat(p.defaultValue) || 0,
          min: p.min ? parseFloat(p.min) : undefined,
          max: p.max ? parseFloat(p.max) : undefined,
          unit: p.unit || undefined,
        }));

      const { error } = await supabase.from("community_algorithms").insert({
        user_id: user.id,
        name,
        name_vi: nameVi,
        category,
        description,
        description_vi: descriptionVi || description,
        params: paramsJson,
        code,
      });

      if (error) throw error;

      toast.success(language === "vi" ? "Đã gửi mô hình! Admin sẽ duyệt sớm." : "Model submitted! Admin will review shortly.");
      setOpen(false);
      setName(""); setNameVi(""); setDescription(""); setDescriptionVi(""); setCode("");
      setParams([{ key: "", label: "", defaultValue: "0" }]);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          {language === "vi" ? "Đóng góp mô hình" : "Contribute Model"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{language === "vi" ? "Đóng góp mô hình thuật toán" : "Contribute Algorithm Model"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{language === "vi" ? "Tên (EN) *" : "Name (EN) *"}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Black-Scholes" />
            </div>
            <div>
              <Label>{language === "vi" ? "Tên (VI) *" : "Name (VI) *"}</Label>
              <Input value={nameVi} onChange={e => setNameVi(e.target.value)} placeholder="e.g. Mô hình Black-Scholes" />
            </div>
          </div>

          <div>
            <Label>{language === "vi" ? "Danh mục" : "Category"}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="financial">Tài chính</SelectItem>
                <SelectItem value="risk">Rủi ro</SelectItem>
                <SelectItem value="strategy">Chiến lược</SelectItem>
                <SelectItem value="optimization">Tối ưu hóa</SelectItem>
                <SelectItem value="ml">ML / AI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{language === "vi" ? "Mô tả (EN) *" : "Description (EN) *"}</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>{language === "vi" ? "Mô tả (VI)" : "Description (VI)"}</Label>
              <Textarea value={descriptionVi} onChange={e => setDescriptionVi(e.target.value)} rows={2} />
            </div>
          </div>

          {/* Params */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>{language === "vi" ? "Tham số đầu vào" : "Input Parameters"}</Label>
              <Button variant="ghost" size="sm" onClick={addParam}><Plus className="w-3 h-3 mr-1" /> Thêm</Button>
            </div>
            <div className="space-y-2">
              {params.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input placeholder="key (e.g. S)" value={p.key} onChange={e => updateParam(i, "key", e.target.value)} className="text-xs" />
                  </div>
                  <div className="flex-1">
                    <Input placeholder="Label" value={p.label} onChange={e => updateParam(i, "label", e.target.value)} className="text-xs" />
                  </div>
                  <div className="w-20">
                    <Input placeholder="Default" value={p.defaultValue} onChange={e => updateParam(i, "defaultValue", e.target.value)} className="text-xs" />
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeParam(i)}>
                    <X className="w-3 h-3" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Code */}
          <div>
            <Label>{language === "vi" ? "Mã nguồn / Công thức *" : "Source Code / Formula *"}</Label>
            <Textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              rows={8}
              className="font-mono text-xs"
              placeholder={`// Mô tả công thức hoặc pseudo-code\n// Ví dụ:\n// P = D / (r - g)\n// Trong đó:\n// D = cổ tức, r = lợi suất yêu cầu, g = tốc độ tăng trưởng`}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              {language === "vi"
                ? "Viết công thức, pseudo-code hoặc code JavaScript. Admin sẽ review và tích hợp."
                : "Write formulas, pseudo-code or JavaScript. Admin will review and integrate."}
            </p>
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {language === "vi" ? "Gửi mô hình để duyệt" : "Submit for Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
