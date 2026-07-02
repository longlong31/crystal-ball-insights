import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play, Loader2, Download, RefreshCw, Sparkles, Terminal, Image as ImageIcon,
  Cpu, Square, Timer, ChevronDown, ChevronUp, FileCode2, Save, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  symbol: string;
  closes: number[];
  returns: number[];
  dates?: string[];
  currentPrice?: number;
}

type Status = "idle" | "booting" | "ready" | "running" | "error";

interface PyFile {
  id: string;
  label: string;
  path: string;
  desc: string;
}

const PY_FILES: PyFile[] = [
  { id: "rsi",        label: "RSI(14) + Chart",    path: "/python/01_rsi_chart.py",        desc: "Chỉ báo RSI Wilder + biểu đồ giá & vùng quá mua/quá bán" },
  { id: "vol",        label: "Volatility & Sharpe", path: "/python/02_volatility_sharpe.py", desc: "Annualized vol, Sharpe ratio, rolling 20D volatility" },
  { id: "var",        label: "VaR / CVaR",         path: "/python/03_var_cvar.py",         desc: "Historical VaR 95%, CVaR, histogram phân phối lợi suất" },
  { id: "mc",         label: "Monte Carlo GBM",    path: "/python/04_monte_carlo_gbm.py",  desc: "Mô phỏng 1000 đường giá 1 năm bằng Geometric Brownian Motion" },
  { id: "bb",         label: "Bollinger Bands",    path: "/python/05_bollinger_bands.py",  desc: "Bollinger 20/2σ, phát hiện squeeze & breakout" },
  { id: "macd",       label: "MACD (12,26,9)",     path: "/python/06_macd.py",             desc: "MACD, signal line, histogram và đếm giao cắt" },
  { id: "dd",         label: "Max Drawdown",       path: "/python/07_drawdown.py",         desc: "Underwater curve, max drawdown, thời gian hồi phục" },
  { id: "playground", label: "🧪 Playground",       path: "/python/08_playground.py",       desc: "File trống có sẵn context — tự do thử nghiệm code Python" },
];

const TIMEOUT_OPTIONS = [10, 20, 30, 60];
const STORAGE_PREFIX = "crystall-py-lab:";

