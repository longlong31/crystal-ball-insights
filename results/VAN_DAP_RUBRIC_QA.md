# Bộ câu hỏi vấn đáp bảo vệ dự án Crystal Ball theo rubric

Ngày lập: 06/09/2026  
Mục tiêu: chuẩn bị trả lời vấn đáp cho dự án Crystal Ball và module `ai-portfolio-research`  
Tài liệu liên quan: `results/RUBRIC_CHUNG_MINH_SIEU_CHI_TIET.md`

## 1. Tóm tắt 30 giây khi mở đầu vấn đáp

Dạ, dự án của em là **Crystal Ball**, một nền tảng phân tích tài chính và quản lý danh mục đầu tư có tích hợp AI. Phần nghiên cứu chính của em nằm trong module `ai-portfolio-research`, triển khai bài toán **ứng dụng AI/ML trong quản lý danh mục đầu tư** theo kiến trúc **predict-then-optimize**.

Cụ thể, em dùng dữ liệu thật từ Yahoo Finance cho 14 tài sản, gồm 12 cổ phiếu vốn hóa lớn của Mỹ và 2 tài sản đa dạng hóa là TLT và GLD. Em tạo đặc trưng kỹ thuật từ dữ liệu quá khứ, chia train/valid/test theo thời gian có embargo để chống data leakage, so sánh nhiều baseline, đề xuất mô hình PA-Transformer, thực hiện ablation study và đánh giá bằng walk-forward backtest ngoài mẫu với các chỉ số Sharpe, MDD, Sortino, Calmar, Information Ratio và Turnover. Ngoài ra, dự án có Streamlit demo, báo cáo DOCX/Markdown, checkpoint và file kết quả để tái lập.

## 2. Các số liệu bắt buộc phải nhớ

| Nội dung | Giá trị |
|---|---:|
| Số tài sản | 14 |
| Cổ phiếu | AAPL, MSFT, GOOGL, AMZN, JPM, JNJ, PG, XOM, NVDA, KO, DIS, WMT |
| Tài sản đa dạng hóa | TLT, GLD |
| Benchmark | SPY |
| Lãi suất phi rủi ro | ^IRX |
| Lookback | 60 phiên |
| Horizon dự báo | 21 phiên |
| Embargo | 81 phiên |
| Train | 1904 mẫu |
| Valid | 680 mẫu |
| Test | 1044 mẫu |
| Số lần tái cân bằng | 50 |
| Transaction cost | 10 bps |
| Max weight mỗi tài sản | 25% |
| Chiến lược Sharpe cao nhất | APT_3Factor |
| Sharpe tốt nhất | 1.626 |
| MDD của APT_3Factor | -13.67% |
| Sharpe EqualWeight | 1.171 |
| Sharpe Proposed-A | 0.663 |
| Sharpe Proposed-A+B | 0.557 |
| Sharpe Proposed-A+B+C | 0.657 |
| A+B+C+D | Không dùng trong kết quả chính vì chưa có stage D được chạy trong code/checkpoint hiện tại |

## 3. Câu hỏi tổng quan

### Câu 1. Dự án của em giải quyết bài toán gì?

Dạ, dự án giải quyết bài toán **ứng dụng AI trong quản lý danh mục đầu tư**. Em không chỉ dự báo giá cổ phiếu riêng lẻ, mà xây dựng pipeline dự báo lợi suất kỳ vọng cho từng tài sản, sau đó đưa kết quả dự báo vào bộ tối ưu danh mục Markowitz Max-Sharpe để sinh trọng số phân bổ vốn.

Nói ngắn gọn, bài toán gồm hai bước: **predict** là dự báo `mu_hat`, và **optimize** là tối ưu danh mục dựa trên `mu_hat` và ma trận hiệp phương sai.

### Câu 2. Vì sao em chọn bài toán quản lý danh mục thay vì chỉ dự báo giá?

Dạ, vì trong tài chính, dự báo chính xác giá ngày mai là rất khó và dễ bị nhiễu. Quản lý danh mục là bài toán thực tế hơn vì mục tiêu cuối cùng của nhà đầu tư không phải chỉ biết giá tăng hay giảm, mà là phân bổ vốn sao cho cân bằng giữa lợi suất và rủi ro.

Do đó em chọn hướng predict-then-optimize: AI hỗ trợ ước lượng lợi suất kỳ vọng, còn lý thuyết Markowitz đảm nhiệm phần phân bổ danh mục.

### Câu 3. Điểm mới hoặc điểm đóng góp chính của dự án là gì?

Dạ, dự án có ba đóng góp chính:

1. Xây dựng pipeline nghiên cứu hoàn chỉnh từ dữ liệu thật, tiền xử lý, split chống leakage, huấn luyện, backtest đến báo cáo.
2. So sánh nhiều baseline từ rule-based, classical finance đến deep learning.
3. Đề xuất mô hình PA-Transformer và kiểm chứng bằng ablation study ba giai đoạn A, A+B, A+B+C.

Điểm quan trọng là em không chỉ tạo một demo giao diện, mà có cả kết quả định lượng ngoài mẫu và khả năng tái lập.

## 4. Câu hỏi về dữ liệu và tiền xử lý

### Câu 4. Dữ liệu của em lấy từ đâu?

