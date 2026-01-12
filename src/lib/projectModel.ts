// Mô hình dự án đầu tư hoàn chỉnh
export interface ProjectParams {
  // Thông tin cơ bản
  projectName: string;
  investmentYear: number; // Năm đầu tư (năm 0)
  operationYears: number; // Số năm hoạt động
  liquidationYear: number; // Năm thanh lý
  
  // Đất đai
  landArea: number; // m2
  landRentPrice: number; // triệu đồng/m2/năm
  landRentAdjustmentYears: number; // Điều chỉnh sau mấy năm
  
  // Tài sản cố định
  fixedAssetValue: number; // Giá trị nhà xưởng, thiết bị (triệu đồng)
  fixedAssetLife: number; // Đời sống kinh tế (năm)
  
  // Tài sản vô hình
  intangibleAssetValue: number; // Giá trị tài sản vô hình (triệu đồng)
  intangibleAssetLife: number; // Số năm phân bổ
  
  // Sản lượng
  designCapacity: number; // Công suất thiết kế (sản phẩm/năm)
  capacitySchedule: number[]; // Tỷ lệ công suất mỗi năm (%)
  inventoryRate: number; // Tỷ lệ tồn kho (%)
  
  // Giá bán
  basePrice: number; // Giá bán năm 0 (triệu đồng/sản phẩm)
  realPriceChange: number; // Thay đổi giá thực (%/năm)
  
  // Chi phí sản xuất
  componentCost: number; // Chi phí linh kiện/sản phẩm (triệu đồng)
  electricityPackaging: number; // Điện và bao bì/sản phẩm (triệu đồng)
  
  // Nhân công
  workers: number;
  workerSalary: number; // triệu đồng/tháng
  engineers: number;
  engineerSalary: number; // triệu đồng/tháng
  realSalaryIncrease: number; // Tăng lương thực (%/năm)
  
  // Chi phí quản lý
  adminCost: number; // Chi phí quản lý năm 0 (triệu đồng/năm)
  adminCostLiquidationRate: number; // Tỷ lệ chi phí quản lý năm thanh lý (%)
  
  // Chi phí bảo trì, bảo hiểm, môi trường
  maintenanceCostRate: number; // Chi phí bảo trì (%/giá trị TSCĐ/năm)
  majorRepairCost: number; // Chi phí sửa chữa lớn (triệu đồng/lần)
  majorRepairInterval: number; // Chu kỳ sửa chữa lớn (năm)
  insuranceCostRate: number; // Chi phí bảo hiểm (%/giá trị TSCĐ/năm)
  environmentalCost: number; // Chi phí môi trường (triệu đồng/năm)
  
  // Vốn lưu động
  arRate: number; // Khoản phải thu (% doanh thu)
  apRate: number; // Khoản phải trả (% chi phí linh kiện)
  cashBalanceRate: number; // Số dư tiền mặt (% doanh thu)
  
  // Tài trợ vốn
  debtRatio: number; // Tỷ lệ vay (%)
  nominalInterestRate: number; // Lãi suất danh nghĩa (%/năm)
  loanTerm: number; // Số năm trả nợ
  realEquityReturn: number; // Suất sinh lời thực vốn chủ sở hữu (%)
  
  // Thuế và lạm phát
  corporateTaxRate: number; // Thuế TNDN (%)
  inflationRate: number; // Tỷ lệ lạm phát (%/năm)
}

export interface ProjectResults {
  // Kết quả theo quan điểm Tổng đầu tư (TIPV)
  npvTIPV: number;
  irrTIPV: number;
  dppTIPV: number;
  dscrAverage: number;
  
  // Kết quả theo quan điểm Chủ đầu tư (EPV)
  npvEPV: number;
  irrEPV: number;
  dppEPV: number;
  
  // WACC bình quân
  waccAverage: number;
  
  // === CHỈ SỐ SINH LỜI (Profitability Metrics) ===
  roi: number; // Return on Investment (%)
  roe: number; // Return on Equity (%)
  roa: number; // Return on Assets (%)
  averageProfitMargin: number; // Biên lợi nhuận bình quân (%)
  grossProfitMargin: number; // Biên lợi nhuận gộp (%)
  netProfitMargin: number; // Biên lợi nhuận ròng (%)
  breakEvenPoint: number; // Điểm hòa vốn (sản lượng)
  breakEvenYear: number; // Năm hòa vốn
  breakEvenRevenue: number; // Doanh thu hòa vốn
  
  // === CHỈ SỐ HIỆU QUẢ VỐN (Capital Efficiency Metrics) ===
  pi: number; // Profitability Index (Chỉ số sinh lời)
  mirr: number; // Modified Internal Rate of Return
  eva: number; // Economic Value Added
  paybackPeriod: number; // Thời gian hoàn vốn (không chiết khấu)
  capitalTurnover: number; // Vòng quay vốn
  assetTurnover: number; // Vòng quay tài sản
  
