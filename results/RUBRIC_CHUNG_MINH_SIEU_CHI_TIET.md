# Chứng minh dự án Crystal Ball đáp ứng rubric chấm điểm

Ngày lập: 06/09/2026  
Thư mục dự án: `D:\CRM\crystal-ball-insights`  
Phạm vi chứng minh: nền tảng Crystal Ball và module nghiên cứu định lượng `ai-portfolio-research`

## 1. Kết luận tổng quan

Dự án **Crystal Ball** hoàn toàn đủ năng lực đáp ứng các tiêu chí trong rubric. Đây không chỉ là một giao diện minh họa, mà là một hệ thống có đủ hai lớp:

- **Lớp sản phẩm**: ứng dụng React/TypeScript/Vite phục vụ phân tích cổ phiếu, crypto, danh mục, rủi ro, AI Insights, chatbot, xuất báo cáo và các công cụ định lượng.
- **Lớp nghiên cứu học thuật**: module Python `ai-portfolio-research` triển khai đầy đủ pipeline AI/ML cho bài toán quản lý danh mục đầu tư, gồm dữ liệu thật, tiền xử lý, chia train/valid/test chống rò rỉ dữ liệu, baseline, mô hình đề xuất, ablation study, backtest walk-forward, metrics, checkpoint, hình minh họa, Streamlit demo và báo cáo hoàn chỉnh.

Nếu chấm theo đúng các đầu mục trong ảnh, dự án có thể tự tin ở mức **9.5/10 đến 10/10**. Điểm cần trình bày cẩn trọng là kết quả Sharpe tốt nhất hiện tại thuộc về baseline `APT_3Factor` với Sharpe = **1.626**, chưa phải mô hình đề xuất PA-Transformer vượt toàn bộ baseline. Tuy nhiên rubric yêu cầu "Backtest, Sharpe, MDD và biện luận"; vì vậy việc báo cáo trung thực kết quả ngoài mẫu và giải thích nguyên nhân là một điểm mạnh về phương pháp nghiên cứu, không phải điểm yếu.

## 2. Bảng tự đánh giá theo rubric

| Rubric | Nội dung | Điểm tối đa | Mức đáp ứng | Điểm tự đánh giá |
|---|---:|---:|---|---:|
| R1 | Phân tích bài toán, dữ liệu, tiền xử lý | 1.5 | Đầy đủ và có chiều sâu | 1.5 |
| R2 | Train/Valid/Test và chống data leakage | 1.5 | Rất mạnh: time split, embargo, trailing features, test out-of-sample | 1.5 |
| R3 | Baseline và mô hình so sánh | 1.5 | Rất đầy đủ: rule-based, classical, deep learning | 1.5 |
| R4 | Mô hình đề xuất và Ablation Study | 2.0 | Đầy đủ: PA-Transformer với ba giai đoạn A, A+B, A+B+C | 2.0 |
| R5 | Backtest, Sharpe, MDD và biện luận | 1.5 | Đầy đủ metrics và biện luận; nên trình bày trung thực về Sharpe | 1.4-1.5 |
| R6 | Streamlit, GitHub và khả năng tái lập | 1.0 | Có app Streamlit, README, requirements, script chạy lại, kết quả và checkpoint | 1.0 |
| R7 | Báo cáo, trình bày và mức hoàn thiện | 1.0 | Có báo cáo Markdown/DOCX, figures, bảng kết quả, sản phẩm hoàn chỉnh | 1.0 |
| Tổng |  | 10 |  | **9.9/10** |

## 3. R1 - Phân tích bài toán, dữ liệu, tiền xử lý

### 3.1. Yêu cầu của tiêu chí

Tiêu chí này đánh giá khả năng đặt vấn đề và xử lý dữ liệu trước khi huấn luyện mô hình. Một dự án đạt điểm tối đa cần có:

- Bài toán được phát biểu rõ ràng.
- Input, output và mục tiêu tối ưu được xác định cụ thể.
- Dữ liệu có nguồn gốc hợp lý.
- Quy trình tiền xử lý rõ ràng.
- Đặc trưng đầu vào phù hợp với bản chất bài toán.
- Với bài toán tài chính, cần có universe tài sản, benchmark, lãi suất phi rủi ro, horizon dự báo và chỉ tiêu đánh giá.

### 3.2. Bằng chứng trong dự án

Các file thể hiện rõ tiêu chí R1:

- `ai-portfolio-research/src/config.py`
- `ai-portfolio-research/src/data_pipeline.py`
- `ai-portfolio-research/src/features.py`
- `ai-portfolio-research/README.md`
- `ai-portfolio-research/report/BAO_CAO_HOAN_CHINH.md`
- `ai-portfolio-research/data/raw/prices.csv`
- `ai-portfolio-research/data/raw/riskfree.csv`

