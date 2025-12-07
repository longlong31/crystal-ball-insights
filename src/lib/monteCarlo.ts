// Triangular distribution for Monte Carlo simulation
export function triangularRandom(min: number, mode: number, max: number): number {
  const u = Math.random();
  const fc = (mode - min) / (max - min);
  
  if (u < fc) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
}

export function runMonteCarloSimulation(
  minValue: number,
  maxValue: number,
  mostLikely: number,
  iterations: number
): number[] {
  const results: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    results.push(triangularRandom(minValue, mostLikely, maxValue));
  }
  
  return results;
}

export function calculateStatistics(data: number[]) {
  if (data.length === 0) {
    return {
      mean: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      percentile5: 0,
      percentile25: 0,
      percentile50: 0,
      percentile75: 0,
      percentile95: 0,
    };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  
  const mean = data.reduce((sum, val) => sum + val, 0) / n;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  const percentile = (p: number) => {
    const index = Math.floor((p / 100) * n);
    return sorted[Math.min(index, n - 1)];
  };

  return {
    mean,
    stdDev,
    min: sorted[0],
    max: sorted[n - 1],
    percentile5: percentile(5),
    percentile25: percentile(25),
    percentile50: percentile(50),
    percentile75: percentile(75),
    percentile95: percentile(95),
  };
}

export function calculateProbability(data: number[], threshold: number, above: boolean = true): number {
  if (data.length === 0) return 0;
  
  const count = data.filter((val) => (above ? val >= threshold : val <= threshold)).length;
  return (count / data.length) * 100;
}
