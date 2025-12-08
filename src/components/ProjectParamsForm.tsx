import { useState } from "react";
import { motion } from "framer-motion";
import { SimulationCard } from "./SimulationCard";
import { ProjectParams, defaultProjectParams } from "@/lib/projectModel";
import { 
  Building2, 
  Factory, 
  Users, 
  Banknote, 
  TrendingUp, 
  Calculator,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ProjectParamsFormProps {
  params: ProjectParams;
  onParamsChange: (params: ProjectParams) => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Section = ({ title, icon, isOpen, onToggle, children }: SectionProps) => (
  <div className="border border-border/50 rounded-lg overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium">{title}</span>
      </div>
      {isOpen ? (
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
    {isOpen && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        className="p-4 space-y-4"
      >
        {children}
      </motion.div>
    )}
  </div>
);

interface InputFieldProps {
  label: string;
  value: number | string;
  onChange: (value: number | string) => void;
  type?: "number" | "text";
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}

const InputField = ({ label, value, onChange, type = "number", unit, min, max, step = 1 }: InputFieldProps) => (
  <div className="space-y-1">
    <label className="text-sm text-muted-foreground">
      {label} {unit && <span className="text-xs">({unit})</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
      min={min}
      max={max}
      step={step}
      className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-mono"
    />
  </div>
);

export const ProjectParamsForm = ({ params, onParamsChange }: ProjectParamsFormProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    land: false,
    assets: false,
    production: false,
    costs: false,
    financing: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateParam = <K extends keyof ProjectParams>(key: K, value: ProjectParams[K]) => {
    onParamsChange({ ...params, [key]: value });
  };

  const updateCapacitySchedule = (index: number, value: number) => {
    const newSchedule = [...params.capacitySchedule];
    newSchedule[index] = value;
    onParamsChange({ ...params, capacitySchedule: newSchedule });
  };

  return (
    <SimulationCard className="h-fit">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Thông số dự án</h3>
      </div>

      <div className="space-y-3">
        {/* Thông tin cơ bản */}
        <Section
          title="Thông tin cơ bản"
          icon={<Building2 className="w-4 h-4 text-primary" />}
          isOpen={openSections.basic}
          onToggle={() => toggleSection("basic")}
        >
          <InputField
            label="Tên dự án"
            value={params.projectName}
            onChange={(v) => updateParam("projectName", String(v))}
            type="text"
          />
          <div className="grid grid-cols-3 gap-3">
            <InputField
              label="Năm đầu tư"
              value={params.investmentYear}
              onChange={(v) => updateParam("investmentYear", Number(v))}
            />
            <InputField
              label="Số năm hoạt động"
              value={params.operationYears}
              onChange={(v) => updateParam("operationYears", Number(v))}
            />
            <InputField
              label="Năm thanh lý"
              value={params.liquidationYear}
              onChange={(v) => updateParam("liquidationYear", Number(v))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Tỷ lệ lạm phát"
              value={params.inflationRate}
              onChange={(v) => updateParam("inflationRate", Number(v))}
              unit="%/năm"
              step={0.5}
            />
            <InputField
              label="Thuế TNDN"
              value={params.corporateTaxRate}
              onChange={(v) => updateParam("corporateTaxRate", Number(v))}
              unit="%"
            />
          </div>
        </Section>

        {/* Đất đai */}
        <Section
          title="Đất đai"
          icon={<Building2 className="w-4 h-4 text-green-500" />}
          isOpen={openSections.land}
          onToggle={() => toggleSection("land")}
        >
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Diện tích"
              value={params.landArea}
              onChange={(v) => updateParam("landArea", Number(v))}
              unit="m²"
            />
            <InputField
              label="Đơn giá thuê"
              value={params.landRentPrice}
              onChange={(v) => updateParam("landRentPrice", Number(v))}
              unit="triệu/m²/năm"
              step={0.01}
            />
          </div>
          <InputField
            label="Chu kỳ điều chỉnh giá"
            value={params.landRentAdjustmentYears}
            onChange={(v) => updateParam("landRentAdjustmentYears", Number(v))}
            unit="năm"
          />
        </Section>

        {/* Tài sản */}
        <Section
          title="Tài sản cố định"
          icon={<Factory className="w-4 h-4 text-blue-500" />}
          isOpen={openSections.assets}
          onToggle={() => toggleSection("assets")}
        >
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Giá trị TSCĐ hữu hình"
              value={params.fixedAssetValue}
              onChange={(v) => updateParam("fixedAssetValue", Number(v))}
              unit="triệu đồng"
            />
            <InputField
              label="Đời sống kinh tế"
              value={params.fixedAssetLife}
              onChange={(v) => updateParam("fixedAssetLife", Number(v))}
              unit="năm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Giá trị TSCĐ vô hình"
              value={params.intangibleAssetValue}
              onChange={(v) => updateParam("intangibleAssetValue", Number(v))}
              unit="triệu đồng"
            />
            <InputField
              label="Số năm phân bổ"
              value={params.intangibleAssetLife}
              onChange={(v) => updateParam("intangibleAssetLife", Number(v))}
              unit="năm"
            />
          </div>
        </Section>

        {/* Sản xuất */}
        <Section
          title="Sản xuất & Bán hàng"
          icon={<TrendingUp className="w-4 h-4 text-orange-500" />}
          isOpen={openSections.production}
          onToggle={() => toggleSection("production")}
        >
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Công suất thiết kế"
              value={params.designCapacity}
              onChange={(v) => updateParam("designCapacity", Number(v))}
              unit="sản phẩm/năm"
            />
            <InputField
              label="Tỷ lệ tồn kho"
              value={params.inventoryRate}
              onChange={(v) => updateParam("inventoryRate", Number(v))}
              unit="%"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Tỷ lệ công suất theo năm (%)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {params.capacitySchedule.map((cap, idx) => (
                <input
                  key={idx}
                  type="number"
                  value={cap}
                  onChange={(e) => updateCapacitySchedule(idx, parseFloat(e.target.value) || 0)}
                  className="h-9 px-2 rounded-lg bg-muted/50 border border-border focus:border-primary outline-none text-sm font-mono text-center"
                  min={0}
                  max={100}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Giá bán (năm 0)"
              value={params.basePrice}
              onChange={(v) => updateParam("basePrice", Number(v))}
              unit="triệu/SP"
              step={0.5}
            />
            <InputField
              label="Thay đổi giá thực"
              value={params.realPriceChange}
              onChange={(v) => updateParam("realPriceChange", Number(v))}
              unit="%/năm"
              step={0.5}
            />
          </div>
        </Section>

        {/* Chi phí */}
        <Section
          title="Chi phí sản xuất"
          icon={<Users className="w-4 h-4 text-purple-500" />}
          isOpen={openSections.costs}
          onToggle={() => toggleSection("costs")}
        >
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Chi phí linh kiện"
              value={params.componentCost}
              onChange={(v) => updateParam("componentCost", Number(v))}
              unit="triệu/SP"
              step={0.5}
            />
            <InputField
              label="Điện & bao bì"
              value={params.electricityPackaging}
              onChange={(v) => updateParam("electricityPackaging", Number(v))}
              unit="triệu/SP"
              step={0.1}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Số công nhân"
              value={params.workers}
              onChange={(v) => updateParam("workers", Number(v))}
            />
            <InputField
              label="Lương công nhân"
              value={params.workerSalary}
              onChange={(v) => updateParam("workerSalary", Number(v))}
              unit="triệu/tháng"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Số kỹ sư"
              value={params.engineers}
              onChange={(v) => updateParam("engineers", Number(v))}
            />
            <InputField
              label="Lương kỹ sư"
              value={params.engineerSalary}
              onChange={(v) => updateParam("engineerSalary", Number(v))}
              unit="triệu/tháng"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Tăng lương thực"
              value={params.realSalaryIncrease}
              onChange={(v) => updateParam("realSalaryIncrease", Number(v))}
              unit="%/năm"
            />
            <InputField
              label="Chi phí quản lý"
              value={params.adminCost}
              onChange={(v) => updateParam("adminCost", Number(v))}
              unit="triệu/năm"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <InputField
              label="Khoản phải thu"
              value={params.arRate}
              onChange={(v) => updateParam("arRate", Number(v))}
              unit="% DT"
            />
            <InputField
              label="Khoản phải trả"
              value={params.apRate}
              onChange={(v) => updateParam("apRate", Number(v))}
              unit="% LK"
            />
            <InputField
              label="Số dư tiền mặt"
              value={params.cashBalanceRate}
              onChange={(v) => updateParam("cashBalanceRate", Number(v))}
              unit="% DT"
              step={0.1}
            />
          </div>
        </Section>

        {/* Tài trợ vốn */}
        <Section
          title="Tài trợ vốn"
          icon={<Banknote className="w-4 h-4 text-yellow-500" />}
          isOpen={openSections.financing}
          onToggle={() => toggleSection("financing")}
        >
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Tỷ lệ vay"
              value={params.debtRatio}
              onChange={(v) => updateParam("debtRatio", Number(v))}
              unit="% TSCĐ HH"
            />
            <InputField
              label="Lãi suất danh nghĩa"
              value={params.nominalInterestRate}
              onChange={(v) => updateParam("nominalInterestRate", Number(v))}
              unit="%/năm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Kỳ hạn vay"
              value={params.loanTerm}
              onChange={(v) => updateParam("loanTerm", Number(v))}
              unit="năm"
            />
            <InputField
              label="Suất sinh lời VCS (thực)"
              value={params.realEquityReturn}
              onChange={(v) => updateParam("realEquityReturn", Number(v))}
              unit="%/năm"
            />
          </div>
        </Section>
      </div>
    </SimulationCard>
  );
};
