"""Các độ đo đánh giá mô hình dự báo và hiệu suất danh mục."""
from __future__ import annotations

import numpy as np
from scipy.stats import spearmanr

TRADING_PERIODS_PER_YEAR = 12  # tái cân bằng hàng tháng -> lợi suất theo kỳ = tháng


def sharpe_ratio(period_returns: np.ndarray, rf_period: float = 0.0, periods_per_year: int = TRADING_PERIODS_PER_YEAR) -> float:
    r = np.asarray(period_returns, dtype=float)
    excess = r - rf_period
    if excess.std(ddof=1) == 0 or len(excess) < 2:
        return 0.0
    return float(excess.mean() / excess.std(ddof=1) * np.sqrt(periods_per_year))


def sortino_ratio(period_returns: np.ndarray, rf_period: float = 0.0, periods_per_year: int = TRADING_PERIODS_PER_YEAR) -> float:
    r = np.asarray(period_returns, dtype=float)
    excess = r - rf_period
    downside = excess[excess < 0]
    dd = downside.std(ddof=1) if len(downside) > 1 else 0.0
    if dd == 0:
        return 0.0
    return float(excess.mean() / dd * np.sqrt(periods_per_year))


def max_drawdown(equity_curve: np.ndarray) -> float:
    eq = np.asarray(equity_curve, dtype=float)
    peak = np.maximum.accumulate(eq)
    dd = (eq - peak) / peak
    return float(dd.min())


def calmar_ratio(period_returns: np.ndarray, equity_curve: np.ndarray, periods_per_year: int = TRADING_PERIODS_PER_YEAR) -> float:
    ann_return = float(np.mean(period_returns) * periods_per_year)
    mdd = abs(max_drawdown(equity_curve))
    if mdd == 0:
        return 0.0
    return ann_return / mdd


def information_ratio(period_returns: np.ndarray, bench_returns: np.ndarray, periods_per_year: int = TRADING_PERIODS_PER_YEAR) -> float:
    active = np.asarray(period_returns) - np.asarray(bench_returns)
    te = active.std(ddof=1)
    if te == 0 or len(active) < 2:
        return 0.0
    return float(active.mean() / te * np.sqrt(periods_per_year))


def annualized_return(period_returns: np.ndarray, periods_per_year: int = TRADING_PERIODS_PER_YEAR) -> float:
    return float(np.mean(period_returns) * periods_per_year)


def annualized_vol(period_returns: np.ndarray, periods_per_year: int = TRADING_PERIODS_PER_YEAR) -> float:
    return float(np.std(period_returns, ddof=1) * np.sqrt(periods_per_year))


def turnover(weights_history: list[np.ndarray]) -> float:
    if len(weights_history) < 2:
        return 0.0
    diffs = [np.abs(weights_history[i] - weights_history[i - 1]).sum() / 2 for i in range(1, len(weights_history))]
    return float(np.mean(diffs))


def hit_rate(pred: np.ndarray, actual: np.ndarray) -> float:
    pred, actual = np.asarray(pred).ravel(), np.asarray(actual).ravel()
    return float(np.mean(np.sign(pred) == np.sign(actual)))


def information_coefficient(pred: np.ndarray, actual: np.ndarray) -> float:
    """Spearman rank correlation giữa lợi suất dự báo và lợi suất thực hiện."""
    pred, actual = np.asarray(pred).ravel(), np.asarray(actual).ravel()
    if len(pred) < 2:
        return 0.0
    corr, _ = spearmanr(pred, actual)
    return float(corr) if corr == corr else 0.0  # NaN check


def summarize(period_returns: np.ndarray, equity_curve: np.ndarray, bench_returns: np.ndarray | None,
              weights_history: list[np.ndarray] | None, rf_period: float = 0.0) -> dict:
    out = {
        "AnnReturn": annualized_return(period_returns),
        "AnnVol": annualized_vol(period_returns),
        "Sharpe": sharpe_ratio(period_returns, rf_period),
        "Sortino": sortino_ratio(period_returns, rf_period),
        "MaxDrawdown": max_drawdown(equity_curve),
        "Calmar": calmar_ratio(period_returns, equity_curve),
    }
    if bench_returns is not None:
        out["InformationRatio"] = information_ratio(period_returns, bench_returns)
    if weights_history is not None:
        out["AvgTurnover"] = turnover(weights_history)
    return out
