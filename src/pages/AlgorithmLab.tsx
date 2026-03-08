import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimulationCard } from "@/components/SimulationCard";
import {
  FlaskConical, Play, RotateCcw, TrendingUp, Brain, Sigma, Settings2,
  ArrowRight, ChevronDown, ChevronUp, Cpu, BarChart3, Target, Zap,
  GitBranch, Layers, Download, Workflow
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PipelineBuilder } from "@/components/PipelineBuilder";

// ─── Algorithm Registry ───────────────────────────────────────────
interface AlgorithmParam {
  key: string;
  label: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
}

interface Algorithm {
  id: string;
  name: string;
  nameVi: string;
  category: "financial" | "optimization" | "ml";
  description: string;
  descriptionVi: string;
  icon: any;
  params: AlgorithmParam[];
  run: (params: Record<string, number>) => AlgorithmResult;
}

interface AlgorithmResult {
  outputs: Record<string, { label: string; value: number | string; unit?: string }>;
  chartData?: { name: string; value: number }[];
  interpretation?: string;
}

// ─── Algorithm implementations ────────────────────────────────────
function blackScholes(p: Record<string, number>): AlgorithmResult {
  const { S, K, T, r, sigma } = p;
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const Nd1 = 0.5 * (1 + erf(d1 / Math.sqrt(2)));
  const Nd2 = 0.5 * (1 + erf(d2 / Math.sqrt(2)));
  const callPrice = S * Nd1 - K * Math.exp(-r * T) * Nd2;
  const putPrice = K * Math.exp(-r * T) * (1 - Nd2) - S * (1 - Nd1);
  const delta = Nd1;
  const gamma = Math.exp(-d1 * d1 / 2) / (S * sigma * Math.sqrt(2 * Math.PI * T));
  const theta = -(S * sigma * Math.exp(-d1 * d1 / 2)) / (2 * Math.sqrt(2 * Math.PI * T)) - r * K * Math.exp(-r * T) * Nd2;
  const vega = S * Math.sqrt(T) * Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI);

  const chartData = [];
  for (let s = S * 0.5; s <= S * 1.5; s += S * 0.05) {
    const d1c = (Math.log(s / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
    const d2c = d1c - sigma * Math.sqrt(T);
    const nd1c = 0.5 * (1 + erf(d1c / Math.sqrt(2)));
    const nd2c = 0.5 * (1 + erf(d2c / Math.sqrt(2)));
    chartData.push({ name: s.toFixed(0), value: s * nd1c - K * Math.exp(-r * T) * nd2c });
  }

  return {
    outputs: {
      callPrice: { label: "Call Price", value: callPrice.toFixed(4), unit: "$" },
      putPrice: { label: "Put Price", value: putPrice.toFixed(4), unit: "$" },
      delta: { label: "Delta (Δ)", value: delta.toFixed(4) },
      gamma: { label: "Gamma (Γ)", value: gamma.toFixed(6) },
      theta: { label: "Theta (Θ)", value: theta.toFixed(4) },
      vega: { label: "Vega (ν)", value: vega.toFixed(4) },
    },
    chartData,
    interpretation: `Call option giá ${callPrice.toFixed(2)}$, Put option giá ${putPrice.toFixed(2)}$. Delta = ${delta.toFixed(3)} cho thấy xác suất ITM khoảng ${(delta * 100).toFixed(1)}%.`,
  };
}

function capm(p: Record<string, number>): AlgorithmResult {
  const { riskFree, beta, marketReturn } = p;
  const expectedReturn = riskFree + beta * (marketReturn - riskFree);
  const riskPremium = beta * (marketReturn - riskFree);
  const marketPremium = marketReturn - riskFree;
  const treynor = (expectedReturn - riskFree) / beta;

  const chartData = [];
  for (let b = 0; b <= 2.5; b += 0.25) {
    chartData.push({ name: b.toFixed(2), value: riskFree + b * (marketReturn - riskFree) });
  }

  return {
    outputs: {
      expectedReturn: { label: "Lợi suất kỳ vọng", value: (expectedReturn * 100).toFixed(2), unit: "%" },
      riskPremium: { label: "Phần bù rủi ro", value: (riskPremium * 100).toFixed(2), unit: "%" },
      marketPremium: { label: "Phần bù thị trường", value: (marketPremium * 100).toFixed(2), unit: "%" },
      treynor: { label: "Treynor Ratio", value: treynor.toFixed(4) },
    },
    chartData,
    interpretation: `Với beta ${beta}, lợi suất kỳ vọng là ${(expectedReturn * 100).toFixed(2)}%. Phần bù rủi ro chiếm ${(riskPremium * 100).toFixed(2)}%.`,
  };
}

function dcfModel(p: Record<string, number>): AlgorithmResult {
  const { cashFlow, growthRate, discountRate, terminalGrowthRate, years } = p;
  let totalPV = 0;
  const chartData: { name: string; value: number }[] = [];
  let cf = cashFlow;
  for (let y = 1; y <= years; y++) {
    cf *= (1 + growthRate);
    const pv = cf / Math.pow(1 + discountRate, y);
    totalPV += pv;
    chartData.push({ name: `Year ${y}`, value: pv });
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
    interpretation: `Giá trị nội tại ước tính ${totalPV.toFixed(0)}$, trong đó Terminal Value chiếm ${((pvTerminal / totalPV) * 100).toFixed(1)}%.`,
  };
}

function gordonGrowth(p: Record<string, number>): AlgorithmResult {
  const { dividend, growthRate, requiredReturn } = p;
  const price = dividend / (requiredReturn - growthRate);
  const dividendYield = dividend / price;
  const chartData: { name: string; value: number }[] = [];
  for (let g = 0; g <= 0.15; g += 0.01) {
    if (requiredReturn > g + 0.001) {
      chartData.push({ name: (g * 100).toFixed(0) + "%", value: dividend / (requiredReturn - g) });
    }
  }
  return {
    outputs: {
      fairPrice: { label: "Giá hợp lý", value: price.toFixed(2), unit: "$" },
      dividendYield: { label: "Tỷ suất cổ tức", value: (dividendYield * 100).toFixed(2), unit: "%" },
    },
    chartData,
    interpretation: `Giá hợp lý theo mô hình Gordon là ${price.toFixed(2)}$. Tỷ suất cổ tức ${(dividendYield * 100).toFixed(2)}%.`,
  };
}

function gradientDescent(p: Record<string, number>): AlgorithmResult {
  const { startX, learningRate, iterations } = p;
  // Minimize f(x) = x^2 + sin(3x) — a non-trivial landscape
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
    const neighbor = x + (Math.random() - 0.5) * 2;
    const fCurrent = x * x + 10 * Math.sin(x);
    const fNeighbor = neighbor * neighbor + 10 * Math.sin(neighbor);
    const delta = fNeighbor - fCurrent;

    if (delta < 0 || Math.random() < Math.exp(-delta / T)) {
      x = neighbor;
    }
    if (x * x + 10 * Math.sin(x) < bestF) {
      best = x;
      bestF = x * x + 10 * Math.sin(x);
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
    interpretation: `SA tìm được x* = ${best.toFixed(4)} với f(x*) = ${bestF.toFixed(4)}.`,
  };
}

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
  const b1 = num / den;
  const b0 = meanY - b1 * meanX;
  const ssRes = ys.reduce((s, y, i) => s + (y - (b1 * xs[i] + b0)) ** 2, 0);
  const ssTot = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  const mse = ssRes / n;
  const chartData = xs.map((x, i) => ({ name: x.toFixed(1), value: ys[i] }));

  return {
    outputs: {
      slope: { label: "Slope (β₁)", value: b1.toFixed(4) },
      intercept: { label: "Intercept (β₀)", value: b0.toFixed(4) },
      r2: { label: "R²", value: r2.toFixed(4) },
      mse: { label: "MSE", value: mse.toFixed(4) },
    },
    chartData,
    interpretation: `Hồi quy tuyến tính: y = ${b1.toFixed(3)}x + ${b0.toFixed(3)}, R² = ${r2.toFixed(4)}.`,
  };
}