Dạ, dữ liệu được lấy từ Yahoo Finance thông qua thư viện `yfinance`. Dự án sử dụng giá điều chỉnh của 14 tài sản, benchmark SPY và lãi suất phi rủi ro ^IRX.

Dữ liệu được cache lại trong thư mục `ai-portfolio-research/data/raw/`, cụ thể có `prices.csv` và `riskfree.csv`, giúp chạy lại pipeline nhanh hơn và dễ tái lập.

### Câu 5. Vì sao em chọn 14 tài sản này?

Dạ, em chọn 14 tài sản để mô phỏng một danh mục đa dạng hóa nhưng vẫn đủ gọn cho nghiên cứu. Trong đó có 12 cổ phiếu vốn hóa lớn của Mỹ thuộc nhiều ngành như công nghệ, tài chính, y tế, tiêu dùng, năng lượng, bán dẫn và giải trí. Ngoài ra em thêm TLT là trái phiếu dài hạn và GLD là vàng để tăng yếu tố phòng thủ và đa dạng hóa.

Cách chọn này giúp danh mục thực tế hơn so với việc chỉ chọn một nhóm cổ phiếu cùng ngành.

### Câu 6. Input và output của mô hình là gì?

Dạ, input là cửa sổ dữ liệu quá khứ 60 phiên cho mỗi tài sản. Mỗi tài sản có 7 đặc trưng kỹ thuật, gồm returns ngắn hạn, momentum, volatility, RSI, MACD và z-score.

Output là lợi suất kỳ vọng trong 21 phiên tiếp theo cho từng tài sản. Vector dự báo này sau đó được đưa vào bộ tối ưu danh mục để tạo trọng số đầu tư.

### Câu 7. Dự án có những đặc trưng nào?

Dạ, dự án dùng 7 đặc trưng:

- `ret_1`: lợi suất 1 phiên.
- `ret_5`: lợi suất 5 phiên.
- `ret_21`: lợi suất 21 phiên.
- `vol_21`: độ biến động 21 phiên.
- `rsi_14`: RSI 14 phiên.
- `macd_diff`: độ lệch MACD.
- `zscore_50`: z-score giá so với trung bình động 50 phiên.

Các đặc trưng này phản ánh momentum, volatility và trạng thái quá mua/quá bán của tài sản.

### Câu 8. Vì sao các feature này không gây leakage?

Dạ, vì toàn bộ feature đều được tính theo dạng **trailing**, nghĩa là tại thời điểm `t` chỉ sử dụng dữ liệu từ quá khứ đến `t`. Target mới là lợi suất tương lai từ `t` đến `t + 21`.

Như vậy input không chứa thông tin sau thời điểm dự báo, nên không có rò rỉ dữ liệu từ tương lai vào mô hình.

## 5. Câu hỏi về train/valid/test và chống data leakage

### Câu 9. Em chia train/valid/test như thế nào?

Dạ, em chia theo thời gian, không shuffle. Train kết thúc ở ngày 31/12/2018, valid kết thúc ở ngày 31/12/2021, còn test là giai đoạn sau valid và sau khi bỏ vùng embargo.

Kết quả hiện tại có 1904 mẫu train, 680 mẫu valid và 1044 mẫu test.

### Câu 10. Vì sao không được random split trong bài toán này?

Dạ, vì dữ liệu tài chính là chuỗi thời gian. Nếu random split, mô hình có thể học từ dữ liệu tương lai để dự báo quá khứ, dẫn đến kết quả test bị ảo. Trong đầu tư thực tế, tại một thời điểm bất kỳ ta chỉ có dữ liệu quá khứ, nên split phải giữ đúng trật tự thời gian.

### Câu 11. Data leakage là gì?

Dạ, data leakage là hiện tượng thông tin không được phép biết tại thời điểm dự báo lại bị đưa vào quá trình huấn luyện hoặc đánh giá. Trong tài chính, leakage rất nguy hiểm vì có thể làm Sharpe và kết quả backtest đẹp giả tạo, nhưng khi triển khai thực tế thì thất bại.

### Câu 12. Dự án của em chống data leakage bằng cách nào?

Dạ, dự án chống leakage bằng bốn cách:

1. Feature chỉ dùng dữ liệu quá khứ theo cửa sổ trailing.
2. Train/valid/test được chia theo thời gian, không shuffle.
3. Có embargo 81 phiên quanh ranh giới các tập dữ liệu.
4. Mô hình chỉ fit trên train, early stopping bằng valid, sau đó đóng băng tham số và suy luận trên test ngoài mẫu.

### Câu 13. Embargo là gì và vì sao em dùng 81 phiên?

Dạ, embargo là vùng đệm bị loại bỏ quanh ranh giới train/valid/test để tránh overlap thông tin giữa các tập dữ liệu.

Trong dự án, mỗi mẫu dùng lookback 60 phiên và target là lợi suất 21 phiên tương lai. Vì vậy em đặt embargo bằng `LOOKBACK + HORIZON = 60 + 21 = 81` phiên. Điều này giúp tránh trường hợp cửa sổ đầu vào hoặc target của một tập dữ liệu chồng lấn sang tập khác.

### Câu 14. Test set của em có thực sự ngoài mẫu không?

Dạ có. Test set nằm sau giai đoạn train và valid theo thời gian, có embargo trước khi vào test. Mô hình không được fit hay early-stop trên test. Sau khi huấn luyện xong, tham số được đóng băng rồi mới suy luận trên các ngày tái cân bằng của test.

