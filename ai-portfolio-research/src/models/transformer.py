import math

import torch
import torch.nn as nn


class PositionalEncoding(nn.Module):
    def __init__(self, d_model: int, max_len: int = 512):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        pos = torch.arange(0, max_len).unsqueeze(1).float()
        div = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(pos * div)
        pe[:, 1::2] = torch.cos(pos * div)
        self.register_buffer("pe", pe.unsqueeze(0))

    def forward(self, x):  # x: [B, L, d_model]
        return x + self.pe[:, : x.size(1)]


class TemporalEncoder(nn.Module):
    """Self-attention theo trục thời gian cho 1 tài sản: [B, L, F] -> embedding [B, d_model].

    Đây là khối kiến trúc dùng chung cho Transformer baseline VÀ mô hình đề xuất (giai đoạn "A").
    """

    def __init__(self, n_features: int, d_model: int = 32, nhead: int = 4, num_layers: int = 2, ff: int = 64):
        super().__init__()
        self.input_proj = nn.Linear(n_features, d_model)
        self.pos_enc = PositionalEncoding(d_model)
        layer = nn.TransformerEncoderLayer(d_model=d_model, nhead=nhead, dim_feedforward=ff,
                                            dropout=0.1, batch_first=True)
        self.encoder = nn.TransformerEncoder(layer, num_layers=num_layers)
        self.d_model = d_model

    def forward(self, x):  # x: [B, L, F]
        z = self.input_proj(x)
        z = self.pos_enc(z)
        z = self.encoder(z)
        return z.mean(dim=1)  # mean-pool theo thời gian -> [B, d_model]


class TransformerModel(nn.Module):
    """Baseline Transformer (pooled, độc lập theo từng tài sản) -> dự báo lợi suất scalar."""

    def __init__(self, n_features: int, d_model: int = 32, nhead: int = 4, num_layers: int = 2):
        super().__init__()
        self.encoder = TemporalEncoder(n_features, d_model, nhead, num_layers)
        self.head = nn.Sequential(nn.Linear(d_model, 16), nn.ReLU(), nn.Linear(16, 1))

    def forward(self, x):  # x: [B, L, F]
        z = self.encoder(x)
        return self.head(z)