### 3.3. Phát biểu bài toán

Dự án chọn bài toán **ứng dụng AI trong quản lý danh mục đầu tư** theo kiến trúc **predict-then-optimize**:

1. Dự báo lợi suất kỳ vọng `mu_hat` cho từng tài sản trong danh mục.
2. Đưa `mu_hat` vào bộ tối ưu hóa danh mục Markowitz Max-Sharpe.
3. Sinh ra trọng số danh mục đề xuất.
4. Đánh giá toàn bộ chiến lược bằng backtest walk-forward ngoài mẫu.

Cách đặt bài toán này phù hợp với tài chính định lượng vì AI không được dùng để "đoán giá" một cách cảm tính, mà dùng để cải thiện đầu vào cho bài toán phân bổ vốn.

### 3.4. Dữ liệu và universe tài sản

Trong `config.py`, dự án định nghĩa rõ universe gồm 14 tài sản:

- 12 cổ phiếu vốn hóa lớn đa ngành của Mỹ: `AAPL`, `MSFT`, `GOOGL`, `AMZN`, `JPM`, `JNJ`, `PG`, `XOM`, `NVDA`, `KO`, `DIS`, `WMT`.
- 2 tài sản đa dạng hóa: `TLT` và `GLD`.
- Benchmark: `SPY`.
- Lãi suất phi rủi ro: `^IRX`.
- Ngày bắt đầu dữ liệu: `2011-01-01`.
- Lookback: 60 phiên giao dịch.
- Horizon dự báo: 21 phiên giao dịch, tương đương khoảng 1 tháng.

Việc chọn 12 cổ phiếu đa ngành cộng với trái phiếu dài hạn và vàng giúp danh mục có tính thực tế hơn so với một tập mã ngẫu nhiên chỉ gồm cổ phiếu công nghệ.

### 3.5. Tiền xử lý dữ liệu

Trong `data_pipeline.py`, pipeline dữ liệu thực hiện:

- Tải giá từ Yahoo Finance qua `yfinance`.
- Sử dụng giá điều chỉnh để phản ánh cổ tức/split hợp lý hơn.
- Cache dữ liệu tại `data/raw/prices.csv`.
- Tải lãi suất phi rủi ro `^IRX` và chuyển về dạng thập phân.
- Căn chỉnh ngày giao dịch giữa các mã.
- Loại các dòng thiếu dữ liệu sau khi căn chỉnh.
- Tính lợi suất hằng ngày bằng `pct_change`.
- Tách dữ liệu thành giá tài sản, lợi suất tài sản, lợi suất benchmark và chuỗi risk-free.

### 3.6. Feature engineering

Trong `features.py`, dự án tạo 7 đặc trưng kỹ thuật cho mỗi tài sản:

| Đặc trưng | Ý nghĩa |
|---|---|
| `ret_1` | Lợi suất 1 phiên |
| `ret_5` | Momentum 5 phiên |
| `ret_21` | Momentum 21 phiên |
| `vol_21` | Biến động rolling 21 phiên |
| `rsi_14` | RSI 14 phiên đã chuẩn hóa |
| `macd_diff` | Độ lệch MACD theo tỷ lệ giá |
| `zscore_50` | Z-score giá so với trung bình động 50 phiên |

Mỗi mẫu đầu vào có dạng `[lookback, số tài sản, số đặc trưng]`, tức dùng 60 phiên quá khứ của 14 tài sản và 7 đặc trưng. Target là lợi suất tương lai từ thời điểm `t` đến `t + 21`.

### 3.7. Kết luận R1

R1 xứng đáng đạt **1.5/1.5** vì dự án có đầy đủ phân tích bài toán, dữ liệu thật, quy trình tiền xử lý, feature engineering, benchmark, risk-free rate, horizon dự báo và cấu trúc input/output rõ ràng.

## 4. R2 - Train/Valid/Test và chống data leakage

### 4.1. Yêu cầu của tiêu chí

Đối với dữ liệu chuỗi thời gian tài chính, chống data leakage là điều kiện bắt buộc. Một dự án tốt phải chứng minh:

- Không chia dữ liệu ngẫu nhiên.
- Chia train/valid/test theo thứ tự thời gian.
- Không sử dụng dữ liệu tương lai để tạo feature.
- Không tinh chỉnh mô hình dựa trên kết quả test.
- Có xử lý rủi ro overlapping window nếu dùng lookback và horizon.

### 4.2. Bằng chứng trong dự án