## 6. Câu hỏi về baseline

### Câu 15. Em có những baseline nào?

Dạ, em có ba nhóm baseline:

- Rule-based: EqualWeight, RiskParity, 60/40.
- Classical finance/statistical: Linear Regression, CAPM, APT_3Factor.
- Deep learning baseline: MLP, CNN, LSTM, GRU, Transformer.

Ngoài ra còn có nhóm mô hình đề xuất gồm Proposed-A, Proposed-A+B và Proposed-A+B+C.

### Câu 16. Vì sao cần baseline?

Dạ, baseline là mốc tham chiếu để biết mô hình đề xuất có thực sự tạo giá trị hay không. Nếu không có baseline, ta không biết kết quả mô hình là tốt hay chỉ tốt hơn ngẫu nhiên.

Trong tài chính, baseline đơn giản như EqualWeight hoặc RiskParity rất quan trọng vì nhiều khi mô hình phức tạp không dễ vượt qua chúng.

### Câu 17. Baseline nào tốt nhất trong kết quả hiện tại?

Dạ, baseline tốt nhất là `APT_3Factor`, với Sharpe = 1.626, Annual Return khoảng 26.10%, Annual Volatility khoảng 13.41% và Max Drawdown khoảng -13.67%.

### Câu 17.1. APT_3Factor là gì?

Dạ, `APT_3Factor` là mô hình dựa trên **Arbitrage Pricing Theory**, tức lý thuyết định giá tài sản theo nhiều nhân tố rủi ro. Ý tưởng chính là lợi suất của một tài sản không chỉ phụ thuộc vào thị trường chung, mà còn chịu tác động từ nhiều nhân tố như momentum, volatility hoặc các đặc điểm rủi ro khác.

Trong dự án này, em xây dựng `APT_3Factor` bằng ba nhân tố:

| Nhân tố | Ý nghĩa | Cách xây dựng trong dự án |
|---|---|---|
| `MKT` | Rủi ro thị trường | Lợi suất benchmark SPY trừ lãi suất phi rủi ro |
| `MOM` | Momentum | Long nhóm tài sản có momentum 21 phiên cao, short nhóm momentum thấp |
| `VOL` | Low-volatility | Long nhóm tài sản biến động thấp, short nhóm biến động cao |

Tại mỗi ngày tái cân bằng, hệ thống lấy dữ liệu quá khứ theo rolling window, hồi quy lợi suất từng tài sản theo ba nhân tố này, dự báo lợi suất kỳ vọng 21 phiên tiếp theo, rồi đưa vector dự báo đó vào bộ tối ưu Markowitz Max-Sharpe để tạo trọng số danh mục.

Nói ngắn gọn, `APT_3Factor` không phải mô hình deep learning, mà là một mô hình tài chính định lượng có cơ sở kinh tế rõ ràng: tài sản nào có độ nhạy tốt với các nhân tố thị trường, momentum và volatility sẽ được đánh giá hấp dẫn hơn trong bước tối ưu danh mục.

### Câu 17.2. Vì sao APT_3Factor là lựa chọn tốt nhất để đầu tư?

Dạ, em chọn `APT_3Factor` vì nó tốt nhất theo tiêu chí **lợi suất điều chỉnh rủi ro**, không phải chỉ vì lợi suất tuyệt đối.

Kết quả trên test set ngoài mẫu:

| Chiến lược/mô hình | Sharpe | Annual Return | Annual Volatility | MDD | Calmar |
|---|---:|---:|---:|---:|---:|
| `APT_3Factor` | **1.626** | **26.10%** | 13.41% | **-13.67%** | **1.910** |
| `EqualWeight` | 1.171 | 19.23% | 12.75% | -16.02% | 1.200 |
| `CAPM` | 1.032 | 26.05% | 21.08% | -33.59% | 0.775 |
| `CNN` | 0.822 | 13.52% | 11.23% | -14.20% | 0.952 |
| `Proposed-A+B+C` | 0.657 | 11.72% | 11.31% | -14.86% | 0.789 |

So với `EqualWeight`, APT_3Factor có Sharpe cao hơn 0.455 điểm, Annual Return cao hơn khoảng 6.87 điểm phần trăm và MDD tốt hơn. So với `CAPM`, APT_3Factor có lợi suất gần tương đương nhưng volatility thấp hơn rất nhiều và MDD giảm từ -33.59% xuống -13.67%. So với nhóm deep learning như `CNN`, `Transformer` và nhóm Proposed, APT_3Factor cho Sharpe cao hơn rõ rệt.

Vì vậy, nếu phải khẳng định lựa chọn đầu tư trong phạm vi nghiên cứu này, em chọn `APT_3Factor` vì nó cân bằng tốt nhất giữa sinh lợi và rủi ro. Đây là lựa chọn có bằng chứng định lượng mạnh nhất trên test set, không phải lựa chọn cảm tính.

### Câu 18. Vì sao APT_3Factor lại tốt hơn các mô hình deep learning?

Dạ, nguyên nhân hợp lý là APT mang theo prior kinh tế tài chính. Trong khi đó returns tài chính có tỷ lệ tín hiệu/nhiễu thấp, số lượng tài sản chỉ 14 và số mẫu hữu ích không quá lớn. Deep learning có nhiều tham số hơn nên dễ overfit hoặc học nhiễu nếu dữ liệu không đủ rộng.

