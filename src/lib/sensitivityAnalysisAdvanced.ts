import { ProjectParams, ProjectResults } from "./projectModel";
import { calculateProject } from "./projectCalculator";

export type ResultVariable = 'npvTIPV' | 'irrTIPV' | 'dppTIPV' | 'dscrAverage' | 'npvEPV' | 'irrEPV' | 'dppEPV';

export interface SensitivityVariable {
  key: keyof ProjectParams;
  name: string;
  baseValue: number;
  minValue: number;
  maxValue: number;
  step: number;
  unit: string;
}

export interface OneDimensionalResult {
  variable: SensitivityVariable;
  values: number[];
  results: Record<ResultVariable, number[]>;
}

export interface TwoDimensionalResult {
  variable1: SensitivityVariable;
  variable2: SensitivityVariable;
  values1: number[];
  values2: number[];
  results: Record<ResultVariable, number[][]>;
}

export interface ScenarioDefinition {
  name: string;
  description: string;
  changes: Partial<Record<keyof ProjectParams, number>>;
}

export interface ScenarioResult {
  scenario: ScenarioDefinition;
  results: ProjectResults;
  comparison: {
    npvTIPV: { value: number; change: number; changePercent: number };
    irrTIPV: { value: number; change: number; changePercent: number };
    npvEPV: { value: number; change: number; changePercent: number };
    irrEPV: { value: number; change: number; changePercent: number };
  };
}

// Các biến rủi ro phổ biến
export const defaultRiskVariables: SensitivityVariable[] = [
  {
    key: 'basePrice',
    name: 'Giá bán máy tính',
    baseValue: 12,
    minValue: 10.5,
    maxValue: 13.5,
    step: 0.5,
    unit: 'triệu đồng',
  },
  {
    key: 'componentCost',
    name: 'Giá linh kiện',
    baseValue: 9,
    minValue: 7.8,
    maxValue: 10.2,
    step: 0.4,
    unit: 'triệu đồng',
  },
  {
    key: 'adminCost',
    name: 'Chi phí quản lý',
    baseValue: 15000,
    minValue: 13000,
    maxValue: 17000,
    step: 1000,
    unit: 'triệu đồng',
  },
  {
    key: 'arRate',
    name: 'Khoản phải thu',
    baseValue: 6,
    minValue: 5,
    maxValue: 7,
    step: 0.5,
    unit: '%',
  },
  {
    key: 'apRate',
    name: 'Khoản phải trả',
    baseValue: 5,
    minValue: 4,
    maxValue: 6,
    step: 0.5,
    unit: '%',
  },
  {
    key: 'inflationRate',
    name: 'Tỷ lệ lạm phát',
    baseValue: 5,
    minValue: 4,
    maxValue: 6,
    step: 0.5,
    unit: '%',
  },
];

// Các kịch bản mặc định
export const defaultScenarios: ScenarioDefinition[] = [
  {
    name: 'Trung bình',
    description: 'Kịch bản cơ sở với các giá trị mặc định',
    changes: {},
  },
  {
    name: 'Tốt',
    description: 'Giá bán cao, chi phí thấp, lạm phát thấp',
    changes: {
      basePrice: 13,
      componentCost: 8.5,
      adminCost: 13000,
      arRate: 5,
      apRate: 6,
      inflationRate: 4,
    },
  },
  {
    name: 'Xấu',
    description: 'Giá bán thấp, chi phí cao, lạm phát cao',
    changes: {
      basePrice: 11,
      componentCost: 9.5,
      adminCost: 17000,
      arRate: 7,
      apRate: 4,
      inflationRate: 6,
    },
  },
];

// Phân tích độ nhạy 1 chiều
export function runOneDimensionalSensitivity(
  baseParams: ProjectParams,
  variable: SensitivityVariable,
  resultVariables: ResultVariable[] = ['npvTIPV', 'irrTIPV', 'npvEPV', 'irrEPV']
): OneDimensionalResult {
  const values: number[] = [];
  const results: Record<ResultVariable, number[]> = {
    npvTIPV: [],
    irrTIPV: [],
    dppTIPV: [],
    dscrAverage: [],
    npvEPV: [],
    irrEPV: [],
    dppEPV: [],
  };
  
  // Tạo các giá trị test
  for (let val = variable.minValue; val <= variable.maxValue; val += variable.step) {
    values.push(val);
  }
  
  // Tính kết quả cho từng giá trị
  for (const val of values) {
    const testParams = { ...baseParams, [variable.key]: val } as ProjectParams;
    const projectResults = calculateProject(testParams);
    
    for (const rv of resultVariables) {
      results[rv].push(projectResults[rv]);
    }
  }
  
  return { variable, values, results };
}

