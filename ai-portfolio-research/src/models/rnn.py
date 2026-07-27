import torch
import torch.nn as nn


class RNNModel(nn.Module):
    """Baseline RNN (LSTM hoặc GRU) 2 lớp -> hidden state cuối -> dự báo lợi suất."""

    def __init__(self, n_features: int, hidden: int = 32, layers: int = 2, cell: str = "lstm"):
        super().__init__()
        rnn_cls = nn.LSTM if cell.lower() == "lstm" else nn.GRU
        self.rnn = rnn_cls(input_size=n_features, hidden_size=hidden, num_layers=layers,
                            batch_first=True, dropout=0.2 if layers > 1 else 0.0)
        self.head = nn.Sequential(nn.Linear(hidden, 16), nn.ReLU(), nn.Linear(16, 1))

    def forward(self, x):  # x: [B, L, F]
        out, _ = self.rnn(x)
        last = out[:, -1, :]
        return self.head(last)