Các file liên quan:

- `ai-portfolio-research/src/config.py`
- `ai-portfolio-research/src/splits.py`
- `ai-portfolio-research/src/features.py`
- `ai-portfolio-research/src/train.py`
- `ai-portfolio-research/src/evaluate.py`
- `ai-portfolio-research/results/run_meta.json`

### 4.3. Cách chia tập dữ liệu

Trong `config.py`, dự án cấu hình:

- `TRAIN_END = "2018-12-31"`
- `VALID_END = "2021-12-31"`
- `LOOKBACK = 60`
- `HORIZON = 21`
- `EMBARGO = LOOKBACK + HORIZON = 81`

Trong `splits.py`, các tập được chia theo thời gian:

- Train: các mẫu trước hoặc bằng ngày kết thúc train.
- Valid: các mẫu sau ranh giới train, nhưng đã bỏ qua vùng embargo.
- Test: các mẫu sau ranh giới valid, cũng đã bỏ qua vùng embargo.

Theo `run_meta.json`, kết quả chạy hiện tại có:

- Train: **1904 mẫu**.
- Valid: **680 mẫu**.
- Test: **1044 mẫu**.
- Số lần tái cân bằng trên test: **50 lần**.

### 4.4. Cơ chế chống rò rỉ dữ liệu

Dự án có bốn lớp chống leakage:

1. **Đặc trưng trailing**  
   Các feature như volatility, RSI, MACD, z-score đều được tính từ dữ liệu quá khứ đến thời điểm `t`, không dùng dữ liệu sau `t`.

2. **Target forward tách biệt**  
   Target là lợi suất từ `t` đến `t + HORIZON`, trong khi input chỉ gồm dữ liệu đến `t`.

3. **Time split thay vì random split**  
   Dự án không trộn ngẫu nhiên dữ liệu chuỗi thời gian, tránh việc mô hình học từ tương lai để dự báo quá khứ.

4. **Embargo 81 phiên**  
   Vì mỗi mẫu dùng lookback 60 phiên và target 21 phiên, vùng đệm 81 phiên quanh ranh giới train/valid/test giúp tránh overlap giữa cửa sổ đặc trưng và vùng target của các tập khác nhau.

### 4.5. Quy trình huấn luyện

Trong `train.py`, quy trình được ghi rõ:

1. Fit/huấn luyện chỉ trên tập train.
2. Early stopping bằng tập valid đối với mô hình deep learning.
3. Đóng băng tham số sau khi huấn luyện.
4. Suy luận walk-forward tại các ngày tái cân bằng của tập test.

Đây là quy trình đúng chuẩn cho kiểm định ngoài mẫu.

### 4.6. Kết luận R2

R2 xứng đáng đạt **1.5/1.5**. Đây là một trong những điểm mạnh nhất của dự án vì chống leakage không chỉ được nói trong báo cáo mà được cài đặt trực tiếp trong code.

## 5. R3 - Baseline và mô hình so sánh

### 5.1. Yêu cầu của tiêu chí

Một mô hình đề xuất chỉ có ý nghĩa khi được so sánh với baseline hợp lý. Tiêu chí này yêu cầu:

- Có baseline đơn giản.
- Có baseline học máy/thống kê hoặc tài chính truyền thống.
- Có mô hình so sánh đủ đa dạng.
- Tất cả được đánh giá trên cùng một tập test và cùng một protocol.

### 5.2. Bằng chứng trong dự án

Các file liên quan:

- `ai-portfolio-research/src/baselines/rule_based.py`
- `ai-portfolio-research/src/baselines/regression.py`
- `ai-portfolio-research/src/baselines/capm.py`
- `ai-portfolio-research/src/baselines/apt.py`
- `ai-portfolio-research/src/models/mlp.py`
- `ai-portfolio-research/src/models/cnn.py`
- `ai-portfolio-research/src/models/rnn.py`
- `ai-portfolio-research/src/models/transformer.py`
- `ai-portfolio-research/src/train.py`
- `ai-portfolio-research/results/metrics_summary.csv`

### 5.3. Các nhóm baseline

Dự án có nhiều tầng baseline:

| Nhóm | Mô hình/chiến lược |
|---|---|
| Rule-based | EqualWeight, RiskParity, 60/40 |
| Classical | LinearRegression, CAPM, APT_3Factor |
| Deep learning baseline | MLP, CNN, LSTM, GRU, Transformer |
| Proposed | Proposed-A, Proposed-A+B, Proposed-A+B+C |

Tổng cộng có 14 chiến lược/mô hình được so sánh trong `metrics_summary.csv`.

### 5.4. Kết quả so sánh chính

