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
