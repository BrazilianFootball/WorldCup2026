from __future__ import annotations

import json
import os
from pathlib import Path

import pandas as pd

from src.constants import (
    ALL_MATCHUPS_EXPORT_COLS,
    CUP_STARTED,
    DEFAULT_SEED,
    GROUPS,
    PARTIDAS_EXPORT_COLS,
    REFERENCE_DATE,
    TEAM_MAP_EN_TO_PT,
    WC_YEAR,
    get_pre_tournament_version,
)
from src.data import prepare_cycle_data
from src.model.bayesian import BayesianDixonColesModel
from src.output import (
    generate_dashboard,
    update_chaveamento_probs,
    update_html_from_summary,
)
from src.simulations.utils import build_all_matchups_dataframe_mc
from src.tournament.bayesian import BayesianWorldCup2026, _sample_posterior

N_SIM = 100_000
MODEL_NAME = "draws_2026_n_poisson_ranking.npz"

if __name__ == "__main__":
    os.makedirs("data/outputs/results", exist_ok=True)
    os.makedirs("data/outputs/dashboards", exist_ok=True)

    _, teams_26, _ = prepare_cycle_data(
        "data/results.csv", "2022-11-19", end_date=REFERENCE_DATE, apply_decay=True
    )

    model_path = f"data/outputs/models/{MODEL_NAME}"
    print(f"Carregando: {model_path}")
    model = BayesianDixonColesModel(model_path)

    _res = pd.read_csv("data/results.csv")
    _wc26 = _res[
        (_res["tournament"] == "FIFA World Cup")
        & (pd.to_datetime(_res["date"]).dt.year == WC_YEAR)
        & (pd.to_datetime(_res["date"]) <= pd.Timestamp(REFERENCE_DATE))
        & _res["home_score"].notna()
        & _res["away_score"].notna()
    ]
    known_results = {
        (r["home_team"], r["away_team"]): (int(r["home_score"]), int(r["away_score"]))
        for _, r in _wc26.iterrows()
    } or None

    simulator = BayesianWorldCup2026(
        model, seed=DEFAULT_SEED, known_results=known_results
    )
    tr = simulator.simulate(n=N_SIM)

    n = tr.counts
    wc_teams = [t for ts in GROUPS.values() for t in ts]
    wc_team_set = set(wc_teams)

    # Build JSON for dashboard (stage → list of {team, probability}).
    stage_map = {
        "round_of_32": tr.round_of_32,
        "round_of_16": tr.round_of_16,
        "quarter_finalists": tr.quarterfinals,
        "semi_finalists": tr.semifinals,
        "finalists": tr.final,
        "champion": tr.champion,
    }
    json_output_26 = {
        stage: [
            {"team": team, "probability": count / n * 100}
            for team, count in sorted(counts.items(), key=lambda x: x[1], reverse=True)
            if team in wc_team_set
        ]
        for stage, counts in stage_map.items()
    }
    with open("data/outputs/results/sim_results_2026.json", "w") as f:
        json.dump(json_output_26, f)
        f.write("\n")

    # Save group-match probability table (frozen after cup starts).
    if not CUP_STARTED and simulator.last_group_matches is not None:
        partidas_out = simulator.last_group_matches[PARTIDAS_EXPORT_COLS].round(4)
        partidas_out.to_csv("docs/csv/previsoes/partidas.csv", index=False)

    # Version deterministic display bracket.
    if simulator.last_bracket is not None:
        update_chaveamento_probs(simulator.last_bracket, get_pre_tournament_version())

    # Build and save the tournament summary CSV.
    rows = []
    for team in wc_teams:
        if team not in tr.champion:
            continue
        rows.append(
            {
                "team": TEAM_MAP_EN_TO_PT.get(team, team),
                "champion": tr.champion.get(team, 0) / n * 100,
                "final": tr.final.get(team, 0) / n * 100,
                "semifinals": tr.semifinals.get(team, 0) / n * 100,
                "quarterfinals": tr.quarterfinals.get(team, 0) / n * 100,
                "round_of_16": tr.round_of_16.get(team, 0) / n * 100,
                "round_of_32": tr.round_of_32.get(team, 0) / n * 100,
                "group_first_place": tr.first_place.get(team, 0) / n * 100,
                "group_second_place": tr.second_place.get(team, 0) / n * 100,
                "group_third_place": tr.third_place.get(team, 0) / n * 100,
            }
        )
    df_csv = (
        pd.DataFrame(rows)
        .sort_values("champion", ascending=False)
        .reset_index(drop=True)
        .round(2)
    )
    df_csv.insert(0, "position", df_csv.index + 1)
    if not CUP_STARTED:
        df_csv.to_csv("docs/csv/previsoes/summary.csv", index=False)

    stage_labels_26 = {
        "round_of_32": "16 Avos",
        "round_of_16": "Oitavas",
        "quarter_finalists": "Quartas",
        "semi_finalists": "Semis",
        "finalists": "Final",
        "champion": "Campeão",
    }
    generate_dashboard(
        "data/outputs/results/sim_results_2026.json",
        "data/outputs/dashboards/dashboard_2026.html",
        stage_labels_26,
        wc_team_set,
        12,
        "Copa 2026",
        MODEL_NAME,
    )
    print("Sucesso! Dashboard gerado em data/outputs/dashboards/dashboard_2026.html")

    if not CUP_STARTED:
        update_html_from_summary(
            csv_file="docs/csv/previsoes/summary.csv",
            version=get_pre_tournament_version(),
        )

    # Export all-vs-all matchup probabilities.
    print("\n=== EXPORTANDO all_matchups.csv ===\n")
    atk, dfn, rho, et = _sample_posterior(model.draws, N_SIM, seed=DEFAULT_SEED)
    df_all = build_all_matchups_dataframe_mc(
        teams_26,
        wc_teams,
        atk,
        dfn,
        rho,
        et,
        n_sim=N_SIM,
        pair_goals_cache=simulator.last_pair_goals_cache,
    )
    PARTIDAS_PATH = Path("docs/csv/previsoes/partidas.csv")
    output = "docs/csv/previsoes/all_matchups.csv"
    if not CUP_STARTED and PARTIDAS_PATH.exists():
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
