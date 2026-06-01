# Crystal Ball - Nền tảng AI & phân tích tài chính

<p align="center">
  <img src="https://quachthanhlong.com/og-image.jpg" alt="Crystal Ball Logo" width="120" />
</p>

<p align="center">
  <strong>Phát triển bởi <a href="https://quachthanhlong.com">Quách Thành Long</a></strong>
</p>

<p align="center">
  <a href="https://quachthanhlong.com">Website</a> •
  <a href="https://quachthanhlong.com/projects">Dự án</a> •
  <a href="https://quachthanhlong.com/contact">Liên hệ</a>
</p>

---

## 📌 Giới thiệu

**Crystal Ball** là nền tảng phân tích tài chính toàn diện, kết hợp:
- Mô phỏng Monte Carlo cho đánh giá rủi ro dự án,
- AI Insights thông minh,
- Phân tích cổ phiếu và crypto chuyên sâu,
- Quản lý danh mục đầu tư, watchlist và cảnh báo giá.

Dự án hướng đến cả chuyên gia tài chính, nhà quản lý danh mục và trader muốn dùng dữ liệu, mô phỏng và AI để ra quyết định nhanh, chính xác.

---

## ✨ Tính năng nổi bật

### 🤖 Nền tảng AI đầu tư
- Chatbot AI real-time giúp phân tích cổ phiếu, crypto và danh mục.
- AI Insights tự động tóm tắt tình hình, rủi ro và cơ hội.
- Hệ thống phản hồi bằng tiếng Việt & tiếng Anh.
- Tích hợp Supabase Edge Functions cho chatbot và phân tích dữ liệu.

### 📊 Phân tích dự án & mô phỏng rủi ro
- Monte Carlo với hàng nghìn kịch bản
- VaR / CVaR, phân phối kết quả, histogram
- NPV, IRR, MIRR, PI, DPP, DSCR, WACC
- ROI, ROE, ROA, EBITDA Margin
- Điểm hòa vốn doanh thu, sản lượng và thời gian
- Stress test kịch bản suy giảm doanh thu, tăng chi phí, biến động lãi suất

### 📈 Phân tích cổ phiếu chuyên sâu
- So sánh hiệu suất tương đối nhiều mã
- Biểu đồ giá normalized (base = 100)
- Ma trận tương quan giữa cổ phiếu
- Xuất báo cáo PDF & Excel từ dashboard
- Hỗ trợ nhập mã, so sánh cổ phiếu Việt Nam và quốc tế

### ₿ Phân tích crypto thông minh
- Dashboard crypto intelligence và chat AI chuyên biệt
- Hỗ trợ vùng giá, chỉ báo kỹ thuật, RSI, Bollinger Bands, EMA
- Tư vấn điểm mua/bán, mức hỗ trợ/kháng cự
- Phân tích rủi ro và tâm lý thị trường real-time

### 💼 Quản lý danh mục & cảnh báo
- Watchlist đa tài sản: cổ phiếu và crypto
- Price alerts theo điều kiện trên/dưới
- Xem nhanh trạng thái từng mã
- Chọn nhanh mã từ watchlist để phân tích chi tiết

### 📉 Risk Engine & Sentiment
- Fear & Greed gauge đánh giá tâm lý thị trường
- Phân tích chiều sâu các yếu tố momentum, tin tức, nhà đầu tư, biến động, ảnh hưởng toàn cầu
- Dashboard rủi ro nền tảng cho cả cổ phiếu và crypto

---

## 🚀 Nền tảng `/platform`

`/src/components/platform/` chứa các tính năng chính của Quant Platform:
- `PlatformLayout.tsx` – cấu trúc sidebar, định tuyến và layout nền tảng
- `PlatformChatDock.tsx` – trợ lý AI luôn hiện trên giao diện
- `CryptoChatPanel.tsx` – chat AI chuyên sâu cho phân tích crypto
- `StockComparison.tsx` – so sánh hiệu suất cổ phiếu và ma trận tương quan
- `CandlestickChart.tsx` – biểu đồ nến với Bollinger Bands và EMA
- `WatchlistPanel.tsx` – watchlist đa tài sản và price alert
- `FearGreedGauge.tsx` – chỉ số tâm lý Fear & Greed

Các trang `/platform` bao gồm:
- Dashboard tổng quan
- Stock Analysis
- Crypto Intel
- Portfolio
- Risk Engine
- AI Insights

---

## 🛠 Công nghệ sử dụng

| Category | Technologies |
|----------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| UI | shadcn/ui, Radix UI, Lucide Icons |
| Charts | Recharts |
| State & Data | React Query, Supabase, custom hooks |
| AI | Google Gemini / Lovable AI Gateway |
| Backend | Supabase Auth, Database, Storage, Edge Functions |
| Export | jsPDF, docx, xlsx |
| Tools | ESLint, Prettier |

---

## ⚙️ Cài đặt local

```bash
git clone <YOUR_GIT_URL>
cd crystal-ball-insights
npm install
npm run dev
```

Mở `http://localhost:5173` để xem ứng dụng.

> Lưu ý: cấu hình Supabase và biến môi trường `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` cần được thiết lập để AI và dữ liệu thị trường hoạt động đầy đủ.

---

## 📁 Cấu trúc dự án

```
crystal-ball-insights/
├── src/
│   ├── components/
│   │   ├── platform/            # Quant Platform: AI, stocks, crypto, portfolio
│   │   ├── community/           # Forum, bài đăng, bình luận
│   │   ├── auth/                # Đăng nhập / đăng ký
│   │   ├── layout/              # Header, footer, layout chung
│   │   └── ui/                  # Component dùng chung
│   ├── pages/                   # Các trang chính
│   ├── lib/                     # Logic, mô phỏng, xuất báo cáo
│   ├── hooks/                   # Custom hooks dữ liệu và state
│   └── integrations/            # Supabase client và API helpers
├── supabase/
│   ├── functions/               # Edge Functions AI & data
│   │   ├── chatbot-ai/          # Chatbot streaming AI
│   │   ├── analyze-project/     # Phân tích dự án tự động
│   │   ├── moderate-content/    # Kiểm duyệt nội dung
│   │   └── fetch-stock-data/    # API lấy dữ liệu cổ phiếu/crypto
│   └── migrations/              # Database schema
└── public/                      # Static assets
```

---

## 🔒 Bảo mật

- Supabase Auth quản lý đăng nhập người dùng
- Row Level Security (RLS) cho dữ liệu
- Kiểm duyệt nội dung AI và cộng đồng
- Role-based access cho Admin và người dùng

---

## 👨‍💻 Về tác giả

**Quách Thành Long** - CTO-level Full-stack Developer

- 🌐 [quachthanhlong.com](https://quachthanhlong.com)
- 📧 [contact@quachthanhlong.com](mailto:contact@quachthanhlong.com)

---

## 📄 License

© 2026 Crystal Ball by Quách Thành Long. All rights reserved.

<p align="center">
  Made with ❤️ in Vietnam
</p>
