# ============================================================
# 09 — VALUATION RATIOS (Định giá cơ bản)
# Tính P/E, P/B, P/S, PEG, EV/EBITDA, Price/CF, FCF Yield, DCF sơ bộ
# ------------------------------------------------------------
# Biến có sẵn: symbol, closes, returns, current_price
# ============================================================
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# ---- INPUT: chỉnh các giá trị này để reflect BCTC của DN ----
price          = current_price or (closes[-1] if closes else 0)
eps            = 4.5     # EPS trailing 12M
eps_forward    = 5.2     # EPS forward
book_value_ps  = 22.0    # Book value / share
sales_ps       = 15.0    # Sales / share
ebitda         = 1_200_000_000   # EBITDA (đơn vị $)
shares_out     = 500_000_000     # số CP lưu hành
total_debt     = 800_000_000
total_cash     = 300_000_000
op_cash_flow   = 900_000_000
free_cash_flow = 650_000_000
growth_rate    = 0.12    # tăng trưởng EPS kỳ vọng
discount_rate  = 0.10    # WACC
terminal_g     = 0.03
# ------------------------------------------------------------

market_cap = price * shares_out
ev         = market_cap + total_debt - total_cash

pe          = price / eps if eps else np.nan
fwd_pe      = price / eps_forward if eps_forward else np.nan
peg         = pe / (growth_rate * 100) if growth_rate else np.nan
pb          = price / book_value_ps if book_value_ps else np.nan
ps          = price / sales_ps if sales_ps else np.nan
ev_ebitda   = ev / ebitda if ebitda else np.nan
p_cf        = market_cap / op_cash_flow if op_cash_flow else np.nan
fcf_yield   = free_cash_flow / market_cap if market_cap else np.nan

# --- DCF 5 năm + terminal value ---
years = np.arange(1, 6)
fcfs  = [free_cash_flow * (1 + growth_rate) ** t for t in years]
pv    = [f / (1 + discount_rate) ** t for f, t in zip(fcfs, years)]
tv    = fcfs[-1] * (1 + terminal_g) / (discount_rate - terminal_g)
pv_tv = tv / (1 + discount_rate) ** 5
eq_value    = sum(pv) + pv_tv - total_debt + total_cash
intrinsic   = eq_value / shares_out
upside      = (intrinsic - price) / price if price else np.nan

metrics = {
    "Market Cap ($B)":  f"{market_cap/1e9:.2f}",
    "Enterprise Value ($B)": f"{ev/1e9:.2f}",
    "P/E":              f"{pe:.2f}",
    "Forward P/E":      f"{fwd_pe:.2f}",
    "PEG":              f"{peg:.2f}",
    "P/B":              f"{pb:.2f}",
    "P/S":              f"{ps:.2f}",
    "EV/EBITDA":        f"{ev_ebitda:.2f}",
    "Price/CF":         f"{p_cf:.2f}",
    "FCF Yield":        f"{fcf_yield*100:.2f}%",
    "DCF Intrinsic":    f"${intrinsic:.2f}",
    "Upside vs price":  f"{upside*100:+.2f}%",
}

# --- Biểu đồ so sánh giá thị trường vs DCF ---
fig, ax = plt.subplots(figsize=(9, 4.5))
labels = ["Market Price", "DCF Intrinsic", "Book Value/Share"]
vals   = [price, intrinsic, book_value_ps]
colors = ["#3b82f6", "#10b981" if intrinsic > price else "#ef4444", "#a1a1aa"]
bars = ax.bar(labels, vals, color=colors)
for b, v in zip(bars, vals):
    ax.text(b.get_x() + b.get_width()/2, v, f"${v:.2f}", ha="center", va="bottom", fontsize=10)
ax.set_title(f"{symbol} — Valuation Comparison")
ax.grid(True, alpha=0.3, axis="y")
plt.tight_layout()
