"""Data loading and preparation utilities."""

from __future__ import annotations

import os
import shutil
from pathlib import Path

import kagglehub
import numpy as np
import pandas as pd

from src.constants import (
    DATA_DIR,
    DATASET_FILES,
    GROUP_STAGE_MATCHES,
    KAGGLE_DATASET,
    TEAM_MAP_PT_TO_EN,
    TEAM_NAME_MAP,
)


# ── Team name resolution ──────────────────────────────────────────────────────


def resolve_team_name(name: str, known_teams: list[str]) -> str:
    """Try to match a team name to the model's team list."""
    if name in known_teams:
        return name
    mapped = TEAM_NAME_MAP.get(name)
    if mapped and mapped in known_teams:
        return mapped
    raise ValueError(
        f"Team '{name}' not found in model (tried alias '{mapped}'). "
        f"Add it to TEAM_NAME_MAP or check the spelling."
    )


# ── World Cup results loading ─────────────────────────────────────────────────


def load_wc_results(
    path: str | Path,
) -> tuple[pd.DataFrame, dict[tuple[str, str], tuple[int, int]]]:
    """Load World Cup results CSV for model retraining and result fixing.

    Returns the DataFrame (with columns aligned to the model's training data)
    and a dict mapping (team_a, team_b) -> (goals_a, goals_b).
    """
    df = pd.read_csv(path)
    df.rename(
        {"home_real": "home_score", "away_real": "away_score"},
        axis=1,
        inplace=True,
    )
    df.dropna(inplace=True)
    df["home_team"] = df["home_team"].replace(TEAM_MAP_PT_TO_EN)
    df["away_team"] = df["away_team"].replace(TEAM_MAP_PT_TO_EN)
    if "date" not in df.columns:
        df["date"] = pd.Timestamp.now().strftime("%Y-%m-%d")
    else:
        df["date"] = pd.to_datetime(df["date"] + "/2026", format="%d/%m/%Y")
    if "tournament" not in df.columns:
        df["tournament"] = "FIFA World Cup"
    if "neutral" not in df.columns:
        df["neutral"] = True

    known: dict[tuple[str, str], tuple[int, int]] = {}
    for _, row in df.iterrows():
        key = (str(row["home_team"]), str(row["away_team"]))
        value = (int(row["home_score"]), int(row["away_score"]))
        known[key] = value

    return df, known


def detect_phase(
    known: dict[tuple[str, str], tuple[int, int]] | None,
    groups: dict[str, list[str]],
) -> str:
    """Determine which tournament phase is currently in progress."""
    if not known:
        return "group_stage"

    group_matches = 0
    for ta, tb in known:
        for teams in groups.values():
            if ta in teams and tb in teams:
                group_matches += 1
                break

    if group_matches < GROUP_STAGE_MATCHES:
        return "group_stage"

    ko = len(known) - group_matches
    if ko < 16:
        return "round_of_32"
    if ko < 24:
        return "round_of_16"
    if ko < 28:
        return "quarterfinals"
    if ko < 30:
        return "semifinals"
    return "final"


# ── Training data preparation ─────────────────────────────────────────────────


def filter_low_volume_teams(
    df, min_matches=20, col_home="home_team", col_away="away_team"
):
    """Keep only matches where both teams have enough historical volume."""
    home_matches = df[col_home].value_counts()
    away_matches = df[col_away].value_counts()

    # Combine home and away appearances; fill missing sides for one-sided histories.
    total_matches = home_matches.add(away_matches, fill_value=0)
    valid_teams = total_matches[total_matches > min_matches].index

    clean_df = df[
        df[col_home].isin(valid_teams) & df[col_away].isin(valid_teams)
    ].copy()

    # Keep Stan team IDs deterministic across runs.
    team_list = sorted(list(valid_teams))

    return clean_df, team_list


def get_importance_factor(row):
    """Calculate match importance from the tournament name."""
    t = str(row["tournament"]).lower()
    if "fifa world cup" in t and "qualification" not in t:
        return 60
    continental_comps = [
        "uefa euro",
        "copa américa",
        "african cup of nations",
        "afc asian cup",
        "gold cup",
        "oceania nations cup",
    ]
    if any(comp in t for comp in continental_comps) and "qualification" not in t:
        return 40
    if "nations league" in t and "final" in t:
        return 35
    if "qualification" in t or "eliminatórias" in t:
        return 25
    if "nations league" in t:
        return 20
    if "friendly" in t:
        return 10
    return 20


