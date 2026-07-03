# ============================================================
# 11 — PCA & CORRELATION on rolling returns of THIS symbol
# Tách chuỗi returns thành các cửa sổ và phân tích thành phần chính
# ------------------------------------------------------------
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

r = np.array(returns, dtype=float)
if len(r) < 60:
    raise ValueError("Cần tối thiểu 60 phiên returns để chạy PCA")

# Build feature matrix: 5 features (r_t, r_{t-1}, r_{t-2}, |r|, r^2)
X = np.column_stack([
    r[4:], r[3:-1], r[2:-2], np.abs(r[4:]), r[4:]**2
])
X = (X - X.mean(0)) / (X.std(0) + 1e-12)

# Covariance & correlation
cov  = np.cov(X.T)
corr = np.corrcoef(X.T)

# Eigen decomposition
eigvals, eigvecs = np.linalg.eigh(cov)
order = np.argsort(eigvals)[::-1]
eigvals = eigvals[order]
eigvecs = eigvecs[:, order]

explained = eigvals / eigvals.sum()
cumulative = np.cumsum(explained)

metrics = {
    "N observations":     len(X),
    "PC1 explained":      f"{explained[0]*100:.2f}%",
    "PC2 explained":      f"{explained[1]*100:.2f}%",
    "PC1+PC2":            f"{cumulative[1]*100:.2f}%",
    "Largest eigenvalue": f"{eigvals[0]:.4f}",
    "Skew(r)":            f"{pd.Series(r).skew():.3f}",
    "Kurt(r)":            f"{pd.Series(r).kurt():.3f}",
    "Autocorr lag1":      f"{pd.Series(r).autocorr(1):.3f}",
}

fig, axes = plt.subplots(1, 3, figsize=(14, 4.2))

# scree
axes[0].bar(range(1, len(eigvals) + 1), explained * 100, color="#3b82f6")
axes[0].plot(range(1, len(eigvals) + 1), cumulative * 100, "o-", color="#f59e0b", label="Cumulative")
axes[0].set_title("Scree plot (Explained variance %)")
axes[0].set_xlabel("Principal Component")
axes[0].legend(); axes[0].grid(alpha=0.3)

# correlation heatmap
im = axes[1].imshow(corr, vmin=-1, vmax=1, cmap="RdBu_r")
axes[1].set_xticks(range(5)); axes[1].set_yticks(range(5))
labels = ["r_t","r_{t-1}","r_{t-2}","|r|","r²"]
axes[1].set_xticklabels(labels, rotation=45); axes[1].set_yticklabels(labels)
axes[1].set_title("Correlation matrix")
for i in range(5):
    for j in range(5):
        axes[1].text(j, i, f"{corr[i,j]:.2f}", ha="center", va="center",
                     color="white" if abs(corr[i,j]) > 0.5 else "black", fontsize=8)
plt.colorbar(im, ax=axes[1], fraction=0.046)

# PC1 loadings
axes[2].barh(labels, eigvecs[:, 0], color="#10b981")
axes[2].set_title(f"PC1 loadings ({explained[0]*100:.1f}% var)")
axes[2].grid(alpha=0.3, axis="x")
axes[2].axvline(0, color="white", lw=0.5)

plt.suptitle(f"{symbol} — PCA & Correlation Analysis")
plt.tight_layout()