Điều này không làm yếu dự án, mà cho thấy việc so sánh baseline là cần thiết và kết quả được giữ trung thực.

### Câu 19. EqualWeight đạt Sharpe 1.171 có ý nghĩa gì?

Dạ, EqualWeight là baseline rất đơn giản nhưng đạt Sharpe 1.171, cho thấy danh mục phân bổ đều vẫn rất mạnh trong môi trường nhiều nhiễu. Đây cũng phù hợp với hiện tượng 1/N puzzle trong quản lý danh mục: chiến lược phân bổ đều thường khó bị đánh bại nếu dự báo lợi suất không đủ chính xác.

## 7. Câu hỏi về mô hình đề xuất PA-Transformer

### Câu 20. Mô hình đề xuất của em là gì?

Dạ, mô hình đề xuất của em là **PA-Transformer**, viết tắt của Portfolio-Aware Transformer. Mô hình kết hợp attention theo thời gian, attention giữa các tài sản và Sharpe-aware loss để dự báo lợi suất kỳ vọng phục vụ tối ưu danh mục.

### Câu 21. PA-Transformer khác Transformer baseline ở đâu?

Dạ, Transformer baseline chủ yếu học chuỗi thời gian của từng tài sản. PA-Transformer bổ sung góc nhìn danh mục:

- Có cross-asset attention để các tài sản học quan hệ với nhau.
- Có Sharpe-aware loss để loss function gắn với mục tiêu hiệu suất danh mục, không chỉ dự báo từng tài sản riêng lẻ.

Vì vậy PA-Transformer được thiết kế theo mục tiêu portfolio management hơn là chỉ forecasting.

### Câu 22. Temporal self-attention dùng để làm gì?

Dạ, temporal self-attention giúp mô hình học các quan hệ theo thời gian trong chuỗi đặc trưng quá khứ, ví dụ momentum, đảo chiều, biến động hoặc các mẫu hành vi lặp lại trong 60 phiên gần nhất.

### Câu 23. Cross-asset attention dùng để làm gì?

Dạ, cross-asset attention cho phép các tài sản "chú ý" lẫn nhau tại cùng một thời điểm. Mục tiêu là học tương quan, cấu trúc ngành, regime thị trường hoặc quan hệ giữa cổ phiếu, trái phiếu và vàng.

### Câu 24. Sharpe-aware loss là gì?

Dạ, Sharpe-aware loss là thành phần loss hướng mô hình đến mục tiêu danh mục. Thay vì chỉ tối thiểu hóa sai số dự báo từng tài sản bằng MSE, Sharpe-aware loss đưa thêm tín hiệu liên quan đến hiệu suất rủi ro-lợi suất của danh mục.

Ý tưởng là mô hình dự báo không chỉ đúng về mặt thống kê, mà còn hữu ích cho quyết định phân bổ vốn.

## 8. Câu hỏi về ablation study

### Câu 25. Ablation study là gì?

Dạ, ablation study là thí nghiệm loại bỏ hoặc thêm từng thành phần của mô hình để đo đóng góp riêng của từng thành phần. Nếu chỉ đưa mô hình cuối cùng, ta không biết phần nào thực sự giúp cải thiện kết quả.

### Câu 26. Em thiết kế ablation như thế nào?

Dạ, em chia PA-Transformer thành ba stage:

- A: chỉ có temporal self-attention.
- A+B: thêm cross-asset attention.
- A+B+C: thêm Sharpe-aware loss.

Mỗi stage được huấn luyện riêng và đánh giá bằng cùng một protocol backtest.

### Câu 27. Kết quả ablation là gì?

Dạ, kết quả là:

- A đạt Sharpe 0.663.
- A+B đạt Sharpe 0.557.
- A+B+C đạt Sharpe 0.657.

Như vậy, cross-asset attention làm giảm Sharpe trong setting hiện tại, còn Sharpe-aware loss giúp phục hồi hiệu suất gần về mức của stage A.

### Câu 28. Vì sao thêm cross-asset attention lại làm kết quả giảm?

Dạ, em cho rằng nguyên nhân là overfitting. Cross-asset attention làm mô hình phức tạp hơn và cần nhiều dữ liệu cross-sectional hơn. Trong khi universe hiện tại chỉ có 14 tài sản, mô hình có thể học nhiễu hoặc tương quan không ổn định thay vì học tín hiệu thật.

### Câu 29. Vậy ablation này có giá trị không nếu kết quả không tăng đều?

Dạ có. Ablation không bắt buộc mọi thành phần thêm vào đều phải cải thiện. Giá trị của ablation là giúp hiểu mô hình. Trong dự án này, ablation chỉ ra rằng temporal attention có ích, cross-asset attention cần universe lớn hơn để phát huy, và Sharpe-aware loss có tác dụng regularization.

Đây là kết luận nghiên cứu trung thực và có giá trị.

### Câu 29.1. Nếu thầy/cô hỏi A+B+C+D là gì thì trả lời sao?

Dạ, trong kết quả thực nghiệm chính thức của dự án, em **không báo cáo A+B+C+D như một kết quả đã chạy**, vì code và checkpoint hiện tại chỉ có ba stage ablation thật:

- `A`: temporal self-attention.
- `A+B`: thêm cross-asset attention.
- `A+B+C`: thêm Sharpe-aware loss.

Vì vậy khi trình bày, em sẽ nói rõ: **A+B+C là mô hình đề xuất đầy đủ trong phạm vi nghiên cứu hiện tại**. Nếu nhắc đến `D`, em chỉ xem `D` là **hướng mở rộng trong tương lai**, chưa đưa vào bảng kết quả chính để tránh báo cáo sai bằng chứng.

Nếu cần định nghĩa hướng mở rộng `D`, em có thể trình bày là:

- `D`: transaction-cost/turnover-aware regularization, tức là thêm ràng buộc hoặc penalty để mô hình không chỉ tối ưu Sharpe mà còn giảm turnover và chi phí giao dịch.

Lý do chọn `D` theo hướng này là vì trong đầu tư thực tế, một mô hình có Sharpe cao nhưng thay đổi danh mục quá nhiều sẽ phát sinh chi phí giao dịch lớn. Do đó, hướng mở rộng hợp lý sau `A+B+C` là làm mô hình nhạy hơn với chi phí vận hành thực tế.

Tuy nhiên, em sẽ nhấn mạnh rằng `D` **chưa được tính vào kết quả thực nghiệm hiện tại**. Kết quả được dùng để chấm và bảo vệ vẫn là `A`, `A+B`, `A+B+C` vì ba stage này có code, checkpoint và bảng `ablation_table.csv`.

### Câu 29.2. Vậy trên slide nên ghi A+B+C hay A+B+C+D?

Dạ, trên slide chính thức nên ghi **A / A+B / A+B+C**, không nên ghi `A+B+C+D` trong bảng kết quả nếu chưa chạy thí nghiệm D.

Cách ghi chuẩn là:

| Stage | Thành phần được thêm | Vai trò | Sharpe |
|---|---|---|---:|
| A | Temporal self-attention | Học quan hệ theo thời gian của từng tài sản | 0.663 |
| A+B | Cross-asset attention | Học quan hệ giữa các tài sản trong danh mục | 0.557 |
| A+B+C | Sharpe-aware loss | Gắn hàm mất mát với mục tiêu Sharpe của danh mục | 0.657 |

Nếu muốn nhắc `D`, chỉ nên đặt ở phần **Future Work**:

`D = transaction-cost/turnover-aware regularization`, hướng tới giảm chi phí giao dịch và tăng khả năng triển khai thực tế.

Như vậy báo cáo vừa đủ mạnh, vừa đúng bằng chứng. Em không nên nói “đã có A+B+C+D” nếu chưa có file kết quả tương ứng.

### Câu 29.3. Nếu thầy/cô hỏi vì sao mô hình đầy đủ A+B+C không phải tốt nhất thì trả lời sao?

Dạ, đây là điểm em sẽ trả lời trung thực. Trong nhóm mô hình đề xuất, `Proposed-A` đạt Sharpe 0.663, còn `Proposed-A+B+C` đạt Sharpe 0.657, tức là gần tương đương nhưng thấp hơn một chút. Điều này cho thấy việc thêm cross-asset attention và Sharpe-aware loss không làm kết quả tăng tuyến tính trong setting dữ liệu hiện tại.

Nguyên nhân hợp lý là số lượng tài sản chỉ có 14, nên cross-asset attention có thể chưa đủ dữ liệu để học quan hệ ổn định giữa các tài sản. Sharpe-aware loss giúp phục hồi hiệu suất từ 0.557 lên 0.657, chứng tỏ thành phần C có tác dụng regularization, nhưng chưa đủ để vượt stage A.

Do đó, kết luận của em là: **mô hình đề xuất có giá trị nghiên cứu vì được phân tích bằng ablation rõ ràng, nhưng chiến lược đầu tư tốt nhất theo kết quả test hiện tại vẫn là APT_3Factor**.

## 9. Câu hỏi về backtest và metrics

### Câu 30. Backtest của em được thực hiện như thế nào?

Dạ, em thực hiện walk-forward backtest trên tập test ngoài mẫu. Mỗi khoảng 21 phiên, hệ thống tái cân bằng danh mục. Tại mỗi ngày tái cân bằng, chiến lược chỉ được dùng dữ liệu đến ngày đó để dự báo và tối ưu trọng số.

Backtest có tính transaction cost 10 bps dựa trên thay đổi trọng số danh mục.

### Câu 31. Vì sao dùng walk-forward backtest?

Dạ, vì walk-forward mô phỏng sát thực tế hơn. Trong thực tế, nhà đầu tư ra quyết định tại từng thời điểm dựa trên dữ liệu đã có, sau đó quan sát kết quả trong tương lai. Walk-forward giúp tránh nhìn trước tương lai và phù hợp với đánh giá ngoài mẫu.

### Câu 32. Sharpe Ratio là gì?

Dạ, Sharpe Ratio đo lợi suất vượt trội trên mỗi đơn vị rủi ro. Công thức tổng quát là lợi suất danh mục trừ lãi suất phi rủi ro, chia cho độ biến động của lợi suất. Sharpe càng cao thì hiệu suất điều chỉnh rủi ro càng tốt.

### Câu 33. MDD là gì?

Dạ, MDD là Maximum Drawdown, tức mức sụt giảm lớn nhất của giá trị danh mục từ đỉnh xuống đáy trong giai đoạn backtest. Chỉ số này đo rủi ro thua lỗ cực đại mà nhà đầu tư có thể phải chịu.