| Strategy | Nhóm | Annual Return | Annual Volatility | Sharpe | Max Drawdown |
|---|---|---:|---:|---:|---:|
| EqualWeight | Rule-based | 19.23% | 12.75% | 1.171 | -16.02% |
| RiskParity | Rule-based | 15.67% | 10.76% | 1.058 | -15.30% |
| 60/40 | Rule-based | 15.85% | 11.20% | 1.032 | -15.50% |
| LinearRegression | Classical | 14.07% | 11.11% | 0.880 | -15.16% |
| CAPM | Classical | 26.05% | 21.08% | 1.032 | -33.59% |
| APT_3Factor | Classical | 26.10% | 13.41% | 1.626 | -13.67% |
| MLP | DL baseline | 8.25% | 12.87% | 0.308 | -15.58% |
| CNN | DL baseline | 13.52% | 11.23% | 0.822 | -14.20% |
| LSTM | DL baseline | 9.86% | 9.29% | 0.599 | -13.59% |
| GRU | DL baseline | 9.39% | 9.40% | 0.542 | -13.35% |
| Transformer | DL baseline | 11.17% | 11.09% | 0.620 | -13.77% |
| Proposed-A | Proposed | 11.02% | 10.14% | 0.663 | -14.43% |
| Proposed-A+B | Proposed | 9.72% | 9.75% | 0.557 | -15.10% |
| Proposed-A+B+C | Proposed | 11.72% | 11.31% | 0.657 | -14.86% |

### 5.5. Kết luận R3

R3 xứng đáng đạt **1.5/1.5** vì dự án không chỉ có một baseline tượng trưng mà có cả rule-based, classical finance và deep learning baseline. Việc so sánh được thực hiện trên cùng tập test và cùng backtest engine nên kết quả có tính công bằng.

## 6. R4 - Mô hình đề xuất và Ablation Study

### 6.1. Yêu cầu của tiêu chí

Đây là tiêu chí có trọng số cao nhất trong rubric. Để đạt điểm tối đa, dự án cần:

- Có mô hình đề xuất riêng.
- Mô tả được ý tưởng và các thành phần chính của mô hình.
- Có ablation study để kiểm tra đóng góp của từng thành phần.
- Có kết quả định lượng và biện luận.

### 6.2. Bằng chứng trong dự án

Các file liên quan:

- `ai-portfolio-research/src/models/proposed.py`
- `ai-portfolio-research/src/ablation.py`
- `ai-portfolio-research/src/evaluate.py`
- `ai-portfolio-research/results/ablation_table.csv`
- `ai-portfolio-research/results/checkpoints/proposed_A_temporal_only.pt`
- `ai-portfolio-research/results/checkpoints/proposed_AB_cross_asset.pt`
- `ai-portfolio-research/results/checkpoints/proposed_ABC_sharpe_loss.pt`
- `ai-portfolio-research/report/figures/ablation_bar.png`

### 6.3. Mô hình đề xuất: PA-Transformer

Mô hình đề xuất là **PA-Transformer (Portfolio-Aware Transformer)**. Mô hình gồm ba ý tưởng chính:

1. **Temporal self-attention**  
   Học quan hệ theo thời gian trong chuỗi đặc trưng của từng tài sản.

2. **Cross-asset attention**  
   Cho phép các tài sản chú ý lẫn nhau, từ đó học tương quan, regime và cấu trúc đồng biến/đối biến giữa các mã.

3. **Sharpe-aware loss**  
   Bổ sung thành phần loss gắn với mục tiêu danh mục, không chỉ tối thiểu hóa sai số dự báo từng tài sản riêng lẻ.

Trong `proposed.py`, mô hình dùng `TemporalEncoder`, `nn.MultiheadAttention`, `LayerNorm`, residual connection và head MLP để sinh dự báo lợi suất cho từng tài sản.

### 6.4. Thiết kế ablation study

Ablation được chia thành ba giai đoạn:

| Giai đoạn | Thành phần | Cross-asset attention | Sharpe-aware loss | Mục đích |
|---|---|---:|---:|---|
| A | Temporal self-attention | Không | Không | Đo hiệu quả của attention theo thời gian |
| A+B | Temporal + cross-asset attention | Có | Không | Đo đóng góp của tương tác giữa tài sản |
| A+B+C | Temporal + cross-asset + Sharpe-aware loss | Có | Có | Đo tác động của loss gắn với mục tiêu danh mục |

Các stage được huấn luyện riêng, không kế thừa trọng số, giúp đánh giá độc lập từng cấu phần.

### 6.5. Kết quả ablation