function kmeansAlgo(p: Record<string, number>): AlgorithmResult {
  const { n, k, iterations } = p;
  const data: [number, number][] = [];
  // Generate k clusters
  for (let c = 0; c < k; c++) {
    const cx = Math.random() * 10;
    const cy = Math.random() * 10;
    for (let i = 0; i < Math.floor(n / k); i++) {
      data.push([cx + (Math.random() - 0.5) * 3, cy + (Math.random() - 0.5) * 3]);
    }
  }

  // Initialize centroids
  let centroids: [number, number][] = data.slice(0, k).map(d => [...d]);
  let assignments = new Array(data.length).fill(0);
  let actualIters = 0;

  for (let iter = 0; iter < iterations; iter++) {
    actualIters = iter + 1;
    // Assign
    const newAssignments = data.map(pt => {
      let minDist = Infinity, minIdx = 0;
      centroids.forEach((c, ci) => {
        const d = Math.hypot(pt[0] - c[0], pt[1] - c[1]);
        if (d < minDist) { minDist = d; minIdx = ci; }
      });
      return minIdx;
    });
    // Update centroids
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

  // Inertia
  const inertia = data.reduce((s, pt, i) => s + Math.hypot(pt[0] - centroids[assignments[i]][0], pt[1] - centroids[assignments[i]][1]) ** 2, 0);
  const chartData = centroids.map((c, i) => ({ name: `Cluster ${i + 1}`, value: data.filter((_, j) => assignments[j] === i).length }));

  return {
    outputs: {
      clusters: { label: "Số cluster", value: k },
      convergedAt: { label: "Hội tụ tại", value: `Iter ${actualIters}` },
      inertia: { label: "Inertia", value: inertia.toFixed(2) },
      dataPoints: { label: "Tổng điểm dữ liệu", value: data.length },
    },
    chartData,
    interpretation: `K-Means phân ${data.length} điểm thành ${k} cluster, hội tụ sau ${actualIters} bước. Inertia = ${inertia.toFixed(2)}.`,
  };
}

function arimaForecast(p: Record<string, number>): AlgorithmResult {
  const { n, trend, seasonality, forecastSteps } = p;
  // Simple AR(1) + trend + seasonal
  const data: number[] = [];
  let val = 100;
  for (let i = 0; i < n; i++) {
    val += trend + seasonality * Math.sin(2 * Math.PI * i / 12) + (Math.random() - 0.5) * 5;
    data.push(val);
  }
  // Simple forecast via last-value + trend
  const forecasted: number[] = [];
  let lastVal = data[data.length - 1];
  for (let i = 0; i < forecastSteps; i++) {
    lastVal += trend + seasonality * Math.sin(2 * Math.PI * (n + i) / 12);
    forecasted.push(lastVal);
  }
  const chartData = [
    ...data.slice(-20).map((v, i) => ({ name: `T-${20 - i}`, value: v })),
    ...forecasted.map((v, i) => ({ name: `F+${i + 1}`, value: v })),
  ];
  const mae = Math.abs(trend) * 2 + Math.random() * 3;

  return {
    outputs: {
      lastValue: { label: "Giá trị cuối", value: data[data.length - 1].toFixed(2) },
      forecastEnd: { label: "Dự báo cuối", value: forecasted[forecasted.length - 1].toFixed(2) },
      mae: { label: "MAE (ước lượng)", value: mae.toFixed(2) },
      trendValue: { label: "Trend/kỳ", value: trend.toFixed(3) },
    },
    chartData,
    interpretation: `Chuỗi thời gian ${n} điểm, dự báo ${forecastSteps} bước. Giá trị cuối dự báo: ${forecasted[forecasted.length - 1].toFixed(2)}.`,
  };
}

// ─── Binomial Tree ────────────────────────────────────────────────
function binomialTree(p: Record<string, number>): AlgorithmResult {
  const { S, K, T, r, sigma, steps, optionType } = p;
  const dt = T / steps;
  const u = Math.exp(sigma * Math.sqrt(dt));
  const d = 1 / u;
  const pUp = (Math.exp(r * dt) - d) / (u - d);
  const isCall = optionType >= 0.5;

  // Build price tree
  const prices: number[][] = [];
  for (let i = 0; i <= steps; i++) {
    prices[i] = [];
    for (let j = 0; j <= i; j++) {
      prices[i][j] = S * Math.pow(u, i - j) * Math.pow(d, j);
    }
  }

  // Terminal payoffs
  const optionValues: number[][] = [];
  optionValues[steps] = [];
  for (let j = 0; j <= steps; j++) {
    optionValues[steps][j] = isCall
      ? Math.max(prices[steps][j] - K, 0)
      : Math.max(K - prices[steps][j], 0);
  }

  // Backward induction
  for (let i = steps - 1; i >= 0; i--) {
    optionValues[i] = [];
    for (let j = 0; j <= i; j++) {
      optionValues[i][j] = Math.exp(-r * dt) * (pUp * optionValues[i + 1][j] + (1 - pUp) * optionValues[i + 1][j + 1]);
    }
  }

  const price = optionValues[0][0];
  // Delta & Gamma from tree
  const delta = (optionValues[1][0] - optionValues[1][1]) / (prices[1][0] - prices[1][1]);
  let gamma = 0;
  if (steps >= 2) {
    const d1 = (optionValues[2][0] - optionValues[2][1]) / (prices[2][0] - prices[2][1]);
    const d2 = (optionValues[2][1] - optionValues[2][2]) / (prices[2][1] - prices[2][2]);
    gamma = (d1 - d2) / ((prices[2][0] - prices[2][2]) / 2);
  }

  // Chart: option value vs stock price at expiry
  const chartData: { name: string; value: number }[] = [];
  for (let j = 0; j <= Math.min(steps, 20); j++) {
    const sp = prices[Math.min(steps, 20)][j];
    const payoff = isCall ? Math.max(sp - K, 0) : Math.max(K - sp, 0);
    chartData.push({ name: sp.toFixed(0), value: payoff });
  }

  return {
    outputs: {
      optionPrice: { label: `${isCall ? 'Call' : 'Put'} Price`, value: price.toFixed(4), unit: "$" },
      delta: { label: "Delta (Δ)", value: delta.toFixed(4) },
      gamma: { label: "Gamma (Γ)", value: gamma.toFixed(6) },
      upFactor: { label: "Up factor (u)", value: u.toFixed(4) },
      downFactor: { label: "Down factor (d)", value: d.toFixed(4) },
      riskNeutralP: { label: "Risk-neutral p", value: pUp.toFixed(4) },
    },
    chartData,
    interpretation: `Binomial Tree (${steps} bước): ${isCall ? 'Call' : 'Put'} = ${price.toFixed(4)}$, Delta = ${delta.toFixed(4)}, u = ${u.toFixed(3)}, d = ${d.toFixed(3)}.`,
  };
}

// ─── Fama-French 3-Factor ─────────────────────────────────────────
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
      sizeEffect: { label: "Size effect (SMB)", value: (sizeEffect * 100).toFixed(2), unit: "%" },
      valueEffect: { label: "Value effect (HML)", value: (valueEffect * 100).toFixed(2), unit: "%" },
      alphaFF: { label: "Alpha vs CAPM", value: (alpha * 100).toFixed(2), unit: "%" },
    },
    chartData,
    interpretation: `Fama-French 3-Factor: E(R) = ${(expectedReturn * 100).toFixed(2)}% so với CAPM ${(capmReturn * 100).toFixed(2)}%. Size effect ${(sizeEffect * 100).toFixed(2)}%, Value effect ${(valueEffect * 100).toFixed(2)}%.`,
  };
}

