import {
  ProjectParams,
  ProjectResults,
  YearlyData,
  calculateInflationIndex,
  calculateRealPriceIndex,
  calculateWACC,
  calculateIRR,
  calculateDPP,
  calculatePaybackPeriod,
  calculatePI,
  calculateMIRR,
  calculateEVA,
  calculateBreakEvenPoint,
  calculateCoefficientOfVariation,
  calculateVolatility,
} from "./projectModel";

export function calculateProject(params: ProjectParams): ProjectResults {
  const totalYears = params.operationYears + 2; // Năm 0 (đầu tư) + hoạt động + thanh lý
  const yearlyData: YearlyData[] = [];
  
  // Tính khấu hao hàng năm
  const annualDepreciation = params.fixedAssetValue / params.fixedAssetLife;
  const annualIntangibleDepreciation = params.intangibleAssetValue / params.intangibleAssetLife;
  
  // Tính khoản vay và lịch trả nợ
  const loanAmount = params.fixedAssetValue * (params.debtRatio / 100);
  const equityAmount = params.fixedAssetValue * (1 - params.debtRatio / 100) + params.intangibleAssetValue;
  
  // Tính PMT (trả nợ đều)
  const monthlyRate = params.nominalInterestRate / 100;
  const pmt = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, params.loanTerm)) / 
              (Math.pow(1 + monthlyRate, params.loanTerm) - 1);
  
  let remainingLoan = loanAmount;
  const loanSchedule: { principal: number; interest: number; balance: number }[] = [];
  
  for (let y = 0; y <= params.loanTerm; y++) {
    if (y === 0) {
      loanSchedule.push({ principal: 0, interest: 0, balance: loanAmount });
    } else {
      const interest = remainingLoan * monthlyRate;
      const principal = pmt - interest;
      remainingLoan -= principal;
      loanSchedule.push({ principal, interest, balance: Math.max(0, remainingLoan) });
    }
  }
  
  // Tính toán theo từng năm
  let prevInventoryValue = 0;
  let prevAR = 0;
  let prevAP = 0;
  let prevCB = 0;
  let prevInventoryUnits = 0;
  
  for (let year = 0; year < totalYears; year++) {
    const inflationIndex = calculateInflationIndex(year, params.inflationRate);
    const realPriceIndex = calculateRealPriceIndex(year, params.realPriceChange);
    
    // Năm đầu tư (năm 0)
    if (year === 0) {
      yearlyData.push({
        year,
        productionVolume: 0,
        inventory: 0,
        salesVolume: 0,
        inflationIndex,
        realPriceIndex,
        sellingPrice: params.basePrice,
        revenue: 0,
        componentCost: 0,
        laborCost: 0,
        electricityCost: 0,
        landRent: 0,
        adminCost: 0,
        depreciation: 0,
        intangibleDepreciation: 0,
        cogs: 0,
        ebit: 0,
        interestExpense: 0,
        ebt: 0,
        tax: 0,
        netIncome: 0,
        ar: 0,
        ap: 0,
        cashBalance: 0,
        inventoryValue: 0,
        deltaAR: 0,
        deltaAP: 0,
        deltaCB: 0,
        deltaInventory: 0,
        ncfTIPV: -(params.fixedAssetValue + params.intangibleAssetValue),
        ncfEPV: -equityAmount,
        pvNCF_TIPV: -(params.fixedAssetValue + params.intangibleAssetValue),
        pvNCF_EPV: -equityAmount,
        cumulativePV_TIPV: -(params.fixedAssetValue + params.intangibleAssetValue),
        cumulativePV_EPV: -equityAmount,
        loanBalance: loanAmount,
        interestPayment: 0,
        principalPayment: 0,
        totalDebtService: 0,
        dscr: 0,
        wacc: calculateWACC(
          params.debtRatio,
          params.nominalInterestRate,
          params.realEquityReturn,
          params.inflationRate,
          params.corporateTaxRate
        ),
      });
      continue;
    }
    
    // Năm hoạt động
    const operationYear = year - 1; // Index trong mảng capacitySchedule
    const isLiquidationYear = year === params.liquidationYear;
    
    // Sản lượng
    let productionVolume = 0;
    let inventoryUnits = 0;
    let salesVolume = 0;
    
    if (!isLiquidationYear && operationYear < params.capacitySchedule.length) {
      const capacityRate = params.capacitySchedule[operationYear] / 100;
      productionVolume = Math.round(params.designCapacity * capacityRate);
      inventoryUnits = Math.round(productionVolume * (params.inventoryRate / 100));
      const fromProduction = productionVolume - inventoryUnits;
      const fromPrevInventory = prevInventoryUnits;
      salesVolume = fromProduction + fromPrevInventory;
    } else if (isLiquidationYear) {
      salesVolume = prevInventoryUnits; // Bán hết hàng tồn kho
    }
    
    // Giá bán
    const sellingPrice = params.basePrice * inflationIndex * realPriceIndex;
    const revenue = salesVolume * sellingPrice;
    
    // Chi phí sản xuất
    const componentUnitCost = params.componentCost * inflationIndex * realPriceIndex;
    const componentCost = productionVolume * componentUnitCost;
    
    const salaryIndex = Math.pow(1 + params.realSalaryIncrease / 100, year);
    const workerCost = params.workers * params.workerSalary * 12 * inflationIndex * salaryIndex;
    const engineerCost = params.engineers * params.engineerSalary * 12 * inflationIndex * salaryIndex;
    const laborCost = isLiquidationYear ? 0 : workerCost + engineerCost;
    
    const electricityCost = isLiquidationYear ? 0 : productionVolume * params.electricityPackaging * inflationIndex;
    
    // Tiền thuê đất (điều chỉnh theo chu kỳ)
    const adjustmentPeriod = Math.floor((year - 1) / params.landRentAdjustmentYears);
    const landInflationIndex = calculateInflationIndex(
      adjustmentPeriod * params.landRentAdjustmentYears,
      params.inflationRate
    );
    const landRent = (year === 0 || isLiquidationYear) ? 0 : 
                     params.landArea * params.landRentPrice * landInflationIndex;
    
    // Chi phí quản lý
    let adminCost = 0;
    if (!isLiquidationYear && operationYear < params.operationYears) {
      adminCost = params.adminCost * inflationIndex;
    } else if (isLiquidationYear) {
      adminCost = params.adminCost * calculateInflationIndex(year - 1, params.inflationRate) * 
                  (params.adminCostLiquidationRate / 100);
    }
    
    // Khấu hao
    const depreciation = (operationYear < params.fixedAssetLife && !isLiquidationYear) ? annualDepreciation : 0;
    const intangibleDepreciation = (operationYear < params.intangibleAssetLife && !isLiquidationYear) ? 
                                    annualIntangibleDepreciation : 0;
    
    // Giá thành sản xuất
    const totalProductionCost = componentCost + laborCost + electricityCost + landRent + 
                                depreciation + intangibleDepreciation;
    const unitProductionCost = productionVolume > 0 ? totalProductionCost / productionVolume : 0;
    
    // Giá vốn hàng bán (FIFO)
    let cogs = 0;
    if (!isLiquidationYear) {
      const fromProduction = (productionVolume - inventoryUnits) * unitProductionCost;
      const fromPrevInventory = prevInventoryValue;
      cogs = fromProduction + fromPrevInventory;
    } else {
      cogs = prevInventoryValue;
    }
    
    // Giá trị hàng tồn kho cuối kỳ
    const inventoryValue = inventoryUnits * unitProductionCost;
    
    // EBIT, EBT, Tax, Net Income
    const ebit = revenue - cogs - adminCost;
    
    const loanData = year <= params.loanTerm ? loanSchedule[year] : { interest: 0, principal: 0, balance: 0 };
    const interestExpense = loanData.interest;
    
    const ebt = ebit - interestExpense;
    const tax = ebt > 0 ? ebt * (params.corporateTaxRate / 100) : 0;
    const netIncome = ebt - tax;
    
    // Vốn lưu động
    const ar = isLiquidationYear ? 0 : revenue * (params.arRate / 100);
    const ap = isLiquidationYear ? 0 : componentCost * (params.apRate / 100);
    const cashBalance = isLiquidationYear ? 0 : revenue * (params.cashBalanceRate / 100);
    
    const deltaAR = ar - prevAR;
    const deltaAP = ap - prevAP;
    const deltaCB = cashBalance - prevCB;
    const deltaInventory = inventoryValue - prevInventoryValue;
    
    // Giá trị thanh lý
    const residualValue = isLiquidationYear ? 
      (params.fixedAssetValue - annualDepreciation * params.operationYears) * 
      calculateInflationIndex(year, params.inflationRate) : 0;
    
    // Ngân lưu TIPV
    const cashInflow = revenue - deltaAR + residualValue;
    const cashOutflow = componentCost + laborCost + electricityCost + landRent + adminCost -
                        deltaAP + deltaCB + deltaInventory;
    const ncfBeforeTax = cashInflow - cashOutflow;
    const ncfTIPV = ncfBeforeTax - tax;
    
    // Ngân lưu EPV
    const debtService = year <= params.loanTerm ? pmt : 0;
    const ncfEPV = ncfTIPV - debtService;
    
    // WACC
    const currentDebt = loanData.balance;
    const currentEquity = equityAmount;
    const totalCapital = currentDebt + currentEquity;
    const currentDebtRatio = totalCapital > 0 ? (currentDebt / totalCapital) * 100 : 0;
    const wacc = calculateWACC(
      currentDebtRatio,
      params.nominalInterestRate,
      params.realEquityReturn,
      params.inflationRate,
      params.corporateTaxRate
    );
    
    // DSCR
    const dscr = debtService > 0 ? ncfTIPV / debtService : 0;
    
    yearlyData.push({
      year,
      productionVolume,
      inventory: inventoryUnits,
      salesVolume,
      inflationIndex,
      realPriceIndex,
      sellingPrice,
      revenue,
      componentCost,
      laborCost,
      electricityCost,
      landRent,
      adminCost,
      depreciation,
      intangibleDepreciation,
      cogs,
      ebit,
      interestExpense,
      ebt,
      tax,
      netIncome,
      ar,
      ap,
      cashBalance,
      inventoryValue,
      deltaAR,
      deltaAP,
      deltaCB,
      deltaInventory,
      ncfTIPV,
      ncfEPV,
      pvNCF_TIPV: 0, // Sẽ tính sau
      pvNCF_EPV: 0,
      cumulativePV_TIPV: 0,
      cumulativePV_EPV: 0,
      loanBalance: loanData.balance,
      interestPayment: loanData.interest,
      principalPayment: loanData.principal,
      totalDebtService: debtService,
      dscr,
      wacc,
    });
    
    // Cập nhật giá trị năm trước
    prevInventoryValue = inventoryValue;
    prevInventoryUnits = inventoryUnits;
    prevAR = ar;
    prevAP = ap;
    prevCB = cashBalance;
  }
  
  // Tính WACC bình quân
  const waccSum = yearlyData.reduce((sum, d) => sum + d.wacc, 0);
  const waccAverage = waccSum / yearlyData.length;
  
  // Tính PV và Cumulative PV
  let cumulativeTIPV = 0;
  let cumulativeEPV = 0;
  
  // Re danh nghĩa cho EPV
  const nominalRe = (1 + params.realEquityReturn / 100) * (1 + params.inflationRate / 100) - 1;
  
  for (let i = 0; i < yearlyData.length; i++) {
    const discountFactorTIPV = 1 / Math.pow(1 + waccAverage, i);
    const discountFactorEPV = 1 / Math.pow(1 + nominalRe, i);
    
    yearlyData[i].pvNCF_TIPV = yearlyData[i].ncfTIPV * discountFactorTIPV;
    yearlyData[i].pvNCF_EPV = yearlyData[i].ncfEPV * discountFactorEPV;
    
    cumulativeTIPV += yearlyData[i].pvNCF_TIPV;
    cumulativeEPV += yearlyData[i].pvNCF_EPV;
    
    yearlyData[i].cumulativePV_TIPV = cumulativeTIPV;
    yearlyData[i].cumulativePV_EPV = cumulativeEPV;
  }
  
  // Tính các chỉ số tổng hợp cơ bản
  const ncfsTIPV = yearlyData.map(d => d.ncfTIPV);
  const ncfsEPV = yearlyData.map(d => d.ncfEPV);
  const cumulativePVsTIPV = yearlyData.map(d => d.cumulativePV_TIPV);
  const cumulativePVsEPV = yearlyData.map(d => d.cumulativePV_EPV);
  
  const npvTIPV = cumulativeTIPV;
  const npvEPV = cumulativeEPV;
  const irrTIPV = calculateIRR(ncfsTIPV);
  const irrEPV = calculateIRR(ncfsEPV);
  const dppTIPV = calculateDPP(cumulativePVsTIPV);
  const dppEPV = calculateDPP(cumulativePVsEPV);
  
  // DSCR bình quân
  const dscrValues = yearlyData.filter(d => d.dscr > 0).map(d => d.dscr);
  const dscrAverage = dscrValues.length > 0 ? 
    dscrValues.reduce((sum, d) => sum + d, 0) / dscrValues.length : 0;

  // === TÍNH CÁC CHỈ SỐ MỞ RỘNG ===
  
  // Tổng vốn đầu tư (sử dụng lại biến đã có ở trên)
  const totalInvestment = params.fixedAssetValue + params.intangibleAssetValue;
  
  // Dữ liệu hoạt động (bỏ năm đầu tư và thanh lý)
  const operatingYears = yearlyData.filter(d => d.year > 0 && d.year <= params.operationYears);
  
  // === CHỈ SỐ SINH LỜI ===
  
  // Tổng lợi nhuận ròng
  const totalNetIncome = operatingYears.reduce((sum, d) => sum + d.netIncome, 0);
  const averageNetIncome = operatingYears.length > 0 ? totalNetIncome / operatingYears.length : 0;
  
  // ROI - Return on Investment (%)
  const roi = totalInvestment > 0 ? (totalNetIncome / totalInvestment) * 100 : 0;
  
  // ROE - Return on Equity (%)
  const roe = equityAmount > 0 ? (averageNetIncome / equityAmount) * 100 : 0;
  
  // ROA - Return on Assets (%)
  const roa = totalInvestment > 0 ? (averageNetIncome / totalInvestment) * 100 : 0;
  
  // Tổng doanh thu
  const totalRevenue = operatingYears.reduce((sum, d) => sum + d.revenue, 0);
  const averageRevenue = operatingYears.length > 0 ? totalRevenue / operatingYears.length : 0;
  
  // Tổng chi phí sản xuất
  const totalCOGS = operatingYears.reduce((sum, d) => sum + d.cogs, 0);
  
  // Gross Profit Margin - Biên lợi nhuận gộp (%)
  const grossProfitMargin = totalRevenue > 0 ? ((totalRevenue - totalCOGS) / totalRevenue) * 100 : 0;
  
  // Net Profit Margin - Biên lợi nhuận ròng (%)
  const netProfitMargin = totalRevenue > 0 ? (totalNetIncome / totalRevenue) * 100 : 0;
  
  // Average Profit Margin - Biên lợi nhuận bình quân (%)
  const profitMargins = operatingYears.map(d => d.revenue > 0 ? (d.netIncome / d.revenue) * 100 : 0);
  const averageProfitMargin = profitMargins.length > 0 ? 
    profitMargins.reduce((a, b) => a + b, 0) / profitMargins.length : 0;
  
  // Break-even Point
  const avgFixedCosts = operatingYears.length > 0 ?
    operatingYears.reduce((sum, d) => sum + d.depreciation + d.intangibleDepreciation + d.adminCost + d.landRent, 0) / operatingYears.length : 0;
  const avgPrice = operatingYears.length > 0 ?
    operatingYears.reduce((sum, d) => sum + d.sellingPrice, 0) / operatingYears.length : 0;
  const avgVariableCost = operatingYears.length > 0 ?
    operatingYears.reduce((sum, d) => {
      const unitVar = d.productionVolume > 0 ? (d.componentCost + d.laborCost + d.electricityCost) / d.productionVolume : 0;
      return sum + unitVar;
    }, 0) / operatingYears.length : 0;
  
  const breakEvenPoint = calculateBreakEvenPoint(avgFixedCosts, avgPrice, avgVariableCost);
  
  // Break-even Year - Năm hòa vốn (dựa trên NCF tích lũy)
  let breakEvenYear = params.operationYears + 1;
  let cumulativeNCF = 0;
  for (const d of yearlyData) {
    cumulativeNCF += d.ncfTIPV;
    if (cumulativeNCF >= 0 && d.year > 0) {
      const prevCum = cumulativeNCF - d.ncfTIPV;
      breakEvenYear = d.year - 1 + (-prevCum) / (cumulativeNCF - prevCum);
      break;
    }
  }
  
  // Break-even Revenue - Doanh thu hòa vốn
  const breakEvenRevenue = breakEvenPoint * avgPrice;
  
  // === CHỈ SỐ HIỆU QUẢ VỐN ===
  
  // PI - Profitability Index
  const pi = calculatePI(npvTIPV, totalInvestment);
  
  // MIRR - Modified Internal Rate of Return
  const mirr = calculateMIRR(ncfsTIPV, waccAverage, waccAverage);
  
  // Payback Period - Thời gian hoàn vốn không chiết khấu
  const paybackPeriod = calculatePaybackPeriod(ncfsTIPV);
  
  // EVA - Economic Value Added (bình quân hàng năm)
  const avgNOPAT = operatingYears.length > 0 ?
    operatingYears.reduce((sum, d) => sum + d.ebit * (1 - params.corporateTaxRate / 100), 0) / operatingYears.length : 0;
  const eva = calculateEVA(avgNOPAT, totalInvestment, waccAverage);
  
  // Capital Turnover - Vòng quay vốn
  const capitalTurnover = totalInvestment > 0 ? averageRevenue / totalInvestment : 0;
  
  // Asset Turnover - Vòng quay tài sản
  const assetTurnover = totalInvestment > 0 ? totalRevenue / totalInvestment : 0;
  
  // === CHỈ SỐ RỦI RO ===
  
  // Coefficient of Variation - Hệ số biến thiên dòng tiền
  const operatingNCFs = operatingYears.map(d => d.ncfTIPV);
  const coefficientOfVariation = calculateCoefficientOfVariation(operatingNCFs);
  
  // Sensitivity Index - Chỉ số độ nhạy (NPV / Investment)
  const sensitivityIndex = totalInvestment > 0 ? Math.abs(npvTIPV / totalInvestment) : 0;
  
  // Financial Leverage - Đòn bẩy tài chính
  const financialLeverage = equityAmount > 0 ? totalInvestment / equityAmount : 1;
  
  // Operating Leverage - Đòn bẩy hoạt động (Fixed Costs / Total Costs)
  const totalCosts = operatingYears.reduce((sum, d) => 
    sum + d.cogs + d.adminCost, 0);
  const fixedCosts = operatingYears.reduce((sum, d) => 
    sum + d.depreciation + d.intangibleDepreciation + d.landRent + d.adminCost, 0);
  const operatingLeverage = totalCosts > 0 ? fixedCosts / totalCosts : 0;
  
  // Safety Margin - Biên an toàn (%)
  const avgSalesVolume = operatingYears.length > 0 ?
    operatingYears.reduce((sum, d) => sum + d.salesVolume, 0) / operatingYears.length : 0;
  const safetyMargin = avgSalesVolume > 0 && isFinite(breakEvenPoint) ? 
    ((avgSalesVolume - breakEvenPoint) / avgSalesVolume) * 100 : 0;
  
  // === CHỈ SỐ THANH KHOẢN & NỢ ===
  
  // Debt to Equity Ratio
  const debtToEquity = equityAmount > 0 ? loanAmount / equityAmount : 0;
  
  // Interest Coverage Ratio - Hệ số thanh toán lãi vay
  const totalInterest = yearlyData.reduce((sum, d) => sum + d.interestExpense, 0);
  const totalEBIT = operatingYears.reduce((sum, d) => sum + d.ebit, 0);
  const interestCoverageRatio = totalInterest > 0 ? totalEBIT / totalInterest : Infinity;
  
  // Debt Service Coverage Ratio (average)
  const debtServiceCoverageRatio = dscrAverage;
  
  // === THỐNG KÊ DÒNG TIỀN ===
  
  // Total Cash Inflow/Outflow
  const totalCashInflow = yearlyData.reduce((sum, d) => sum + Math.max(0, d.ncfTIPV), 0);
  const totalCashOutflow = Math.abs(yearlyData.reduce((sum, d) => sum + Math.min(0, d.ncfTIPV), 0));
  
  // Peak Cash Deficit
  let peakCashDeficit = 0;
  cumulativeNCF = 0;
  for (const d of yearlyData) {
    cumulativeNCF += d.ncfTIPV;
    if (cumulativeNCF < peakCashDeficit) {
      peakCashDeficit = cumulativeNCF;
    }
  }
  peakCashDeficit = Math.abs(peakCashDeficit);
  
  // Cash Flow Volatility
  const cashFlowVolatility = calculateVolatility(operatingNCFs);

  return {
    // Chỉ số cơ bản
    npvTIPV,
    irrTIPV,
    dppTIPV,
    dscrAverage,
    npvEPV,
    irrEPV,
    dppEPV,
    waccAverage,
    
    // Chỉ số sinh lời
    roi,
    roe,
    roa,
    averageProfitMargin,
    grossProfitMargin,
    netProfitMargin,
    breakEvenPoint: isFinite(breakEvenPoint) ? breakEvenPoint : 0,
    breakEvenYear,
    breakEvenRevenue: isFinite(breakEvenRevenue) ? breakEvenRevenue : 0,
    
    // Chỉ số hiệu quả vốn
    pi,
    mirr,
    eva,
    paybackPeriod,
    capitalTurnover,
    assetTurnover,
    
    // Chỉ số rủi ro
    coefficientOfVariation,
    sensitivityIndex,
    financialLeverage,
    operatingLeverage,
    safetyMargin,
    
    // Chỉ số thanh khoản & nợ
    debtToEquity,
    interestCoverageRatio: isFinite(interestCoverageRatio) ? interestCoverageRatio : 999,
    debtServiceCoverageRatio,
    
    // Thống kê dòng tiền
    totalCashInflow,
    totalCashOutflow,
    peakCashDeficit,
    cashFlowVolatility,
    
    yearlyData,
  };
}
