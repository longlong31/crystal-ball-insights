import { ProjectParams, ProjectResults } from "./projectModel";
import { calculateProject } from "./projectCalculator";
import { SensitivityVariable, ResultVariable } from "./sensitivityAnalysisAdvanced";
import { generateRandom, DistributionType, DistributionParams } from "./distributions";

export interface MonteCarloVariable {
  key: keyof ProjectParams;
  name: string;
  distribution: DistributionType;
  params: Record<string, number>;
}

export interface MonteCarloConfig {
  iterations: number;
  variables: MonteCarloVariable[];
  resultVariables: ResultVariable[];
}

export interface MonteCarloResult {
  iterations: number;
  variables: MonteCarloVariable[];
  results: Record<ResultVariable, MonteCarloResultData>;
  correlations: CorrelationMatrix;
  convergenceData: ConvergenceData[];
}

export interface MonteCarloResultData {
  values: number[];
  statistics: {
    min: number;
    max: number;
    mean: number;
    stdDev: number;
    median: number;
    percentile5: number;
    percentile10: number;
    percentile25: number;
    percentile75: number;
    percentile90: number;
    percentile95: number;
    skewness: number;
    kurtosis: number;
    // VaR và CVaR
    var95: number; // Value at Risk tại 95%
    var99: number; // Value at Risk tại 99%
    cvar95: number; // Conditional VaR tại 95%
    cvar99: number; // Conditional VaR tại 99%
  };
  histogram: { bin: number; count: number; frequency: number }[];
  cdf: { value: number; probability: number }[];
}

export interface CorrelationMatrix {
  variables: string[];
  resultVariable: string;
  coefficients: Record<string, number>;
  contributions: Record<string, number>;
}

export interface ConvergenceData {
  iteration: number;
  mean: number;
  stdDev: number;
}

// Tạo cấu hình Monte Carlo mặc định từ các biến rủi ro
export function createDefaultMonteCarloConfig(
  variables: SensitivityVariable[]
): MonteCarloConfig {
  const mcVariables: MonteCarloVariable[] = variables.map((v) => ({
    key: v.key,
    name: v.name,
    distribution: 'triangular' as DistributionType,
    params: {
      min: v.minValue,
      mode: v.baseValue,
      max: v.maxValue,
    },
  }));

  return {
    iterations: 10000,
    variables: mcVariables,
    resultVariables: ['npvTIPV', 'irrTIPV', 'npvEPV', 'irrEPV'],
  };
}

// Chạy mô phỏng Monte Carlo
export function runMonteCarloSimulation(
  baseParams: ProjectParams,
  config: MonteCarloConfig
): MonteCarloResult {
  const { iterations, variables, resultVariables } = config;

  // Khởi tạo kết quả
  const results: Record<ResultVariable, number[]> = {
    npvTIPV: [],
    irrTIPV: [],
    dppTIPV: [],
    dscrAverage: [],
    npvEPV: [],
    irrEPV: [],
    dppEPV: [],
  };

  // Lưu giá trị input cho tính tương quan
  const inputValues: Record<string, number[]> = {};
  for (const v of variables) {
    inputValues[v.key] = [];
  }

  const convergenceData: ConvergenceData[] = [];
  let runningSum = 0;
  let runningSumSq = 0;

  // Chạy mô phỏng
  for (let i = 0; i < iterations; i++) {
    // Tạo giá trị ngẫu nhiên cho các biến
    const testParams = { ...baseParams };

    for (const v of variables) {
      const distParams: DistributionParams = {
        type: v.distribution,
        ...v.params,
      };
      const randomValue = generateRandom(distParams);
      (testParams as Record<string, unknown>)[v.key] = randomValue;
      inputValues[v.key].push(randomValue);
    }

    // Tính kết quả dự án
    const projectResults = calculateProject(testParams);

    for (const rv of resultVariables) {
      results[rv].push(projectResults[rv]);
    }

    // Theo dõi hội tụ (cho NPV TIPV)
    const npvValue = projectResults.npvTIPV;
    runningSum += npvValue;
    runningSumSq += npvValue * npvValue;

    if ((i + 1) % 100 === 0 || i === iterations - 1) {
      const n = i + 1;
      const mean = runningSum / n;
      const variance = runningSumSq / n - mean * mean;
      const stdDev = Math.sqrt(Math.max(0, variance));
      convergenceData.push({ iteration: n, mean, stdDev });
    }
  }

  // Tính thống kê và histogram cho từng biến kết quả
  const processedResults: Record<ResultVariable, MonteCarloResultData> = {} as Record<
    ResultVariable,
    MonteCarloResultData
  >;

  for (const rv of resultVariables) {
    processedResults[rv] = calculateResultStatistics(results[rv]);
  }

  // Tính ma trận tương quan
  const correlations = calculateCorrelations(inputValues, results.npvTIPV, variables);

  return {
    iterations,
    variables,
    results: processedResults,
    correlations,
    convergenceData,
  };
}

