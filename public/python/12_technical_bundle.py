# ============================================================
# 12 — TECHNICAL BUNDLE: ATR, ADX, CCI, MFI, Stoch RSI, OBV
# ------------------------------------------------------------
# Chỉ cần biến `closes`; các chỉ báo cần high/low sẽ được ước lượng
# từ intraday volatility trung bình.
# ============================================================
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

c = pd.Series(closes, dtype=float)
if len(c) < 40:
    raise ValueError("Cần tối thiểu 40 phiên")

# Ước lượng high/low nếu chỉ có closes
daily_range = c.pct_change().abs().rolling(14).mean().bfill() * c
h = c + 0.5 * daily_range
l = c - 0.5 * daily_range
v = pd.Series(np.abs(c.pct_change().fillna(0).values) * 1e6 + 1e5)  # proxy volume

# --- ATR (14) ---
tr = pd.concat([(h - l), (h - c.shift()).abs(), (l - c.shift()).abs()], axis=1).max(axis=1)
atr = tr.rolling(14).mean()

# --- ADX (14) approximate ---
up   = h.diff()
down = -l.diff()
plus_dm  = np.where((up > down) & (up > 0), up, 0.0)
minus_dm = np.where((down > up) & (down > 0), down, 0.0)
plus_di  = 100 * pd.Series(plus_dm).rolling(14).mean() / atr
minus_di = 100 * pd.Series(minus_dm).rolling(14).mean() / atr
dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di + 1e-12)
adx = dx.rolling(14).mean()

# --- CCI (20) ---
tp = (h + l + c) / 3
sma_tp = tp.rolling(20).mean()
mad = tp.rolling(20).apply(lambda x: np.mean(np.abs(x - x.mean())), raw=True)
cci = (tp - sma_tp) / (0.015 * mad)

# --- MFI (14) ---
mf = tp * v
pos_mf = mf.where(tp > tp.shift(), 0).rolling(14).sum()
neg_mf = mf.where(tp < tp.shift(), 0).rolling(14).sum()
mfi = 100 - 100 / (1 + pos_mf / (neg_mf + 1e-12))

# --- RSI + Stoch RSI (14) ---
delta = c.diff()
gain = delta.clip(lower=0).rolling(14).mean()
loss = -delta.clip(upper=0).rolling(14).mean()
rs = gain / (loss + 1e-12)
rsi = 100 - 100 / (1 + rs)
stoch_rsi = 100 * (rsi - rsi.rolling(14).min()) / (rsi.rolling(14).max() - rsi.rolling(14).min() + 1e-12)

# --- OBV ---
obv = (np.sign(c.diff()) * v).fillna(0).cumsum()

metrics = {
    "ATR(14) last":    f"{atr.iloc[-1]:.3f}",
    "ADX(14) last":    f"{adx.iloc[-1]:.2f}",
    "CCI(20) last":    f"{cci.iloc[-1]:.2f}",
    "MFI(14) last":    f"{mfi.iloc[-1]:.2f}",
    "RSI(14) last":    f"{rsi.iloc[-1]:.2f}",
    "StochRSI last":   f"{stoch_rsi.iloc[-1]:.2f}",
    "OBV last":        f"{obv.iloc[-1]:,.0f}",
    "Trend (ADX)":     "Strong" if adx.iloc[-1] > 25 else "Weak/Range",
}

fig, axes = plt.subplots(3, 2, figsize=(13, 9), sharex=True)
axes[0,0].plot(c.values, color="#3b82f6"); axes[0,0].set_title("Close"); axes[0,0].grid(alpha=0.3)
axes[0,1].plot(atr.values, color="#f59e0b"); axes[0,1].set_title("ATR(14)"); axes[0,1].grid(alpha=0.3)
axes[1,0].plot(adx.values, color="#10b981"); axes[1,0].axhline(25, ls="--", color="gray")
axes[1,0].set_title("ADX(14)"); axes[1,0].grid(alpha=0.3)
axes[1,1].plot(cci.values, color="#a855f7"); axes[1,1].axhline(100, ls="--", color="gray")
axes[1,1].axhline(-100, ls="--", color="gray"); axes[1,1].set_title("CCI(20)"); axes[1,1].grid(alpha=0.3)
axes[2,0].plot(mfi.values, color="#ef4444"); axes[2,0].axhline(80, ls="--", color="gray")
axes[2,0].axhline(20, ls="--", color="gray"); axes[2,0].set_title("MFI(14)"); axes[2,0].grid(alpha=0.3)
axes[2,1].plot(stoch_rsi.values, color="#06b6d4"); axes[2,1].axhline(80, ls="--", color="gray")
axes[2,1].axhline(20, ls="--", color="gray"); axes[2,1].set_title("Stoch RSI"); axes[2,1].grid(alpha=0.3)
plt.suptitle(f"{symbol} — Technical Indicator Bundle")
plt.tight_layout()
