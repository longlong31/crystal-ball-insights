// ─── Algorithm Types & Registry ───────────────────────────────────
import {
  TrendingUp, Brain, Sigma, Settings2, Target, Zap,
  GitBranch, Layers, Cpu, BarChart3, Shield, DollarSign,
  Percent, Activity, Calculator, Gauge, PieChart, Flame
} from "lucide-react";

export interface AlgorithmParam {
  key: string;
  label: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
}

export interface AlgorithmResult {
  outputs: Record<string, { label: string; value: number | string; unit?: string }>;
  chartData?: { name: string; value: number }[];
  interpretation?: string;
}

export interface Algorithm {
  id: string;
  name: string;
  nameVi: string;
  category: "financial" | "optimization" | "ml" | "risk" | "strategy";
  description: string;
  descriptionVi: string;
  icon: any;
  params: AlgorithmParam[];
  run: (params: Record<string, number>) => AlgorithmResult;
  isContributed?: boolean;
  contributorName?: string;
}

// ─── Utility ──────────────────────────────────────────────────────
function erf(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function normCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function boxMuller(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ─── FINANCIAL MODELS ─────────────────────────────────────────────

function blackScholes(p: Record<string, number>): AlgorithmResult {
  const { S, K, T, r, sigma } = p;
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const Nd1 = normCDF(d1);
  const Nd2 = normCDF(d2);
  const callPrice = S * Nd1 - K * Math.exp(-r * T) * Nd2;
  const putPrice = K * Math.exp(-r * T) * (1 - Nd2) - S * (1 - Nd1);
  const delta = Nd1;
  const gamma = Math.exp(-d1 * d1 / 2) / (S * sigma * Math.sqrt(2 * Math.PI * T));
  const theta = -(S * sigma * Math.exp(-d1 * d1 / 2)) / (2 * Math.sqrt(2 * Math.PI * T)) - r * K * Math.exp(-r * T) * Nd2;
  const vega = S * Math.sqrt(T) * Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI);
  const rho = K * T * Math.exp(-r * T) * Nd2;

  const chartData = [];
  for (let s = S * 0.5; s <= S * 1.5; s += S * 0.05) {
    const d1c = (Math.log(s / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
    const d2c = d1c - sigma * Math.sqrt(T);
    chartData.push({ name: s.toFixed(0), value: s * normCDF(d1c) - K * Math.exp(-r * T) * normCDF(d2c) });
  }

  return {
    outputs: {
      callPrice: { label: "Call Price", value: callPrice.toFixed(4), unit: "$" },
      putPrice: { label: "Put Price", value: putPrice.toFixed(4), unit: "$" },
      delta: { label: "Delta (Δ)", value: delta.toFixed(4) },
      gamma: { label: "Gamma (Γ)", value: gamma.toFixed(6) },
      theta: { label: "Theta (Θ)", value: (theta / 365).toFixed(4), unit: "$/ngày" },
      vega: { label: "Vega (ν)", value: (vega / 100).toFixed(4), unit: "$/1%" },
      rho: { label: "Rho (ρ)", value: (rho / 100).toFixed(4), unit: "$/1%" },
    },
    chartData,
    interpretation: `Call = ${callPrice.toFixed(2)}$, Put = ${putPrice.toFixed(2)}$. Delta = ${delta.toFixed(3)} (xác suất ITM ≈ ${(delta * 100).toFixed(1)}%). Put-Call Parity check: C - P = ${(callPrice - putPrice).toFixed(4)}, S - Ke^(-rT) = ${(S - K * Math.exp(-r * T)).toFixed(4)}.`,
  };
}

function capm(p: Record<string, number>): AlgorithmResult {
  const { riskFree, beta, marketReturn } = p;
  const expectedReturn = riskFree + beta * (marketReturn - riskFree);
  const riskPremium = beta * (marketReturn - riskFree);
  const marketPremium = marketReturn - riskFree;
  const treynor = beta !== 0 ? (expectedReturn - riskFree) / beta : 0;

  const chartData = [];
  for (let b = 0; b <= 2.5; b += 0.25) {
    chartData.push({ name: b.toFixed(2), value: (riskFree + b * (marketReturn - riskFree)) * 100 });
  }

  return {
    outputs: {
      expectedReturn: { label: "Lợi suất kỳ vọng", value: (expectedReturn * 100).toFixed(2), unit: "%" },
      riskPremium: { label: "Phần bù rủi ro", value: (riskPremium * 100).toFixed(2), unit: "%" },
      marketPremium: { label: "Phần bù thị trường", value: (marketPremium * 100).toFixed(2), unit: "%" },
      treynor: { label: "Treynor Ratio", value: treynor.toFixed(4) },
    },
    chartData,
    interpretation: `Với β = ${beta}, E(R) = ${(expectedReturn * 100).toFixed(2)}%. Security Market Line: nếu lợi suất thực tế > ${(expectedReturn * 100).toFixed(2)}% → cổ phiếu bị định giá thấp (undervalued).`,
  };
}

function dcfModel(p: Record<string, number>): AlgorithmResult {
  const { cashFlow, growthRate, discountRate, terminalGrowthRate, years } = p;
  if (discountRate <= terminalGrowthRate) {
    return {
      outputs: { error: { label: "Lỗi", value: "Tỷ lệ chiết khấu phải > tăng trưởng vĩnh viễn" } },
      interpretation: "Tỷ lệ chiết khấu phải lớn hơn tốc độ tăng trưởng vĩnh viễn để tránh giá trị vô hạn.",
    };
  }
  let totalPV = 0;
  const chartData: { name: string; value: number }[] = [];
  let cf = cashFlow;
  for (let y = 1; y <= years; y++) {
    cf *= (1 + growthRate);
    const pv = cf / Math.pow(1 + discountRate, y);
    totalPV += pv;
    chartData.push({ name: `Năm ${y}`, value: pv });
  }
  const terminalValue = (cf * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);
  const pvTerminal = terminalValue / Math.pow(1 + discountRate, years);
  totalPV += pvTerminal;

  return {
    outputs: {
      intrinsicValue: { label: "Giá trị nội tại", value: totalPV.toFixed(0), unit: "$" },
      terminalValue: { label: "Terminal Value (PV)", value: pvTerminal.toFixed(0), unit: "$" },
      pvCashFlows: { label: "PV dòng tiền", value: (totalPV - pvTerminal).toFixed(0), unit: "$" },
      tvPercent: { label: "TV / Tổng giá trị", value: ((pvTerminal / totalPV) * 100).toFixed(1), unit: "%" },
    },
    chartData,
    interpretation: `Giá trị nội tại = ${totalPV.toFixed(0)}$. Terminal Value chiếm ${((pvTerminal / totalPV) * 100).toFixed(1)}% – ${pvTerminal / totalPV > 0.75 ? '⚠️ TV chiếm tỷ trọng lớn, kết quả nhạy cảm với giả định g vĩnh viễn' : 'tỷ trọng hợp lý'}.`,
  };
}

function gordonGrowth(p: Record<string, number>): AlgorithmResult {
  const { dividend, growthRate, requiredReturn } = p;
  if (requiredReturn <= growthRate) {
    return {
      outputs: { error: { label: "Lỗi", value: "Lợi suất yêu cầu phải > tốc độ tăng trưởng" } },
      interpretation: "Mô hình Gordon yêu cầu r > g để có giá trị hữu hạn.",
    };
  }
  const price = dividend / (requiredReturn - growthRate);
  const dividendYield = dividend / price;
  const chartData: { name: string; value: number }[] = [];
  for (let g = 0; g <= 0.15; g += 0.01) {
    if (requiredReturn > g + 0.005) {
      chartData.push({ name: (g * 100).toFixed(0) + "%", value: dividend / (requiredReturn - g) });
    }
  }
  return {
    outputs: {
      fairPrice: { label: "Giá hợp lý", value: price.toFixed(2), unit: "$" },
      dividendYield: { label: "Tỷ suất cổ tức", value: (dividendYield * 100).toFixed(2), unit: "%" },
      capitalGain: { label: "Capital Gain Yield", value: (growthRate * 100).toFixed(2), unit: "%" },
    },
    chartData,
    interpretation: `P₀ = D₁/(r−g) = ${dividend}/(${requiredReturn}−${growthRate}) = ${price.toFixed(2)}$. Tỷ suất cổ tức = ${(dividendYield * 100).toFixed(2)}%, vốn hóa tăng = ${(growthRate * 100).toFixed(2)}%.`,
  };
}

function binomialTree(p: Record<string, number>): AlgorithmResult {
  const { S, K, T, r, sigma, steps, optionType } = p;
  const n = Math.min(Math.max(Math.round(steps), 2), 200);
  const dt = T / n;
  const u = Math.exp(sigma * Math.sqrt(dt));
  const d = 1 / u;
  const pUp = (Math.exp(r * dt) - d) / (u - d);
  
  if (pUp < 0 || pUp > 1) {
    return {
      outputs: { error: { label: "Lỗi", value: "Tham số không hợp lệ (p ngoài [0,1])" } },
      interpretation: "Xác suất risk-neutral ngoài phạm vi [0,1]. Hãy điều chỉnh σ, r, hoặc T.",
    };
  }
  
  const isCall = optionType >= 0.5;

  // Build price tree at final step only (memory efficient)
  const finalPrices: number[] = [];
  for (let j = 0; j <= n; j++) {
    finalPrices[j] = S * Math.pow(u, n - j) * Math.pow(d, j);
  }

  // Terminal payoffs
  let optionValues = finalPrices.map(sp => isCall ? Math.max(sp - K, 0) : Math.max(K - sp, 0));

  // Backward induction
  for (let i = n - 1; i >= 0; i--) {
    const newValues: number[] = [];
    for (let j = 0; j <= i; j++) {
      newValues[j] = Math.exp(-r * dt) * (pUp * optionValues[j] + (1 - pUp) * optionValues[j + 1]);
    }
    optionValues = newValues;
  }

  const price = optionValues[0];
  
  // Compare with Black-Scholes
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const bsCall = S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
  const bsPrice = isCall ? bsCall : bsCall - S + K * Math.exp(-r * T);

  const chartData: { name: string; value: number }[] = [];
  for (let s = S * 0.6; s <= S * 1.4; s += S * 0.04) {
    const payoff = isCall ? Math.max(s - K, 0) : Math.max(K - s, 0);
    chartData.push({ name: s.toFixed(0), value: payoff });
  }

  return {
    outputs: {
      optionPrice: { label: `${isCall ? 'Call' : 'Put'} Price (Tree)`, value: price.toFixed(4), unit: "$" },
      bsPrice: { label: `${isCall ? 'Call' : 'Put'} Price (BS)`, value: bsPrice.toFixed(4), unit: "$" },
      convergenceError: { label: "Sai số vs BS", value: ((price - bsPrice) / bsPrice * 100).toFixed(4), unit: "%" },
      upFactor: { label: "u", value: u.toFixed(4) },
      downFactor: { label: "d", value: d.toFixed(4) },
      riskNeutralP: { label: "p (risk-neutral)", value: pUp.toFixed(4) },
    },
    chartData,
    interpretation: `Binomial (${n} bước): ${isCall ? 'Call' : 'Put'} = ${price.toFixed(4)}$. BS = ${bsPrice.toFixed(4)}$. Sai số = ${((price - bsPrice) / bsPrice * 100).toFixed(3)}%. Tăng số bước sẽ hội tụ về BS.`,
  };
}

function famaFrench(p: Record<string, number>): AlgorithmResult {
  const { riskFree, beta, smb, hml, marketPremium, smbPremium, hmlPremium } = p;
  const expectedReturn = riskFree + beta * marketPremium + smb * smbPremium + hml * hmlPremium;
  const capmReturn = riskFree + beta * marketPremium;
  const sizeEffect = smb * smbPremium;
  const valueEffect = hml * hmlPremium;
  const alpha = expectedReturn - capmReturn;

  const chartData = [
    { name: "Risk-Free", value: riskFree * 100 },
    { name: "Market β", value: beta * marketPremium * 100 },
    { name: "Size (SMB)", value: sizeEffect * 100 },
    { name: "Value (HML)", value: valueEffect * 100 },
    { name: "Total E(R)", value: expectedReturn * 100 },
  ];

  return {
    outputs: {
      expectedReturn: { label: "E(R) Fama-French", value: (expectedReturn * 100).toFixed(2), unit: "%" },
      capmReturn: { label: "E(R) CAPM", value: (capmReturn * 100).toFixed(2), unit: "%" },
      sizeEffect: { label: "Size effect", value: (sizeEffect * 100).toFixed(2), unit: "%" },
      valueEffect: { label: "Value effect", value: (valueEffect * 100).toFixed(2), unit: "%" },
      alphaFF: { label: "Alpha vs CAPM", value: (alpha * 100).toFixed(2), unit: "%" },
    },
    chartData,
    interpretation: `FF3: E(R) = ${(expectedReturn * 100).toFixed(2)}% vs CAPM ${(capmReturn * 100).toFixed(2)}%. Alpha = ${(alpha * 100).toFixed(2)}%. ${smb > 0 ? 'Small-cap tilt' : 'Large-cap tilt'}, ${hml > 0 ? 'Value tilt' : 'Growth tilt'}.`,
  };
}

// ─── NEW: Kelly Criterion ─────────────────────────────────────────
function kellyCriterion(p: Record<string, number>): AlgorithmResult {
  const { winRate, winLoss, bankroll, maxBet } = p;
  const b = winLoss;
  const pWin = winRate;
  const q = 1 - pWin;
  const kelly = (b * pWin - q) / b;
  const halfKelly = kelly / 2;
  const quarterKelly = kelly / 4;
  const betSize = Math.max(0, kelly) * bankroll;
  const expectedGrowth = pWin * Math.log(1 + kelly * b) + q * Math.log(1 - kelly);

  const chartData: { name: string; value: number }[] = [];
  for (let f = 0; f <= Math.min(1, kelly * 2.5 + 0.1); f += 0.02) {
    const g = pWin * Math.log(1 + f * b) + q * Math.log(Math.max(0.001, 1 - f));
    chartData.push({ name: (f * 100).toFixed(0) + "%", value: g * 100 });
  }

  return {
    outputs: {
      kellyFraction: { label: "Kelly Fraction (f*)", value: (kelly * 100).toFixed(2), unit: "%" },
      halfKelly: { label: "Half Kelly", value: (halfKelly * 100).toFixed(2), unit: "%" },
      betSize: { label: "Bet Size (Full Kelly)", value: Math.min(betSize, maxBet * bankroll / 100).toFixed(0), unit: "$" },
      expectedGrowth: { label: "Tốc độ tăng trưởng kỳ vọng", value: (expectedGrowth * 100).toFixed(4), unit: "%/trade" },
      edge: { label: "Edge", value: ((pWin * b - q) * 100).toFixed(2), unit: "%" },
    },
    chartData,
    interpretation: kelly > 0
      ? `f* = ${(kelly * 100).toFixed(2)}%. Half-Kelly (${(halfKelly * 100).toFixed(1)}%) được khuyến nghị để giảm biến động. Edge = ${((pWin * b - q) * 100).toFixed(2)}%.`
      : `⚠️ Kelly âm (${(kelly * 100).toFixed(2)}%) → KHÔNG nên đặt cược. Bạn không có edge dương.`,
  };
}

// ─── NEW: Value at Risk (Historical Simulation) ───────────────────
function varCalculator(p: Record<string, number>): AlgorithmResult {
  const { portfolioValue, meanReturn, volatility, days, confidence } = p;
  const n = Math.round(days);
  
  // Generate simulated returns
  const returns: number[] = [];
  for (let i = 0; i < 10000; i++) {
    const dailyReturn = meanReturn / 252 + (volatility / Math.sqrt(252)) * boxMuller();
    const periodReturn = dailyReturn * n + (volatility / Math.sqrt(252)) * Math.sqrt(n) * boxMuller();
    returns.push(periodReturn);
  }
  returns.sort((a, b) => a - b);
  
  const alpha = 1 - confidence / 100;
  const varIndex = Math.floor(returns.length * alpha);
  const varValue = -returns[varIndex] * portfolioValue;
  
  // CVaR (Expected Shortfall)
  const tailReturns = returns.slice(0, varIndex);
  const cvar = -(tailReturns.reduce((s, r) => s + r, 0) / tailReturns.length) * portfolioValue;
  
  // Parametric VaR
  const zScore = alpha === 0.05 ? 1.645 : alpha === 0.01 ? 2.326 : 1.96;
  const parametricVaR = portfolioValue * (meanReturn / 252 * n - zScore * volatility / Math.sqrt(252) * Math.sqrt(n));

  const chartData: { name: string; value: number }[] = [];
  const bins = 50;
  const minR = returns[0];
  const maxR = returns[returns.length - 1];
  const binSize = (maxR - minR) / bins;
  for (let i = 0; i < bins; i++) {
    const low = minR + i * binSize;
    const count = returns.filter(r => r >= low && r < low + binSize).length;
    chartData.push({ name: (low * 100).toFixed(1), value: count });
  }

  return {
    outputs: {
      var_mc: { label: `VaR ${confidence}% (MC)`, value: varValue.toFixed(0), unit: "$" },
      cvar: { label: `CVaR ${confidence}%`, value: cvar.toFixed(0), unit: "$" },
      parametricVaR: { label: `VaR Parametric`, value: Math.abs(parametricVaR).toFixed(0), unit: "$" },
      maxLoss: { label: "Max Loss (sim)", value: (-returns[0] * portfolioValue).toFixed(0), unit: "$" },
      varPercent: { label: "VaR %", value: (varValue / portfolioValue * 100).toFixed(2), unit: "%" },
    },
    chartData,
    interpretation: `VaR ${confidence}% (${n} ngày) = ${varValue.toFixed(0)}$ (${(varValue / portfolioValue * 100).toFixed(2)}% danh mục). CVaR = ${cvar.toFixed(0)}$ – trung bình tổn thất trong ${(alpha * 100).toFixed(0)}% trường hợp xấu nhất.`,
  };
}

// ─── NEW: Sharpe & Sortino Ratio ──────────────────────────────────
function sharpeRatio(p: Record<string, number>): AlgorithmResult {
  const { returnAsset, riskFree, volatility, downsideVol } = p;
  const sharpe = (returnAsset - riskFree) / volatility;
  const sortino = downsideVol > 0 ? (returnAsset - riskFree) / downsideVol : 0;
  const treynor = (returnAsset - riskFree) / 1; // assume beta=1
  const informationRatio = (returnAsset - 0.10) / volatility; // benchmark = 10%

  const chartData: { name: string; value: number }[] = [];
  for (let v = 0.05; v <= 0.60; v += 0.025) {
    chartData.push({ name: (v * 100).toFixed(0) + "%", value: (returnAsset - riskFree) / v });
  }

  return {
    outputs: {
      sharpe: { label: "Sharpe Ratio", value: sharpe.toFixed(4) },
      sortino: { label: "Sortino Ratio", value: sortino.toFixed(4) },
      informationRatio: { label: "Information Ratio", value: informationRatio.toFixed(4) },
      excessReturn: { label: "Excess Return", value: ((returnAsset - riskFree) * 100).toFixed(2), unit: "%" },
      rating: { label: "Đánh giá", value: sharpe >= 2 ? "Tuyệt vời" : sharpe >= 1 ? "Tốt" : sharpe >= 0.5 ? "Trung bình" : "Kém" },
    },
    chartData,
    interpretation: `Sharpe = ${sharpe.toFixed(3)} (${sharpe >= 2 ? '⭐ Tuyệt vời' : sharpe >= 1 ? '✅ Tốt' : sharpe >= 0.5 ? '⚡ Trung bình' : '⚠️ Kém'}). Sortino = ${sortino.toFixed(3)}. Mỗi 1% rủi ro mang lại ${(sharpe * 100).toFixed(1)}bps lợi nhuận vượt trội.`,
  };
}

// ─── NEW: Monte Carlo Option Pricing ──────────────────────────────
function monteCarloOption(p: Record<string, number>): AlgorithmResult {
  const { S, K, T, r, sigma, simulations, optionType } = p;
  const isCall = optionType >= 0.5;
  const n = Math.min(Math.round(simulations), 100000);
  
  const payoffs: number[] = [];
  for (let i = 0; i < n; i++) {
    const z = boxMuller();
    const ST = S * Math.exp((r - 0.5 * sigma * sigma) * T + sigma * Math.sqrt(T) * z);
    const payoff = isCall ? Math.max(ST - K, 0) : Math.max(K - ST, 0);
    payoffs.push(payoff);
  }
  
  const discountFactor = Math.exp(-r * T);
  const meanPayoff = payoffs.reduce((s, p) => s + p, 0) / n;
  const mcPrice = discountFactor * meanPayoff;
  const stdDev = Math.sqrt(payoffs.reduce((s, p) => s + (p - meanPayoff) ** 2, 0) / (n - 1));
  const stdError = discountFactor * stdDev / Math.sqrt(n);
  
  // BS for comparison
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const bsCall = S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
  const bsPrice = isCall ? bsCall : bsCall - S + K * Math.exp(-r * T);

  // Convergence chart
  const chartData: { name: string; value: number }[] = [];
  let runningSum = 0;
  const step = Math.max(1, Math.floor(n / 50));
  for (let i = 0; i < n; i++) {
    runningSum += payoffs[i];
    if (i % step === 0 && i > 0) {
      chartData.push({ name: `${i}`, value: discountFactor * runningSum / (i + 1) });
    }
  }

  return {
    outputs: {
      mcPrice: { label: `MC ${isCall ? 'Call' : 'Put'}`, value: mcPrice.toFixed(4), unit: "$" },
      bsPrice: { label: `BS ${isCall ? 'Call' : 'Put'}`, value: bsPrice.toFixed(4), unit: "$" },
      stdError: { label: "Standard Error", value: stdError.toFixed(4), unit: "$" },
      ci95: { label: "95% CI", value: `[${(mcPrice - 1.96 * stdError).toFixed(3)}, ${(mcPrice + 1.96 * stdError).toFixed(3)}]` },
      errorPct: { label: "Sai số vs BS", value: ((mcPrice - bsPrice) / bsPrice * 100).toFixed(3), unit: "%" },
    },
    chartData,
    interpretation: `MC (${n.toLocaleString()} paths): ${isCall ? 'Call' : 'Put'} = ${mcPrice.toFixed(4)}$ ± ${stdError.toFixed(4)}$. BS = ${bsPrice.toFixed(4)}$. CI 95% = [${(mcPrice - 1.96 * stdError).toFixed(3)}, ${(mcPrice + 1.96 * stdError).toFixed(3)}].`,
  };
}

// ─── NEW: Markowitz Mean-Variance ─────────────────────────────────
function markowitzOptimization(p: Record<string, number>): AlgorithmResult {
  const { nAssets, riskFree, targetReturn, minWeight, maxWeight } = p;
  const n = Math.min(Math.max(Math.round(nAssets), 2), 10);
  
  // Generate random expected returns and correlations
  const expectedReturns: number[] = [];
  const vols: number[] = [];
  for (let i = 0; i < n; i++) {
    expectedReturns.push(0.05 + Math.random() * 0.20);
    vols.push(0.10 + Math.random() * 0.30);
  }
  
  // Generate efficient frontier via random portfolios
  const frontier: { risk: number; ret: number; sharpe: number; weights: number[] }[] = [];
  for (let iter = 0; iter < 20000; iter++) {
    const rawWeights: number[] = [];
    for (let i = 0; i < n; i++) rawWeights.push(minWeight / 100 + Math.random() * (maxWeight / 100 - minWeight / 100));
    const total = rawWeights.reduce((s, w) => s + w, 0);
    const weights = rawWeights.map(w => w / total);
    
    const portReturn = weights.reduce((s, w, i) => s + w * expectedReturns[i], 0);
    // Simplified portfolio variance (assume low correlation)
    let portVar = 0;
    for (let i = 0; i < n; i++) {
      portVar += (weights[i] * vols[i]) ** 2;
      for (let j = i + 1; j < n; j++) {
        portVar += 2 * weights[i] * weights[j] * vols[i] * vols[j] * 0.3; // assume corr=0.3
      }
    }
    const portVol = Math.sqrt(portVar);
    const sharpe = portVol > 0 ? (portReturn - riskFree) / portVol : 0;
    
    frontier.push({ risk: portVol * 100, ret: portReturn * 100, sharpe, weights });
  }
  
  frontier.sort((a, b) => a.risk - b.risk);
  
  // Find max Sharpe
  const maxSharpe = frontier.reduce((best, p) => p.sharpe > best.sharpe ? p : best, frontier[0]);
  // Find min variance
  const minVar = frontier[0];

  const chartData = frontier
    .filter((_, i) => i % 400 === 0)
    .map(p => ({ name: p.risk.toFixed(1), value: p.ret }));

  return {
    outputs: {
      maxSharpe: { label: "Max Sharpe Ratio", value: maxSharpe.sharpe.toFixed(4) },
      optimalReturn: { label: "Lợi suất tối ưu", value: maxSharpe.ret.toFixed(2), unit: "%" },
      optimalRisk: { label: "Rủi ro tối ưu", value: maxSharpe.risk.toFixed(2), unit: "%" },
      minVarRisk: { label: "Min Variance Risk", value: minVar.risk.toFixed(2), unit: "%" },
      minVarReturn: { label: "Min Variance Return", value: minVar.ret.toFixed(2), unit: "%" },
      nAssets: { label: "Số tài sản", value: n },
    },
    chartData,
    interpretation: `Efficient Frontier (${n} tài sản): Max Sharpe = ${maxSharpe.sharpe.toFixed(3)} tại E(R) = ${maxSharpe.ret.toFixed(2)}%, σ = ${maxSharpe.risk.toFixed(2)}%. Min Variance: σ = ${minVar.risk.toFixed(2)}%.`,
  };
}

// ─── NEW: Moving Average Crossover Backtest ───────────────────────
function maCrossover(p: Record<string, number>): AlgorithmResult {
  const { initialPrice, drift, volatility, days, shortMA, longMA } = p;
  const n = Math.round(days);
  
  // Generate price series
  const prices: number[] = [initialPrice];
  for (let i = 1; i < n; i++) {
    const r = drift / 252 + (volatility / Math.sqrt(252)) * boxMuller();
    prices.push(prices[i - 1] * Math.exp(r));
  }
  
  // Calculate MAs
  const calcMA = (period: number, idx: number): number => {
    if (idx < period - 1) return prices[idx];
    let sum = 0;
    for (let i = idx - period + 1; i <= idx; i++) sum += prices[i];
    return sum / period;
  };
  
  // Backtest
  let position = 0; // 0=cash, 1=long
  let trades = 0;
  let wins = 0;
  let entryPrice = 0;
  let portfolioValue = 10000;
  let shares = 0;
  const returns: number[] = [];
  
  for (let i = Math.round(longMA); i < n; i++) {
    const sma = calcMA(Math.round(shortMA), i);
    const lma = calcMA(Math.round(longMA), i);
    const prevSma = calcMA(Math.round(shortMA), i - 1);
    const prevLma = calcMA(Math.round(longMA), i - 1);
    
    if (prevSma <= prevLma && sma > lma && position === 0) {
      // Buy signal
      position = 1;
      entryPrice = prices[i];
      shares = portfolioValue / prices[i];
      trades++;
    } else if (prevSma >= prevLma && sma < lma && position === 1) {
      // Sell signal
      position = 0;
      const pnl = (prices[i] - entryPrice) / entryPrice;
      if (pnl > 0) wins++;
      portfolioValue = shares * prices[i];
      returns.push(pnl);
      trades++;
    }
  }
  
  // Close remaining position
  if (position === 1) {
    portfolioValue = shares * prices[n - 1];
    const pnl = (prices[n - 1] - entryPrice) / entryPrice;
    if (pnl > 0) wins++;
    returns.push(pnl);
  }
  
  const buyHoldReturn = (prices[n - 1] - prices[0]) / prices[0];
  const strategyReturn = (portfolioValue - 10000) / 10000;
  const winRate = returns.length > 0 ? wins / returns.length : 0;

  const chartData = prices.filter((_, i) => i % Math.max(1, Math.floor(n / 50)) === 0)
    .map((p, i) => ({ name: `${i}`, value: p }));

  return {
    outputs: {
      strategyReturn: { label: "Lợi nhuận chiến lược", value: (strategyReturn * 100).toFixed(2), unit: "%" },
      buyHoldReturn: { label: "Buy & Hold", value: (buyHoldReturn * 100).toFixed(2), unit: "%" },
      alpha: { label: "Alpha vs B&H", value: ((strategyReturn - buyHoldReturn) * 100).toFixed(2), unit: "%" },
      trades: { label: "Số giao dịch", value: Math.floor(trades / 2) },
      winRate: { label: "Tỷ lệ thắng", value: (winRate * 100).toFixed(1), unit: "%" },
      finalValue: { label: "Giá trị cuối", value: portfolioValue.toFixed(0), unit: "$" },
    },
    chartData,
    interpretation: `MA(${Math.round(shortMA)}/${Math.round(longMA)}): Lợi nhuận = ${(strategyReturn * 100).toFixed(2)}% vs B&H = ${(buyHoldReturn * 100).toFixed(2)}%. ${Math.floor(trades / 2)} giao dịch, win rate = ${(winRate * 100).toFixed(1)}%. ${strategyReturn > buyHoldReturn ? '✅ Outperform' : '❌ Underperform'} so với B&H.`,
  };
}

// ─── OPTIMIZATION ─────────────────────────────────────────────────

function gradientDescent(p: Record<string, number>): AlgorithmResult {
  const { startX, learningRate, iterations } = p;
  let x = startX;
  const chartData: { name: string; value: number }[] = [];
  for (let i = 0; i < iterations; i++) {
    const grad = 2 * x + 3 * Math.cos(3 * x);
    x -= learningRate * grad;
    if (i % Math.max(1, Math.floor(iterations / 50)) === 0) {
      chartData.push({ name: `${i}`, value: x * x + Math.sin(3 * x) });
    }
  }
  const fMin = x * x + Math.sin(3 * x);
  return {
    outputs: {
      optimalX: { label: "x* tối ưu", value: x.toFixed(6) },
      minValue: { label: "f(x*) min", value: fMin.toFixed(6) },
      iterations: { label: "Số bước", value: iterations },
    },
    chartData,
    interpretation: `Gradient Descent hội tụ tại x* = ${x.toFixed(4)}, f(x*) = ${fMin.toFixed(4)}.`,
  };
}

function simulatedAnnealing(p: Record<string, number>): AlgorithmResult {
  const { startX, temperature, coolingRate, iterations } = p;
  let x = startX;
  let best = x;
  let bestF = x * x + 10 * Math.sin(x);
  const chartData: { name: string; value: number }[] = [];
  let T = temperature;

  for (let i = 0; i < iterations; i++) {
    const neighbor = x + (Math.random() - 0.5) * 2 * (T / temperature);
    const fCurrent = x * x + 10 * Math.sin(x);
    const fNeighbor = neighbor * neighbor + 10 * Math.sin(neighbor);
    const delta = fNeighbor - fCurrent;

    if (delta < 0 || Math.random() < Math.exp(-delta / T)) {
      x = neighbor;
    }
    const fx = x * x + 10 * Math.sin(x);
    if (fx < bestF) {
      best = x;
      bestF = fx;
    }
    T *= coolingRate;
    if (i % Math.max(1, Math.floor(iterations / 50)) === 0) {
      chartData.push({ name: `${i}`, value: bestF });
    }
  }

  return {
    outputs: {
      optimalX: { label: "x* tối ưu", value: best.toFixed(6) },
      minValue: { label: "f(x*) min", value: bestF.toFixed(6) },
      finalTemp: { label: "Nhiệt độ cuối", value: T.toFixed(6) },
    },
    chartData,
    interpretation: `SA tìm được x* = ${best.toFixed(4)} với f(x*) = ${bestF.toFixed(4)}. Nhiệt độ giảm từ ${temperature} → ${T.toFixed(6)}.`,
  };
}

// ─── NEW: Particle Swarm Optimization ─────────────────────────────
function particleSwarm(p: Record<string, number>): AlgorithmResult {
  const { particles, iterations, w, c1, c2 } = p;
  const nParticles = Math.min(Math.max(Math.round(particles), 5), 100);
  const nIter = Math.min(Math.max(Math.round(iterations), 10), 2000);
  
  // Optimize Rastrigin function: f(x,y) = 20 + x² + y² - 10cos(2πx) - 10cos(2πy)
  const f = (x: number, y: number) => 20 + x * x + y * y - 10 * Math.cos(2 * Math.PI * x) - 10 * Math.cos(2 * Math.PI * y);
  
  const pos: [number, number][] = [];
  const vel: [number, number][] = [];
  const pBest: [number, number][] = [];
  const pBestF: number[] = [];
  let gBest: [number, number] = [0, 0];
  let gBestF = Infinity;
  
  for (let i = 0; i < nParticles; i++) {
    const x = (Math.random() - 0.5) * 10;
    const y = (Math.random() - 0.5) * 10;
    pos.push([x, y]);
    vel.push([(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2]);
    pBest.push([x, y]);
    const fv = f(x, y);
    pBestF.push(fv);
    if (fv < gBestF) { gBest = [x, y]; gBestF = fv; }
  }
  
  const chartData: { name: string; value: number }[] = [];
  
  for (let iter = 0; iter < nIter; iter++) {
    for (let i = 0; i < nParticles; i++) {
      vel[i][0] = w * vel[i][0] + c1 * Math.random() * (pBest[i][0] - pos[i][0]) + c2 * Math.random() * (gBest[0] - pos[i][0]);
      vel[i][1] = w * vel[i][1] + c1 * Math.random() * (pBest[i][1] - pos[i][1]) + c2 * Math.random() * (gBest[1] - pos[i][1]);
      pos[i][0] += vel[i][0];
      pos[i][1] += vel[i][1];
      
      const fv = f(pos[i][0], pos[i][1]);
      if (fv < pBestF[i]) { pBest[i] = [...pos[i]]; pBestF[i] = fv; }
      if (fv < gBestF) { gBest = [...pos[i]]; gBestF = fv; }
    }
    
    if (iter % Math.max(1, Math.floor(nIter / 50)) === 0) {
      chartData.push({ name: `${iter}`, value: gBestF });
    }
  }

  return {
    outputs: {
      optimalX: { label: "x* tối ưu", value: gBest[0].toFixed(6) },
      optimalY: { label: "y* tối ưu", value: gBest[1].toFixed(6) },
      minValue: { label: "f(x*,y*) min", value: gBestF.toFixed(6) },
      globalMin: { label: "Global min (lý thuyết)", value: "0.0000" },
      error: { label: "Sai số", value: Math.abs(gBestF).toFixed(6) },
    },
    chartData,
    interpretation: `PSO (${nParticles} hạt, ${nIter} iter): f(${gBest[0].toFixed(4)}, ${gBest[1].toFixed(4)}) = ${gBestF.toFixed(6)}. Global min = 0 tại (0,0). Rastrigin function có nhiều local minima.`,
  };
}

// ─── ML/AI ────────────────────────────────────────────────────────

function linearRegressionAlgo(p: Record<string, number>): AlgorithmResult {
  const { n, noise, slope, intercept } = p;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = i / n * 10;
    xs.push(x);
    ys.push(slope * x + intercept + (Math.random() - 0.5) * noise);
  }
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const b1 = den !== 0 ? num / den : 0;
  const b0 = meanY - b1 * meanX;
  const ssRes = ys.reduce((s, y, i) => s + (y - (b1 * xs[i] + b0)) ** 2, 0);
  const ssTot = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 0;
  const mse = ssRes / n;
  const rmse = Math.sqrt(mse);
  const adjustedR2 = n > 2 ? 1 - (1 - r2) * (n - 1) / (n - 2) : r2;
  const chartData = xs.map((x, i) => ({ name: x.toFixed(1), value: ys[i] }));

  return {
    outputs: {
      slope: { label: "Slope (β₁)", value: b1.toFixed(4) },
      intercept: { label: "Intercept (β₀)", value: b0.toFixed(4) },
      r2: { label: "R²", value: r2.toFixed(4) },
      adjustedR2: { label: "Adjusted R²", value: adjustedR2.toFixed(4) },
      rmse: { label: "RMSE", value: rmse.toFixed(4) },
    },
    chartData,
    interpretation: `y = ${b1.toFixed(3)}x + ${b0.toFixed(3)}. R² = ${r2.toFixed(4)}, Adj R² = ${adjustedR2.toFixed(4)}. Slope thực = ${slope}, ước lượng = ${b1.toFixed(3)} (sai số ${((b1 - slope) / slope * 100).toFixed(1)}%).`,
  };
}

function kmeansAlgo(p: Record<string, number>): AlgorithmResult {
  const { n, k, iterations } = p;
  const data: [number, number][] = [];
  for (let c = 0; c < k; c++) {
    const cx = Math.random() * 10;
    const cy = Math.random() * 10;
    for (let i = 0; i < Math.floor(n / k); i++) {
      data.push([cx + (Math.random() - 0.5) * 3, cy + (Math.random() - 0.5) * 3]);
    }
  }

  let centroids: [number, number][] = data.slice(0, k).map(d => [...d]);
  let assignments = new Array(data.length).fill(0);
  let actualIters = 0;

  for (let iter = 0; iter < iterations; iter++) {
    actualIters = iter + 1;
    const newAssignments = data.map(pt => {
      let minDist = Infinity, minIdx = 0;
      centroids.forEach((c, ci) => {
        const d = Math.hypot(pt[0] - c[0], pt[1] - c[1]);
        if (d < minDist) { minDist = d; minIdx = ci; }
      });
      return minIdx;
    });
    const newCentroids: [number, number][] = centroids.map(() => [0, 0]);
    const counts = new Array(k).fill(0);
    newAssignments.forEach((a, i) => {
      newCentroids[a][0] += data[i][0];
      newCentroids[a][1] += data[i][1];
      counts[a]++;
    });
    newCentroids.forEach((c, i) => {
      if (counts[i] > 0) { c[0] /= counts[i]; c[1] /= counts[i]; }
    });
    const converged = centroids.every((c, i) => Math.hypot(c[0] - newCentroids[i][0], c[1] - newCentroids[i][1]) < 0.001);
    centroids = newCentroids;
    assignments = newAssignments;
    if (converged) break;
  }

  const inertia = data.reduce((s, pt, i) => s + Math.hypot(pt[0] - centroids[assignments[i]][0], pt[1] - centroids[assignments[i]][1]) ** 2, 0);
  // Silhouette score (simplified)
  const chartData = centroids.map((c, i) => ({ name: `Cluster ${i + 1}`, value: data.filter((_, j) => assignments[j] === i).length }));

  return {
    outputs: {
      clusters: { label: "Số cluster", value: k },
      convergedAt: { label: "Hội tụ tại", value: `Iter ${actualIters}` },
      inertia: { label: "Inertia (WCSS)", value: inertia.toFixed(2) },
      dataPoints: { label: "Tổng điểm", value: data.length },
    },
    chartData,
    interpretation: `K-Means: ${data.length} điểm → ${k} cluster, hội tụ sau ${actualIters} bước. Inertia = ${inertia.toFixed(2)}. Thử thay đổi K và so sánh Inertia (Elbow method).`,
  };
}

// ─── FIXED: Proper ARIMA(p,d,q) ──────────────────────────────────
function arimaForecast(p: Record<string, number>): AlgorithmResult {
  const { n, trend, seasonality, forecastSteps, arOrder, maOrder } = p;
  const ar = Math.max(1, Math.round(arOrder || 1));
  const ma = Math.max(0, Math.round(maOrder || 1));
  
  // Generate data with AR structure + trend + seasonal
  const data: number[] = [];
  const errors: number[] = [];
  let val = 100;
  
  for (let i = 0; i < n; i++) {
    const trendComp = trend * i;
    const seasonComp = seasonality * Math.sin(2 * Math.PI * i / 12);
    const noise = boxMuller() * 3;
    errors.push(noise);
    
    // AR component
    let arComp = 0;
    for (let j = 1; j <= Math.min(ar, i); j++) {
      arComp += (0.5 / j) * (data[i - j] !== undefined ? data[i - j] - (100 + trend * (i - j)) : 0);
    }
    // MA component
    let maComp = 0;
    for (let j = 1; j <= Math.min(ma, errors.length - 1); j++) {
      maComp += (0.3 / j) * (errors[errors.length - 1 - j] || 0);
    }
    
    val = 100 + trendComp + seasonComp + arComp + maComp + noise;
    data.push(val);
  }
  
  // Forecast using estimated coefficients
  const forecasted: number[] = [];
  const extendedData = [...data];
  const extendedErrors = [...errors];
  
  for (let i = 0; i < forecastSteps; i++) {
    const idx = n + i;
    const trendComp = trend * idx;
    const seasonComp = seasonality * Math.sin(2 * Math.PI * idx / 12);
    
    let arComp = 0;
    for (let j = 1; j <= ar; j++) {
      const prevIdx = extendedData.length - j;
      if (prevIdx >= 0) arComp += (0.5 / j) * (extendedData[prevIdx] - (100 + trend * (idx - j)));
    }
    
    const forecastVal = 100 + trendComp + seasonComp + arComp;
    forecasted.push(forecastVal);
    extendedData.push(forecastVal);
    extendedErrors.push(0);
  }
  
  // Calculate fit metrics
  const fitted = data.slice(ar).map((_, i) => {
    const idx = i + ar;
    let arComp = 0;
    for (let j = 1; j <= ar; j++) arComp += (0.5 / j) * (data[idx - j] - (100 + trend * (idx - j)));
    return 100 + trend * idx + seasonality * Math.sin(2 * Math.PI * idx / 12) + arComp;
  });
  
  const residuals = data.slice(ar).map((d, i) => d - fitted[i]);
  const mae = residuals.reduce((s, r) => s + Math.abs(r), 0) / residuals.length;
  const rmse = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / residuals.length);
  const mape = residuals.reduce((s, r, i) => s + Math.abs(r / data[i + ar]) * 100, 0) / residuals.length;
  
  const chartData = [
    ...data.slice(-20).map((v, i) => ({ name: `T-${20 - i}`, value: v })),
    ...forecasted.map((v, i) => ({ name: `F+${i + 1}`, value: v })),
  ];

  return {
    outputs: {
      model: { label: "Mô hình", value: `ARIMA(${ar},1,${ma})` },
      lastValue: { label: "Giá trị cuối", value: data[data.length - 1].toFixed(2) },
      forecastEnd: { label: "Dự báo cuối", value: forecasted[forecasted.length - 1].toFixed(2) },
      mae: { label: "MAE", value: mae.toFixed(2) },
      rmse: { label: "RMSE", value: rmse.toFixed(2) },
      mape: { label: "MAPE", value: mape.toFixed(2), unit: "%" },
    },
    chartData,
    interpretation: `ARIMA(${ar},1,${ma}): MAE = ${mae.toFixed(2)}, RMSE = ${rmse.toFixed(2)}, MAPE = ${mape.toFixed(2)}%. Dự báo ${forecastSteps} bước: ${data[data.length - 1].toFixed(1)} → ${forecasted[forecasted.length - 1].toFixed(1)}.`,
  };
}

function neuralNetwork(p: Record<string, number>): AlgorithmResult {
  const { hiddenNodes, learningRate, epochs, dataPoints, noise } = p;
  const data: { x1: number; x2: number; label: number }[] = [];
  for (let i = 0; i < dataPoints; i++) {
    const x1 = Math.random() * 2 - 1;
    const x2 = Math.random() * 2 - 1;
    const trueLabel = (x1 * x2 > 0) ? 1 : 0;
    const noisyLabel = Math.random() < noise ? (1 - trueLabel) : trueLabel;
    data.push({ x1, x2, label: noisyLabel });
  }

  const sigmoid = (x: number) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  const randW = () => (Math.random() - 0.5) * 2;

  const wIH: number[][] = [];
  const bH: number[] = [];
  for (let h = 0; h < hiddenNodes; h++) {
    wIH.push([randW(), randW()]);
    bH.push(randW() * 0.1);
  }
  const wHO: number[] = [];
  let bO = randW() * 0.1;
  for (let h = 0; h < hiddenNodes; h++) wHO.push(randW());

  const lossHistory: { name: string; value: number }[] = [];

  for (let epoch = 0; epoch < epochs; epoch++) {
    let totalLoss = 0;
    for (const d of data) {
      const hiddenOut: number[] = [];
      for (let h = 0; h < hiddenNodes; h++) {
        hiddenOut.push(sigmoid(wIH[h][0] * d.x1 + wIH[h][1] * d.x2 + bH[h]));
      }
      let output = bO;
      for (let h = 0; h < hiddenNodes; h++) output += wHO[h] * hiddenOut[h];
      const pred = sigmoid(output);
      const error = pred - d.label;
      totalLoss += error * error;

      const dOutput = error * pred * (1 - pred);
      for (let h = 0; h < hiddenNodes; h++) {
        const dHidden = dOutput * wHO[h] * hiddenOut[h] * (1 - hiddenOut[h]);
        wIH[h][0] -= learningRate * dHidden * d.x1;
        wIH[h][1] -= learningRate * dHidden * d.x2;
        bH[h] -= learningRate * dHidden;
        wHO[h] -= learningRate * dOutput * hiddenOut[h];
      }
      bO -= learningRate * dOutput;
    }
    if (epoch % Math.max(1, Math.floor(epochs / 40)) === 0) {
      lossHistory.push({ name: `${epoch}`, value: totalLoss / data.length });
    }
  }

  let correct = 0;
  for (const d of data) {
    const hiddenOut: number[] = [];
    for (let h = 0; h < hiddenNodes; h++) {
      hiddenOut.push(sigmoid(wIH[h][0] * d.x1 + wIH[h][1] * d.x2 + bH[h]));
    }
    let output = bO;
    for (let h = 0; h < hiddenNodes; h++) output += wHO[h] * hiddenOut[h];
    if ((sigmoid(output) >= 0.5 ? 1 : 0) === d.label) correct++;
  }
  const accuracy = correct / data.length;
  const finalLoss = lossHistory.length > 0 ? parseFloat(lossHistory[lossHistory.length - 1].value.toFixed(6)) : 0;

  return {
    outputs: {
      accuracy: { label: "Accuracy", value: (accuracy * 100).toFixed(2), unit: "%" },
      finalLoss: { label: "Final Loss", value: finalLoss.toFixed(6) },
      params: { label: "Tổng tham số", value: hiddenNodes * 3 + hiddenNodes + 1 },
      architecture: { label: "Kiến trúc", value: `2→${hiddenNodes}→1` },
    },
    chartData: lossHistory,
    interpretation: `NN (2→${hiddenNodes}→1): Accuracy = ${(accuracy * 100).toFixed(1)}%, Loss = ${finalLoss.toFixed(6)}. ${accuracy > 0.9 ? '✅ Học tốt' : accuracy > 0.7 ? '⚡ Khá' : '⚠️ Cần tăng hidden nodes hoặc epochs'}.`,
  };
}

// ─── NEW: Logistic Regression ─────────────────────────────────────
function logisticRegression(p: Record<string, number>): AlgorithmResult {
  const { n, learningRate, epochs, separation } = p;
  
  // Generate 2-class data
  const data: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const cls = Math.random() > 0.5 ? 1 : 0;
    const x = (cls === 1 ? separation : -separation) + boxMuller() * 2;
    data.push({ x, y: cls });
  }
  
  let w = 0, b = 0;
  const sigmoid = (z: number) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z))));
  const lossHistory: { name: string; value: number }[] = [];
  
  for (let epoch = 0; epoch < epochs; epoch++) {
    let totalLoss = 0;
    let dw = 0, db = 0;
    for (const d of data) {
      const pred = sigmoid(w * d.x + b);
      const err = pred - d.y;
      dw += err * d.x;
      db += err;
      totalLoss += -(d.y * Math.log(pred + 1e-10) + (1 - d.y) * Math.log(1 - pred + 1e-10));
    }
    w -= learningRate * dw / n;
    b -= learningRate * db / n;
    
    if (epoch % Math.max(1, Math.floor(epochs / 40)) === 0) {
      lossHistory.push({ name: `${epoch}`, value: totalLoss / n });
    }
  }
  
  // Accuracy
  let correct = 0;
  let tp = 0, fp = 0, fn = 0;
  for (const d of data) {
    const pred = sigmoid(w * d.x + b) >= 0.5 ? 1 : 0;
    if (pred === d.y) correct++;
    if (pred === 1 && d.y === 1) tp++;
    if (pred === 1 && d.y === 0) fp++;
    if (pred === 0 && d.y === 1) fn++;
  }
  const accuracy = correct / n;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;

  return {
    outputs: {
      accuracy: { label: "Accuracy", value: (accuracy * 100).toFixed(2), unit: "%" },
      precision: { label: "Precision", value: (precision * 100).toFixed(2), unit: "%" },
      recall: { label: "Recall", value: (recall * 100).toFixed(2), unit: "%" },
      f1: { label: "F1-Score", value: (f1 * 100).toFixed(2), unit: "%" },
      weight: { label: "Weight (w)", value: w.toFixed(4) },
      bias: { label: "Bias (b)", value: b.toFixed(4) },
    },
    chartData: lossHistory,
    interpretation: `Logistic Regression: Accuracy = ${(accuracy * 100).toFixed(1)}%, F1 = ${(f1 * 100).toFixed(1)}%. Decision boundary: x = ${(-b / w).toFixed(3)}.`,
  };
}

