"""Unit tests for src.model.utils (score matrices, home-advantage helpers)."""

from __future__ import annotations

import numpy as np
import pytest
from scipy.stats import poisson

from src.model.utils import (
    effective_home_gamma,
    effective_home_gamma_vec,
    score_probability_matrix,
    score_probability_matrix_batched,
)


class TestEffectiveHomeGamma:
    def test_non_neutral_returns_home_effect_unchanged(self) -> None:
        assert effective_home_gamma(1.35, neutral=False, home_boost=0.0) == 1.35
        assert effective_home_gamma(1.35, neutral=False, home_boost=1.0) == 1.35

    def test_neutral_without_boost_is_one(self) -> None:
        assert effective_home_gamma(1.5, neutral=True, home_boost=0.0) == 1.0

    def test_neutral_with_full_boost_matches_home_effect(self) -> None:
        assert effective_home_gamma(1.5, neutral=True, home_boost=1.0) == pytest.approx(
            1.5
        )

    def test_neutral_with_partial_boost_interpolates(self) -> None:
        result = effective_home_gamma(1.4, neutral=True, home_boost=0.5)
        assert result == pytest.approx(1.0 + (1.4 - 1.0) * 0.5)


class TestEffectiveHomeGammaVec:
    def test_non_neutral_returns_array_unchanged(self) -> None:
        he = np.array([1.1, 1.2, 1.3])
        out = effective_home_gamma_vec(he, neutral=False, home_boost=0.0)
        np.testing.assert_array_equal(out, he)

    def test_neutral_without_boost_is_ones(self) -> None:
        he = np.array([1.1, 1.2, 1.3])
        out = effective_home_gamma_vec(he, neutral=True, home_boost=0.0)
        np.testing.assert_array_equal(out, np.ones(3))

    def test_neutral_with_boost_matches_scalar_version(self) -> None:
        he = np.array([1.1, 1.2, 1.3])
        out = effective_home_gamma_vec(he, neutral=True, home_boost=0.4)
        expected = np.array([effective_home_gamma(float(x), True, 0.4) for x in he])
        np.testing.assert_allclose(out, expected)


class TestScoreProbabilityMatrix:
    def test_shape_and_sums_to_one(self) -> None:
        prob = score_probability_matrix(1.2, 0.9, rho=-0.1, max_goals=5)
        assert prob.shape == (6, 6)
        assert prob.sum() == pytest.approx(1.0)

    def test_all_probabilities_non_negative(self) -> None:
        prob = score_probability_matrix(1.5, 1.3, rho=0.15, max_goals=5)
        assert np.all(prob >= 0)

    def test_zero_rho_matches_independent_poisson_product(self) -> None:
        hl, al, max_goals = 1.4, 0.8, 5
        prob = score_probability_matrix(hl, al, rho=0.0, max_goals=max_goals)
        goals = np.arange(max_goals + 1)
        expected = np.outer(poisson.pmf(goals, hl), poisson.pmf(goals, al))
        expected /= expected.sum()
        np.testing.assert_allclose(prob, expected)

    def test_rho_only_perturbs_low_score_cells(self) -> None:
        hl, al, max_goals = 1.4, 0.8, 5
        base = score_probability_matrix(hl, al, rho=0.0, max_goals=max_goals)
        adjusted = score_probability_matrix(hl, al, rho=0.2, max_goals=max_goals)
        low_score_mask = np.zeros_like(base, dtype=bool)
        low_score_mask[:2, :2] = True
        np.testing.assert_allclose(base[~low_score_mask], adjusted[~low_score_mask])
        assert not np.allclose(base[low_score_mask], adjusted[low_score_mask])


class TestScoreProbabilityMatrixBatched:
    def test_matches_single_computation_for_one_row(self) -> None:
        hl = np.array([1.2])
        al = np.array([0.9])
        rho = np.array([-0.1])
        batched = score_probability_matrix_batched(hl, al, rho, max_goals=5)
        single = score_probability_matrix(1.2, 0.9, rho=-0.1, max_goals=5)
        assert batched.shape == (1, 6, 6)
        np.testing.assert_allclose(batched[0], single)

    def test_multiple_rows_each_sum_to_one(self) -> None:
        hl = np.array([1.2, 0.7, 2.1])
        al = np.array([0.9, 1.5, 0.6])
        rho = np.array([-0.1, 0.05, 0.0])
        batched = score_probability_matrix_batched(hl, al, rho, max_goals=5)
        assert batched.shape == (3, 6, 6)
        np.testing.assert_allclose(batched.sum(axis=(1, 2)), np.ones(3))

    def test_scalar_rho_broadcasts_to_all_rows(self) -> None:
        hl = np.array([1.2, 0.7])
        al = np.array([0.9, 1.5])
        batched = score_probability_matrix_batched(hl, al, np.array(0.1), max_goals=5)
        assert batched.shape == (2, 6, 6)

    def test_mismatched_hl_al_shapes_raise(self) -> None:
        with pytest.raises(ValueError):
            score_probability_matrix_batched(
                np.array([1.0, 2.0]), np.array([1.0]), np.array(0.0)
            )

    def test_mismatched_rho_shape_raises(self) -> None:
        with pytest.raises(ValueError):
            score_probability_matrix_batched(
                np.array([1.0, 2.0]), np.array([1.0, 1.5]), np.array([0.1, 0.2, 0.3])
            )
