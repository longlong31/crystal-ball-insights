"""Baseline APT (Arbitrage Pricing Theory) — hồi quy đa nhân tố tự xây dựng từ chính vũ trụ đầu tư.

3 nhân tố (trailing, không rò rỉ):
  MKT — lợi suất vượt trội thị trường (benchmark - risk free)
  MOM — nhân tố động lượng (top-quartile trừ bottom-quartile theo momentum 21 phiên)
  VOL — nhân tố biến động thấp (low-vol trừ high-vol quartile theo độ lệch chuẩn 21 phiên)
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from .. import config as cfg


def _cross_sectional_factor(score: pd.DataFrame, returns: pd.DataFrame, ascending_long: bool) -> pd.Series:
    """long = nhóm điểm cao (ascending_long=False) hoặc điểm thấp (ascending_long=True); short = nhóm còn lại."""
    out = {}
    for d, row in score.iterrows():
        s = row.dropna()
        if len(s) < 4:
            continue
        q = max(1, len(s) // 4)
        long_ids = s.nsmallest(q).index if ascending_long else s.nlargest(q).index
        short_ids = s.nlargest(q).index if ascending_long else s.nsmallest(q).index
        out[d] = returns.loc[d, long_ids].mean() - returns.loc[d, short_ids].mean()
    return pd.Series(out)


def build_factors(returns: pd.DataFrame, bench_returns: pd.Series, rf: pd.Series) -> pd.DataFrame:
    mkt = (bench_returns - rf / 252).rename("MKT")
    mom_score = returns.rolling(21).sum()
    vol_score = returns.rolling(21).std()
    mom = _cross_sectional_factor(mom_score, returns, ascending_long=False).rename("MOM")  # long = cao momentum
    vol = _cross_sectional_factor(vol_score, returns, ascending_long=True).rename("VOL")   # long = vol thấp
    factors = pd.concat([mkt, mom, vol], axis=1).dropna()
    return factors


def predict_mu_df(returns: pd.DataFrame, factors: pd.DataFrame, tickers: list[str],
                   target_dates: pd.DatetimeIndex, lookback: int = cfg.COV_LOOKBACK,
                   horizon: int = cfg.HORIZON) -> pd.DataFrame:
    rows = []
    for d in target_dates:
        f_window = factors.loc[factors.index <= d].tail(lookback)
        r_window = returns.loc[f_window.index]
        Fmat = np.column_stack([np.ones(len(f_window)), f_window.values])  # [T, 1+K] intercept + factors
        f_forecast = np.concatenate([[1.0], f_window.mean().values])
        mu = []
        for t in tickers:
            y = r_window[t].values
            coef, *_ = np.linalg.lstsq(Fmat, y, rcond=None)
            daily_mu = float(coef @ f_forecast)
            mu.append(daily_mu * horizon)
        rows.append(mu)
    return pd.DataFrame(rows, index=target_dates, columns=tickers)
