import { ProjectParams, ProjectResults, defaultProjectParams } from "./projectModel";

export type IndustryKey =
  | "manufacturing"
  | "realestate"
  | "technology"
  | "energy"
  | "retail"
  | "logistics"
  | "healthcare"
  | "agriculture";

export interface IndustryKPI {
  key: string;
  labelVi: string;
  labelEn: string;
  value: number;
  unit: "%" | "x" | "years" | "money" | "num";
  /** benchmark good threshold; higherIsBetter decides direction */
  benchmark: number;
  higherIsBetter: boolean;
  formula: string;
  descVi: string;
  descEn: string;
}

export interface IndustryProfile {
  key: IndustryKey;
  nameVi: string;
  nameEn: string;
  icon: string; // lucide icon name
  color: string; // css var token
  descVi: string;
  descEn: string;
  /** typical discount / risk premium guidance */
  riskPremium: number; // %
  preset: Partial<ProjectParams>;
  /** industry-specific glossary of key drivers */
  drivers: { vi: string; en: string }[];
  kpis: (p: ProjectParams, r: ProjectResults) => IndustryKPI[];
}

// ── helpers ─────────────────────────────────────────────
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const safe = (n: number) => (Number.isFinite(n) ? n : 0);

const totalInvestment = (p: ProjectParams) =>
  p.fixedAssetValue + p.intangibleAssetValue;

const avgRevenue = (r: ProjectResults) => {
  const ys = r.yearlyData.filter((y) => y.revenue > 0);
  return ys.length ? sum(ys.map((y) => y.revenue)) / ys.length : 0;
};

const avgEbit = (r: ProjectResults) => {
  const ys = r.yearlyData.filter((y) => y.revenue > 0);
  return ys.length ? sum(ys.map((y) => y.ebit)) / ys.length : 0;
};

const avgNetIncome = (r: ProjectResults) => {
  const ys = r.yearlyData.filter((y) => y.revenue > 0);
  return ys.length ? sum(ys.map((y) => y.netIncome)) / ys.length : 0;
};

const commonKpi = (
  key: string,
  labelVi: string,
  labelEn: string,
  value: number,
  unit: IndustryKPI["unit"],
  benchmark: number,
  higherIsBetter: boolean,
  formula: string,
  descVi: string,
  descEn: string
): IndustryKPI => ({
  key,
  labelVi,
  labelEn,
  value: safe(value),
  unit,
  benchmark,
  higherIsBetter,
  formula,
  descVi,
  descEn,
});