  // === CHỈ SỐ RỦI RO (Risk Metrics) ===
  coefficientOfVariation: number; // Hệ số biến thiên
  sensitivityIndex: number; // Chỉ số độ nhạy
  financialLeverage: number; // Đòn bẩy tài chính
  operatingLeverage: number; // Đòn bẩy hoạt động
  safetyMargin: number; // Biên an toàn (%)
  
  // === CHỈ SỐ THANH KHOẢN & NỢ (Liquidity & Debt Metrics) ===
  debtToEquity: number; // Tỷ lệ nợ/vốn chủ sở hữu
  interestCoverageRatio: number; // Hệ số thanh toán lãi vay
  debtServiceCoverageRatio: number; // Hệ số khả năng trả nợ
  
  // === THỐNG KÊ DÒNG TIỀN ===
  totalCashInflow: number; // Tổng dòng tiền vào
  totalCashOutflow: number; // Tổng dòng tiền ra
  peakCashDeficit: number; // Thâm hụt tiền mặt cao nhất
  cashFlowVolatility: number; // Độ biến động dòng tiền
  
  // Dữ liệu chi tiết theo năm
  yearlyData: YearlyData[];
}

export interface YearlyData {
  year: number;
  
  // Sản lượng
  productionVolume: number;
  inventory: number;
  salesVolume: number;
  
  // Doanh thu
  inflationIndex: number;
  realPriceIndex: number;
  sellingPrice: number;
  revenue: number;
  
  // Chi phí
  componentCost: number;
  laborCost: number;
  electricityCost: number;
  landRent: number;
  adminCost: number;
  maintenanceCost: number;
  majorRepairCost: number;
  insuranceCost: number;
  environmentalCost: number;
  depreciation: number;
  intangibleDepreciation: number;
  cogs: number; // Giá vốn hàng bán
  
  // Thu nhập
  ebit: number;
  interestExpense: number;
  ebt: number;
  tax: number;
  netIncome: number;
  
  // Vốn lưu động
  ar: number;
  ap: number;
  cashBalance: number;
  inventoryValue: number;
  deltaAR: number;
  deltaAP: number;
  deltaCB: number;
  deltaInventory: number;
  
  // Ngân lưu
  ncfTIPV: number;
  ncfEPV: number;
  pvNCF_TIPV: number;
  pvNCF_EPV: number;
  cumulativePV_TIPV: number;
  cumulativePV_EPV: number;
  
  // Vay nợ
  loanBalance: number;
  interestPayment: number;
  principalPayment: number;
  totalDebtService: number;
  dscr: number;
  
  // WACC
  wacc: number;
}

// Giá trị mặc định cho dự án Ánh Dương
export const defaultProjectParams: ProjectParams = {
  projectName: "Dự án Ánh Dương",
  investmentYear: 0,
  operationYears: 8,
  liquidationYear: 9,
  
  landArea: 4000,
  landRentPrice: 0.2,
  landRentAdjustmentYears: 3,
  
  fixedAssetValue: 50000,
  fixedAssetLife: 10,
  
  intangibleAssetValue: 20000,
  intangibleAssetLife: 8,
  
  designCapacity: 45000,
  capacitySchedule: [80, 80, 90, 90, 90, 95, 95, 95],
  inventoryRate: 10,
  
  basePrice: 12,
  realPriceChange: -6,
  
  componentCost: 9,
  electricityPackaging: 0.4,
  
  workers: 40,
  workerSalary: 10,
  engineers: 20,
  engineerSalary: 15,
  realSalaryIncrease: 6,
  
  adminCost: 15000,
  adminCostLiquidationRate: 10,
  
  // Chi phí bảo trì, bảo hiểm, môi trường
  maintenanceCostRate: 2, // 2% giá trị TSCĐ/năm
  majorRepairCost: 5000, // 5 tỷ mỗi lần sửa chữa lớn
  majorRepairInterval: 4, // Sửa chữa lớn mỗi 4 năm
  insuranceCostRate: 0.5, // 0.5% giá trị TSCĐ/năm
  environmentalCost: 1000, // 1 tỷ/năm
  
  arRate: 6,
  apRate: 5,
  cashBalanceRate: 0.2,
  
  debtRatio: 60,
  nominalInterestRate: 12,
  loanTerm: 3,
  realEquityReturn: 12,
  
  corporateTaxRate: 20,
  inflationRate: 5,
};

// Tính toán chỉ số lạm phát
export function calculateInflationIndex(year: number, inflationRate: number): number {
  return Math.pow(1 + inflationRate / 100, year);
}

