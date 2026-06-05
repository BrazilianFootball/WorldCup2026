from __future__ import annotations

import os
import subprocess

import numpy as np
import pandas as pd
from cmdstanpy import CmdStanModel

from src.constants import TEAM_MAP_PT_TO_EN, WC_YEAR, get_pre_tournament_version
from src.data import load_ranking_priors, prepare_cycle_data
from src.model.bayesian import BayesianDixonColesModel, load_draws
from src.output import update_chaveamento_probs, update_html_from_summary
from src.tournament.bayesian import BayesianWorldCup2026, simulate_stage_and_remaining


def train_and_save(
    cycle_name, model_name, stan_file, exe_file, df, teams, team_map, ranking_priors
):
    """
    Run an updated 2026 Stan model and save posterior draws for live updates.
    """
    print(f"\n[{cycle_name}] Treinando: {model_name} ...")

    # Keep this schema aligned with the data block in the Stan model.
    stan_data = {
        "N": len(df),
        "T": len(teams),
        "team_i": df["home_team"].map(team_map).values,
        "team_j": df["away_team"].map(team_map).values,
        "y_i": df["home_score"].values.astype(int),
        "y_j": df["away_score"].values.astype(int),
        "game_weight": df["game_weight"].values,
        "prior_strength": ranking_priors,
    }

    stan_model = CmdStanModel(stan_file=stan_file, exe_file=exe_file)

    # Recreate the model from source so CmdStan can rebuild stale binaries.
    stan_model = CmdStanModel(stan_file=stan_file)
    fit = stan_model.sample(data=stan_data, chains=4, iter_sampling=5000, seed=123)

    post_draws = fit.stan_variables()
    output_path = f"data/outputs/models/new_draws_{cycle_name}_{model_name}.npz"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    np.savez_compressed(output_path, **post_draws)
    print(f"Salvo em: {output_path}")