// ── profiles ────────────────────────────────────────────
export const industryProfiles: IndustryProfile[] = [
  {
    key: "manufacturing",
    nameVi: "Sản xuất công nghiệp",
    nameEn: "Manufacturing",
    icon: "Factory",
    color: "hsl(var(--quant-cyan))",
    descVi: "Nhà máy, dây chuyền thiết bị, công suất theo sản lượng.",
    descEn: "Plants, production lines, capacity-driven output.",
    riskPremium: 6,
    preset: { ...defaultProjectParams },
    drivers: [
      { vi: "Công suất huy động & tồn kho", en: "Capacity utilization & inventory" },
      { vi: "Giá linh kiện / nguyên vật liệu", en: "Component & raw material cost" },
      { vi: "Chi phí bảo trì và sửa chữa lớn", en: "Maintenance & overhaul cost" },
    ],
    kpis: (p, r) => {
      const util = p.capacitySchedule.length
        ? sum(p.capacitySchedule) / p.capacitySchedule.length
        : 0;
      const rev = avgRevenue(r);
      const capexIntensity = (totalInvestment(p) / (rev || 1)) * 100;
      const unitMargin = ((p.basePrice - p.componentCost - p.electricityPackaging) / (p.basePrice || 1)) * 100;
      return [
        commonKpi("util", "Hiệu suất huy động công suất", "Capacity Utilization", util, "%", 80, true,
          "Σ capacity(%) / n", "Tỷ lệ công suất huy động bình quân toàn vòng đời.", "Average capacity utilization over project life."),
        commonKpi("unitMargin", "Biên đóng góp/sản phẩm", "Unit Contribution Margin", unitMargin, "%", 20, true,
          "(P − VC)/P", "Phần giá bán còn lại sau biến phí trực tiếp.", "Price left after direct variable cost."),
        commonKpi("capexInt", "Cường độ vốn (Capex/Doanh thu)", "Capex Intensity", capexIntensity, "%", 120, false,
          "Tổng đầu tư / Doanh thu BQ", "Vốn cần bỏ ra trên mỗi đồng doanh thu.", "Capital required per revenue unit."),
        commonKpi("ebitM", "Biên EBIT", "EBIT Margin", (avgEbit(r) / (rev || 1)) * 100, "%", 12, true,
          "EBIT / Doanh thu", "Hiệu quả vận hành trước lãi vay và thuế.", "Operating efficiency before interest and tax."),
      ];
    },
  },
  {
    key: "realestate",
    nameVi: "Bất động sản",
    nameEn: "Real Estate",
    icon: "Building2",
    color: "hsl(var(--quant-amber))",
    descVi: "Dự án nhà ở, KCN, thương mại — hấp thụ chậm, đòn bẩy cao.",
    descEn: "Residential, industrial park, commercial — slow absorption, high leverage.",
    riskPremium: 8,
    preset: {
      projectName: "Dự án Bất động sản",
      operationYears: 10,
      liquidationYear: 11,
      landArea: 20000,
      landRentPrice: 1.2,
      fixedAssetValue: 400000,
      fixedAssetLife: 25,
      intangibleAssetValue: 60000,
      intangibleAssetLife: 10,
      designCapacity: 500, // căn / lô
      capacitySchedule: [20, 35, 50, 65, 80, 90, 95, 95, 95, 95],
      inventoryRate: 25,
      basePrice: 2500, // triệu/căn
      realPriceChange: 2,
      componentCost: 1500,
      electricityPackaging: 20,
      workers: 30,
      workerSalary: 12,
      engineers: 15,
      engineerSalary: 25,
      adminCost: 40000,
      maintenanceCostRate: 1.2,
      majorRepairCost: 20000,
      majorRepairInterval: 5,
      insuranceCostRate: 0.3,
      environmentalCost: 3000,
      arRate: 20,
      apRate: 15,
      debtRatio: 65,
      nominalInterestRate: 11,
      loanTerm: 7,
      realEquityReturn: 15,
      inflationRate: 4,
    },
    drivers: [
      { vi: "Tốc độ hấp thụ & tồn kho hàng tồn", en: "Absorption rate & unsold inventory" },
      { vi: "Chi phí đất và tiền sử dụng đất", en: "Land cost & land use fees" },
      { vi: "Đòn bẩy tài chính, lãi vay xây dựng", en: "Leverage & construction interest" },
    ],
    kpis: (p, r) => {
      const rev = avgRevenue(r);
      const dev = totalInvestment(p) + p.landArea * p.landRentPrice * p.operationYears;
      const noi = avgEbit(r) + (r.yearlyData[1]?.depreciation ?? 0);
      const absorption = p.capacitySchedule.length ? p.capacitySchedule[0] : 0;
      return [
        commonKpi("yoc", "Yield on Cost", "Yield on Cost", (noi / (dev || 1)) * 100, "%", 9, true,
          "NOI / Tổng chi phí phát triển", "Lợi suất khai thác trên tổng chi phí phát triển.", "Operating yield over total development cost."),
        commonKpi("capRate", "Cap Rate ngầm định", "Implied Cap Rate", (noi / (rev * 5 || 1)) * 100, "%", 7, true,
          "NOI / Giá trị tài sản ước tính", "Tỷ suất vốn hóa tài sản khi thoái vốn.", "Capitalization rate at exit."),
        commonKpi("absorb", "Tốc độ hấp thụ năm đầu", "Year-1 Absorption", absorption, "%", 25, true,
          "Sản lượng bán năm 1 / Tổng rổ hàng", "Tỷ lệ sản phẩm bán được trong năm đầu mở bán.", "Share of inventory sold in first year."),
        commonKpi("invRisk", "Tồn kho / Doanh thu", "Inventory Overhang", p.inventoryRate, "%", 20, false,
          "Tồn kho / Sản lượng", "Rủi ro hàng tồn chôn vốn.", "Unsold stock tying up capital."),
        commonKpi("ltc", "Loan-to-Cost", "Loan-to-Cost", p.debtRatio, "%", 70, false,
          "Nợ vay / Tổng chi phí", "Mức đòn bẩy trên tổng chi phí dự án.", "Leverage over total project cost."),
        commonKpi("dscr", "DSCR bình quân", "Average DSCR", r.dscrAverage, "x", 1.25, true,
          "CFADS / Nghĩa vụ nợ", "Khả năng trả nợ — ngân hàng thường yêu cầu ≥ 1.25x.", "Debt service capacity — banks require ≥ 1.25x."),
      ];
    },
  },
  {
    key: "technology",
    nameVi: "Công nghệ / SaaS",
    nameEn: "Technology / SaaS",
    icon: "Cpu",
    color: "hsl(var(--quant-violet))",
    descVi: "Sản phẩm số, thuê bao — biên gộp cao, đầu tư vô hình lớn.",
    descEn: "Digital products, subscriptions — high gross margin, intangible-heavy.",
    riskPremium: 11,
    preset: {
      projectName: "Dự án Công nghệ / SaaS",
      operationYears: 7,
      liquidationYear: 8,
      landArea: 500,
      landRentPrice: 3,
      fixedAssetValue: 15000,
      fixedAssetLife: 5,
      intangibleAssetValue: 60000,
      intangibleAssetLife: 5,
      designCapacity: 50000, // thuê bao
      capacitySchedule: [15, 35, 55, 75, 88, 95, 98],
      inventoryRate: 0,
      basePrice: 3, // triệu/thuê bao/năm
      realPriceChange: 3,
      componentCost: 0.45, // hosting + hỗ trợ / thuê bao
      electricityPackaging: 0.05,
      workers: 25,
      workerSalary: 20,
      engineers: 60,
      engineerSalary: 40,
      realSalaryIncrease: 8,
      adminCost: 30000,
      maintenanceCostRate: 6,
      majorRepairCost: 0,
      majorRepairInterval: 99,
      insuranceCostRate: 0.2,
      environmentalCost: 0,
      arRate: 8,
      apRate: 4,
      debtRatio: 20,
      nominalInterestRate: 10,
      loanTerm: 4,
      realEquityReturn: 20,
      inflationRate: 4,
    },
    drivers: [
      { vi: "Tăng trưởng thuê bao & churn", en: "Subscriber growth & churn" },
      { vi: "CAC, LTV và thời gian hoàn vốn khách hàng", en: "CAC, LTV & payback" },
      { vi: "Biên gộp hạ tầng (hosting, hỗ trợ)", en: "Infrastructure gross margin" },
    ],
    kpis: (p, r) => {
      const rev = avgRevenue(r);
      const grossMargin = ((p.basePrice - p.componentCost - p.electricityPackaging) / (p.basePrice || 1)) * 100;
      const activeUsers = (p.designCapacity * (p.capacitySchedule[1] ?? 50)) / 100;
      const cac = p.adminCost / (activeUsers || 1);
      const churn = Math.max(2, 20 - (p.capacitySchedule.at(-1) ?? 90) / 6);
      const ltv = ((p.basePrice * grossMargin) / 100) / (churn / 100 || 1);
      const growth = p.capacitySchedule.length > 1
        ? ((p.capacitySchedule[1] - p.capacitySchedule[0]) / (p.capacitySchedule[0] || 1)) * 100
        : 0;
      const ebitM = (avgEbit(r) / (rev || 1)) * 100;
      return [
        commonKpi("gm", "Biên lợi nhuận gộp", "Gross Margin", grossMargin, "%", 70, true,
          "(ARPU − COGS)/ARPU", "SaaS chuẩn ngành đạt 70–85%.", "Industry standard SaaS reaches 70–85%."),
        commonKpi("ltvcac", "LTV / CAC", "LTV / CAC", ltv / (cac || 1), "x", 3, true,
          "LTV / CAC", "Giá trị vòng đời khách hàng trên chi phí thu hút.", "Lifetime value over acquisition cost."),
        commonKpi("cacpb", "Hoàn vốn CAC", "CAC Payback", (cac / ((p.basePrice * grossMargin) / 100 / 12 || 1)), "num", 18, false,
          "CAC / (ARPU tháng × GM)", "Số tháng để thu hồi chi phí thu hút khách hàng.", "Months to recover acquisition cost."),
        commonKpi("churn", "Churn ước tính", "Estimated Churn", churn, "%", 8, false,
          "1 − tỷ lệ giữ chân", "Tỷ lệ khách hàng rời bỏ mỗi năm.", "Annual customer attrition."),
        commonKpi("rule40", "Rule of 40", "Rule of 40", growth + ebitM, "num", 40, true,
          "Tăng trưởng % + Biên EBIT %", "Chuẩn đánh giá cân bằng tăng trưởng và lợi nhuận.", "Balance of growth and profitability."),
        commonKpi("intangible", "Tỷ trọng tài sản vô hình", "Intangible Share", (p.intangibleAssetValue / (totalInvestment(p) || 1)) * 100, "%", 50, true,
          "TSVH / Tổng đầu tư", "Phần vốn đầu tư vào R&D, phần mềm, IP.", "Capital invested in R&D, software, IP."),
      ];
    },
  },
  {
    key: "energy",
    nameVi: "Năng lượng tái tạo",
    nameEn: "Renewable Energy",
    icon: "Zap",
    color: "hsl(var(--quant-green))",
    descVi: "Điện mặt trời, gió — capex nặng, dòng tiền dài hạn ổn định.",
    descEn: "Solar, wind — capex heavy, long stable cash flows.",
    riskPremium: 5,
    preset: {
      projectName: "Dự án Năng lượng tái tạo",
      operationYears: 20,
      liquidationYear: 21,
      landArea: 100000,
      landRentPrice: 0.05,
      fixedAssetValue: 800000,
      fixedAssetLife: 20,
      intangibleAssetValue: 30000,
      intangibleAssetLife: 20,
      designCapacity: 100000, // MWh/năm
      capacitySchedule: Array.from({ length: 20 }, (_, i) => Math.max(78, 95 - i * 0.6)),
      inventoryRate: 0,
      basePrice: 0.0018, // triệu/kWh
      realPriceChange: 0,
      componentCost: 0.0002,
      electricityPackaging: 0.00005,
      workers: 20,
      workerSalary: 11,
      engineers: 12,
      engineerSalary: 22,
      adminCost: 12000,
      maintenanceCostRate: 1.5,
      majorRepairCost: 40000,
      majorRepairInterval: 8,
      insuranceCostRate: 0.4,
      environmentalCost: 2000,
      arRate: 10,
      apRate: 5,
      debtRatio: 70,
      nominalInterestRate: 9,
      loanTerm: 12,
      realEquityReturn: 11,
      inflationRate: 4,
    },
    drivers: [
      { vi: "Hệ số công suất (capacity factor) & suy giảm", en: "Capacity factor & degradation" },
      { vi: "Giá PPA / FIT và điều khoản bao tiêu", en: "PPA / FIT price & offtake terms" },
      { vi: "Cấu trúc nợ dài hạn và DSCR ràng buộc", en: "Long-term debt & DSCR covenants" },
    ],
    kpis: (p, r) => {
      const rev = avgRevenue(r);
      const cf = p.capacitySchedule.length ? sum(p.capacitySchedule) / p.capacitySchedule.length : 0;
      const lcoe = (totalInvestment(p) + sum(r.yearlyData.map((y) => y.cogs))) /
        ((p.designCapacity * p.operationYears * (cf / 100)) || 1);
      return [
        commonKpi("cf", "Hệ số công suất", "Capacity Factor", cf, "%", 75, true,
          "Sản lượng thực / Công suất thiết kế", "Mức khai thác thực tế của nhà máy.", "Actual output vs nameplate capacity."),
        commonKpi("lcoe", "LCOE", "LCOE", lcoe, "money", 0.0016, false,
          "(Capex + Σ Opex) / Σ Sản lượng", "Chi phí quy dẫn mỗi đơn vị điện năng.", "Levelized cost per energy unit."),
        commonKpi("dscr", "DSCR bình quân", "Average DSCR", r.dscrAverage, "x", 1.3, true,
          "CFADS / Nghĩa vụ nợ", "Ràng buộc tài trợ dự án thường ≥ 1.3x.", "Project finance covenant usually ≥ 1.3x."),
        commonKpi("opexRatio", "Opex / Doanh thu", "Opex Ratio", ((rev - avgEbit(r)) / (rev || 1)) * 100, "%", 40, false,
          "(Doanh thu − EBIT)/Doanh thu", "Chi phí vận hành trên doanh thu.", "Operating cost over revenue."),
        commonKpi("tenor", "Kỳ hạn nợ / Vòng đời", "Debt Tenor Ratio", (p.loanTerm / (p.operationYears || 1)) * 100, "%", 60, true,
          "Kỳ hạn vay / Số năm hoạt động", "Nợ dài hạn giúp giảm áp lực trả nợ.", "Longer tenor eases debt service."),
      ];
    },
  },
  {
    key: "retail",
    nameVi: "Bán lẻ / F&B",
    nameEn: "Retail / F&B",
    icon: "ShoppingBag",
    color: "hsl(var(--quant-amber))",
    descVi: "Chuỗi cửa hàng, nhà hàng — vòng quay nhanh, biên mỏng.",
    descEn: "Store chains, restaurants — fast turnover, thin margins.",
    riskPremium: 9,
    preset: {
      projectName: "Dự án Chuỗi bán lẻ / F&B",
      operationYears: 6,
      liquidationYear: 7,
      landArea: 1500,
      landRentPrice: 6,
      fixedAssetValue: 45000,
      fixedAssetLife: 6,
      intangibleAssetValue: 10000,
      intangibleAssetLife: 5,
      designCapacity: 900000, // lượt khách/năm
      capacitySchedule: [50, 70, 85, 92, 95, 95],
      inventoryRate: 8,
      basePrice: 0.15,
      realPriceChange: 1,
      componentCost: 0.06,
      electricityPackaging: 0.012,
      workers: 150,
      workerSalary: 8,
      engineers: 10,
      engineerSalary: 16,
      adminCost: 18000,
      maintenanceCostRate: 3,
      majorRepairCost: 6000,
      majorRepairInterval: 3,
      insuranceCostRate: 0.4,
      environmentalCost: 500,
      arRate: 2,
      apRate: 20,
      debtRatio: 40,
      nominalInterestRate: 11,
      loanTerm: 4,
      realEquityReturn: 16,
      inflationRate: 4,
    },
    drivers: [
      { vi: "Doanh thu/m² và lượt khách", en: "Revenue per sqm & footfall" },
      { vi: "Chi phí thuê mặt bằng và nhân công", en: "Rent & labor cost" },
      { vi: "Vòng quay hàng tồn kho", en: "Inventory turnover" },
    ],
    kpis: (p, r) => {
      const rev = avgRevenue(r);
      const rent = p.landArea * p.landRentPrice;
      const labor = (p.workers * p.workerSalary + p.engineers * p.engineerSalary) * 12;
      return [
        commonKpi("revSqm", "Doanh thu / m²", "Revenue per sqm", rev / (p.landArea || 1), "money", 0.05, true,
          "Doanh thu / Diện tích", "Hiệu suất khai thác mặt bằng.", "Productivity of retail space."),
        commonKpi("rentRatio", "Chi phí thuê / Doanh thu", "Rent-to-Sales", (rent / (rev || 1)) * 100, "%", 12, false,
          "Tiền thuê / Doanh thu", "Ngưỡng an toàn ngành bán lẻ ~10–15%.", "Retail safe threshold ~10–15%."),
        commonKpi("laborRatio", "Chi phí nhân công / Doanh thu", "Labor-to-Sales", (labor / (rev || 1)) * 100, "%", 25, false,
          "Lương / Doanh thu", "Áp lực chi phí nhân sự vận hành.", "Operating labor cost pressure."),
        commonKpi("invTurn", "Vòng quay hàng tồn", "Inventory Turnover", 100 / (p.inventoryRate || 1), "x", 8, true,
          "1 / Tỷ lệ tồn kho", "Tốc độ luân chuyển hàng hóa.", "Speed of stock rotation."),
        commonKpi("netM", "Biên lợi nhuận ròng", "Net Margin", (avgNetIncome(r) / (rev || 1)) * 100, "%", 6, true,
          "LNST / Doanh thu", "Biên ròng ngành bán lẻ thường 3–8%.", "Retail net margin typically 3–8%."),
      ];
    },
  },
  {
    key: "logistics",
    nameVi: "Logistics / Kho vận",
    nameEn: "Logistics / Warehousing",
    icon: "Truck",
    color: "hsl(var(--quant-cyan))",
    descVi: "Kho bãi, đội xe, trung tâm phân phối.",
    descEn: "Warehouses, fleets, distribution centers.",
    riskPremium: 7,
    preset: {
      projectName: "Dự án Logistics",
      operationYears: 12,
      liquidationYear: 13,
      landArea: 30000,
      landRentPrice: 0.8,
      fixedAssetValue: 250000,
      fixedAssetLife: 12,
      intangibleAssetValue: 20000,
      intangibleAssetLife: 8,
      designCapacity: 300000, // tấn hoặc pallet/năm
      capacitySchedule: [55, 70, 80, 88, 92, 94, 95, 95, 95, 95, 95, 95],
      inventoryRate: 3,
      basePrice: 0.9,
      realPriceChange: 1,
      componentCost: 0.42,
      electricityPackaging: 0.06,
      workers: 180,
      workerSalary: 9,
      engineers: 25,
      engineerSalary: 18,
      adminCost: 25000,
      maintenanceCostRate: 4,
      majorRepairCost: 15000,
      majorRepairInterval: 4,
      insuranceCostRate: 0.8,
      environmentalCost: 1500,
      arRate: 15,
      apRate: 10,
      debtRatio: 55,
      nominalInterestRate: 10.5,
      loanTerm: 8,
      realEquityReturn: 13,
      inflationRate: 4,
    },
    drivers: [
      { vi: "Tỷ lệ lấp đầy kho / hiệu suất đội xe", en: "Warehouse occupancy / fleet utilization" },
      { vi: "Chi phí nhiên liệu và vận hành", en: "Fuel & operating cost" },
      { vi: "Doanh thu trên mỗi m² kho", en: "Revenue per sqm of warehouse" },
    ],
    kpis: (p, r) => {
      const rev = avgRevenue(r);
      const occ = p.capacitySchedule.length ? sum(p.capacitySchedule) / p.capacitySchedule.length : 0;
      return [
        commonKpi("occ", "Tỷ lệ lấp đầy bình quân", "Average Occupancy", occ, "%", 85, true,
          "Σ công suất / n", "Mức khai thác kho bãi/đội xe.", "Utilization of warehouse or fleet."),
        commonKpi("revSqm", "Doanh thu / m² kho", "Revenue per sqm", rev / (p.landArea || 1), "money", 0.5, true,
          "Doanh thu / Diện tích kho", "Hiệu suất khai thác diện tích.", "Space productivity."),
        commonKpi("costRatio", "Chi phí vận hành / Doanh thu", "Opex Ratio", ((rev - avgEbit(r)) / (rev || 1)) * 100, "%", 80, false,
          "(Doanh thu − EBIT)/Doanh thu", "Tỷ trọng chi phí vận hành.", "Share of operating cost."),
        commonKpi("assetTurn", "Vòng quay tài sản", "Asset Turnover", r.assetTurnover, "x", 0.8, true,
          "Doanh thu / Tổng tài sản", "Hiệu quả sử dụng tài sản.", "Efficiency of asset usage."),
        commonKpi("dso", "Kỳ thu tiền (AR)", "AR Ratio", p.arRate, "%", 15, false,
          "AR / Doanh thu", "Vốn bị chiếm dụng bởi khách hàng.", "Working capital tied in receivables."),
      ];
    },
  },
  {
    key: "healthcare",
    nameVi: "Y tế / Bệnh viện",
    nameEn: "Healthcare",
    icon: "HeartPulse",
    color: "hsl(var(--quant-green))",
    descVi: "Bệnh viện, phòng khám, thiết bị y tế.",
    descEn: "Hospitals, clinics, medical equipment.",
    riskPremium: 7,
    preset: {
      projectName: "Dự án Y tế",
      operationYears: 15,
      liquidationYear: 16,
      landArea: 8000,
      landRentPrice: 2,
      fixedAssetValue: 350000,
      fixedAssetLife: 15,
      intangibleAssetValue: 40000,
      intangibleAssetLife: 10,
      designCapacity: 120000, // lượt khám/năm
      capacitySchedule: [40, 60, 72, 80, 85, 88, 90, 92, 92, 93, 93, 94, 94, 95, 95],
      inventoryRate: 5,
      basePrice: 1.2,
      realPriceChange: 2,
      componentCost: 0.45,
      electricityPackaging: 0.06,
      workers: 220,
      workerSalary: 14,
      engineers: 90,
      engineerSalary: 35,
      realSalaryIncrease: 7,
      adminCost: 60000,
      maintenanceCostRate: 5,
      majorRepairCost: 25000,
      majorRepairInterval: 5,
      insuranceCostRate: 1,
      environmentalCost: 4000,
      arRate: 18,
      apRate: 12,
      debtRatio: 50,
      nominalInterestRate: 10,
      loanTerm: 10,
      realEquityReturn: 14,
      inflationRate: 4,
    },
    drivers: [
      { vi: "Công suất giường/lượt khám", en: "Bed occupancy / patient volume" },
      { vi: "Chi phí nhân sự y tế chuyên môn", en: "Clinical staff cost" },
      { vi: "Thanh toán bảo hiểm và kỳ thu tiền", en: "Insurance reimbursement & DSO" },
    ],
    kpis: (p, r) => {
      const rev = avgRevenue(r);
      const staff = (p.workers * p.workerSalary + p.engineers * p.engineerSalary) * 12;
      const occ = p.capacitySchedule.length ? sum(p.capacitySchedule) / p.capacitySchedule.length : 0;
      return [
        commonKpi("occ", "Công suất khai thác", "Utilization Rate", occ, "%", 85, true,
          "Lượt khám thực / Công suất", "Mức lấp đầy giường bệnh và phòng khám.", "Bed and clinic occupancy."),
        commonKpi("staffRatio", "Chi phí nhân sự / Doanh thu", "Staff Cost Ratio", (staff / (rev || 1)) * 100, "%", 45, false,
          "Lương y bác sĩ / Doanh thu", "Ngành y tế thường 40–55%.", "Healthcare typically 40–55%."),
        commonKpi("revPatient", "Doanh thu / lượt khám", "Revenue per Case", p.basePrice, "money", 1, true,
          "Doanh thu / Số lượt", "Giá trị bình quân mỗi lượt điều trị.", "Average value per treatment."),
        commonKpi("dso", "Kỳ thu tiền bảo hiểm", "Insurance DSO", p.arRate, "%", 15, false,
          "AR / Doanh thu", "Chậm thanh toán bảo hiểm gây áp lực tiền mặt.", "Slow reimbursement pressures cash."),
        commonKpi("ebitdaM", "Biên EBITDA", "EBITDA Margin",
          ((avgEbit(r) + (r.yearlyData[1]?.depreciation ?? 0)) / (rev || 1)) * 100, "%", 20, true,
          "(EBIT + KH)/Doanh thu", "Khả năng sinh tiền trước khấu hao.", "Cash generation before depreciation."),
      ];
    },
  },
  {
    key: "agriculture",
    nameVi: "Nông nghiệp công nghệ cao",
    nameEn: "Agritech",
    icon: "Sprout",
    color: "hsl(var(--quant-green))",
    descVi: "Trang trại, chế biến nông sản, nhà kính.",
    descEn: "Farms, agro-processing, greenhouses.",
    riskPremium: 8,
    preset: {
      projectName: "Dự án Nông nghiệp công nghệ cao",
      operationYears: 10,
      liquidationYear: 11,
      landArea: 200000,
      landRentPrice: 0.02,
      fixedAssetValue: 120000,
      fixedAssetLife: 10,
      intangibleAssetValue: 15000,
      intangibleAssetLife: 8,
      designCapacity: 12000, // tấn/năm
      capacitySchedule: [45, 65, 78, 85, 90, 92, 93, 94, 95, 95],
      inventoryRate: 12,
      basePrice: 25,
      realPriceChange: -1,
      componentCost: 13,
      electricityPackaging: 1.8,
      workers: 200,
      workerSalary: 7,
      engineers: 20,
      engineerSalary: 16,
      adminCost: 14000,
      maintenanceCostRate: 3,
      majorRepairCost: 8000,
      majorRepairInterval: 4,
      insuranceCostRate: 1.2,
      environmentalCost: 2500,
      arRate: 10,
      apRate: 8,
      debtRatio: 55,
      nominalInterestRate: 9.5,
      loanTerm: 6,
      realEquityReturn: 14,
      inflationRate: 4,
    },
    drivers: [
      { vi: "Năng suất/ha và tỷ lệ hao hụt", en: "Yield per hectare & spoilage" },
      { vi: "Biến động giá nông sản", en: "Commodity price volatility" },
      { vi: "Rủi ro thời tiết và bảo hiểm mùa vụ", en: "Weather risk & crop insurance" },
    ],
    kpis: (p, r) => {
      const rev = avgRevenue(r);
      const ha = p.landArea / 10000;
      return [
        commonKpi("yieldHa", "Năng suất / ha", "Yield per Hectare", p.designCapacity / (ha || 1), "num", 40, true,
          "Sản lượng / Diện tích (ha)", "Năng suất canh tác trên mỗi hecta.", "Output per hectare."),
        commonKpi("revHa", "Doanh thu / ha", "Revenue per Hectare", rev / (ha || 1), "money", 500, true,
          "Doanh thu / ha", "Hiệu quả khai thác đất canh tác.", "Land productivity."),
        commonKpi("spoil", "Tỷ lệ hao hụt/tồn kho", "Spoilage / Inventory", p.inventoryRate, "%", 10, false,
          "Tồn kho / Sản lượng", "Nông sản dễ hỏng làm giảm biên lợi nhuận.", "Perishability erodes margin."),
        commonKpi("priceRisk", "Biến động giá thực", "Real Price Drift", p.realPriceChange, "%", 0, true,
          "Δ giá thực/năm", "Xu hướng giá nông sản thực tế.", "Real commodity price trend."),
        commonKpi("cv", "Hệ số biến thiên dòng tiền", "Cash Flow CV", r.coefficientOfVariation, "x", 0.5, false,
          "σ / μ dòng tiền", "Độ ổn định dòng tiền theo mùa vụ.", "Seasonal cash flow stability."),
      ];
    },
  },
];

export const getIndustryProfile = (key: IndustryKey) =>
  industryProfiles.find((p) => p.key === key) ?? industryProfiles[0];

/** Apply an industry preset on top of the default params */
export function applyIndustryPreset(key: IndustryKey): ProjectParams {
  const profile = getIndustryProfile(key);
  return { ...defaultProjectParams, ...profile.preset };
}

/** Suggested discount rate guidance for the industry */
export function industryHurdleRate(key: IndustryKey, wacc: number) {
  const profile = getIndustryProfile(key);
  return wacc * 100 + profile.riskPremium;
}
