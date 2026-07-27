"""Thu thập & tiền xử lý dữ liệu giá lịch sử (Yahoo Finance qua yfinance).

Cùng nguồn dữ liệu (Yahoo Finance) với Edge Function `fetch-stock-data` của nền tảng
Crystal Ball, để pipeline nghiên cứu này có thể tái sử dụng trực tiếp trên hệ thống thật.
"""
from __future__ import annotations

import pandas as pd
import yfinance as yf

from . import config as cfg


def _cache_path(name: str) -> "pd.io.common.Path":
    return cfg.DATA_RAW / f"{name}.csv"


def download_prices(tickers: list[str], start: str, end: str | None, use_cache: bool = True) -> pd.DataFrame:
    """Tải giá đóng cửa điều chỉnh (Adj Close) hàng ngày cho danh sách mã.

    Trả về DataFrame index=Date, columns=ticker.
    """
    cache = _cache_path("prices")
    if use_cache and cache.exists():
        cached = pd.read_csv(cache, index_col=0, parse_dates=True)
        if set(tickers).issubset(set(cached.columns)):
            return cached[tickers].dropna(how="all")

    raw = yf.download(tickers, start=start, end=end, auto_adjust=True, progress=False, group_by="ticker")
    closes = {}
    for t in tickers:
        try:
            closes[t] = raw[t]["Close"]
        except (KeyError, TypeError):
            # fallback khi chỉ có 1 ticker (không có multi-index)
            closes[t] = raw["Close"]
    prices = pd.DataFrame(closes).sort_index()
    prices.to_csv(cache)
    return prices


def download_riskfree(start: str, end: str | None) -> pd.Series:
    """Lãi suất phi rủi ro hàng ngày (annualized, dạng thập phân) từ ^IRX."""
    cache = _cache_path("riskfree")
    if cache.exists():
        return pd.read_csv(cache, index_col=0, parse_dates=True)["rf"]
    raw = yf.download(cfg.RISK_FREE_TICKER, start=start, end=end, progress=False, auto_adjust=True)
    rf = (raw["Close"].iloc[:, 0] if hasattr(raw["Close"], "columns") else raw["Close"]) / 100.0
    rf.name = "rf"
    rf.to_frame().to_csv(cache)
    return rf


def build_returns(prices: pd.DataFrame) -> pd.DataFrame:
    """Lợi suất đơn giản hàng ngày, drop hàng đầu (NaN)."""
    return prices.pct_change().dropna(how="all")


def load_dataset() -> dict:
    """Load toàn bộ dữ liệu cần thiết: giá, lợi suất, benchmark, risk-free."""
    all_tickers = cfg.TICKERS + [cfg.BENCHMARK]
    prices = download_prices(all_tickers, cfg.START_DATE, cfg.END_DATE)
    prices = prices.dropna(how="any")  # căn chỉnh ngày giao dịch chung cho toàn bộ vũ trụ
    returns = build_returns(prices)
    rf = download_riskfree(cfg.START_DATE, cfg.END_DATE)
    rf = rf.reindex(prices.index).ffill().bfill()

    asset_prices = prices[cfg.TICKERS]
    asset_returns = returns[cfg.TICKERS]
    bench_returns = returns[cfg.BENCHMARK]

    return {
        "prices": asset_prices,
        "returns": asset_returns,
        "bench_returns": bench_returns,
        "rf": rf,
        "tickers": cfg.TICKERS,
    }


if __name__ == "__main__":
    ds = load_dataset()
    print("Prices shape:", ds["prices"].shape)
    print("Date range:", ds["prices"].index.min(), "->", ds["prices"].index.max())
    print(ds["prices"].tail())