| Tính chất | Sharpe | Delta so với A |
|---|---:|---:|
| A - temporal self-attention | 0.663 | 0.000 |
| A+B - cross-asset attention | 0.557 | -0.107 |
| A+B+C - Sharpe-aware loss | 0.657 | -0.006 |

### 6.6. Biện luận ablation

Kết quả ablation cho thấy:

- Temporal self-attention là thành phần hiệu quả nhất trong nhóm proposed ở cấu hình hiện tại.
- Cross-asset attention làm Sharpe giảm từ 0.663 xuống 0.557. Nguyên nhân hợp lý là universe chỉ có 14 tài sản, chưa đủ lớn để học cấu trúc tương quan động mà không overfit.
- Sharpe-aware loss giúp phục hồi Sharpe từ 0.557 lên 0.657, gần bằng mô hình A. Điều này cho thấy loss gắn với mục tiêu danh mục có tác dụng như một dạng regularization kinh tế.

Đây là một ablation có giá trị vì nó không chỉ chứng minh "thêm thành phần thì tốt hơn", mà còn chỉ ra điều kiện khi một thành phần phức tạp có thể gây overfitting.

### 6.7. Kết luận R4

R4 xứng đáng đạt **2.0/2.0** vì dự án có mô hình đề xuất riêng, có cài đặt rõ ràng, có ba stage ablation, có checkpoint, có bảng kết quả, có biểu đồ và có biện luận khoa học.

## 7. R5 - Backtest, Sharpe, MDD và biện luận

### 7.1. Yêu cầu của tiêu chí

Tối thiểu cần có:

- Backtest.
- Sharpe Ratio.
- Maximum Drawdown.
- Nhận xét và biện luận kết quả.

Dự án sẽ mạnh hơn nếu có thêm benchmark, transaction cost, turnover, Sortino, Calmar và Information Ratio.

### 7.2. Bằng chứng trong dự án

Các file liên quan:

- `ai-portfolio-research/src/backtest.py`
- `ai-portfolio-research/src/metrics.py`
- `ai-portfolio-research/src/optimizer.py`
- `ai-portfolio-research/src/evaluate.py`
- `ai-portfolio-research/results/metrics_summary.csv`
- `ai-portfolio-research/report/figures/equity_curves.png`
- `ai-portfolio-research/report/figures/sharpe_comparison.png`
- `ai-portfolio-research/report/figures/efficient_frontier.png`

### 7.3. Backtest engine

Trong `backtest.py`, dự án thực hiện walk-forward backtest:

- Backtest chỉ trên tập test ngoài mẫu.
- Tái cân bằng theo chu kỳ khoảng 21 phiên.
- Mỗi lần tái cân bằng, chiến lược chỉ được dùng dữ liệu đến ngày hiện tại.
- Tính transaction cost 10 bps dựa trên mức thay đổi trọng số.
- Ghi nhận period returns, benchmark returns, risk-free returns, lịch sử trọng số và equity curve.

### 7.4. Tối ưu hóa danh mục

Trong `optimizer.py`, danh mục được tối ưu bằng Markowitz Max-Sharpe:

- Covariance ước lượng bằng Ledoit-Wolf shrinkage.
- Tối ưu bằng SLSQP.
- Ràng buộc long-only.
- Tổng trọng số bằng 1.
- Giới hạn tỷ trọng tối đa mỗi tài sản là 25%.

Đây là thiết kế phù hợp thực tế vì tránh danh mục bị dồn quá nhiều vào một mã.

### 7.5. Bộ chỉ số đánh giá

Trong `metrics.py`, dự án tính:

- Annualized Return.
- Annualized Volatility.
- Sharpe Ratio.
- Sortino Ratio.
- Maximum Drawdown.
- Calmar Ratio.
- Information Ratio.
- Average Turnover.
- Information Coefficient.
- Hit Rate.

Bộ chỉ số này vượt yêu cầu R5 vì rubric chỉ nêu Sharpe và MDD.

### 7.6. Kết quả chính

Chiến lược tốt nhất hiện tại:

- `APT_3Factor`
- Annual Return: **26.10%**
- Annual Volatility: **13.41%**
- Sharpe: **1.626**
- Max Drawdown: **-13.67%**
- Calmar: **1.910**

Baseline đơn giản nhưng mạnh:

- `EqualWeight`: Sharpe **1.171**, MDD **-16.02%**.
- `RiskParity`: Sharpe **1.058**, MDD **-15.30%**.
- `60/40`: Sharpe **1.032**, MDD **-15.50%**.

Nhóm proposed:

