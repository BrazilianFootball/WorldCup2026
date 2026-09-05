"""Unit tests for src.tournament.frequentist (World Cup 2026 MLE simulation)."""

from __future__ import annotations

import numpy as np
import pytest

from src.constants import (
    GROUPS,
    QUARTERFINAL_PAIRS,
    ROUND_OF_16_PAIRS,
    ROUND_OF_32_FIXED,
    SEMIFINAL_PAIRS,
)
from src.model.params import TournamentModelParams, TournamentParamsSeries
from src.tournament.frequentist import WorldCup2026

ALL_TEAMS = [team for group in GROUPS.values() for team in group]


def make_uniform_params(
    home_effect: float = 1.0, rho: float = 0.0
) -> TournamentModelParams:
    """Every team equally strong, so no bracket path is a priori impossible."""
    n = len(ALL_TEAMS)
    return TournamentModelParams(
        teams=list(ALL_TEAMS),
        attack=np.ones(n),
        defense=np.ones(n),
        rho=rho,
        home_effect=home_effect,
    )


class TestMatchThirds:
    def test_assigns_each_qualified_group_to_a_valid_slot(self) -> None:
        slots = [(0, "3_AB"), (1, "3_BC")]
        assignment = WorldCup2026._match_thirds(slots, {"A", "B", "C"})
        assert set(assignment.values()) <= {"A", "B", "C"}
        assert len(set(assignment.values())) == len(assignment)

    def test_prefers_slots_with_fewer_candidates_first(self) -> None:
        # Slot 0 can only take "A"; slot 1 could take "A" or "B". A correct
        # backtracking assignment must give "A" to slot 0 and "B" to slot 1.
        slots = [(0, "3_A"), (1, "3_AB")]
        assignment = WorldCup2026._match_thirds(slots, {"A", "B"})
        assert assignment == {0: "A", 1: "B"}

    def test_raises_when_no_valid_assignment_exists(self) -> None:
        slots = [(0, "3_A"), (1, "3_A")]
        with pytest.raises(RuntimeError):
            WorldCup2026._match_thirds(slots, {"A"})


class TestResolveSimpleSlot:
    def test_winner_slot(self) -> None:
        winners = {"A": "Brazil"}
        assert WorldCup2026._resolve_simple_slot("1A", winners, {}) == "Brazil"

    def test_runner_up_slot(self) -> None:
        runners = {"A": "Argentina"}
        assert WorldCup2026._resolve_simple_slot("2A", {}, runners) == "Argentina"

    def test_unknown_slot_format_raises(self) -> None:
        with pytest.raises(ValueError):
            WorldCup2026._resolve_simple_slot("9A", {}, {})


class TestWorldCup2026Construction:
    def test_all_teams_matches_flattened_groups(self) -> None:
        wc = WorldCup2026(make_uniform_params())
        assert wc.all_teams == ALL_TEAMS

    def test_series_params_team_order_must_match_all_teams(self) -> None:
        series = TournamentParamsSeries(
            team_order=list(reversed(ALL_TEAMS)),
            attack=np.ones((2, len(ALL_TEAMS))),
            defense=np.ones((2, len(ALL_TEAMS))),
        )
        with pytest.raises(ValueError):
            WorldCup2026(series)

    def test_params_property_raises_in_series_mode(self) -> None:
        series = TournamentParamsSeries(
            team_order=list(ALL_TEAMS),
            attack=np.ones((2, len(ALL_TEAMS))),
            defense=np.ones((2, len(ALL_TEAMS))),
        )
        wc = WorldCup2026(series)
        with pytest.raises(TypeError):
            _ = wc.params


class TestSimulateOnce:
    def test_bracket_progression_counts_match_ko_structure(self) -> None:
        wc = WorldCup2026(make_uniform_params(), seed=1)
        result = wc.simulate_once()

        assert set(result.keys()) == set(ALL_TEAMS)
        stages = list(result.values())
        # Each knockout round halves the field: SEMIFINAL_PAIRS produces the
        # finalists, QUARTERFINAL_PAIRS the semifinalists, and so on back up
        # to the 32 teams that enter the round of 32 (2 per match).
        assert stages.count(6) == 1
        assert sum(v >= 5 for v in stages) == len(SEMIFINAL_PAIRS)
        assert sum(v >= 4 for v in stages) == len(QUARTERFINAL_PAIRS)
        assert sum(v >= 3 for v in stages) == len(ROUND_OF_16_PAIRS)
        assert sum(v >= 2 for v in stages) == len(ROUND_OF_32_FIXED)
        assert sum(v >= 1 for v in stages) == 2 * len(ROUND_OF_32_FIXED)

    def test_known_results_are_used_instead_of_simulated(self) -> None:
        home, away = GROUPS["A"][0], GROUPS["A"][1]
        wc = WorldCup2026(
            make_uniform_params(),
            seed=2,
            known_results={(home, away): (4, 0)},
        )
        assert wc._simulate_group_match(home, away) == (4, 0)


class TestSimulateMonteCarlo:
    def test_accumulated_counts_are_internally_consistent(self) -> None:
        n = 50
        wc = WorldCup2026(make_uniform_params(), seed=3)
        result = wc.simulate(n)

        assert result.counts == n
        assert sum(result.champion.values()) == n
        assert sum(result.final.values()) == n * len(SEMIFINAL_PAIRS)
        assert sum(result.first_place.values()) == n * len(GROUPS)
        assert all(v == n for v in result.group_stage.values())
