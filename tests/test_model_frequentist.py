"""Unit tests for src.model.frequentist (MLE Dixon-Coles fitting and data loading)."""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from src.model.frequentist import DixonColesModel, load_and_prepare_data
from src.model.params import TournamentModelParams

RAW_COLUMNS = [
    "date",
    "home_team",
    "away_team",
    "home_score",
    "away_score",
    "tournament",
    "neutral",
]


def _sample_results() -> pd.DataFrame:
    rows = [
        # component reachable from Brazil -- each team plays at least two
        # distinct opponents so none gets dropped by the min_opponents=1
        # default threshold in load_and_prepare_data.
        ("2024-01-01", "Brazil", "Argentina", 2, 1, "Friendly", False),
        ("2024-02-01", "Argentina", "Brazil", 0, 3, "Friendly", False),
        ("2024-02-10", "Brazil", "France", 1, 1, "Friendly", True),
        ("2024-03-01", "Argentina", "France", 1, 1, "Friendly", True),
        ("2024-04-01", "France", "Germany", 2, 0, "Friendly", True),
        ("2024-04-15", "Germany", "Argentina", 1, 2, "Friendly", True),
        # isolated component, unreachable from Brazil
        ("2024-01-15", "Elsewhere", "NoOne2", 1, 0, "Friendly", True),
        ("2024-02-15", "NoOne2", "Elsewhere", 2, 2, "Friendly", True),
    ]
    return pd.DataFrame(rows, columns=RAW_COLUMNS)


class TestLoadAndPrepareData:
    def test_keeps_only_teams_reachable_from_brazil(self, tmp_path, monkeypatch):
        _sample_results().to_csv(tmp_path / "results.csv", index=False)
        monkeypatch.setattr("src.model.frequentist.DATA_DIR", tmp_path)

        data, teams = load_and_prepare_data(min_date="2020-01-01")

        assert set(teams) == {"Brazil", "Argentina", "France", "Germany"}
        assert "Elsewhere" not in set(data["home_team"]) | set(data["away_team"])
        assert "NoOne2" not in set(data["home_team"]) | set(data["away_team"])

    def test_adds_positive_game_weight_column(self, tmp_path, monkeypatch):
        _sample_results().to_csv(tmp_path / "results.csv", index=False)
        monkeypatch.setattr("src.model.frequentist.DATA_DIR", tmp_path)

        data, _ = load_and_prepare_data(min_date="2020-01-01")

        assert "game_weight" in data.columns
        assert (data["game_weight"] > 0).all()

    def test_extra_data_rows_are_included(self, tmp_path, monkeypatch):
        _sample_results().to_csv(tmp_path / "results.csv", index=False)
        monkeypatch.setattr("src.model.frequentist.DATA_DIR", tmp_path)
        extra = pd.DataFrame(
            [("2024-05-01", "Brazil", "Germany", 1, 1, "Friendly", True)],
            columns=RAW_COLUMNS,
        )

        data, _ = load_and_prepare_data(min_date="2020-01-01", extra_data=extra)

        assert (
            (data["home_team"] == "Brazil") & (data["away_team"] == "Germany")
        ).any()

    def test_min_opponents_drops_teams_below_threshold(self, tmp_path, monkeypatch):
        rows = [
            ("2024-01-01", "Brazil", "Argentina", 2, 1, "Friendly", False),
            ("2024-02-01", "Argentina", "Brazil", 0, 3, "Friendly", False),
        ]
        pd.DataFrame(rows, columns=RAW_COLUMNS).to_csv(
            tmp_path / "results.csv", index=False
        )
        monkeypatch.setattr("src.model.frequentist.DATA_DIR", tmp_path)

        # Brazil and Argentina only ever play each other, so each has exactly
        # one unique opponent -- at the min_opponents=1 threshold both drop.
        data, teams = load_and_prepare_data(min_date="2020-01-01", min_opponents=1)

        assert teams == []
        assert data.empty


class TestDixonColesModel:
    def test_fitted_parameters_raises_before_fit(self) -> None:
        model = DixonColesModel()
        with pytest.raises(RuntimeError):
            model.fitted_parameters()

    def _fit_synthetic_model(self) -> DixonColesModel:
        rng = np.random.default_rng(123)
        true_attack = {"Strong": 1.8, "Weak": 0.6}
        true_defense = {"Strong": 0.7, "Weak": 1.4}
        true_home_effect = 1.3

        rows = []
        for i in range(120):
            home, away = ("Strong", "Weak") if i % 2 == 0 else ("Weak", "Strong")
            neutral = bool(rng.integers(0, 2))
            gamma = 1.0 if neutral else true_home_effect
            home_lambda = true_attack[home] * true_defense[away] * gamma
            away_lambda = true_attack[away] * true_defense[home]
            rows.append(
                {
                    "home_team": home,
                    "away_team": away,
                    "home_score": rng.poisson(home_lambda),
                    "away_score": rng.poisson(away_lambda),
                    "neutral": neutral,
                    "game_weight": 1.0,
                }
            )
        data = pd.DataFrame(rows)

        model = DixonColesModel(reg_lambda=0.1)
        model.fit(data, ["Strong", "Weak"])
        return model

    def test_fit_recovers_relative_team_strength(self) -> None:
        model = self._fit_synthetic_model()

        assert model.get_attack("Strong") > model.get_attack("Weak")
        assert model.get_defense("Strong") < model.get_defense("Weak")
        assert model.get_home_effect() > 1.0
        assert -1.0 < model.get_rho() < 1.0

    def test_fitted_parameters_snapshot_matches_accessors(self) -> None:
        model = self._fit_synthetic_model()

        snapshot = model.fitted_parameters()

        assert isinstance(snapshot, TournamentModelParams)
        assert snapshot.teams == model.teams
        assert snapshot.get_attack("Strong") == pytest.approx(
            model.get_attack("Strong")
        )
        assert snapshot.get_defense("Weak") == pytest.approx(model.get_defense("Weak"))
        assert snapshot.get_rho() == pytest.approx(model.get_rho())
        assert snapshot.get_home_effect() == pytest.approx(model.get_home_effect())
