"""Baseline hồi quy tuyến tính (Ridge) pooled trên toàn bộ tài sản.

Huấn luyện 1 lần trên tập TRAIN (đóng băng tham số), dự báo walk-forward trên các ngày
tái cân bằng của tập TEST — không refit lại trên dữ liệu tương lai (tránh leakage).
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge

from .. import features as feat


def fit(X: np.ndarray, y: np.ndarray, sample_dates: pd.DatetimeIndex, tickers: list[str],
        train_mask: np.ndarray, alpha: float = 1.0) -> tuple[Ridge, pd.DataFrame]:
    panel = feat.last_step_panel(X, y, sample_dates, tickers)
    train_dates = sample_dates[train_mask]
    train_panel = panel.loc[train_dates]
    model = Ridge(alpha=alpha)
    model.fit(train_panel[feat.FEATURE_NAMES].values, train_panel["target"].values)
    return model, panel


def predict_mu_df(model: Ridge, panel: pd.DataFrame, tickers: list[str], target_dates: pd.DatetimeIndex) -> pd.DataFrame:
    rows = []
    for d in target_dates:
        Xd = panel.loc[d].loc[tickers, feat.FEATURE_NAMES].values
        rows.append(model.predict(Xd))
    return pd.DataFrame(rows, index=target_dates, columns=tickers)
