"""Unit tests for src.model.params (fitted-parameter snapshots for simulation)."""

from __future__ import annotations

import numpy as np
import pytest

from src.model.params import TournamentModelParams, TournamentParamsSeries


def make_fixed(teams: list[str] | None = None) -> TournamentModelParams:
    teams = teams or ["Brazil", "Argentina", "France"]
    return TournamentModelParams(
        teams=teams,
        attack=np.array([1.5, 1.3, 1.4]),
        defense=np.array([0.8, 0.9, 0.85]),
        rho=-0.1,
        home_effect=1.3,
    )


class TestTournamentModelParams:
    def test_accessors_return_values_by_team_name(self) -> None:
        params = make_fixed()
        assert params.get_attack("Brazil") == pytest.approx(1.5)
        assert params.get_defense("Argentina") == pytest.approx(0.9)
        assert params.get_rho() == pytest.approx(-0.1)
        assert params.get_home_effect() == pytest.approx(1.3)

    def test_get_strength_is_attack_over_defense(self) -> None:
        params = make_fixed()
        assert params.get_strength("Brazil") == pytest.approx(1.5 / 0.8)

    def test_match_probs_is_a_valid_probability_matrix(self) -> None:
        params = make_fixed()
        prob = params.match_probs("Brazil", "France")
        assert prob.sum() == pytest.approx(1.0)
        assert np.all(prob >= 0)

    def test_unknown_team_raises_key_error(self) -> None:
        params = make_fixed()
        with pytest.raises(KeyError):
            params.get_attack("Germany")


class TestTournamentParamsSeries:
    def test_scalar_rho_and_home_effect_broadcast_to_all_rows(self) -> None:
        series = TournamentParamsSeries(
            team_order=["Brazil", "Argentina"],
            attack=np.ones((4, 2)),
            defense=np.ones((4, 2)),
            rho=0.1,
            home_effect=1.2,
        )
        assert series.n_replications == 4
        np.testing.assert_array_equal(series.rho, np.full(4, 0.1))
        np.testing.assert_array_equal(series.home_effect, np.full(4, 1.2))

    def test_per_row_rho_and_home_effect_kept_as_is(self) -> None:
        rho = np.array([0.1, 0.2, 0.3])
        series = TournamentParamsSeries(
            team_order=["Brazil", "Argentina"],
            attack=np.ones((3, 2)),
            defense=np.ones((3, 2)),
            rho=rho,
        )
        np.testing.assert_array_equal(series.rho, rho)

    def test_mismatched_attack_defense_shape_raises(self) -> None:
        with pytest.raises(ValueError):
            TournamentParamsSeries(
                team_order=["Brazil", "Argentina"],
                attack=np.ones((3, 2)),
                defense=np.ones((3, 3)),
            )

    def test_attack_columns_must_match_team_order_length(self) -> None:
        with pytest.raises(ValueError):
            TournamentParamsSeries(
                team_order=["Brazil", "Argentina", "France"],
                attack=np.ones((3, 2)),
                defense=np.ones((3, 2)),
            )

    def test_wrong_length_rho_array_raises(self) -> None:
        with pytest.raises(ValueError):
            TournamentParamsSeries(
                team_order=["Brazil", "Argentina"],
                attack=np.ones((3, 2)),
                defense=np.ones((3, 2)),
                rho=np.array([0.1, 0.2]),
            )

    def test_match_probs_for_a_row_is_a_valid_probability_matrix(self) -> None:
        series = TournamentParamsSeries(
            team_order=["Brazil", "Argentina"],
            attack=np.array([[1.5, 1.2], [1.1, 1.3]]),
            defense=np.array([[0.8, 0.9], [0.85, 0.95]]),
            rho=np.array([-0.1, 0.0]),
            home_effect=np.array([1.3, 1.1]),
        )
        prob = series.match_probs(row=1, home="Argentina", away="Brazil")
        assert prob.sum() == pytest.approx(1.0)

    def test_simulate_match_is_reproducible_with_seeded_rng(self) -> None:
        series = TournamentParamsSeries(
            team_order=["Brazil", "Argentina"],
            attack=np.array([[1.5, 1.2]]),
            defense=np.array([[0.8, 0.9]]),
        )
        result_a = series.simulate_match(
            0, "Brazil", "Argentina", rng=np.random.default_rng(42)
        )
        result_b = series.simulate_match(
            0, "Brazil", "Argentina", rng=np.random.default_rng(42)
        )
        assert result_a == result_b

    def test_repeat_fixed_tiles_snapshot_across_rows(self) -> None:
        fixed = make_fixed(["Brazil", "Argentina"])
        fixed.attack = np.array([1.5, 1.2])
        fixed.defense = np.array([0.8, 0.9])
        series = TournamentParamsSeries.repeat_fixed(
            fixed, team_order=["Argentina", "Brazil"], n_rows=3
        )
        assert series.n_replications == 3
        for row in range(3):
            np.testing.assert_array_equal(series.attack[row], [1.2, 1.5])
            np.testing.assert_array_equal(series.defense[row], [0.9, 0.8])
        np.testing.assert_array_equal(series.rho, np.full(3, fixed.rho))
        np.testing.assert_array_equal(series.home_effect, np.full(3, fixed.home_effect))

    def test_repeat_fixed_rejects_non_positive_n_rows(self) -> None:
        fixed = make_fixed()
        with pytest.raises(ValueError):
            TournamentParamsSeries.repeat_fixed(fixed, fixed.teams, n_rows=0)
