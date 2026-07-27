"""Script tổng: chạy toàn bộ pipeline train -> backtest -> đánh giá -> ablation -> xuất báo cáo.

Chạy:  python -m src.evaluate
"""
from __future__ import annotations

import json
import time

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from . import config as cfg
from . import data_pipeline as dp
from . import features as feat
from . import splits as sp
from . import metrics as mx
from . import backtest as bt
from . import optimizer as opt
from . import train as tr
from . import ablation as ab
from .baselines import rule_based


def information_coefficient_series(pred_df: pd.DataFrame, y: np.ndarray, sample_dates: pd.DatetimeIndex,
                                    tickers: list[str]) -> tuple[float, float]:
    date_to_idx = {d: i for i, d in enumerate(sample_dates)}
    ics, hits = [], []
    for d in pred_df.index:
        actual = y[date_to_idx[d]]
        pred = pred_df.loc[d].values
        ics.append(mx.information_coefficient(pred, actual))
        hits.append(mx.hit_rate(pred, actual))
    return float(np.nanmean(ics)), float(np.nanmean(hits))


def run_strategy(name: str, category: str, weight_fn, prices, returns, rf, bench_returns, rebalance_dates,
                  results_rows: list, curves: dict):
    res = bt.run_backtest(prices, returns, rf, bench_returns, rebalance_dates, weight_fn)
    rf_mean = float(np.mean(res["period_rf"])) if len(res["period_rf"]) else 0.0
    summary = mx.summarize(res["period_returns"], res["equity_curve"], res["bench_period_returns"],
                            res["weights_history"], rf_period=rf_mean)
    summary["strategy"] = name
    summary["category"] = category
    results_rows.append(summary)
    curves[name] = res
    print(f"  {name:22s} Sharpe={summary['Sharpe']:+.3f}  AnnReturn={summary['AnnReturn']*100:+.2f}%  "
          f"MDD={summary['MaxDrawdown']*100:.2f}%  Turnover={summary.get('AvgTurnover', 0):.3f}")
    return res


