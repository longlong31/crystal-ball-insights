# ============================================================
#  Volatility & Sharpe Ratio
#  Tính vol annualized, Sharpe, rolling 20D vol và vẽ biểu đồ.
# ============================================================
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

r = pd.Series(returns, dtype="float64").dropna()

RF_ANNUAL = 0.04
rf_daily = RF_ANNUAL / 252

vol_ann = r.std(ddof=1) * np.sqrt(252)
sharpe = (r.mean() - rf_daily) / r.std(ddof=1) * np.sqrt(252)
rolling_vol = r.rolling(20).std() * np.sqrt(252)

plt.figure(figsize=(9, 3.8))
plt.plot(rolling_vol * 100, color="#f59e0b", lw=1.4)
plt.fill_between(rolling_vol.index, rolling_vol * 100, alpha=0.15, color="#f59e0b")
plt.title(f"{symbol} — Rolling 20D Annualized Volatility (%)")
plt.ylabel("Vol %")
plt.grid(alpha=0.2)
plt.tight_layout()

metrics = {
    "Volatility (annual)": f"{vol_ann*100:.2f}%",
    "Sharpe Ratio": round(float(sharpe), 3),
    "Mean daily return": f"{r.mean()*100:.3f}%",
    "Max daily gain": f"{r.max()*100:.2f}%",
    "Max daily loss": f"{r.min()*100:.2f}%",
    "Số phiên": int(len(r)),
}
print(f"Sharpe = {sharpe:.3f} | Vol = {vol_ann*100:.2f}%")
