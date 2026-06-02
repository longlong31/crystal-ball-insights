## Mục tiêu

Nâng cấp `/platform/stocks` thành **AI Quant Equity Intelligence** — trải nghiệm hỗn hợp Bloomberg Terminal × TradingView × AI Research Analyst, giữ nguyên Dark Futuristic theme hiện có.

Phạm vi rất lớn, sẽ chia thành 4 phase để có thể ship & kiểm thử dần. Phase 1 + 2 sẽ làm ngay trong lượt này; Phase 3-4 sẽ ship ở lượt kế tiếp sau khi bạn xác nhận.

---

## Phase 1 — Foundation: Global Market Coverage + Screener

**Tạo dữ liệu thị trường toàn cầu** (`src/data/globalMarkets.ts`):
- VN: HOSE, HNX, UPCOM (đã có sẵn ~150 mã trong codebase)
- US: NYSE/NASDAQ/AMEX — top 60 mã (AAPL, MSFT, NVDA, TSLA, AMZN, GOOGL, META, JPM, V, …)
- EU: LSE/Euronext/DB — top 25 mã (ASML, NESN, SHEL, …)
- Asia: TSE/HKEX/SSE/SZSE/SGX/SET — top 30 mã (7203.T, 0700.HK, …)
- Mỗi mã: `symbol, name, exchange, region, sector, marketCap (Large/Mid/Small)`

**Bộ lọc** (top bar dạng pill, glassmorphism):
- Region: All / Vietnam / US / Europe / Asia
- Cap size: Large / Mid / Small
- Sector: Technology / Finance / Banking / Retail / Healthcare / Energy / Industrial / Consumer / Real Estate
- Search bar free-text

**Intelligent Stock Screener** (tab mới "Screener"):
- Tabs nhanh: Undervalued / Growth / Momentum / High Dividend / AI Top Picks
- Sliders chuyên sâu: PE, PB, PEG, EV/EBITDA, ROE, ROA, margins, Revenue Growth, EPS Growth, Beta, Volatility, Sharpe, Dividend Yield
- Logic chấm điểm AI client-side dựa trên các tiêu chí trên + mock fundamentals (vì API miễn phí không cover hết) → highlight "AI Score"

---

## Phase 2 — Institutional Analytics Dashboard cho từng mã

Mở rộng `StockAnalysis.tsx` thành layout 2 pane:
- Left rail: scrollable list các mã đã lọc, top mover badges, live tick
- Right pane: deep dashboard của mã đang chọn, tabs:

**Tab Overview** (mặc định): price + candlestick + volume hiện có
**Tab Quant Metrics**: Variance, StdDev, Skewness, Kurtosis, Beta, Alpha, VaR/CVaR, Max DD, Sharpe, Sortino, Treynor, Information ratio — tính từ history hiện có, mỗi card có tooltip "AI Insight" giải thích plain-text
**Tab Forecast**: AI projection 1W/1M/3M/6M/1Y với Bull/Base/Bear case + xác suất (Monte Carlo client-side trên log returns)
**Tab Financials**: Income / Balance / Cash flow (mock structured data + nguồn link sang SEC/CafeF), toggle 5Y/10Y/TTM/QoQ/YoY

---

## Phase 3 — AI Equity Research Analyst (Multi-Agent) — *lượt tiếp theo*

Khu vực mới phía dưới chart, UI như ChatGPT premium:
- 6 Agent: Fundamental / Technical / Quant / Risk / Macro / Portfolio
- Mỗi agent có persona + prompt riêng, gọi qua edge function `equity-research-ai` (Lovable AI Gateway, model `google/gemini-3-flash-preview`, streaming SSE)
- "Consensus Report" mode: hỏi 1 câu → 6 agents trả lời song song → AI tổng hợp Investment Thesis (Rating BUY/HOLD/SELL + Confidence%)
- Context tự động inject: symbol, price, RSI, MACD, Beta, sector, các metric quant đang hiển thị

**Generate Research Report** button → xuất PDF/Word/Excel với Executive Summary + Valuation + Risk + Technical + Financial + Forecast + Recommendation.

---

## Phase 4 — Chart Pro + Portfolio Lab — *lượt tiếp theo*

**Institutional Chart**: bổ sung indicators (Ichimoku, Stochastic, ATR, VWAP), drawing tools (trend line, Fib retracement/extension, channels, S/R zones), overlay benchmark (VN-Index / S&P500 / sector index).

**Tab Portfolio Lab**: add multiple stocks → Backtest, Monte Carlo, Efficient Frontier, Correlation Matrix, Risk Contribution (tái sử dụng `PortfolioOptimizer` đã có, nhúng inline).

---

## Tech notes (cho developer)

- Mới tạo: `src/data/globalMarkets.ts`, `src/components/platform/stocks/MarketFilterBar.tsx`, `StockScreener.tsx`, `StockListPane.tsx`, `QuantMetricsPanel.tsx`, `ForecastPanel.tsx`, `FinancialsPanel.tsx` (Phase 1-2). Phase 3-4: `EquityResearchAgents.tsx`, edge function `equity-research-ai`, `ChartPro.tsx`, `PortfolioLabInline.tsx`.
- Refactor `StockAnalysis.tsx` thành shell + tabs để mỗi panel độc lập (giảm 1561 LOC).
- Data: reuse `useMarketData` hook; cho US/EU/Asia tickers, gọi Yahoo Finance qua edge function hiện có (đã có symbol-search), fallback graceful nếu rate-limit.
- AI: edge function streaming SSE multi-agent dùng `streamText` + `Promise.all` 6 calls song song; client render với markdown.
- Performance: virtualize stock list (≥200 mã), React Query 30s refresh, lazy-load tab content.
- i18n: tất cả label qua LanguageContext (VI/EN).
- Style: tái sử dụng tokens hiện có (semantic HSL, mono font, glass cards).

---

## Đề xuất bắt đầu

Mình sẽ ship **Phase 1 + Phase 2** ngay trong lượt này (foundation + dashboard chuyên sâu + screener + quant metrics + forecast + financials tabs). Sau khi bạn confirm chạy ổn, lượt sau ship Phase 3 (Multi-Agent AI + Report export) và Phase 4 (Chart Pro + Portfolio Lab inline).

Bạn duyệt plan này để mình bắt đầu Phase 1+2?