"""Baseline CAPM: E[R_i] = Rf + beta_i * (E[Rm] - Rf), beta ước lượng rolling walk-forward."""
from __future__ import annotations

import numpy as np
import pandas as pd

from .. import config as cfg


def predict_mu_df(returns: pd.DataFrame, bench_returns: pd.Series, rf: pd.Series, tickers: list[str],
                   target_dates: pd.DatetimeIndex, lookback: int = cfg.COV_LOOKBACK,
                   horizon: int = cfg.HORIZON) -> pd.DataFrame:
    rows = []
    for d in target_dates:
        wr = returns.loc[returns.index <= d].tail(lookback)
        wm = bench_returns.loc[bench_returns.index <= d].tail(lookback)
        wrf = rf.loc[rf.index <= d].tail(lookback)
        mkt_var = wm.var()
        betas = wr.apply(lambda col: (col.cov(wm) / mkt_var) if mkt_var > 0 else 0.0)
        rf_period = float(wrf.mean()) / 252 * horizon
        mkt_period = float(wm.mean()) * horizon
        mu = rf_period + betas.values * (mkt_period - rf_period)
        rows.append(mu)
    return pd.DataFrame(rows, index=target_dates, columns=tickers)