if __name__ == "__main__":
    print("\n=== PREPARANDO DADOS ===\n")

    stage = ""
    old_results = pd.read_csv("data/results.csv")
    actual_results = pd.read_csv("data/world_cup_results.csv")

    if actual_results["home_real"].isna().sum() == actual_results.shape[0]:
        print("\n=== TREINANDO MODELO PARA 2026 ===\n")
        subprocess.run(["python", "-m", "src.simulations.train_2026"], check=True)

        print("\n=== SIMULANDO COPA 2026 ===\n")
        subprocess.run(["python", "-m", "src.simulations.sim_2026"], check=True)
    else:
        if (
            actual_results.loc[actual_results["stage"] == "semi_final", "home_real"]
            .isna()
            .sum()
            == 0
        ) & (
            actual_results.loc[actual_results["stage"] == "final", "home_team"]
            .isna()
            .sum()
            == 0
        ):
            stage = "final"
            columns_to_replace = ["champion"]
            matches_to_pred = actual_results.loc[
                actual_results["stage"].isin(["final"])
            ]
            matches_to_add = actual_results.loc[
                actual_results["stage"].isin(
                    ["round_of_32", "round_of_16", "quarter_final", "semi_final"]
                )
            ]
            matches_to_add["date"] = pd.to_datetime(
                matches_to_add["date"] + "/2026", format="%d/%m/%Y"
            ).dt.strftime("%Y-%m-%d")
            df_to_concat = pd.DataFrame(
                {
                    "date": matches_to_add["date"],
                    "home_team": matches_to_add["home_team"].map(TEAM_MAP_PT_TO_EN),
                    "away_team": matches_to_add["away_team"].map(TEAM_MAP_PT_TO_EN),
                    "home_score": matches_to_add["home_real"],
                    "away_score": matches_to_add["away_real"],
                    "tournament": "FIFA World Cup",
                    "city": None,
                    "country": None,
                    "neutral": None,
                }
            )
            df_updated = pd.concat([old_results, df_to_concat], ignore_index=True)
        elif (
            actual_results.loc[actual_results["stage"] == "quarter_final", "home_real"]
            .isna()
            .sum()
            == 0
        ) & (
            actual_results.loc[actual_results["stage"] == "semi_final", "home_team"]
            .isna()
            .sum()
            == 0
        ):
            stage = "semi_final"
            columns_to_replace = ["final", "champion"]
            matches_to_pred = actual_results.loc[
                actual_results["stage"].isin(["semi_final"])
            ]
            matches_to_add = actual_results.loc[
                actual_results["stage"].isin(
                    ["round_of_32", "round_of_16", "quarter_final"]
                )
            ]
            matches_to_add["date"] = pd.to_datetime(
                matches_to_add["date"] + "/2026", format="%d/%m/%Y"
            ).dt.strftime("%Y-%m-%d")
            df_to_concat = pd.DataFrame(
                {
                    "date": matches_to_add["date"],
                    "home_team": matches_to_add["home_team"].map(TEAM_MAP_PT_TO_EN),
                    "away_team": matches_to_add["away_team"].map(TEAM_MAP_PT_TO_EN),
                    "home_score": matches_to_add["home_real"],
                    "away_score": matches_to_add["away_real"],
                    "tournament": "FIFA World Cup",
                    "city": None,
                    "country": None,
                    "neutral": None,
                }
            )
            df_updated = pd.concat([old_results, df_to_concat], ignore_index=True)
        elif (
            actual_results.loc[actual_results["stage"] == "round_of_16", "home_real"]
            .isna()
            .sum()
            == 0
        ) & (
            actual_results.loc[actual_results["stage"] == "quarter_final", "home_team"]
            .isna()
            .sum()
            == 0
        ):
            stage = "quarter_final"
            columns_to_replace = ["semifinals", "final", "champion"]
            matches_to_pred = actual_results.loc[
                actual_results["stage"].isin(["quarter_final"])
            ]
            matches_to_add = actual_results.loc[
                actual_results["stage"].isin(["round_of_32", "round_of_16"])
            ]
            matches_to_add["date"] = pd.to_datetime(
                matches_to_add["date"] + "/2026", format="%d/%m/%Y"
            ).dt.strftime("%Y-%m-%d")
            df_to_concat = pd.DataFrame(
                {
                    "date": matches_to_add["date"],
                    "home_team": matches_to_add["home_team"].map(TEAM_MAP_PT_TO_EN),
                    "away_team": matches_to_add["away_team"].map(TEAM_MAP_PT_TO_EN),
                    "home_score": matches_to_add["home_real"],
                    "away_score": matches_to_add["away_real"],
                    "tournament": "FIFA World Cup",
                    "city": None,
                    "country": None,
                    "neutral": None,
                }
            )
            df_updated = pd.concat([old_results, df_to_concat], ignore_index=True)
        elif (
            actual_results.loc[actual_results["stage"] == "round_of_32", "home_real"]
            .isna()
            .sum()
            == 0
        ) & (
            actual_results.loc[actual_results["stage"] == "round_of_16", "home_team"]
            .isna()
            .sum()
            == 0
        ):
            stage = "round_of_16"
            columns_to_replace = [
                "quarterfinals",
                "semifinals",
                "final",
                "champion",
            ]
            matches_to_pred = actual_results.loc[
                actual_results["stage"].isin(["round_of_16"])
            ]
            matches_to_add = actual_results.loc[
                actual_results["stage"] == "round_of_32"
            ]
            matches_to_add["date"] = pd.to_datetime(
                matches_to_add["date"] + "/2026", format="%d/%m/%Y"
            ).dt.strftime("%Y-%m-%d")
            df_to_concat = pd.DataFrame(
                {
                    "date": matches_to_add["date"],
                    "home_team": matches_to_add["home_team"].map(TEAM_MAP_PT_TO_EN),
                    "away_team": matches_to_add["away_team"].map(TEAM_MAP_PT_TO_EN),
                    "home_score": matches_to_add["home_real"],
                    "away_score": matches_to_add["away_real"],
                    "tournament": "FIFA World Cup",
                    "city": None,
                    "country": None,
                    "neutral": None,
                }
            )
            df_updated = pd.concat([old_results, df_to_concat], ignore_index=True)
        elif (
            actual_results.loc[actual_results["stage"] == "group", "home_real"]
            .isna()
            .sum()
            == 0
        ) & (
            actual_results.loc[actual_results["stage"] == "round_of_32", "home_team"]
            .isna()
            .sum()
            == 0
        ):
            stage = "round_of_32"
            columns_to_replace = [
                "round_of_16",
                "quarterfinals",
                "semifinals",
                "final",
                "champion",
            ]
            matches_to_pred = actual_results.loc[
                actual_results["stage"] == "round_of_32"
            ]
            matches_to_add = actual_results.loc[actual_results["stage"] == "group"]
            matches_to_add["date"] = pd.to_datetime(
                matches_to_add["date"] + "/2026", format="%d/%m/%Y"
            ).dt.strftime("%Y-%m-%d")
            df_to_concat = pd.DataFrame(
                {
                    "date": matches_to_add["date"],
                    "home_team": matches_to_add["home_team"].map(TEAM_MAP_PT_TO_EN),
                    "away_team": matches_to_add["away_team"].map(TEAM_MAP_PT_TO_EN),
                    "home_score": matches_to_add["home_real"],
                    "away_score": matches_to_add["away_real"],
                    "tournament": "FIFA World Cup",
                    "city": None,
                    "country": None,
                    "neutral": None,
                }
            )
            df_updated = pd.concat([old_results, df_to_concat], ignore_index=True)

        df_updated.to_csv("data/new_results.csv", index=False)
        df_26, teams_26, team_map_26 = prepare_cycle_data(
            "data/new_results.csv", "2022-11-19", apply_decay=True
        )

        ranking_priors_26 = load_ranking_priors(
            "data/raw/fifa_ranking_2022.csv", teams_26
        )

        print("\n=== COMPILANDO MODELO ===\n")
        stan_file = "stan_models/n_poisson_ranking.stan"
        model = CmdStanModel(stan_file=stan_file)

        print("\n=== RETREINANDO MODELO ===\n")
        train_and_save(
            "2026",
            "n_poisson_ranking",
            stan_file,
            model.exe_file,
            df_26,
            teams_26,
            team_map_26,
            ranking_priors_26,
        )

        model_name = "new_draws_2026_n_poisson_ranking.npz"
        model_path = f"data/outputs/models/{model_name}"
        draws_26 = load_draws(model_path)
        matches_to_pred["home_team"] = matches_to_pred["home_team"].map(
            TEAM_MAP_PT_TO_EN
        )
        matches_to_pred["away_team"] = matches_to_pred["away_team"].map(
            TEAM_MAP_PT_TO_EN
        )
        matches_to_pred.reset_index(drop=True, inplace=True)
        if stage == "final":
            pred_third_place = actual_results.loc[
                actual_results["stage"].isin(["third_place"])
            ]
            pred_third_place["home_team"] = pred_third_place["home_team"].map(
                TEAM_MAP_PT_TO_EN
            )
            pred_third_place["away_team"] = pred_third_place["away_team"].map(
                TEAM_MAP_PT_TO_EN
            )
            pred_third_place.reset_index(drop=True, inplace=True)
            probs, df_summary, df_matches = simulate_stage_and_remaining(
                draws_26, teams_26, matches_to_pred
            )
            probs_third_place, _, df_matches_third_place = simulate_stage_and_remaining(
                draws_26, teams_26, pred_third_place
            )
            df_previous_summary = pd.read_csv("docs/csv/previsoes/summary.csv")
            # Align by team before replacing only the newly simulated columns.
            df_summary = df_summary.set_index("team")
            df_previous_summary = df_previous_summary.set_index("team")
            df_previous_summary = df_previous_summary[
                df_previous_summary.index.isin(df_summary.index)
            ]

            df_previous_summary.update(df_summary[columns_to_replace])

            # Re-rank the public table after updating champion probability.
            df_previous_summary = df_previous_summary.sort_values(
                by="champion", ascending=False
            )

            df_previous_summary = df_previous_summary.reset_index()
            df_previous_summary["position"] = df_previous_summary.index + 1

            df_matches.to_csv(f"docs/csv/previsoes/probs_{stage}.csv", index=False)
            df_matches_third_place.to_csv(
                "docs/csv/previsoes/probs_third_place.csv", index=False
            )
        else:
            probs, df_summary, df_matches = simulate_stage_and_remaining(
                draws_26, teams_26, matches_to_pred
            )
            df_previous_summary = pd.read_csv("docs/csv/previsoes/summary.csv")
            # Align by team before replacing only the newly simulated columns.
            df_summary = df_summary.set_index("team")
            df_previous_summary = df_previous_summary.set_index("team")
            df_previous_summary = df_previous_summary[
                df_previous_summary.index.isin(df_summary.index)
            ]

            df_previous_summary.update(df_summary[columns_to_replace])

            # Re-rank the public table after updating champion probability.
            df_previous_summary = df_previous_summary.sort_values(
                by="champion", ascending=False
            )

            df_previous_summary = df_previous_summary.reset_index()
            df_previous_summary["position"] = df_previous_summary.index + 1

            df_matches.to_csv(f"docs/csv/previsoes/probs_{stage}.csv", index=False)

    _stage_to_version = {
        "round_of_32": "Após a Fase de Grupos",
        "round_of_16": "Após os 16-Avos",
        "quarter_final": "Após as Oitavas",
        "semi_final": "Após as Quartas",
        "final": "Após as Semifinais",
    }
    version = _stage_to_version.get(stage) or get_pre_tournament_version()

    if stage:
        _wc26 = df_updated[
            (df_updated["tournament"] == "FIFA World Cup")
            & (pd.to_datetime(df_updated["date"]).dt.year == WC_YEAR)
        ]
        bracket_known = {
            (r["home_team"], r["away_team"]): (
                int(r["home_score"]),
                int(r["away_score"]),
            )
            for _, r in _wc26.iterrows()
        } or None
        bracket_model = BayesianDixonColesModel(model_path)
        bracket_sim = BayesianWorldCup2026(bracket_model, known_results=bracket_known)
        bracket_sim.simulate()
        if bracket_sim.last_bracket is not None:
            update_chaveamento_probs(bracket_sim.last_bracket, version)

        update_html_from_summary(df=df_previous_summary, version=version)
