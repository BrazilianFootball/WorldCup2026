"""Export all_matchups.csv using the same Stan seed as sim_2026."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from src.constants import (
    ALL_MATCHUPS_EXPORT_COLS,
    CYCLE_CUTOFFS,
    GROUPS,
    PARTIDAS_EXPORT_COLS,
)
from src.data import prepare_cycle_data
from src.model.bayesian import BayesianDixonColesModel
from src.simulations.utils import build_all_matchups_dataframe_mc
from src.tournament.bayesian import _sample_posterior

DEFAULT_SIM_SEED = 42
DEFAULT_MATCH_SIMS = 100_000
MODEL_NAME = "draws_2026_n_poisson_ranking.npz"
PARTIDAS_PATH = Path("docs/csv/previsoes/partidas.csv")

if __name__ == "__main__":
    _, teams_26, _ = prepare_cycle_data(
        "data/results.csv", CYCLE_CUTOFFS[2026][0], apply_decay=True
    )
    model = BayesianDixonColesModel(f"data/outputs/models/{MODEL_NAME}")
    atk, dfn, rho, et = _sample_posterior(
        model.draws, DEFAULT_MATCH_SIMS, seed=DEFAULT_SIM_SEED
    )
    wc_teams = [team for teams in GROUPS.values() for team in teams]

    print("Gerando all_matchups.csv (Monte Carlo Stan)...")
    df_all = build_all_matchups_dataframe_mc(
        teams_26,
        wc_teams,
        atk,
        dfn,
        rho,
        et,
        n_sim=DEFAULT_MATCH_SIMS,
    )
    output = "docs/csv/previsoes/all_matchups.csv"
    if PARTIDAS_PATH.exists():
        partidas = pd.read_csv(PARTIDAS_PATH)
        prob_cols = [
            c
            for c in PARTIDAS_EXPORT_COLS
            if c not in ("group", "home_team", "away_team", "date")
        ]
        merged = df_all.merge(
            partidas[["home_team", "away_team"] + prob_cols],
            on=["home_team", "away_team"],
            how="left",
            suffixes=("_all", "_partidas"),
        )
        for col in prob_cols:
            partidas_col = f"{col}_partidas"
            if partidas_col in merged.columns:
                merged[col] = merged[partidas_col].combine_first(merged[f"{col}_all"])
                merged = merged.drop(columns=[f"{col}_all", partidas_col])
        df_all = merged[ALL_MATCHUPS_EXPORT_COLS]

    df_all.to_csv(output, index=False)
    print(f"  Salvo em: {output} ({len(df_all)} confrontos)")