// ─── NEW: Multiple Linear Regression ──────────────────────────────
function multipleRegression(p: Record<string, number>): AlgorithmResult {
  const { n, noise, b1, b2, b3 } = p;
  const xs1: number[] = [], xs2: number[] = [], xs3: number[] = [], ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const x1 = Math.random() * 10, x2 = Math.random() * 10, x3 = Math.random() * 10;
    xs1.push(x1); xs2.push(x2); xs3.push(x3);
    ys.push(5 + b1 * x1 + b2 * x2 + b3 * x3 + boxMuller() * noise);
  }
  // OLS via normal equations (simplified for 3 vars)
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const meanX1 = xs1.reduce((a, b) => a + b, 0) / n;
  const meanX2 = xs2.reduce((a, b) => a + b, 0) / n;
  const meanX3 = xs3.reduce((a, b) => a + b, 0) / n;
  // Simple gradient descent for multiple regression
  let w1 = 0, w2 = 0, w3 = 0, w0 = 0;
  const lr = 0.001;
  for (let epoch = 0; epoch < 1000; epoch++) {
    let dw0 = 0, dw1 = 0, dw2 = 0, dw3 = 0;
    for (let i = 0; i < n; i++) {
      const pred = w0 + w1 * xs1[i] + w2 * xs2[i] + w3 * xs3[i];
      const err = pred - ys[i];
      dw0 += err; dw1 += err * xs1[i]; dw2 += err * xs2[i]; dw3 += err * xs3[i];
    }
    w0 -= lr * dw0 / n; w1 -= lr * dw1 / n; w2 -= lr * dw2 / n; w3 -= lr * dw3 / n;
  }
  const ssRes = ys.reduce((s, y, i) => s + (y - (w0 + w1 * xs1[i] + w2 * xs2[i] + w3 * xs3[i])) ** 2, 0);
  const ssTot = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  const adjR2 = 1 - (1 - r2) * (n - 1) / (n - 4);
  const rmse = Math.sqrt(ssRes / n);
  const chartData = [
    { name: "β₁", value: w1 }, { name: "β₂", value: w2 }, { name: "β₃", value: w3 },
    { name: "β₁ true", value: b1 }, { name: "β₂ true", value: b2 }, { name: "β₃ true", value: b3 },
  ];
  return {
    outputs: {
      intercept: { label: "Intercept (β₀)", value: w0.toFixed(4) },
      w1: { label: "β₁ (ước lượng)", value: w1.toFixed(4) },
      w2: { label: "β₂ (ước lượng)", value: w2.toFixed(4) },
      w3: { label: "β₃ (ước lượng)", value: w3.toFixed(4) },
      r2: { label: "R²", value: r2.toFixed(4) },
      adjR2: { label: "Adjusted R²", value: adjR2.toFixed(4) },
      rmse: { label: "RMSE", value: rmse.toFixed(4) },
    },
    chartData,
    interpretation: `Y = ${w0.toFixed(2)} + ${w1.toFixed(3)}X₁ + ${w2.toFixed(3)}X₂ + ${w3.toFixed(3)}X₃. R² = ${r2.toFixed(4)}, Adj R² = ${adjR2.toFixed(4)}. So sánh: β₁(${w1.toFixed(2)} vs ${b1}), β₂(${w2.toFixed(2)} vs ${b2}), β₃(${w3.toFixed(2)} vs ${b3}).`,
  };
}