def main(epochs_dl: int = 15, epochs_proposed: int = 25):
    t0 = time.time()
    print("=" * 70)
    print("BUOC 1-2: Thu thap & tien xu ly du lieu")
    print("=" * 70)
    ds = dp.load_dataset()
    print(f"Vu tru dau tu: {ds['tickers']}")
    print(f"Khoang thoi gian: {ds['prices'].index.min().date()} -> {ds['prices'].index.max().date()}")

    X, y, sample_dates, tickers = feat.build_samples(ds["prices"], ds["returns"], cfg.LOOKBACK, cfg.HORIZON)
    masks = sp.time_split(sample_dates)
    print(sp.describe_splits(sample_dates))

    rebalance_dates = bt.get_rebalance_dates(sample_dates[masks["test"]], cfg.HORIZON)
    print(f"So lan tai can bang (test, moi ~{cfg.HORIZON} phien): {len(rebalance_dates)}")

    results_rows: list[dict] = []
    curves: dict[str, dict] = {}
    prices, returns, rf, bench_returns = ds["prices"], ds["returns"], ds["rf"], ds["bench_returns"]

    print("\n" + "=" * 70)
    print("BASELINE — Rule-based (khong can du bao)")
    print("=" * 70)
    run_strategy("EqualWeight", "Rule-based", rule_based.equal_weight_strategy(len(tickers)),
                 prices, returns, rf, bench_returns, rebalance_dates, results_rows, curves)
    run_strategy("RiskParity", "Rule-based", rule_based.risk_parity_strategy(returns),
                 prices, returns, rf, bench_returns, rebalance_dates, results_rows, curves)
    run_strategy("60/40", "Rule-based",
                 rule_based.sixty_forty_strategy(tickers, cfg.EQUITY_TICKERS, cfg.DIVERSIFIERS),
                 prices, returns, rf, bench_returns, rebalance_dates, results_rows, curves)

    print("\n" + "=" * 70)
    print("BASELINE — Co dien (Regression / CAPM / APT)")
    print("=" * 70)
    ic_rows = []
    for name, pred_df in [
        ("LinearRegression", tr.train_regression(X, y, sample_dates, tickers, masks, rebalance_dates)),
        ("CAPM", tr.train_capm(ds, tickers, rebalance_dates)),
        ("APT_3Factor", tr.train_apt(ds, tickers, rebalance_dates)),
    ]:
        ic, hr = information_coefficient_series(pred_df, y, sample_dates, tickers)
        ic_rows.append({"strategy": name, "IC": ic, "HitRate": hr})
        wfn = bt.predicted_mu_strategy(pred_df, returns, rf=rf)
        run_strategy(name, "Classical", wfn, prices, returns, rf, bench_returns, rebalance_dates, results_rows, curves)

    print("\n" + "=" * 70)
    print(f"DL BASELINE — MLP / CNN / RNN(LSTM,GRU) / Transformer  (epochs<={epochs_dl})")
    print("=" * 70)
    for model_name, label in [("mlp", "MLP"), ("cnn", "CNN"), ("rnn_lstm", "LSTM"),
                               ("rnn_gru", "GRU"), ("transformer", "Transformer")]:
        pred_df = tr.train_pooled_dl(model_name, X, y, sample_dates, tickers, masks, rebalance_dates,
                                      epochs=epochs_dl, verbose=False)
        ic, hr = information_coefficient_series(pred_df, y, sample_dates, tickers)
        ic_rows.append({"strategy": label, "IC": ic, "HitRate": hr})
        wfn = bt.predicted_mu_strategy(pred_df, returns, rf=rf)
        run_strategy(label, "DL baseline", wfn, prices, returns, rf, bench_returns, rebalance_dates, results_rows, curves)

    print("\n" + "=" * 70)
    print(f"MO HINH DE XUAT — PA-Transformer, Ablation Studies A / A+B / A+B+C  (epochs<={epochs_proposed})")
    print("=" * 70)
    stage_labels = {"A_temporal_only": "Proposed-A", "AB_cross_asset": "Proposed-A+B",
                     "ABC_sharpe_loss": "Proposed-A+B+C"}
    ablation_results = ab.run_all_stages(X, y, sample_dates, tickers, masks, rebalance_dates,
                                          epochs=epochs_proposed, verbose=False)
    ablation_sharpes = {}
    for stage_name, out in ablation_results.items():
        label = stage_labels[stage_name]
        pred_df = out["pred_df"]
        ic, hr = information_coefficient_series(pred_df, y, sample_dates, tickers)
        ic_rows.append({"strategy": label, "IC": ic, "HitRate": hr})
        wfn = bt.predicted_mu_strategy(pred_df, returns, rf=rf)
        res = run_strategy(label, "Proposed", wfn, prices, returns, rf, bench_returns, rebalance_dates,
                            results_rows, curves)
        rf_mean_stage = float(np.mean(res["period_rf"])) if len(res["period_rf"]) else 0.0
        ablation_sharpes[label] = mx.sharpe_ratio(res["period_returns"], rf_period=rf_mean_stage)

    # ---- Ablation table (dung dinh dang de bai yeu cau) ----
    base = ablation_sharpes["Proposed-A"]
    ablation_table = pd.DataFrame([
        {"Tinh chat": "A (temporal self-attention)", "Sharpe": ablation_sharpes["Proposed-A"], "Delta_vs_A": 0.0},
        {"Tinh chat": "A + B (cross-asset attention)", "Sharpe": ablation_sharpes["Proposed-A+B"],
         "Delta_vs_A": ablation_sharpes["Proposed-A+B"] - base},
        {"Tinh chat": "A + B + C (Sharpe-aware loss)", "Sharpe": ablation_sharpes["Proposed-A+B+C"],
         "Delta_vs_A": ablation_sharpes["Proposed-A+B+C"] - base},
    ])
    ablation_table.to_csv(cfg.RESULTS / "ablation_table.csv", index=False)
    print("\nBang Ablation Studies:")
    print(ablation_table.to_string(index=False))

    # ---- Tong hop ket qua ----
    summary_df = pd.DataFrame(results_rows).set_index("strategy")
    ic_df = pd.DataFrame(ic_rows).set_index("strategy")
    summary_df = summary_df.join(ic_df, how="left")
    summary_df.to_csv(cfg.RESULTS / "metrics_summary.csv")

    print("\n" + "=" * 70)
    print("BANG TONG HOP HIEU SUAT (tap TEST, ngoai mau)")
    print("=" * 70)
    cols = ["category", "AnnReturn", "AnnVol", "Sharpe", "Sortino", "MaxDrawdown", "Calmar",
            "InformationRatio", "AvgTurnover", "IC", "HitRate"]
    print(summary_df[cols].round(4).to_string())

    best = summary_df["Sharpe"].idxmax()
    print(f"\n>> Chien luoc co Sharpe cao nhat (test, out-of-sample): {best} "
          f"(Sharpe={summary_df.loc[best, 'Sharpe']:.3f})")
    n_ge_18 = (summary_df["Sharpe"] >= 1.8).sum()
    print(f">> So chien luoc dat Sharpe >= 1.8: {n_ge_18}/{len(summary_df)}")

    # ---- Figures ----
    _plot_equity_curves(curves, cfg.FIGURES / "equity_curves.png")
    _plot_ablation_bar(ablation_table, cfg.FIGURES / "ablation_bar.png")
    _plot_frontier(returns, tickers, cfg.FIGURES / "efficient_frontier.png")
    _plot_sharpe_bar(summary_df, cfg.FIGURES / "sharpe_comparison.png")

    with open(cfg.RESULTS / "run_meta.json", "w", encoding="utf-8") as f:
        json.dump({
            "tickers": tickers,
            "n_train": int(masks["train"].sum()),
            "n_valid": int(masks["valid"].sum()),
            "n_test": int(masks["test"].sum()),
            "n_rebalances": len(rebalance_dates),
            "elapsed_sec": round(time.time() - t0, 1),
        }, f, indent=2, ensure_ascii=False)

    print(f"\nHoan tat trong {time.time()-t0:.1f}s. Ket qua: {cfg.RESULTS}")
    return summary_df, ablation_table


