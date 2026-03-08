import { motion } from "framer-motion";
import {
  BarChart2,
  Coins,
  Briefcase,
  ShieldCheck,
  Brain,
  GitCompare,
  ChevronRight,
  MousePointerClick,
  Eye,
  Download,
  Settings2,
  TrendingUp,
  Layers,
  Search,
  Plus,
  Play,
  Sliders,
  FileText,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface StepItem {
  step: number;
  title: string;
  desc: string;
  icon?: React.ElementType;
}

const StepList = ({ steps }: { steps: StepItem[] }) => (
  <div className="space-y-3">
    {steps.map((s) => {
      const Icon = s.icon || ChevronRight;
      return (
        <motion.div
          key={s.step}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: s.step * 0.05 }}
          className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
            {s.step}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              {s.title}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
          </div>
        </motion.div>
      );
    })}
  </div>
);

const TipBox = ({ children, color = "primary" }: { children: React.ReactNode; color?: string }) => (
  <div className={cn("mt-4 p-3 rounded-xl text-sm border", `bg-${color}/10 border-${color}/20`)}>
    <span className={`text-${color} font-semibold`}>💡 Mẹo: </span>
    <span className="text-muted-foreground">{children}</span>
  </div>
);

const modules = [
  {
    id: "stock-analysis",
    icon: BarChart2,
    title: "Stock Analysis — Phân tích cổ phiếu",
    color: "primary",
    desc: "Phân tích kỹ thuật và cơ bản cho cổ phiếu Việt Nam & quốc tế",
    steps: [
      { step: 1, title: "Chọn mã cổ phiếu", desc: "Chọn từ danh mục phân loại hoặc nhập mã tùy chỉnh (VD: VNM, AAPL)", icon: Search },
      { step: 2, title: "Xem báo giá real-time", desc: "Giá hiện tại, thay đổi %, khối lượng, vốn hóa thị trường", icon: Eye },
      { step: 3, title: "Phân tích chỉ báo kỹ thuật", desc: "Chuyển tab Indicators để xem RSI, MACD, Bollinger Bands, EMA", icon: TrendingUp },
      { step: 4, title: "Xem dữ liệu tài chính", desc: "Tab Fundamentals hiển thị P/E, P/B, EPS, doanh thu theo quý/năm", icon: Layers },
      { step: 5, title: "Phân tích thống kê nâng cao", desc: "Tab Statistics: phân phối tỷ suất sinh lời, hồi quy tuyến tính, VaR", icon: BarChart2 },
      { step: 6, title: "Xuất báo cáo", desc: "Bấm nút PDF hoặc Excel để xuất toàn bộ dữ liệu phân tích", icon: Download },
    ],
    tips: [
      "Thêm mã vào Watchlist để theo dõi nhanh hàng ngày",
      "So sánh cổ phiếu cùng ngành bằng tab Compare để tìm cơ hội",
      "Dùng phím tắt Enter sau khi nhập mã tùy chỉnh để tìm nhanh",
    ],
  },
  {
    id: "crypto-intelligence",
    icon: Coins,
    title: "Crypto Intelligence — Phân tích tiền mã hóa",
    color: "chart-2",
    desc: "Theo dõi và phân tích thị trường crypto thời gian thực",
    steps: [
      { step: 1, title: "Xem tổng quan thị trường", desc: "Tổng vốn hóa, thay đổi 24h, dominance BTC/ETH", icon: Eye },
      { step: 2, title: "Chọn đồng coin", desc: "Nhấn vào hàng trong danh sách Market Overview để chọn", icon: MousePointerClick },
      { step: 3, title: "Chọn khung thời gian", desc: "7 ngày / 30 ngày / 90 ngày / 365 ngày để xem lịch sử giá", icon: Settings2 },
      { step: 4, title: "Xem biểu đồ giá & khối lượng", desc: "Tab Price hiển thị AreaChart với volume bar", icon: TrendingUp },
      { step: 5, title: "Phân tích chỉ báo", desc: "Tab Indicators: RSI, MACD, Volatility, xu hướng MA50", icon: Layers },
      { step: 6, title: "Refresh dữ liệu", desc: "Bấm nút Refresh hoặc chờ tự động cập nhật mỗi 30 giây", icon: Play },
    ],
    tips: [
      "Biểu đồ dominance cho thấy mức độ tập trung vốn — BTC dominance giảm thường là dấu hiệu altcoin season",
      "Sparkline 7 ngày trên mỗi coin giúp nhanh chóng nhận diện xu hướng ngắn hạn",
    ],
  },
  {
    id: "portfolio-optimizer",
    icon: Briefcase,
    title: "Portfolio Optimizer — Tối ưu danh mục",
    color: "chart-3",
    desc: "Tối ưu hóa phân bổ tài sản với Efficient Frontier và Monte Carlo",
    steps: [
      { step: 1, title: "Chọn tài sản", desc: "Thêm cổ phiếu/crypto từ danh sách hoặc từ tab Stock Comparison", icon: Plus },
      { step: 2, title: "Điều chỉnh tỷ trọng", desc: "Kéo slider để thay đổi % phân bổ cho mỗi tài sản (tổng = 100%)", icon: Sliders },
      { step: 3, title: "Thiết lập ràng buộc", desc: "Đặt Min/Max weight cho từng mã (VD: AAPL min 10%, max 40%)", icon: Settings2 },
      { step: 4, title: "Chạy tối ưu hóa", desc: "Bấm 'Run Monte Carlo' — 15.000 kịch bản sẽ được mô phỏng", icon: Play },
      { step: 5, title: "Xem kết quả", desc: "Efficient Frontier, danh mục Max Sharpe và Min Volatility với pie chart", icon: Eye },
      { step: 6, title: "Phân tích stress test", desc: "Tab Stress Testing hiển thị hiệu suất trong các kịch bản khủng hoảng", icon: ShieldCheck },
    ],
    tips: [
      "Danh mục Max Sharpe tối ưu tỷ suất sinh lời/rủi ro, còn Min Volatility an toàn nhất",
      "Ràng buộc tỷ trọng giúp tránh tập trung quá nhiều vào một tài sản duy nhất",
      "Cần tối thiểu 2 tài sản để chạy tối ưu hóa",
    ],
  },
  {
    id: "risk-engine",
    icon: ShieldCheck,
    title: "Risk Engine — Quản lý rủi ro",
    color: "chart-4",
    desc: "Đo lường và quản lý rủi ro danh mục đầu tư",
    steps: [
      { step: 1, title: "Xem tổng quan rủi ro", desc: "Portfolio VaR 95%, CVaR, và chế độ thị trường hiện tại", icon: Eye },
      { step: 2, title: "Phân tích VaR", desc: "Tab VaR Analysis: biểu đồ VaR 95% và CVaR cho từng tài sản", icon: BarChart2 },
      { step: 3, title: "Xem ma trận tương quan", desc: "Tab Correlation: bảng Pearson correlation với mã màu", icon: Layers },
      { step: 4, title: "Phân phối tỷ suất sinh lời", desc: "Tab Distribution: histogram với đuôi VaR được highlight", icon: TrendingUp },
      { step: 5, title: "Phát hiện Regime Shift", desc: "Tab Regime: danh sách các điểm chuyển đổi chế độ thị trường", icon: Settings2 },
    ],
    tips: [
      "Tương quan thấp (< 0.3) giữa các tài sản giúp đa dạng hóa danh mục hiệu quả",
      "CVaR (Expected Shortfall) luôn lớn hơn VaR — đây là tổn thất trung bình trong worst-case",
      "Regime Shift giúp nhận biết thay đổi cấu trúc thị trường (từ bull sang bear)",
    ],
  },
  {
    id: "ai-insights",
    icon: Brain,
    title: "AI Insights — Phân tích bằng AI",
    color: "chart-5",
    desc: "Nhận phân tích thị trường tự động bằng trí tuệ nhân tạo",
    steps: [
      { step: 1, title: "Chọn preset hoặc nhập câu hỏi", desc: "Bấm nút preset (Pattern, Anomaly, Allocation) hoặc gõ câu hỏi tùy chỉnh", icon: MousePointerClick },
      { step: 2, title: "Chờ AI phân tích", desc: "AI sẽ streaming kết quả — bạn có thể đọc ngay khi đang tải", icon: Play },
      { step: 3, title: "Đọc kết quả", desc: "Kết quả hiển thị dạng Markdown với phân loại (Pattern/Anomaly/Allocation)", icon: Eye },
      { step: 4, title: "Xem lịch sử insights", desc: "Các phân tích trước đó hiển thị trong feed bên dưới với timestamp", icon: FileText },
    ],
    tips: [
      "Preset prompts được tối ưu để cho kết quả tốt nhất — thử trước khi viết câu hỏi riêng",
      "Nhấn Enter để gửi câu hỏi nhanh, không cần bấm nút Send",
      "Confidence score cho biết mức độ tin cậy của AI với kết quả phân tích",
    ],
  },
  {
    id: "stock-comparison",
    icon: GitCompare,
    title: "Stock Comparison — So sánh cổ phiếu",
    color: "primary",
    desc: "So sánh hiệu suất và tương quan giữa nhiều mã chứng khoán",
    steps: [
      { step: 1, title: "Thêm mã cổ phiếu", desc: "Chọn từ dropdown hoặc nhập mã, tối đa 8 mã so sánh đồng thời", icon: Plus },
      { step: 2, title: "Xem biểu đồ chuẩn hóa", desc: "Performance Chart hiển thị giá base-100 để so sánh tương đối", icon: TrendingUp },
      { step: 3, title: "Phân tích tương quan", desc: "Ma trận Pearson Correlation tự động tính từ tỷ suất sinh lời", icon: Layers },
      { step: 4, title: "Tối ưu danh mục", desc: "Khi có ≥ 2 mã, Portfolio Optimizer Panel sẽ xuất hiện bên dưới", icon: Briefcase },
      { step: 5, title: "Xuất báo cáo", desc: "PDF (có biểu đồ nhúng) hoặc Excel (đa sheet) với dữ liệu đầy đủ", icon: Download },
    ],
    tips: [
      "Biểu đồ base-100 cho phép so sánh cổ phiếu có mức giá chênh lệch lớn (VD: BTC vs AAPL)",
      "PDF export bao gồm ảnh chụp biểu đồ thực tế nhờ html2canvas",
      "Xóa mã không cần bằng nút × bên cạnh tên cổ phiếu",
    ],
  },
];

export const QuantPlatformGuide = () => {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-primary/20">
          <Layers className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Hướng dẫn chi tiết từng mô-đun Quant Platform</h3>
          <p className="text-sm text-muted-foreground">Các bước sử dụng cụ thể cho 6 mô-đun chính</p>
        </div>
      </div>

      <Accordion type="multiple" className="w-full space-y-3">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <AccordionItem
              key={mod.id}
              value={mod.id}
              className="border border-border/30 rounded-xl px-4 bg-card/30 backdrop-blur"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: `hsl(var(--${mod.color}) / 0.2)` }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: `hsl(var(--${mod.color}))` }}
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{mod.title}</div>
                    <div className="text-sm text-muted-foreground">{mod.desc}</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-4 pt-2">
                  <StepList steps={mod.steps} />

                  {mod.tips.length > 0 && (
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        💡 Mẹo sử dụng
                      </h4>
                      <ul className="space-y-1.5">
                        {mod.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
