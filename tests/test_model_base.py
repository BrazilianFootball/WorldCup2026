"""Unit tests for src.model.base (shared match-level API for Dixon-Coles models)."""

from __future__ import annotations

import numpy as np
import pytest

from src.model.params import TournamentModelParams


def make_params() -> TournamentModelParams:
    return TournamentModelParams(
        teams=["Brazil", "Argentina"],
        attack=np.array([1.5, 1.2]),
        defense=np.array([0.8, 0.9]),
        rho=-0.1,
        home_effect=1.3,
    )


class TestMatchProbs:
    def test_returns_square_matrix_summing_to_one(self) -> None:
        params = make_params()
        prob = params.match_probs("Brazil", "Argentina", max_goals=5)
        assert prob.shape == (6, 6)
        assert prob.sum() == pytest.approx(1.0)

    def test_non_neutral_uses_full_home_effect(self) -> None:
        params = make_params()
        neutral = params.match_probs(
            "Brazil", "Argentina", neutral=True, home_boost=0.0
        )
        home = params.match_probs("Brazil", "Argentina", neutral=False)
        assert not np.allclose(neutral, home)

    def test_lambda_scale_shrinks_expected_goals(self) -> None:
        params = make_params()
        full = params.match_probs("Brazil", "Argentina", lambda_scale=1.0)
        scaled = params.match_probs("Brazil", "Argentina", lambda_scale=0.5)
        assert not np.allclose(full, scaled)
        assert scaled.sum() == pytest.approx(1.0)


class TestSimulateMatch:
    def test_reproducible_with_seeded_rng(self) -> None:
        params = make_params()
        first = params.simulate_match(
            "Brazil", "Argentina", rng=np.random.default_rng(7)
        )
        second = params.simulate_match(
            "Brazil", "Argentina", rng=np.random.default_rng(7)
        )
        assert first == second

    def test_result_within_valid_goal_range(self) -> None:
        params = make_params()
        rng = np.random.default_rng(0)
        for _ in range(20):
            home_goals, away_goals = params.simulate_match(
                "Brazil", "Argentina", rng=rng
            )
            assert home_goals >= 0
            assert away_goals >= 0


class TestWinDrawLoss:
    def test_probabilities_sum_to_one(self) -> None:
        params = make_params()
        home_win, draw, away_win = params.win_draw_loss("Brazil", "Argentina")
        assert home_win + draw + away_win == pytest.approx(1.0)

    def test_matches_manual_triangle_sums(self) -> None:
        params = make_params()
        prob = params.match_probs("Brazil", "Argentina")
        home_win, draw, away_win = params.win_draw_loss("Brazil", "Argentina")
        assert home_win == pytest.approx(float(np.tril(prob, k=-1).sum()))
        assert draw == pytest.approx(float(np.trace(prob)))
        assert away_win == pytest.approx(float(np.triu(prob, k=1).sum()))

    def test_stronger_attacker_favored_at_equal_defense(self) -> None:
        params = TournamentModelParams(
            teams=["Strong", "Weak"],
            attack=np.array([2.0, 0.5]),
            defense=np.array([1.0, 1.0]),
            rho=0.0,
            home_effect=1.0,
        )
        home_win, _, away_win = params.win_draw_loss("Strong", "Weak")
        assert home_win > away_win


class TestGetStrength:
    def test_is_attack_over_defense_ratio(self) -> None:
        params = make_params()
        assert params.get_strength("Brazil") == pytest.approx(1.5 / 0.8)
        assert params.get_strength("Argentina") == pytest.approx(1.2 / 0.9)