### Câu 34. Vì sao không chỉ dùng accuracy/hit rate?

Dạ, vì trong quản lý danh mục, mục tiêu không chỉ là dự đoán đúng hướng tăng/giảm. Một mô hình có thể dự đoán đúng nhiều lần nhưng sai nặng ở những lần quan trọng. Do đó cần đánh giá bằng chỉ số danh mục như Sharpe, MDD, Sortino, Calmar và Information Ratio.

### Câu 35. Kết quả tốt nhất của dự án là gì?

Dạ, chiến lược tốt nhất hiện tại là `APT_3Factor`, đạt Sharpe 1.626, Annual Return 26.10%, Annual Volatility 13.41%, MDD -13.67% và Calmar 1.910 trên tập test ngoài mẫu.

### Câu 36. Có chiến lược nào đạt Sharpe 1.8 không?

Dạ, trong kết quả chạy hiện tại chưa có chiến lược nào đạt Sharpe 1.8. Chiến lược cao nhất là APT_3Factor với Sharpe 1.626.

Em vẫn trình bày trung thực kết quả này vì nếu cố tinh chỉnh để đạt 1.8 trên tập test thì sẽ có nguy cơ test-set overfitting và làm kết quả mất giá trị khoa học.

### Câu 37. Nếu Sharpe chưa đạt 1.8 thì dự án có bị coi là không đạt không?

Dạ, theo rubric, tiêu chí R5 yêu cầu có backtest, Sharpe, MDD và biện luận, chứ không ghi bắt buộc Sharpe phải lớn hơn 1.8. Dự án của em có đầy đủ backtest và các chỉ số, đồng thời có biện luận trung thực về kết quả.

Nếu giảng viên dùng Sharpe 1.8 như một ngưỡng tham chiếu bổ sung, em sẽ giải thích rằng kết quả hiện tại là out-of-sample nghiêm ngặt, không tune trên test, nên đáng tin cậy hơn một kết quả đẹp nhưng bị overfit.

### Câu 38. Transaction cost được xử lý thế nào?

Dạ, transaction cost được giả định là 10 bps cho mỗi lần tái cân bằng, tính dựa trên tổng mức thay đổi trọng số danh mục. Điều này giúp backtest thực tế hơn vì trong giao dịch thật luôn có chi phí.

### Câu 39. Vì sao giới hạn mỗi tài sản tối đa 25%?

Dạ, giới hạn 25% giúp tránh danh mục tập trung quá mức vào một mã. Nếu không có ràng buộc này, bộ tối ưu Max-Sharpe có thể dồn tỷ trọng lớn vào một tài sản có dự báo tốt, làm danh mục rủi ro hơn và kém thực tế hơn.

### Câu 40. Vì sao dùng Ledoit-Wolf covariance?

Dạ, covariance mẫu thông thường có thể không ổn định khi số tài sản và dữ liệu thay đổi. Ledoit-Wolf shrinkage giúp ước lượng ma trận hiệp phương sai ổn định hơn, từ đó làm bài toán tối ưu danh mục bớt nhạy với nhiễu.

## 10. Câu hỏi về Streamlit, GitHub và tái lập

### Câu 41. Dự án có demo không?

Dạ có. Dự án có demo Streamlit tại `ai-portfolio-research/app_streamlit.py`. Ứng dụng có các tab: Danh mục đề xuất, Efficient Frontier, Backtest, Ablation Studies và Phương pháp.

### Câu 42. Streamlit demo cho phép làm gì?

Dạ, demo cho phép chọn universe tài sản, chọn chiến lược/mô hình, xem trọng số danh mục, tải trọng số dạng CSV, xem Efficient Frontier, xem backtest và xem bảng ablation.

### Câu 43. Làm sao chạy lại pipeline?

Dạ, có thể chạy:

```bash
cd ai-portfolio-research
pip install -r requirements.txt
python -m src.evaluate
```

Lệnh này sẽ tải/cached dữ liệu, tạo feature, chia tập, huấn luyện baseline và mô hình đề xuất, chạy backtest, xuất `metrics_summary.csv`, `ablation_table.csv`, checkpoint và figures.

### Câu 44. Làm sao chạy Streamlit?

Dạ, chạy:

```bash
cd ai-portfolio-research
streamlit run app_streamlit.py
```

### Câu 45. Bằng chứng tái lập nằm ở đâu?

Dạ, bằng chứng tái lập nằm ở:

- `ai-portfolio-research/README.md`
- `ai-portfolio-research/requirements.txt`
- `ai-portfolio-research/src/evaluate.py`
- `ai-portfolio-research/results/metrics_summary.csv`
- `ai-portfolio-research/results/ablation_table.csv`
- `ai-portfolio-research/results/run_meta.json`
- `ai-portfolio-research/results/checkpoints/`

### Câu 46. GitHub có vai trò gì trong rubric?

Dạ, GitHub giúp chứng minh mã nguồn được quản lý, có thể kiểm tra và tái lập. Trong workspace hiện tại dự án đã có `.git`. Nếu cần nộp chính thức, em chỉ cần push repository lên GitHub và đính kèm link trong báo cáo.

## 11. Câu hỏi về báo cáo và mức hoàn thiện