def _plot_equity_curves(curves: dict, path):
    fig, ax = plt.subplots(figsize=(10, 5))
    for name in ["EqualWeight", "Proposed-A+B+C", "LinearRegression", "Transformer"]:
        if name in curves:
            eq = curves[name]["equity_curve"]
            ax.plot(eq, label=name, linewidth=1.5)
    ax.set_title("Duong gia tri danh muc (Equity Curve) — tap TEST")
    ax.set_xlabel("Phien giao dich")
    ax.set_ylabel("Gia tri danh muc (chuan hoa = 1.0)")
    ax.legend()
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)


def _plot_ablation_bar(ablation_table: pd.DataFrame, path):
    fig, ax = plt.subplots(figsize=(7, 4.5))
    ax.bar(ablation_table["Tinh chat"], ablation_table["Sharpe"], color=["#8884d8", "#82ca9d", "#ffc658"])
    ax.axhline(1.8, color="red", linestyle="--", linewidth=1, label="Muc tieu Sharpe = 1.8")
    ax.set_ylabel("Sharpe Ratio (test)")
    ax.set_title("Ablation Studies — Mo hinh de xuat")
    ax.legend()
    plt.setp(ax.get_xticklabels(), rotation=15, ha="right")
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)


def _plot_sharpe_bar(summary_df: pd.DataFrame, path):
    df = summary_df.sort_values("Sharpe")
    colors = df["category"].map({
        "Rule-based": "#94a3b8", "Classical": "#60a5fa", "DL baseline": "#34d399", "Proposed": "#f59e0b",
    })
    fig, ax = plt.subplots(figsize=(9, 6))
    ax.barh(df.index, df["Sharpe"], color=colors)
    ax.axvline(1.8, color="red", linestyle="--", linewidth=1, label="Muc tieu Sharpe = 1.8")
    ax.set_xlabel("Sharpe Ratio (test, out-of-sample)")
    ax.set_title("So sanh Sharpe Ratio giua cac mo hinh")
    ax.legend()
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)


def _plot_frontier(returns: pd.DataFrame, tickers: list[str], path, n_portfolios: int = 3000):
    window = returns.tail(cfg.COV_LOOKBACK)
    mu = window.mean().values * 252
    cov = opt.shrinkage_covariance(window.values) * 252
    n = len(tickers)
    rng = np.random.default_rng(cfg.SEED)
    rets, vols = [], []
    for _ in range(n_portfolios):
        w = rng.dirichlet(np.ones(n))
        rets.append(w @ mu)
        vols.append(np.sqrt(w @ cov @ w))
    w_ms = opt.max_sharpe_weight(mu, cov, max_weight=cfg.MAX_WEIGHT)
    ms_ret, ms_vol = w_ms @ mu, np.sqrt(w_ms @ cov @ w_ms)

    fig, ax = plt.subplots(figsize=(8, 6))
    sc = ax.scatter(vols, rets, c=np.array(rets) / np.array(vols), cmap="viridis", s=6, alpha=0.5)
    ax.scatter([ms_vol], [ms_ret], color="red", marker="*", s=250, label="Max-Sharpe (danh muc de xuat)")
    fig.colorbar(sc, label="Sharpe")
    ax.set_xlabel("Bien dong (annualized)")
    ax.set_ylabel("Loi suat ky vong (annualized)")
    ax.set_title("Efficient Frontier (uoc luong tu 252 phien gan nhat)")
    ax.legend()
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)


if __name__ == "__main__":
    main()
