"""Ứng dụng minh hoạ Streamlit — AI Quản lý danh mục đầu tư (Crystal Ball Research).

Chạy:  streamlit run app_streamlit.py
"""
from __future__ import annotations

import numpy as np
import pandas as pd
import streamlit as st
import matplotlib.pyplot as plt

from src import config as cfg
from src import data_pipeline as dp
from src import features as feat
from src import splits as sp
from src import backtest as bt
from src import optimizer as opt
from src import metrics as mx
from src.baselines import rule_based, capm as capm_baseline, apt as apt_baseline, regression as reg_baseline

st.set_page_config(page_title="Crystal Ball — AI Quản lý danh mục đầu tư", layout="wide", page_icon="🔮")


@st.cache_data(show_spinner="Đang tải & xử lý dữ liệu giá lịch sử...")
def load_all():
    ds = dp.load_dataset()
    X, y, sample_dates, tickers = feat.build_samples(ds["prices"], ds["returns"], cfg.LOOKBACK, cfg.HORIZON)
    masks = sp.time_split(sample_dates)
    rebalance_dates = bt.get_rebalance_dates(sample_dates[masks["test"]], cfg.HORIZON)
    return ds, X, y, sample_dates, tickers, masks, rebalance_dates


@st.cache_data(show_spinner=False)
def load_results():
    summary_path = cfg.RESULTS / "metrics_summary.csv"
    ablation_path = cfg.RESULTS / "ablation_table.csv"
    summary = pd.read_csv(summary_path, index_col=0) if summary_path.exists() else None
    ablation = pd.read_csv(ablation_path) if ablation_path.exists() else None
    return summary, ablation


def strategy_weight_fn(strategy: str, ds, X, y, sample_dates, tickers, masks, rf, max_weight):
    returns = ds["returns"]
    if strategy == "Equal-Weight":
        return rule_based.equal_weight_strategy(len(tickers))
    if strategy == "Risk-Parity":
        return rule_based.risk_parity_strategy(returns)
    if strategy == "CAPM":
        pred = capm_baseline.predict_mu_df(returns, ds["bench_returns"], ds["rf"], tickers,
                                            pd.DatetimeIndex([sample_dates[-1]]))
        return bt.predicted_mu_strategy(pred, returns, max_weight=max_weight, rf=rf)
    if strategy == "APT (3-Factor)":
        factors = apt_baseline.build_factors(returns, ds["bench_returns"], ds["rf"])
        pred = apt_baseline.predict_mu_df(returns, factors, tickers, pd.DatetimeIndex([sample_dates[-1]]))
        return bt.predicted_mu_strategy(pred, returns, max_weight=max_weight, rf=rf)
    if strategy == "Linear Regression":
        model, panel = reg_baseline.fit(X, y, sample_dates, tickers, masks["train"])
        pred = reg_baseline.predict_mu_df(model, panel, tickers, pd.DatetimeIndex([sample_dates[-1]]))
        return bt.predicted_mu_strategy(pred, returns, max_weight=max_weight, rf=rf)
    if strategy == "Proposed PA-Transformer (A+B+C)":
        import torch
        from src.models.proposed import ProposedNet
        from src.models import common as mcommon
        ckpt = cfg.CHECKPOINTS / "proposed_ABC_sharpe_loss.pt"
        if not ckpt.exists():
            return None
        model = ProposedNet(X.shape[3], use_cross_asset=True)
        model.load_state_dict(torch.load(ckpt, map_location="cpu"))
        model.eval()
        pred = mcommon.predict_proposed(model, X, sample_dates, tickers, pd.DatetimeIndex([sample_dates[-1]]))
        return bt.predicted_mu_strategy(pred, returns, max_weight=max_weight, rf=rf)
    raise ValueError(strategy)


