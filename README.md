# Crystal Ball - Công cụ phân tích rủi ro Monte Carlo

<p align="center">
  <img src="https://quachthanhlong.com/long/long.png" alt="Crystal Ball Logo" width="120" />
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

## 📖 Giới thiệu

**Crystal Ball** là công cụ mô phỏng Monte Carlo chuyên nghiệp cho phân tích rủi ro dự án đầu tư, dự báo tài chính và hỗ trợ ra quyết định. Được thiết kế dành cho các chuyên gia tài chính, ngân hàng, và nhà đầu tư.

## ✨ Tính năng chính

### 🎲 Mô phỏng Monte Carlo
- Phân tích rủi ro với hàng nghìn kịch bản mô phỏng
- Hỗ trợ nhiều loại phân phối xác suất: Normal, Lognormal, Uniform, Triangular, Beta
- Tính toán VaR, CVaR (95%/99%)
- Histogram và thống kê chi tiết

### 📊 Phân tích dự án đầu tư
- **Chỉ số tài chính**: NPV, IRR, MIRR, PI, DPP, DSCR, WACC
- **Tỷ suất sinh lời**: ROI, ROE, ROA
- **Biên lợi nhuận**: Gross Margin, Net Margin, EBITDA Margin
- **Điểm hòa vốn**: BEP (Sản lượng), BEP (Doanh thu), BEP (Năm)
- **Hai góc nhìn**: TIPV (Tổng đầu tư) và EPV (Chủ đầu tư)

### 📈 Phân tích độ nhạy nâng cao
- **Phân tích 1D**: Kiểm tra tác động từng biến
- **Phân tích 2D**: Ma trận tương tác hai biến
- **Biểu đồ Tornado**: Xếp hạng theo độ tác động
- **Biểu đồ Spider**: Trực quan hóa độ nhạy

### 🔥 Stress Testing
- Các kịch bản khủng hoảng thực tế
- Biến động lãi suất (±50%)
- Sụt giảm doanh thu (-30%)
- Tăng chi phí (+50%)
- Đánh giá tính bền vững dự án

### 🤖 AI Insights (Google Gemini)
- Phân tích chuyên sâu tự động
- Đề xuất cải thiện thông minh
- Chatbot hỗ trợ 24/7
- Kiểm duyệt nội dung AI

### 👥 Cộng đồng
- Thảo luận và chia sẻ kinh nghiệm
- Upload hình ảnh, video, PDF
- Blog và sự kiện
- Hệ thống like, bình luận, chia sẻ
- Kiểm duyệt nội dung bởi Admin và AI

### 📄 Xuất báo cáo
- **PDF**: Báo cáo chuyên nghiệp theo chuẩn ngân hàng
- **Word (.docx)**: Báo cáo thẩm định rủi ro
- **Excel**: Dữ liệu và biểu đồ

### 📱 Responsive Design
- Tương thích mọi thiết bị
- Menu hamburger mobile
- Giao diện hiện đại và trực quan

---

## 🛠 Công nghệ sử dụng

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Framer Motion |
| **UI Components** | shadcn/ui, Radix UI, Lucide Icons |
| **Charts** | Recharts |
| **Backend** | Supabase (Database, Auth, Storage, Edge Functions) |
| **AI** | Google Gemini AI (via Lovable AI Gateway) |
| **Export** | jsPDF, docx, xlsx |
| **Build** | Vite, ESLint |

---

## 🚀 Cài đặt local

```bash
# Clone repository
git clone <YOUR_GIT_URL>

# Di chuyển vào thư mục dự án
cd crystal-ball

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Truy cập `http://localhost:5173` để xem ứng dụng.

---

## 📚 Cấu trúc dự án

```
crystal-ball/
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── community/       # Community features
│   │   └── auth/            # Authentication
│   ├── pages/               # Page components
│   ├── lib/                 # Utilities & calculations
│   │   ├── monteCarlo.ts    # Monte Carlo simulation
│   │   ├── projectCalculator.ts  # Financial calculations
│   │   ├── pdfExporter.ts   # PDF generation
│   │   └── sensitivityAnalysis.ts
│   ├── hooks/               # Custom hooks
│   └── integrations/        # Supabase integration
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── chatbot-ai/      # AI Chatbot
│   │   ├── analyze-project/ # AI Analysis
│   │   └── moderate-content/ # Content moderation
│   └── migrations/          # Database migrations
└── public/                  # Static assets
```

---

## 🔐 Bảo mật

- Row Level Security (RLS) cho tất cả các bảng
- Xác thực người dùng qua Supabase Auth
- Kiểm duyệt nội dung AI tự động
- Admin approval cho bài đăng cộng đồng

---

## 👨‍💻 Về tác giả

**Quách Thành Long** - CTO-level Full-stack Developer

- 🌐 Website: [quachthanhlong.com](https://quachthanhlong.com)
- 📧 Email: [contact@quachthanhlong.com](mailto:contact@quachthanhlong.com)
- 💼 Các dự án: [quachthanhlong.com/projects](https://quachthanhlong.com/projects)

### Các dự án nổi bật khác:
- **ThinkShift** - Nền tảng giáo dục AI
- **MSC** - Hệ thống quản lý doanh nghiệp
- **Dragon Keeper** - Game mobile phát triển bằng Unity
- **Cosmic Emotion Letter** - Game narrative theo phong cách Studio Ghibli

---

## 📄 License

© 2025 Crystal Ball by Quách Thành Long. All rights reserved.

---

<p align="center">
  Made with ❤️ in Vietnam
</p>
