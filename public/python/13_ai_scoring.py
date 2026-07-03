# ============================================================
# 13 — AI SCORING (0-100) breakdown + recommendation
# Tính điểm heuristic dựa trên returns của symbol hiện tại
# ------------------------------------------------------------
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

r = np.array(returns, dtype=float)
c = np.array(closes, dtype=float)
if len(r) < 30 or len(c) < 30:
    raise ValueError("Cần ít nhất 30 phiên")

# --- factor calculations ---
ann_vol   = np.std(r) * np.sqrt(252)
ann_ret   = np.mean(r) * 252
sharpe    = (ann_ret - 0.04) / ann_vol if ann_vol > 0 else 0
peak      = np.maximum.accumulate(c)
maxdd     = float(((c - peak) / peak).min())

def mom(days):
    return (c[-1] / c[-days - 1] - 1) if len(c) > days else 0

m1, m3, m6 = mom(21), mom(63), mom(126)

def clamp(x): return max(0, min(100, x))

technical = clamp(50
    + (25 if 40 < 100*pd.Series(r).tail(14).mean()*100 < 100 else 0)
    + (15 if m1 > 0 else -10)
    + (10 if m3 > 0 else -10))
momentum = clamp(50 + m1 * 200 + m3 * 100 + m6 * 50)
risk     = clamp(100 - ann_vol * 150 + maxdd * 100)   # maxdd negative
growth   = clamp(50 + ann_ret * 100)
value    = clamp(50)      # placeholder — cần P/E, P/B thực
quality  = clamp(50 + sharpe * 20)
fundamental = clamp((growth + quality + value) / 3)

overall = clamp(
    fundamental*0.25 + technical*0.15 + momentum*0.15
    + growth*0.15 + quality*0.15 + risk*0.10 + value*0.05
)

if overall >= 75:   rec, conf = "STRONG BUY", 92
elif overall >= 60: rec, conf = "BUY", 80
elif overall >= 45: rec, conf = "HOLD", 65
elif overall >= 30: rec, conf = "REDUCE", 60
else:               rec, conf = "SELL", 75

metrics = {
    "Overall AI Score": f"{overall:.0f}/100",
    "Recommendation":   rec,
    "Confidence":       f"{conf}%",
    "Fundamental":      f"{fundamental:.0f}",
    "Technical":        f"{technical:.0f}",
    "Momentum":         f"{momentum:.0f}",
    "Growth":           f"{growth:.0f}",
    "Quality":          f"{quality:.0f}",
    "Risk (adj)":       f"{risk:.0f}",
    "Value":            f"{value:.0f}",
    "Sharpe":           f"{sharpe:.3f}",
    "Ann. Vol":         f"{ann_vol*100:.2f}%",
    "Max Drawdown":     f"{maxdd*100:.2f}%",
}

labels = ["Fundamental","Technical","Momentum","Growth","Quality","Risk","Value"]
values = [fundamental, technical, momentum, growth, quality, risk, value]

# Radar chart
angles = np.linspace(0, 2*np.pi, len(labels), endpoint=False).tolist()
values_r = values + [values[0]]
angles_r = angles + [angles[0]]

fig = plt.figure(figsize=(11, 5))
ax1 = fig.add_subplot(121, projection="polar")
ax1.plot(angles_r, values_r, color="#06b6d4", lw=2)
ax1.fill(angles_r, values_r, color="#06b6d4", alpha=0.25)
ax1.set_xticks(angles); ax1.set_xticklabels(labels, fontsize=9)
ax1.set_ylim(0, 100); ax1.set_yticks([25, 50, 75, 100])
ax1.set_title(f"{symbol} — AI Score Radar")

ax2 = fig.add_subplot(122)
colors = ["#10b981" if v >= 65 else "#f59e0b" if v >= 45 else "#ef4444" for v in values]
bars = ax2.barh(labels, values, color=colors)
for b, v in zip(bars, values):
    ax2.text(v + 1, b.get_y() + b.get_height()/2, f"{v:.0f}", va="center", fontsize=9)
ax2.set_xlim(0, 110)
ax2.axvline(overall, color="cyan", lw=2, ls="--", label=f"Overall {overall:.0f}")
ax2.legend(); ax2.set_title(f"Recommendation: {rec} ({conf}% conf)")
ax2.grid(alpha=0.3, axis="x")
plt.tight_layout()
