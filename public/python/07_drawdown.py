# ============================================================
#  Maximum Drawdown & Underwater Curve
# ============================================================
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

s = pd.Series(closes, dtype="float64")
peak = s.cummax()
dd = (s - peak) / peak * 100
max_dd = float(dd.min())
idx_trough = int(dd.idxmin())
idx_peak = int(s.iloc[:idx_trough + 1].idxmax()) if idx_trough > 0 else 0
recovery = None
after = s.iloc[idx_trough:]
above = after[after >= s.iloc[idx_peak]]
if len(above) > 0:
    recovery = int(above.index[0] - idx_trough)

plt.figure(figsize=(9, 4.2))
plt.fill_between(dd.index, dd, 0, color="#ef4444", alpha=0.35)
plt.plot(dd, color="#ef4444", lw=1)
plt.axhline(max_dd, color="#b91c1c", ls="--", lw=1,
            label=f"Max DD = {max_dd:.2f}%")
plt.title(f"{symbol} — Underwater curve (Drawdown %)")
plt.ylabel("Drawdown %")
plt.legend()
plt.grid(alpha=0.2)
plt.tight_layout()

metrics = {
    "Max Drawdown": f"{max_dd:.2f}%",
    "Drawdown hiện tại": f"{float(dd.iloc[-1]):.2f}%",
    "Đỉnh (index)": idx_peak,
    "Đáy (index)": idx_trough,
    "Ngày hồi phục": recovery if recovery is not None else "Chưa hồi phục",
    "% ngày dưới đỉnh": f"{(dd < 0).mean()*100:.1f}%",
}
print(f"Max drawdown = {max_dd:.2f}%")
