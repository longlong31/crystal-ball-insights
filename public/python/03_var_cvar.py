# ============================================================
#  VaR & CVaR (historical) + Return distribution histogram
# ============================================================
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

r = np.array(returns, dtype="float64")
r = r[~np.isnan(r)]

ALPHA = 0.95
var = -np.percentile(r, (1 - ALPHA) * 100)
cvar = -r[r <= -var].mean()

plt.figure(figsize=(9, 4.2))
plt.hist(r * 100, bins=60, color="#6366f1", alpha=0.85, edgecolor="#1e293b")
plt.axvline(-var * 100, color="#ef4444", ls="--", lw=1.4,
            label=f"VaR 95% = {-var*100:.2f}%")
plt.axvline(-cvar * 100, color="#b91c1c", ls=":", lw=1.6,
            label=f"CVaR 95% = {-cvar*100:.2f}%")
plt.title(f"{symbol} — Phân phối lợi suất ngày")
plt.xlabel("Return (%)")
plt.ylabel("Tần suất")
plt.legend()
plt.grid(alpha=0.2)
plt.tight_layout()

metrics = {
    "VaR 95% (1 ngày)": f"{var*100:.2f}%",
    "CVaR 95% (1 ngày)": f"{cvar*100:.2f}%",
    "Skewness": round(float(pd.Series(r).skew()), 3),
    "Kurtosis (excess)": round(float(pd.Series(r).kurt()), 3),
    "N mẫu": int(len(r)),
}
print(f"VaR 95% = {var*100:.2f}% | CVaR 95% = {cvar*100:.2f}%")