def prepare_cycle_data(
    csv_path,
    start_date,
    end_date=None,
    min_matches=20,
    apply_decay=True,
    decay_alpha=0.001,
):
    """
    Filter matches for a specific cycle, apply weights, and map teams.

    This supports the 2026 cycle and historical validation cycles.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Arquivo {csv_path} não encontrado.")

    df = pd.read_csv(csv_path)
    df, _ = filter_low_volume_teams(df)
    df["date"] = pd.to_datetime(df["date"])

    # Limit training matches to the requested World Cup cycle.
    date_filter = df["date"] >= start_date
    if end_date:
        date_filter &= df["date"] <= pd.Timestamp(end_date)
    df_cycle = df[date_filter].copy()
    df_cycle.dropna(subset=["home_score", "away_score"], inplace=True)

    # Re-check minimum volume after the cycle filter.
    counts = (
        df_cycle["home_team"]
        .value_counts()
        .add(df_cycle["away_team"].value_counts(), fill_value=0)
    )
    valid_cycle_teams = counts[counts >= min_matches].index
    df_cycle = df_cycle[
        df_cycle["home_team"].isin(valid_cycle_teams)
        & df_cycle["away_team"].isin(valid_cycle_teams)
    ].copy()

    df_cycle["tourn_weight"] = df_cycle.apply(get_importance_factor, axis=1)

    # Weight recent and high-importance matches more heavily.
    if apply_decay:
        max_date = df_cycle["date"].max()
        df_cycle["days_ago"] = (max_date - df_cycle["date"]).dt.days
        df_cycle["time_weight"] = np.exp(-decay_alpha * df_cycle["days_ago"])
        df_cycle["game_weight"] = df_cycle["tourn_weight"] * df_cycle["time_weight"]
    else:
        df_cycle["game_weight"] = df_cycle["tourn_weight"]

    df_cycle["game_weight"] = df_cycle["game_weight"] / 10

    # Stan uses 1-based team IDs.
    teams_list = sorted(list(valid_cycle_teams))
    team_map = {name: i + 1 for i, name in enumerate(teams_list)}

    print(
        f"Dados preparados: {len(df_cycle)} jogos e {len(teams_list)} seleções identificadas."
    )

    return df_cycle, teams_list, team_map


def load_ranking_priors(ranking_path, teams_list):
    """Read the FIFA ranking CSV and return normalized strengths ordered by teams_list."""
    try:
        df_ranking = pd.read_csv(ranking_path, sep=None, engine="python")
    except Exception as e:
        print(f"Erro ao ler o arquivo de ranking: {e}")
        return np.zeros(len(teams_list))

    cols = df_ranking.columns.tolist()
    team_col = next(
        (c for c in cols if "sele" in c.lower() or "team" in c.lower()),
        cols[min(1, len(cols) - 1)],
    )
    pts_col = next(
        (
            c
            for c in cols
            if "pont" in c.lower() or "pts" in c.lower() or "point" in c.lower()
        ),
        cols[-1],
    )

    fifa_ranking_data = pd.Series(
        df_ranking[pts_col].values, index=df_ranking[team_col]
    ).to_dict()
    all_pts = [
        float(str(v).replace(",", "."))
        for v in fifa_ranking_data.values()
        if pd.notnull(v)
    ]

    mean_pts = np.mean(all_pts)
    std_pts = np.std(all_pts)

    team_prior_strength = []
    for team in teams_list:
        # Missing teams receive the mean ranking score before normalization.
        pts = fifa_ranking_data.get(team, mean_pts)
        normalized_val = (float(str(pts).replace(",", ".")) - mean_pts) / std_pts
        team_prior_strength.append(normalized_val)

    print(f"Sucesso! Posições do ranking {ranking_path} carregadas e normalizadas.")
    return np.array(team_prior_strength)


# ── Kaggle dataset download ───────────────────────────────────────────────────


def get_data() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = Path(kagglehub.dataset_download(KAGGLE_DATASET, force_download=True))
    for name in DATASET_FILES:
        found = next(path.rglob(name), None)
        if found is not None and found.is_file():
            shutil.copy2(found, DATA_DIR / name)


def treat_dates(results: pd.DataFrame) -> pd.DataFrame:
    results["date"] = pd.to_datetime(results["date"])
    results.sort_values("date", ascending=False, inplace=True, ignore_index=True)
    return results


def data_pipeline() -> None:
    get_data()
    results = pd.read_csv(DATA_DIR / "results.csv")
    results = treat_dates(results)

    for col in ("home_score", "away_score"):
        results[col] = results[col].astype(pd.Int64Dtype())

    results[results["date"] >= "2014-06-11"].to_csv(DATA_DIR / "results.csv", index=False)


def load_data() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    results_path = DATA_DIR / "results.csv"
    shootouts_path = DATA_DIR / "shootouts.csv"
    goalscorers_path = DATA_DIR / "goalscorers.csv"

    if not all(p.is_file() for p in (results_path, shootouts_path, goalscorers_path)):
        data_pipeline()

    results = pd.read_csv(results_path, parse_dates=["date"])
    shootouts = pd.read_csv(shootouts_path, parse_dates=["date"])
    goalscorers = pd.read_csv(goalscorers_path, parse_dates=["date"])
    return results, shootouts, goalscorers