function calculateResultStatistics(values: number[]): MonteCarloResultData {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  // Thống kê cơ bản
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  // Percentiles
  const percentile = (p: number) => sorted[Math.floor((p / 100) * n)] || 0;

  // Skewness và Kurtosis
  const m3 = values.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 3), 0) / n;
  const m4 = values.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 4), 0) / n;
  const skewness = stdDev > 0 ? m3 : 0;
  const kurtosis = stdDev > 0 ? m4 - 3 : 0;

  // VaR (Value at Risk) - mức tổn thất tối đa tại mức tin cậy
  // VaR 95%: 5% xác suất thua lỗ vượt mức này
  const var95Index = Math.floor(0.05 * n);
  const var99Index = Math.floor(0.01 * n);
  const var95 = sorted[var95Index] || sorted[0];
  const var99 = sorted[var99Index] || sorted[0];

  // CVaR (Conditional VaR / Expected Shortfall) - trung bình tổn thất trong 5%/1% tệ nhất
  const cvar95 = sorted.slice(0, var95Index + 1).reduce((a, b) => a + b, 0) / (var95Index + 1) || var95;
  const cvar99 = sorted.slice(0, var99Index + 1).reduce((a, b) => a + b, 0) / (var99Index + 1) || var99;

  // Histogram
  const binCount = 30;
  const min = sorted[0];
  const max = sorted[n - 1];
  const binWidth = (max - min) / binCount || 1;
  const histogram: { bin: number; count: number; frequency: number }[] = [];

  for (let i = 0; i < binCount; i++) {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    const count = values.filter((v) => v >= binStart && v < binEnd).length;
    histogram.push({
      bin: binStart + binWidth / 2,
      count,
      frequency: count / n,
    });
  }

  // CDF
  const cdf: { value: number; probability: number }[] = [];
  for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 100))) {
    cdf.push({
      value: sorted[i],
      probability: (i + 1) / n,
    });
  }

  return {
    values,
    statistics: {
      min: sorted[0],
      max: sorted[n - 1],
      mean,
      stdDev,
      median: percentile(50),
      percentile5: percentile(5),
      percentile10: percentile(10),
      percentile25: percentile(25),
      percentile75: percentile(75),
      percentile90: percentile(90),
      percentile95: percentile(95),
      skewness,
      kurtosis,
      var95,
      var99,
      cvar95,
      cvar99,
    },
    histogram,
    cdf,
  };
}

function calculateCorrelations(
  inputValues: Record<string, number[]>,
  outputValues: number[],
  variables: MonteCarloVariable[]
): CorrelationMatrix {
  const n = outputValues.length;
  const outputMean = outputValues.reduce((a, b) => a + b, 0) / n;
  const outputStdDev = Math.sqrt(
    outputValues.reduce((sum, v) => sum + (v - outputMean) ** 2, 0) / n
  );

  const coefficients: Record<string, number> = {};
  let totalR2 = 0;

  for (const v of variables) {
    const inputVals = inputValues[v.key];
    const inputMean = inputVals.reduce((a, b) => a + b, 0) / n;
    const inputStdDev = Math.sqrt(
      inputVals.reduce((sum, val) => sum + (val - inputMean) ** 2, 0) / n
    );

    if (inputStdDev > 0 && outputStdDev > 0) {
      const covariance =
        inputVals.reduce((sum, val, i) => sum + (val - inputMean) * (outputValues[i] - outputMean), 0) / n;
      const correlation = covariance / (inputStdDev * outputStdDev);
      coefficients[v.key] = correlation;
      totalR2 += correlation ** 2;
    } else {
      coefficients[v.key] = 0;
    }
  }

  // Contribution to variance
  const contributions: Record<string, number> = {};
  for (const v of variables) {
    const r2 = coefficients[v.key] ** 2;
    contributions[v.key] = totalR2 > 0 ? (r2 / totalR2) * 100 : 0;
  }

  return {
    variables: variables.map((v) => v.name),
    resultVariable: 'NPV (TIPV)',
    coefficients,
    contributions,
  };
}

// Tính xác suất đạt ngưỡng
export function calculateProbability(
  values: number[],
  threshold: number,
  above: boolean = true
): number {
  const count = values.filter((v) => (above ? v >= threshold : v <= threshold)).length;
  return (count / values.length) * 100;
}

// Tìm giá trị tại percentile
export function getValueAtPercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((percentile / 100) * sorted.length);
  return sorted[Math.min(index, sorted.length - 1)];
}
