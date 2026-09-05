"""Unit tests for WorldCup2026's competition-config parameterization.

WorldCup2026 defaults to the real FIFA World Cup 2026 groups/bracket (from
src.constants), but groups, host teams/boost, bracket pairs, and max_goals
can now be overridden via the constructor so the same 48-team/12-group/
32-team-knockout *shape* can be reused for a differently-drawn competition
that still fits that shape.
"""

from __future__ import annotations

import numpy as np

from src.constants import GROUPS, HOST_TEAMS, ROUND_OF_32_FIXED
from src.model.params import TournamentModelParams
from src.tournament.frequentist import WorldCup2026

GROUP_LETTERS = list(GROUPS.keys())  # "A".."L" -- reused as-is by ROUND_OF_32_FIXED,
# which addresses slots by group letter, not by team name.


def make_params(teams: list[str]) -> TournamentModelParams:
    n = len(teams)
    return TournamentModelParams(
        teams=teams,
        attack=np.linspace(0.8, 1.8, n),
        defense=np.linspace(0.7, 1.3, n),
        rho=-0.05,
        home_effect=1.2,
    )


def make_synthetic_groups() -> dict[str, list[str]]:
    """A same-shape (12 x 4) competition with entirely different teams."""
    return {letter: [f"{letter}Team{i}" for i in range(4)] for letter in GROUP_LETTERS}


class TestDefaultsMatchRealWorldCup2026:
    def test_defaults_to_the_real_groups_and_bracket(self) -> None:
        teams = [t for g in GROUPS.values() for t in g]
        wc = WorldCup2026(make_params(teams))

        assert list(wc.groups.keys()) == GROUP_LETTERS
        assert wc._round_of_32_fixed == ROUND_OF_32_FIXED
        expected_host_count = sum(1 for t in HOST_TEAMS if t in teams)
        assert len(wc._host_indices) == expected_host_count


class TestCustomGroups:
    def test_custom_groups_replace_the_default_teams(self) -> None:
        synthetic_groups = make_synthetic_groups()
        synthetic_teams = [t for g in synthetic_groups.values() for t in g]
        wc = WorldCup2026(make_params(synthetic_teams), groups=synthetic_groups)

        assert wc.all_teams == synthetic_teams
        assert "Brazil" not in wc.all_teams

    def test_full_bracket_simulation_still_holds_with_custom_groups(self) -> None:
        synthetic_groups = make_synthetic_groups()
        synthetic_teams = [t for g in synthetic_groups.values() for t in g]
        wc = WorldCup2026(make_params(synthetic_teams), groups=synthetic_groups, seed=1)

        result = wc.simulate_once()

        assert set(result.keys()) == set(synthetic_teams)
        stages = list(result.values())
        assert stages.count(6) == 1
        assert sum(v >= 2 for v in stages) == len(ROUND_OF_32_FIXED)
        assert sum(v >= 1 for v in stages) == 2 * len(ROUND_OF_32_FIXED)


class TestCustomHostTeams:
    def test_no_host_teams_means_no_host_indices(self) -> None:
        teams = [t for g in GROUPS.values() for t in g]
        wc = WorldCup2026(make_params(teams), host_teams=set())

        assert wc._host_indices == set()

    def test_custom_host_team_is_resolved_to_its_index(self) -> None:
        synthetic_groups = make_synthetic_groups()
        synthetic_teams = [t for g in synthetic_groups.values() for t in g]
        chosen_host = synthetic_teams[0]
        wc = WorldCup2026(
            make_params(synthetic_teams),
            groups=synthetic_groups,
            host_teams={chosen_host},
        )

        assert wc._host_indices == {wc._team_idx[chosen_host]}


class TestCustomBracketPairs:
    def test_overridden_pairs_are_stored_and_used_instead_of_defaults(self) -> None:
        # Same shape as the real bracket (8/4/2 pairs), each pair reversed,
        # to prove these are actually read from the instance, not the
        # module-level defaults, while still producing a valid bracket.
        teams = [t for g in GROUPS.values() for t in g]
        custom_r16 = [
            (1, 0),
            (3, 2),
            (5, 4),
            (7, 6),
            (11, 10),
            (9, 8),
            (15, 13),
            (14, 12),
        ]
        custom_qf = [(1, 0), (5, 4), (3, 2), (7, 6)]
        custom_sf = [(1, 0), (3, 2)]

        wc = WorldCup2026(
            make_params(teams),
            round_of_16_pairs=custom_r16,
            quarterfinal_pairs=custom_qf,
            semifinal_pairs=custom_sf,
            seed=2,
        )

        assert wc._round_of_16_pairs == custom_r16
        assert wc._quarterfinal_pairs == custom_qf
        assert wc._semifinal_pairs == custom_sf

        # The simulator must actually read the overridden pairs, not just
        # store them -- a full run should still produce a valid bracket.
        result = wc.simulate_once()
        assert list(result.values()).count(6) == 1


class TestCustomMaxGoals:
    def test_max_goals_changes_the_precomputed_matrix_size(self) -> None:
        teams = [t for g in GROUPS.values() for t in g]
        wc = WorldCup2026(make_params(teams), max_goals=3)

        assert wc._mg == 4
        assert wc._flat_probs.shape[-1] == 16  # (max_goals + 1) ** 2

    def test_match_probs_matrix_has_the_requested_shape(self) -> None:
        teams = [t for g in GROUPS.values() for t in g]
        wc = WorldCup2026(make_params(teams), max_goals=3)

        prob = wc.params.match_probs(teams[0], teams[1], max_goals=3)
        assert prob.shape == (4, 4)
