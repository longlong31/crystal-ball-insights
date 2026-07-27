import torch
import torch.nn as nn


class CNNModel(nn.Module):
    """Baseline 1D-CNN: tích chập theo trục thời gian để bắt mẫu hình cục bộ (local patterns)."""

    def __init__(self, lookback: int, n_features: int, channels: int = 32):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv1d(n_features, channels, kernel_size=5, padding=2), nn.ReLU(),
            nn.Conv1d(channels, channels, kernel_size=3, padding=1), nn.ReLU(),
            nn.AdaptiveAvgPool1d(1),
        )
        self.head = nn.Sequential(nn.Linear(channels, 32), nn.ReLU(), nn.Linear(32, 1))

    def forward(self, x):  # x: [B, L, F]
        x = x.transpose(1, 2)  # -> [B, F, L]
        z = self.conv(x).squeeze(-1)  # [B, channels]
        return self.head(z)
