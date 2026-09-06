# Bảng đối chiếu rubric - Crystal Ball

| Rubric | Điểm tối đa | Bằng chứng chính | Kết luận |
|---|---:|---|---|
| R1 - Phân tích bài toán, dữ liệu, tiền xử lý | 1.5 | `ai-portfolio-research/src/config.py`, `data_pipeline.py`, `features.py`, `report/BAO_CAO_HOAN_CHINH.md` | Đạt đầy đủ: bài toán predict-then-optimize, dữ liệu Yahoo Finance, 14 tài sản, benchmark SPY, lãi suất phi rủi ro ^IRX, đặc trưng trailing |
| R2 - Train/Valid/Test và chống data leakage | 1.5 | `splits.py`, `features.py`, `train.py`, `results/run_meta.json` | Đạt rất mạnh: chia theo thời gian, embargo 81 phiên, train 1904 mẫu, valid 680 mẫu, test 1044 mẫu, 50 lần tái cân bằng |
| R3 - Baseline và mô hình so sánh | 1.5 | `baselines/`, `models/`, `train.py`, `results/metrics_summary.csv` | Đạt đầy đủ: EqualWeight, RiskParity, 60/40, LinearRegression, CAPM, APT, MLP, CNN, LSTM, GRU, Transformer |
| R4 - Mô hình đề xuất và Ablation Study | 2.0 | `models/proposed.py`, `ablation.py`, `results/ablation_table.csv`, checkpoints | Đạt đầy đủ: PA-Transformer với ba giai đoạn A, A+B, A+B+C; có checkpoint và bảng ablation |
| R5 - Backtest, Sharpe, MDD và biện luận | 1.5 | `backtest.py`, `metrics.py`, `metrics_summary.csv`, `report/figures/*.png` | Đạt: walk-forward backtest, Sharpe, MDD, Sortino, Calmar, Information Ratio, Turnover; nên trình bày trung thực rằng Sharpe tốt nhất hiện tại là 1.626 |
| R6 - Streamlit, GitHub và khả năng tái lập | 1.0 | `app_streamlit.py`, `requirements.txt`, `README.md`, `.git/` | Đạt: có app Streamlit, lệnh chạy lại, kết quả CSV/checkpoint; cần đính kèm link GitHub nếu giảng viên yêu cầu |
| R7 - Báo cáo, trình bày và mức hoàn thiện | 1.0 | `report/BAO_CAO_HOAN_CHINH.docx`, `REPORT.md`, figures, web app React | Đạt: báo cáo hoàn chỉnh, hình minh họa, bảng kết quả, app demo, sản phẩm Crystal Ball |

## Điểm tự đánh giá

**9.9/10** nếu chấm theo mức độ bao phủ rubric. Nếu giảng viên yêu cầu nghiêm ngặt ngưỡng Sharpe 1.8 thì nên tự bảo vệ ở mức **9.5/10**, kèm giải thích rằng đây là kết quả out-of-sample trung thực, không tinh chỉnh trên tập test.

## Câu trả lời ngắn gọn cho câu hỏi "dự án có đủ sức đáp ứng không?"

Có. Dự án đủ sức đáp ứng rubric vì có đầy đủ pipeline nghiên cứu, dữ liệu, chia train/valid/test chống leakage, baseline, mô hình đề xuất, ablation study, backtest, metrics, Streamlit demo và báo cáo. Điểm cần trình bày khéo là kết quả tốt nhất hiện tại thuộc về APT_3Factor với Sharpe 1.626; còn PA-Transformer có giá trị ở thiết kế mô hình và ablation study, không nên nói sai rằng nó đã vượt tất cả baseline.