def main():
    st.title("🔮 Crystal Ball — AI Quản lý danh mục đầu tư")
    st.caption(
        "Ứng dụng minh hoạ pipeline nghiên cứu: dữ liệu Yahoo Finance (cùng nguồn với nền tảng "
        "crystal-ball.quachthanhlong.com) → đặc trưng kỹ thuật → dự báo lợi suất kỳ vọng "
        "(baseline cổ điển / học sâu / mô hình đề xuất PA-Transformer) → tối ưu Markowitz Max-Sharpe → backtest walk-forward."
    )

    ds, X, y, sample_dates, tickers, masks, rebalance_dates = load_all()
    summary_df, ablation_df = load_results()

    with st.sidebar:
        st.header("⚙️ Cấu hình")
        selected_tickers = st.multiselect("Vũ trụ tài sản", tickers, default=tickers)
        strategy = st.selectbox("Chiến lược / Mô hình", [
            "Equal-Weight", "Risk-Parity", "CAPM", "APT (3-Factor)", "Linear Regression",
            "Proposed PA-Transformer (A+B+C)",
        ], index=5)
        max_weight = st.slider("Tỷ trọng tối đa / tài sản", 0.10, 1.0, cfg.MAX_WEIGHT, 0.05)
        rf_override = st.number_input("Lãi suất phi rủi ro (%/năm, để trống dùng dữ liệu thật)",
                                       value=float(ds["rf"].iloc[-1] * 100), step=0.25)
        st.caption(f"Dữ liệu: {ds['prices'].index.min().date()} → {ds['prices'].index.max().date()} "
                   f"({len(ds['prices'])} phiên)")

    if len(selected_tickers) < 2:
        st.warning("Chọn ít nhất 2 tài sản.")
        return

    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "📊 Danh mục đề xuất", "📈 Efficient Frontier", "🧪 Backtest", "🔬 Ablation Studies", "ℹ️ Phương pháp",
    ])

    # ---- Tab 1: current recommended weights ----
    with tab1:
        st.subheader(f"Trọng số danh mục đề xuất — {strategy}")
        wfn = strategy_weight_fn(strategy, ds, X, y, sample_dates, tickers, masks, rf_override / 100, max_weight)
        if wfn is None:
            st.error("Chưa có checkpoint đã huấn luyện cho mô hình đề xuất. Chạy `python -m src.evaluate` trước.")
        else:
            w_full = wfn(sample_dates[-1])
            w = pd.Series(w_full, index=tickers).loc[selected_tickers]
            w = w / w.sum()
            c1, c2 = st.columns([2, 1])
            with c1:
                fig, ax = plt.subplots(figsize=(8, 4))
                ax.bar(w.index, w.values * 100, color="#6366f1")
                ax.set_ylabel("Tỷ trọng (%)")
                ax.set_title(f"Ngày tham chiếu: {sample_dates[-1].date()}")
                plt.setp(ax.get_xticklabels(), rotation=45, ha="right")
                st.pyplot(fig)
            with c2:
                st.dataframe(w.mul(100).round(2).rename("Tỷ trọng (%)"))
            st.download_button("⬇️ Tải trọng số (CSV)", w.to_csv().encode("utf-8"), "portfolio_weights.csv")

    # ---- Tab 2: efficient frontier ----
    with tab2:
        st.subheader("Efficient Frontier (ước lượng 252 phiên gần nhất)")
        window = ds["returns"][selected_tickers].tail(cfg.COV_LOOKBACK)
        mu = window.mean().values * 252
        cov = opt.shrinkage_covariance(window.values) * 252
        rng = np.random.default_rng(cfg.SEED)
        n = len(selected_tickers)
        pts = [(w := rng.dirichlet(np.ones(n)), w @ mu, np.sqrt(w @ cov @ w)) for _ in range(2000)]
        rets = [p[1] for p in pts]
        vols = [p[2] for p in pts]
        w_ms = opt.max_sharpe_weight(mu, cov, max_weight=max_weight)
        fig, ax = plt.subplots(figsize=(8, 5))
        sc = ax.scatter(vols, rets, c=np.array(rets) / np.array(vols), cmap="viridis", s=6, alpha=0.5)
        ax.scatter([np.sqrt(w_ms @ cov @ w_ms)], [w_ms @ mu], color="red", marker="*", s=250, label="Max-Sharpe")
        fig.colorbar(sc, label="Sharpe")
        ax.set_xlabel("Biến động (annualized)")
        ax.set_ylabel("Lợi suất kỳ vọng (annualized)")
        ax.legend()
        st.pyplot(fig)

    # ---- Tab 3: backtest ----
    with tab3:
        st.subheader(f"Backtest walk-forward ngoài mẫu (test) — {strategy}")
        if wfn is not None:
            res = bt.run_backtest(ds["prices"], ds["returns"], ds["rf"], ds["bench_returns"], rebalance_dates, wfn)
            rf_mean = float(np.mean(res["period_rf"]))
            s = mx.summarize(res["period_returns"], res["equity_curve"], res["bench_period_returns"],
                              res["weights_history"], rf_period=rf_mean)
            c1, c2, c3, c4 = st.columns(4)
            c1.metric("Sharpe", f"{s['Sharpe']:.2f}")
            c2.metric("Lợi suất/năm", f"{s['AnnReturn']*100:.1f}%")
            c3.metric("Max Drawdown", f"{s['MaxDrawdown']*100:.1f}%")
            c4.metric("Sortino", f"{s['Sortino']:.2f}")
            fig, ax = plt.subplots(figsize=(10, 4))
            ax.plot(res["equity_curve"], color="#6366f1")
            ax.set_title("Equity Curve (test period)")
            ax.grid(alpha=0.3)
            st.pyplot(fig)
        if summary_df is not None:
            st.markdown("**So sánh toàn bộ chiến lược (kết quả huấn luyện đầy đủ, xem `results/metrics_summary.csv`):**")
            st.dataframe(summary_df.round(4))
        else:
            st.info("Chưa có `results/metrics_summary.csv`. Chạy `python -m src.evaluate` để có bảng so sánh đầy đủ.")

    # ---- Tab 4: ablation ----
    with tab4:
        st.subheader("Ablation Studies — Mô hình đề xuất PA-Transformer")
        if ablation_df is not None:
            st.dataframe(ablation_df)
            fig, ax = plt.subplots(figsize=(7, 4))
            ax.bar(ablation_df["Tinh chat"], ablation_df["Sharpe"], color=["#8884d8", "#82ca9d", "#ffc658"])
            ax.axhline(1.8, color="red", linestyle="--", label="Mục tiêu Sharpe = 1.8")
            ax.set_ylabel("Sharpe Ratio (test)")
            plt.setp(ax.get_xticklabels(), rotation=15, ha="right")
            ax.legend()
            st.pyplot(fig)
        else:
            st.info("Chưa có `results/ablation_table.csv`. Chạy `python -m src.evaluate` để tạo bảng ablation.")

    # ---- Tab 5: methodology ----
    with tab5:
        st.markdown("""
### Quy trình
1. **Dữ liệu**: giá điều chỉnh hàng ngày (Yahoo Finance) cho 12 cổ phiếu vốn hoá lớn đa ngành + 2 tài sản
   đa dạng hoá (TLT trái phiếu, GLD vàng), benchmark SPY, lãi suất phi rủi ro ^IRX.
2. **Đặc trưng**: lợi suất trễ, động lượng, biến động, RSI, MACD, z-score giá — tất cả chỉ dùng dữ liệu
   quá khứ tại mỗi thời điểm (trailing) để tránh rò rỉ dữ liệu.
3. **Chia tập**: train/valid/test theo thời gian (không xáo trộn) với khoảng đệm (embargo) giữa các tập.
4. **Mô hình**: baseline luật (Equal-Weight, Risk-Parity, 60/40), baseline cổ điển (Regression, CAPM,
   APT 3 nhân tố), baseline học sâu (MLP, CNN, LSTM, GRU, Transformer), và mô hình đề xuất
   **PA-Transformer** (temporal attention + cross-asset attention + Sharpe-aware loss).
5. **Tối ưu hoá danh mục**: Markowitz Max-Sharpe (long-only, giới hạn tỷ trọng) trên lợi suất kỳ vọng dự
   báo (mu_hat) và hiệp phương sai co rút Ledoit-Wolf.
6. **Backtest**: walk-forward, tái cân bằng ~hàng tháng, có phí giao dịch giả định.

⚠️ **Lưu ý**: đây là pipeline nghiên cứu/học thuật minh hoạ, không phải khuyến nghị đầu tư. Hiệu suất quá
khứ (kể cả trong backtest) không đảm bảo hiệu suất tương lai.
        """)


if __name__ == "__main__":
    main()
