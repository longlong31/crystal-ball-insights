# ============================================================
#  RSI(14) + Price Chart
#  Biến có sẵn: symbol (str), closes (list[float]),
#               returns (list[float]), current_price (float|None)
#  Gán biến `metrics = {...}` để hiển thị KPI trong UI.
# ============================================================
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

s = pd.Series(closes, dtype="float64")

# --- RSI(14) theo Wilder ---
delta = s.diff()
gain = delta.clip(lower=0).rolling(14).mean()
loss = (-delta.clip(upper=0)).rolling(14).mean()
rs = gain / loss.replace(0, np.nan)
rsi = 100 - (100 / (1 + rs))

# --- Vẽ 2 subplot: giá + RSI ---
fig, (ax1, ax2) = plt.subplots(
    2, 1, figsize=(9, 5), sharex=True,
    gridspec_kw={"height_ratios": [2, 1]},
)
ax1.plot(s, color="#10b981", lw=1.4, label="Close")
ax1.set_title(f"{symbol} — Close price")
ax1.legend(loc="upper left")
ax1.grid(alpha=0.2)

ax2.plot(rsi, color="#3b82f6", lw=1.2, label="RSI(14)")
ax2.axhline(70, color="#ef4444", ls="--", lw=0.8)
ax2.axhline(30, color="#22c55e", ls="--", lw=0.8)
ax2.fill_between(rsi.index, 30, 70, color="#1e293b", alpha=0.3)
ax2.set_ylim(0, 100)
ax2.set_title("RSI(14)")
ax2.grid(alpha=0.2)
plt.tight_layout()

# --- KPI ---
last_rsi = float(rsi.iloc[-1]) if not np.isnan(rsi.iloc[-1]) else 0.0
metrics = {
    "RSI cuối kỳ": round(last_rsi, 2),
    "RSI trung bình": round(float(rsi.mean()), 2),
    "Quá mua (>70)": int((rsi > 70).sum()),
    "Quá bán (<30)": int((rsi < 30).sum()),
    "Tín hiệu": "QUÁ MUA" if last_rsi > 70 else "QUÁ BÁN" if last_rsi < 30 else "TRUNG TÍNH",
}
print(f"Đã phân tích {len(s)} phiên. RSI hiện tại: {last_rsi:.2f}")
