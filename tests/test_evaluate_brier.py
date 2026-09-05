"""Unit tests for src.model_sel.evaluate.evaluate_brier.

Exercises the helper shared by evaluate_2018.py/evaluate_2022.py end-to-end
(data prep, Brier scoring, CSV + plot export) using synthetic posterior
draws and a small synthetic answer key instead of real Stan models.
"""

from __future__ import annotations

from itertools import combinations

import numpy as np
import pandas as pd
import pytest

from src.model_sel.evaluate import evaluate_brier

TEAMS = ["Alpha", "Bravo", "Charlie", "Delta"]


def _write_results_csv(csv_path) -> None:
    """Enough round-robin matches per team to clear prepare_cycle_data's filters."""
    rows = []
    rng = np.random.default_rng(0)
    for _ in range(6):  # repeat the round-robin to get well above min_matches=20
        for home, away in combinations(TEAMS, 2):
            rows.append(
                {
                    "home_team": home,
                    "away_team": away,
                    "home_score": int(rng.integers(0, 4)),
                    "away_score": int(rng.integers(0, 4)),
                    "date": "2020-06-01",
                    "tournament": "Friendly",
                }
            )
    pd.DataFrame(rows).to_csv(csv_path, index=False)


def _write_draws_npz(npz_path, n_teams: int, seed: int) -> None:
    rng = np.random.default_rng(seed)
    np.savez(
        npz_path,
        attack=rng.normal(size=(30, n_teams)),
        defense=rng.normal(size=(30, n_teams)),
        eta=rng.normal(size=(30,)),
    )


def _write_answer_key(csv_path) -> None:
    pd.DataFrame(
        [
            {
                "home_team": "Alpha",
                "away_team": "Bravo",
                "home_score": 2,
                "away_score": 1,
            },
            {
                "home_team": "Charlie",
                "away_team": "Delta",
                "home_score": 0,
                "away_score": 0,
            },
        ]
    ).to_csv(csv_path, index=False)


class TestEvaluateBrier:
    def test_ranks_models_and_writes_outputs(self, tmp_path) -> None:
        results_csv = tmp_path / "results.csv"
        _write_results_csv(results_csv)

        models_dir = tmp_path / "models"
        models_dir.mkdir()
        _write_draws_npz(models_dir / "draws_2018_model_a.npz", len(TEAMS), seed=1)
        _write_draws_npz(models_dir / "draws_2018_model_b.npz", len(TEAMS), seed=2)
        # A different year's model must not be picked up.
        _write_draws_npz(models_dir / "draws_2022_model_c.npz", len(TEAMS), seed=3)

        answer_key = tmp_path / "jogos_2018.csv"
        _write_answer_key(answer_key)

        output_dir = tmp_path / "results_out"

        df = evaluate_brier(
            year=2018,
            cutoff_start="2019-01-01",
            cutoff_end="2021-01-01",
            results_file=str(answer_key),
            csv_path=str(results_csv),
            models_dir=str(models_dir),
            output_dir=str(output_dir),
        )

        assert df is not None
        assert set(df["Modelo"]) == {"Model A", "Model B"}
        assert list(df["Brier Mediana"]) == sorted(df["Brier Mediana"])

        assert (output_dir / "brier_score_2018.csv").exists()
        assert (output_dir / "comparacao_brier_2018.png").exists()

    def test_returns_none_when_models_dir_missing(self, tmp_path) -> None:
        results_csv = tmp_path / "results.csv"
        _write_results_csv(results_csv)

        df = evaluate_brier(
            year=2018,
            cutoff_start="2019-01-01",
            cutoff_end="2021-01-01",
            results_file=str(tmp_path / "jogos_2018.csv"),
            csv_path=str(results_csv),
            models_dir=str(tmp_path / "no_such_dir"),
            output_dir=str(tmp_path / "results_out"),
        )

        assert df is None

    def test_returns_none_when_no_models_for_year(self, tmp_path) -> None:
        results_csv = tmp_path / "results.csv"
        _write_results_csv(results_csv)

        models_dir = tmp_path / "models"
        models_dir.mkdir()
        _write_draws_npz(models_dir / "draws_2022_model_a.npz", len(TEAMS), seed=1)

        df = evaluate_brier(
            year=2018,
            cutoff_start="2019-01-01",
            cutoff_end="2021-01-01",
            results_file=str(tmp_path / "jogos_2018.csv"),
            csv_path=str(results_csv),
            models_dir=str(models_dir),
            output_dir=str(tmp_path / "results_out"),
        )

        assert df is None

    def test_default_results_file_is_named_after_the_year(self, tmp_path) -> None:
        # No results_file given, and no team here overlaps with the real
        # answer-key files in the repo, so every match is skipped and the
        # Brier score stays at its zero-matches default -- this only proves
        # evaluate_brier composed and successfully read "data/raw/jogos_2018.csv"
        # without raising, matching the original scripts' implicit default.
        results_csv = tmp_path / "results.csv"
        _write_results_csv(results_csv)

        models_dir = tmp_path / "models"
        models_dir.mkdir()
        _write_draws_npz(models_dir / "draws_2018_model_a.npz", len(TEAMS), seed=1)

        df = evaluate_brier(
            year=2018,
            cutoff_start="2019-01-01",
            cutoff_end="2021-01-01",
            csv_path=str(results_csv),
            models_dir=str(models_dir),
            output_dir=str(tmp_path / "results_out"),
        )

        assert df is not None
        assert df.loc[0, "Brier Mediana"] == pytest.approx(0.0)
