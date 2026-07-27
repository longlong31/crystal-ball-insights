"""Baseline dạng luật (rule-based): Equal-Weight, Risk-Parity, 60/40 — không cần dự báo mu."""
from .. import backtest as bt

equal_weight_strategy = bt.equal_weight_strategy
risk_parity_strategy = bt.risk_parity_strategy
sixty_forty_strategy = bt.sixty_forty_strategy
