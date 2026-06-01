# Crystal Ball — Siêu nền tảng AI Phân tích Tài chính & Crypto

<p align="center">
  <img src="https://quachthanhlong.com/og-image.jpg" alt="Crystal Ball Logo" width="120" />
</p>

<p align="center">
  <strong>Được phát triển bởi <a href="https://quachthanhlong.com">Quách Thành Long</a></strong>
</p>

<p align="center">
  <a href="https://quachthanhlong.com">Website</a> •
  <a href="https://quachthanhlong.com/projects">Dự án</a> •
  <a href="https://quachthanhlong.com/contact">Liên hệ</a>
</p>

---

## 🌟 Tóm tắt

**Crystal Ball** là hệ thống phân tích tài chính AI-driven dành cho:
- trader crypto,
- nhà đầu tư cổ phiếu,
- chuyên gia phân tích dự án,
- quản lý danh mục đầu tư.

Nền tảng hợp nhất:
- Phân tích cổ phiếu & crypto real-time,
- Watchlist + alerts thông minh,
- Dashboard rủi ro, mô phỏng Monte Carlo,
- Chatbot AI tư vấn tài chính.

---

## 🎯 Giá trị cốt lõi

- **Nhanh**: truy cập dữ liệu và phân tích mọi lúc.
- **Sâu**: biểu đồ kỹ thuật, ma trận tương quan, phân tích tâm lý.
- **Thông minh**: AI gợi ý đầu tư, phân tích điểm mua/bán, cảnh báo rủi ro.
- **Đa năng**: hỗ trợ cả cổ phiếu Việt Nam, quốc tế và crypto.

---

## 🚀 Điểm mạnh chính

### 1. AI Insights dành cho đầu tư
- Chatbot AI streaming trực tiếp trên giao diện.
- Hướng dẫn phân tích cổ phiếu và crypto bằng ngôn ngữ tự nhiên.
- Tự động tóm tắt rủi ro, cơ hội, vùng hỗ trợ/kháng cự.
- Hỗ trợ tiếng Việt & tiếng Anh.

### 2. Phân tích cổ phiếu & crypto deep-dive
- Biểu đồ nến với EMA, Bollinger Bands, RSI.
- So sánh hiệu suất nhiều mã cùng lúc.
- Chuẩn hóa giá (base = 100) để đánh giá relative strength.
- Ma trận tương quan giúp nhận diện hedge và diversifier.

### 3. Quản lý danh mục & cảnh báo
- Watchlist đa tài sản: cổ phiếu và crypto.
- Price alert dạng `≥` / `≤` để không bỏ lỡ cơ hội.
- Chọn nhanh mã từ watchlist để mở phân tích chi tiết.

### 4. Phân tích dự án và rủi ro tài chính
- Mô phỏng Monte Carlo cho kịch bản lợi nhuận và rủi ro.
- Tính VaR, CVaR, NPV, IRR, MIRR, PI, DPP, WACC.
- Stress test các kịch bản biến động chi phí, doanh thu và lãi suất.

### 5. Sentiment & Risk Engine
- Fear & Greed gauge đo tâm lý thị trường.
- Phân tích yếu tố momentum, tin tức, nhà đầu tư, biến động, ảnh hưởng toàn cầu.
- Dashboard rủi ro cho cả cổ phiếu và crypto.

---

## 🔧 Mục `/platform`

`/src/components/platform/` là trái tim của nền tảng:
- `PlatformLayout.tsx` — layout sidebar, định tuyến, điều hướng platform.
- `PlatformChatDock.tsx` — chatbot AI luôn sẵn sàng trên mọi trang.
- `CryptoChatPanel.tsx` — trợ lý AI chuyên sâu cho crypto.
- `StockComparison.tsx` — so sánh hiệu suất, tạo báo cáo PDF/Excel.
- `CandlestickChart.tsx` — biểu đồ kỹ thuật nến, EMA, Bollinger.
- `WatchlistPanel.tsx` — watchlist, price alerts và quản lý danh mục.
- `FearGreedGauge.tsx` — chỉ số tâm lý Fear & Greed thông minh.

Trang `/platform` bao gồm:
- Dashboard tổng quan
- Stock Analysis
- Crypto Intel
- Portfolio
- Risk Engine
- AI Insights

---

## 🧱 Công nghệ sử dụng

| Hạng mục | Công nghệ |
|----------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| UI | shadcn/ui, Radix UI, Lucide Icons |
| Biểu đồ | Recharts |
| Dữ liệu | React Query, Supabase, custom hooks |
| AI | Google Gemini / Lovable AI Gateway |
| Backend | Supabase Auth, Database, Storage, Edge Functions |
| Export | jsPDF, docx, xlsx |
| Công cụ | ESLint, Prettier |

---

## ⚙️ Cài đặt & chạy local

```bash
git clone <YOUR_GIT_URL>
cd crystal-ball-insights
npm install
npm run dev
```

Mở `http://localhost:5173` để truy cập ứng dụng.

> Ghi chú: cần cấu hình Supabase và biến môi trường `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` để AI và dữ liệu hoạt động.

---

## 📁 Cấu trúc dự án

```
crystal-ball-insights/
├── src/
│   ├── components/
│   │   ├── platform/          # AI + Đầu tư + Stocks + Crypto
│   │   ├── community/         # Forum, bài đăng, bình luận
│   │   ├── auth/              # Đăng nhập / đăng ký
│   │   ├── layout/            # Header, footer, layout chung
│   │   └── ui/                # Component dùng chung
│   ├── pages/                 # Trang ứng dụng
│   ├── lib/                   # Logic mô phỏng, xuất báo cáo
│   ├── hooks/                 # Custom hooks dữ liệu
│   └── integrations/          # Supabase client, API helper
├── supabase/
│   ├── functions/             # Edge Functions AI + data
│   │   ├── chatbot-ai/
│   │   ├── analyze-project/
│   │   ├── moderate-content/
│   │   └── fetch-stock-data/
│   └── migrations/            # Database schema
└── public/                    # Tài nguyên tĩnh
```

---

## 🔐 Bảo mật

- Supabase Auth quản lý đăng nhập.
- Row Level Security (RLS) bảo vệ dữ liệu.
- Kiểm duyệt nội dung AI và cộng đồng.
- Phân quyền Admin / User rõ ràng.

---

## 👨‍💻 Người tạo

**Quách Thành Long** — Full-stack CTO, xây dựng sản phẩm AI & Fintech.

- 🌐 [quachthanhlong.com](https://quachthanhlong.com)
- 📧 [contact@quachthanhlong.com](mailto:contact@quachthanhlong.com)

---

## 📄 License

© 2026 Crystal Ball by Quách Thành Long. All rights reserved.

<p align="center">
  Made with ❤️ in Vietnam
</p>