// Phân tích độ nhạy 2 chiều
export function runTwoDimensionalSensitivity(
  baseParams: ProjectParams,
  variable1: SensitivityVariable,
  variable2: SensitivityVariable,
  resultVariable: ResultVariable = 'npvTIPV'
): TwoDimensionalResult {
  const values1: number[] = [];
  const values2: number[] = [];
  
  for (let val = variable1.minValue; val <= variable1.maxValue; val += variable1.step) {
    values1.push(val);
  }
  for (let val = variable2.minValue; val <= variable2.maxValue; val += variable2.step) {
    values2.push(val);
  }
  
  const results: Record<ResultVariable, number[][]> = {
    npvTIPV: [],
    irrTIPV: [],
    dppTIPV: [],
    dscrAverage: [],
    npvEPV: [],
    irrEPV: [],
    dppEPV: [],
  };
  
  // Khởi tạo ma trận
  for (let i = 0; i < values2.length; i++) {
    results[resultVariable].push([]);
  }
  
  // Tính kết quả cho từng cặp giá trị
  for (let i = 0; i < values2.length; i++) {
    for (let j = 0; j < values1.length; j++) {
      const testParams = {
        ...baseParams,
        [variable1.key]: values1[j],
        [variable2.key]: values2[i],
      } as ProjectParams;
      const projectResults = calculateProject(testParams);
      results[resultVariable][i].push(projectResults[resultVariable]);
    }
  }
  
  return { variable1, variable2, values1, values2, results };
}

// Phân tích kịch bản
export function runScenarioAnalysis(
  baseParams: ProjectParams,
  scenarios: ScenarioDefinition[]
): ScenarioResult[] {
  const baseResults = calculateProject(baseParams);
  const results: ScenarioResult[] = [];
  
  for (const scenario of scenarios) {
    const scenarioParams = { ...baseParams, ...scenario.changes } as ProjectParams;
    const scenarioResults = calculateProject(scenarioParams);
    
    results.push({
      scenario,
      results: scenarioResults,
      comparison: {
        npvTIPV: {
          value: scenarioResults.npvTIPV,
          change: scenarioResults.npvTIPV - baseResults.npvTIPV,
          changePercent: baseResults.npvTIPV !== 0 ? 
            ((scenarioResults.npvTIPV - baseResults.npvTIPV) / Math.abs(baseResults.npvTIPV)) * 100 : 0,
        },
        irrTIPV: {
          value: scenarioResults.irrTIPV,
          change: scenarioResults.irrTIPV - baseResults.irrTIPV,
          changePercent: baseResults.irrTIPV !== 0 ?
            ((scenarioResults.irrTIPV - baseResults.irrTIPV) / Math.abs(baseResults.irrTIPV)) * 100 : 0,
        },
        npvEPV: {
          value: scenarioResults.npvEPV,
          change: scenarioResults.npvEPV - baseResults.npvEPV,
          changePercent: baseResults.npvEPV !== 0 ?
            ((scenarioResults.npvEPV - baseResults.npvEPV) / Math.abs(baseResults.npvEPV)) * 100 : 0,
        },
        irrEPV: {
          value: scenarioResults.irrEPV,
          change: scenarioResults.irrEPV - baseResults.irrEPV,
          changePercent: baseResults.irrEPV !== 0 ?
            ((scenarioResults.irrEPV - baseResults.irrEPV) / Math.abs(baseResults.irrEPV)) * 100 : 0,
        },
      },
    });
  }
  
  return results;
}

// Xác định biến có ảnh hưởng nhiều nhất (Tornado Chart data)
export interface TornadoData {
  variable: string;
  lowValue: number;
  highValue: number;
  baseValue: number;
  range: number;
}

export function calculateTornadoData(
  baseParams: ProjectParams,
  variables: SensitivityVariable[],
  resultVariable: ResultVariable = 'npvTIPV'
): TornadoData[] {
  const baseResults = calculateProject(baseParams);
  const baseValue = baseResults[resultVariable];
  
  const tornadoData: TornadoData[] = [];
  
  for (const variable of variables) {
    // Tính với giá trị thấp
    const lowParams = { ...baseParams, [variable.key]: variable.minValue } as ProjectParams;
    const lowResults = calculateProject(lowParams);
    const lowValue = lowResults[resultVariable];
    
    // Tính với giá trị cao
    const highParams = { ...baseParams, [variable.key]: variable.maxValue } as ProjectParams;
    const highResults = calculateProject(highParams);
    const highValue = highResults[resultVariable];
    
    tornadoData.push({
      variable: variable.name,
      lowValue: Math.min(lowValue, highValue),
      highValue: Math.max(lowValue, highValue),
      baseValue,
      range: Math.abs(highValue - lowValue),
    });
  }
  
  // Sắp xếp theo range giảm dần
  tornadoData.sort((a, b) => b.range - a.range);
  
  return tornadoData;
}
