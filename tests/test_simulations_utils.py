"""Unit tests for src.simulations.utils.run_backtest_simulation.

Exercises the helper shared by the wc2018/wc2022 entries in run_cycle.py
end-to-end (data prep, bracket simulation, JSON + dashboard export) using a
small synthetic 32-team "historical cycle" instead of a real trained Stan
model.
"""

from __future__ import annotations

import json
from itertools import combinations

import numpy as np
import pandas as pd
import pytest

from src.simulations.utils import run_backtest_simulation

TEAMS = [f"Team{i:02d}" for i in range(32)]
GROUPS = {chr(ord("A") + g): TEAMS[g * 4 : g * 4 + 4] for g in range(8)}


def _write_round_robin_csv(csv_path) -> None:
    """Every team plays every other team once, well above min_matches=20."""
    rows = []
    rng = np.random.default_rng(0)
    for i, (home, away) in enumerate(combinations(TEAMS, 2)):
        rows.append(
            {
                "home_team": home,
                "away_team": away,
                "home_score": int(rng.integers(0, 4)),
                "away_score": int(rng.integers(0, 4)),
                "date": f"2020-01-{(i % 27) + 1:02d}",
                "tournament": "Friendly",
            }
        )
    pd.DataFrame(rows).to_csv(csv_path, index=False)


def _write_draws_npz(npz_path, n_teams: int, n_samples: int = 50) -> None:
    rng = np.random.default_rng(1)
    np.savez(
        npz_path,
        attack=rng.normal(size=(n_samples, n_teams)),
        defense=rng.normal(size=(n_samples, n_teams)),
        eta=rng.normal(size=(n_samples,)),
    )


class TestRunBacktestSimulation:
    def test_produces_results_json_and_dashboard_html(self, tmp_path) -> None:
        csv_path = tmp_path / "results.csv"
        _write_round_robin_csv(csv_path)

        models_dir = tmp_path / "outputs" / "models"
        models_dir.mkdir(parents=True)
        _write_draws_npz(models_dir / "test_draws.npz", n_teams=len(TEAMS))

        dashboard_path = run_backtest_simulation(
            year=2018,
            groups=GROUPS,
            cutoff_start="2020-01-01",
            cutoff_end="2020-12-31",
            stage_labels={
                "avancou_grupos": "Oitavas de Final",
                "quarter_finalists": "Quartas de Final",
                "semi_finalists": "Semifinais",
                "finalists": "Finalistas",
                "champion": "Campeão",
            },
            dashboard_title="Copa de Teste",
            csv_path=str(csv_path),
            model_name="test_draws.npz",
            output_dir=str(tmp_path / "outputs"),
            n_sim=200,
        )

        results_path = (
            tmp_path / "outputs" / "backtesting" / "results" / "sim_results_2018.json"
        )
        assert results_path.exists()
        with open(results_path) as f:
            results = json.load(f)

        # Every stage lists a probability entry for all 32 teams.
        assert set(results.keys()) == {
            "avancou_grupos",
            "quarter_finalists",
            "semi_finalists",
            "finalists",
            "champion",
        }
        for stage_entries in results.values():
            assert {entry["team"] for entry in stage_entries} == set(TEAMS)
            assert all(0.0 <= entry["probability"] <= 1.0 for entry in stage_entries)

        champion_total = sum(e["probability"] for e in results["champion"])
        assert champion_total == pytest.approx(1.0)

        assert dashboard_path == (
            tmp_path / "outputs" / "backtesting" / "dashboards" / "dashboard_2018.html"
        )
        assert dashboard_path.exists()
        html = dashboard_path.read_text(encoding="utf-8")
        assert "Copa de Teste" in html
        assert "test_draws.npz" in html

    def test_defaults_model_name_from_year_when_not_given(self, tmp_path) -> None:
        csv_path = tmp_path / "results.csv"
        _write_round_robin_csv(csv_path)

        models_dir = tmp_path / "outputs" / "models"
        models_dir.mkdir(parents=True)
        _write_draws_npz(
            models_dir / "draws_2022_n_poisson_ranking.npz", n_teams=len(TEAMS)
        )

        dashboard_path = run_backtest_simulation(
            year=2022,
            groups=GROUPS,
            cutoff_start="2020-01-01",
            cutoff_end="2020-12-31",
            stage_labels={"champion": "Campeão"},
            dashboard_title="Copa 2022",
            csv_path=str(csv_path),
            output_dir=str(tmp_path / "outputs"),
            n_sim=200,
        )

        assert dashboard_path.exists()
