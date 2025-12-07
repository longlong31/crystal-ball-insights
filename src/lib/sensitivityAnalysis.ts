import { DistributionParams, generateRandom } from './distributions';

export interface SensitivityVariable {
  id: string;
  name: string;
  baseValue: number;
  distribution: DistributionParams;
}

export interface SensitivityResult {
  variableId: string;
  variableName: string;
  correlation: number;
  contribution: number; // Percentage contribution to variance
  rank: number;
}

// Run sensitivity analysis using correlation method
export function runSensitivityAnalysis(
  variables: SensitivityVariable[],
  outputFormula: (values: Record<string, number>) => number,
  iterations: number = 5000
): SensitivityResult[] {
  if (variables.length === 0) return [];

  // Generate samples for each variable
  const samples: Record<string, number[]> = {};
  variables.forEach((v) => {
    samples[v.id] = [];
    for (let i = 0; i < iterations; i++) {
      samples[v.id].push(generateRandom(v.distribution));
    }
  });

  // Calculate output for each iteration
  const outputs: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const values: Record<string, number> = {};
    variables.forEach((v) => {
      values[v.id] = samples[v.id][i];
    });
    outputs.push(outputFormula(values));
  }

  // Calculate correlation for each variable with output
  const correlations: { id: string; name: string; corr: number }[] = [];
  
  variables.forEach((v) => {
    const corr = calculateCorrelation(samples[v.id], outputs);
    correlations.push({
      id: v.id,
      name: v.name,
      corr: corr
    });
  });

  // Calculate contribution (squared correlation / sum of squared correlations)
  const sumSquaredCorr = correlations.reduce((sum, c) => sum + c.corr * c.corr, 0);
  
  // Sort by absolute correlation (descending)
  const sorted = [...correlations].sort((a, b) => 
    Math.abs(b.corr) - Math.abs(a.corr)
  );

  // Build results
  return sorted.map((c, index) => ({
    variableId: c.id,
    variableName: c.name,
    correlation: c.corr,
    contribution: sumSquaredCorr > 0 ? (c.corr * c.corr / sumSquaredCorr) * 100 : 0,
    rank: index + 1
  }));
}

// Pearson correlation coefficient
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? 0 : numerator / denom;
}

// Tornado chart data (one-way sensitivity)
export interface TornadoData {
  variableId: string;
  variableName: string;
  lowValue: number;
  highValue: number;
  baseOutput: number;
  lowOutput: number;
  highOutput: number;
  swing: number;
}

export function calculateTornadoData(
  variables: SensitivityVariable[],
  outputFormula: (values: Record<string, number>) => number,
  percentChange: number = 10
): TornadoData[] {
  // Calculate base output
  const baseValues: Record<string, number> = {};
  variables.forEach((v) => {
    baseValues[v.id] = v.baseValue;
  });
  const baseOutput = outputFormula(baseValues);

  const results: TornadoData[] = [];

  variables.forEach((v) => {
    const lowValue = v.baseValue * (1 - percentChange / 100);
    const highValue = v.baseValue * (1 + percentChange / 100);

    // Calculate output with low value
    const lowValues = { ...baseValues, [v.id]: lowValue };
    const lowOutput = outputFormula(lowValues);

    // Calculate output with high value
    const highValues = { ...baseValues, [v.id]: highValue };
    const highOutput = outputFormula(highValues);

    const swing = Math.abs(highOutput - lowOutput);

    results.push({
      variableId: v.id,
      variableName: v.name,
      lowValue,
      highValue,
      baseOutput,
      lowOutput,
      highOutput,
      swing
    });
  });

  // Sort by swing (descending)
  return results.sort((a, b) => b.swing - a.swing);
}
