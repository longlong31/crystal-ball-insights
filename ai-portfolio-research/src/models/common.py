"""Dataset & vòng lặp huấn luyện dùng chung cho các mô hình PyTorch."""
from __future__ import annotations

import os

import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader

from .. import config as cfg

torch.manual_seed(cfg.SEED)
torch.set_num_threads(max(1, os.cpu_count() or 1))


class PooledWindowDataset(Dataset):
    """Mỗi mẫu = (ngày, tài sản) độc lập -> dùng cho MLP/CNN/RNN/Transformer baseline (pooled)."""

    def __init__(self, X: np.ndarray, y: np.ndarray):
        # X: [S, L, N, F] -> [S, N, L, F] -> [S*N, L, F]
        S, L, N, F = X.shape
        Xt = np.transpose(X, (0, 2, 1, 3)).reshape(S * N, L, F)
        self.X = torch.tensor(Xt, dtype=torch.float32)
        self.y = torch.tensor(y.reshape(S * N), dtype=torch.float32)

    def __len__(self):
        return len(self.y)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]


class DateBatchedDataset(Dataset):
    """Mỗi mẫu = 1 ngày, chứa toàn bộ N tài sản -> dùng cho mô hình đề xuất (cross-asset attention)."""

    def __init__(self, X: np.ndarray, y: np.ndarray):
        # X: [S, L, N, F] -> [S, N, L, F]
        Xt = np.transpose(X, (0, 2, 1, 3))
        self.X = torch.tensor(Xt, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.float32)  # [S, N]

    def __len__(self):
        return len(self.y)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]


def subset(ds: Dataset, mask: np.ndarray) -> torch.utils.data.Subset:
    idx = np.where(mask)[0]
    return torch.utils.data.Subset(ds, idx)


def train_regression_model(model: torch.nn.Module, train_ds, valid_ds, epochs=25, lr=1e-3,
                            batch_size=256, patience=5, device="cpu", verbose=True) -> torch.nn.Module:
    """Huấn luyện mô hình pooled dự báo scalar return với MSE loss + early stopping trên valid."""
    model.to(device)
    opt = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)
    loss_fn = torch.nn.MSELoss()
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    valid_loader = DataLoader(valid_ds, batch_size=batch_size, shuffle=False)

    best_val, best_state, bad_epochs = float("inf"), None, 0
    for epoch in range(epochs):
        model.train()
        for xb, yb in train_loader:
            xb, yb = xb.to(device), yb.to(device)
            opt.zero_grad()
            pred = model(xb).squeeze(-1)
            loss = loss_fn(pred, yb)
            loss.backward()
            opt.step()

        model.eval()
        val_losses = []
        with torch.no_grad():
            for xb, yb in valid_loader:
                xb, yb = xb.to(device), yb.to(device)
                pred = model(xb).squeeze(-1)
                val_losses.append(loss_fn(pred, yb).item())
        val_loss = float(np.mean(val_losses)) if val_losses else float("inf")
        if verbose:
            print(f"  epoch {epoch+1:02d}/{epochs}  valid_mse={val_loss:.6f}")

        if val_loss < best_val - 1e-7:
            best_val, best_state, bad_epochs = val_loss, {k: v.clone() for k, v in model.state_dict().items()}, 0
        else:
            bad_epochs += 1
            if bad_epochs >= patience:
                if verbose:
                    print(f"  early stopping tai epoch {epoch+1}")
                break

    if best_state is not None:
        model.load_state_dict(best_state)
    return model


def predict_pooled(model: torch.nn.Module, X: np.ndarray, sample_dates, tickers: list[str],
                    target_dates, device: str = "cpu") -> "object":
    """Dự báo với mô hình pooled (MLP/CNN/RNN/Transformer baseline) tại các ngày target_dates."""
    import pandas as pd

    date_to_idx = {d: i for i, d in enumerate(sample_dates)}
    model.eval()
    rows = []
    with torch.no_grad():
        for d in target_dates:
            i = date_to_idx[d]
            x_date = X[i]  # [L, N, F]
            x_date = np.transpose(x_date, (1, 0, 2))  # [N, L, F]
            xb = torch.tensor(x_date, dtype=torch.float32, device=device)
            pred = model(xb).squeeze(-1).cpu().numpy()  # [N]
            rows.append(pred)
    return pd.DataFrame(rows, index=target_dates, columns=tickers)


