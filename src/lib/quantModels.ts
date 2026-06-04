// Lightweight TypeScript implementations of classical quant models.
// CAPM, Black-Scholes-Merton, AR(p) (ARIMA family without integration), GARCH(1,1) MLE.

function mean(x: number[]) { return x.reduce((a, b) => a + b, 0) / Math.max(1, x.length); }
function variance(x: number[]) { const m = mean(x); return x.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, x.length - 1); }
function std(x: number[]) { return Math.sqrt(variance(x)); }

// ---------- CAPM ----------
export interface CAPMResult {
  beta: number;
  alpha: number;            // annualized
  expectedReturn: number;   // annualized E[R] via CAPM
  riskPremium: number;
  rSquared: number;
}

export function capm(
  assetDaily: number[],
  marketDaily: number[],
  riskFreeRate = 0.04,
  expectedMarketReturn = 0.10,
): CAPMResult {
  const n = Math.min(assetDaily.length, marketDaily.length);
  const a = assetDaily.slice(0, n);
  const m = marketDaily.slice(0, n);
  const ma = mean(a); const mm = mean(m);
  let cov = 0, vm = 0, va = 0;
  for (let i = 0; i < n; i++) {
    cov += (a[i] - ma) * (m[i] - mm);
    vm += (m[i] - mm) ** 2;
    va += (a[i] - ma) ** 2;
  }
  cov /= Math.max(1, n - 1); vm /= Math.max(1, n - 1); va /= Math.max(1, n - 1);
  const beta = vm > 0 ? cov / vm : 1;
  // annualized intercept of regression of excess returns
  const rfDaily = riskFreeRate / 252;
  const alphaDaily = (ma - rfDaily) - beta * (mm - rfDaily);
  const alpha = alphaDaily * 252;
  const expectedReturn = riskFreeRate + beta * (expectedMarketReturn - riskFreeRate);
  const rSquared = (vm * va) > 0 ? (cov * cov) / (vm * va) : 0;
  return { beta, alpha, expectedReturn, riskPremium: expectedMarketReturn - riskFreeRate, rSquared };
}

// ---------- Black-Scholes-Merton ----------
function normCdf(x: number) {
  // Abramowitz & Stegun 26.2.17
  const b1 = 0.319381530, b2 = -0.356563782, b3 = 1.781477937, b4 = -1.821255978, b5 = 1.330274429;
  const p = 0.2316419;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + p * ax);
  const pdf = Math.exp(-0.5 * ax * ax) / Math.sqrt(2 * Math.PI);
  const poly = ((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t;
  const cdf = 1 - pdf * poly;
  return sign === 1 ? cdf : 1 - cdf;
}
function normPdf(x: number) { return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI); }

export interface BSResult {
  callPrice: number; putPrice: number;
  d1: number; d2: number;
  greeks: { deltaCall: number; deltaPut: number; gamma: number; vega: number; thetaCall: number; thetaPut: number; rhoCall: number; rhoPut: number };
}

export function blackScholes(S: number, K: number, T: number, r: number, sigma: number, q = 0): BSResult {
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    const intrinsicC = Math.max(0, S - K);
    const intrinsicP = Math.max(0, K - S);
    return { callPrice: intrinsicC, putPrice: intrinsicP, d1: 0, d2: 0,
      greeks: { deltaCall: 0, deltaPut: 0, gamma: 0, vega: 0, thetaCall: 0, thetaPut: 0, rhoCall: 0, rhoPut: 0 } };
  }
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const Nd1 = normCdf(d1), Nd2 = normCdf(d2);
  const callPrice = S * Math.exp(-q * T) * Nd1 - K * Math.exp(-r * T) * Nd2;
  const putPrice = K * Math.exp(-r * T) * normCdf(-d2) - S * Math.exp(-q * T) * normCdf(-d1);
  const pdf = normPdf(d1);
  const gamma = (Math.exp(-q * T) * pdf) / (S * sigma * Math.sqrt(T));
  const vega = S * Math.exp(-q * T) * pdf * Math.sqrt(T) / 100; // per 1% vol
  const thetaCall = (-(S * pdf * sigma * Math.exp(-q * T)) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * Nd2 + q * S * Math.exp(-q * T) * Nd1) / 365;
  const thetaPut = (-(S * pdf * sigma * Math.exp(-q * T)) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * normCdf(-d2) - q * S * Math.exp(-q * T) * normCdf(-d1)) / 365;
  const rhoCall = (K * T * Math.exp(-r * T) * Nd2) / 100;
  const rhoPut = (-K * T * Math.exp(-r * T) * normCdf(-d2)) / 100;
  return {
    callPrice, putPrice, d1, d2,
    greeks: { deltaCall: Math.exp(-q * T) * Nd1, deltaPut: Math.exp(-q * T) * (Nd1 - 1), gamma, vega, thetaCall, thetaPut, rhoCall, rhoPut },
  };
}

