// Portfolio Optimization Engine

import { calculateVolatility, calculateSharpeRatio, calculateMaxDrawdown, calculateVaR, calculateCVaR, calculateCorrelationMatrix } from './technicalIndicators';

export interface PortfolioAsset {
  symbol: string;
  name: string;
  weight: number;
  returns: number[];
  expectedReturn: number;
  volatility: number;
  prices: number[];
}

export interface PortfolioMetrics {
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  var95: number;
  cvar95: number;
  sortino: number;
  calmar: number;
  beta: number;
}

export interface EfficientFrontierPoint {
  risk: number;
  return_: number;
  weights: number[];
  sharpe: number;
}

export function calculatePortfolioMetrics(assets: PortfolioAsset[]): PortfolioMetrics {
  const n = Math.min(...assets.map(a => a.returns.length));
  const portfolioReturns: number[] = [];

  for (let i = 0; i < n; i++) {
    let ret = 0;
    for (const asset of assets) {
      ret += asset.weight * (asset.returns[i] || 0);
    }
    portfolioReturns.push(ret);
  }

  const expectedReturn = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length * 252;
  const vol = calculateVolatility(portfolioReturns);
  const sharpe = calculateSharpeRatio(portfolioReturns);
  const maxDD = calculateMaxDrawdown(assets[0]?.prices || [100]);
  const var95 = calculateVaR(portfolioReturns);
  const cvar95 = calculateCVaR(portfolioReturns);

  // Sortino
  const downReturns = portfolioReturns.filter(r => r < 0);
  const downDev = downReturns.length > 0
    ? Math.sqrt(downReturns.reduce((a, b) => a + b ** 2, 0) / downReturns.length) * Math.sqrt(252)
    : 0.01;
  const sortino = downDev === 0 ? 0 : (expectedReturn - 0.04) / downDev;
  const calmar = maxDD === 0 ? 0 : expectedReturn / maxDD;

  return {
    expectedReturn,
    volatility: vol,
    sharpeRatio: sharpe,
    maxDrawdown: maxDD,
    var95: var95 * Math.sqrt(252),
    cvar95: cvar95 * Math.sqrt(252),
    sortino,
    calmar,
    beta: 1.0,
  };
}

export function generateEfficientFrontier(assets: PortfolioAsset[], points: number = 50): EfficientFrontierPoint[] {
  const frontier: EfficientFrontierPoint[] = [];
  const n = assets.length;

  for (let i = 0; i < points; i++) {
    // Random weights
    const rawWeights = Array.from({ length: n }, () => Math.random());
    const sum = rawWeights.reduce((a, b) => a + b, 0);
    const weights = rawWeights.map(w => w / sum);

    const modifiedAssets = assets.map((a, idx) => ({ ...a, weight: weights[idx] }));
    const metrics = calculatePortfolioMetrics(modifiedAssets);

    frontier.push({
      risk: metrics.volatility,
      return_: metrics.expectedReturn,
      weights,
      sharpe: metrics.sharpeRatio,
    });
  }

  return frontier.sort((a, b) => a.risk - b.risk);
}

export function monteCarloPortfolio(
  assets: PortfolioAsset[],
  iterations: number = 5000,
  days: number = 252
): { finalValues: number[]; paths: number[][] } {
  const initialValue = 100000;
  const finalValues: number[] = [];
  const paths: number[][] = [];

  for (let sim = 0; sim < iterations; sim++) {
    let value = initialValue;
    const path = [value];

    for (let day = 0; day < days; day++) {
      let dailyReturn = 0;
      for (const asset of assets) {
        const mean = asset.expectedReturn / 252;
        const vol = asset.volatility / Math.sqrt(252);
        const z = boxMuller();
        dailyReturn += asset.weight * (mean + vol * z);
      }
      value *= (1 + dailyReturn);
      if (sim < 100) path.push(value); // Only save first 100 paths for visualization
    }

    finalValues.push(value);
    if (sim < 100) paths.push(path);
  }

  return { finalValues, paths };
}

function boxMuller(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function detectRegimeShift(returns: number[], windowSize: number = 60): { date: number; type: 'bull' | 'bear' | 'high_vol' | 'low_vol'; confidence: number }[] {
  const shifts: { date: number; type: 'bull' | 'bear' | 'high_vol' | 'low_vol'; confidence: number }[] = [];

  for (let i = windowSize; i < returns.length - windowSize; i++) {
    const before = returns.slice(i - windowSize, i);
    const after = returns.slice(i, i + windowSize);

    const meanBefore = before.reduce((a, b) => a + b, 0) / before.length;
    const meanAfter = after.reduce((a, b) => a + b, 0) / after.length;
    const volBefore = Math.sqrt(before.reduce((a, b) => a + (b - meanBefore) ** 2, 0) / before.length);
    const volAfter = Math.sqrt(after.reduce((a, b) => a + (b - meanAfter) ** 2, 0) / after.length);

    const meanShift = Math.abs(meanAfter - meanBefore);
    const volShift = Math.abs(volAfter - volBefore);

    if (meanShift > volBefore * 1.5) {
      shifts.push({
        date: i,
        type: meanAfter > meanBefore ? 'bull' : 'bear',
        confidence: Math.min(meanShift / (volBefore * 2), 1),
      });
    }

    if (volShift > volBefore * 0.8) {
      shifts.push({
        date: i,
        type: volAfter > volBefore ? 'high_vol' : 'low_vol',
        confidence: Math.min(volShift / (volBefore * 1.5), 1),
      });
    }
  }

  return shifts;
}
