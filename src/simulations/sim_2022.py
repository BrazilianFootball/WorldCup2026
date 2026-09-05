from __future__ import annotations

from src.constants import CYCLE_CUTOFFS, GROUPS_2022, STAGE_LABELS_2022
from src.simulations.utils import run_backtest_simulation

if __name__ == "__main__":
    cutoff_start, cutoff_end = CYCLE_CUTOFFS[2022]
    run_backtest_simulation(
        year=2022,
        groups=GROUPS_2022,
        cutoff_start=cutoff_start,
        cutoff_end=cutoff_end,
        stage_labels=STAGE_LABELS_2022,
        dashboard_title="Copa 2022",
    )
