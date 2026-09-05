"""Unit tests for src.simulations.run_cycle, the generic 32-team/8-group
tournament CLI that replaced one file per competition (sim_2018.py,
sim_2022.py, sim_wwc2027.py).
"""

from __future__ import annotations

import numpy as np
import pytest

from src.simulations.run_cycle import (
    COMPETITIONS,
    CompetitionConfig,
    main,
    run_placeholder_scaffold,
    uniform_posterior_draws,
)


class TestCompetitionsRegistry:
    def test_every_competition_is_a_valid_8x4_bracket(self) -> None:
        for name, config in COMPETITIONS.items():
            teams = [t for ts in config.groups.values() for t in ts]
            assert len(config.groups) == 8, name
            assert all(len(ts) == 4 for ts in config.groups.values()), name
            assert len(set(teams)) == 32, name

    def test_each_entry_is_either_a_backtest_or_a_placeholder_not_both(self) -> None:
        for name, config in COMPETITIONS.items():
            is_backtest = config.year is not None
            is_placeholder = config.placeholder_note is not None
            assert is_backtest != is_placeholder, name

    def test_backtest_entries_have_cutoff_dates(self) -> None:
        for name, config in COMPETITIONS.items():
            if config.year is not None:
                assert config.cutoff_start is not None, name
                assert config.cutoff_end is not None, name


class TestUniformPosteriorDraws:
    def test_shapes_and_no_dixon_coles_rho(self) -> None:
        draws = uniform_posterior_draws(n_teams=32)

        assert draws["attack"].shape[1] == 32
        assert draws["defense"].shape[1] == 32
        assert draws["attack"].shape[0] == draws["defense"].shape[0]
        assert len(draws["eta"]) == draws["attack"].shape[0]
        assert "rho" not in draws


class TestRunPlaceholderScaffold:
    def test_every_team_gets_a_probability_for_every_stage(self) -> None:
        config = COMPETITIONS["wwc2027"]
        teams = [t for ts in config.groups.values() for t in ts]

        probs = run_placeholder_scaffold(config, n_sim=500)

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
        probs = run_placeholder_scaffold(COMPETITIONS["wwc2027"], n_sim=500)

        assert probs["champion"].sum() == pytest.approx(1.0)

    def test_works_with_any_8x4_config_not_just_wwc2027(self) -> None:
        # Confirms the reuse isn't hardcoded to the wwc2027 placeholder --
        # any 8-groups-of-4 CompetitionConfig works.
        groups = {letter: [f"{letter}{i}" for i in range(4)] for letter in "ABCDEFGH"}
        config = CompetitionConfig(
            groups=groups,
            stage_labels={},
            dashboard_title="Custom",
            placeholder_note="test",
        )

        probs = run_placeholder_scaffold(config, n_sim=300)

        teams = [t for ts in groups.values() for t in ts]
        assert len(probs["champion"]) == len(teams)
        assert probs["champion"].sum() == pytest.approx(1.0)


class TestMainCli:
    def test_placeholder_competition_prints_summary_and_persists_nothing(
        self, capsys, tmp_path, monkeypatch
    ) -> None:
        monkeypatch.chdir(tmp_path)

        main(["wwc2027", "--n-sim", "200"])

        captured = capsys.readouterr()
        assert "PROVISIONAL" in captured.out
        assert "Champion %" in captured.out
        assert list(tmp_path.iterdir()) == []

    def test_backtest_competition_dispatches_to_run_backtest_simulation(
        self, monkeypatch
    ) -> None:
        calls = []
        monkeypatch.setattr(
            "src.simulations.run_cycle.run_backtest_simulation",
            lambda **kwargs: calls.append(kwargs),
        )

        main(["wc2018", "--n-sim", "123"])

        assert len(calls) == 1
        config = COMPETITIONS["wc2018"]
        assert calls[0] == {
            "year": 2018,
            "groups": config.groups,
            "cutoff_start": config.cutoff_start,
            "cutoff_end": config.cutoff_end,
            "stage_labels": config.stage_labels,
            "dashboard_title": config.dashboard_title,
            "n_sim": 123,
        }

    def test_unknown_competition_is_rejected(self) -> None:
        with pytest.raises(SystemExit):
            main(["not-a-real-competition"])
