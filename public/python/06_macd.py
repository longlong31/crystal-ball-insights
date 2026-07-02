# ============================================================
#  MACD (12, 26, 9) — Momentum & tín hiệu giao cắt
# ============================================================
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

s = pd.Series(closes, dtype="float64")
ema12 = s.ewm(span=12, adjust=False).mean()
ema26 = s.ewm(span=26, adjust=False).mean()
macd = ema12 - ema26
signal = macd.ewm(span=9, adjust=False).mean()
hist = macd - signal

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(9, 5.2), sharex=True,
                                gridspec_kw={"height_ratios": [2, 1]})
ax1.plot(s, color="#e2e8f0", lw=1.2, label="Close")
ax1.plot(ema12, color="#3b82f6", lw=0.9, label="EMA12")
ax1.plot(ema26, color="#f59e0b", lw=0.9, label="EMA26")
ax1.set_title(f"{symbol} — MACD(12,26,9)")
ax1.legend(loc="upper left")
ax1.grid(alpha=0.2)

colors = ["#22c55e" if v >= 0 else "#ef4444" for v in hist.fillna(0)]
ax2.bar(hist.index, hist.fillna(0), color=colors, width=1.0, alpha=0.7)
ax2.plot(macd, color="#3b82f6", lw=1, label="MACD")
ax2.plot(signal, color="#f97316", lw=1, label="Signal")
ax2.axhline(0, color="#64748b", lw=0.7)
ax2.legend(loc="upper left")
ax2.grid(alpha=0.2)
plt.tight_layout()

cross_up = int(((macd.shift(1) < signal.shift(1)) & (macd > signal)).sum())
cross_dn = int(((macd.shift(1) > signal.shift(1)) & (macd < signal)).sum())
last_h = float(hist.iloc[-1])

metrics = {
    "MACD": round(float(macd.iloc[-1]), 4),
    "Signal": round(float(signal.iloc[-1]), 4),
    "Histogram": round(last_h, 4),
    "Golden cross": cross_up,
    "Death cross": cross_dn,
    "Xu hướng": "TĂNG" if last_h > 0 else "GIẢM",
}
print(f"MACD histogram: {last_h:.4f} — {'bullish' if last_h > 0 else 'bearish'}")
