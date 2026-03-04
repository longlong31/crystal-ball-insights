// Technical Analysis Indicators Library

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalData {
  rsi: number[];
  macd: { macd: number; signal: number; histogram: number }[];
  ema12: number[];
  ema26: number[];
  ema50: number[];
  ema200: number[];
  sma20: number[];
  sma50: number[];
  bollingerBands: { upper: number; middle: number; lower: number }[];
  atr: number[];
  obv: number[];
  stochastic: { k: number; d: number }[];
}

export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else if (i === period - 1) {
      result.push(ema);
    } else {
      ema = (data[i] - ema) * multiplier + ema;
      result.push(ema);
    }
  }
  return result;
}

export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

export function calculateRSI(closes: number[], period: number = 14): number[] {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  result.push(NaN); // first element
  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else if (i === period - 1) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    } else {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }
  return result;
}

export function calculateMACD(closes: number[]): { macd: number; signal: number; histogram: number }[] {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calculateEMA(macdLine.filter(v => !isNaN(v)), 9);

  const result: { macd: number; signal: number; histogram: number }[] = [];
  let signalIdx = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (isNaN(macdLine[i])) {
      result.push({ macd: NaN, signal: NaN, histogram: NaN });
    } else {
      const sig = signalIdx < signalLine.length ? signalLine[signalIdx] : NaN;
      result.push({
        macd: macdLine[i],
        signal: sig,
        histogram: isNaN(sig) ? NaN : macdLine[i] - sig,
      });
      signalIdx++;
    }
  }
  return result;
}

export function calculateBollingerBands(closes: number[], period: number = 20, stdDev: number = 2) {
  const sma = calculateSMA(closes, period);
  return sma.map((middle, i) => {
    if (isNaN(middle)) return { upper: NaN, middle: NaN, lower: NaN };
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length;
    const sd = Math.sqrt(variance) * stdDev;
    return { upper: middle + sd, middle, lower: middle - sd };
  });
}

export function calculateATR(data: OHLCV[], period: number = 14): number[] {
  const trueRanges: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      trueRanges.push(data[i].high - data[i].low);
    } else {
      trueRanges.push(Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close)
      ));
    }
  }
  return calculateSMA(trueRanges, period);
}

export function calculateVolatility(returns: number[]): number {
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252); // Annualized
}

export function calculateBeta(assetReturns: number[], marketReturns: number[]): number {
  const n = Math.min(assetReturns.length, marketReturns.length);
  const meanAsset = assetReturns.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanMarket = marketReturns.slice(0, n).reduce((a, b) => a + b, 0) / n;

  let covariance = 0;
  let marketVariance = 0;
  for (let i = 0; i < n; i++) {
    covariance += (assetReturns[i] - meanAsset) * (marketReturns[i] - meanMarket);
    marketVariance += (marketReturns[i] - meanMarket) ** 2;
  }
  return marketVariance === 0 ? 1 : covariance / marketVariance;
}

export function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.04): number {
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length * 252;
  const vol = calculateVolatility(returns);
  return vol === 0 ? 0 : (meanReturn - riskFreeRate) / vol;
}

export function calculateMaxDrawdown(prices: number[]): number {
  let maxDD = 0;
  let peak = prices[0];
  for (const price of prices) {
    if (price > peak) peak = price;
    const dd = (peak - price) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

export function calculateVaR(returns: number[], confidence: number = 0.95): number {
  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sorted.length);
  return -sorted[index];
}

export function calculateCVaR(returns: number[], confidence: number = 0.95): number {
  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sorted.length);
  const tailReturns = sorted.slice(0, index + 1);
  return -(tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length);
}

export function calculateCorrelationMatrix(assets: { name: string; returns: number[] }[]): { labels: string[]; matrix: number[][] } {
  const n = assets.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        const len = Math.min(assets[i].returns.length, assets[j].returns.length);
        const a = assets[i].returns.slice(0, len);
        const b = assets[j].returns.slice(0, len);
        const meanA = a.reduce((s, v) => s + v, 0) / len;
        const meanB = b.reduce((s, v) => s + v, 0) / len;
        let cov = 0, varA = 0, varB = 0;
        for (let k = 0; k < len; k++) {
          cov += (a[k] - meanA) * (b[k] - meanB);
          varA += (a[k] - meanA) ** 2;
          varB += (b[k] - meanB) ** 2;
        }
        matrix[i][j] = varA * varB === 0 ? 0 : cov / Math.sqrt(varA * varB);
      }
    }
  }
  return { labels: assets.map(a => a.name), matrix };
}

// Generate realistic sample data for demo
export function generateSampleStockData(symbol: string, days: number = 252): OHLCV[] {
  const data: OHLCV[] = [];
  const basePrice = symbol === 'AAPL' ? 185 : symbol === 'GOOGL' ? 142 : symbol === 'MSFT' ? 415 : symbol === 'AMZN' ? 185 : symbol === 'NVDA' ? 880 : symbol === 'TSLA' ? 245 : 100;
  let price = basePrice;
  const volatility = symbol === 'TSLA' ? 0.035 : symbol === 'NVDA' ? 0.03 : 0.018;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const change = (Math.random() - 0.48) * volatility * price;
    const open = price;
    price = Math.max(price + change, price * 0.5);
    const high = Math.max(open, price) * (1 + Math.random() * 0.015);
    const low = Math.min(open, price) * (1 - Math.random() * 0.015);
    const volume = Math.floor(20000000 + Math.random() * 80000000);

    data.push({
      date: date.toISOString().split('T')[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +price.toFixed(2),
      volume,
    });
  }
  return data;
}

export function generateSampleCryptoData(symbol: string, days: number = 365) {
  const basePrices: Record<string, number> = {
    BTC: 67500, ETH: 3450, BNB: 610, SOL: 175, ADA: 0.65, XRP: 0.62,
    DOT: 8.5, AVAX: 38, LINK: 18, MATIC: 0.85
  };
  const data: OHLCV[] = [];
  let price = basePrices[symbol] || 100;
  const vol = symbol === 'BTC' ? 0.03 : symbol === 'ETH' ? 0.035 : 0.05;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const change = (Math.random() - 0.48) * vol * price;
    const open = price;
    price = Math.max(price + change, price * 0.3);
    const high = Math.max(open, price) * (1 + Math.random() * 0.025);
    const low = Math.min(open, price) * (1 - Math.random() * 0.025);
    const volume = Math.floor(1000000000 + Math.random() * 5000000000);

    data.push({
      date: date.toISOString().split('T')[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +price.toFixed(2),
      volume,
    });
  }
  return data;
}
