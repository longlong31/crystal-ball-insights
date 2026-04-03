import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, Code, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface AlgorithmSubmission {
  id: string;
  name: string;
  name_vi: string;
  category: string;
  description: string;
  description_vi: string;
  params: any;
  code: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  user_id: string;
}

export function AlgorithmReviewPanel() {
  const [submissions, setSubmissions] = useState<AlgorithmSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("community_algorithms")
      .select("*")
      .order("created_at", { ascending: false });
    setSubmissions((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase
      .from("community_algorithms")
      .update({ status: "approved" as any })
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Đã duyệt mô hình"); fetchSubmissions(); }
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase
      .from("community_algorithms")
      .update({ status: "rejected" as any, rejection_reason: rejectReasons[id] || "Không đạt yêu cầu" })
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Đã từ chối mô hình"); fetchSubmissions(); }
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.from("community_algorithms").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Đã xóa"); fetchSubmissions(); }
    setActionLoading(null);
  };

  const filtered = filter === "all" ? submissions : submissions.filter(s => s.status === filter);
  const statusIcon = (s: string) => s === "pending" ? <Clock className="w-3 h-3" /> : s === "approved" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />;
  const statusColor = (s: string) => s === "pending" ? "secondary" : s === "approved" ? "default" : "destructive";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-semibold text-lg">Mô hình đóng góp</h3>
        <div className="flex gap-1 ml-auto">
          {(["all", "pending", "approved", "rejected"] as const).map(f => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
              {f === "all" ? `Tất cả (${submissions.length})` : f === "pending" ? `Chờ duyệt (${submissions.filter(s => s.status === "pending").length})` : f === "approved" ? "Đã duyệt" : "Từ chối"}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Chưa có mô hình nào</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(sub => (
            <div key={sub.id} className="p-4 rounded-lg border bg-card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{sub.name}</span>
                    <Badge variant={statusColor(sub.status) as any} className="gap-1 text-xs">
                      {statusIcon(sub.status)} {sub.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{sub.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{sub.name_vi}</p>
                  <p className="text-xs text-muted-foreground">{sub.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(sub.created_at).toLocaleDateString("vi-VN")} • Params: {Array.isArray(sub.params) ? sub.params.length : 0}
                  </p>
                </div>
              </div>

              {/* Code preview */}
              <details className="group">
                <summary className="text-xs text-primary cursor-pointer flex items-center gap-1">
                  <Code className="w-3 h-3" /> Xem code
                </summary>
                <pre className="mt-2 p-3 rounded bg-muted/50 text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {sub.code}
                </pre>
              </details>

              {/* Actions */}
              {sub.status === "pending" && (
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleApprove(sub.id)} disabled={actionLoading === sub.id}>
                    {actionLoading === sub.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                    Duyệt
                  </Button>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Lý do từ chối..."
                      value={rejectReasons[sub.id] || ""}
                      onChange={e => setRejectReasons(prev => ({ ...prev, [sub.id]: e.target.value }))}
                      rows={1}
                      className="text-xs"
                    />
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => handleReject(sub.id)} disabled={actionLoading === sub.id}>
                    <X className="w-3 h-3 mr-1" /> Từ chối
                  </Button>
                </div>
              )}

              {sub.status !== "pending" && (
                <div className="flex justify-end">
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(sub.id)} disabled={actionLoading === sub.id}>
                    <X className="w-3 h-3 mr-1" /> Xóa
                  </Button>
                </div>
              )}

              {sub.rejection_reason && (
                <p className="text-xs text-destructive">Lý do: {sub.rejection_reason}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
