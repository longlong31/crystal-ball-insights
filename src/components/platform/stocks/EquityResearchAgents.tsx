import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Sparkles, Download, RefreshCw, Brain, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface AgentReport {
  id: string;
  name: string;
  emoji: string;
  content: string;
  ok: boolean;
}

interface ResearchPayload {
  symbol: string;
  agents: AgentReport[];
  consensus: string;
}

interface Props {
  symbol: string;
  context: Record<string, unknown>;
}

export function EquityResearchAgents({ symbol, context }: Props) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ResearchPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runResearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: invokeErr } = await supabase.functions.invoke(
        "equity-research-ai",
        { body: { symbol, context, language } },
      );
      if (invokeErr) throw invokeErr;
      if ((res as any)?.error) throw new Error((res as any).error);
      setData(res as ResearchPayload);
      toast.success(`✅ 6 AI Analysts đã phân tích ${symbol}`);
    } catch (err) {
      const msg = (err as Error).message || "Lỗi không xác định";
      setError(msg);
      toast.error(`AI Research lỗi: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!data) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Equity Research — ${data.symbol}</title>
<style>
  body{font-family:'Inter','Segoe UI',sans-serif;max-width:900px;margin:40px auto;padding:0 24px;color:#1a1a1a;line-height:1.6}
  h1{font-size:28px;border-bottom:3px solid #6366f1;padding-bottom:10px}
  h2{font-size:20px;color:#4f46e5;margin-top:32px;border-left:4px solid #6366f1;padding-left:12px}
  h3{font-size:16px;color:#1e293b}
  .meta{color:#64748b;font-size:13px;margin-bottom:24px}
  .consensus{background:#eef2ff;border:2px solid #6366f1;border-radius:12px;padding:20px;margin:24px 0}
  .agent{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:16px 0}
  hr{border:none;border-top:1px dashed #cbd5e1;margin:24px 0}
  footer{margin-top:40px;color:#94a3b8;font-size:11px;text-align:center}
</style></head><body>
<h1>📊 Equity Research Report — ${data.symbol}</h1>
<div class="meta">Generated: ${new Date().toLocaleString()} · Crystall Quant Platform · 6-Agent AI Research</div>
<h2>🎯 Investment Thesis (Consensus)</h2>
<div class="consensus">${markdownToHtml(data.consensus)}</div>
${data.agents
  .map(
    (a) => `<div class="agent"><h3>${a.emoji} ${a.name}</h3>${markdownToHtml(a.content)}</div>`,
  )
  .join("")}
<footer>© Crystall Quant Platform — Quách Thành Long · quachthanhlong.com<br/>Báo cáo do AI tạo, chỉ mang tính tham khảo, không phải lời khuyên đầu tư.</footer>
</body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Equity_Research_${data.symbol}_${Date.now()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("📥 Đã xuất Research Report (.doc)");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="quant-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold flex items-center gap-2">
              Multi-Agent AI Equity Research
              <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
                6 ANALYSTS
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              Fundamental · Technical · Quant · Risk · Macro · Portfolio → Chief Strategist Consensus
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <Button onClick={exportReport} size="sm" variant="outline">
              <Download className="w-3.5 h-3.5 mr-1" /> Export Report
            </Button>
          )}
          <Button onClick={runResearch} disabled={loading} size="sm" variant="glow">
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Analyzing…</>
            ) : data ? (
              <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-run Research</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5 mr-1" /> Run AI Research</>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="quant-card border-destructive/40 bg-destructive/5 flex items-start gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-destructive">AI Research lỗi</div>
            <div className="text-muted-foreground font-mono">{error}</div>
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="quant-card animate-pulse h-48">
              <div className="h-4 w-32 bg-muted/40 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-2 bg-muted/30 rounded w-full" />
                <div className="h-2 bg-muted/30 rounded w-5/6" />
                <div className="h-2 bg-muted/30 rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {data && (
        <>
          {/* Consensus card */}
          <div className="quant-card border-primary/40 bg-gradient-to-br from-primary/10 via-transparent to-secondary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🎯</span>
              <div>
                <div className="text-sm font-bold">Chief Strategist Consensus</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  Synthesized from 6 specialist agents
                </div>
              </div>
            </div>
            <div className="prose prose-sm prose-invert max-w-none text-xs leading-relaxed">
              <ReactMarkdown>{data.consensus}</ReactMarkdown>
            </div>
          </div>

          {/* Agent grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.agents.map((a) => (
              <div
                key={a.id}
                className={`quant-card hover:border-primary/40 transition-colors ${
                  !a.ok ? "border-amber-500/30 bg-amber-500/5" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/30">
                  <span className="text-xl">{a.emoji}</span>
                  <div className="text-sm font-semibold">{a.name}</div>
                </div>
                <div className="prose prose-xs prose-invert max-w-none text-[11px] leading-relaxed">
                  <ReactMarkdown>{a.content}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!data && !loading && !error && (
        <div className="quant-card text-center py-12 text-xs text-muted-foreground">
          <Brain className="w-10 h-10 mx-auto mb-3 text-primary/60" />
          <div className="font-semibold text-foreground mb-1">
            Sẵn sàng phân tích {symbol}
          </div>
          <div>
            Nhấn <span className="text-primary font-semibold">Run AI Research</span> để 6 chuyên gia AI phân tích song song và tổng hợp Investment Thesis.
          </div>
        </div>
      )}
    </div>
  );
}

// Minimal markdown → HTML for export (.doc)
function markdownToHtml(md: string): string {
  if (!md) return "";
  return md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.*)$/gm, "<h4>$1</h4>")
    .replace(/^## (.*)$/gm, "<h3>$1</h3>")
    .replace(/^# (.*)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<)/gm, "<p>")
    .replace(/<p><(h[2-4]|ul|li)/g, "<$1")
    .replace(/<\/p>\s*<p>\s*<\/p>/g, "");
}