def predict_proposed(model: torch.nn.Module, X: np.ndarray, sample_dates, tickers: list[str],
                      target_dates, device: str = "cpu") -> "object":
    """Dự báo với mô hình đề xuất (cross-asset) tại các ngày target_dates."""
    import pandas as pd

    date_to_idx = {d: i for i, d in enumerate(sample_dates)}
    model.eval()
    rows = []
    with torch.no_grad():
        for d in target_dates:
            i = date_to_idx[d]
            x_date = X[i]  # [L, N, F]
            x_date = np.transpose(x_date, (1, 0, 2))[None, ...]  # [1, N, L, F]
            xb = torch.tensor(x_date, dtype=torch.float32, device=device)
            pred = model(xb).squeeze(0).cpu().numpy()  # [N]
            rows.append(pred)
    return pd.DataFrame(rows, index=target_dates, columns=tickers)


def differentiable_sharpe_loss(pred: torch.Tensor, y: torch.Tensor, temperature: float = 10.0, eps: float = 1e-6):
    """Sharpe proxy khả vi: chuyển dự báo -> trọng số danh mục (softmax, long-only) -> lợi suất thực hiện batch.

    pred, y: [B, N] (B = số ngày trong minibatch, N = số tài sản)
    """
    w = torch.softmax(pred * temperature, dim=-1)          # long-only, tổng = 1 mỗi ngày
    port_ret = (w * y).sum(dim=-1)                          # [B] lợi suất danh mục thực hiện mỗi ngày trong batch
    sharpe_proxy = port_ret.mean() / (port_ret.std() + eps)
    return -sharpe_proxy, port_ret


def train_proposed_model(model: torch.nn.Module, train_ds, valid_ds, epochs=25, lr=1e-3, batch_size=16,
                          patience=5, mse_weight=1.0, sharpe_weight=0.0, device="cpu", verbose=True) -> torch.nn.Module:
    """Huấn luyện mô hình đề xuất; sharpe_weight=0 -> tương đương MSE thuần (giai đoạn A/A+B)."""
    model.to(device)
    opt = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)
    mse_fn = torch.nn.MSELoss()
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    valid_loader = DataLoader(valid_ds, batch_size=batch_size, shuffle=False)

    best_val, best_state, bad_epochs = float("inf"), None, 0
    for epoch in range(epochs):
        model.train()
        for xb, yb in train_loader:
            xb, yb = xb.to(device), yb.to(device)
            opt.zero_grad()
            pred = model(xb)  # [B, N]
            loss = mse_fn(pred, yb)
            if sharpe_weight > 0:
                sharpe_neg, _ = differentiable_sharpe_loss(pred, yb)
                loss = mse_weight * loss + sharpe_weight * sharpe_neg
            loss.backward()
            opt.step()

        model.eval()
        val_losses = []
        with torch.no_grad():
            for xb, yb in valid_loader:
                xb, yb = xb.to(device), yb.to(device)
                pred = model(xb)
                val_losses.append(mse_fn(pred, yb).item())
        val_loss = float(np.mean(val_losses)) if val_losses else float("inf")
        if verbose:
            print(f"  epoch {epoch+1:02d}/{epochs}  valid_mse={val_loss:.6f}")

        if val_loss < best_val - 1e-7:
            best_val, best_state, bad_epochs = val_loss, {k: v.clone() for k, v in model.state_dict().items()}, 0
        else:
            bad_epochs += 1
            if bad_epochs >= patience:
                if verbose:
                    print(f"  early stopping tai epoch {epoch+1}")
                break

    if best_state is not None:
        model.load_state_dict(best_state)
    return model