- `Proposed-A`: Sharpe **0.663**, MDD **-14.43%**.
- `Proposed-A+B`: Sharpe **0.557**, MDD **-15.10%**.
- `Proposed-A+B+C`: Sharpe **0.657**, MDD **-14.86%**.

### 7.7. Biện luận kết quả

Kết quả cho thấy `APT_3Factor` là chiến lược tốt nhất trong thí nghiệm hiện tại. Điều này hợp lý vì APT mang theo prior kinh tế tài chính, trong khi các mô hình deep learning phải học tín hiệu từ dữ liệu returns vốn có tỷ lệ tín hiệu/nhiễu rất thấp.

Việc EqualWeight đạt Sharpe 1.171 cũng là kết quả đáng chú ý. Trong quản lý danh mục, danh mục 1/N thường rất khó bị đánh bại nếu universe không quá lớn và dữ liệu dự báo lợi suất nhiều nhiễu. Đây là hiện tượng đã được biết đến rộng rãi trong tài chính định lượng.

Deep learning baseline và PA-Transformer chưa vượt APT trong setting hiện tại. Tuy nhiên đây không phải thất bại của dự án, mà là kết quả nghiên cứu có giá trị: nó cho thấy mô hình phức tạp cần universe rộng hơn, nhiều dữ liệu hơn hoặc thêm factor kinh tế để phát huy hiệu quả.

### 7.8. Lưu ý về ngưỡng Sharpe 1.8

Trong `evaluate.py`, dự án có vẽ đường tham chiếu Sharpe = 1.8. Kết quả chạy hiện tại chưa có chiến lược nào đạt ngưỡng này; chiến lược tốt nhất là `APT_3Factor` với Sharpe = 1.626.

Nếu giảng viên chỉ chấm theo đúng rubric "Backtest, Sharpe, MDD và biện luận", dự án nên được điểm tối đa hoặc gần tối đa ở R5. Nếu giảng viên yêu cầu bắt buộc Sharpe lớn hơn 1.8, nên tự đánh giá R5 ở mức **1.4/1.5** và giải thích rằng kết quả được giữ trung thực, không tune trên tập test.

### 7.9. Kết luận R5

R5 đạt **1.4-1.5/1.5**. Về mặt kỹ thuật và bằng chứng, dự án đáp ứng rất tốt. Việc không thổi phồng Sharpe giúp báo cáo đáng tin cậy hơn.

## 8. R6 - Streamlit, GitHub và khả năng tái lập

### 8.1. Yêu cầu của tiêu chí

Tiêu chí này đánh giá khả năng trình diễn và tái lập:

- Có ứng dụng Streamlit hoặc giao diện demo.
- Có mã nguồn rõ ràng.
- Có file phụ thuộc.
- Có hướng dẫn chạy lại.
- Có kết quả lưu sẵn hoặc script tái tạo kết quả.
- Có GitHub nếu yêu cầu nộp link.

### 8.2. Bằng chứng trong dự án

Các file liên quan:

- `ai-portfolio-research/app_streamlit.py`
- `ai-portfolio-research/requirements.txt`
- `ai-portfolio-research/README.md`
- `ai-portfolio-research/src/evaluate.py`
- `ai-portfolio-research/results/metrics_summary.csv`
- `ai-portfolio-research/results/ablation_table.csv`
- `ai-portfolio-research/results/checkpoints/*.pt`
- `.git/`
- `README.md`
- `package.json`

### 8.3. Ứng dụng Streamlit

`app_streamlit.py` có 5 tab chính:

- Danh mục đề xuất.
- Efficient Frontier.
- Backtest.
- Ablation Studies.
- Phương pháp.

Người dùng có thể:

- Chọn danh sách tài sản.
- Chọn chiến lược/mô hình.
- Xem trọng số danh mục.
- Tải trọng số danh mục dạng CSV.
- Xem Efficient Frontier.
- Xem backtest và các chỉ số hiệu suất.
- Xem bảng ablation.

### 8.4. Khả năng tái lập

Lệnh chạy lại pipeline nghiên cứu:

```bash
cd ai-portfolio-research
pip install -r requirements.txt
python -m src.evaluate
```

Lệnh chạy demo Streamlit:

```bash
streamlit run app_streamlit.py
```

Kết quả đã có sẵn:

- `metrics_summary.csv`
- `ablation_table.csv`
- `run_meta.json`
- checkpoint `.pt`
- figures `.png`

### 8.5. Kết luận R6

R6 xứng đáng đạt **1.0/1.0**. Nếu chưa có link GitHub public/private, chỉ cần push repository lên GitHub và đính kèm link trong bài nộp.

## 9. R7 - Báo cáo, trình bày và mức hoàn thiện

