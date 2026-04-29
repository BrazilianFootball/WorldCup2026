"""Shared utilities for the World Cup 2026 project (data helpers + Dixon–Coles core)."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from numpy.typing import NDArray
from scipy.stats import poisson

from src.constants import (
    GROUP_STAGE_MATCHES,
    MAX_GOALS,
    TEAM_MAP_PT_TO_EN,
    TEAM_NAME_MAP,
)


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
    df.rename(
        {
            "home_real": "home_score",
            "away_real": "away_score",
        },
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


# --- Dixon–Coles score probabilities (used by models, simulation, future Bayes) ---


def effective_home_gamma(home_effect: float, neutral: bool, home_boost: float) -> float:
    """Multiplier applied to the home team's expected goals."""
    if not neutral:
        return home_effect
    if home_boost > 0:
        return 1.0 + (home_effect - 1.0) * home_boost
    return 1.0


def effective_home_gamma_vec(
    home_effect: NDArray[np.floating],
    neutral: bool,
    home_boost: float,
) -> NDArray[np.floating]:
    """Broadcast version of :func:`effective_home_gamma` for shape ``(B,)``."""
    he = np.asarray(home_effect, dtype=float)
    if not neutral:
        return he
    if home_boost > 0:
        return 1.0 + (he - 1.0) * home_boost
    return np.ones_like(he, dtype=float)


def score_probability_matrix(
    hl: float,
    al: float,
    rho: float,
    max_goals: int = MAX_GOALS,
) -> NDArray[np.floating]:
    """Dixon–Coles adjusted score matrix given Poisson intensities ``hl``, ``al``."""
    goals = np.arange(max_goals + 1)
    prob = np.outer(poisson.pmf(goals, hl), poisson.pmf(goals, al))

    prob[0, 0] *= 1 - hl * al * rho
    prob[1, 0] *= 1 + al * rho
    prob[0, 1] *= 1 + hl * rho
    prob[1, 1] *= 1 - rho
    prob /= prob.sum()
    return prob


def score_probability_matrix_batched(
    hl: NDArray[np.floating],
    al: NDArray[np.floating],
    rho: NDArray[np.floating],
    max_goals: int = MAX_GOALS,
) -> NDArray[np.floating]:
    """Dixon–Coles matrices for many matches at once. Shape ``(B, M, M)``."""
    hl = np.asarray(hl, dtype=float)
    al = np.asarray(al, dtype=float)
    rho = np.asarray(rho, dtype=float)
    if hl.shape != al.shape or hl.ndim != 1:
        raise ValueError("hl and al must be 1-D arrays of equal length.")
    b = hl.shape[0]
    if rho.shape not in ((b,), ()):
        raise ValueError("rho must be scalar or shape (B,) matching hl.")
    if rho.ndim == 0:
        rho = np.broadcast_to(float(rho), (b,))
    goals = np.arange(max_goals + 1, dtype=float)
    ph = poisson.pmf(goals, hl[:, None])
    pa = poisson.pmf(goals, al[:, None])
    prob = ph[:, :, None] * pa[:, None, :]

    prob[:, 0, 0] *= 1 - hl * al * rho
    prob[:, 1, 0] *= 1 + al * rho
    prob[:, 0, 1] *= 1 + hl * rho
    prob[:, 1, 1] *= 1 - rho
    s = prob.sum(axis=(1, 2), keepdims=True)
    s = np.where(s > 0, s, 1.0)
    prob /= s
    return prob
