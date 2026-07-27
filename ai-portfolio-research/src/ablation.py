"""Ablation Studies cho mô hình đề xuất PA-Transformer.

Huấn luyện lần lượt 3 giai đoạn kiến trúc (xem models/proposed.py):
  A       : temporal self-attention độc lập theo tài sản
  A+B     : + cross-asset attention
  A+B+C   : + Sharpe-aware loss (khả vi)

Mỗi giai đoạn được huấn luyện lại từ đầu (không kế thừa trọng số) để đo đóng góp độc lập
của từng "tính chất" kiến trúc lên hiệu suất danh mục ngoài mẫu (out-of-sample).
"""
from __future__ import annotations

import numpy as np
import pandas as pd
import torch

from . import config as cfg
from .models import common as mcommon
from .models.proposed import ProposedNet, ABLATION_STAGES

DEVICE = "cpu"


def train_stage(stage_name: str, X, y, sample_dates, tickers, masks, target_dates,
                 epochs=25, verbose=True) -> tuple[pd.DataFrame, torch.nn.Module]:
    cfg_stage = ABLATION_STAGES[stage_name]
    ds = mcommon.DateBatchedDataset(X, y)
    train_ds = mcommon.subset(ds, masks["train"])
    valid_ds = mcommon.subset(ds, masks["valid"])

    n_features = X.shape[3]
    model = ProposedNet(n_features, use_cross_asset=cfg_stage["use_cross_asset"])
    if verbose:
        print(f"[ablation] stage={stage_name} use_cross_asset={cfg_stage['use_cross_asset']} "
              f"sharpe_weight={cfg_stage['sharpe_weight']}  "
              f"({len(train_ds)} mau train / {len(valid_ds)} mau valid)")
    model = mcommon.train_proposed_model(
        model, train_ds, valid_ds, epochs=epochs, batch_size=16,
        sharpe_weight=cfg_stage["sharpe_weight"], device=DEVICE, verbose=verbose,
    )
    torch.save(model.state_dict(), cfg.CHECKPOINTS / f"proposed_{stage_name}.pt")
    pred_df = mcommon.predict_proposed(model, X, sample_dates, tickers, target_dates, device=DEVICE)
    return pred_df, model


def run_all_stages(X, y, sample_dates, tickers, masks, target_dates, epochs=25, verbose=True):
    results = {}
    for stage_name in ABLATION_STAGES:
        pred_df, model = train_stage(stage_name, X, y, sample_dates, tickers, masks, target_dates,
                                      epochs=epochs, verbose=verbose)
        results[stage_name] = {"pred_df": pred_df, "model": model}
    return results
