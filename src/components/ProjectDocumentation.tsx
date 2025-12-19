import { motion } from "framer-motion";
import { SimulationCard } from "./SimulationCard";
import { 
  BookOpen, 
  Calculator, 
  TrendingUp, 
  Percent, 
  Clock, 
  Scale, 
  BarChart3, 
  Dice5,
  FileSpreadsheet,
  Save,
  GitCompare,
  HelpCircle
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const ProjectDocumentation = () => {
  return (
    <div className="space-y-6">
      {/* Tổng quan */}
      <SimulationCard>
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Tổng quan về công cụ</h2>
        </div>
        <p className="text-muted-foreground mb-4">
          Crystal Ball là công cụ phân tích tài chính dự án đầu tư toàn diện, hỗ trợ tính toán các chỉ số 
          hiệu quả đầu tư, phân tích độ nhạy, mô phỏng Monte Carlo và so sánh nhiều phương án đầu tư.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <Calculator className="w-5 h-5 text-primary mb-2" />
            <h3 className="font-semibold text-sm">Tính toán dự án</h3>
            <p className="text-xs text-muted-foreground">NPV, IRR, DPP, DSCR</p>
          </div>
          <div className="p-4 rounded-lg bg-chart-2/10 border border-chart-2/20">
            <BarChart3 className="w-5 h-5 text-chart-2 mb-2" />
            <h3 className="font-semibold text-sm">Phân tích độ nhạy</h3>
            <p className="text-xs text-muted-foreground">Tornado, Spider, 2D</p>
          </div>
          <div className="p-4 rounded-lg bg-chart-3/10 border border-chart-3/20">
            <Dice5 className="w-5 h-5 text-chart-3 mb-2" />
            <h3 className="font-semibold text-sm">Monte Carlo</h3>
            <p className="text-xs text-muted-foreground">Mô phỏng xác suất</p>
          </div>
          <div className="p-4 rounded-lg bg-chart-4/10 border border-chart-4/20">
            <GitCompare className="w-5 h-5 text-chart-4 mb-2" />
            <h3 className="font-semibold text-sm">So sánh dự án</h3>
            <p className="text-xs text-muted-foreground">Đa tiêu chí</p>
          </div>
        </div>
      </SimulationCard>

      {/* Các chỉ số tài chính */}
      <SimulationCard>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Các chỉ số tài chính</h2>
        </div>
        
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="npv">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-chart-1" />
                <span>NPV - Giá trị hiện tại ròng (Net Present Value)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">
                  NPV đo lường giá trị hiện tại của tất cả dòng tiền tương lai, chiết khấu về thời điểm hiện tại.
                </p>
                <div className="p-3 bg-background rounded border font-mono text-sm">
                  NPV = Σ [CFₜ / (1 + r)ᵗ] - I₀
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <strong>CFₜ</strong>: Dòng tiền năm t</li>
                  <li>• <strong>r</strong>: Tỷ lệ chiết khấu (WACC)</li>
                  <li>• <strong>I₀</strong>: Vốn đầu tư ban đầu</li>
                  <li>• <strong>Tiêu chuẩn</strong>: NPV &gt; 0 → Dự án khả thi</li>
                </ul>
                <div className="p-3 bg-primary/10 rounded-lg text-sm">
                  <strong>Lưu ý:</strong> Công cụ tính cả NPV theo quan điểm Tổng đầu tư (TIPV) và Chủ sở hữu (EPV).
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="irr">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-chart-2" />
                <span>IRR - Tỷ suất hoàn vốn nội bộ (Internal Rate of Return)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">
                  IRR là tỷ lệ chiết khấu làm cho NPV bằng 0. Đây là tỷ suất sinh lời thực tế của dự án.
                </p>
                <div className="p-3 bg-background rounded border font-mono text-sm">
                  0 = Σ [CFₜ / (1 + IRR)ᵗ] - I₀
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <strong>Tiêu chuẩn</strong>: IRR &gt; WACC → Dự án khả thi</li>
                  <li>• <strong>Phương pháp</strong>: Newton-Raphson iteration</li>
                  <li>• IRR càng cao, dự án càng hấp dẫn</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="dpp">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-chart-3" />
                <span>DPP - Thời gian hoàn vốn có chiết khấu (Discounted Payback Period)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">
                  DPP là thời gian cần thiết để dòng tiền chiết khấu tích lũy bù đắp vốn đầu tư ban đầu.
                </p>
                <div className="p-3 bg-background rounded border font-mono text-sm">
                  DPP = n + |Cumulative PVₙ| / PVₙ₊₁
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <strong>n</strong>: Năm cuối cùng có tích lũy âm</li>
                  <li>• DPP ngắn hơn → Rủi ro thấp hơn</li>
                  <li>• Có tính đến giá trị thời gian của tiền</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="dscr">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-chart-4" />
                <span>DSCR - Tỷ lệ khả năng trả nợ (Debt Service Coverage Ratio)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">
                  DSCR đo lường khả năng trả nợ của dự án từ dòng tiền hoạt động.
                </p>
                <div className="p-3 bg-background rounded border font-mono text-sm">
                  DSCR = CFADS / Nghĩa vụ nợ
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <strong>CFADS</strong>: Cash Flow Available for Debt Service</li>
                  <li>• <strong>Tiêu chuẩn</strong>: DSCR ≥ 1.2 - 1.5</li>
                  <li>• DSCR &lt; 1 → Không đủ trả nợ</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="wacc">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-chart-5" />
                <span>WACC - Chi phí vốn bình quân gia quyền</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">
                  WACC là tỷ lệ chiết khấu phản ánh chi phí cơ hội của vốn đầu tư.
                </p>
                <div className="p-3 bg-background rounded border font-mono text-sm">
                  WACC = D/(D+E) × rD × (1-T) + E/(D+E) × rE
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <strong>D, E</strong>: Tỷ lệ nợ vay, vốn chủ sở hữu</li>
                  <li>• <strong>rD</strong>: Lãi suất vay</li>
                  <li>• <strong>rE</strong>: Tỷ suất sinh lời kỳ vọng của vốn CSH</li>
                  <li>• <strong>T</strong>: Thuế suất TNDN</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SimulationCard>

      {/* Phân tích độ nhạy */}
      <SimulationCard>
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Phân tích độ nhạy</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">Biểu đồ Tornado</h3>
            <p className="text-sm text-muted-foreground">
              Hiển thị mức độ ảnh hưởng của từng biến số đến kết quả. Biến có thanh dài nhất 
              có ảnh hưởng lớn nhất.
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">Biểu đồ Spider</h3>
            <p className="text-sm text-muted-foreground">
              Thể hiện độ nhạy tương đối khi các biến thay đổi theo %. Độ dốc càng lớn, 
              độ nhạy càng cao.
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">Ma trận 2D</h3>
            <p className="text-sm text-muted-foreground">
              Phân tích đồng thời 2 biến số, tạo ma trận kết quả với màu sắc thể hiện 
              mức độ khả thi.
            </p>
          </div>
        </div>
      </SimulationCard>

      {/* Monte Carlo */}
      <SimulationCard>
        <div className="flex items-center gap-3 mb-4">
          <Dice5 className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Mô phỏng Monte Carlo</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Phương pháp mô phỏng dựa trên lấy mẫu ngẫu nhiên để đánh giá phân phối xác suất của kết quả.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">Các phân phối xác suất</h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• <strong>Normal</strong>: Phân phối chuẩn (μ, σ)</li>
                <li>• <strong>Triangular</strong>: Min, Most likely, Max</li>
                <li>• <strong>Uniform</strong>: Phân phối đều (a, b)</li>
                <li>• <strong>Lognormal</strong>: Cho các giá trị dương</li>
                <li>• <strong>PERT</strong>: Cải tiến từ Triangular</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">Kết quả phân tích</h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• <strong>P10</strong>: 10% khả năng kết quả thấp hơn</li>
                <li>• <strong>P50</strong>: Giá trị trung vị (median)</li>
                <li>• <strong>P90</strong>: 90% khả năng kết quả thấp hơn</li>
                <li>• <strong>VaR</strong>: Value at Risk</li>
                <li>• Xác suất NPV &gt; 0</li>
              </ul>
            </div>
          </div>
          
          <div className="p-4 bg-chart-3/10 rounded-lg border border-chart-3/20">
            <h4 className="font-semibold mb-2">Quy trình mô phỏng</h4>
            <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
              <li>Xác định các biến đầu vào không chắc chắn</li>
              <li>Gán phân phối xác suất cho mỗi biến</li>
              <li>Chạy N lần mô phỏng (thường 1,000-10,000)</li>
              <li>Tính toán chỉ số tài chính cho mỗi lần</li>
              <li>Tổng hợp và phân tích kết quả</li>
            </ol>
          </div>
        </div>
      </SimulationCard>

      {/* Hướng dẫn sử dụng */}
      <SimulationCard>
        <div className="flex items-center gap-3 mb-4">
          <HelpCircle className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Hướng dẫn sử dụng</h2>
        </div>
        
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="excel">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-green-500" />
                <span>Nhập dữ liệu từ Excel</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg text-sm">
                <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
                  <li>Tải file mẫu Excel bằng nút "Tải mẫu Excel"</li>
                  <li>Điền thông số dự án vào cột Giá trị</li>
                  <li>Điền công suất theo năm vào sheet "Công suất"</li>
                  <li>Upload file đã điền và xem trước dữ liệu</li>
                  <li>Nhấn "Nhập dữ liệu" để áp dụng</li>
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="scenario">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4 text-blue-500" />
                <span>Lưu và tải kịch bản</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg text-sm">
                <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
                  <li>Điền đầy đủ thông số dự án</li>
                  <li>Đặt tên cho kịch bản và mô tả</li>
                  <li>Nhấn "Lưu kịch bản" để lưu vào bộ nhớ</li>
                  <li>Các kịch bản đã lưu hiển thị trong danh sách</li>
                  <li>Nhấn "Tải" để khôi phục kịch bản</li>
                </ol>
                <p className="text-muted-foreground italic">
                  * Kịch bản được lưu trong localStorage của trình duyệt
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="compare">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-purple-500" />
                <span>So sánh nhiều dự án</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg text-sm">
                <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
                  <li>Chuyển sang tab "So sánh dự án"</li>
                  <li>Thêm dự án mới hoặc nhân bản từ dự án hiện tại</li>
                  <li>Điều chỉnh thông số cho từng dự án</li>
                  <li>Nhấn "Tính toán & So sánh"</li>
                  <li>Xem biểu đồ so sánh và bảng tổng hợp</li>
                  <li>Hệ thống sẽ đề xuất dự án tối ưu</li>
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SimulationCard>

      {/* Thuật ngữ */}
      <SimulationCard>
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Thuật ngữ</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/30">
              <dt className="font-semibold text-sm">TIPV (Total Investment Point of View)</dt>
              <dd className="text-sm text-muted-foreground">Quan điểm tổng đầu tư - không tính cấu trúc vốn</dd>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <dt className="font-semibold text-sm">EPV (Equity Point of View)</dt>
              <dd className="text-sm text-muted-foreground">Quan điểm chủ sở hữu - sau khi trả nợ</dd>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <dt className="font-semibold text-sm">CFADS</dt>
              <dd className="text-sm text-muted-foreground">Dòng tiền khả dụng cho trả nợ</dd>
            </div>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/30">
              <dt className="font-semibold text-sm">FCF (Free Cash Flow)</dt>
              <dd className="text-sm text-muted-foreground">Dòng tiền tự do sau đầu tư</dd>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <dt className="font-semibold text-sm">EBITDA</dt>
              <dd className="text-sm text-muted-foreground">Lợi nhuận trước lãi vay, thuế, khấu hao</dd>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <dt className="font-semibold text-sm">Working Capital</dt>
              <dd className="text-sm text-muted-foreground">Vốn lưu động ròng</dd>
            </div>
          </div>
        </div>
      </SimulationCard>
    </div>
  );
};
