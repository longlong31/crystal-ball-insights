# ============================================================
# 10 — QUALITY SCORES: Altman Z-Score & Piotroski F-Score
# ------------------------------------------------------------
# Biến có sẵn: symbol, closes, returns, current_price
# ============================================================
import numpy as np
import matplotlib.pyplot as plt

# ---- INPUT: chỉnh theo BCTC ----
working_capital   = 500_000_000
total_assets      = 5_000_000_000
retained_earnings = 1_200_000_000
ebit              = 800_000_000
market_cap        = (current_price or closes[-1]) * 500_000_000
total_liabilities = 2_500_000_000
sales             = 3_500_000_000

# Piotroski inputs
net_income        = 500_000_000
op_cash_flow      = 600_000_000
roa_curr, roa_prev = 0.10, 0.08
ltd_curr, ltd_prev = 0.35, 0.40   # LT Debt / Assets
cr_curr, cr_prev   = 1.6, 1.4     # Current ratio
shares_curr, shares_prev = 500_000_000, 500_000_000
gm_curr, gm_prev   = 0.32, 0.30   # Gross margin
at_curr, at_prev   = 0.70, 0.65   # Asset turnover

# ---------- Altman Z ----------
A = working_capital / total_assets
B = retained_earnings / total_assets
C = ebit / total_assets
D = market_cap / total_liabilities
E = sales / total_assets
z = 1.2*A + 1.4*B + 3.3*C + 0.6*D + 1.0*E

zone = "Safe" if z > 2.99 else ("Grey" if z > 1.81 else "Distress")

# ---------- Piotroski F ----------
f = 0
f += 1 if net_income > 0 else 0                    # 1 profitability
f += 1 if op_cash_flow > 0 else 0                  # 2
f += 1 if roa_curr > roa_prev else 0               # 3
f += 1 if op_cash_flow > net_income else 0         # 4 quality of earnings
f += 1 if ltd_curr < ltd_prev else 0               # 5 lower leverage
f += 1 if cr_curr > cr_prev else 0                 # 6 higher liquidity
f += 1 if shares_curr <= shares_prev else 0        # 7 no dilution
f += 1 if gm_curr > gm_prev else 0                 # 8 margin up
f += 1 if at_curr > at_prev else 0                 # 9 asset turnover up

f_grade = "Strong" if f >= 7 else ("Neutral" if f >= 4 else "Weak")

metrics = {
    "Altman Z-Score": f"{z:.2f}",
    "Altman Zone":    zone,
    "Piotroski F":    f"{f}/9",
    "F-Score Grade":  f_grade,
    "Working Capital/TA": f"{A:.3f}",
    "RE/TA": f"{B:.3f}",
    "EBIT/TA": f"{C:.3f}",
    "MCap/TL": f"{D:.3f}",
    "Sales/TA": f"{E:.3f}",
}

# --- gauge chart ---
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))

# Altman gauge
ax1.barh(["Distress <1.81", "Grey 1.81-2.99", "Safe >2.99"], [1.81, 1.18, 2.0],
         color=["#ef4444", "#f59e0b", "#10b981"])
ax1.axvline(z, color="cyan", lw=3, label=f"Z = {z:.2f}")
ax1.set_title(f"{symbol} — Altman Z-Score  ({zone})")
ax1.legend()
ax1.grid(alpha=0.3)

# Piotroski bar
ax2.bar(range(1, 10), [1]*9, color="#334155")
ax2.bar(range(1, f + 1), [1]*f, color="#10b981" if f >= 7 else "#f59e0b" if f >= 4 else "#ef4444")
ax2.set_xticks(range(1, 10))
ax2.set_title(f"Piotroski F-Score: {f}/9 — {f_grade}")
ax2.set_ylim(0, 1.4)
ax2.set_yticks([])
plt.tight_layout()
