from __future__ import annotations

import io
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
from src.tournament.bayesian import (
    BayesianWorldCup2026,
    _aggregate_match_probs,
    _match_lambdas,
    _sample_posterior,
    simulate_matches,
)

N_SIM = 100_000
MODEL_NAME = "draws_2026_n_poisson_ranking.npz"


def _validate_partidas_write(path: Path, new_df: pd.DataFrame) -> None:
    """Raise ValueError if new_df would alter any existing non-empty value in the CSV.

    Allowed changes:
      - filling in empty home_real / away_real
      - filling in empty probability columns for a row that had none
      - appending new rows
    Everything else (editing existing values OR changing their format) is rejected.
    """
    if not path.exists():
        return

    orig = pd.read_csv(path, dtype=str, keep_default_na=False)
    new = pd.read_csv(
        io.StringIO(new_df.to_csv(index=False)), dtype=str, keep_default_na=False
    )

    if len(new) < len(orig):
        raise ValueError(
            f"{path}: linhas removidas (tinha {len(orig)}, agora {len(new)})"
        )

    for i in range(len(orig)):
        orig_row = orig.iloc[i]
        new_row = new.iloc[i]
        home = orig_row.get("home_team", "?")
        away = orig_row.get("away_team", "?")
        for col in orig.columns:
            if col not in new.columns:
                raise ValueError(f"{path}: coluna '{col}' foi removida")
            orig_val = orig_row[col]
            new_val = new_row[col]
            if orig_val != "" and orig_val != new_val:
                raise ValueError(
                    f"{path} linha {i + 2} ({home} vs {away}): "
                    f"'{col}' alterado de '{orig_val}' para '{new_val}'"
                )


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
        _validate_partidas_write(Path("docs/csv/previsoes/partidas.csv"), partidas_out)
        partidas_out.to_csv("docs/csv/previsoes/partidas.csv", index=False)

    # Version deterministic display bracket.
    if simulator.last_bracket is not None:
        update_chaveamento_probs(simulator.last_bracket, get_pre_tournament_version())

    # Enrich partidas.csv with actual match results from results.csv.
    # Key includes the match date (YYYY-MM-DD) to correctly disambiguate rematches
    # between the same pair of teams in different stages (e.g. group vs. knockout).
    _partidas_path = Path("docs/csv/previsoes/partidas.csv")
    if _partidas_path.exists():
        _pt_to_en = {v: k for k, v in TEAM_MAP_EN_TO_PT.items()}
        _en_lookup = {
            (r["date"], r["home_team"], r["away_team"]): (
                int(r["home_score"]),
                int(r["away_score"]),
            )
            for _, r in _wc26.iterrows()
        }

        def _find_result(date_ddmm: str, home_pt: str, away_pt: str) -> tuple:
            from datetime import date as _date
            from datetime import timedelta

            date_iso = f"2026-{date_ddmm[3:5]}-{date_ddmm[:2]}"
            home_en = _pt_to_en.get(home_pt, home_pt)
            away_en = _pt_to_en.get(away_pt, away_pt)
            # Try exact date first, then ±1 day to handle timezone offsets between
            # the date recorded in results.csv (local) and the BRT date in partidas.csv.
            for delta in (0, -1, 1):
                alt = (
                    _date.fromisoformat(date_iso) + timedelta(days=delta)
                ).isoformat()
                result = _en_lookup.get((alt, home_en, away_en))
                if result is not None:
                    return result
            return (None, None)

        _partidas = pd.read_csv(_partidas_path)
        for _idx, _row in _partidas[_partidas["home_real"].isna()].iterrows():
            _h, _a = _find_result(_row["date"], _row["home_team"], _row["away_team"])
            if _h is not None:
                _partidas.at[_idx, "home_real"] = _h
                _partidas.at[_idx, "away_real"] = _a
        for _col in ("home_real", "away_real"):
            _partidas[_col] = pd.array(_partidas[_col], dtype="Int64")
        _validate_partidas_write(_partidas_path, _partidas)
        _partidas.to_csv(_partidas_path, index=False)
        n_real = _partidas["home_real"].notna().sum()
        print(f"partidas.csv atualizado com {n_real} resultado(s) real(is).")

    # Fill in model probabilities for knockout matches that are newly known
    # (teams defined but probability columns still empty).
    if _partidas_path.exists():
        _partidas = pd.read_csv(_partidas_path)
        for _col in ("home_real", "away_real"):
            if _col in _partidas.columns:
                _partidas[_col] = pd.array(_partidas[_col], dtype="Int64")
        _pt_to_en = {v: k for k, v in TEAM_MAP_EN_TO_PT.items()}
        t_to_idx_ko = {name: i for i, name in enumerate(model.teams)}
        group_labels = set(GROUPS.keys())

        knockout_no_probs = (
            ~_partidas["group"].isin(group_labels) & _partidas["home_win"].isna()
        )
        if knockout_no_probs.any():
            atk_ko, dfn_ko, rho_ko, et_ko = _sample_posterior(
                model.draws, N_SIM, seed=DEFAULT_SEED
            )
            for idx, row in _partidas[knockout_no_probs].iterrows():
                home_en = _pt_to_en.get(row["home_team"], row["home_team"])
                away_en = _pt_to_en.get(row["away_team"], row["away_team"])
                if home_en not in t_to_idx_ko or away_en not in t_to_idx_ko:
                    continue
                h_i, a_i = t_to_idx_ko[home_en], t_to_idx_ko[away_en]
                l1, l2 = _match_lambdas(atk_ko, dfn_ko, h_i, a_i, et_ko)
                rho_exp = rho_ko.reshape(-1, 1) if rho_ko is not None else None
                g1, g2 = simulate_matches(
                    l1.reshape(-1, 1), l2.reshape(-1, 1), rho_exp, N_SIM
                )
                probs = _aggregate_match_probs(g1[:, 0], g2[:, 0])
                for col, val in probs.items():
                    if col in _partidas.columns:
                        _partidas.at[idx, col] = round(val, 4)
            _validate_partidas_write(_partidas_path, _partidas)
            _partidas.to_csv(_partidas_path, index=False)
            n_ko = int(knockout_no_probs.sum())
            print(f"partidas.csv: probabilidades preenchidas para {n_ko} jogo(s).")

    # Build the tournament results DataFrame for tabela_chances.csv.
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

    update_html_from_summary(
        df=df_csv,
        version=get_pre_tournament_version(),
    )

    # Export all-vs-all matchup probabilities.
    print("\n=== EXPORTANDO all_matchups.csv ===\n")
    atk, dfn, rho, et = _sample_posterior(model.draws, N_SIM, seed=DEFAULT_SEED)
    # Exclude known results from the cache so all_matchups.csv always reflects
    # model probabilities, not the deterministic actual scores.
    raw_cache = simulator.last_pair_goals_cache
    cache_for_all = (
        {
            k: v
            for k, v in raw_cache.items()
            if known_results is None or k not in known_results
        }
        if raw_cache
        else None
    )
    df_all = build_all_matchups_dataframe_mc(
        teams_26,
        wc_teams,
        atk,
        dfn,
        rho,
        et,
        n_sim=N_SIM,
        pair_goals_cache=cache_for_all,
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