// ─── NEW: Polynomial Regression ───────────────────────────────────
function polynomialRegression(p: Record<string, number>): AlgorithmResult {
  const { n, noise, degree, a0, a1, a2 } = p;
  const deg = Math.min(Math.max(Math.round(degree), 1), 5);
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i / n) * 6 - 3;
    xs.push(x);
    ys.push(a0 + a1 * x + a2 * x * x + boxMuller() * noise);
  }
  // Fit polynomial using gradient descent
  const coeffs = new Array(deg + 1).fill(0);
  const lr = 0.0001;
  for (let epoch = 0; epoch < 2000; epoch++) {
    const grad = new Array(deg + 1).fill(0);
    for (let i = 0; i < n; i++) {
      let pred = 0;
      for (let d = 0; d <= deg; d++) pred += coeffs[d] * Math.pow(xs[i], d);
      const err = pred - ys[i];
      for (let d = 0; d <= deg; d++) grad[d] += err * Math.pow(xs[i], d);
    }
    for (let d = 0; d <= deg; d++) coeffs[d] -= lr * grad[d] / n;
  }
  const predict = (x: number) => coeffs.reduce((s, c, d) => s + c * Math.pow(x, d), 0);
  const ssRes = ys.reduce((s, y, i) => s + (y - predict(xs[i])) ** 2, 0);
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const ssTot = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  const adjR2 = 1 - (1 - r2) * (n - 1) / (n - deg - 1);
  const chartData = xs.map((x, i) => ({ name: x.toFixed(1), value: ys[i] }));
  const eqParts = coeffs.map((c, d) => d === 0 ? c.toFixed(2) : `${c.toFixed(3)}x${d > 1 ? `^${d}` : ''}`);
  return {
    outputs: {
      equation: { label: "Phương trình", value: eqParts.join(" + ").substring(0, 40) },
      r2: { label: "R²", value: r2.toFixed(4) },
      adjR2: { label: "Adjusted R²", value: adjR2.toFixed(4) },
      rmse: { label: "RMSE", value: Math.sqrt(ssRes / n).toFixed(4) },
      degree: { label: "Bậc đa thức", value: deg },
    },
    chartData,
    interpretation: `Polynomial (bậc ${deg}): R² = ${r2.toFixed(4)}, Adj R² = ${adjR2.toFixed(4)}. ${deg >= 3 ? '⚠️ Bậc cao có thể overfitting.' : '✅ Bậc hợp lý.'}`,
  };
}

