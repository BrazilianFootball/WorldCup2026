"""Unit tests for src.analysis.matchup_events.

These use hand-built stage arrays instead of a trained Stan model, so they
run without cmdstanpy / any data files -- they only check the counting logic
(pairing convention, joint events, missing teams).
"""

from __future__ import annotations

import numpy as np

from src.analysis.matchup_events import (
    analyze_events,
    count_matchup_event,
    top_matchups_all_stages,
    top_matchups_by_stage,
)

TEAMS = ["Spain", "France", "England", "Argentina", "Brazil", "Germany"]
IDX = {t: i for i, t in enumerate(TEAMS)}


def _sf_array(rows: list[tuple[str, str, str, str]]) -> np.ndarray:
    """Build a semifinals-shaped array (n_sim, 4) from (m1a, m1b, m2a, m2b) rows."""
    return np.array([[IDX[t] for t in row] for row in rows])


def test_single_matchup_counts_either_order_either_slot():
    sf = _sf_array(
        [
            ("Spain", "France", "England", "Argentina"),  # match1: SP-FR, match2: EN-AR
            ("France", "Spain", "Brazil", "Germany"),  # match1: FR-SP (reversed order)
            ("England", "Argentina", "Spain", "France"),  # SP-FR now in match2 slot
            ("Brazil", "Germany", "England", "Argentina"),  # no SP-FR at all
        ]
    )
    result = count_matchup_event(sf, TEAMS, [("Spain", "France")])
    assert result["n_sim"] == 4
    assert result["count"] == 3
    assert abs(result["probability_pct"] - 75.0) < 1e-9
    assert result["missing_teams"] == []


def test_joint_event_requires_all_pairs_in_same_simulation():
    sf = _sf_array(
        [
            ("Spain", "France", "England", "Argentina"),  # both pairings present
            ("Spain", "France", "Brazil", "Germany"),  # only SP-FR
            ("Brazil", "Germany", "England", "Argentina"),  # only EN-AR
            ("England", "Argentina", "Spain", "France"),  # both pairings, swapped slots
        ]
    )
    joint = count_matchup_event(
        sf, TEAMS, [("Spain", "France"), ("England", "Argentina")]
    )
    assert joint["count"] == 2  # rows 0 and 3

    sp_fr_only = count_matchup_event(sf, TEAMS, [("Spain", "France")])
    assert sp_fr_only["count"] == 3  # rows 0, 1, 3


def test_final_stage_single_match_pair():
    fin = np.array(
        [
            [IDX["Spain"], IDX["Argentina"]],
            [IDX["France"], IDX["England"]],
            [IDX["Spain"], IDX["Argentina"]],
        ]
    )
    result = count_matchup_event(fin, TEAMS, [("Spain", "Argentina")])
    assert result["count"] == 2
    assert result["n_sim"] == 3


def test_missing_team_returns_zero_and_lists_missing():
    sf = _sf_array(
        [("Spain", "France", "England", "Argentina")] * 5,
    )
    result = count_matchup_event(sf, TEAMS, [("Spain", "Portugal")])
    assert result["count"] == 0
    assert result["probability_pct"] == 0.0
    assert result["missing_teams"] == ["Portugal"]


def test_analyze_events_builds_tidy_dataframe():
    sf = _sf_array(
        [
            ("Spain", "France", "England", "Argentina"),
            ("Spain", "France", "Brazil", "Germany"),
        ]
    )
    fin = np.array([[IDX["Spain"], IDX["Argentina"]], [IDX["France"], IDX["England"]]])
    stage_arrays = {"semifinals": sf, "final": fin}
    events = [
        {"stage": "semifinals", "matchups": [("Spain", "France")]},
        {"stage": "semifinals", "matchups": [("England", "Argentina")]},
        {
            "stage": "semifinals",
            "matchups": [("Spain", "France"), ("England", "Argentina")],
        },
        {"stage": "final", "matchups": [("Spain", "Argentina")]},
    ]
    df = analyze_events(stage_arrays, TEAMS, events)
    assert list(df["count"]) == [2, 1, 1, 1]
    assert df.loc[df["stage"] == "final", "n_sim"].iloc[0] == 2


def test_top_matchups_by_stage_ranks_joint_semifinal_combos():
    # 11 simulations, each with two semifinal matches (slot1, slot2). What
    # matters for the semifinal phase is the pair of games *together*, not
    # each pairing on its own -- e.g. "Spain vs France" alone isn't a full
    # semifinal draw, "Spain vs France & England vs Argentina" is.
    rows = (
        [("Spain", "France", "England", "Argentina")] * 5  # combo A
        + [("Spain", "France", "Brazil", "Germany")] * 3  # combo B
        + [("England", "Argentina", "Brazil", "Germany")] * 2  # combo C, slots swapped
        + [("Spain", "England", "France", "Argentina")] * 1  # combo D
    )
    sf = _sf_array(rows)
    assert sf.shape == (11, 4)

    df = top_matchups_by_stage(sf, TEAMS, top_n=3)
    assert len(df) == 3
    assert list(df["games"]) == [
        "Spain vs France & England vs Argentina",
        "Spain vs France & Brazil vs Germany",
        "England vs Argentina & Brazil vs Germany",
    ]
    assert list(df["count"]) == [5, 3, 2]
    assert abs(df["probability_pct"].iloc[0] - round(5 / 11 * 100, 4)) < 1e-9


def test_top_matchups_by_stage_ignores_slot_order():
    # Same joint combo (Spain-France & England-Argentina), but which pair
    # lands in slot 1 vs slot 2 differs across simulations -- should still
    # be counted as the same combination.
    sf = _sf_array(
        [
            ("Spain", "France", "England", "Argentina"),
            ("England", "Argentina", "Spain", "France"),
            ("France", "Spain", "Argentina", "England"),
        ]
    )
    df = top_matchups_by_stage(sf, TEAMS, top_n=1)
    assert len(df) == 1
    assert df.loc[0, "games"] == "Spain vs France & England vs Argentina"
    assert df.loc[0, "count"] == 3


def test_top_matchups_all_stages_combines_stages():
    sf = _sf_array(
        [
            ("Spain", "France", "England", "Argentina"),
            ("Spain", "France", "England", "Argentina"),
            ("Brazil", "Germany", "England", "Argentina"),
        ]
    )
    fin = np.array(
        [
            [IDX["Spain"], IDX["Argentina"]],
            [IDX["Spain"], IDX["Argentina"]],
            [IDX["France"], IDX["England"]],
        ]
    )
    stage_arrays = {"semifinals": sf, "final": fin}

    df = top_matchups_all_stages(stage_arrays, TEAMS, top_n=2)
    assert set(df["stage"]) == {"semifinals", "final"}

    sf_rows = df[df["stage"] == "semifinals"].reset_index(drop=True)
    assert list(sf_rows["rank"]) == [1, 2]
    assert sf_rows.loc[0, "games"] == "Spain vs France & England vs Argentina"
    assert sf_rows.loc[0, "count"] == 2
    assert sf_rows.loc[1, "games"] == "England vs Argentina & Brazil vs Germany"
    assert sf_rows.loc[1, "count"] == 1

    final_rows = df[df["stage"] == "final"].reset_index(drop=True)
    assert final_rows.loc[0, "games"] == "Spain vs Argentina"
    assert final_rows.loc[0, "count"] == 2
