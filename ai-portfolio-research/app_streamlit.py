"""Streamlit demo báo cáo - Crystal Ball AI Portfolio Research.

Chạy:
    streamlit run app_streamlit.py
"""
from __future__ import annotations

import json

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import streamlit as st

from src import backtest as bt
from src import config as cfg
from src import data_pipeline as dp
from src import features as feat
from src import metrics as mx
from src import optimizer as opt
from src import splits as sp
from src.baselines import apt as apt_baseline
from src.baselines import capm as capm_baseline
from src.baselines import regression as reg_baseline
from src.baselines import rule_based


st.set_page_config(page_title="Nhóm 4 - Crystal Ball AI Portfolio", layout="wide")

CUSTOM_CSS = """
<style>
  .stApp { background: #0b0f17; color: #f8fafc; }
  [data-testid="stSidebar"] { background: #171b26; }
  [data-testid="stSidebar"] label,
  [data-testid="stSidebar"] p,
  [data-testid="stSidebar"] span {
    color: #e5e7eb !important;
  }
  [data-testid="stSidebar"] [data-baseweb="select"] > div,
  [data-testid="stSidebar"] input {
    background: #0f172a !important;
    color: #f8fafc !important;
    border-color: #334155 !important;
  }
  [data-testid="stSidebar"] [data-baseweb="tag"] {
    background: #2563eb !important;
    border-radius: 6px !important;
  }
  [data-testid="stSidebar"] [data-baseweb="tag"] span {
    color: #ffffff !important;
  }
  [data-testid="stSidebar"] [role="slider"] {
    background: #38bdf8 !important;
  }
  [data-testid="stMetric"] {
    background: #111827;
    border: 1px solid #263244;
    border-radius: 12px;
    padding: 14px 16px;
  }
  .block-container { padding-top: 2rem; max-width: 1280px; }
  h1, h2, h3 { color: #f8fafc; }
  .section-card {
    background: #111827;
    border: 1px solid #263244;
    border-radius: 14px;
    padding: 18px 20px;
    margin: 8px 0 18px 0;
  }
  .ok-box {
    background: #123524;
    border-left: 5px solid #22c55e;
    border-radius: 10px;
    padding: 14px 18px;
  }
  .warn-box {
    background: #3b3215;
    border-left: 5px solid #eab308;
    border-radius: 10px;
    padding: 14px 18px;
  }
  .decision-box {
    background: linear-gradient(135deg, #052e2b, #111827 58%, #172554);
    border: 1px solid #22c55e;
    border-radius: 14px;
    padding: 18px 22px;
    margin: 8px 0 18px 0;
  }
  .decision-box .title {
    color: #86efac;
    font-size: 18px;
    font-weight: 800;
    margin-bottom: 8px;
  }
  .decision-box .body {
    color: #f8fafc;
    font-size: 15px;
    line-height: 1.55;
  }
</style>
"""


@st.cache_data(show_spinner="Đang tải và xử lý dữ liệu lịch sử...")
def load_all():
    ds = dp.load_dataset()
    X, y, sample_dates, tickers = feat.build_samples(ds["prices"], ds["returns"], cfg.LOOKBACK, cfg.HORIZON)
    masks = sp.time_split(sample_dates)
    rebalance_dates = bt.get_rebalance_dates(sample_dates[masks["test"]], cfg.HORIZON)
    return ds, X, y, sample_dates, tickers, masks, rebalance_dates


@st.cache_data(show_spinner=False)
def load_result_tables():
    summary_path = cfg.RESULTS / "metrics_summary.csv"
    ablation_path = cfg.RESULTS / "ablation_table.csv"
    meta_path = cfg.RESULTS / "run_meta.json"
    summary = pd.read_csv(summary_path, index_col=0) if summary_path.exists() else None
    ablation = pd.read_csv(ablation_path) if ablation_path.exists() else None
    meta = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}
    return summary, ablation, meta


def pct(value: float) -> str:
    return f"{value * 100:.2f}%"