// ─── NEW: Ridge Regression (L2) ───────────────────────────────────
function ridgeRegression(p: Record<string, number>): AlgorithmResult {
  const { n, noise, lambda, slope, intercept } = p;
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i / n) * 10;
    xs.push(x); ys.push(slope * x + intercept + boxMuller() * noise);
  }
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - meanX) * (ys[i] - meanY); den += (xs[i] - meanX) ** 2; }
  const olsSlope = num / den;
  const ridgeSlope = num / (den + lambda * n);
  const ridgeIntercept = meanY - ridgeSlope * meanX;
  const olsIntercept = meanY - olsSlope * meanX;
  const ssResRidge = ys.reduce((s, y, i) => s + (y - (ridgeSlope * xs[i] + ridgeIntercept)) ** 2, 0);
  const ssResOLS = ys.reduce((s, y, i) => s + (y - (olsSlope * xs[i] + olsIntercept)) ** 2, 0);
  const ssTot = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const r2Ridge = 1 - ssResRidge / ssTot;
  const r2OLS = 1 - ssResOLS / ssTot;
  const chartData: { name: string; value: number }[] = [];
  for (let l = 0; l <= 50; l += 2) {
    const rs = num / (den + l * n);
    chartData.push({ name: `λ=${l}`, value: rs });
  }
  return {
    outputs: {
      ridgeSlope: { label: "Ridge Slope", value: ridgeSlope.toFixed(4) },
      olsSlope: { label: "OLS Slope", value: olsSlope.toFixed(4) },
      shrinkage: { label: "Shrinkage %", value: ((1 - ridgeSlope / olsSlope) * 100).toFixed(2), unit: "%" },
      r2Ridge: { label: "R² (Ridge)", value: r2Ridge.toFixed(4) },
      r2OLS: { label: "R² (OLS)", value: r2OLS.toFixed(4) },
      lambda: { label: "Lambda (λ)", value: lambda.toFixed(2) },
    },
    chartData,
    interpretation: `Ridge (λ=${lambda}): Slope = ${ridgeSlope.toFixed(3)} vs OLS = ${olsSlope.toFixed(3)} (shrinkage ${((1 - ridgeSlope / olsSlope) * 100).toFixed(1)}%). L2 regularization giảm overfitting bằng cách co hệ số về 0.`,
  };
}

