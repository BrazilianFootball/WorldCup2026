"""Unit tests for the provisional 2027 Women's World Cup scaffold.

These check the placeholder config is well-formed and that reusing
simulate_world_cup_2022 for a new competition actually works end to end --
not that the (uniform-strength) probabilities are realistic, since they
aren't meant to be yet (see src/simulations/sim_wwc2027.py's docstring).
"""

from __future__ import annotations

import numpy as np
import pytest

from src.constants import GROUPS_WWC2027_PLACEHOLDER
from src.simulations.sim_wwc2027 import (
    run_uniform_strength_scaffold,
    uniform_posterior_draws,
)


class TestGroupsWwc2027Placeholder:
    def test_has_eight_groups_of_four(self) -> None:
        assert len(GROUPS_WWC2027_PLACEHOLDER) == 8
        assert all(len(teams) == 4 for teams in GROUPS_WWC2027_PLACEHOLDER.values())

    def test_all_32_teams_are_unique(self) -> None:
        teams = [t for ts in GROUPS_WWC2027_PLACEHOLDER.values() for t in ts]
        assert len(teams) == 32
        assert len(set(teams)) == 32


class TestUniformPosteriorDraws:
    def test_shapes_and_no_dixon_coles_rho(self) -> None:
        draws = uniform_posterior_draws(n_teams=32)

        assert draws["attack"].shape[1] == 32
        assert draws["defense"].shape[1] == 32
        assert draws["attack"].shape[0] == draws["defense"].shape[0]
        assert len(draws["eta"]) == draws["attack"].shape[0]
        assert "rho" not in draws


class TestRunUniformStrengthScaffold:
    def test_every_team_gets_a_probability_for_every_stage(self) -> None:
        teams = [t for ts in GROUPS_WWC2027_PLACEHOLDER.values() for t in ts]

        probs = run_uniform_strength_scaffold(n_sim=500)

        expected_stages = {
            "avancou_grupos",
            "quarter_finalists",
            "semi_finalists",
            "finalists",
            "champion",
        }
        assert set(probs.keys()) == expected_stages
        for stage_probs in probs.values():
            assert len(stage_probs) == len(teams)
            assert np.all(stage_probs >= 0) and np.all(stage_probs <= 1)

    def test_champion_probabilities_sum_to_one(self) -> None:
        probs = run_uniform_strength_scaffold(n_sim=500)

        assert probs["champion"].sum() == pytest.approx(1.0)

    def test_works_with_a_smaller_custom_group_config(self) -> None:
        # Confirms the reuse isn't hardcoded to the 32-team placeholder --
        # any 8-groups-of-4 config works, same as the real competitions
        # simulate_world_cup_2022 already backtests.
        groups = {letter: [f"{letter}{i}" for i in range(4)] for letter in "ABCDEFGH"}

        probs = run_uniform_strength_scaffold(groups=groups, n_sim=300)

        teams = [t for ts in groups.values() for t in ts]
        assert set(range(len(teams))) == set(range(len(probs["champion"])))
        assert probs["champion"].sum() == pytest.approx(1.0)