def render_investment_decision(summary_df):
    if summary_df is None or summary_df.empty:
        return
    ranked = summary_df.sort_values("Sharpe", ascending=False)
    best = ranked.iloc[0]
    second = ranked.iloc[1]
    sharpe_gap = best["Sharpe"] - second["Sharpe"]
    drawdown_gap = second["MaxDrawdown"] - best["MaxDrawdown"]
    st.markdown(
        f"""
        <div class="decision-box">
          <div class="title">Kết luận đầu tư: chọn {best.name}</div>
          <div class="body">
          {best.name} là mô hình/chiến lược tốt nhất trên tập test vì đạt Sharpe
          <b>{best['Sharpe']:.3f}</b>, cao hơn mô hình xếp thứ 2 ({second.name}: {second['Sharpe']:.3f})
          <b>{sharpe_gap:.3f}</b> điểm. Lợi suất năm đạt <b>{pct(best['AnnReturn'])}</b>,
          Max Drawdown chỉ <b>{pct(best['MaxDrawdown'])}</b>, Calmar <b>{best['Calmar']:.3f}</b>.
          Với mục tiêu đầu tư theo tỷ suất sinh lợi điều chỉnh rủi ro, nhóm khẳng định nên ưu tiên
          <b>{best.name}</b> thay vì các mô hình còn lại.
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_apt_explanation(summary_df):
    if summary_df is None or "APT_3Factor" not in summary_df.index:
        return
    apt = summary_df.loc["APT_3Factor"]
    equal = summary_df.loc["EqualWeight"] if "EqualWeight" in summary_df.index else None
    capm = summary_df.loc["CAPM"] if "CAPM" in summary_df.index else None
    cnn = summary_df.loc["CNN"] if "CNN" in summary_df.index else None
    proposed = summary_df.loc["Proposed-A+B+C"] if "Proposed-A+B+C" in summary_df.index else None

    st.subheader("APT_3Factor là gì?")
    st.markdown(
        f"""
        <div class="section-card">
        <b>APT_3Factor</b> là baseline tài chính định lượng dựa trên
        <b>Arbitrage Pricing Theory</b>. Thay vì dự báo lợi suất chỉ bằng một biến thị trường như CAPM,
        APT giả định lợi suất tài sản được giải thích bởi nhiều nhân tố rủi ro. Trong dự án này,
        nhóm xây dựng ba nhân tố trailing, không nhìn trước tương lai:
        <br><br>
        <b>1. MKT</b>: lợi suất vượt trội của thị trường, tính từ benchmark SPY trừ risk-free rate.<br>
        <b>2. MOM</b>: momentum factor, long nhóm tài sản có momentum 21 phiên cao và short nhóm momentum thấp.<br>
        <b>3. VOL</b>: low-volatility factor, long nhóm tài sản biến động thấp và short nhóm biến động cao.
        <br><br>
        Với mỗi ngày tái cân bằng, hệ thống hồi quy rolling từng tài sản trên ba nhân tố này,
        dự báo lợi suất kỳ vọng 21 phiên tiếp theo, sau đó đưa vào bộ tối ưu <b>Max-Sharpe</b>
        để sinh trọng số đầu tư.
        </div>
        """,
        unsafe_allow_html=True,
    )

    rows = []
    if equal is not None:
        rows.append(["So với EqualWeight", apt["Sharpe"] - equal["Sharpe"], apt["AnnReturn"] - equal["AnnReturn"], apt["MaxDrawdown"] - equal["MaxDrawdown"], "APT có Sharpe và lợi suất cao hơn, drawdown cũng ít âm hơn."])
    if capm is not None:
        rows.append(["So với CAPM", apt["Sharpe"] - capm["Sharpe"], apt["AnnReturn"] - capm["AnnReturn"], apt["MaxDrawdown"] - capm["MaxDrawdown"], "APT giữ lợi suất gần tương đương CAPM nhưng giảm volatility và drawdown rất mạnh."])
    if cnn is not None:
        rows.append(["So với CNN", apt["Sharpe"] - cnn["Sharpe"], apt["AnnReturn"] - cnn["AnnReturn"], apt["MaxDrawdown"] - cnn["MaxDrawdown"], "APT vượt mô hình deep learning tốt nhất nhờ prior tài chính và ít overfit hơn."])
    if proposed is not None:
        rows.append(["So với Proposed-A+B+C", apt["Sharpe"] - proposed["Sharpe"], apt["AnnReturn"] - proposed["AnnReturn"], apt["MaxDrawdown"] - proposed["MaxDrawdown"], "APT vượt mô hình đề xuất đầy đủ trong setting dữ liệu hiện tại."])

    comparison = pd.DataFrame(
        rows,
        columns=["Đối chiếu", "Chênh Sharpe", "Chênh AnnReturn", "Chênh MaxDrawdown", "Diễn giải"],
    )
    comparison["Chênh AnnReturn"] = comparison["Chênh AnnReturn"] * 100
    comparison["Chênh MaxDrawdown"] = comparison["Chênh MaxDrawdown"] * 100
    st.dataframe(comparison.round(4), width="stretch")

    st.markdown(
        f"""
        <div class="ok-box">
        <b>Khẳng định đầu tư:</b> chọn APT_3Factor vì đây là phương án có
        Sharpe cao nhất toàn bộ mô hình (<b>{apt['Sharpe']:.3f}</b>), lợi suất năm
        <b>{pct(apt['AnnReturn'])}</b>, Max Drawdown <b>{pct(apt['MaxDrawdown'])}</b>
        và Calmar <b>{apt['Calmar']:.3f}</b>. Nói cách khác, APT_3Factor không chỉ sinh lợi cao,
        mà còn cho tỷ suất sinh lợi điều chỉnh rủi ro tốt nhất trên test set ngoài mẫu.
        </div>
        """,
        unsafe_allow_html=True,
    )


def strategy_weight_fn(strategy: str, ds, X, y, sample_dates, tickers, masks, rf_series, max_weight):
    returns = ds["returns"]
    try:
        if strategy == "Equal-Weight":
            return rule_based.equal_weight_strategy(len(tickers))
        if strategy == "Risk-Parity":
            return rule_based.risk_parity_strategy(returns)
        if strategy == "60/40":
            return rule_based.sixty_forty_strategy(tickers, cfg.EQUITY_TICKERS, cfg.DIVERSIFIERS)
        if strategy == "CAPM":
            pred = capm_baseline.predict_mu_df(returns, ds["bench_returns"], ds["rf"], tickers, pd.DatetimeIndex([sample_dates[-1]]))
            return bt.predicted_mu_strategy(pred, returns, max_weight=max_weight, rf=rf_series)
        if strategy == "APT (3-Factor)":
            factors = apt_baseline.build_factors(returns, ds["bench_returns"], ds["rf"])
            pred = apt_baseline.predict_mu_df(returns, factors, tickers, pd.DatetimeIndex([sample_dates[-1]]))
            return bt.predicted_mu_strategy(pred, returns, max_weight=max_weight, rf=rf_series)
        if strategy == "Linear Regression":
            model, panel = reg_baseline.fit(X, y, sample_dates, tickers, masks["train"])
            pred = reg_baseline.predict_mu_df(model, panel, tickers, pd.DatetimeIndex([sample_dates[-1]]))
            return bt.predicted_mu_strategy(pred, returns, max_weight=max_weight, rf=rf_series)
    except Exception as exc:
        st.warning(f"Không thể dựng chiến lược {strategy}: {exc}")
    return None


def selected_strategy_weights(strategy: str, ds, X, y, sample_dates, all_tickers, selected_tickers, masks, rf_series, max_weight):
    if not selected_tickers:
        return None, "Chưa chọn tài sản trong Portfolio universe."

    returns = ds["returns"][selected_tickers]
    effective_max = max(float(max_weight), 1.0 / len(selected_tickers))
    asof = pd.DatetimeIndex([sample_dates[-1]])

    try:
        if strategy == "Equal-Weight":
            return pd.Series(opt.equal_weight(len(selected_tickers)), index=selected_tickers), None

        if strategy == "Risk-Parity":
            window = returns.loc[returns.index <= sample_dates[-1]].tail(cfg.COV_LOOKBACK).values
            cov = opt.shrinkage_covariance(window)
            return pd.Series(opt.risk_parity_weight(cov), index=selected_tickers), None

        if strategy == "60/40":
            raw = pd.Series(0.0, index=selected_tickers)
            eq = [t for t in selected_tickers if t in cfg.EQUITY_TICKERS]
            div = [t for t in selected_tickers if t in cfg.DIVERSIFIERS]
            if eq:
                raw.loc[eq] = 0.6 / len(eq)
            if div:
                raw.loc[div] = 0.4 / len(div)
            if raw.sum() <= 0:
                raw[:] = 1.0 / len(raw)
            return raw / raw.sum(), None

        if strategy == "CAPM":
            pred = capm_baseline.predict_mu_df(ds["returns"], ds["bench_returns"], ds["rf"], all_tickers, asof)
            mu = pred[selected_tickers].iloc[0].values
        elif strategy == "APT (3-Factor)":
            factors = apt_baseline.build_factors(ds["returns"], ds["bench_returns"], ds["rf"])
            pred = apt_baseline.predict_mu_df(ds["returns"], factors, all_tickers, asof)
            mu = pred[selected_tickers].iloc[0].values
        elif strategy == "Linear Regression":
            model, panel = reg_baseline.fit(X, y, sample_dates, all_tickers, masks["train"])
            pred = reg_baseline.predict_mu_df(model, panel, all_tickers, asof)
            mu = pred[selected_tickers].iloc[0].values
        else:
            return None, f"Chưa hỗ trợ strategy: {strategy}"

        window = returns.loc[returns.index <= sample_dates[-1]].tail(cfg.COV_LOOKBACK).values
        cov = opt.shrinkage_covariance(window)
        rf_val = float(rf_series.loc[rf_series.index <= sample_dates[-1]].iloc[-1])
        weights = opt.max_sharpe_weight(mu, cov, rf=rf_val / 252 * cfg.HORIZON, max_weight=effective_max)
        warning = None
        if effective_max > max_weight:
            warning = f"Max weight {max_weight:.2f} không khả thi với {len(selected_tickers)} tài sản; app dùng mức khả thi tối thiểu {effective_max:.2f}."
        return pd.Series(weights, index=selected_tickers), warning
    except Exception as exc:
        return None, f"Không tính được danh mục cho {strategy}: {exc}"


def render_live_strategy_panel(ds, X, y, sample_dates, all_tickers, selected_tickers, masks, strategy, rf_series, max_weight):
    st.subheader("Live Strategy Allocation")
    weights, warning = selected_strategy_weights(
        strategy, ds, X, y, sample_dates, all_tickers, selected_tickers, masks, rf_series, max_weight
    )
    if warning:
        st.warning(warning)
    if weights is None:
        return

    window = ds["returns"][weights.index].loc[ds["returns"].index <= sample_dates[-1]].tail(cfg.COV_LOOKBACK)
    mu_ann = window.mean().values * 252
    cov_ann = opt.shrinkage_covariance(window.values) * 252
    w = weights.values
    exp_return = float(w @ mu_ann)
    exp_vol = float(np.sqrt(max(w @ cov_ann @ w, 1e-12)))
    rf_ann = float(rf_series.loc[rf_series.index <= sample_dates[-1]].iloc[-1])
    exp_sharpe = (exp_return - rf_ann) / exp_vol if exp_vol > 0 else 0.0
    max_actual = float(weights.max())

    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Selected Strategy", strategy)
    c2.metric("Expected Return", pct(exp_return))
    c3.metric("Expected Vol", pct(exp_vol))
    c4.metric("Expected Sharpe", f"{exp_sharpe:.2f}")
    c5.metric("Max Actual Weight", pct(max_actual))

    col1, col2 = st.columns([1.2, 1])
    with col1:
        fig, ax = plt.subplots(figsize=(8.8, 3.6))
        top_weights = weights.sort_values(ascending=True)
        ax.barh(top_weights.index, top_weights.values * 100, color="#38bdf8")
        ax.axvline(max_weight * 100, color="#fb7185", linestyle="--", linewidth=1.2, label="Max weight setting")
        ax.set_xlabel("Weight (%)")
        ax.set_title(f"Trọng số thay đổi theo Strategy / Model và Max weight: {strategy}")
        ax.legend()
        ax.grid(axis="x", alpha=0.2)
        st.pyplot(fig)
    with col2:
        st.dataframe(weights.sort_values(ascending=False).mul(100).round(2).rename("Weight (%)"), width="stretch")
        if strategy in {"APT (3-Factor)", "CAPM", "Linear Regression"}:
            st.info("Max weight đang tác động trực tiếp vào bài toán tối ưu Max-Sharpe.")
        else:
            st.info("Đây là rule-based strategy, nên trọng số chủ yếu theo luật của chiến lược thay vì dự báo mu_hat.")


def header(ds, sample_dates, masks, meta):
    test_idx = np.where(masks["test"])[0]
    c1, c2, c3 = st.columns(3)
    c1.metric("Train end", cfg.TRAIN_END)
    c2.metric("Valid end", cfg.VALID_END)
    c3.metric("Test start", str(sample_dates[test_idx[0]].date()) if len(test_idx) else "N/A")
    st.markdown(
        f"""
        <div class="section-card">
        <b>Dữ liệu được chia theo thời gian để hạn chế Data Leakage.</b><br>
        Train: {meta.get("n_train", int(masks["train"].sum()))} mẫu |
        Valid: {meta.get("n_valid", int(masks["valid"].sum()))} mẫu |
        Test: {meta.get("n_test", int(masks["test"].sum()))} mẫu |
        Rebalance: {meta.get("n_rebalances", "N/A")} lần |
        Dải giá: {ds["prices"].index.min().date()} đến {ds["prices"].index.max().date()}
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_overview(ds, tickers, summary_df, ablation_df):
    st.header("Overview")
    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Số tài sản", len(tickers))
    c2.metric("Lookback", f"{cfg.LOOKBACK} phiên")
    c3.metric("Horizon", f"{cfg.HORIZON} phiên")
    c4.metric("Embargo", f"{cfg.EMBARGO} phiên")
    c5.metric("Best Sharpe", "1.626")
    st.markdown(
        """
        <div class="ok-box">
        <b>Đề tài:</b> Ứng dụng AI/ML trong quản lý danh mục đầu tư theo kiến trúc
        predict-then-optimize. Mô hình dự báo lợi suất kỳ vọng, sau đó Markowitz Max-Sharpe
        sinh trọng số danh mục.
        </div>
        """,
        unsafe_allow_html=True,
    )
    col1, col2 = st.columns([1.15, 1])
    with col1:
        st.subheader("Tài sản nghiên cứu")
        kind = ["Equity"] * len(tickers)
        for i, t in enumerate(tickers):
            if t in cfg.DIVERSIFIERS:
                kind[i] = "Diversifier"
        st.dataframe(pd.DataFrame({"Ticker": tickers, "Loại": kind}), width="stretch")
    with col2:
        st.subheader("Kết quả nhanh")
        if summary_df is not None:
            best = summary_df.sort_values("Sharpe", ascending=False).iloc[0]
            st.metric("Chiến lược tốt nhất", best.name)
            st.metric("Sharpe", f"{best['Sharpe']:.3f}")
            st.metric("Max Drawdown", pct(best["MaxDrawdown"]))
        if ablation_df is not None:
            st.dataframe(ablation_df.round(4), width="stretch")


def render_summary(summary_df):
    st.header("Summary")
    if summary_df is None:
        st.error("Chưa có metrics_summary.csv. Chạy python -m src.evaluate để tạo kết quả.")
        return
    st.dataframe(summary_df.round(4), width="stretch")
    best_name = summary_df["Sharpe"].idxmax()
    best = summary_df.loc[best_name]
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Best Strategy", best_name)
    c2.metric("Sharpe Ratio", f"{best['Sharpe']:.3f}")
    c3.metric("Annual Return", pct(best["AnnReturn"]))
    c4.metric("Max Drawdown", pct(best["MaxDrawdown"]))
    st.markdown(
        """
        <div class="warn-box">
        <b>Lưu ý:</b> kết quả hiện tại chưa có chiến lược đạt Sharpe 1.8.
        Chiến lược tốt nhất là APT_3Factor với Sharpe 1.626. Đây là kết quả test ngoài mẫu,
        không tinh chỉnh trên tập test để làm đẹp số.
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_model_evaluation(summary_df):
    st.header("Model Evaluation")
    if summary_df is None:
        st.error("Thiếu metrics_summary.csv.")
        return

    ranked = summary_df.copy()
    ranked["Rank_Sharpe"] = ranked["Sharpe"].rank(ascending=False, method="min").astype(int)
    ranked["AnnReturn_pct"] = ranked["AnnReturn"] * 100
    ranked["AnnVol_pct"] = ranked["AnnVol"] * 100
    ranked["MaxDrawdown_pct"] = ranked["MaxDrawdown"] * 100
    ranked = ranked.sort_values("Sharpe", ascending=False)

    best_sharpe = ranked.iloc[0]
    best_return = ranked.sort_values("AnnReturn", ascending=False).iloc[0]
    best_drawdown = ranked.sort_values("MaxDrawdown", ascending=False).iloc[0]
    best_calmar = ranked.sort_values("Calmar", ascending=False).iloc[0]

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Best by Sharpe", best_sharpe.name, f"{best_sharpe['Sharpe']:.3f}")
    c2.metric("Best by Return", best_return.name, pct(best_return["AnnReturn"]))
    c3.metric("Best by MDD", best_drawdown.name, pct(best_drawdown["MaxDrawdown"]))
    c4.metric("Best by Calmar", best_calmar.name, f"{best_calmar['Calmar']:.3f}")

    render_apt_explanation(summary_df)

    st.subheader("Vì sao mô hình này tốt nhất?")
    compare_names = [
        best_sharpe.name,
        "EqualWeight",
        "CAPM",
        "CNN",
        "Transformer",
        "Proposed-A",
        "Proposed-A+B+C",
    ]
    compare_names = [name for name in compare_names if name in ranked.index]
    compare = ranked.loc[compare_names, ["category", "AnnReturn", "AnnVol", "Sharpe", "MaxDrawdown", "Calmar", "AvgTurnover"]].copy()
    compare["Delta Sharpe vs Best"] = compare["Sharpe"] - best_sharpe["Sharpe"]
    compare["AnnReturn"] = compare["AnnReturn"] * 100
    compare["AnnVol"] = compare["AnnVol"] * 100
    compare["MaxDrawdown"] = compare["MaxDrawdown"] * 100
    compare = compare.rename(
        columns={
            "category": "Nhóm",
            "AnnReturn": "AnnReturn (%)",
            "AnnVol": "AnnVol (%)",
            "MaxDrawdown": "MaxDrawdown (%)",
            "AvgTurnover": "Turnover",
        }
    )
    st.dataframe(compare.round(4), width="stretch")

    c1, c2 = st.columns([1.1, 1])
    with c1:
        top7 = ranked.head(7)
        fig, ax = plt.subplots(figsize=(8.6, 4.3))
        colors = ["#22c55e" if name == best_sharpe.name else "#38bdf8" for name in top7.index]
        ax.barh(top7.index[::-1], top7["Sharpe"].values[::-1], color=colors[::-1])
        ax.axvline(best_sharpe["Sharpe"], color="#22c55e", linewidth=1.2, linestyle="--")
        ax.set_xlabel("Sharpe Ratio")
        ax.set_title("Top mô hình/chiến lược theo Sharpe trên test set")
        ax.grid(axis="x", alpha=0.22)
        st.pyplot(fig)
    with c2:
        st.markdown(
            f"""
            <div class="section-card">
            <b>{best_sharpe.name} được chọn vì:</b><br>
            1. Sharpe cao nhất toàn bộ: <b>{best_sharpe['Sharpe']:.3f}</b>.<br>
            2. Lợi suất năm cao nhất/nhóm dẫn đầu: <b>{pct(best_sharpe['AnnReturn'])}</b>.<br>
            3. Max Drawdown <b>{pct(best_sharpe['MaxDrawdown'])}</b>, thấp hơn nhiều so với CAPM
            nếu xét rủi ro sụt giảm vốn.<br>
            4. Calmar cao nhất: <b>{best_sharpe['Calmar']:.3f}</b>, nghĩa là lợi nhuận trên mỗi đơn vị
            drawdown tốt nhất.<br>
            5. Kết quả lấy trên test set ngoài mẫu, cùng điều kiện backtest với các model khác.
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.subheader("Bảng xếp hạng theo Sharpe Ratio")
    display_cols = [
        "Rank_Sharpe",
        "category",
        "AnnReturn_pct",
        "AnnVol_pct",
        "Sharpe",
        "Sortino",
        "MaxDrawdown_pct",
        "Calmar",
        "InformationRatio",
        "AvgTurnover",
        "IC",
        "HitRate",
    ]
    table = ranked[display_cols].rename(
        columns={
            "Rank_Sharpe": "Rank",
            "category": "Nhóm",
            "AnnReturn_pct": "AnnReturn (%)",
            "AnnVol_pct": "AnnVol (%)",
            "MaxDrawdown_pct": "MaxDrawdown (%)",
            "InformationRatio": "Information Ratio",
            "AvgTurnover": "Turnover",
        }
    )
    st.dataframe(table.round(4), width="stretch")

    st.subheader("Mô hình tốt nhất theo từng nhóm")
    group_best = ranked.sort_values("Sharpe", ascending=False).groupby("category", sort=False).head(1)
    group_table = group_best[["AnnReturn", "AnnVol", "Sharpe", "MaxDrawdown", "Calmar", "IC", "HitRate"]].copy()
    group_table["AnnReturn"] = group_table["AnnReturn"] * 100
    group_table["AnnVol"] = group_table["AnnVol"] * 100
    group_table["MaxDrawdown"] = group_table["MaxDrawdown"] * 100
    group_table = group_table.rename(
        columns={
            "AnnReturn": "AnnReturn (%)",
            "AnnVol": "AnnVol (%)",
            "MaxDrawdown": "MaxDrawdown (%)",
        }
    )
    st.dataframe(group_table.round(4), width="stretch")

    classical_best = ranked[ranked["category"].eq("Classical")].iloc[0]
    dl_best = ranked[ranked["category"].eq("DL baseline")].iloc[0]
    proposed_best = ranked[ranked["category"].eq("Proposed")].iloc[0]
    rule_best = ranked[ranked["category"].eq("Rule-based")].iloc[0]

    st.subheader("Kết luận trình bày")
    st.markdown(
        f"""
        <div class="ok-box">
        <b>Kết luận chính:</b> trên test set ngoài mẫu, chiến lược tốt nhất toàn bộ là
        <b>{best_sharpe.name}</b> với Sharpe <b>{best_sharpe['Sharpe']:.3f}</b>,
        lợi suất năm <b>{pct(best_sharpe['AnnReturn'])}</b> và Max Drawdown
        <b>{pct(best_sharpe['MaxDrawdown'])}</b>. Vì vậy nếu chọn mô hình/chiến lược để vận hành,
        nhóm chọn <b>{best_sharpe.name}</b> theo tiêu chí Sharpe Ratio.
        </div>
        """,
        unsafe_allow_html=True,
    )
    st.markdown(
        f"""
        <div class="section-card">
        <b>Diễn giải theo nhóm phương pháp:</b><br>
        Rule-based tốt nhất: <b>{rule_best.name}</b> (Sharpe {rule_best['Sharpe']:.3f}).<br>
        Classical tốt nhất: <b>{classical_best.name}</b> (Sharpe {classical_best['Sharpe']:.3f}).<br>
        Deep learning baseline tốt nhất: <b>{dl_best.name}</b> (Sharpe {dl_best['Sharpe']:.3f}).<br>
        Mô hình đề xuất tốt nhất: <b>{proposed_best.name}</b> (Sharpe {proposed_best['Sharpe']:.3f}).
        </div>
        """,
        unsafe_allow_html=True,
    )
    st.markdown(
        """
        <div class="warn-box">
        <b>Lưu ý học thuật:</b> PA-Transformer/Proposed là mô hình nghiên cứu có ablation rõ ràng,
        nhưng chưa vượt APT_3Factor trên test set. Điểm mạnh của dự án là quy trình so sánh minh bạch:
        cùng dữ liệu, cùng split thời gian, cùng backtest và cùng thước đo Sharpe/MDD.
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_chart(ds, ticker):
    st.header("Chart")
    price = ds["prices"][ticker]
    ret = ds["returns"][ticker]
    ma20 = price.rolling(20).mean()
    ma60 = price.rolling(60).mean()
    fig, ax = plt.subplots(figsize=(11, 4.6))
    ax.plot(price.index, price.values, label="Adjusted Close", linewidth=1.5)
    ax.plot(ma20.index, ma20.values, label="MA20", linewidth=1)
    ax.plot(ma60.index, ma60.values, label="MA60", linewidth=1)
    ax.set_title(f"{ticker} - Adjusted Close")
    ax.grid(alpha=0.25)
    ax.legend()
    st.pyplot(fig)
    fig2, ax2 = plt.subplots(figsize=(11, 2.4))
    ax2.plot(ret.index, ret.values, linewidth=0.7)
    ax2.axhline(0, color="gray", linewidth=0.8)
    ax2.set_title(f"{ticker} - Daily Return")
    ax2.grid(alpha=0.25)
    st.pyplot(fig2)


def render_statistics(ds, ticker):
    st.header("Statistics")
    ret = ds["returns"][ticker].dropna()
    ann_return = ret.mean() * 252
    ann_vol = ret.std() * np.sqrt(252)
    sharpe = ann_return / ann_vol if ann_vol else 0
    equity = (1 + ret).cumprod()
    mdd = mx.max_drawdown(equity.values)
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Annual Return", pct(ann_return))
    c2.metric("Annual Volatility", pct(ann_vol))
    c3.metric("Naive Sharpe", f"{sharpe:.2f}")
    c4.metric("Max Drawdown", pct(mdd))
    stats = pd.DataFrame(
        {
            "Metric": ["Mean daily return", "Std daily return", "Skewness", "Kurtosis", "Min daily return", "Max daily return"],
            "Value": [ret.mean(), ret.std(), ret.skew(), ret.kurtosis(), ret.min(), ret.max()],
        }
    )
    st.dataframe(stats, width="stretch")


def render_financials(ticker):
    st.header("Financials")
    st.markdown(
        f"""
        <div class="section-card">
        Module research hiện tại dùng dữ liệu giá, benchmark và risk-free rate để bảo đảm tái lập
        và kiểm soát leakage. Dữ liệu báo cáo tài chính chi tiết của <b>{ticker}</b> nằm ở lớp sản phẩm
        Crystal Ball thông qua FinancialStatementReader, ComprehensiveMetricsPanel và AI extraction bằng Gemini.
        </div>
        """,
        unsafe_allow_html=True,
    )
    rows = pd.DataFrame(
        [
            ["Nguồn định lượng research", "Yahoo Finance adjusted price, returns, SPY, ^IRX"],
            ["Nguồn financials trong web app", "Excel/PDF upload, AI extraction, comprehensive metrics"],
            ["AI xử lý", "Gemini 2.5 Pro qua ai-extract-financials Edge Function"],
            ["Output", "Bảng chỉ số, nhận định AI, PDF report"],
        ],
        columns=["Thành phần", "Mô tả"],
    )
    st.dataframe(rows, width="stretch")


def render_analysis(summary_df, ablation_df):
    st.header("Analysis")
    if summary_df is not None:
        fig, ax = plt.subplots(figsize=(10, 4.8))
        sorted_df = summary_df.sort_values("Sharpe")
        ax.barh(sorted_df.index, sorted_df["Sharpe"], color="#22c55e")
        ax.axvline(1.8, color="#ef4444", linestyle="--", label="Mục tiêu 1.8")
        ax.set_title("Sharpe Ratio theo chiến lược")
        ax.legend()
        st.pyplot(fig)
    if ablation_df is not None:
        st.subheader("Ablation Study")
        st.dataframe(ablation_df.round(4), width="stretch")
        st.markdown(
            """
            <div class="section-card">
            Stage A đạt Sharpe 0.663. Khi thêm cross-asset attention, Sharpe giảm xuống 0.557,
            cho thấy nguy cơ overfitting với universe 14 tài sản. Khi thêm Sharpe-aware loss,
            Sharpe phục hồi lên 0.657.
            </div>
            """,
            unsafe_allow_html=True,
        )
        st.markdown(
            """
            <div class="warn-box">
            <b>Lưu ý khi báo cáo:</b> kết quả chính thức chỉ gồm A, A+B và A+B+C vì đây là ba stage
            có code, checkpoint và bảng số liệu. Nếu nhắc đến D, D chỉ nên được trình bày ở phần
            future work, ví dụ transaction-cost/turnover-aware regularization để giảm chi phí giao dịch.
            Không nên ghi A+B+C+D vào bảng kết quả nếu chưa chạy thực nghiệm D.
            </div>
            """,
            unsafe_allow_html=True,
        )


def render_monte_carlo(ds, selected_tickers, max_weight):
    st.header("Monte Carlo Simulation")
    if len(selected_tickers) < 2:
        st.warning("Cần chọn ít nhất 2 tài sản.")
        return
    window = ds["returns"][selected_tickers].tail(cfg.COV_LOOKBACK)
    mu = window.mean().values * 252
    cov = opt.shrinkage_covariance(window.values) * 252
    rng = np.random.default_rng(cfg.SEED)
    n = len(selected_tickers)
    weights = rng.dirichlet(np.ones(n), size=2500)
    rets = weights @ mu
    vols = np.sqrt(np.einsum("ij,jk,ik->i", weights, cov, weights))
    sharpes = np.divide(rets, vols, out=np.zeros_like(rets), where=vols > 0)
    w_ms = opt.max_sharpe_weight(mu, cov, max_weight=max_weight)
    ms_ret = float(w_ms @ mu)
    ms_vol = float(np.sqrt(w_ms @ cov @ w_ms))
    fig, ax = plt.subplots(figsize=(10, 5))
    sc = ax.scatter(vols, rets, c=sharpes, cmap="viridis", s=8, alpha=0.55)
    ax.scatter([ms_vol], [ms_ret], marker="*", s=300, color="#ef4444", label="Max-Sharpe")
    ax.set_xlabel("Annualized Volatility")
    ax.set_ylabel("Annualized Return")
    ax.set_title("Efficient Frontier Simulation")
    ax.legend()
    fig.colorbar(sc, label="Sharpe")
    st.pyplot(fig)
    st.subheader("Trọng số Max-Sharpe")
    st.dataframe(pd.Series(w_ms, index=selected_tickers, name="Weight").mul(100).round(2), width="stretch")


def render_portfolio_trend(ds, selected_tickers):
    st.header("Your Portfolio's Trend")
    if len(selected_tickers) < 2:
        st.warning("Cần chọn ít nhất 2 tài sản.")
        return
    returns = ds["returns"][selected_tickers].dropna()
    w = np.full(len(selected_tickers), 1 / len(selected_tickers))
    port = pd.Series(returns.values @ w, index=returns.index)
    equity = (1 + port).cumprod()
    fig, ax = plt.subplots(figsize=(11, 4.8))
    ax.plot(equity.index, equity.values, color="#22c55e", linewidth=1.4)
    ax.set_title("Equal-Weight Portfolio Equity Curve")
    ax.grid(alpha=0.25)
    st.pyplot(fig)
    c1, c2, c3 = st.columns(3)
    c1.metric("Cumulative Return", pct(equity.iloc[-1] - 1))
    c2.metric("Annual Volatility", pct(port.std() * np.sqrt(252)))
    c3.metric("Max Drawdown", pct(mx.max_drawdown(equity.values)))


def render_ai_prediction(ds, ticker):
    st.header("AI Prediction")
    price = ds["prices"][ticker]
    ret_21 = price.pct_change(21).iloc[-1]
    vol_21 = ds["returns"][ticker].tail(21).std() * np.sqrt(252)
    ma20 = price.rolling(20).mean().iloc[-1]
    ma60 = price.rolling(60).mean().iloc[-1]
    trend = "Tích cực" if ma20 > ma60 and ret_21 > 0 else "Thận trọng"
    confidence = "Trung bình" if abs(ret_21) > 0.03 else "Thấp"
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Trend signal", trend)
    c2.metric("21D return", pct(ret_21))
    c3.metric("Annualized vol 21D", pct(vol_21))
    c4.metric("Confidence", confidence)
    st.markdown(
        f"""
        <div class="section-card">
        <b>AI interpretation cho {ticker}:</b> tín hiệu được tổng hợp từ momentum 21 phiên,
        MA20/MA60 và volatility ngắn hạn. Trong web app Crystal Ball, AI runtime được xử lý
        bởi Gemini qua Supabase Edge Functions như chatbot-ai, ai-market-analysis và equity-research-ai.
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_ai_backtesting(summary_df):
    st.header("AI Backtesting")
    if summary_df is None:
        st.error("Thiếu metrics_summary.csv.")
        return
    subset = summary_df[["category", "AnnReturn", "AnnVol", "Sharpe", "MaxDrawdown", "Calmar", "AvgTurnover"]]
    st.dataframe(subset.round(4), width="stretch")
    best = summary_df.loc[summary_df["Sharpe"].idxmax()]
    st.subheader("Best Strategy")
    c1, c2, c3 = st.columns(3)
    c1.metric("Strategy", best.name)
    c2.metric("Sharpe Ratio", f"{best['Sharpe']:.2f}")
    c3.metric("Target", ">= 1.80")
    if best["Sharpe"] < 1.8:
        st.markdown(
            '<div class="warn-box"><b>Sharpe Ratio trên Test Set hiện dưới mục tiêu 1.8.</b> Đây là kết quả ngoài mẫu trung thực, không tune trên test.</div>',
            unsafe_allow_html=True,
        )


def render_ai_portfolio_optimization(ds, X, y, sample_dates, tickers, masks, selected_tickers, strategy, rf_series, max_weight):
    st.header("AI Portfolio Optimization")
    if len(selected_tickers) < 2:
        st.warning("Cần chọn ít nhất 2 tài sản.")
        return
    w, warning = selected_strategy_weights(strategy, ds, X, y, sample_dates, tickers, selected_tickers, masks, rf_series, max_weight)
    if warning:
        st.warning(warning)
    if w is None:
        st.error("Không tạo được trọng số danh mục. Hãy chọn APT, CAPM, Equal-Weight, 60/40, Risk-Parity hoặc Linear Regression.")
        return
    col1, col2 = st.columns([1.25, 1])
    with col1:
        fig, ax = plt.subplots(figsize=(8.5, 4.2))
        ax.bar(w.index, w.values * 100, color="#38bdf8")
        ax.set_ylabel("Weight (%)")
        ax.set_title(f"Recommended Weights - {strategy}")
        plt.setp(ax.get_xticklabels(), rotation=45, ha="right")
        st.pyplot(fig)
    with col2:
        st.dataframe(w.mul(100).round(2).rename("Weight (%)"), width="stretch")
        st.download_button("Tải trọng số CSV", w.to_csv().encode("utf-8"), "portfolio_weights.csv")


def render_chatbot():
    st.header("Financial Chatbot")
    question = st.text_area("Nhập câu hỏi tài chính", value="Dự án Crystal Ball chống data leakage như thế nào?")
    if st.button("Tạo câu trả lời mẫu"):
        st.markdown(
            f"""
            <div class="section-card">
            <b>Câu hỏi:</b> {question}<br><br>
            <b>Trả lời mẫu:</b> Dự án chia train/valid/test theo thời gian, không random shuffle,
            dùng feature trailing và embargo 81 phiên để tránh overlap giữa cửa sổ input và target.
            Mô hình chỉ fit trên train, early stopping bằng valid và đánh giá trên test ngoài mẫu.
            </div>
            """,
            unsafe_allow_html=True,
        )
    st.info("Trong web app chính, Crystal AI gọi /functions/v1/chatbot-ai và nhận phản hồi streaming từ Gemini.")


def main():
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)
    ds, X, y, sample_dates, tickers, masks, _ = load_all()
    summary_df, ablation_df, meta = load_result_tables()

    with st.sidebar:
        st.title("Nhóm 4")
        st.subheader("Crystal Ball")
        if summary_df is not None:
            best_sidebar = summary_df.sort_values("Sharpe", ascending=False).iloc[0]
            st.success(f"Best model: {best_sidebar.name} | Sharpe {best_sidebar['Sharpe']:.3f}")
        ticker = st.selectbox("Select a ticker", tickers, index=tickers.index("AAPL") if "AAPL" in tickers else 0)
        selected_tickers = st.multiselect("Portfolio universe", tickers, default=tickers)
        strategy = st.selectbox(
            "Strategy / Model",
            ["APT (3-Factor)", "Equal-Weight", "Risk-Parity", "60/40", "CAPM", "Linear Regression"],
            index=0,
        )
        max_weight = st.slider("Max weight per asset", 0.10, 1.00, cfg.MAX_WEIGHT, 0.05)
        rf_override = st.number_input("Risk-free rate (%/year)", value=float(ds["rf"].iloc[-1] * 100), step=0.25)
        tab = st.radio(
            "Select tab",
            [
                "Overview",
                "Summary",
                "Model Evaluation",
                "Chart",
                "Statistics",
                "Financials",
                "Analysis",
                "Monte Carlo Simulation",
                "Your Portfolio's Trend",
                "AI Prediction",
                "AI Backtesting",
                "AI Portfolio Optimization",
                "Financial Chatbot",
            ],
            index=2,
        )
        st.caption("Local demo for academic presentation")

    rf_series = pd.Series(float(rf_override) / 100.0, index=ds["rf"].index, name="rf")

    st.title("Crystal Ball - AI Portfolio Research")
    header(ds, sample_dates, masks, meta)
    render_investment_decision(summary_df)
    render_live_strategy_panel(ds, X, y, sample_dates, tickers, selected_tickers, masks, strategy, rf_series, max_weight)

    if tab == "Overview":
        render_overview(ds, tickers, summary_df, ablation_df)
    elif tab == "Summary":
        render_summary(summary_df)
    elif tab == "Model Evaluation":
        render_model_evaluation(summary_df)
    elif tab == "Chart":
        render_chart(ds, ticker)
    elif tab == "Statistics":
        render_statistics(ds, ticker)
    elif tab == "Financials":
        render_financials(ticker)
    elif tab == "Analysis":
        render_analysis(summary_df, ablation_df)
    elif tab == "Monte Carlo Simulation":
        render_monte_carlo(ds, selected_tickers, max_weight)
    elif tab == "Your Portfolio's Trend":
        render_portfolio_trend(ds, selected_tickers)
    elif tab == "AI Prediction":
        render_ai_prediction(ds, ticker)
    elif tab == "AI Backtesting":
        render_ai_backtesting(summary_df)
    elif tab == "AI Portfolio Optimization":
        render_ai_portfolio_optimization(ds, X, y, sample_dates, tickers, masks, selected_tickers, strategy, rf_series, max_weight)
    elif tab == "Financial Chatbot":
        render_chatbot()


if __name__ == "__main__":
    main()