export function PythonRunnerPanel({ symbol, closes, returns, currentPrice }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<string>("");
  const [activeFile, setActiveFile] = useState<string>(PY_FILES[0].id);
  const [code, setCode] = useState<string>("");
  const [originalCode, setOriginalCode] = useState<string>("");
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [stdout, setStdout] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<Record<string, any> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [timeoutSec, setTimeoutSec] = useState<number>(30);
  const [elapsed, setElapsed] = useState<number>(0);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const activeMeta = PY_FILES.find((f) => f.id === activeFile) ?? PY_FILES[0];

  // Load python file (from localStorage draft if exists, otherwise fetch original)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingFile(true);
      try {
        const res = await fetch(activeMeta.path, { cache: "no-cache" });
        const text = await res.text();
        if (cancelled) return;
        setOriginalCode(text);
        const draft = localStorage.getItem(STORAGE_PREFIX + activeMeta.id);
        setCode(draft && draft.trim().length > 0 ? draft : text);
      } catch (e: any) {
        if (!cancelled) {
          setOriginalCode("# Không tải được file — hãy tự viết code");
          setCode("# Không tải được file — hãy tự viết code");
        }
      } finally {
        if (!cancelled) setLoadingFile(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeFile, activeMeta.path, activeMeta.id]);

  // Auto-save draft
  useEffect(() => {
    if (!loadingFile && code && code !== originalCode) {
      const t = setTimeout(() => {
        localStorage.setItem(STORAGE_PREFIX + activeMeta.id, code);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [code, originalCode, activeMeta.id, loadingFile]);

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
        `⏱️ Hết thời gian (${timeoutSec}s). Worker đã bị dừng.\n` +
        `Mẹo: giảm vòng lặp, vector hoá bằng numpy, hoặc tăng timeout.`
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
    setErrorMsg("⏹ Đã dừng theo yêu cầu.");
    setProgress("");
  }, [killWorker]);

  const resetToOriginal = () => {
    setCode(originalCode);
    localStorage.removeItem(STORAGE_PREFIX + activeMeta.id);
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${symbol}_${activeMeta.id}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadImage = (src: string, idx: number) => {
    const a = document.createElement("a");
    a.href = src;
    a.download = `${symbol}_${activeMeta.id}_${idx + 1}.png`;
    a.click();
  };

  const dataReady = closes && closes.length > 10 && returns && returns.length > 10;
  const busy = status === "booting" || status === "running";
  const pctTimeout = Math.min((elapsed / timeoutSec) * 100, 100);
  const isDirty = code !== originalCode;

  return (
    <div className="quant-card space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <Cpu className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-wide uppercase">Python Lab — .py Files</h3>
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
            Chọn 1 file <code className="mx-0.5 px-1 rounded bg-muted/40 font-mono text-[10px]">.py</code> ở dưới, sửa trực tiếp trong editor rồi bấm Run. Draft tự lưu vào trình duyệt.
            Biến có sẵn: <code className="mx-0.5 px-1 rounded bg-muted/40 font-mono text-[10px]">symbol, closes, returns, current_price</code>.
          </p>

          {/* File tabs */}
          <div className="flex flex-wrap gap-1.5">
            {PY_FILES.map((f) => {
              const hasDraft = !!localStorage.getItem(STORAGE_PREFIX + f.id);
              const isActive = activeFile === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFile(f.id)}
                  className={`text-[10px] px-2 py-1 rounded border transition-colors font-mono flex items-center gap-1 ${
                    isActive
                      ? "bg-primary/20 text-primary border-primary/50"
                      : "bg-muted/30 border-border/40 hover:bg-muted/50"
                  }`}
                  title={f.desc}
                >
                  <FileCode2 className="w-3 h-3" />
                  {f.label}
                  {hasDraft && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Có draft đã lưu" />}
                </button>
              );
            })}
          </div>

          <div className="text-[10px] text-muted-foreground italic">
            📄 <span className="font-mono">{activeMeta.path.split("/").pop()}</span> — {activeMeta.desc}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5">
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
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              {isDirty && (
                <button
                  onClick={resetToOriginal}
                  className="text-[10px] px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/40 transition-colors flex items-center gap-1"
                  title="Bỏ sửa đổi, tải lại nội dung gốc của file"
                >
                  <RotateCcw className="w-3 h-3" /> Reset gốc
                </button>
              )}
              <button
                onClick={downloadCode}
                className="text-[10px] px-2 py-1 rounded-full bg-muted/30 hover:bg-muted/50 border border-border/40 transition-colors flex items-center gap-1"
                title="Tải file .py về máy"
              >
                <Save className="w-3 h-3" /> Tải .py
              </button>
              <button
                onClick={() => { setStdout(""); setImages([]); setMetrics(null); setErrorMsg(""); }}
                className="text-[10px] px-2 py-1 rounded-full bg-muted/30 hover:bg-muted/50 border border-border/40 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Clear output
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="relative">
            {loadingFile && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10 rounded-md">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="ml-2 text-[11px] text-muted-foreground font-mono">Đang tải file...</span>
              </div>
            )}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="w-full h-96 font-mono text-[11px] leading-relaxed bg-background/60 border border-border/40 rounded-md p-3 outline-none focus:border-primary/60 resize-y"
            />
            <div className="absolute bottom-2 right-2 text-[9px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded flex items-center gap-2">
              <span>{code.split("\n").length} dòng · {code.length} ký tự</span>
              {isDirty && <span className="text-amber-400">● modified</span>}
            </div>
          </div>

          {/* Run + status */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={run}
              disabled={busy || !dataReady || loadingFile}
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
              <span className="text-[10px] font-mono text-emerald-500">
                ● Hoàn tất {elapsed > 0 ? `· ${elapsed.toFixed(2)}s` : ""}
              </span>
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
            <pre className="text-[11px] font-mono bg-red-950/30 border border-red-900/40 text-red-300 p-3 rounded-md overflow-x-auto whitespace-pre-wrap max-h-72">
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
