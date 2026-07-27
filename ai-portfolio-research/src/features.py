"""Tiền xử lý & kỹ thuật đặc trưng (feature engineering).

Mọi đặc trưng chỉ dùng dữ liệu quá khứ (trailing window) tại thời điểm t để tránh
rò rỉ dữ liệu (data leakage) vào biến mục tiêu (lợi suất kỳ vọng t -> t+HORIZON).
"""
from __future__ import annotations

import numpy as np
import pandas as pd

FEATURE_NAMES = ["ret_1", "ret_5", "ret_21", "vol_21", "rsi_14", "macd_diff", "zscore_50"]
N_FEATURES = len(FEATURE_NAMES)


def _rsi(prices: pd.Series, window: int = 14) -> pd.Series:
    delta = prices.diff()
    gain = delta.clip(lower=0).rolling(window).mean()
    loss = (-delta.clip(upper=0)).rolling(window).mean()
    rs = gain / loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return (rsi.fillna(50) - 50) / 50  # chuẩn hoá về [-1, 1]


def _macd_diff(prices: pd.Series) -> pd.Series:
    ema12 = prices.ewm(span=12, adjust=False).mean()
    ema26 = prices.ewm(span=26, adjust=False).mean()
    return (ema12 - ema26) / prices


def asset_features(price: pd.Series, ret: pd.Series) -> pd.DataFrame:
    """Bảng đặc trưng cho 1 tài sản, index = ngày."""
    df = pd.DataFrame(index=price.index)
    df["ret_1"] = ret
    df["ret_5"] = price.pct_change(5)
    df["ret_21"] = price.pct_change(21)
    df["vol_21"] = ret.rolling(21).std()
    df["rsi_14"] = _rsi(price, 14)
    df["macd_diff"] = _macd_diff(price)
    ma50 = price.rolling(50).mean()
    sd50 = price.rolling(50).std()
    df["zscore_50"] = (price - ma50) / sd50.replace(0, np.nan)
    return df[FEATURE_NAMES]


def build_feature_cube(prices: pd.DataFrame, returns: pd.DataFrame) -> tuple[np.ndarray, pd.DatetimeIndex, list[str]]:
    """Trả về mảng đặc trưng [T, N, F] căn chỉnh theo ngày, đã bỏ vùng warm-up (NaN)."""
    tickers = list(prices.columns)
    feats_by_ticker = {t: asset_features(prices[t], returns[t]) for t in tickers}
    combined = pd.concat(feats_by_ticker, axis=1)  # columns MultiIndex (ticker, feature)
    combined = combined.dropna(how="any")
    dates = combined.index
    cube = np.stack([combined[t][FEATURE_NAMES].values for t in tickers], axis=1)  # [T, N, F]
    return cube.astype(np.float32), dates, tickers


def build_samples(prices: pd.DataFrame, returns: pd.DataFrame, lookback: int, horizon: int):
    """Tạo tập mẫu windowed cho các mô hình chuỗi thời gian.

    Returns
    -------
    X : np.ndarray [S, lookback, N, F]   cửa sổ đặc trưng trailing tính tới ngày t (bao gồm t)
    y : np.ndarray [S, N]                lợi suất thực hiện t -> t+horizon (target)
    sample_dates : DatetimeIndex[S]      ngày "as of" t của mỗi mẫu (dùng để chia train/valid/test)
    tickers : list[str]
    """
    cube, dates, tickers = build_feature_cube(prices, returns)
    price_aligned = prices.loc[dates]
    T = cube.shape[0]
    xs, ys, sdates = [], [], []
    for i in range(lookback - 1, T - horizon):
        xs.append(cube[i - lookback + 1 : i + 1])
        fwd = price_aligned.iloc[i + horizon].values / price_aligned.iloc[i].values - 1.0
        ys.append(fwd)
        sdates.append(dates[i])
    X = np.stack(xs).astype(np.float32)
    y = np.stack(ys).astype(np.float32)
    sample_dates = pd.DatetimeIndex(sdates)
    return X, y, sample_dates, tickers


def last_step_panel(X: np.ndarray, y: np.ndarray, sample_dates: pd.DatetimeIndex, tickers: list[str]) -> pd.DataFrame:
    """Đặc trưng tại bước thời gian cuối cùng (snapshot ngày t), dạng panel (date, ticker) -> dùng cho hồi quy pooled."""
    last = X[:, -1, :, :]  # [S, N, F]
    S, N, F = last.shape
    idx = pd.MultiIndex.from_product([sample_dates, tickers], names=["date", "ticker"])
    df = pd.DataFrame(last.reshape(S * N, F), index=idx, columns=FEATURE_NAMES)
    df["target"] = y.reshape(S * N)
    return df