### Câu 47. Báo cáo chính nằm ở đâu?

Dạ, báo cáo chính nằm trong:

- `ai-portfolio-research/report/BAO_CAO_HOAN_CHINH.md`
- `ai-portfolio-research/report/BAO_CAO_HOAN_CHINH.docx`

Ngoài ra có tài liệu chứng minh rubric tại `results/RUBRIC_CHUNG_MINH_SIEU_CHI_TIET.md`.

### Câu 48. Dự án có hình minh họa kết quả không?

Dạ có. Các hình nằm trong `ai-portfolio-research/report/figures/`, gồm:

- `equity_curves.png`
- `sharpe_comparison.png`
- `ablation_bar.png`
- `efficient_frontier.png`

### Câu 49. Dự án có phải chỉ là nghiên cứu offline không?

Dạ không. Dự án có cả nghiên cứu offline và sản phẩm web. Nghiên cứu offline nằm trong `ai-portfolio-research`, còn sản phẩm web Crystal Ball là ứng dụng React/TypeScript có dashboard, stock analysis, crypto intelligence, portfolio optimizer, risk engine, AI insights, chatbot và export báo cáo.

### Câu 50. Theo em dự án tự chấm được bao nhiêu điểm?

Dạ, nếu theo đúng rubric, em tự đánh giá khoảng **9.5 đến 10/10**. Dự án đáp ứng đủ R1 đến R7. Điểm em trình bày cẩn trọng nhất là R5 vì Sharpe tốt nhất hiện tại là 1.626, chưa vượt ngưỡng tham chiếu 1.8 nếu giảng viên xem đó là mục tiêu bắt buộc. Tuy nhiên dự án có backtest, Sharpe, MDD và biện luận đầy đủ nên vẫn đáp ứng tiêu chí.

## 12. Các câu hỏi khó và cách trả lời an toàn

### Câu 51. Nếu mô hình đề xuất không tốt nhất thì vì sao vẫn gọi là mô hình đề xuất?

Dạ, mô hình đề xuất là phần em tự thiết kế để kiểm chứng một hướng tiếp cận mới, không có nghĩa là bắt buộc phải thắng mọi baseline trong mọi setting. Trong nghiên cứu nghiêm túc, nếu mô hình đề xuất không thắng nhưng ablation cho thấy nguyên nhân và điều kiện cải thiện, kết quả vẫn có giá trị.

Ở đây, PA-Transformer giúp em rút ra rằng cross-asset attention cần universe lớn hơn, còn Sharpe-aware loss có tác dụng phục hồi hiệu suất. Vì vậy mô hình đề xuất vẫn có đóng góp về mặt thiết kế và phân tích.

### Câu 52. Có phải em đã chọn kết quả đẹp nhất không?

Dạ không. Em giữ kết quả chạy ngoài mẫu trong `metrics_summary.csv` và báo cáo cả kết quả chưa đạt kỳ vọng. Em không tune lại trên test để ép Sharpe cao hơn vì điều đó có thể gây test-set overfitting.

### Câu 53. Vì sao không dùng thêm dữ liệu sentiment/news?

Dạ, nền tảng Crystal Ball có các thành phần AI và sentiment/news ở lớp sản phẩm, nhưng trong module nghiên cứu này em cố tình giới hạn vào dữ liệu giá, benchmark và risk-free để giữ pipeline gọn, dễ tái lập và kiểm soát leakage. Đây là lựa chọn thiết kế để ưu tiên tính nghiêm ngặt của thí nghiệm.

Hướng phát triển tiếp theo là thêm sentiment hoặc macro factors, nhưng cần thiết kế rất cẩn thận để tránh leakage theo thời điểm công bố tin tức.

### Câu 54. Nếu muốn cải thiện PA-Transformer, em sẽ làm gì?

Dạ, em sẽ làm bốn hướng:

1. Mở rộng universe từ 14 tài sản lên 50-100 tài sản hoặc hơn.
2. Thêm factor kinh tế/tài chính như market, size, value, momentum, volatility.
3. Thử retraining walk-forward định kỳ thay vì train một lần.
4. Tối ưu hyperparameter bằng valid set, tuyệt đối không dùng test để tune.

### Câu 55. Vì sao dùng horizon 21 phiên?

Dạ, 21 phiên tương đương khoảng một tháng giao dịch. Đây là tần suất hợp lý cho quản lý danh mục vì không quá ngắn để bị nhiễu intraday/ngắn hạn, cũng không quá dài khiến mô hình phản ứng chậm với thay đổi thị trường.

### Câu 56. Vì sao dùng lookback 60 phiên?

Dạ, 60 phiên tương đương khoảng ba tháng giao dịch. Khoảng này đủ để mô hình quan sát momentum, volatility và trạng thái kỹ thuật gần đây, nhưng không quá dài khiến dữ liệu cũ làm loãng tín hiệu.

### Câu 57. Nếu dữ liệu Yahoo Finance có lỗi thì sao?

Dạ, dự án có bước căn chỉnh ngày và loại bỏ dòng thiếu dữ liệu. Ngoài ra dữ liệu được cache lại để tái lập cùng một kết quả. Trong triển khai thực tế, em sẽ bổ sung kiểm tra outlier, so sánh nhiều nguồn dữ liệu và logging chất lượng dữ liệu.

### Câu 58. Vì sao dùng Max-Sharpe thay vì Min-Variance?

