import { useState } from "react";
import { Check, Copy, Code2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

interface Formula {
  id: string;
  title: string;
  category: string;
  desc: string;
  libs: string[];
  code: string;
}

const FORMULAS: Formula[] = [
  // ───── Technical Indicators ─────
  {
    id: "rsi",
    title: "RSI — Relative Strength Index",
    category: "Technical",
    desc: "Momentum oscillator (0–100). >70 quá mua, <30 quá bán.",
    libs: ["pandas", "numpy", "pandas-ta", "TA-Lib"],
    code: `import pandas as pd
import numpy as np

def rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain  = delta.clip(lower=0).rolling(period).mean()
    loss  = (-delta.clip(upper=0)).rolling(period).mean()
    rs    = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))

# Hoặc dùng thư viện:
# import pandas_ta as ta;  df['rsi'] = ta.rsi(df['close'], length=14)
# import talib;            df['rsi'] = talib.RSI(df['close'], timeperiod=14)`,
  },
  {
    id: "macd",
    title: "MACD — Moving Average Convergence Divergence",
    category: "Technical",
    desc: "EMA(12) − EMA(26), Signal = EMA(MACD, 9), Histogram = MACD − Signal.",
    libs: ["pandas", "pandas-ta"],
    code: `def macd(close, fast=12, slow=26, signal=9):
    ema_fast = close.ewm(span=fast,  adjust=False).mean()
    ema_slow = close.ewm(span=slow,  adjust=False).mean()
    macd_line   = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    hist        = macd_line - signal_line
    return macd_line, signal_line, hist`,
  },
  {
    id: "bbands",
    title: "Bollinger Bands",
    category: "Technical",
    desc: "Middle = SMA(20). Upper/Lower = Middle ± k·σ (k=2).",
    libs: ["pandas", "numpy"],
    code: `def bollinger(close, period=20, k=2):
    mid   = close.rolling(period).mean()
    std   = close.rolling(period).std(ddof=0)
    upper = mid + k * std
    lower = mid - k * std
    return upper, mid, lower`,
  },
  {
    id: "ema-sma",
    title: "EMA & SMA",
    category: "Technical",
    desc: "Trung bình động đơn giản và lũy thừa.",
    libs: ["pandas"],
    code: `sma_20 = close.rolling(20).mean()
ema_20 = close.ewm(span=20, adjust=False).mean()`,
  },

  // ───── Risk / Statistics ─────
  {
    id: "volatility",
    title: "Volatility (Annualized σ)",
    category: "Risk",
    desc: "Độ lệch chuẩn lợi suất log nhân √252.",
    libs: ["numpy", "pandas"],
    code: `import numpy as np

log_ret = np.log(close / close.shift(1)).dropna()
vol_annual = log_ret.std(ddof=1) * np.sqrt(252)`,
  },
  {
    id: "beta",
    title: "Beta vs Benchmark (CAPM input)",
    category: "Risk",
    desc: "β = Cov(r_i, r_m) / Var(r_m).",
    libs: ["numpy", "statsmodels"],
    code: `import numpy as np
import statsmodels.api as sm

r_i = stock.pct_change().dropna()
r_m = bench.pct_change().dropna().reindex(r_i.index)

# Cách 1: công thức tay
beta = np.cov(r_i, r_m, ddof=1)[0, 1] / np.var(r_m, ddof=1)

# Cách 2: OLS regression
X = sm.add_constant(r_m)
model = sm.OLS(r_i, X).fit()
alpha, beta = model.params`,
  },
  {
    id: "sharpe",
    title: "Sharpe Ratio",
    category: "Risk",
    desc: "(E[r] − rf) / σ, annualize bằng √252.",
    libs: ["numpy"],
    code: `rf_daily = 0.04 / 252
excess   = returns - rf_daily
sharpe   = (excess.mean() / excess.std(ddof=1)) * np.sqrt(252)`,
  },
  {
    id: "var-cvar",
    title: "VaR & CVaR (Historical)",
    category: "Risk",
    desc: "VaR α = phân vị (1−α) của lợi suất. CVaR = trung bình tail vượt ngưỡng.",
    libs: ["numpy", "pandas"],
    code: `import numpy as np

alpha = 0.95
var   = -np.percentile(returns, (1 - alpha) * 100)
cvar  = -returns[returns <= -var].mean()`,
  },
  {
    id: "maxdd",
    title: "Max Drawdown",
    category: "Risk",
    desc: "Sụt giảm tối đa từ đỉnh cumulative return.",
    libs: ["pandas"],
    code: `cum_ret  = (1 + returns).cumprod()
peak     = cum_ret.cummax()
drawdown = cum_ret / peak - 1
max_dd   = drawdown.min()`,
  },

  // ───── Quant Models ─────
  {
    id: "capm",
    title: "CAPM — Capital Asset Pricing Model",
    category: "Quant Model",
    desc: "E[R_i] = R_f + β·(E[R_m] − R_f). Alpha = chênh lệch thực tế.",
    libs: ["statsmodels", "numpy"],
    code: `import statsmodels.api as sm

rf      = 0.04 / 252
excess_i = r_i - rf
excess_m = r_m - rf

X = sm.add_constant(excess_m)
model = sm.OLS(excess_i, X).fit()
alpha, beta = model.params

expected_return = rf + beta * (excess_m.mean() * 252)`,
  },
  {
    id: "bsm",
    title: "Black-Scholes-Merton (European Option)",
    category: "Quant Model",
    desc: "Định giá Call/Put + Greeks.",
    libs: ["scipy", "numpy"],
    code: `import numpy as np
from scipy.stats import norm

def black_scholes(S, K, T, r, sigma, kind='call'):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    if kind == 'call':
        price = S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)
        delta = norm.cdf(d1)
    else:
        price = K*np.exp(-r*T)*norm.cdf(-d2) - S*norm.cdf(-d1)
        delta = norm.cdf(d1) - 1
    gamma = norm.pdf(d1) / (S*sigma*np.sqrt(T))
    vega  = S*norm.pdf(d1)*np.sqrt(T)
    theta = -(S*norm.pdf(d1)*sigma)/(2*np.sqrt(T)) - r*K*np.exp(-r*T)*norm.cdf(d2)
    rho   = K*T*np.exp(-r*T)*norm.cdf(d2)
    return dict(price=price, delta=delta, gamma=gamma, vega=vega, theta=theta, rho=rho)`,
  },
  {
    id: "arima",
    title: "ARIMA Forecast",
    category: "Quant Model",
    desc: "Mô hình AR(p) I(d) MA(q) cho chuỗi thời gian (lợi suất / giá).",
    libs: ["statsmodels", "pmdarima"],
    code: `from statsmodels.tsa.arima.model import ARIMA

model  = ARIMA(returns, order=(2, 0, 2)).fit()
fcst   = model.forecast(steps=20)

# Tự chọn (p,d,q) tốt nhất bằng AIC:
# import pmdarima as pm
# best = pm.auto_arima(returns, seasonal=False, stepwise=True)`,
  },
  {
    id: "garch",
    title: "GARCH(1,1) — Volatility Clustering",
    category: "Quant Model",
    desc: "σ²_t = ω + α·ε²_{t−1} + β·σ²_{t−1}. Ước lượng bằng MLE.",
    libs: ["arch"],
    code: `from arch import arch_model

am  = arch_model(returns * 100, vol='GARCH', p=1, q=1, dist='normal')
res = am.fit(disp='off')
forecast = res.forecast(horizon=10).variance.iloc[-1] ** 0.5  # σ dự báo`,
  },

  // ───── ML / DL ─────
  {
    id: "xgboost",
    title: "XGBoost / LightGBM — Return Classifier",
    category: "ML",
    desc: "Dự đoán xác suất tăng giá phiên kế tiếp.",
    libs: ["xgboost", "lightgbm", "scikit-learn", "ta"],
    code: `import xgboost as xgb
import pandas as pd, ta
from sklearn.model_selection import TimeSeriesSplit

feat = pd.DataFrame({
    'rsi':  ta.momentum.RSIIndicator(close, 14).rsi(),
    'macd': ta.trend.MACD(close).macd_diff(),
    'vol':  close.pct_change().rolling(20).std(),
    'ret1': close.pct_change(),
}).dropna()
y = (close.shift(-1) > close).astype(int).loc[feat.index]

model = xgb.XGBClassifier(n_estimators=400, max_depth=4, learning_rate=0.03)
model.fit(feat, y)
prob_up = model.predict_proba(feat.iloc[[-1]])[0, 1]`,
  },
  {
    id: "lstm",
    title: "LSTM — Sequence Forecast",
    category: "ML",
    desc: "Mạng RNN học chuỗi giá để forecast multi-step.",
    libs: ["torch", "tensorflow", "transformers"],
    code: `import torch, torch.nn as nn

class LSTMForecaster(nn.Module):
    def __init__(self, n_feat=1, hidden=64, n_layers=2):
        super().__init__()
        self.lstm = nn.LSTM(n_feat, hidden, n_layers, batch_first=True)
        self.head = nn.Linear(hidden, 1)
    def forward(self, x):
        out, _ = self.lstm(x)
        return self.head(out[:, -1])

# Pretrained Transformer (Hugging Face):
# from transformers import AutoModelForCausalLM
# model = AutoModelForCausalLM.from_pretrained("huggingface/time-series-transformer")`,
  },

  // ───── Portfolio ─────
  {
    id: "efrontier",
    title: "Efficient Frontier (Markowitz)",
    category: "Portfolio",
    desc: "Tối ưu hoá w sao cho σ min với mục tiêu return.",
    libs: ["numpy", "scipy", "PyPortfolioOpt"],
    code: `import numpy as np
from scipy.optimize import minimize

mu  = returns.mean() * 252
cov = returns.cov() * 252

def port_vol(w): return np.sqrt(w @ cov @ w)
def neg_sharpe(w, rf=0.04):
    return -((w @ mu - rf) / port_vol(w))

n = len(mu)
cons = [{'type':'eq', 'fun': lambda w: w.sum() - 1}]
bnds = [(0, 1)] * n
w0   = np.repeat(1/n, n)

w_msr = minimize(neg_sharpe, w0, bounds=bnds, constraints=cons).x  # Max Sharpe

# Hoặc:
# from pypfopt import EfficientFrontier
# ef = EfficientFrontier(mu, cov); w = ef.max_sharpe()`,
  },
  {
    id: "montecarlo",
    title: "Monte Carlo Price Simulation (GBM)",
    category: "Portfolio",
    desc: "S_{t+1} = S_t · exp((μ − ½σ²)Δt + σ√Δt · Z).",
    libs: ["numpy"],
    code: `import numpy as np

S0, mu, sigma, T, steps, paths = 100, 0.08, 0.25, 1.0, 252, 10000
dt = T / steps
Z  = np.random.standard_normal((steps, paths))
S  = S0 * np.exp(np.cumsum((mu - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z, axis=0))
p5, p50, p95 = np.percentile(S[-1], [5, 50, 95])`,
  },
  {
    id: "correlation",
    title: "Correlation Matrix",
    category: "Portfolio",
    desc: "Pearson correlation giữa các tài sản.",
    libs: ["pandas", "seaborn"],
    code: `corr = returns.corr(method='pearson')
# Vẽ heatmap:
# import seaborn as sns; sns.heatmap(corr, annot=True, cmap='RdBu_r')`,
  },
];

const CATEGORIES = ["All", "Technical", "Risk", "Quant Model", "ML", "Portfolio"];

export function PythonFormulasPanel() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = FORMULAS.filter((f) => {
    const matchCat = cat === "All" || f.category === cat;
    const q = query.trim().toLowerCase();
    const matchQ = !q || f.title.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q) || f.code.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const copy = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  return (
    <div className="quant-card space-y-4">
      <div className="flex items-center gap-2">
        <Code2 className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-wide uppercase">Python Formulas Library</h3>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">
          {filtered.length}/{FORMULAS.length} công thức
        </span>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Toàn bộ công thức Python dùng để tính các chỉ số / biểu đồ trên trang này. Sao chép & chạy được ngay với
        <code className="mx-1 px-1 rounded bg-muted/40 font-mono text-[10px]">pip install</code> các thư viện liệt kê.
      </p>

      <div className="flex flex-wrap gap-2 items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên / nội dung..."
          className="h-8 text-xs max-w-xs"
        />
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                cat === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {filtered.map((f) => (
          <AccordionItem
            key={f.id}
            value={f.id}
            className="border border-border/40 rounded-lg px-3 bg-muted/10"
          >
            <AccordionTrigger className="hover:no-underline py-2.5">
              <div className="flex items-center gap-2 text-left flex-1 min-w-0">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary shrink-0">
                  {f.category}
                </span>
                <span className="text-xs font-semibold truncate">{f.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <p className="text-xs text-muted-foreground mb-2">{f.desc}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {f.libs.map((l) => (
                  <span key={l} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/40 border border-border/30">
                    {l}
                  </span>
                ))}
              </div>
              <div className="relative">
                <button
                  onClick={() => copy(f.id, f.code)}
                  className="absolute top-2 right-2 z-10 h-7 w-7 rounded-md bg-background/80 hover:bg-primary hover:text-primary-foreground border border-border/50 flex items-center justify-center transition-colors"
                  title="Copy code"
                >
                  {copied === f.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <pre className="text-[11px] leading-relaxed font-mono bg-background/60 border border-border/30 rounded-md p-3 overflow-x-auto">
                  <code>{f.code}</code>
                </pre>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-8">Không có công thức khớp tìm kiếm.</div>
        )}
      </Accordion>
    </div>
  );
}
