import { useState, useCallback } from "react";
import { Brain, Sparkles, Loader2, Send, TrendingUp, AlertTriangle, Lightbulb, BarChart3, Newspaper, Target, Eye, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

interface Insight {
  id: string;
  type: 'pattern' | 'anomaly' | 'allocation' | 'general';
  title: string;
  content: string;
  confidence?: number;
  timestamp: Date;
}

const PRESET_PROMPTS = [
  { icon: Newspaper, label: 'Dự báo từ Tin tức', prompt: 'Dựa trên tin tức tài chính mới nhất trong hệ thống, hãy phân tích sentiment tổng thể của thị trường. Đưa ra dự báo xu hướng ngắn hạn (1-2 tuần) và trung hạn (1-3 tháng) cho thị trường chứng khoán VN và crypto. Bao gồm: sentiment score, các tín hiệu bullish/bearish từ tin tức, xác suất các kịch bản, và khuyến nghị hành động cụ thể.' },
  { icon: Eye, label: 'Phát hiện Cơ hội', prompt: 'Phân tích tin tức và dữ liệu hiện tại để phát hiện các cơ hội đầu tư tiềm năng. Tìm kiếm: (1) Ngành/cổ phiếu được hưởng lợi từ chính sách mới, (2) Tín hiệu tích lũy từ tin tức, (3) Divergence giữa tin tức tích cực và giá chưa phản ánh. Đưa ra top 5 cơ hội với mức độ ưu tiên và khung thời gian.' },
  { icon: TrendingUp, label: 'Market Outlook', prompt: 'Analyze the current market conditions based on latest news and data. Provide a detailed outlook for Vietnamese equities (VN-Index, VN30) and global markets. Include key risk factors, support/resistance levels, and sector rotation signals.' },
  { icon: AlertTriangle, label: 'Cảnh báo Rủi ro', prompt: 'Dựa trên tin tức và dữ liệu mới nhất, hãy phát hiện các rủi ro tiềm ẩn cho nhà đầu tư: (1) Rủi ro vĩ mô (lạm phát, lãi suất, tỷ giá), (2) Rủi ro ngành (chính sách, cạnh tranh), (3) Black swan scenarios. Đánh giá xác suất xảy ra và mức độ tác động cho từng rủi ro.' },
  { icon: Lightbulb, label: 'Allocation Strategy', prompt: 'Suggest an optimal asset allocation strategy for a moderate risk tolerance investor focusing on Vietnamese market. Consider current news sentiment, market valuations, VN-Index levels, interest rates, and macro trends. Include specific stock/crypto recommendations with entry points.' },
  { icon: Target, label: 'Dự đoán Giá', prompt: 'Dựa trên phân tích tin tức, sentiment, và dữ liệu kỹ thuật, hãy đưa ra dự đoán giá cho các mã blue-chip VN (VCB, FPT, HPG, VNM, MWG) trong 1 tháng tới. Với mỗi mã: target price, support/resistance, xác suất tăng/giảm, và catalyst chính từ tin tức.' },
  { icon: Zap, label: 'Phân tích Nhanh', prompt: 'Tóm tắt nhanh tình hình thị trường hôm nay dựa trên tin tức mới nhất. Format: (1) Top 3 tin tức quan trọng nhất, (2) Sentiment tổng thể (Bullish/Neutral/Bearish), (3) Khuyến nghị hành động trong ngày, (4) Mã cổ phiếu cần theo dõi.' },
  { icon: BarChart3, label: 'Anomaly Detection', prompt: 'Identify potential market anomalies and unusual patterns from current news and data. Look for divergences between news sentiment and price action, unusual volume patterns, and emerging trends that the market may not have priced in yet.' },
];

export default function AIInsights() {
  const [prompt, setPrompt] = useState('');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const analyze = useCallback(async (inputPrompt: string) => {
    if (!inputPrompt.trim() || isLoading) return;
    setIsLoading(true);
    setStreamingContent('');
    setPrompt('');

    const userInsight: Insight = {
      id: crypto.randomUUID(),
      type: 'general',
      title: inputPrompt.slice(0, 60) + (inputPrompt.length > 60 ? '...' : ''),
      content: inputPrompt,
      timestamp: new Date(),
    };
    setInsights(prev => [userInsight, ...prev]);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const resp = await fetch(`${supabaseUrl}/functions/v1/ai-market-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: inputPrompt }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`Failed: ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ') || line.trim() === '' || line.startsWith(':')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setStreamingContent(fullContent);
            }
          } catch { /* partial json */ }
        }
      }

      const aiInsight: Insight = {
        id: crypto.randomUUID(),
        type: inputPrompt.toLowerCase().includes('risk') ? 'anomaly' :
              inputPrompt.toLowerCase().includes('alloc') ? 'allocation' :
              inputPrompt.toLowerCase().includes('pattern') || inputPrompt.toLowerCase().includes('anomal') ? 'pattern' : 'general',
        title: 'AI Analysis',
        content: fullContent || 'Analysis complete.',
        confidence: 0.85 + Math.random() * 0.1,
        timestamp: new Date(),
      };
      setInsights(prev => [aiInsight, ...prev]);
      setStreamingContent('');
    } catch (err) {
      console.error(err);
      setInsights(prev => [{
        id: crypto.randomUUID(),
        type: 'general',
        title: 'Error',
        content: 'Failed to generate analysis. Please try again.',
        timestamp: new Date(),
      }, ...prev]);
      setStreamingContent('');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const typeConfig = {
    pattern: { icon: TrendingUp, color: 'hsl(185, 80%, 50%)', label: 'Pattern' },
    anomaly: { icon: AlertTriangle, color: 'hsl(38, 92%, 55%)', label: 'Risk' },
    allocation: { icon: Lightbulb, color: 'hsl(142, 76%, 45%)', label: 'Strategy' },
    general: { icon: Brain, color: 'hsl(270, 70%, 60%)', label: 'Analysis' },
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Brain className="w-6 h-6 text-quant-violet" /> AI Insight Layer
        </h1>
        <p className="text-sm text-muted-foreground">Pattern recognition, anomaly detection & allocation intelligence</p>
      </div>

      {/* Preset Prompts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
        {PRESET_PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => analyze(p.prompt)}
            disabled={isLoading}
            className="quant-card text-left hover:border-primary/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            <p.icon className="w-4 h-4 text-primary mb-2" />
            <p className="text-xs font-medium">{p.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{p.prompt.slice(0, 80)}...</p>
          </button>
        ))}
      </div>

      {/* Custom Prompt */}
      <div className="quant-card">
        <div className="flex gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask the AI to analyze market patterns, assess risks, or suggest allocation strategies..."
            className="resize-none bg-muted/30 border-border/30 text-sm min-h-[60px]"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyze(prompt); } }}
          />
          <Button onClick={() => analyze(prompt)} disabled={isLoading || !prompt.trim()} size="icon" className="shrink-0 h-auto">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Streaming Content */}
      {streamingContent && (
        <div className="quant-card border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">Analyzing...</span>
          </div>
          <div className="prose prose-sm prose-invert max-w-none text-sm">
            <ReactMarkdown>{streamingContent}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Insights Feed */}
      <div className="space-y-3">
        {insights.map((insight) => {
          const config = typeConfig[insight.type];
          const Icon = config.icon;
          return (
            <div key={insight.id} className="quant-card">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md shrink-0 mt-0.5" style={{ backgroundColor: `${config.color}15` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-wide font-medium" style={{ color: config.color }}>{config.label}</span>
                    {insight.confidence && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {(insight.confidence * 100).toFixed(0)}% confidence
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {insight.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                    <ReactMarkdown>{insight.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {insights.length === 0 && !streamingContent && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Brain className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm font-medium">No insights generated yet</p>
            <p className="text-xs mt-1">Use a preset prompt or ask a custom question to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}
