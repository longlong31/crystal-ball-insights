import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Loader2, Download, RefreshCw, Sparkles, Terminal, Image as ImageIcon, Cpu, Square, Timer, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  symbol: string;
  closes: number[];
  returns: number[];
  dates?: string[];
  currentPrice?: number;
}

type Status = "idle" | "booting" | "ready" | "running" | "error";

const TEMPLATES: { id: string; label: string; code: string }[] = [
  {
    id: "rsi-chart",
    label: "RSI(14) + chart",
    code: `import numpy as np, pandas as pd
import matplotlib.pyplot as plt

s = pd.Series(closes)
delta = s.diff()
gain  = delta.clip(lower=0).rolling(14).mean()
loss  = (-delta.clip(upper=0)).rolling(14).mean()
rs    = gain / loss.replace(0, np.nan)
rsi   = 100 - (100 / (1 + rs))

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(9, 5), sharex=True, gridspec_kw={'height_ratios':[2,1]})
ax1.plot(s, color="#10b981", lw=1.4); ax1.set_title(f"{symbol} — Close"); ax1.grid(alpha=0.2)
ax2.plot(rsi, color="#3b82f6", lw=1.2); ax2.axhline(70, color="#ef4444", ls="--", lw=0.8)
ax2.axhline(30, color="#22c55e", ls="--", lw=0.8); ax2.set_title("RSI(14)"); ax2.grid(alpha=0.2)
plt.tight_layout()

metrics = {
  "RSI cuối kỳ":  round(float(rsi.iloc[-1]), 2),
  "RSI trung bình": round(float(rsi.mean()), 2),
  "Số phiên quá mua (>70)":  int((rsi > 70).sum()),
  "Số phiên quá bán (<30)":  int((rsi < 30).sum()),
}`,
  },
  {
    id: "vol-sharpe",
    label: "Volatility + Sharpe",
    code: `import numpy as np, pandas as pd
import matplotlib.pyplot as plt

r = pd.Series(returns)
vol_ann = r.std(ddof=1) * np.sqrt(252)
rf_d    = 0.04 / 252
sharpe  = (r.mean() - rf_d) / r.std(ddof=1) * np.sqrt(252)
rolling_vol = r.rolling(20).std() * np.sqrt(252)

plt.figure(figsize=(9, 3.5))
plt.plot(rolling_vol, color="#f59e0b", lw=1.3)
plt.title(f"{symbol} — Rolling 20D Annualized Volatility")
plt.grid(alpha=0.2); plt.tight_layout()

metrics = {
  "Volatility (annual)": f"{vol_ann*100:.2f}%",
  "Sharpe Ratio":        round(float(sharpe), 3),
  "Mean Daily Return":   f"{r.mean()*100:.3f}%",
  "Max Daily Gain":      f"{r.max()*100:.2f}%",
  "Max Daily Loss":      f"{r.min()*100:.2f}%",
}`,
  },
  {
    id: "var-hist",
    label: "VaR / CVaR + Histogram",
    code: `import numpy as np, pandas as pd
import matplotlib.pyplot as plt

r = np.array(returns)
alpha = 0.95
var  = -np.percentile(r, (1-alpha)*100)
cvar = -r[r <= -var].mean()

plt.figure(figsize=(9, 4))
plt.hist(r*100, bins=60, color="#6366f1", alpha=0.85, edgecolor="#1e293b")
plt.axvline(-var*100,  color="#ef4444", ls="--", lw=1.4, label=f"VaR 95% = {-var*100:.2f}%")
plt.axvline(-cvar*100, color="#b91c1c", ls=":",  lw=1.4, label=f"CVaR 95% = {-cvar*100:.2f}%")
plt.title(f"{symbol} — Distribution of Daily Returns"); plt.legend(); plt.grid(alpha=0.2)
plt.tight_layout()

metrics = {
  "VaR 95% (1 ngày)":  f"{var*100:.2f}%",
  "CVaR 95% (1 ngày)": f"{cvar*100:.2f}%",
  "Skewness":          round(float(pd.Series(r).skew()), 3),
  "Kurtosis (excess)": round(float(pd.Series(r).kurt()), 3),
}`,
  },
  {
    id: "monte-carlo",
    label: "Monte Carlo GBM (1Y)",
    code: `import numpy as np, matplotlib.pyplot as plt

r  = np.array(returns)
mu, sigma = r.mean()*252, r.std(ddof=1)*np.sqrt(252)
S0 = float(current_price) if current_price else float(closes[-1])
T, steps, paths = 1.0, 252, 1000
dt = T/steps
Z  = np.random.standard_normal((steps, paths))
S  = S0 * np.exp(np.cumsum((mu - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z, axis=0))

plt.figure(figsize=(9, 4))
plt.plot(S[:, :80], lw=0.5, alpha=0.5)
plt.title(f"{symbol} — 1Y Monte Carlo GBM ({paths} paths)"); plt.grid(alpha=0.2)
plt.tight_layout()

end = S[-1]
metrics = {
  "Giá khởi điểm":   round(S0, 2),
  "Trung vị 1Y":     round(float(np.median(end)), 2),
  "Percentile 5%":   round(float(np.percentile(end, 5)),  2),
  "Percentile 95%":  round(float(np.percentile(end, 95)), 2),
  "Xác suất tăng":   f"{(end > S0).mean()*100:.1f}%",
  "Drift μ (annual)": f"{mu*100:.2f}%",
  "Vol σ (annual)":   f"{sigma*100:.2f}%",
}`,
  },
];

