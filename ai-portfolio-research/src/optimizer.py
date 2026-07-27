"""Tối ưu hoá danh mục: Max-Sharpe / Min-Variance / Risk-Parity / Equal-Weight (Markowitz mean-variance)."""
from __future__ import annotations

import numpy as np
from scipy.optimize import minimize
from sklearn.covariance import LedoitWolf


def shrinkage_covariance(returns_window: np.ndarray) -> np.ndarray:
    """Ước lượng hiệp phương sai co rút Ledoit-Wolf (ổn định hơn covariance mẫu thô)."""
    return LedoitWolf().fit(returns_window).covariance_


def equal_weight(n: int) -> np.ndarray:
    return np.full(n, 1.0 / n)


def risk_parity_weight(cov: np.ndarray) -> np.ndarray:
    inv_vol = 1.0 / np.sqrt(np.diag(cov))
    return inv_vol / inv_vol.sum()


def min_variance_weight(cov: np.ndarray, max_weight: float = 1.0) -> np.ndarray:
    n = cov.shape[0]
    w0 = equal_weight(n)
    bounds = [(0.0, max_weight)] * n
    cons = [{"type": "eq", "fun": lambda w: w.sum() - 1.0}]
    res = minimize(lambda w: w @ cov @ w, w0, method="SLSQP", bounds=bounds, constraints=cons)
    return res.x if res.success else w0


def max_sharpe_weight(mu: np.ndarray, cov: np.ndarray, rf: float = 0.0, max_weight: float = 0.25) -> np.ndarray:
    """Danh mục tối đa hoá Sharpe ratio kỳ vọng (long-only, giới hạn tập trung mỗi tài sản)."""
    n = len(mu)
    w0 = equal_weight(n)
    bounds = [(0.0, max_weight)] * n
    cons = [{"type": "eq", "fun": lambda w: w.sum() - 1.0}]

    def neg_sharpe(w):
        port_ret = w @ mu
        port_vol = np.sqrt(max(w @ cov @ w, 1e-12))
        return -(port_ret - rf) / port_vol

    res = minimize(neg_sharpe, w0, method="SLSQP", bounds=bounds, constraints=cons, options={"maxiter": 500})
    if not res.success or np.any(np.isnan(res.x)):
        return w0
    w = np.clip(res.x, 0, None)
    return w / w.sum()