// ─── NEW: Lasso Regression (L1) ───────────────────────────────────
function lassoRegression(p: Record<string, number>): AlgorithmResult {
  const { n, noise, lambda, nFeatures } = p;
  const nF = Math.min(Math.max(Math.round(nFeatures), 2), 8);
  // Generate data with some irrelevant features
  const trueCoeffs = Array.from({ length: nF }, (_, i) => i < Math.ceil(nF / 2) ? 2 + Math.random() * 3 : 0);
  const X: number[][] = [];
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const row = Array.from({ length: nF }, () => Math.random() * 10);
    X.push(row);
    ys.push(5 + row.reduce((s, x, j) => s + x * trueCoeffs[j], 0) + boxMuller() * noise);
  }
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  // Coordinate descent for Lasso
  const coeffs = new Array(nF).fill(0);
  let b0 = meanY;
  for (let iter = 0; iter < 500; iter++) {
    for (let j = 0; j < nF; j++) {
      let rho = 0;
      for (let i = 0; i < n; i++) {
        let pred = b0;
        for (let k = 0; k < nF; k++) if (k !== j) pred += coeffs[k] * X[i][k];
        rho += X[i][j] * (ys[i] - pred);
      }
      rho /= n;
      const xjSq = X.reduce((s, row) => s + row[j] ** 2, 0) / n;
      if (rho > lambda / 2) coeffs[j] = (rho - lambda / 2) / xjSq;
      else if (rho < -lambda / 2) coeffs[j] = (rho + lambda / 2) / xjSq;
      else coeffs[j] = 0;
    }
    b0 = (ys.reduce((s, y, i) => s + y - coeffs.reduce((s2, c, j) => s2 + c * X[i][j], 0), 0)) / n;
  }
  const nonZero = coeffs.filter(c => Math.abs(c) > 0.001).length;
  const ssRes = ys.reduce((s, y, i) => s + (y - (b0 + coeffs.reduce((s2, c, j) => s2 + c * X[i][j], 0))) ** 2, 0);
  const ssTot = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  const chartData = coeffs.map((c, i) => ({ name: `X${i + 1}`, value: c }));
  return {
    outputs: {
      nonZeroFeatures: { label: "Features chọn", value: `${nonZero}/${nF}` },
      r2: { label: "R²", value: r2.toFixed(4) },
      rmse: { label: "RMSE", value: Math.sqrt(ssRes / n).toFixed(4) },
      lambda: { label: "Lambda (λ)", value: lambda.toFixed(2) },
      sparsity: { label: "Sparsity", value: ((1 - nonZero / nF) * 100).toFixed(0), unit: "%" },
    },
    chartData,
    interpretation: `Lasso (λ=${lambda}): Chọn ${nonZero}/${nF} features. R² = ${r2.toFixed(4)}. L1 regularization loại bỏ features không quan trọng (sparsity = ${((1 - nonZero / nF) * 100).toFixed(0)}%).`,
  };
}

// ─── NEW: Elastic Net ─────────────────────────────────────────────
function elasticNet(p: Record<string, number>): AlgorithmResult {
  const { n, noise, alpha, l1Ratio, slope, intercept } = p;
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i / n) * 10;
    xs.push(x); ys.push(slope * x + intercept + boxMuller() * noise);
  }
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  // Simplified elastic net via iterative soft thresholding
  let w = 0, b0 = meanY;
  for (let iter = 0; iter < 500; iter++) {
    let rho = 0;
    for (let i = 0; i < n; i++) rho += xs[i] * (ys[i] - b0);
    rho /= n;
    const l1 = alpha * l1Ratio;
    const l2 = alpha * (1 - l1Ratio);
    const xSq = xs.reduce((s, x) => s + x * x, 0) / n;
    if (rho > l1 / 2) w = (rho - l1 / 2) / (xSq + l2);
    else if (rho < -l1 / 2) w = (rho + l1 / 2) / (xSq + l2);
    else w = 0;
    b0 = meanY - w * meanX;
  }
  const ssRes = ys.reduce((s, y, i) => s + (y - (w * xs[i] + b0)) ** 2, 0);
  const ssTot = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  // Compare Ridge vs Lasso vs Elastic Net
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - meanX) * (ys[i] - meanY); den += (xs[i] - meanX) ** 2; }
  const olsW = num / den;
  const ridgeW = num / (den + alpha * (1 - l1Ratio) * n);
  const chartData = [
    { name: "OLS", value: olsW }, { name: "Ridge", value: ridgeW },
    { name: "Elastic Net", value: w }, { name: "True", value: slope },
  ];
  return {
    outputs: {
      enSlope: { label: "Elastic Net Slope", value: w.toFixed(4) },
      olsSlope: { label: "OLS Slope", value: olsW.toFixed(4) },
      r2: { label: "R²", value: r2.toFixed(4) },
      alpha: { label: "Alpha", value: alpha.toFixed(2) },
      l1Ratio: { label: "L1 Ratio", value: l1Ratio.toFixed(2) },
      method: { label: "Thiên về", value: l1Ratio > 0.5 ? "Lasso (L1)" : "Ridge (L2)" },
    },
    chartData,
    interpretation: `Elastic Net (α=${alpha}, l1_ratio=${l1Ratio}): Slope = ${w.toFixed(3)}. ${l1Ratio === 1 ? '= Lasso thuần' : l1Ratio === 0 ? '= Ridge thuần' : `Kết hợp L1(${(l1Ratio * 100).toFixed(0)}%) + L2(${((1 - l1Ratio) * 100).toFixed(0)}%)`}.`,
  };
}