### 9.1. Yêu cầu của tiêu chí

Tiêu chí này đánh giá mức độ hoàn thiện cuối cùng:

- Báo cáo rõ ràng.
- Có bảng và hình minh họa.
- Có giải thích phương pháp.
- Có kết quả và kết luận.
- Có sản phẩm hoặc demo đủ hoàn chỉnh.

### 9.2. Bằng chứng trong dự án

Các file liên quan:

- `ai-portfolio-research/report/BAO_CAO_HOAN_CHINH.md`
- `ai-portfolio-research/report/BAO_CAO_HOAN_CHINH.docx`
- `ai-portfolio-research/report/REPORT.md`
- `ai-portfolio-research/report/figures/equity_curves.png`
- `ai-portfolio-research/report/figures/ablation_bar.png`
- `ai-portfolio-research/report/figures/efficient_frontier.png`
- `ai-portfolio-research/report/figures/sharpe_comparison.png`
- `README.md`
- `src/pages/platform/*.tsx`
- `src/components/platform/**/*.tsx`

### 9.3. Mức hoàn thiện sản phẩm

Dự án có mức hoàn thiện cao vì có cả:

1. **Pipeline nghiên cứu offline**  
   Bao gồm dữ liệu, feature engineering, split, train, baseline, proposed model, ablation, backtest, metrics, checkpoint và báo cáo.

2. **Ứng dụng demo Streamlit**  
   Cho phép trình diễn trực tiếp các kết quả nghiên cứu.

3. **Nền tảng Crystal Ball dạng web app**  
   Ứng dụng React/TypeScript có nhiều module: dashboard, stock analysis, crypto intelligence, portfolio optimizer, risk engine, AI insights, chatbot, Supabase Edge Functions và export báo cáo.

### 9.4. Kết luận R7

R7 xứng đáng đạt **1.0/1.0** vì dự án có báo cáo hoàn chỉnh, bản DOCX, hình minh họa, bảng kết quả, demo tương tác và sản phẩm web.

## 10. Các bằng chứng nên đưa vào bài nộp

Nên đính kèm hoặc chụp màn hình các file sau:

| Mục | File | Mục đích |
|---|---|---|
| 1 | `ai-portfolio-research/report/BAO_CAO_HOAN_CHINH.docx` | Báo cáo chính |
| 2 | `ai-portfolio-research/results/metrics_summary.csv` | Bảng so sánh toàn bộ mô hình |
| 3 | `ai-portfolio-research/results/ablation_table.csv` | Bảng ablation study |
| 4 | `ai-portfolio-research/results/run_meta.json` | Số mẫu train/valid/test và số lần rebalance |
| 5 | `ai-portfolio-research/report/figures/equity_curves.png` | Equity curve trên tập test |
| 6 | `ai-portfolio-research/report/figures/sharpe_comparison.png` | So sánh Sharpe giữa các mô hình |
| 7 | `ai-portfolio-research/report/figures/ablation_bar.png` | Biểu đồ ablation |
| 8 | `ai-portfolio-research/report/figures/efficient_frontier.png` | Efficient Frontier |
| 9 | `ai-portfolio-research/app_streamlit.py` | Bằng chứng có demo Streamlit |
| 10 | `ai-portfolio-research/src/splits.py` và `features.py` | Bằng chứng chống data leakage |

## 11. Đoạn văn có thể đưa trực tiếp vào báo cáo

Dự án Crystal Ball đáp ứng đầy đủ rubric thông qua một pipeline nghiên cứu AI/ML hoàn chỉnh cho bài toán quản lý danh mục đầu tư. Dữ liệu được lấy từ Yahoo Finance cho 14 tài sản gồm cổ phiếu đa ngành và tài sản đa dạng hóa, benchmark SPY và lãi suất phi rủi ro ^IRX. Quy trình tiền xử lý bao gồm căn chỉnh ngày giao dịch, tính returns, tạo đặc trưng kỹ thuật trailing như momentum, volatility, RSI, MACD và z-score, sau đó tạo mẫu chuỗi thời gian với lookback 60 phiên và horizon 21 phiên.

Dự án đặc biệt chú trọng chống data leakage. Dữ liệu được chia train/valid/test theo thời gian, không shuffle, có embargo 81 phiên quanh ranh giới tập dữ liệu. Mọi đặc trưng đầu vào chỉ sử dụng thông tin quá khứ tại thời điểm dự báo. Các mô hình chỉ được fit trên train, early stopping bằng valid, sau đó đóng băng tham số và suy luận trên test out-of-sample.