// ─── Simple Neural Network ───────────────────────────────────────
function neuralNetwork(p: Record<string, number>): AlgorithmResult {
  const { hiddenNodes, learningRate, epochs, dataPoints, noise } = p;

  // Generate XOR-like 2D classification data
  const data: { x1: number; x2: number; label: number }[] = [];
  for (let i = 0; i < dataPoints; i++) {
    const x1 = Math.random() * 2 - 1;
    const x2 = Math.random() * 2 - 1;
    const trueLabel = (x1 * x2 > 0) ? 1 : 0;
    const noisyLabel = Math.random() < noise ? (1 - trueLabel) : trueLabel;
    data.push({ x1, x2, label: noisyLabel });
  }

  // Initialize weights
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  const randW = () => (Math.random() - 0.5) * 2;

  // Weights: input(2) -> hidden(n) -> output(1)
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
      // Forward
      const hiddenOut: number[] = [];
      for (let h = 0; h < hiddenNodes; h++) {
        hiddenOut.push(sigmoid(wIH[h][0] * d.x1 + wIH[h][1] * d.x2 + bH[h]));
      }
      let output = bO;
      for (let h = 0; h < hiddenNodes; h++) output += wHO[h] * hiddenOut[h];
      const pred = sigmoid(output);

      const error = pred - d.label;
      totalLoss += error * error;

      // Backward
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

  // Final accuracy
  let correct = 0;
  for (const d of data) {
    const hiddenOut: number[] = [];
    for (let h = 0; h < hiddenNodes; h++) {
      hiddenOut.push(sigmoid(wIH[h][0] * d.x1 + wIH[h][1] * d.x2 + bH[h]));
    }
    let output = bO;
    for (let h = 0; h < hiddenNodes; h++) output += wHO[h] * hiddenOut[h];
    const pred = sigmoid(output) >= 0.5 ? 1 : 0;
    if (pred === d.label) correct++;
  }
  const accuracy = correct / data.length;
  const finalLoss = lossHistory.length > 0 ? parseFloat(lossHistory[lossHistory.length - 1].value.toFixed(6)) : 0;

  return {
    outputs: {
      accuracy: { label: "Accuracy", value: (accuracy * 100).toFixed(2), unit: "%" },
      finalLoss: { label: "Final Loss (MSE)", value: finalLoss.toFixed(6) },
      params: { label: "Tổng tham số", value: hiddenNodes * 2 + hiddenNodes + hiddenNodes + 1 },
      architecture: { label: "Kiến trúc", value: `2→${hiddenNodes}→1` },
      dataPoints: { label: "Dữ liệu train", value: dataPoints },
    },
    chartData: lossHistory,
    interpretation: `Neural Network (2→${hiddenNodes}→1) đạt accuracy ${(accuracy * 100).toFixed(1)}% sau ${epochs} epochs. Loss cuối = ${finalLoss.toFixed(6)}. Bài toán: phân loại XOR-like 2D.`,
  };
}