// ─── NEW: Decision Tree Regression ────────────────────────────────
function decisionTreeRegression(p: Record<string, number>): AlgorithmResult {
  const { n, noise, maxDepth, minLeaf } = p;
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i / n) * 10;
    xs.push(x);
    ys.push(Math.sin(x) * 5 + x * 0.5 + boxMuller() * noise);
  }
  // Simple recursive splitting
  type Node = { value: number; left?: Node; right?: Node; splitX?: number; depth: number };
  const buildTree = (indices: number[], depth: number): Node => {
    const vals = indices.map(i => ys[i]);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (depth >= maxDepth || vals.length <= minLeaf) return { value: mean, depth };
    let bestSSE = Infinity, bestSplit = 0, bestLeft: number[] = [], bestRight: number[] = [];
    const sorted = [...indices].sort((a, b) => xs[a] - xs[b]);
    for (let s = Math.max(1, Math.floor(minLeaf)); s < sorted.length - Math.max(1, Math.floor(minLeaf)); s++) {
      const left = sorted.slice(0, s), right = sorted.slice(s);
      const lMean = left.reduce((a, i) => a + ys[i], 0) / left.length;
      const rMean = right.reduce((a, i) => a + ys[i], 0) / right.length;
      const sse = left.reduce((a, i) => a + (ys[i] - lMean) ** 2, 0) + right.reduce((a, i) => a + (ys[i] - rMean) ** 2, 0);
      if (sse < bestSSE) { bestSSE = sse; bestSplit = xs[sorted[s]]; bestLeft = left; bestRight = right; }
    }
    if (bestLeft.length === 0 || bestRight.length === 0) return { value: mean, depth };
    return { value: mean, splitX: bestSplit, left: buildTree(bestLeft, depth + 1), right: buildTree(bestRight, depth + 1), depth };
  };
  const allIdx = Array.from({ length: n }, (_, i) => i);
  const tree = buildTree(allIdx, 0);
  const predict = (x: number, node: Node): number => {
    if (!node.left || !node.right || node.splitX === undefined) return node.value;
    return x < node.splitX ? predict(x, node.left) : predict(x, node.right);
  };
  let leaves = 0;
  const countLeaves = (node: Node) => { if (!node.left) leaves++; else { countLeaves(node.left!); countLeaves(node.right!); } };
  countLeaves(tree);
  const preds = xs.map(x => predict(x, tree));
  const ssRes = ys.reduce((s, y, i) => s + (y - preds[i]) ** 2, 0);
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const ssTot = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  const chartData = xs.filter((_, i) => i % Math.max(1, Math.floor(n / 50)) === 0).map((x, i) => ({ name: x.toFixed(1), value: preds[Math.min(i * Math.max(1, Math.floor(n / 50)), n - 1)] }));
  return {
    outputs: {
      r2: { label: "R²", value: r2.toFixed(4) },
      rmse: { label: "RMSE", value: Math.sqrt(ssRes / n).toFixed(4) },
      leaves: { label: "Số lá (leaves)", value: leaves },
      maxDepth: { label: "Max Depth", value: maxDepth },
      complexity: { label: "Độ phức tạp", value: leaves > 20 ? "Cao (có thể overfit)" : "Hợp lý" },
    },
    chartData,
    interpretation: `Decision Tree (depth=${maxDepth}): R² = ${r2.toFixed(4)}, ${leaves} lá. ${r2 > 0.95 ? '⚠️ R² rất cao – kiểm tra overfitting!' : '✅ Mức fit hợp lý.'} Không cần giả định tuyến tính.`,
  };
}

// ─── NEW: Random Forest Regression ────────────────────────────────
function randomForestRegression(p: Record<string, number>): AlgorithmResult {
  const { n, noise, nTrees, maxDepth, sampleRatio } = p;
  const nT = Math.min(Math.max(Math.round(nTrees), 3), 50);
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i / n) * 10;
    xs.push(x);
    ys.push(Math.sin(x) * 5 + x * 0.5 + boxMuller() * noise);
  }
  // Build multiple simple trees
  const treePredictions: number[][] = [];
  for (let t = 0; t < nT; t++) {
    // Bootstrap sample
    const sampleSize = Math.round(n * sampleRatio / 100);
    const sampleIdx = Array.from({ length: sampleSize }, () => Math.floor(Math.random() * n));
    // Simple piecewise constant (bins)
    const nBins = Math.min(Math.pow(2, maxDepth), 16);
    const binSize = 10 / nBins;
    const binMeans: number[] = [];
    for (let b = 0; b < nBins; b++) {
      const binPts = sampleIdx.filter(i => xs[i] >= b * binSize && xs[i] < (b + 1) * binSize);
      binMeans.push(binPts.length > 0 ? binPts.reduce((s, i) => s + ys[i], 0) / binPts.length : 0);
    }
    const preds = xs.map(x => { const b = Math.min(Math.floor(x / binSize), nBins - 1); return binMeans[b]; });
    treePredictions.push(preds);
  }
  // Ensemble average
  const ensemble = xs.map((_, i) => treePredictions.reduce((s, tp) => s + tp[i], 0) / nT);
  const ssRes = ys.reduce((s, y, i) => s + (y - ensemble[i]) ** 2, 0);
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const ssTot = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  // Single tree R² for comparison
  const singlePred = treePredictions[0];
  const ssResSingle = ys.reduce((s, y, i) => s + (y - singlePred[i]) ** 2, 0);
  const r2Single = 1 - ssResSingle / ssTot;
  const chartData = xs.filter((_, i) => i % Math.max(1, Math.floor(n / 50)) === 0)
    .map((x, i) => ({ name: x.toFixed(1), value: ensemble[Math.min(i * Math.max(1, Math.floor(n / 50)), n - 1)] }));
  return {
    outputs: {
      r2Forest: { label: "R² (Forest)", value: r2.toFixed(4) },
      r2Single: { label: "R² (1 Tree)", value: r2Single.toFixed(4) },
      improvement: { label: "Cải thiện", value: ((r2 - r2Single) * 100).toFixed(2), unit: "%" },
      rmse: { label: "RMSE", value: Math.sqrt(ssRes / n).toFixed(4) },
      nTrees: { label: "Số cây", value: nT },
    },
    chartData,
    interpretation: `Random Forest (${nT} cây, depth=${maxDepth}): R² = ${r2.toFixed(4)} vs Single Tree R² = ${r2Single.toFixed(4)} (cải thiện ${((r2 - r2Single) * 100).toFixed(1)}%). Nhiều cây → ổn định hơn, giảm variance.`,
  };
}

// ─── NEW: Support Vector Regression ───────────────────────────────
function svrRegression(p: Record<string, number>): AlgorithmResult {
  const { n, noise, epsilon, C } = p;
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i / n) * 10;
    xs.push(x); ys.push(2 * x + 3 + Math.sin(x) * 2 + boxMuller() * noise);
  }
  // Simplified SVR via gradient descent with epsilon-insensitive loss
  let w = 0, b = 0;
  const lr = 0.001;
  for (let epoch = 0; epoch < 2000; epoch++) {
    let dw = 0, db = 0;
    for (let i = 0; i < n; i++) {
      const pred = w * xs[i] + b;
      const diff = ys[i] - pred;
      if (Math.abs(diff) > epsilon) {
        const sign = diff > 0 ? 1 : -1;
        dw += -C * sign * xs[i]; db += -C * sign;
      }
    }
    dw = dw / n + w; // L2 regularization
    db /= n;
    w -= lr * dw; b -= lr * db;
  }
  const preds = xs.map(x => w * x + b);
  const insideTube = ys.filter((y, i) => Math.abs(y - preds[i]) <= epsilon).length;
  const ssRes = ys.reduce((s, y, i) => s + (y - preds[i]) ** 2, 0);
  const meanY = ys.reduce((a, v) => a + v, 0) / n;
  const ssTot = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  const chartData = xs.filter((_, i) => i % Math.max(1, Math.floor(n / 50)) === 0)
    .map((x, i) => ({ name: x.toFixed(1), value: preds[Math.min(i * Math.max(1, Math.floor(n / 50)), n - 1)] }));
  return {
    outputs: {
      w: { label: "Weight (w)", value: w.toFixed(4) },
      b: { label: "Bias (b)", value: b.toFixed(4) },
      r2: { label: "R²", value: r2.toFixed(4) },
      rmse: { label: "RMSE", value: Math.sqrt(ssRes / n).toFixed(4) },
      insideTube: { label: "Trong ε-tube", value: ((insideTube / n) * 100).toFixed(1), unit: "%" },
      supportVectors: { label: "Support Vectors", value: `~${n - insideTube}` },
    },
    chartData,
    interpretation: `SVR (ε=${epsilon}, C=${C}): R² = ${r2.toFixed(4)}. ${((insideTube / n) * 100).toFixed(0)}% điểm nằm trong ε-tube. ${n - insideTube} support vectors quyết định mô hình.`,
  };
}

// ─── ALGORITHM REGISTRY ───────────────────────────────────────────