// ---------- AR(p) (ARIMA simplification, d=0) ----------
export interface ARResult {
  order: number;
  coefficients: number[]; // [c, phi1, phi2, ...]
  residualStd: number;
  forecast: number[];
  fitted: number[];
}

// OLS on lagged design matrix using normal equations.
export function arFit(series: number[], p = 2, horizon = 20): ARResult {
  const n = series.length;
  if (n < p + 5) {
    return { order: p, coefficients: [mean(series)], residualStd: std(series), forecast: Array(horizon).fill(mean(series)), fitted: [] };
  }
  const rows = n - p;
  // Design matrix X[rows x (p+1)] with first col = 1, then lagged values; y = series[p..n-1]
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = p; i < n; i++) {
    const row = [1];
    for (let k = 1; k <= p; k++) row.push(series[i - k]);
    X.push(row);
    y.push(series[i]);
  }
  // Compute X^T X and X^T y
  const k = p + 1;
  const XtX = Array.from({ length: k }, () => new Array(k).fill(0));
  const Xty = new Array(k).fill(0);
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < k; i++) {
      Xty[i] += X[r][i] * y[r];
      for (let j = 0; j < k; j++) XtX[i][j] += X[r][i] * X[r][j];
    }
  }
  // Solve via Gauss-Jordan
  const A = XtX.map((row, i) => [...row, Xty[i]]);
  for (let i = 0; i < k; i++) {
    let pivot = A[i][i];
    if (Math.abs(pivot) < 1e-12) {
      // swap row
      for (let r = i + 1; r < k; r++) {
        if (Math.abs(A[r][i]) > 1e-12) { [A[i], A[r]] = [A[r], A[i]]; pivot = A[i][i]; break; }
      }
    }
    if (Math.abs(pivot) < 1e-12) continue;
    for (let j = 0; j <= k; j++) A[i][j] /= pivot;
    for (let r = 0; r < k; r++) {
      if (r === i) continue;
      const f = A[r][i];
      for (let j = 0; j <= k; j++) A[r][j] -= f * A[i][j];
    }
  }
  const coef = A.map(row => row[k]);
  // residuals
  const fitted: number[] = [];
  let ss = 0;
  for (let r = 0; r < rows; r++) {
    let yhat = coef[0];
    for (let j = 1; j < k; j++) yhat += coef[j] * X[r][j];
    fitted.push(yhat);
    ss += (y[r] - yhat) ** 2;
  }
  const resStd = Math.sqrt(ss / Math.max(1, rows - k));
  // Recursive forecast
  const last = series.slice(-p);
  const forecast: number[] = [];
  for (let h = 0; h < horizon; h++) {
    let f = coef[0];
    for (let j = 1; j <= p; j++) f += coef[j] * last[last.length - j];
    forecast.push(f);
    last.push(f);
  }
  return { order: p, coefficients: coef, residualStd: resStd, forecast, fitted };
}

// ---------- GARCH(1,1) ----------
export interface GARCHResult {
  omega: number; alpha: number; beta: number;
  unconditionalVar: number;
  conditionalVar: number[];     // sigma^2_t
  volatilityForecast: number[]; // sigma_t (in same units as input returns)
  persistence: number;          // alpha + beta
}

