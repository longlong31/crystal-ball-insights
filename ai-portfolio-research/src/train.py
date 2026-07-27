"""Huấn luyện các mô hình (baseline cổ điển + học sâu) và sinh dự báo mu_hat walk-forward.

Quy trình thống nhất cho MỌI mô hình dự báo (đảm bảo không rò rỉ dữ liệu):
  1) Fit / huấn luyện CHỈ trên tập TRAIN (early-stopping bằng VALID với mô hình học sâu)
  2) Đóng băng tham số
  3) Suy luận (walk-forward) tại các ngày tái cân bằng của tập TEST
"""
from __future__ import annotations

import numpy as np
import pandas as pd
import torch

from . import config as cfg
from .baselines import regression as reg_baseline
from .baselines import capm as capm_baseline
from .baselines import apt as apt_baseline
from .models import common as mcommon
from .models.mlp import MLPModel
from .models.cnn import CNNModel
from .models.rnn import RNNModel
from .models.transformer import TransformerModel

DEVICE = "cpu"


def train_regression(X, y, sample_dates, tickers, masks, target_dates) -> pd.DataFrame:
    model, panel = reg_baseline.fit(X, y, sample_dates, tickers, masks["train"])
    return reg_baseline.predict_mu_df(model, panel, tickers, target_dates)


def train_capm(dataset, tickers, target_dates) -> pd.DataFrame:
    return capm_baseline.predict_mu_df(dataset["returns"], dataset["bench_returns"], dataset["rf"], tickers, target_dates)


def train_apt(dataset, tickers, target_dates) -> pd.DataFrame:
    factors = apt_baseline.build_factors(dataset["returns"], dataset["bench_returns"], dataset["rf"])
    return apt_baseline.predict_mu_df(dataset["returns"], factors, tickers, target_dates)


def _pooled_masks(mask: np.ndarray, n_assets: int) -> np.ndarray:
    return np.repeat(mask, n_assets)


def train_pooled_dl(model_name: str, X, y, sample_dates, tickers, masks, target_dates,
                     epochs=25, verbose=True) -> pd.DataFrame:
    n_assets = len(tickers)
    ds = mcommon.PooledWindowDataset(X, y)
    train_ds = mcommon.subset(ds, _pooled_masks(masks["train"], n_assets))
    valid_ds = mcommon.subset(ds, _pooled_masks(masks["valid"], n_assets))

    lookback, n_features = X.shape[1], X.shape[3]
    if model_name == "mlp":
        model = MLPModel(lookback, n_features)
    elif model_name == "cnn":
        model = CNNModel(lookback, n_features)
    elif model_name == "rnn_lstm":
        model = RNNModel(n_features, cell="lstm")
    elif model_name == "rnn_gru":
        model = RNNModel(n_features, cell="gru")
    elif model_name == "transformer":
        model = TransformerModel(n_features)
    else:
        raise ValueError(model_name)

    if verbose:
        print(f"[train] {model_name}: {len(train_ds)} mau train / {len(valid_ds)} mau valid")
    model = mcommon.train_regression_model(model, train_ds, valid_ds, epochs=epochs, device=DEVICE, verbose=verbose)
    torch.save(model.state_dict(), cfg.CHECKPOINTS / f"{model_name}.pt")
    return mcommon.predict_pooled(model, X, sample_dates, tickers, target_dates, device=DEVICE)