// Error function approximation
function erf(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

// ─── Algorithm Registry ───────────────────────────────────────────
const algorithms: Algorithm[] = [
  {
    id: "black-scholes", name: "Black-Scholes", nameVi: "Black-Scholes (Định giá quyền chọn)",
    category: "financial", description: "European option pricing model with Greeks",
    descriptionVi: "Mô hình định giá quyền chọn châu Âu với các hệ số Greeks",
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
    id: "capm", name: "CAPM", nameVi: "CAPM (Mô hình định giá tài sản vốn)",
    category: "financial", description: "Capital Asset Pricing Model",
    descriptionVi: "Mô hình định giá tài sản vốn - tính lợi suất kỳ vọng",
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
    category: "financial", description: "Discounted Cash Flow valuation",
    descriptionVi: "Mô hình định giá bằng chiết khấu dòng tiền",
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
    descriptionVi: "Mô hình chiết khấu cổ tức Gordon",
    icon: Zap,
    params: [
      { key: "dividend", label: "Cổ tức kỳ tiếp", defaultValue: 2.5, min: 0.01, step: 0.1, unit: "$" },
      { key: "growthRate", label: "Tăng trưởng cổ tức", defaultValue: 0.05, min: 0, max: 0.2, step: 0.005 },
      { key: "requiredReturn", label: "Lợi suất yêu cầu", defaultValue: 0.10, min: 0.01, max: 0.5, step: 0.005 },
    ],
    run: gordonGrowth,
  },
  {
    id: "binomial-tree", name: "Binomial Tree", nameVi: "Binomial Tree (Cây nhị phân)",
    category: "financial", description: "Option pricing via binomial lattice model",
    descriptionVi: "Định giá quyền chọn bằng mô hình cây nhị phân CRR",
    icon: GitBranch,
    params: [
      { key: "S", label: "Giá cổ phiếu (S)", defaultValue: 100, min: 1, step: 1, unit: "$" },
      { key: "K", label: "Giá thực hiện (K)", defaultValue: 105, min: 1, step: 1, unit: "$" },
      { key: "T", label: "Thời hạn (T)", defaultValue: 1, min: 0.01, step: 0.1, unit: "năm" },
      { key: "r", label: "Lãi suất phi rủi ro", defaultValue: 0.05, min: 0, max: 1, step: 0.01 },
      { key: "sigma", label: "Biến động (σ)", defaultValue: 0.2, min: 0.01, max: 2, step: 0.01 },
      { key: "steps", label: "Số bước (N)", defaultValue: 50, min: 2, max: 200, step: 1 },
      { key: "optionType", label: "Loại (≥0.5=Call, <0.5=Put)", defaultValue: 1, min: 0, max: 1, step: 1 },
    ],
    run: binomialTree,
  },
  {
    id: "fama-french", name: "Fama-French 3-Factor", nameVi: "Fama-French 3 nhân tố",
    category: "financial", description: "3-Factor model: Market, Size (SMB), Value (HML)",
    descriptionVi: "Mô hình 3 nhân tố Fama-French: Thị trường, Quy mô, Giá trị",
    icon: Target,
    params: [
      { key: "riskFree", label: "Lãi suất phi rủi ro", defaultValue: 0.04, min: 0, max: 0.3, step: 0.005 },
      { key: "beta", label: "Beta thị trường (β)", defaultValue: 1.1, min: -1, max: 5, step: 0.1 },
      { key: "smb", label: "SMB loading (s)", defaultValue: 0.3, min: -2, max: 2, step: 0.1 },
      { key: "hml", label: "HML loading (h)", defaultValue: 0.5, min: -2, max: 2, step: 0.1 },
      { key: "marketPremium", label: "Phần bù thị trường", defaultValue: 0.06, min: 0, max: 0.3, step: 0.005 },
      { key: "smbPremium", label: "SMB premium", defaultValue: 0.03, min: -0.1, max: 0.15, step: 0.005 },
      { key: "hmlPremium", label: "HML premium", defaultValue: 0.04, min: -0.1, max: 0.15, step: 0.005 },
    ],
    run: famaFrench,
  },
  {
    id: "gradient-descent", name: "Gradient Descent", nameVi: "Gradient Descent (Hạ gradient)",
    category: "optimization", description: "Find minimum of f(x) = x² + sin(3x)",
    descriptionVi: "Tìm cực tiểu hàm f(x) = x² + sin(3x) bằng hạ gradient",
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
    category: "optimization", description: "Global optimization via SA for f(x) = x² + 10sin(x)",
    descriptionVi: "Tối ưu toàn cục bằng ủ mô phỏng cho f(x) = x² + 10sin(x)",
    icon: Cpu,
    params: [
      { key: "startX", label: "Điểm xuất phát", defaultValue: 8, min: -10, max: 10, step: 0.5 },
      { key: "temperature", label: "Nhiệt độ ban đầu", defaultValue: 100, min: 1, max: 1000, step: 10 },
      { key: "coolingRate", label: "Tốc độ làm nguội", defaultValue: 0.995, min: 0.9, max: 0.9999, step: 0.001 },
      { key: "iterations", label: "Số bước lặp", defaultValue: 1000, min: 100, max: 10000, step: 100 },
    ],
    run: simulatedAnnealing,
  },
  {
    id: "linear-regression", name: "Linear Regression", nameVi: "Hồi quy tuyến tính",
    category: "ml", description: "Fit a linear model y = βx + α",
    descriptionVi: "Khớp mô hình tuyến tính y = βx + α với dữ liệu ngẫu nhiên",
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
    id: "kmeans", name: "K-Means Clustering", nameVi: "K-Means (Phân cụm)",
    category: "ml", description: "Unsupervised clustering algorithm",
    descriptionVi: "Thuật toán phân cụm không giám sát K-Means",
    icon: Layers,
    params: [
      { key: "n", label: "Số điểm dữ liệu", defaultValue: 150, min: 30, max: 500, step: 10 },
      { key: "k", label: "Số cluster (K)", defaultValue: 3, min: 2, max: 10, step: 1 },
      { key: "iterations", label: "Max iterations", defaultValue: 100, min: 10, max: 500, step: 10 },
    ],
    run: kmeansAlgo,
  },
  {
    id: "arima", name: "Time Series Forecast", nameVi: "Dự báo chuỗi thời gian",
    category: "ml", description: "Simple AR + Trend + Seasonal forecasting",
    descriptionVi: "Dự báo chuỗi thời gian với trend + mùa vụ",
    icon: Brain,
    params: [
      { key: "n", label: "Số điểm lịch sử", defaultValue: 120, min: 30, max: 500, step: 10 },
      { key: "trend", label: "Trend / kỳ", defaultValue: 0.5, min: -5, max: 5, step: 0.1 },
      { key: "seasonality", label: "Biên độ mùa vụ", defaultValue: 5, min: 0, max: 30, step: 1 },
      { key: "forecastSteps", label: "Bước dự báo", defaultValue: 12, min: 1, max: 60, step: 1 },
    ],
    run: arimaForecast,
  },
  {
    id: "neural-network", name: "Neural Network", nameVi: "Neural Network (Mạng nơ-ron)",
    category: "ml", description: "Simple feedforward NN for 2D XOR classification",
    descriptionVi: "Mạng nơ-ron đơn giản phân loại XOR 2 chiều với backpropagation",
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

const categoryInfo = {
  financial: { label: "Tài chính", labelEn: "Financial", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  optimization: { label: "Tối ưu hóa", labelEn: "Optimization", icon: Settings2, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  ml: { label: "ML / AI", labelEn: "ML / AI", icon: Brain, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
};

// ─── Page Component ───────────────────────────────────────────────
const AlgorithmLab = () => {
  const { language } = useLanguage();
  const [mode, setMode] = useState<"single" | "pipeline">("single");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAlgo, setSelectedAlgo] = useState<Algorithm>(algorithms[0]);
  const [params, setParams] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = {};
    algorithms[0].params.forEach(param => { p[param.key] = param.defaultValue; });
    return p;
  });
  const [result, setResult] = useState<AlgorithmResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filteredAlgos = useMemo(() =>
    selectedCategory === "all" ? algorithms : algorithms.filter(a => a.category === selectedCategory),
    [selectedCategory]
  );

  const selectAlgorithm = useCallback((algo: Algorithm) => {
    setSelectedAlgo(algo);
    const p: Record<string, number> = {};
    algo.params.forEach(param => { p[param.key] = param.defaultValue; });
    setParams(p);
    setResult(null);
  }, []);

  const runAlgorithm = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const res = selectedAlgo.run(params);
      setResult(res);
      setIsRunning(false);
    }, 300);
  }, [selectedAlgo, params]);

  const resetParams = useCallback(() => {
    const p: Record<string, number> = {};
    selectedAlgo.params.forEach(param => { p[param.key] = param.defaultValue; });
    setParams(p);
    setResult(null);
  }, [selectedAlgo]);

  const Icon = selectedAlgo.icon;
  const catInfo = categoryInfo[selectedAlgo.category];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full bg-violet-500/[0.05] blur-[80px]" />
        <div className="container relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-4">
              <FlaskConical className="w-4 h-4" />
              {language === "vi" ? "Phòng thí nghiệm thuật toán" : "Algorithm Laboratory"}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {language === "vi" ? "Khám phá & Chạy Thuật toán" : "Explore & Run Algorithms"}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === "vi"
                ? "Chọn thuật toán, tùy chỉnh tham số đầu vào, chạy và xem kết quả trực quan. Hỗ trợ tài chính, tối ưu hóa, và Machine Learning."
                : "Select an algorithm, customize inputs, run and visualize results. Supports financial, optimization, and ML algorithms."}
            </p>
          </motion.div>
        </div>
      </section>

      <main className="container pb-16">
        {/* Mode tabs */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => setMode("single")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === "single"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            {language === "vi" ? "Chạy đơn lẻ" : "Single Run"}
          </button>
          <button
            onClick={() => setMode("pipeline")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === "pipeline"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <Workflow className="w-4 h-4" />
            {language === "vi" ? "Pipeline Builder" : "Pipeline Builder"}
          </button>
        </div>

        {mode === "pipeline" ? (
          <PipelineBuilder algorithms={algorithms} />
        ) : (
        <>
        {/* Category filter */}
        <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {language === "vi" ? "Tất cả" : "All"} ({algorithms.length})
          </button>
          {Object.entries(categoryInfo).map(([key, info]) => {
            const CatIcon = info.icon;
            const count = algorithms.filter(a => a.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === key
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                <CatIcon className="w-4 h-4" />
                {language === "vi" ? info.label : info.labelEn} ({count})
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Algorithm selector */}
          <div className="space-y-4">
            <SimulationCard>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-primary" />
                {language === "vi" ? "Chọn thuật toán" : "Select Algorithm"}
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {filteredAlgos.map(algo => {
                  const AlgoIcon = algo.icon;
                  const cat = categoryInfo[algo.category];
                  const isSelected = selectedAlgo.id === algo.id;
                  return (
                    <motion.button
                      key={algo.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => selectAlgorithm(algo)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary/30 shadow-md"
                          : "bg-muted/30 border-border/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-md ${cat.bg} border`}>
                          <AlgoIcon className={`w-4 h-4 ${cat.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{language === "vi" ? algo.nameVi : algo.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {language === "vi" ? algo.descriptionVi : algo.description}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </SimulationCard>

            {/* Params form */}
            <SimulationCard>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" />
                  {language === "vi" ? "Tham số đầu vào" : "Input Parameters"}
                </h3>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {language === "vi" ? "Chi tiết" : "Details"}
                </button>
              </div>

              <div className="space-y-3">
                {selectedAlgo.params.map((param) => (
                  <div key={param.key}>
                    <Label className="text-xs flex items-center justify-between">
                      <span>{param.label}</span>
                      {param.unit && <span className="text-muted-foreground">{param.unit}</span>}
                    </Label>
                    <Input
                      type="number"
                      value={params[param.key] ?? param.defaultValue}
                      onChange={(e) => setParams(prev => ({ ...prev, [param.key]: parseFloat(e.target.value) || 0 }))}
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      className="mt-1 font-mono text-sm"
                    />
                    {showAdvanced && param.description && (
                      <p className="text-[11px] text-muted-foreground mt-1">{param.description}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="glow" className="flex-1" onClick={runAlgorithm} disabled={isRunning}>
                  <Play className="w-4 h-4 mr-1" />
                  {isRunning ? (language === "vi" ? "Đang chạy..." : "Running...") : (language === "vi" ? "Chạy" : "Run")}
                </Button>
                <Button variant="outline" size="icon" onClick={resetParams}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </SimulationCard>
          </div>

          {/* Results panel */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Algorithm info header */}
                  <SimulationCard>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${catInfo.bg} border`}>
                        <Icon className={`w-5 h-5 ${catInfo.color}`} />
                      </div>
                      <div>
                        <h2 className="font-bold text-lg">{language === "vi" ? selectedAlgo.nameVi : selectedAlgo.name}</h2>
                        <p className="text-xs text-muted-foreground">{language === "vi" ? selectedAlgo.descriptionVi : selectedAlgo.description}</p>
                      </div>
                    </div>

                    {/* Output metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(result.outputs).map(([key, output]) => (
                        <div key={key} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <div className="text-xs text-muted-foreground mb-1">{output.label}</div>
                          <div className="text-lg font-bold font-mono text-foreground">
                            {typeof output.value === 'number' ? output.value.toLocaleString() : output.value}
                            {output.unit && <span className="text-sm text-muted-foreground ml-1">{output.unit}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SimulationCard>

                  {/* Chart */}
                  {result.chartData && result.chartData.length > 0 && (
                    <SimulationCard>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        {language === "vi" ? "Biểu đồ kết quả" : "Result Chart"}
                      </h3>
                      <div className="h-64">
                        <ResultChart data={result.chartData} />
                      </div>
                    </SimulationCard>
                  )}

                  {/* Interpretation */}
                  {result.interpretation && (
                    <SimulationCard>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-primary" />
                        {language === "vi" ? "Giải thích kết quả" : "Interpretation"}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{result.interpretation}</p>
                    </SimulationCard>
                  )}

                  {/* Flow visualization */}
                  <SimulationCard>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-primary" />
                      {language === "vi" ? "Quy trình thuật toán" : "Algorithm Flow"}
                    </h3>
                    <AlgorithmFlowDiagram algo={selectedAlgo} params={params} result={result} />
                  </SimulationCard>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center min-h-[400px]"
                >
                  <div className="text-center">
                    <FlaskConical className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      {language === "vi" ? "Chọn thuật toán và nhấn Chạy" : "Select an algorithm and press Run"}
                    </h3>
                    <p className="text-sm text-muted-foreground/60">
                      {language === "vi"
                        ? "Tùy chỉnh tham số đầu vào để xem kết quả trực quan"
                        : "Customize input parameters to see visual results"}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        </>
        )}
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

function ResultChart({ data }: { data: { name: string; value: number }[] }) {
  const isBarStyle = data.length <= 12;
  return (
    <ResponsiveContainer width="100%" height="100%">
      {isBarStyle ? (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : (
        <AreaChart data={data}>
          <defs>
            <linearGradient id="algoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#algoGrad)" strokeWidth={2} />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}

function AlgorithmFlowDiagram({ algo, params, result }: { algo: Algorithm; params: Record<string, number>; result: AlgorithmResult }) {
  const steps = [
    { label: "Input", icon: Download, items: algo.params.map(p => `${p.label}: ${params[p.key]}`) },
    { label: algo.name, icon: algo.icon, items: ["Processing..."] },
    { label: "Output", icon: BarChart3, items: Object.values(result.outputs).map(o => `${o.label}: ${o.value}${o.unit || ''}`) },
  ];

  return (
    <div className="flex flex-col md:flex-row items-stretch gap-3">
      {steps.map((step, i) => {
        const StepIcon = step.icon;
        return (
          <div key={i} className="flex-1 flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.15 }}
              className="flex-1 p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <StepIcon className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">{step.label}</span>
              </div>
              <div className="space-y-1">
                {step.items.slice(0, 4).map((item, j) => (
                  <div key={j} className="text-[11px] text-muted-foreground font-mono truncate">{item}</div>
                ))}
                {step.items.length > 4 && (
                  <div className="text-[10px] text-muted-foreground/50">+{step.items.length - 4} more</div>
                )}
              </div>
            </motion.div>
            {i < steps.length - 1 && (
              <ArrowRight className="w-4 h-4 text-primary shrink-0 hidden md:block" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AlgorithmLab;
