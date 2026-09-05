from __future__ import annotations

from src.constants import CYCLE_CUTOFFS, GROUPS_2018, STAGE_LABELS_2018
from src.simulations.utils import run_backtest_simulation

if __name__ == "__main__":
    cutoff_start, cutoff_end = CYCLE_CUTOFFS[2018]
    run_backtest_simulation(
        year=2018,
        groups=GROUPS_2018,
        cutoff_start=cutoff_start,
        cutoff_end=cutoff_end,
        stage_labels=STAGE_LABELS_2018,
        dashboard_title="Copa do Mundo 2018",
    )
