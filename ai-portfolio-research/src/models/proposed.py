"""Mô hình đề xuất: PA-Transformer (Portfolio-Aware Transformer).

3 "tính chất" kiến trúc, đúng theo yêu cầu Ablation Studies:
  A     — Temporal self-attention độc lập theo từng tài sản (TemporalEncoder, giống Transformer baseline)
  A+B   — + Cross-asset attention: các tài sản "chú ý" lẫn nhau tại cùng thời điểm (nắm bắt tương quan/regime)
  A+B+C — + Sharpe-aware loss: hàm mất mát khả vi tối ưu trực tiếp Sharpe ratio của danh mục ngụ ý,
          thay vì chỉ tối thiểu hoá sai số dự báo (MSE) từng tài sản riêng lẻ

use_cross_asset và sharpe_weight (ở train_proposed_model) là 2 công tắc dùng để chạy ablation.
"""
from __future__ import annotations

import torch
import torch.nn as nn

from .transformer import TemporalEncoder


class ProposedNet(nn.Module):
    def __init__(self, n_features: int, d_model: int = 32, nhead: int = 4, num_layers: int = 2,
                 use_cross_asset: bool = True):
        super().__init__()
        self.temporal_encoder = TemporalEncoder(n_features, d_model, nhead, num_layers)
        self.use_cross_asset = use_cross_asset
        if use_cross_asset:
            self.cross_attn = nn.MultiheadAttention(embed_dim=d_model, num_heads=nhead, batch_first=True)
            self.norm = nn.LayerNorm(d_model)
        self.head = nn.Sequential(nn.Linear(d_model, 16), nn.ReLU(), nn.Linear(16, 1))

    def forward(self, x):  # x: [B, N, L, F]
        B, N, L, F = x.shape
        z = self.temporal_encoder(x.reshape(B * N, L, F))          # [B*N, d_model]
        z = z.reshape(B, N, -1)                                     # [B, N, d_model]  (N tài sản = "token")

        if self.use_cross_asset:
            attn_out, _ = self.cross_attn(z, z, z)                  # tài sản chú ý lẫn nhau
            z = self.norm(z + attn_out)

        pred = self.head(z).squeeze(-1)                             # [B, N]
        return pred


ABLATION_STAGES = {
    "A_temporal_only": dict(use_cross_asset=False, sharpe_weight=0.0),
    "AB_cross_asset": dict(use_cross_asset=True, sharpe_weight=0.0),
    "ABC_sharpe_loss": dict(use_cross_asset=True, sharpe_weight=0.5),
}
