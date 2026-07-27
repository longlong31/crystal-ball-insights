"""Cấu hình trung tâm cho pipeline AI Quản lý danh mục đầu tư."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_RAW = ROOT / "data" / "raw"
DATA_PROCESSED = ROOT / "data" / "processed"
RESULTS = ROOT / "results"
CHECKPOINTS = RESULTS / "checkpoints"
PREDICTIONS = RESULTS / "predictions"
FIGURES = ROOT / "report" / "figures"

for d in [DATA_RAW, DATA_PROCESSED, RESULTS, CHECKPOINTS, PREDICTIONS, FIGURES]:
    d.mkdir(parents=True, exist_ok=True)

# Vũ trụ đầu tư: 12 cổ phiếu vốn hoá lớn đa ngành (Mỹ) + 2 tài sản đa dạng hoá
EQUITY_TICKERS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "JPM", "JNJ",
    "PG", "XOM", "NVDA", "KO", "DIS", "WMT",
]
DIVERSIFIERS = ["TLT", "GLD"]  # trái phiếu dài hạn, vàng
TICKERS = EQUITY_TICKERS + DIVERSIFIERS
BENCHMARK = "SPY"
RISK_FREE_TICKER = "^IRX"  # lãi suất tín phiếu kho bạc Mỹ 13 tuần (annualized %, /100)

START_DATE = "2011-01-01"
END_DATE = None  # None = hôm nay

# Cửa sổ đặc trưng (lookback) và tầm nhìn dự báo (horizon), tính theo phiên giao dịch
LOOKBACK = 60
HORIZON = 21          # ~1 tháng giao dịch -> tần suất tái cân bằng danh mục
EMBARGO = LOOKBACK + HORIZON  # khoảng đệm giữa các tập để tránh rò rỉ dữ liệu (data leakage)

# Ranh giới train / valid / test theo thời gian (walk-forward, không xáo trộn)
TRAIN_END = "2018-12-31"
VALID_END = "2021-12-31"
# TEST: sau VALID_END (+ embargo) đến END_DATE

MAX_WEIGHT = 0.25          # tỷ trọng tối đa mỗi tài sản (long-only, giới hạn tập trung)
TRANSACTION_COST_BPS = 10  # phí giao dịch giả định mỗi lần tái cân bằng (0.10%)
COV_LOOKBACK = 252         # cửa sổ ước lượng hiệp phương sai (rolling, chỉ dùng dữ liệu quá khứ)

SEED = 42
