# ============================================================
#  Bollinger Bands (20, 2σ) — nhận diện breakout & squeeze
# ============================================================
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

s = pd.Series(closes, dtype="float64")
N, K = 20, 2
ma = s.rolling(N).mean()
sd = s.rolling(N).std(ddof=0)
upper = ma + K * sd
lower = ma - K * sd
width = (upper - lower) / ma * 100

plt.figure(figsize=(9, 4.4))
plt.plot(s, color="#e2e8f0", lw=1.3, label="Close")
plt.plot(ma, color="#3b82f6", lw=1, label=f"MA({N})")
plt.plot(upper, color="#ef4444", lw=0.9, ls="--", label="Upper 2σ")
plt.plot(lower, color="#22c55e", lw=0.9, ls="--", label="Lower 2σ")
plt.fill_between(s.index, lower, upper, color="#3b82f6", alpha=0.08)
plt.title(f"{symbol} — Bollinger Bands ({N}, {K}σ)")
plt.legend(loc="upper left")
plt.grid(alpha=0.2)
plt.tight_layout()

last = float(s.iloc[-1])
zone = "TRÊN BAND" if last > upper.iloc[-1] else "DƯỚI BAND" if last < lower.iloc[-1] else "TRONG BAND"

metrics = {
    "Giá hiện tại": round(last, 2),
    "MA(20)": round(float(ma.iloc[-1]), 2),
    "Upper band": round(float(upper.iloc[-1]), 2),
    "Lower band": round(float(lower.iloc[-1]), 2),
    "Bandwidth %": f"{float(width.iloc[-1]):.2f}%",
    "Vị trí": zone,
}
print(f"Giá đang ở vị trí: {zone}")