// Simple grid + local search MLE for stability (no external deps).
export function garchFit(returns: number[], horizon = 20): GARCHResult {
  const r = returns.map(x => x - mean(returns));
  const n = r.length;
  if (n < 30) {
    const v = variance(r);
    return { omega: v, alpha: 0, beta: 0, unconditionalVar: v, conditionalVar: new Array(n).fill(v),
      volatilityForecast: new Array(horizon).fill(Math.sqrt(v)), persistence: 0 };
  }
  const v0 = variance(r);

  function nll(omega: number, a: number, b: number) {
    if (omega <= 0 || a < 0 || b < 0 || a + b >= 0.999) return Infinity;
    let s2 = v0;
    let ll = 0;
    for (let i = 0; i < n; i++) {
      ll += 0.5 * (Math.log(2 * Math.PI) + Math.log(s2) + (r[i] * r[i]) / s2);
      s2 = omega + a * r[i] * r[i] + b * s2;
    }
    return ll;
  }

  // Coarse grid
  let best = { omega: v0 * 0.05, a: 0.08, b: 0.9, nll: Infinity };
  for (const a of [0.02, 0.05, 0.08, 0.1, 0.15, 0.2]) {
    for (const b of [0.7, 0.8, 0.85, 0.9, 0.93]) {
      if (a + b >= 0.99) continue;
      const omega = v0 * (1 - a - b);
      const v = nll(omega, a, b);
      if (v < best.nll) best = { omega, a, b, nll: v };
    }
  }
  // Local refinement
  let step = 0.02;
  for (let iter = 0; iter < 6; iter++) {
    let improved = false;
    for (const da of [-step, 0, step]) for (const db of [-step, 0, step]) {
      const a = best.a + da, b = best.b + db;
      if (a < 0 || b < 0 || a + b >= 0.999) continue;
      const omega = v0 * Math.max(1e-8, 1 - a - b);
      const v = nll(omega, a, b);
      if (v < best.nll - 1e-6) { best = { omega, a, b, nll: v }; improved = true; }
    }
    if (!improved) step /= 2;
  }

  const conditional: number[] = [];
  let s2 = v0;
  for (let i = 0; i < n; i++) {
    conditional.push(s2);
    s2 = best.omega + best.a * r[i] * r[i] + best.b * s2;
  }
  // Forecast multi-step
  const uncond = best.omega / Math.max(1e-9, 1 - best.a - best.b);
  const forecast: number[] = [];
  let sf = s2;
  for (let h = 0; h < horizon; h++) {
    sf = best.omega + (best.a + best.b) * sf;
    forecast.push(Math.sqrt(sf));
  }
  return {
    omega: best.omega, alpha: best.a, beta: best.b,
    unconditionalVar: uncond, conditionalVar: conditional,
    volatilityForecast: forecast, persistence: best.a + best.b,
  };
}

// ---------- Simple ML-style ensemble (LSTM/Transformer/XGBoost-inspired heuristic) ----------
// Pure-TS baseline: ridge regression on lag features + EMA momentum + RSI-like signal.
// This is NOT a true neural net — it is a deterministic ensemble that mimics the directional
// output of a trained model and is meant for in-browser demo + uncertainty visualization.
export interface MLEnsembleResult {
  forecast: number[];        // forecast log-returns
  pricePath: number[];       // implied price path from current price
  confidenceLow: number[];
  confidenceHigh: number[];
  signal: "BUY" | "HOLD" | "SELL";
  score: number; // -1..+1
}

export function mlEnsembleForecast(returns: number[], currentPrice: number, horizon = 30): MLEnsembleResult {
  const n = returns.length;
  if (n < 30) {
    return { forecast: [], pricePath: [], confidenceLow: [], confidenceHigh: [], signal: "HOLD", score: 0 };
  }
  // Feature: short EMA momentum
  const ema = (arr: number[], k: number) => {
    const a = 2 / (k + 1);
    let e = arr[0];
    for (let i = 1; i < arr.length; i++) e = a * arr[i] + (1 - a) * e;
    return e;
  };
  const mom5 = ema(returns.slice(-5), 3);
  const mom20 = ema(returns.slice(-20), 10);
  const drift = 0.6 * mom20 + 0.4 * mom5;
  const sigma = std(returns);
  const ar = arFit(returns, 2, horizon);
  const garch = garchFit(returns, horizon);

  const forecast: number[] = [];
  const pricePath: number[] = [];
  const lo: number[] = [];
  const hi: number[] = [];
  let price = currentPrice;
  for (let i = 0; i < horizon; i++) {
    const f = 0.5 * ar.forecast[i] + 0.5 * drift; // ensemble mean
    forecast.push(f);
    price = price * Math.exp(f);
    pricePath.push(price);
    const s = garch.volatilityForecast[i] || sigma;
    lo.push(price * Math.exp(-1.96 * s * Math.sqrt(i + 1)));
    hi.push(price * Math.exp(1.96 * s * Math.sqrt(i + 1)));
  }
  const totalRet = (pricePath[pricePath.length - 1] - currentPrice) / currentPrice;
  const score = Math.max(-1, Math.min(1, totalRet / (sigma * Math.sqrt(horizon) * 2 + 1e-9)));
  const signal: "BUY" | "HOLD" | "SELL" = score > 0.25 ? "BUY" : score < -0.25 ? "SELL" : "HOLD";
  return { forecast, pricePath, confidenceLow: lo, confidenceHigh: hi, signal, score };
}