Dạ, Min-Variance chỉ tập trung giảm rủi ro, còn Max-Sharpe cân bằng giữa lợi suất kỳ vọng và rủi ro. Vì mục tiêu của bài toán là quản lý danh mục có hiệu suất điều chỉnh rủi ro tốt, Max-Sharpe phù hợp hơn với tiêu chí đánh giá chính là Sharpe Ratio.

### Câu 59. Information Ratio khác Sharpe như thế nào?

Dạ, Sharpe đo lợi suất vượt lãi suất phi rủi ro trên mỗi đơn vị rủi ro tổng thể. Information Ratio đo lợi suất vượt benchmark trên mỗi đơn vị tracking error. Trong dự án, benchmark là SPY, nên Information Ratio cho biết chiến lược tạo alpha so với thị trường tốt đến đâu.

### Câu 60. Turnover có ý nghĩa gì?

Dạ, Turnover đo mức thay đổi trọng số trung bình giữa các lần tái cân bằng. Turnover cao nghĩa là chiến lược giao dịch nhiều, có thể phát sinh chi phí cao và khó triển khai thực tế hơn. Vì vậy em đưa Turnover vào để đánh giá tính khả thi, không chỉ nhìn lợi suất.

## 13. Câu trả lời theo từng rubric

### R1. Phân tích bài toán, dữ liệu, tiền xử lý

Dạ, R1 được đáp ứng vì em đã phát biểu rõ bài toán quản lý danh mục theo kiến trúc predict-then-optimize, dùng dữ liệu thật từ Yahoo Finance, xác định universe 14 tài sản, benchmark SPY, risk-free ^IRX, lookback 60, horizon 21, đồng thời có tiền xử lý và 7 đặc trưng kỹ thuật trailing.

### R2. Train/Valid/Test và chống data leakage

Dạ, R2 được đáp ứng rất mạnh vì em chia dữ liệu theo thời gian, không shuffle, có embargo 81 phiên, feature chỉ dùng dữ liệu quá khứ, mô hình chỉ train trên train, early stopping bằng valid và test hoàn toàn ngoài mẫu.

### R3. Baseline và mô hình so sánh

Dạ, R3 được đáp ứng vì em có nhiều nhóm baseline: EqualWeight, RiskParity, 60/40, Linear Regression, CAPM, APT_3Factor, MLP, CNN, LSTM, GRU và Transformer. Tất cả được đánh giá trên cùng một backtest protocol.

### R4. Mô hình đề xuất và Ablation Study

Dạ, R4 được đáp ứng vì em đề xuất PA-Transformer với temporal self-attention, cross-asset attention và Sharpe-aware loss. Em có ablation ba giai đoạn A, A+B, A+B+C, mỗi giai đoạn được huấn luyện riêng và đánh giá bằng cùng protocol.

### R5. Backtest, Sharpe, MDD và biện luận

Dạ, R5 được đáp ứng vì em có walk-forward backtest ngoài mẫu với 50 lần tái cân bằng, transaction cost 10 bps, Max-Sharpe optimization, Sharpe, MDD, Sortino, Calmar, Information Ratio, Turnover và biện luận rõ kết quả. Chiến lược tốt nhất là APT_3Factor với Sharpe 1.626 và MDD -13.67%.

### R6. Streamlit, GitHub và khả năng tái lập

Dạ, R6 được đáp ứng vì em có app Streamlit tại `app_streamlit.py`, có README, requirements, script `python -m src.evaluate`, CSV kết quả, checkpoint và repository Git. Nếu cần nộp GitHub, em chỉ cần đính kèm link repository.

### R7. Báo cáo, trình bày và mức hoàn thiện

Dạ, R7 được đáp ứng vì em có báo cáo hoàn chỉnh dạng Markdown và DOCX, có bảng kết quả, hình minh họa, Streamlit demo và cả nền tảng web Crystal Ball hoàn thiện ở lớp sản phẩm.

## 14. Checklist trước khi đi vấn đáp

Trước khi vấn đáp, nên mở sẵn các file sau:

- `results/RUBRIC_CHUNG_MINH_SIEU_CHI_TIET.md`
- `results/VAN_DAP_RUBRIC_QA.md`
- `ai-portfolio-research/results/metrics_summary.csv`
- `ai-portfolio-research/results/ablation_table.csv`
- `ai-portfolio-research/results/run_meta.json`
- `ai-portfolio-research/src/splits.py`
- `ai-portfolio-research/src/features.py`
- `ai-portfolio-research/src/models/proposed.py`
- `ai-portfolio-research/src/backtest.py`
- `ai-portfolio-research/app_streamlit.py`

## 15. Câu chốt khi kết thúc vấn đáp

Dạ, điểm mạnh nhất của dự án là em không chỉ xây dựng một mô hình AI riêng lẻ mà triển khai đầy đủ một quy trình nghiên cứu tài chính định lượng có thể tái lập: dữ liệu thật, chống leakage, baseline phong phú, mô hình đề xuất, ablation study, backtest ngoài mẫu và demo tương tác. Kết quả được trình bày trung thực, kể cả khi mô hình phức tạp chưa vượt baseline tốt nhất. Vì vậy em tin dự án đáp ứng đầy đủ rubric và có giá trị cả về mặt kỹ thuật lẫn phương pháp nghiên cứu.