// Tính toán chỉ số giảm giá thực
export function calculateRealPriceIndex(year: number, realPriceChange: number): number {
  return Math.pow(1 + realPriceChange / 100, year);
}

// Tính WACC năm cụ thể
export function calculateWACC(
  debtRatio: number,
  nominalInterestRate: number,
  realEquityReturn: number,
  inflationRate: number,
  taxRate: number
): number {
  const nominalEquityReturn = (1 + realEquityReturn / 100) * (1 + inflationRate / 100) - 1;
  const afterTaxDebtCost = (nominalInterestRate / 100) * (1 - taxRate / 100);
  return (debtRatio / 100) * afterTaxDebtCost + (1 - debtRatio / 100) * nominalEquityReturn;
}

// Tính NPV
export function calculateNPV(cashFlows: number[], discountRates: number[]): number {
  let npv = 0;
  let cumulativeDiscount = 1;
  
  for (let i = 0; i < cashFlows.length; i++) {
    if (i > 0) {
      cumulativeDiscount *= (1 + discountRates[Math.min(i, discountRates.length - 1)]);
    }
    npv += cashFlows[i] / cumulativeDiscount;
  }
  
  return npv;
}

// Tính IRR (Newton-Raphson method)
export function calculateIRR(cashFlows: number[], guess: number = 0.1): number {
  const maxIterations = 1000;
  const tolerance = 0.0001;
  let rate = guess;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;
    
    for (let t = 0; t < cashFlows.length; t++) {
      const discountFactor = Math.pow(1 + rate, t);
      npv += cashFlows[t] / discountFactor;
      if (t > 0) {
        derivative -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
      }
    }
    
    if (Math.abs(derivative) < 1e-10) break;
    
    const newRate = rate - npv / derivative;
    
    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }
    
    rate = newRate;
  }
  
  return rate;
}

// Tính thời gian hoàn vốn có chiết khấu
export function calculateDPP(cumulativePVs: number[]): number {
  for (let i = 0; i < cumulativePVs.length; i++) {
    if (cumulativePVs[i] >= 0 && i > 0) {
      const prevPV = cumulativePVs[i - 1];
      const currentPV = cumulativePVs[i];
      return i - 1 + (-prevPV) / (currentPV - prevPV);
    }
  }
  return cumulativePVs.length; // Không hoàn vốn trong thời gian dự án
}

// Tính thời gian hoàn vốn không chiết khấu
export function calculatePaybackPeriod(cashFlows: number[]): number {
  let cumulative = 0;
  for (let i = 0; i < cashFlows.length; i++) {
    cumulative += cashFlows[i];
    if (cumulative >= 0 && i > 0) {
      const prevCum = cumulative - cashFlows[i];
      return i - 1 + (-prevCum) / (cumulative - prevCum);
    }
  }
  return cashFlows.length;
}

// Tính Profitability Index (PI)
export function calculatePI(npv: number, initialInvestment: number): number {
  if (initialInvestment === 0) return 0;
  return 1 + npv / Math.abs(initialInvestment);
}

// Tính Modified IRR (MIRR)
export function calculateMIRR(
  cashFlows: number[], 
  financeRate: number, 
  reinvestRate: number
): number {
  const n = cashFlows.length - 1;
  if (n <= 0) return 0;
  
  // PV của dòng tiền âm (chi phí)
  let pvNegative = 0;
  // FV của dòng tiền dương (lợi ích)
  let fvPositive = 0;
  
  for (let t = 0; t < cashFlows.length; t++) {
    if (cashFlows[t] < 0) {
      pvNegative += cashFlows[t] / Math.pow(1 + financeRate, t);
    } else {
      fvPositive += cashFlows[t] * Math.pow(1 + reinvestRate, n - t);
    }
  }
  
  if (pvNegative >= 0 || fvPositive <= 0) return 0;
  
  return Math.pow(-fvPositive / pvNegative, 1 / n) - 1;
}

// Tính Economic Value Added (EVA)
export function calculateEVA(
  netOperatingProfit: number, 
  investedCapital: number, 
  wacc: number
): number {
  return netOperatingProfit - (investedCapital * wacc);
}

// Tính điểm hòa vốn (Break-even)
export function calculateBreakEvenPoint(
  fixedCosts: number,
  pricePerUnit: number,
  variableCostPerUnit: number
): number {
  const contribution = pricePerUnit - variableCostPerUnit;
  if (contribution <= 0) return Infinity;
  return fixedCosts / contribution;
}

// Tính hệ số biến thiên (Coefficient of Variation)
export function calculateCoefficientOfVariation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return stdDev / Math.abs(mean);
}

// Tính độ biến động (Volatility)
export function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}
