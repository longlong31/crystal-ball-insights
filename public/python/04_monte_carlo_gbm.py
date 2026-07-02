# ============================================================
#  Monte Carlo — Geometric Brownian Motion (1 year, 1000 paths)
# ============================================================
import numpy as np
import matplotlib.pyplot as plt

r = np.array(returns, dtype="float64")
r = r[~np.isnan(r)]

mu = r.mean() * 252
sigma = r.std(ddof=1) * np.sqrt(252)
S0 = float(current_price) if current_price else float(closes[-1])

T, STEPS, PATHS = 1.0, 252, 1000
dt = T / STEPS
np.random.seed(42)
Z = np.random.standard_normal((STEPS, PATHS))
increments = (mu - 0.5 * sigma ** 2) * dt + sigma * np.sqrt(dt) * Z
S = S0 * np.exp(np.cumsum(increments, axis=0))

plt.figure(figsize=(9, 4.2))
plt.plot(S[:, :80], lw=0.5, alpha=0.55)
plt.axhline(S0, color="#f59e0b", ls="--", lw=1, label=f"S0 = {S0:.2f}")
plt.title(f"{symbol} — 1Y Monte Carlo GBM ({PATHS} đường)")
plt.xlabel("Ngày giao dịch")
plt.ylabel("Giá mô phỏng")
plt.legend()
plt.grid(alpha=0.2)
plt.tight_layout()

end = S[-1]
metrics = {
    "Giá khởi điểm": round(S0, 2),
    "Trung vị 1Y": round(float(np.median(end)), 2),
    "Percentile 5%": round(float(np.percentile(end, 5)), 2),
    "Percentile 95%": round(float(np.percentile(end, 95)), 2),
    "Xác suất tăng": f"{(end > S0).mean()*100:.1f}%",
    "Drift μ (annual)": f"{mu*100:.2f}%",
    "Vol σ (annual)": f"{sigma*100:.2f}%",
}
print(f"Kỳ vọng cuối kỳ: median = {np.median(end):.2f}")
