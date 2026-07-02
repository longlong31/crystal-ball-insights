# ============================================================
#  🧪 Playground — thoải mái viết code Python của bạn ở đây
#
#  Biến có sẵn:
#    symbol        : mã CP đang xem
#    closes        : list giá đóng cửa (float)
#    returns       : list lợi suất ngày (float)
#    current_price : giá hiện tại (float | None)
#
#  Thư viện có sẵn: numpy, pandas, matplotlib, scipy (một phần)
#
#  Gán `metrics = {...}` để hiện các KPI ở khối Metrics.
#  Dùng `print(...)` để in ra khối Output.
#  Vẽ với matplotlib — biểu đồ sẽ tự xuất hiện phía dưới.
# ============================================================
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Ví dụ khởi tạo:
prices = pd.Series(closes, dtype="float64")
print(f"Symbol: {symbol}  |  N phiên: {len(prices)}")
print(prices.describe())

plt.figure(figsize=(9, 3.5))
plt.plot(prices, color="#38bdf8", lw=1.3)
plt.title(f"{symbol} — Close (playground)")
plt.grid(alpha=0.2)
plt.tight_layout()

metrics = {
    "Min": round(float(prices.min()), 2),
    "Max": round(float(prices.max()), 2),
    "Mean": round(float(prices.mean()), 2),
    "Std": round(float(prices.std()), 2),
}