Về baseline, dự án so sánh nhiều lớp chiến lược gồm EqualWeight, RiskParity, 60/40, Linear Regression, CAPM, APT 3 Factor, MLP, CNN, LSTM, GRU và Transformer. Mô hình đề xuất là PA-Transformer, kết hợp temporal self-attention, cross-asset attention và Sharpe-aware loss. Ablation study được thiết kế thành ba giai đoạn A, A+B và A+B+C, mỗi giai đoạn được huấn luyện riêng và đánh giá bằng cùng một backtest protocol.

Về đánh giá, dự án có walk-forward backtest trên tập test với 50 lần tái cân bằng, transaction cost 10 bps, tối ưu danh mục Markowitz Max-Sharpe long-only với giới hạn tỷ trọng 25% và covariance Ledoit-Wolf rolling 252 phiên. Bộ chỉ số đánh giá gồm Annualized Return, Annualized Volatility, Sharpe, Sortino, Maximum Drawdown, Calmar, Information Ratio, Turnover, Information Coefficient và Hit Rate. Kết quả tốt nhất hiện tại là APT_3Factor với Sharpe 1.626 và MDD -13.67%. Nhóm mô hình đề xuất có ablation đầy đủ, trong đó Sharpe-aware loss giúp phục hồi hiệu suất sau khi thêm cross-asset attention. Dự án cũng có Streamlit demo, README, requirements, checkpoint, CSV kết quả, figures và báo cáo DOCX/Markdown, bảo đảm khả năng tái lập và trình bày hoàn chỉnh.

## 12. Cách bảo vệ trước hội đồng/giảng viên

Nếu được hỏi "dự án có đáp ứng đủ rubric không?", có thể trả lời:

> Dạ có. Dự án của em đáp ứng đủ cả 7 nhóm tiêu chí. Em có phân tích bài toán rõ ràng, dùng dữ liệu thật từ Yahoo Finance, có tiền xử lý và feature engineering, chia train/valid/test theo thời gian kèm embargo để chống data leakage. Em so sánh nhiều baseline từ rule-based, classical finance đến deep learning. Mô hình đề xuất là PA-Transformer và em có ablation study ba giai đoạn A, A+B, A+B+C. Phần đánh giá có walk-forward backtest ngoài mẫu, Sharpe, MDD, Sortino, Calmar, Information Ratio và Turnover. Ngoài ra em có Streamlit demo, README, requirements, checkpoint, file kết quả CSV, figures và báo cáo DOCX nên có thể tái lập toàn bộ.

Nếu được hỏi "vì sao mô hình đề xuất chưa thắng APT?", có thể trả lời:

> Đây là kết quả em giữ trung thực trên tập test ngoài mẫu. Trong bài toán tài chính, returns có tỷ lệ tín hiệu/nhiễu rất thấp nên mô hình phức tạp chưa chắc thắng baseline có prior kinh tế tốt. APT_3Factor đạt Sharpe cao nhất 1.626, trong khi PA-Transformer cho thấy giá trị nghiên cứu qua ablation: cross-asset attention có dấu hiệu overfit với universe chỉ 14 tài sản, còn Sharpe-aware loss giúp phục hồi hiệu suất. Vì vậy kết quả này không làm yếu dự án, mà cho thấy quy trình đánh giá nghiêm túc và không tune trên test.

## 13. Khuyến nghị để bài nộp chắc hơn

1. Đính kèm file `BAO_CAO_HOAN_CHINH.docx` làm báo cáo chính.
2. Đưa bảng `metrics_summary.csv` và `ablation_table.csv` vào phụ lục.
3. Chụp màn hình app Streamlit ở các tab Backtest, Ablation Studies và Efficient Frontier.
4. Chèn `run_meta.json` để chứng minh số mẫu train/valid/test.
5. Nếu rubric yêu cầu GitHub, push repository lên GitHub và thêm link vào trang đầu báo cáo.
6. Không nên tuyên bố PA-Transformer vượt tất cả baseline; nên nói đúng rằng mô hình đề xuất có thiết kế và ablation đầy đủ, còn kết quả tốt nhất hiện tại thuộc về APT_3Factor.

## 14. Kết luận cuối cùng

Dự án **đáp ứng đầy đủ rubric**. Điểm mạnh nổi bật nằm ở R2, R3, R4 và R5: chia dữ liệu đúng chuẩn chuỗi thời gian, baseline phong phú, mô hình đề xuất có ablation study và đánh giá bằng backtest ngoài mẫu với nhiều chỉ số tài chính. Nếu trình bày trung thực và đính kèm đầy đủ bằng chứng trong thư mục `ai-portfolio-research`, bài nộp hoàn toàn có cơ sở đạt mức điểm rất cao.
