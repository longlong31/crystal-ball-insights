"""Walk-forward backtest engine: tái cân bằng theo lịch, không nhìn trước dữ liệu tương lai."""
from __future__ import annotations

import numpy as np
import pandas as pd

from . import optimizer as opt
from . import config as cfg


def get_rebalance_dates(sample_dates: pd.DatetimeIndex, horizon: int) -> pd.DatetimeIndex:
    """Lấy các ngày tái cân bằng cách đều nhau `horizon` phiên (không chồng lấp) trong tập test."""
    return sample_dates[::horizon]


def _period_slice_return(returns: pd.DataFrame, start_date, end_date, weights: np.ndarray) -> np.ndarray:
    mask = (returns.index > start_date) & (returns.index <= end_date)
    return returns.loc[mask].values @ weights, returns.index[mask]


def run_backtest(
    prices: pd.DataFrame,
    returns: pd.DataFrame,
    rf: pd.Series,
    bench_returns: pd.Series,
    rebalance_dates: pd.DatetimeIndex,
    weight_fn,
    cost_bps: float = cfg.TRANSACTION_COST_BPS,
) -> dict:
    """weight_fn(date) -> np.ndarray trọng số [N] hợp lệ (>=0, tổng=1), chỉ dùng dữ liệu <= date."""
    period_returns, bench_period_returns, period_rf = [], [], []
    weights_history: list[np.ndarray] = []
    equity = [1.0]
    equity_dates = [rebalance_dates[0]]

    prev_w = None
    for i, date in enumerate(rebalance_dates):
        w = weight_fn(date)
        cost = 0.0
        if prev_w is not None:
            cost = (cost_bps / 1e4) * np.abs(w - prev_w).sum()
        prev_w = w
        weights_history.append(w)

        end_date = rebalance_dates[i + 1] if i + 1 < len(rebalance_dates) else prices.index[-1]
        daily_r, dates_slice = _period_slice_return(returns, date, end_date, w)
        bench_daily, _ = _period_slice_return(pd.DataFrame({"b": bench_returns}), date, end_date, np.array([1.0]))
        rf_daily = rf.loc[(rf.index > date) & (rf.index <= end_date)].values

        if len(daily_r) == 0:
            continue
        period_ret = float(np.prod(1 + daily_r) - 1 - cost)
        period_bench = float(np.prod(1 + bench_daily) - 1)
        period_rf_val = float(np.prod(1 + rf_daily / 252) - 1) if len(rf_daily) else 0.0

        period_returns.append(period_ret)
        bench_period_returns.append(period_bench)
        period_rf.append(period_rf_val)

        for dr in daily_r:
            equity.append(equity[-1] * (1 + dr))
        equity_dates.extend(dates_slice)

    return {
        "period_returns": np.array(period_returns),
        "bench_period_returns": np.array(bench_period_returns),
        "period_rf": np.array(period_rf),
        "weights_history": weights_history,
        "equity_curve": np.array(equity),
        "equity_dates": pd.DatetimeIndex(equity_dates),
    }


# ---- Chiến lược (weight functions) ----

def predicted_mu_strategy(pred_df: pd.DataFrame, returns: pd.DataFrame, max_weight: float = cfg.MAX_WEIGHT,
                           cov_lookback: int = cfg.COV_LOOKBACK, rf: pd.Series | None = None):
    """Chiến lược Max-Sharpe dùng lợi suất kỳ vọng dự báo (mu_hat) từ 1 mô hình + hiệp phương sai rolling."""
    def fn(date):
        mu = pred_df.loc[date].values
        window = returns.loc[returns.index <= date].tail(cov_lookback).values
        cov = opt.shrinkage_covariance(window)
        rf_val = float(rf.loc[rf.index <= date].iloc[-1]) if rf is not None else 0.0
        return opt.max_sharpe_weight(mu, cov, rf=rf_val / 252 * cfg.HORIZON, max_weight=max_weight)
    return fn


def equal_weight_strategy(n_assets: int):
    w = opt.equal_weight(n_assets)
    return lambda date: w


def risk_parity_strategy(returns: pd.DataFrame, cov_lookback: int = cfg.COV_LOOKBACK):
    def fn(date):
        window = returns.loc[returns.index <= date].tail(cov_lookback).values
        cov = opt.shrinkage_covariance(window)
        return opt.risk_parity_weight(cov)
    return fn


def sixty_forty_strategy(tickers: list[str], equity_tickers: list[str], bond_tickers: list[str]):
    n = len(tickers)
    w = np.zeros(n)
    for i, t in enumerate(tickers):
        if t in equity_tickers:
            w[i] = 0.6 / len(equity_tickers)
        elif t in bond_tickers:
            w[i] = 0.4 / len(bond_tickers)
    return lambda date: w
