# AI Quản lý Danh mục Đầu tư — Crystal Ball Research

Pipeline nghiên cứu học thuật (Python) minh hoạ ứng dụng AI/ML trong **Quản lý danh mục đầu tư**:
thu thập & tiền xử lý dữ liệu → baseline cổ điển & học sâu → mô hình đề xuất (PA-Transformer) →
ablation studies → backtest walk-forward → demo Streamlit.

Dùng cùng nguồn dữ liệu (Yahoo Finance) với Edge Function `fetch-stock-data` của nền tảng
[crystal-ball.quachthanhlong.com](https://crystal-ball.quachthanhlong.com/platform/stocks), để pipeline
có thể tái sử dụng trực tiếp lên hệ thống thật (xem mục "Kết nối với Crystal Ball" trong `report/REPORT.md`).

## Cài đặt

```bash
cd ai-portfolio-research
pip install -r requirements.txt
```

## Chạy pipeline nghiên cứu đầy đủ

```bash
python -m src.evaluate
```

Lệnh này sẽ: tải dữ liệu (cache tại `data/raw/`) → xây đặc trưng → chia train/valid/test walk-forward
→ huấn luyện toàn bộ baseline (rule-based, classical, deep learning) và mô hình đề xuất (3 giai đoạn
ablation) → backtest từng chiến lược trên tập TEST (ngoài mẫu) → xuất:

- `results/metrics_summary.csv` — bảng so sánh hiệu suất toàn bộ chiến lược
- `results/ablation_table.csv` — bảng ablation studies (A / A+B / A+B+C)
- `results/checkpoints/*.pt` — trọng số mô hình đã huấn luyện
- `report/figures/*.png` — biểu đồ (equity curve, efficient frontier, ablation, so sánh Sharpe)

Có thể chỉnh số epoch tối đa (mặc định 15 cho DL baseline, 20 cho mô hình đề xuất — có early stopping):

```bash
python -c "from src.evaluate import main; main(epochs_dl=25, epochs_proposed=30)"
```

## Chạy demo Streamlit

```bash
streamlit run app_streamlit.py
```

Ứng dụng cho phép: chọn vũ trụ tài sản, chọn chiến lược/mô hình, xem trọng số danh mục đề xuất hiện tại,
Efficient Frontier, backtest ngoài mẫu, và bảng ablation studies. Chạy được ngay cả khi chưa huấn luyện
(các chiến lược rule-based/CAPM/APT/Regression tính on-the-fly); riêng "Proposed PA-Transformer" cần đã
chạy `python -m src.evaluate` (hoặc `src.ablation`) trước để có checkpoint.

## Cấu trúc dự án

```
ai-portfolio-research/
├── src/
│   ├── config.py            # vũ trụ tài sản, mốc thời gian, siêu tham số
│   ├── data_pipeline.py     # thu thập dữ liệu (yfinance) + cache
│   ├── features.py          # kỹ thuật đặc trưng + windowing
│   ├── splits.py            # chia train/valid/test walk-forward (chống leakage)
│   ├── metrics.py           # Sharpe/Sortino/Calmar/MDD/IC/Turnover...
│   ├── optimizer.py         # Markowitz Max-Sharpe / Min-Var / Risk-Parity
│   ├── backtest.py          # walk-forward backtest engine
│   ├── train.py             # huấn luyện baseline cổ điển + DL baseline
│   ├── ablation.py          # huấn luyện & ablation mô hình đề xuất
│   ├── evaluate.py          # script tổng — chạy toàn bộ pipeline
│   ├── baselines/           # regression, capm, apt, rule_based
│   └── models/              # mlp, cnn, rnn, transformer, proposed (PA-Transformer)
├── app_streamlit.py         # demo minh hoạ
├── data/raw/                # cache dữ liệu (CSV)
├── results/                 # metrics_summary.csv, ablation_table.csv, checkpoints/
└── report/
    ├── REPORT.md            # báo cáo đầy đủ (6 bước theo yêu cầu đề bài)
    └── figures/              # biểu đồ xuất ra từ evaluate.py
```

## Ghi chú phương pháp luận

- **Không rò rỉ dữ liệu**: mọi đặc trưng chỉ dùng thông tin trailing; các mô hình được huấn luyện
  (fit/early-stop) **chỉ** trên train/valid, sau đó đóng băng và suy luận walk-forward trên test.
- **Baseline đa dạng**: luật (Equal-Weight, Risk-Parity, 60/40), thống kê cổ điển (Linear Regression,
  CAPM, APT 3-nhân-tố tự xây dựng), học sâu (MLP, CNN, LSTM, GRU, Transformer).
- **Mô hình đề xuất — PA-Transformer**: temporal self-attention (A) + cross-asset attention (A+B) +
  Sharpe-aware loss khả vi (A+B+C). 3 giai đoạn này chính là 3 "tính chất" trong Ablation Studies.
- **Giới hạn cần lưu ý**: vũ trụ đầu tư giới hạn 14 tài sản (Mỹ), không tính slippage/thanh khoản,
  Sharpe backtest có thể khác biệt đáng kể so với live trading — xem phần "Biện luận & giới hạn" trong
  `report/REPORT.md`.