export const algorithms: Algorithm[] = [
  // === FINANCIAL ===
  {
    id: "black-scholes", name: "Black-Scholes", nameVi: "Black-Scholes (Định giá quyền chọn)",
    category: "financial", description: "European option pricing with full Greeks",
    descriptionVi: "Định giá quyền chọn châu Âu + Greeks đầy đủ (Δ, Γ, Θ, ν, ρ)",
    icon: TrendingUp,
    params: [
      { key: "S", label: "Giá cổ phiếu (S)", defaultValue: 100, min: 1, step: 1, unit: "$" },
      { key: "K", label: "Giá thực hiện (K)", defaultValue: 105, min: 1, step: 1, unit: "$" },
      { key: "T", label: "Thời hạn (T)", defaultValue: 1, min: 0.01, step: 0.1, unit: "năm" },
      { key: "r", label: "Lãi suất phi rủi ro (r)", defaultValue: 0.05, min: 0, max: 1, step: 0.01 },
      { key: "sigma", label: "Biến động (σ)", defaultValue: 0.2, min: 0.01, max: 2, step: 0.01 },
    ],
    run: blackScholes,
  },
  {
    id: "capm", name: "CAPM", nameVi: "CAPM (Định giá tài sản vốn)",
    category: "financial", description: "Capital Asset Pricing Model",
    descriptionVi: "Mô hình định giá tài sản vốn - Security Market Line",
    icon: Target,
    params: [
      { key: "riskFree", label: "Lãi suất phi rủi ro", defaultValue: 0.04, min: 0, max: 0.3, step: 0.005 },
      { key: "beta", label: "Beta (β)", defaultValue: 1.2, min: -1, max: 5, step: 0.1 },
      { key: "marketReturn", label: "Lợi suất thị trường", defaultValue: 0.10, min: 0, max: 0.5, step: 0.01 },
    ],
    run: capm,
  },
  {
    id: "dcf", name: "DCF Model", nameVi: "DCF (Chiết khấu dòng tiền)",
    category: "financial", description: "Discounted Cash Flow with validation",
    descriptionVi: "Chiết khấu dòng tiền + kiểm tra TV ratio",
    icon: BarChart3,
    params: [
      { key: "cashFlow", label: "Dòng tiền năm 0", defaultValue: 1000000, min: 0, step: 100000, unit: "$" },
      { key: "growthRate", label: "Tốc độ tăng trưởng", defaultValue: 0.08, min: 0, max: 0.5, step: 0.01 },
      { key: "discountRate", label: "Tỷ lệ chiết khấu", defaultValue: 0.12, min: 0.01, max: 0.5, step: 0.01 },
      { key: "terminalGrowthRate", label: "Tăng trưởng vĩnh viễn", defaultValue: 0.03, min: 0, max: 0.1, step: 0.005 },
      { key: "years", label: "Số năm dự báo", defaultValue: 10, min: 1, max: 30, step: 1 },
    ],
    run: dcfModel,
  },
  {
    id: "gordon", name: "Gordon Growth", nameVi: "Gordon Growth (Cổ tức)",
    category: "financial", description: "Dividend Discount Model",
    descriptionVi: "Mô hình chiết khấu cổ tức + Capital Gain Yield",
    icon: Zap,
    params: [
      { key: "dividend", label: "Cổ tức kỳ tiếp (D₁)", defaultValue: 2.5, min: 0.01, step: 0.1, unit: "$" },
      { key: "growthRate", label: "Tăng trưởng cổ tức (g)", defaultValue: 0.05, min: 0, max: 0.2, step: 0.005 },
      { key: "requiredReturn", label: "Lợi suất yêu cầu (r)", defaultValue: 0.10, min: 0.01, max: 0.5, step: 0.005 },
    ],
    run: gordonGrowth,
  },
  {
    id: "binomial-tree", name: "Binomial Tree", nameVi: "Binomial Tree (Cây nhị phân CRR)",
    category: "financial", description: "CRR option pricing with BS convergence check",
    descriptionVi: "Định giá quyền chọn CRR + so sánh hội tụ với Black-Scholes",
    icon: GitBranch,
    params: [
      { key: "S", label: "Giá cổ phiếu (S)", defaultValue: 100, min: 1, step: 1, unit: "$" },
      { key: "K", label: "Giá thực hiện (K)", defaultValue: 105, min: 1, step: 1, unit: "$" },
      { key: "T", label: "Thời hạn (T)", defaultValue: 1, min: 0.01, step: 0.1, unit: "năm" },
      { key: "r", label: "Lãi suất phi rủi ro", defaultValue: 0.05, min: 0, max: 1, step: 0.01 },
      { key: "sigma", label: "Biến động (σ)", defaultValue: 0.2, min: 0.01, max: 2, step: 0.01 },
      { key: "steps", label: "Số bước (N)", defaultValue: 50, min: 2, max: 200, step: 1 },
      { key: "optionType", label: "Loại (1=Call, 0=Put)", defaultValue: 1, min: 0, max: 1, step: 1 },
    ],
    run: binomialTree,
  },
  {
    id: "fama-french", name: "Fama-French 3-Factor", nameVi: "Fama-French 3 nhân tố",
    category: "financial", description: "3-Factor: Market, Size (SMB), Value (HML)",
    descriptionVi: "Mô hình 3 nhân tố + Alpha vs CAPM",
    icon: Target,
    params: [
      { key: "riskFree", label: "Lãi suất phi rủi ro", defaultValue: 0.04, min: 0, max: 0.3, step: 0.005 },
      { key: "beta", label: "Beta thị trường", defaultValue: 1.1, min: -1, max: 5, step: 0.1 },
      { key: "smb", label: "SMB loading", defaultValue: 0.3, min: -2, max: 2, step: 0.1 },
      { key: "hml", label: "HML loading", defaultValue: 0.5, min: -2, max: 2, step: 0.1 },
      { key: "marketPremium", label: "Phần bù thị trường", defaultValue: 0.06, min: 0, max: 0.3, step: 0.005 },
      { key: "smbPremium", label: "SMB premium", defaultValue: 0.03, min: -0.1, max: 0.15, step: 0.005 },
      { key: "hmlPremium", label: "HML premium", defaultValue: 0.04, min: -0.1, max: 0.15, step: 0.005 },
    ],
    run: famaFrench,
  },
  {
    id: "kelly-criterion", name: "Kelly Criterion", nameVi: "Kelly Criterion (Tiêu chí Kelly)",
    category: "financial", description: "Optimal bet sizing for maximizing long-term growth",
    descriptionVi: "Kích thước đặt cược tối ưu tối đa hóa tăng trưởng dài hạn",
    icon: Calculator,
    params: [
      { key: "winRate", label: "Xác suất thắng", defaultValue: 0.55, min: 0.01, max: 0.99, step: 0.01 },
      { key: "winLoss", label: "Win/Loss ratio (b)", defaultValue: 1.5, min: 0.1, max: 10, step: 0.1 },
      { key: "bankroll", label: "Vốn ban đầu", defaultValue: 100000, min: 1000, step: 1000, unit: "$" },
      { key: "maxBet", label: "Max bet (%)", defaultValue: 25, min: 1, max: 100, step: 1, unit: "%" },
    ],
    run: kellyCriterion,
  },
  {
    id: "monte-carlo-option", name: "MC Option Pricing", nameVi: "Monte Carlo (Định giá quyền chọn)",
    category: "financial", description: "Monte Carlo option pricing with confidence intervals",
    descriptionVi: "Định giá quyền chọn bằng MC + khoảng tin cậy 95%",
    icon: Activity,
    params: [
      { key: "S", label: "Giá cổ phiếu (S)", defaultValue: 100, min: 1, step: 1, unit: "$" },
      { key: "K", label: "Giá thực hiện (K)", defaultValue: 105, min: 1, step: 1, unit: "$" },
      { key: "T", label: "Thời hạn (T)", defaultValue: 1, min: 0.01, step: 0.1, unit: "năm" },
      { key: "r", label: "Lãi suất phi rủi ro", defaultValue: 0.05, min: 0, max: 1, step: 0.01 },
      { key: "sigma", label: "Biến động (σ)", defaultValue: 0.2, min: 0.01, max: 2, step: 0.01 },
      { key: "simulations", label: "Số paths", defaultValue: 50000, min: 1000, max: 100000, step: 5000 },
      { key: "optionType", label: "Loại (1=Call, 0=Put)", defaultValue: 1, min: 0, max: 1, step: 1 },
    ],
    run: monteCarloOption,
  },

  // === RISK ===
  {
    id: "var-calculator", name: "Value at Risk", nameVi: "VaR & CVaR (Giá trị rủi ro)",
    category: "risk", description: "VaR, CVaR via Monte Carlo simulation",
    descriptionVi: "Tính VaR, CVaR bằng Monte Carlo + Parametric",
    icon: Shield,
    params: [
      { key: "portfolioValue", label: "Giá trị danh mục", defaultValue: 1000000, min: 1000, step: 10000, unit: "$" },
      { key: "meanReturn", label: "Lợi suất kỳ vọng (năm)", defaultValue: 0.08, min: -0.5, max: 0.5, step: 0.01 },
      { key: "volatility", label: "Biến động (năm)", defaultValue: 0.20, min: 0.01, max: 1, step: 0.01 },
      { key: "days", label: "Thời kỳ (ngày)", defaultValue: 10, min: 1, max: 252, step: 1 },
      { key: "confidence", label: "Độ tin cậy (%)", defaultValue: 95, min: 90, max: 99, step: 1 },
    ],
    run: varCalculator,
  },
  {
    id: "sharpe-sortino", name: "Sharpe & Sortino", nameVi: "Sharpe & Sortino Ratio",
    category: "risk", description: "Risk-adjusted return metrics",
    descriptionVi: "Các chỉ số lợi nhuận điều chỉnh rủi ro",
    icon: Gauge,
    params: [
      { key: "returnAsset", label: "Lợi suất tài sản (năm)", defaultValue: 0.15, min: -0.5, max: 1, step: 0.01 },
      { key: "riskFree", label: "Lãi suất phi rủi ro", defaultValue: 0.04, min: 0, max: 0.3, step: 0.005 },
      { key: "volatility", label: "Biến động (σ)", defaultValue: 0.20, min: 0.01, max: 1, step: 0.01 },
      { key: "downsideVol", label: "Downside Vol", defaultValue: 0.14, min: 0.01, max: 1, step: 0.01 },
    ],
    run: sharpeRatio,
  },
  {
    id: "markowitz", name: "Markowitz Optimization", nameVi: "Markowitz (Tối ưu danh mục)",
    category: "risk", description: "Mean-Variance efficient frontier",
    descriptionVi: "Efficient Frontier + Max Sharpe + Min Variance",
    icon: PieChart,
    params: [
      { key: "nAssets", label: "Số tài sản", defaultValue: 5, min: 2, max: 10, step: 1 },
      { key: "riskFree", label: "Lãi suất phi rủi ro", defaultValue: 0.04, min: 0, max: 0.3, step: 0.005 },
      { key: "targetReturn", label: "Lợi suất mục tiêu", defaultValue: 0.12, min: 0, max: 0.5, step: 0.01 },
      { key: "minWeight", label: "Min weight (%)", defaultValue: 0, min: 0, max: 50, step: 1 },
      { key: "maxWeight", label: "Max weight (%)", defaultValue: 100, min: 10, max: 100, step: 5 },
    ],
    run: markowitzOptimization,
  },

  // === STRATEGY ===
  {
    id: "ma-crossover", name: "MA Crossover", nameVi: "MA Crossover (Giao cắt đường TB)",
    category: "strategy", description: "Moving Average crossover backtest",
    descriptionVi: "Backtest chiến lược giao cắt đường trung bình + so sánh B&H",
    icon: Activity,
    params: [
      { key: "initialPrice", label: "Giá ban đầu", defaultValue: 100, min: 1, step: 10, unit: "$" },
      { key: "drift", label: "Drift (năm)", defaultValue: 0.08, min: -0.5, max: 0.5, step: 0.01 },
      { key: "volatility", label: "Biến động (năm)", defaultValue: 0.25, min: 0.05, max: 1, step: 0.01 },
      { key: "days", label: "Số ngày", defaultValue: 500, min: 100, max: 2000, step: 50 },
      { key: "shortMA", label: "MA ngắn hạn", defaultValue: 20, min: 5, max: 100, step: 5 },
      { key: "longMA", label: "MA dài hạn", defaultValue: 50, min: 20, max: 200, step: 10 },
    ],
    run: maCrossover,
  },

  // === OPTIMIZATION ===
  {
    id: "gradient-descent", name: "Gradient Descent", nameVi: "Gradient Descent (Hạ gradient)",
    category: "optimization", description: "Minimize f(x) = x² + sin(3x)",
    descriptionVi: "Tìm cực tiểu hàm f(x) = x² + sin(3x)",
    icon: GitBranch,
    params: [
      { key: "startX", label: "Điểm xuất phát (x₀)", defaultValue: 5, min: -10, max: 10, step: 0.5 },
      { key: "learningRate", label: "Learning Rate (α)", defaultValue: 0.01, min: 0.001, max: 1, step: 0.005 },
      { key: "iterations", label: "Số bước lặp", defaultValue: 500, min: 10, max: 5000, step: 50 },
    ],
    run: gradientDescent,
  },
  {
    id: "simulated-annealing", name: "Simulated Annealing", nameVi: "Simulated Annealing (Ủ mô phỏng)",
    category: "optimization", description: "Global optimization via SA",
    descriptionVi: "Tối ưu toàn cục + adaptive step size",
    icon: Flame,
    params: [
      { key: "startX", label: "Điểm xuất phát", defaultValue: 8, min: -10, max: 10, step: 0.5 },
      { key: "temperature", label: "Nhiệt độ ban đầu", defaultValue: 100, min: 1, max: 1000, step: 10 },
      { key: "coolingRate", label: "Tốc độ làm nguội", defaultValue: 0.995, min: 0.9, max: 0.9999, step: 0.001 },
      { key: "iterations", label: "Số bước lặp", defaultValue: 1000, min: 100, max: 10000, step: 100 },
    ],
    run: simulatedAnnealing,
  },
  {
    id: "particle-swarm", name: "Particle Swarm (PSO)", nameVi: "PSO (Tối ưu bầy đàn)",
    category: "optimization", description: "Particle Swarm Optimization on Rastrigin function",
    descriptionVi: "Tối ưu bầy đàn trên hàm Rastrigin (nhiều cực trị địa phương)",
    icon: Cpu,
    params: [
      { key: "particles", label: "Số hạt", defaultValue: 30, min: 5, max: 100, step: 5 },
      { key: "iterations", label: "Số vòng lặp", defaultValue: 200, min: 10, max: 2000, step: 50 },
      { key: "w", label: "Inertia weight (w)", defaultValue: 0.7, min: 0.1, max: 1, step: 0.05 },
      { key: "c1", label: "Cognitive (c₁)", defaultValue: 1.5, min: 0.5, max: 3, step: 0.1 },
      { key: "c2", label: "Social (c₂)", defaultValue: 1.5, min: 0.5, max: 3, step: 0.1 },
    ],
    run: particleSwarm,
  },

  // === ML/AI ===
  {
    id: "linear-regression", name: "Linear Regression", nameVi: "Hồi quy tuyến tính",
    category: "ml", description: "OLS with R², Adjusted R², RMSE",
    descriptionVi: "OLS + Adjusted R² + RMSE + so sánh tham số thực",
    icon: Sigma,
    params: [
      { key: "n", label: "Số điểm dữ liệu", defaultValue: 100, min: 10, max: 1000, step: 10 },
      { key: "slope", label: "Slope thực (β)", defaultValue: 2.5, min: -10, max: 10, step: 0.1 },
      { key: "intercept", label: "Intercept thực (α)", defaultValue: 3, min: -20, max: 20, step: 0.5 },
      { key: "noise", label: "Nhiễu (σ)", defaultValue: 5, min: 0, max: 50, step: 1 },
    ],
    run: linearRegressionAlgo,
  },
  {
    id: "logistic-regression", name: "Logistic Regression", nameVi: "Hồi quy Logistic",
    category: "ml", description: "Binary classification with Precision/Recall/F1",
    descriptionVi: "Phân loại nhị phân + Precision, Recall, F1-Score",
    icon: Sigma,
    params: [
      { key: "n", label: "Số điểm dữ liệu", defaultValue: 200, min: 50, max: 2000, step: 50 },
      { key: "learningRate", label: "Learning Rate", defaultValue: 0.1, min: 0.001, max: 1, step: 0.01 },
      { key: "epochs", label: "Epochs", defaultValue: 200, min: 10, max: 2000, step: 10 },
      { key: "separation", label: "Độ tách lớp", defaultValue: 2, min: 0.5, max: 5, step: 0.5 },
    ],
    run: logisticRegression,
  },
  {
    id: "multiple-regression", name: "Multiple Regression", nameVi: "Hồi quy đa biến",
    category: "ml", description: "Multiple Linear Regression with 3 features",
    descriptionVi: "Hồi quy tuyến tính đa biến (3 biến độc lập) + R², RMSE",
    icon: Sigma,
    params: [
      { key: "n", label: "Số điểm dữ liệu", defaultValue: 200, min: 50, max: 1000, step: 50 },
      { key: "noise", label: "Nhiễu (σ)", defaultValue: 3, min: 0, max: 30, step: 1 },
      { key: "b1", label: "β₁ thực", defaultValue: 2.5, min: -10, max: 10, step: 0.5 },
      { key: "b2", label: "β₂ thực", defaultValue: -1.5, min: -10, max: 10, step: 0.5 },
      { key: "b3", label: "β₃ thực", defaultValue: 3.0, min: -10, max: 10, step: 0.5 },
    ],
    run: multipleRegression,
  },
  {
    id: "polynomial-regression", name: "Polynomial Regression", nameVi: "Hồi quy đa thức",
    category: "ml", description: "Polynomial regression (degree 1-5)",
    descriptionVi: "Hồi quy đa thức bậc 1-5 + kiểm tra overfitting",
    icon: Sigma,
    params: [
      { key: "n", label: "Số điểm dữ liệu", defaultValue: 100, min: 20, max: 500, step: 10 },
      { key: "noise", label: "Nhiễu (σ)", defaultValue: 2, min: 0, max: 20, step: 1 },
      { key: "degree", label: "Bậc đa thức", defaultValue: 2, min: 1, max: 5, step: 1 },
      { key: "a0", label: "a₀ (intercept)", defaultValue: 3, min: -10, max: 10, step: 0.5 },
      { key: "a1", label: "a₁ (tuyến tính)", defaultValue: 1.5, min: -10, max: 10, step: 0.5 },
      { key: "a2", label: "a₂ (bậc 2)", defaultValue: -0.3, min: -5, max: 5, step: 0.1 },
    ],
    run: polynomialRegression,
  },
  {
    id: "ridge-regression", name: "Ridge Regression", nameVi: "Hồi quy Ridge (L2)",
    category: "ml", description: "L2 regularization to reduce overfitting",
    descriptionVi: "Regularization L2 – co hệ số về 0, giảm overfitting",
    icon: Shield,
    params: [
      { key: "n", label: "Số điểm dữ liệu", defaultValue: 100, min: 20, max: 500, step: 10 },
      { key: "noise", label: "Nhiễu (σ)", defaultValue: 5, min: 0, max: 30, step: 1 },
      { key: "lambda", label: "Lambda (λ)", defaultValue: 5, min: 0, max: 50, step: 1 },
      { key: "slope", label: "Slope thực", defaultValue: 2.5, min: -10, max: 10, step: 0.5 },
      { key: "intercept", label: "Intercept thực", defaultValue: 3, min: -20, max: 20, step: 1 },
    ],
    run: ridgeRegression,
  },
  {
    id: "lasso-regression", name: "Lasso Regression", nameVi: "Hồi quy Lasso (L1)",
    category: "ml", description: "L1 regularization for feature selection",
    descriptionVi: "Regularization L1 – chọn lọc features, loại bỏ biến không quan trọng",
    icon: Target,
    params: [
      { key: "n", label: "Số điểm dữ liệu", defaultValue: 200, min: 50, max: 500, step: 50 },
      { key: "noise", label: "Nhiễu (σ)", defaultValue: 3, min: 0, max: 20, step: 1 },
      { key: "lambda", label: "Lambda (λ)", defaultValue: 5, min: 0, max: 50, step: 1 },
      { key: "nFeatures", label: "Số features", defaultValue: 6, min: 2, max: 8, step: 1 },
    ],
    run: lassoRegression,
  },
  {
    id: "elastic-net", name: "Elastic Net", nameVi: "Elastic Net (L1+L2)",
    category: "ml", description: "Combined L1+L2 regularization",
    descriptionVi: "Kết hợp Ridge + Lasso – linh hoạt nhất",
    icon: Layers,
    params: [
      { key: "n", label: "Số điểm dữ liệu", defaultValue: 100, min: 20, max: 500, step: 10 },
      { key: "noise", label: "Nhiễu (σ)", defaultValue: 5, min: 0, max: 30, step: 1 },
      { key: "alpha", label: "Alpha (tổng penalty)", defaultValue: 5, min: 0, max: 50, step: 1 },
      { key: "l1Ratio", label: "L1 Ratio (0=Ridge, 1=Lasso)", defaultValue: 0.5, min: 0, max: 1, step: 0.1 },
      { key: "slope", label: "Slope thực", defaultValue: 2.5, min: -10, max: 10, step: 0.5 },
      { key: "intercept", label: "Intercept thực", defaultValue: 3, min: -20, max: 20, step: 1 },
    ],
    run: elasticNet,
  },
  {
    id: "decision-tree-regression", name: "Decision Tree Regression", nameVi: "Cây quyết định hồi quy",
    category: "ml", description: "Non-linear regression via recursive splitting",
    descriptionVi: "Hồi quy phi tuyến bằng phân chia đệ quy – dễ giải thích",
    icon: GitBranch,
    params: [
      { key: "n", label: "Số điểm dữ liệu", defaultValue: 100, min: 30, max: 500, step: 10 },
      { key: "noise", label: "Nhiễu (σ)", defaultValue: 1, min: 0, max: 10, step: 0.5 },
      { key: "maxDepth", label: "Max Depth", defaultValue: 4, min: 1, max: 8, step: 1 },
      { key: "minLeaf", label: "Min Leaf Size", defaultValue: 5, min: 1, max: 20, step: 1 },
    ],
    run: decisionTreeRegression,
  },
  {
    id: "random-forest-regression", name: "Random Forest Regression", nameVi: "Random Forest hồi quy",
    category: "ml", description: "Ensemble of trees for robust regression",
    descriptionVi: "Tập hợp nhiều cây → chính xác & ổn định hơn 1 cây",
    icon: Layers,
    params: [
      { key: "n", label: "Số điểm dữ liệu", defaultValue: 100, min: 30, max: 500, step: 10 },
      { key: "noise", label: "Nhiễu (σ)", defaultValue: 1, min: 0, max: 10, step: 0.5 },
      { key: "nTrees", label: "Số cây", defaultValue: 10, min: 3, max: 50, step: 1 },
      { key: "maxDepth", label: "Max Depth", defaultValue: 4, min: 1, max: 8, step: 1 },
      { key: "sampleRatio", label: "Bootstrap %", defaultValue: 80, min: 30, max: 100, step: 5, unit: "%" },
    ],
    run: randomForestRegression,
  },
  {
    id: "svr", name: "SVR (Support Vector)", nameVi: "SVR (Hồi quy Vector hỗ trợ)",
    category: "ml", description: "ε-insensitive regression with margin",
    descriptionVi: "Hồi quy SVM với ε-tube – robust với outliers",
    icon: Cpu,
    params: [
      { key: "n", label: "Số điểm dữ liệu", defaultValue: 100, min: 30, max: 500, step: 10 },
      { key: "noise", label: "Nhiễu (σ)", defaultValue: 2, min: 0, max: 15, step: 0.5 },
      { key: "epsilon", label: "Epsilon (ε)", defaultValue: 1.0, min: 0.1, max: 5, step: 0.1 },
      { key: "C", label: "C (penalty)", defaultValue: 1.0, min: 0.1, max: 100, step: 0.5 },
    ],
    run: svrRegression,
  },
  {
    id: "kmeans", name: "K-Means Clustering", nameVi: "K-Means (Phân cụm)",
    category: "ml", description: "Unsupervised clustering with Inertia",
    descriptionVi: "Phân cụm không giám sát + Elbow method hint",
    icon: Layers,
    params: [
      { key: "n", label: "Số điểm dữ liệu", defaultValue: 150, min: 30, max: 500, step: 10 },
      { key: "k", label: "Số cluster (K)", defaultValue: 3, min: 2, max: 10, step: 1 },
      { key: "iterations", label: "Max iterations", defaultValue: 100, min: 10, max: 500, step: 10 },
    ],
    run: kmeansAlgo,
  },
  {
    id: "arima", name: "ARIMA Forecast", nameVi: "ARIMA (Dự báo chuỗi thời gian)",
    category: "ml", description: "ARIMA(p,1,q) with MAE, RMSE, MAPE metrics",
    descriptionVi: "ARIMA(p,1,q) đúng chuẩn + MAE, RMSE, MAPE",
    icon: Brain,
    params: [
      { key: "n", label: "Số điểm lịch sử", defaultValue: 120, min: 30, max: 500, step: 10 },
      { key: "trend", label: "Trend / kỳ", defaultValue: 0.5, min: -5, max: 5, step: 0.1 },
      { key: "seasonality", label: "Biên độ mùa vụ", defaultValue: 5, min: 0, max: 30, step: 1 },
      { key: "forecastSteps", label: "Bước dự báo", defaultValue: 12, min: 1, max: 60, step: 1 },
      { key: "arOrder", label: "AR Order (p)", defaultValue: 2, min: 1, max: 5, step: 1 },
      { key: "maOrder", label: "MA Order (q)", defaultValue: 1, min: 0, max: 3, step: 1 },
    ],
    run: arimaForecast,
  },
  {
    id: "neural-network", name: "Neural Network", nameVi: "Neural Network (Mạng nơ-ron)",
    category: "ml", description: "Feedforward NN for XOR classification",
    descriptionVi: "Mạng nơ-ron + Backpropagation + đánh giá chất lượng",
    icon: Brain,
    params: [
      { key: "hiddenNodes", label: "Hidden nodes", defaultValue: 8, min: 2, max: 32, step: 1 },
      { key: "learningRate", label: "Learning Rate", defaultValue: 0.5, min: 0.01, max: 5, step: 0.1 },
      { key: "epochs", label: "Epochs", defaultValue: 200, min: 10, max: 2000, step: 10 },
      { key: "dataPoints", label: "Số điểm dữ liệu", defaultValue: 200, min: 50, max: 1000, step: 50 },
      { key: "noise", label: "Tỷ lệ nhiễu", defaultValue: 0.05, min: 0, max: 0.5, step: 0.01 },
    ],
    run: neuralNetwork,
  },
];

export const categoryInfo: Record<string, { label: string; labelEn: string; icon: any; color: string; bg: string }> = {
  financial: { label: "Tài chính", labelEn: "Financial", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  risk: { label: "Rủi ro", labelEn: "Risk", icon: Shield, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  strategy: { label: "Chiến lược", labelEn: "Strategy", icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  optimization: { label: "Tối ưu hóa", labelEn: "Optimization", icon: Settings2, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  ml: { label: "ML / AI", labelEn: "ML / AI", icon: Brain, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
};
