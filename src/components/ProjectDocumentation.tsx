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
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  MessageCircleQuestion,
  ExternalLink,
  Target,
  Zap,
  Shield
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

      {/* Ví dụ thực tế */}
      <SimulationCard>
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Ví dụ thực tế</h2>
        </div>
        
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="solar">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Dự án điện mặt trời 50MW</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg text-sm">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Thông số đầu vào</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Công suất: 50 MW</li>
                      <li>• Tổng vốn đầu tư: 1,000 tỷ VND</li>
                      <li>• Tỷ lệ vay: 70%</li>
                      <li>• Lãi suất: 10%/năm</li>
                      <li>• Giá bán điện: 1,900 VND/kWh</li>
                      <li>• Thời gian vận hành: 25 năm</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Kết quả phân tích</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• NPV (TIPV): 250 tỷ VND</li>
                      <li>• IRR (TIPV): 14.5%</li>
                      <li>• DPP: 8.5 năm</li>
                      <li>• DSCR trung bình: 1.35</li>
                      <li>• Xác suất NPV &gt; 0: 85%</li>
                    </ul>
                  </div>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <strong>Kết luận:</strong> Dự án khả thi với IRR cao hơn WACC và DSCR đạt yêu cầu ngân hàng.
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="factory">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span>Nhà máy sản xuất công nghiệp</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg text-sm">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Thông số đầu vào</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Công suất: 100,000 sản phẩm/năm</li>
                      <li>• Tổng vốn đầu tư: 500 tỷ VND</li>
                      <li>• Tỷ lệ vay: 60%</li>
                      <li>• Giá bán: 5 triệu/sản phẩm</li>
                      <li>• Chi phí biến đổi: 3 triệu/sản phẩm</li>
                      <li>• Chi phí cố định: 50 tỷ/năm</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Phân tích độ nhạy</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Biến nhạy nhất: Giá bán (-15% → NPV âm)</li>
                      <li>• Chi phí nguyên liệu: ảnh hưởng trung bình</li>
                      <li>• Công suất vận hành: ảnh hưởng cao</li>
                      <li>• Điểm hòa vốn: 75,000 sản phẩm/năm</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SimulationCard>

      {/* Best Practices */}
      <SimulationCard>
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Best Practices - Thực hành tốt nhất</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Xác thực dữ liệu đầu vào</h4>
                <p className="text-sm text-muted-foreground">
                  Luôn kiểm tra tính hợp lý của các thông số: giá cả thị trường, chi phí đầu tư chuẩn ngành, 
                  lãi suất hiện hành.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Sử dụng nhiều kịch bản</h4>
                <p className="text-sm text-muted-foreground">
                  Tạo ít nhất 3 kịch bản: Bi quan, Cơ sở, Lạc quan để đánh giá toàn diện rủi ro.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Chạy Monte Carlo đủ lần</h4>
                <p className="text-sm text-muted-foreground">
                  Tối thiểu 1,000 lần mô phỏng, khuyến nghị 5,000-10,000 lần để kết quả ổn định.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Tránh ước tính quá lạc quan</h4>
                <p className="text-sm text-muted-foreground">
                  Không đánh giá thấp chi phí, không đánh giá cao doanh thu. Sử dụng dữ liệu thực tế.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Không bỏ qua chi phí ẩn</h4>
                <p className="text-sm text-muted-foreground">
                  Tính đủ: chi phí vốn lưu động, chi phí tài chính, chi phí quản lý dự án, dự phòng.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Kiểm tra DSCR theo năm</h4>
                <p className="text-sm text-muted-foreground">
                  DSCR trung bình tốt không có nghĩa từng năm đều đạt. Kiểm tra các năm đầu vay nợ.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SimulationCard>

      {/* FAQ */}
      <SimulationCard>
        <div className="flex items-center gap-3 mb-4">
          <MessageCircleQuestion className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Câu hỏi thường gặp (FAQ)</h2>
        </div>
        
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="faq1">
            <AccordionTrigger className="hover:no-underline text-left">
              NPV âm nhưng IRR vẫn dương, tại sao?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground p-4 bg-muted/30 rounded-lg">
                IRR là tỷ lệ chiết khấu làm NPV = 0. Nếu IRR &lt; WACC, dự án vẫn có IRR dương nhưng NPV âm 
                vì chi phí vốn cao hơn tỷ suất sinh lời thực tế. Trong trường hợp này, dự án không khả thi 
                về mặt tài chính.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq2">
            <AccordionTrigger className="hover:no-underline text-left">
              Nên sử dụng NPV TIPV hay EPV để đánh giá dự án?
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg text-muted-foreground">
                <p><strong>TIPV (Quan điểm Tổng đầu tư):</strong> Đánh giá hiệu quả của toàn bộ dự án, 
                không phụ thuộc cấu trúc vốn. Phù hợp để so sánh các dự án khác nhau.</p>
                <p><strong>EPV (Quan điểm Chủ sở hữu):</strong> Đánh giá lợi ích thực tế của nhà đầu tư 
                sau khi trả nợ. Phù hợp để ra quyết định đầu tư cuối cùng.</p>
                <p className="font-medium">→ Nên sử dụng cả hai để có cái nhìn toàn diện.</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq3">
            <AccordionTrigger className="hover:no-underline text-left">
              Số lần mô phỏng Monte Carlo bao nhiêu là đủ?
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-4 bg-muted/30 rounded-lg text-muted-foreground">
                <ul className="space-y-1">
                  <li>• <strong>500-1,000</strong>: Ước lượng sơ bộ, nhanh</li>
                  <li>• <strong>1,000-5,000</strong>: Đủ cho hầu hết dự án</li>
                  <li>• <strong>5,000-10,000</strong>: Kết quả ổn định, độ tin cậy cao</li>
                  <li>• <strong>&gt;10,000</strong>: Dự án phức tạp, nhiều biến số</li>
                </ul>
                <p className="mt-2 font-medium">Khuyến nghị: 5,000 lần cho báo cáo chính thức.</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq4">
            <AccordionTrigger className="hover:no-underline text-left">
              WACC nên tính như thế nào cho dự án mới?
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-4 bg-muted/30 rounded-lg text-muted-foreground">
                <p className="mb-2">Công thức: WACC = D/(D+E) × rD × (1-T) + E/(D+E) × rE</p>
                <ul className="space-y-1">
                  <li>• <strong>rD (lãi suất vay)</strong>: Lãi suất ngân hàng hiện tại</li>
                  <li>• <strong>rE (chi phí vốn CSH)</strong>: Có thể dùng CAPM hoặc benchmark ngành</li>
                  <li>• Thông thường rE = 12-18% tùy ngành và rủi ro</li>
                  <li>• Nếu không có CAPM, dùng rE = rD + 4-6% risk premium</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq5">
            <AccordionTrigger className="hover:no-underline text-left">
              Làm thế nào để chọn phân phối xác suất phù hợp?
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-4 bg-muted/30 rounded-lg text-muted-foreground">
                <ul className="space-y-2">
                  <li>• <strong>Normal</strong>: Khi có nhiều dữ liệu lịch sử và biến đổi đối xứng 
                  (giá cả hàng hóa, tỷ giá)</li>
                  <li>• <strong>Triangular</strong>: Khi chỉ ước lượng được Min, Max, Most Likely 
                  (chi phí xây dựng, thời gian)</li>
                  <li>• <strong>PERT</strong>: Tương tự Triangular nhưng tập trung hơn vào giá trị 
                  most likely (khuyến nghị cho ước lượng chuyên gia)</li>
                  <li>• <strong>Uniform</strong>: Khi không có thông tin về xu hướng tập trung</li>
                  <li>• <strong>Lognormal</strong>: Cho các giá trị luôn dương và có thể có giá trị 
                  cực đoan (chi phí phát sinh, thời gian chậm trễ)</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq6">
            <AccordionTrigger className="hover:no-underline text-left">
              Dữ liệu có được lưu trữ an toàn không?
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-4 bg-muted/30 rounded-lg text-muted-foreground">
                <p>Tất cả dữ liệu được lưu trữ trong <strong>localStorage</strong> của trình duyệt, 
                nghĩa là:</p>
                <ul className="space-y-1 mt-2">
                  <li>• Dữ liệu chỉ lưu trên máy tính của bạn</li>
                  <li>• Không gửi lên server hay chia sẻ với bên thứ ba</li>
                  <li>• Xóa cache trình duyệt sẽ mất dữ liệu</li>
                  <li>• Nên xuất file Excel để backup quan trọng</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SimulationCard>

      {/* Tiêu chuẩn đánh giá */}
      <SimulationCard>
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Tiêu chuẩn đánh giá dự án</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Chỉ số</th>
                <th className="text-center p-3 font-semibold text-red-500">Không đạt</th>
                <th className="text-center p-3 font-semibold text-yellow-500">Chấp nhận được</th>
                <th className="text-center p-3 font-semibold text-green-500">Tốt</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b">
                <td className="p-3 font-medium">NPV</td>
                <td className="p-3 text-center">&lt; 0</td>
                <td className="p-3 text-center">0 - 10% vốn đầu tư</td>
                <td className="p-3 text-center">&gt; 10% vốn đầu tư</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-medium">IRR</td>
                <td className="p-3 text-center">&lt; WACC</td>
                <td className="p-3 text-center">WACC - WACC+5%</td>
                <td className="p-3 text-center">&gt; WACC + 5%</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-medium">DPP</td>
                <td className="p-3 text-center">&gt; 70% vòng đời</td>
                <td className="p-3 text-center">50-70% vòng đời</td>
                <td className="p-3 text-center">&lt; 50% vòng đời</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-medium">DSCR (min)</td>
                <td className="p-3 text-center">&lt; 1.0</td>
                <td className="p-3 text-center">1.0 - 1.2</td>
                <td className="p-3 text-center">&gt; 1.2</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-medium">DSCR (avg)</td>
                <td className="p-3 text-center">&lt; 1.2</td>
                <td className="p-3 text-center">1.2 - 1.5</td>
                <td className="p-3 text-center">&gt; 1.5</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">P(NPV &gt; 0)</td>
                <td className="p-3 text-center">&lt; 60%</td>
                <td className="p-3 text-center">60% - 80%</td>
                <td className="p-3 text-center">&gt; 80%</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 p-4 bg-primary/10 rounded-lg text-sm">
          <p className="text-muted-foreground">
            <strong>Lưu ý:</strong> Tiêu chuẩn trên mang tính tham khảo. Mỗi ngành và loại dự án 
            có thể có tiêu chuẩn riêng. Ngân hàng thường yêu cầu DSCR min ≥ 1.2 và DSCR avg ≥ 1.3-1.5.
          </p>
        </div>
      </SimulationCard>

      {/* Tài liệu tham khảo */}
      <SimulationCard>
        <div className="flex items-center gap-3 mb-4">
          <ExternalLink className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Tài liệu tham khảo</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Sách và giáo trình</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Brealey, Myers & Allen - "Principles of Corporate Finance"</span>
              </li>
              <li className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Damodaran - "Investment Valuation"</span>
              </li>
              <li className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Yescombe - "Principles of Project Finance"</span>
              </li>
              <li className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Vose - "Risk Analysis: A Quantitative Guide"</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Tiêu chuẩn và hướng dẫn</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <FileSpreadsheet className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>IFC - Project Finance Guidelines</span>
              </li>
              <li className="flex items-start gap-2">
                <FileSpreadsheet className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>ADB - Financial Management Guidelines</span>
              </li>
              <li className="flex items-start gap-2">
                <FileSpreadsheet className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>World Bank - Economic Analysis Guidelines</span>
              </li>
              <li className="flex items-start gap-2">
                <FileSpreadsheet className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>PMI - Project Risk Management Standard</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-semibold mb-3">Công thức và phương pháp được sử dụng</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-1">IRR Calculation</h4>
              <p>Newton-Raphson iteration method với độ chính xác 0.0001%</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Monte Carlo</h4>
              <p>Box-Muller transform cho Normal distribution, Inverse CDF cho các phân phối khác</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Sensitivity</h4>
              <p>One-at-a-time (OAT) analysis với % thay đổi cố định</p>
            </div>
          </div>
        </div>
      </SimulationCard>

      {/* Phiên bản và cập nhật */}
      <SimulationCard>
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Phiên bản & Tính năng</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 border rounded-lg">
            <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary">1.0</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Crystal Ball v1.0</h3>
              <p className="text-sm text-muted-foreground mb-2">Phiên bản đầu tiên</p>
              <ul className="text-sm text-muted-foreground grid md:grid-cols-2 gap-1">
                <li>✓ Tính toán NPV, IRR, DPP, DSCR</li>
                <li>✓ Phân tích độ nhạy (Tornado, Spider, 2D)</li>
                <li>✓ Mô phỏng Monte Carlo</li>
                <li>✓ So sánh nhiều dự án</li>
                <li>✓ Import/Export Excel</li>
                <li>✓ Lưu và tải kịch bản</li>
                <li>✓ Biểu đồ dòng tiền</li>
                <li>✓ Tài liệu hướng dẫn</li>
              </ul>
            </div>
          </div>
        </div>
      </SimulationCard>
    </div>
  );
};
