"""Count how often specific team matchups occur at a given knockout stage
across many tournament simulations.

``BayesianWorldCup2026.simulate()`` exposes, via ``last_stage_arrays``, the
raw per-simulation team-index array for each knockout round. In each array
(shape ``n_sim x k``), consecutive pairs ``(0, 1)``, ``(2, 3)``, ... are the
matches actually played in that round. This module turns those raw arrays
into event counts/probabilities for arbitrary team pairings, including joint
events -- e.g. "how many times did we get Spain vs France AND England vs
Argentina in the same semifinal draw".
"""

from __future__ import annotations

import numpy as np
import pandas as pd


def _pair_occurred(stage_array: np.ndarray, idx_a: int, idx_b: int) -> np.ndarray:
    """Boolean mask over simulations: did idx_a play idx_b in ANY match of this
    stage."""
    n_sim, k = stage_array.shape
    occurred = np.zeros(n_sim, dtype=bool)
    for m in range(k // 2):
        c1, c2 = stage_array[:, 2 * m], stage_array[:, 2 * m + 1]
        occurred |= ((c1 == idx_a) & (c2 == idx_b)) | ((c1 == idx_b) & (c2 == idx_a))
    return occurred


def count_matchup_event(
    stage_array: np.ndarray,
    teams: list[str],
    matchups: list[tuple[str, str]],
) -> dict:
    """Count simulations where ALL given ``(team_a, team_b)`` pairs occurred
    as matches within the same stage.

    A single pair is a plain matchup count (e.g. "Spain vs France in the
    semifinal"). Several pairs count a joint/combined event -- all pairs must
    occur simultaneously in the same simulation (e.g. both semifinal
    pairings landing exactly as specified).

    ``teams`` must be the team list ordered exactly as the indices in
    ``stage_array`` (i.e. ``model.teams`` from the trained
    ``BayesianDixonColesModel``).

    Returns a dict with ``n_sim``, ``count``, ``probability_pct`` and
    ``missing_teams`` (non-empty, with count=0, if any team name isn't found).
    """
    team_to_idx = {t: i for i, t in enumerate(teams)}
    missing = sorted({t for pair in matchups for t in pair if t not in team_to_idx})
    n_sim = stage_array.shape[0]
    if missing:
        return {
            "n_sim": n_sim,
            "count": 0,
            "probability_pct": 0.0,
            "missing_teams": missing,
        }

    occurred = np.ones(n_sim, dtype=bool)
    for team_a, team_b in matchups:
        occurred &= _pair_occurred(
            stage_array, team_to_idx[team_a], team_to_idx[team_b]
        )
    count = int(occurred.sum())
    return {
        "n_sim": n_sim,
        "count": count,
        "probability_pct": count / n_sim * 100 if n_sim else 0.0,
        "missing_teams": [],
    }


def top_matchups_by_stage(
    stage_array: np.ndarray,
    teams: list[str],
    top_n: int = 3,
) -> pd.DataFrame:
    """Rank the JOINT combinations of matches played in a stage by how many
    simulations produced them, and return the ``top_n`` most frequent ones.

    When a stage has more than one simultaneous match (e.g. two semifinals,
    four quarterfinals), a "combination" is the full, unordered set of games
    played in that round within a single simulation. This reports the joint
    probability of getting ALL of those specific pairings together -- e.g.
    "Spain vs France AND England vs Argentina, both in the same semifinal
    draw" -- not just the marginal probability of any one pairing alone. For
    a stage with a single match (the final), a combination is just that one
    game, so this reduces to a plain matchup ranking.

    Returns a DataFrame with columns ``games`` (a "Team vs Team & Team vs
    Team" string, one segment per match in the stage), ``count`` and
    ``probability_pct``, sorted descending by count.
    """
    n_sim, k = stage_array.shape
    n_teams = len(teams)
    num_matches = k // 2

    c = stage_array.astype(np.int64).reshape(n_sim, num_matches, 2)
    lo = np.minimum(c[:, :, 0], c[:, :, 1])
    hi = np.maximum(c[:, :, 0], c[:, :, 1])
    game_keys = lo * n_teams + hi  # shape (n_sim, num_matches), one key per game
    # Canonicalize game order within each row so the *set* of games in a
    # simulation -- not the arbitrary slot they landed in -- defines the combo.
    game_keys.sort(axis=1)

    combos, counts = np.unique(game_keys, axis=0, return_counts=True)
    order = np.argsort(-counts)
    combos, counts = combos[order][:top_n], counts[order][:top_n]

    rows = []
    for combo, count in zip(combos, counts.tolist(), strict=True):
        games = " & ".join(
            f"{teams[key // n_teams]} vs {teams[key % n_teams]}"
            for key in combo.tolist()
        )
        rows.append(
            {
                "games": games,
                "count": int(count),
                "probability_pct": round(count / n_sim * 100, 4) if n_sim else 0.0,
            }
        )
    return pd.DataFrame(rows, columns=["games", "count", "probability_pct"])


def top_matchups_all_stages(
    stage_arrays: dict[str, np.ndarray],
    teams: list[str],
    top_n: int = 3,
    stages: list[str] | None = None,
) -> pd.DataFrame:
    """Top-``top_n`` most probable joint matchup combinations for each requested stage.

    ``stages`` defaults to every stage present in ``stage_arrays``, in the
    order given. Returns one tidy DataFrame with columns ``stage``, ``rank``,
    ``games``, ``count``, ``probability_pct`` -- see ``top_matchups_by_stage``
    for what a "games" combination means for stages with several
    simultaneous matches (everything before the final).
    """
    stages = stages if stages is not None else list(stage_arrays.keys())
    frames = []
    for stage in stages:
        if stage not in stage_arrays:
            raise KeyError(f"Unknown stage '{stage}'. Available: {list(stage_arrays)}")
        df = top_matchups_by_stage(stage_arrays[stage], teams, top_n=top_n)
        df.insert(0, "stage", stage)
        df.insert(1, "rank", range(1, len(df) + 1))
        frames.append(df)
    return (
        pd.concat(frames, ignore_index=True)
        if frames
        else pd.DataFrame(
            columns=["stage", "rank", "games", "count", "probability_pct"]
        )
    )


def analyze_events(
    stage_arrays: dict[str, np.ndarray],
    teams: list[str],
    events: list[dict],
) -> pd.DataFrame:
    """Run ``count_matchup_event`` for a list of ``{"stage", "matchups"}`` specs.

    ``events`` example::

        [
            {"stage": "semifinals", "matchups": [("Spain", "France")]},
            {"stage": "semifinals", "matchups": [("England", "Argentina")]},
            {
                "stage": "semifinals",
                "matchups": [("Spain", "France"), ("England", "Argentina")],
            },
        ]

    Returns a tidy DataFrame with one row per event, sorted by stage then by
    the order given.
    """
    rows = []
    for event in events:
        stage = event["stage"]
        matchups = event["matchups"]
        if stage not in stage_arrays:
            raise KeyError(f"Unknown stage '{stage}'. Available: {list(stage_arrays)}")
        result = count_matchup_event(stage_arrays[stage], teams, matchups)
        label = " & ".join(f"{a} vs {b}" for a, b in matchups)
        rows.append(
            {
                "stage": stage,
                "matchup": label,
                "n_sim": result["n_sim"],
                "count": result["count"],
                "probability_pct": round(result["probability_pct"], 4),
                "missing_teams": ", ".join(result["missing_teams"]) or None,
            }
        )
    return pd.DataFrame(rows)
