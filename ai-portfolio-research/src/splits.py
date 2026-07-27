"""Chia tập train / valid / test theo thời gian (walk-forward), có embargo chống rò rỉ dữ liệu."""
from __future__ import annotations

import numpy as np
import pandas as pd

from . import config as cfg


def time_split(sample_dates: pd.DatetimeIndex) -> dict[str, np.ndarray]:
    """Trả về boolean mask cho train/valid/test dựa trên mốc thời gian trong config.

    Một khoảng đệm (embargo) = LOOKBACK + HORIZON phiên được loại bỏ quanh mỗi ranh giới
    để mẫu train không "nhìn thấy" thông tin rơi vào cửa sổ đặc trưng/target của tập sau.
    """
    train_end = pd.Timestamp(cfg.TRAIN_END)
    valid_end = pd.Timestamp(cfg.VALID_END)
    embargo = pd.tseries.offsets.BDay(cfg.EMBARGO)

    train_mask = sample_dates <= train_end
    valid_mask = (sample_dates > train_end + embargo) & (sample_dates <= valid_end)
    test_mask = sample_dates > valid_end + embargo

    return {
        "train": np.asarray(train_mask),
        "valid": np.asarray(valid_mask),
        "test": np.asarray(test_mask),
    }


def describe_splits(sample_dates: pd.DatetimeIndex) -> str:
    m = time_split(sample_dates)
    lines = []
    for name in ["train", "valid", "test"]:
        idx = np.where(m[name])[0]
        if len(idx) == 0:
            lines.append(f"{name}: 0 mẫu")
            continue
        d0, d1 = sample_dates[idx[0]], sample_dates[idx[-1]]
        lines.append(f"{name}: {len(idx)} mẫu | {d0.date()} -> {d1.date()}")
    return "\n".join(lines)


if __name__ == "__main__":
    from . import data_pipeline as dp
    from . import features as feat

    ds = dp.load_dataset()
    X, y, sample_dates, tickers = feat.build_samples(ds["prices"], ds["returns"], cfg.LOOKBACK, cfg.HORIZON)
    print("X shape:", X.shape, "y shape:", y.shape)
    print(describe_splits(sample_dates))
