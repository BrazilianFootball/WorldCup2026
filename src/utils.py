"""Shared utility functions for the World Cup 2026 simulation project."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from src.constants import GROUP_STAGE_MATCHES, TEAM_NAME_MAP


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


def load_wc_results(
    path: str | Path,
) -> tuple[pd.DataFrame, dict[tuple[str, str], tuple[int, int]]]:
    """Load World Cup results CSV for model retraining and result fixing.

    Returns the DataFrame (with columns aligned to the model's training data)
    and a dict mapping (team_a, team_b) -> (goals_a, goals_b).
    """
    df = pd.read_csv(path)
    df["home_team"] = df["home_team"].replace(TEAM_NAME_MAP)
    df["away_team"] = df["away_team"].replace(TEAM_NAME_MAP)
    if "date" not in df.columns:
        df["date"] = pd.Timestamp.now().strftime("%Y-%m-%d")
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