const TIMEOUT_OPTIONS = [10, 20, 30, 60];

export function PythonRunnerPanel({ symbol, closes, returns, currentPrice }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<string>("");
  const [code, setCode] = useState<string>(TEMPLATES[0].code);
  const [stdout, setStdout] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<Record<string, any> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [timeoutSec, setTimeoutSec] = useState<number>(20);
  const [elapsed, setElapsed] = useState<number>(0);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const cleanupTimers = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  };

  const killWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    cleanupTimers();
  }, []);

  useEffect(() => () => killWorker(), [killWorker]);

  const spawn = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    const w = new Worker(new URL("../../../workers/pyodideWorker.ts", import.meta.url), { type: "classic" });
    workerRef.current = w;
    return w;
  }, []);

  const run = useCallback(() => {
    setErrorMsg("");
    setStdout("");
    setImages([]);
    setMetrics(null);
    setElapsed(0);

    const w = spawn();
    setStatus(workerRef.current ? "running" : "booting");
    setProgress("Khởi động worker...");
    startRef.current = performance.now();

    tickRef.current = window.setInterval(() => {
      setElapsed((performance.now() - startRef.current) / 1000);
    }, 100);

    timerRef.current = window.setTimeout(() => {
      killWorker();
      setStatus("error");
      setErrorMsg(
        `⏱️ Hết thời gian (${timeoutSec}s). Worker đã bị dừng để bảo vệ trình duyệt.\n` +
        `Mẹo: giảm số vòng lặp, vector hoá với numpy, hoặc tăng giới hạn timeout.`
      );
    }, timeoutSec * 1000);

    w.onmessage = (e: MessageEvent) => {
      const d = e.data || {};
      if (d.type === "progress") {
        setProgress(d.msg);
        setStatus((s) => (s === "idle" || s === "booting" ? "booting" : s));
      } else if (d.type === "done") {
        cleanupTimers();
        setStdout(d.stdout || "");
        setImages(d.figures || []);
        setMetrics(d.metrics || null);
        setProgress("");
        setStatus("ready");
      } else if (d.type === "error") {
        cleanupTimers();
        setErrorMsg(d.message || "Unknown error");
        setProgress("");
        setStatus("error");
      }
    };
    w.onerror = (ev) => {
      cleanupTimers();
      setErrorMsg(ev.message || "Worker error");
      setStatus("error");
    };

    w.postMessage({
      type: "run",
      code,
      ctx: { symbol, closes, returns, currentPrice: currentPrice ?? null },
    });
  }, [code, spawn, killWorker, timeoutSec, symbol, closes, returns, currentPrice]);

  const stop = useCallback(() => {
    killWorker();
    setStatus("error");
    setErrorMsg("⏹ Đã dừng theo yêu cầu. Worker bị hủy.");
    setProgress("");
  }, [killWorker]);

  const downloadImage = (src: string, idx: number) => {
    const a = document.createElement("a");
    a.href = src;
    a.download = `${symbol}_plot_${idx + 1}.png`;
    a.click();
  };

  const dataReady = closes && closes.length > 10 && returns && returns.length > 10;
  const busy = status === "booting" || status === "running";
  const pctTimeout = Math.min((elapsed / timeoutSec) * 100, 100);

  return (
    <div className="quant-card space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <Cpu className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-wide uppercase">Python Lab — Sandboxed Worker</h3>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary">
          Pyodide · v0.26.4
        </span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 flex items-center gap-1">
          <Timer className="w-3 h-3" /> Auto-kill {timeoutSec}s
        </span>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">
          {symbol} · {closes?.length || 0} closes · {returns?.length || 0} returns
        </span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-primary transition-colors"
          title={collapsed ? "Mở rộng" : "Thu gọn"}
        >
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <>
          <p className="text-xs text-muted-foreground -mt-2">
            Chạy Python trong <strong>Web Worker</strong> — không treo trang. Code chạy quá lâu sẽ tự kill theo timeout.
            Biến có sẵn: <code className="mx-1 px-1 rounded bg-muted/40 font-mono text-[10px]">symbol, closes, returns, current_price</code>.
            Gán <code className="mx-1 px-1 rounded bg-muted/40 font-mono text-[10px]">metrics = {`{...}`}</code> để show KPI.
          </p>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setCode(t.code)}
                className="text-[10px] px-2 py-1 rounded-full bg-muted/30 hover:bg-primary/15 hover:text-primary border border-border/40 transition-colors"
              >
                ⚡ {t.label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-muted-foreground">Timeout:</span>
              {TIMEOUT_OPTIONS.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setTimeoutSec(sec)}
                  className={`text-[10px] px-2 py-1 rounded border transition-colors font-mono ${
                    timeoutSec === sec
                      ? "bg-primary/20 text-primary border-primary/50"
                      : "bg-muted/30 border-border/40 hover:bg-muted/50"
                  }`}
                >
                  {sec}s
                </button>
              ))}
              <button
                onClick={() => { setStdout(""); setImages([]); setMetrics(null); setErrorMsg(""); }}
                className="text-[10px] px-2 py-1 rounded-full bg-muted/30 hover:bg-muted/50 border border-border/40 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Clear
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="w-full h-72 font-mono text-[11px] leading-relaxed bg-background/60 border border-border/40 rounded-md p-3 outline-none focus:border-primary/60 resize-y"
            />
            <div className="absolute bottom-2 right-2 text-[9px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">
              {code.split("\n").length} dòng
            </div>
          </div>

          {/* Run + status */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={run}
              disabled={busy || !dataReady}
              className="bg-primary text-primary-foreground hover:opacity-90 h-8"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1.5" />}
              {status === "booting" ? "Boot runtime..." : status === "running" ? "Đang chạy..." : "Run Python"}
            </Button>
            {busy && (
              <Button onClick={stop} variant="destructive" className="h-8">
                <Square className="w-3.5 h-3.5 mr-1.5" /> Stop
              </Button>
            )}
            {!dataReady && (
              <span className="text-[10px] text-amber-500">Chờ dữ liệu lịch sử nạp xong...</span>
            )}
            {progress && (
              <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary animate-pulse" /> {progress}
              </span>
            )}
            {status === "ready" && !progress && !busy && (
              <span className="text-[10px] font-mono text-emerald-500">● Hoàn tất {elapsed > 0 ? `· ${elapsed.toFixed(2)}s` : ""}</span>
            )}
          </div>

          {/* Timeout progress bar */}
          {busy && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>Elapsed {elapsed.toFixed(1)}s</span>
                <span>Limit {timeoutSec}s</span>
              </div>
              <div className="h-1 bg-muted/40 rounded overflow-hidden">
                <div
                  className={`h-full transition-all ${pctTimeout > 75 ? "bg-red-500" : pctTimeout > 50 ? "bg-amber-500" : "bg-primary"}`}
                  style={{ width: `${pctTimeout}%` }}
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <pre className="text-[11px] font-mono bg-red-950/30 border border-red-900/40 text-red-300 p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
{errorMsg}
            </pre>
          )}

          {/* Metrics */}
          {metrics && Object.keys(metrics).length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" /> Metrics
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(metrics).map(([k, v]) => (
                  <div key={k} className="rounded-md border border-border/40 bg-muted/20 p-2.5">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground truncate">{k}</div>
                    <div className="font-mono text-sm text-primary mt-0.5 truncate">{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          {images.length > 0 && (
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-primary" /> Biểu đồ ({images.length})
              </div>
              {images.map((src, i) => (
                <div key={i} className="relative group rounded-md overflow-hidden border border-border/40 bg-[#0b1120]">
                  <img src={src} alt={`figure ${i + 1}`} className="w-full block" />
                  <button
                    onClick={() => downloadImage(src, i)}
                    className="absolute top-2 right-2 h-7 w-7 rounded-md bg-background/80 hover:bg-primary hover:text-primary-foreground border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Tải PNG"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Stdout */}
          {stdout && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Terminal className="w-3 h-3 text-primary" /> Output
              </div>
              <pre className="text-[11px] font-mono bg-background/60 border border-border/40 p-3 rounded-md overflow-x-auto whitespace-pre-wrap max-h-60">
{stdout}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
