import torch
import torch.nn as nn


class MLPModel(nn.Module):
    """Baseline MLP: làm phẳng cửa sổ [L,F] -> mạng fully-connected -> 1 giá trị lợi suất dự báo."""

    def __init__(self, lookback: int, n_features: int, hidden: int = 128):
        super().__init__()
        in_dim = lookback * n_features
        self.net = nn.Sequential(
            nn.Flatten(),
            nn.Linear(in_dim, hidden), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(hidden, hidden // 2), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(hidden // 2, 1),
        )

    def forward(self, x):  # x: [B, L, F]
        return self.net(x)
