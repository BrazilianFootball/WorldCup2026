from __future__ import annotations

from src.constants import CYCLE_CUTOFFS
from src.model_sel.evaluate import evaluate_brier

if __name__ == "__main__":
    cutoff_start, cutoff_end = CYCLE_CUTOFFS[2022]
    evaluate_brier(year=2022, cutoff_start=cutoff_start, cutoff_end=cutoff_end)
