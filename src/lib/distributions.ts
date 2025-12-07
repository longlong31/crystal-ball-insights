// Distribution types
export type DistributionType = 'triangular' | 'normal' | 'lognormal' | 'uniform' | 'beta';

export interface DistributionParams {
  type: DistributionType;
  // Common params
  min?: number;
  max?: number;
  // Triangular
  mode?: number;
  // Normal & Lognormal
  mean?: number;
  stdDev?: number;
  // Beta
  alpha?: number;
  beta?: number;
}

// Box-Muller transform for normal distribution
function boxMuller(): [number, number] {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const mag = Math.sqrt(-2.0 * Math.log(u1));
  const z0 = mag * Math.cos(2.0 * Math.PI * u2);
  const z1 = mag * Math.sin(2.0 * Math.PI * u2);
  return [z0, z1];
}

// Standard normal random
function normalRandom(mean: number = 0, stdDev: number = 1): number {
  const [z] = boxMuller();
  return z * stdDev + mean;
}

// Triangular distribution
function triangularRandom(min: number, mode: number, max: number): number {
  const u = Math.random();
  const fc = (mode - min) / (max - min);
  
  if (u < fc) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
}

// Lognormal distribution
function lognormalRandom(mean: number, stdDev: number): number {
  // Convert to log-space parameters
  const variance = stdDev * stdDev;
  const mu = Math.log(mean * mean / Math.sqrt(variance + mean * mean));
  const sigma = Math.sqrt(Math.log(1 + variance / (mean * mean)));
  
  return Math.exp(normalRandom(mu, sigma));
}

// Uniform distribution
function uniformRandom(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Beta distribution using Johnk's algorithm
function betaRandom(alpha: number, beta: number, min: number = 0, max: number = 1): number {
  // Generate beta(alpha, beta) using gamma distribution ratio
  const gammaAlpha = gammaRandom(alpha);
  const gammaBeta = gammaRandom(beta);
  const betaValue = gammaAlpha / (gammaAlpha + gammaBeta);
  
  // Scale to [min, max]
  return min + betaValue * (max - min);
}

// Gamma distribution using Marsaglia and Tsang's method
function gammaRandom(shape: number): number {
  if (shape < 1) {
    return gammaRandom(1 + shape) * Math.pow(Math.random(), 1 / shape);
  }
  
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  
  while (true) {
    let x, v;
    do {
      x = normalRandom();
      v = 1 + c * x;
    } while (v <= 0);
    
    v = v * v * v;
    const u = Math.random();
    
    if (u < 1 - 0.0331 * (x * x) * (x * x)) {
      return d * v;
    }
    
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v;
    }
  }
}

// Main random function based on distribution type
export function generateRandom(params: DistributionParams): number {
  switch (params.type) {
    case 'triangular':
      return triangularRandom(params.min!, params.mode!, params.max!);
    
    case 'normal':
      return normalRandom(params.mean!, params.stdDev!);
    
    case 'lognormal':
      return lognormalRandom(params.mean!, params.stdDev!);
    
    case 'uniform':
      return uniformRandom(params.min!, params.max!);
    
    case 'beta':
      return betaRandom(params.alpha!, params.beta!, params.min!, params.max!);
    
    default:
      return triangularRandom(params.min!, params.mode!, params.max!);
  }
}

// Run simulation with any distribution
export function runSimulation(params: DistributionParams, iterations: number): number[] {
  const results: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    results.push(generateRandom(params));
  }
  
  return results;
}

// Distribution info for UI
export const distributionInfo: Record<DistributionType, { 
  name: string; 
  description: string;
  params: string[];
}> = {
  triangular: {
    name: 'Tam giác (Triangular)',
    description: 'Phân phối dựa trên giá trị tối thiểu, tối đa và giá trị có khả năng nhất',
    params: ['min', 'mode', 'max']
  },
  normal: {
    name: 'Chuẩn (Normal/Gaussian)',
    description: 'Phân phối hình chuông đối xứng, phổ biến trong tự nhiên',
    params: ['mean', 'stdDev']
  },
  lognormal: {
    name: 'Log-chuẩn (Lognormal)',
    description: 'Phân phối lệch phải, phù hợp với giá cổ phiếu, thời gian hoàn thành',
    params: ['mean', 'stdDev']
  },
  uniform: {
    name: 'Đều (Uniform)',
    description: 'Mọi giá trị trong khoảng đều có khả năng như nhau',
    params: ['min', 'max']
  },
  beta: {
    name: 'Beta',
    description: 'Phân phối linh hoạt, phù hợp với tỷ lệ và phần trăm',
    params: ['alpha', 'beta', 'min', 'max']
  }
};
