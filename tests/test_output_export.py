"""Unit tests for src.output.export (probability dataframes, CSV export)."""

from __future__ import annotations

from itertools import combinations

import numpy as np
import pandas as pd
import pytest

from src.constants import ALL_MATCHUPS_EXPORT_COLS, PARTIDAS_EXPORT_COLS
from src.model.params import TournamentModelParams
from src.output.export import (
    _get_ko_winners,
    _knockout_winner,
    _outcome_probs,
    _score_probs,
    build_all_matchups_dataframe,
    build_prob_dataframe,
    get_flag,
    get_phase_matchups,
    save_matches_to_prod,
    update_chaveamento_probs,
    update_html_from_summary,
)


class _FakeWorldCup:
    """Minimal stand-in exposing only what export.py's helpers touch."""

    def __init__(self, params, groups=None, all_teams=None) -> None:
        self.params = params
        self.groups = groups or {}
        self.all_teams = all_teams or []


def make_fake_wc(teams: list[str], **kwargs) -> _FakeWorldCup:
    n = len(teams)
    params = TournamentModelParams(
        teams=teams,
        attack=np.linspace(1.0, 2.0, n),
        defense=np.linspace(0.7, 1.3, n),
        rho=-0.05,
        home_effect=1.2,
    )
    return _FakeWorldCup(params, all_teams=teams, **kwargs)


class TestKnockoutWinner:
    def test_home_wins(self) -> None:
        known = {("A", "B"): (2, 1)}
        assert _knockout_winner("A", "B", known) == "A"

    def test_away_wins(self) -> None:
        known = {("A", "B"): (0, 3)}
        assert _knockout_winner("A", "B", known) == "B"

    def test_reversed_key_is_also_matched(self) -> None:
        known = {("B", "A"): (1, 2)}
        assert _knockout_winner("A", "B", known) == "A"

    def test_draw_raises_value_error(self) -> None:
        known = {("A", "B"): (1, 1)}
        with pytest.raises(ValueError):
            _knockout_winner("A", "B", known)

    def test_missing_result_raises_key_error(self) -> None:
        with pytest.raises(KeyError):
            _knockout_winner("A", "B", {})

    def test_get_ko_winners_maps_each_matchup(self) -> None:
        known = {("A", "B"): (2, 0), ("C", "D"): (0, 1)}
        winners = _get_ko_winners([("A", "B"), ("C", "D")], known)
        assert winners == ["A", "D"]


class TestOutcomeProbs:
    def test_sums_to_full_matrix_mass(self) -> None:
        prob = np.array([[0.4, 0.1], [0.2, 0.3]])
        home_win, draw, away_win = _outcome_probs(prob)
        assert home_win == pytest.approx(20.0)
        assert draw == pytest.approx(70.0)
        assert away_win == pytest.approx(10.0)
        assert home_win + draw + away_win == pytest.approx(100.0)


class TestScoreProbs:
    def test_returns_rounded_percentages_for_low_scores(self) -> None:
        prob = np.zeros((6, 6))
        prob[0, 0] = 0.123456
        prob[2, 3] = 0.05
        scores = _score_probs(prob)

        assert scores["zero_zero"] == pytest.approx(12.3456)
        assert scores["two_three"] == pytest.approx(5.0)
        assert len(scores) == 25  # 5x5 grid per PARTIDAS_SCORE_COLS


class TestGetPhaseMatchups:
    def test_group_stage_returns_every_pair_labeled_by_group(self) -> None:
        wc = make_fake_wc(
            ["A1", "A2", "A3"], groups={"A": ["A1", "A2", "A3"], "B": ["B1", "B2"]}
        )
        matchups = get_phase_matchups(wc, known=None, phase="group_stage")

        assert set(matchups) == {
            ("A1", "A2", "A"),
            ("A1", "A3", "A"),
            ("A2", "A3", "A"),
            ("B1", "B2", "B"),
        }


class TestBuildProbDataframe:
    def test_builds_expected_columns_and_falls_back_to_unscheduled_orientation(
        self,
    ) -> None:
        wc = make_fake_wc(["Brazil", "Argentina"])
        empty_schedule = pd.DataFrame(
            columns=["home_team", "away_team", "tournament", "date"]
        )

        df = build_prob_dataframe(
            wc,
            matchups=[("Brazil", "Argentina", "A")],
            results_path=empty_schedule,
        )

        assert list(df.columns) == PARTIDAS_EXPORT_COLS
        assert len(df) == 1
        assert df.loc[0, "home_team"] == "Brasil"
        assert df.loc[0, "away_team"] == "Argentina"
        assert df.loc[0, "group"] == "A"
        assert df.loc[0, "home_win"] + df.loc[0, "draw"] + df.loc[0, "away_win"] == (
            pytest.approx(100.0, abs=0.01)
        )

    def test_uses_scheduled_orientation_and_group_when_available(self) -> None:
        wc = make_fake_wc(["Brazil", "Argentina"])
        schedule = pd.DataFrame(
            [
                {
                    "home_team": "Argentina",
                    "away_team": "Brazil",
                    "tournament": "FIFA World Cup",
                    "date": "2026-06-15",
                }
            ]
        )

        df = build_prob_dataframe(
            wc,
            matchups=[("Brazil", "Argentina", "")],
            results_path=schedule,
        )

        assert df.loc[0, "home_team"] == "Argentina"
        assert df.loc[0, "away_team"] == "Brasil"
        assert df.loc[0, "date"] == "2026-06-15"

    def test_unmapped_team_raises_value_error(self) -> None:
        wc = make_fake_wc(["Brazil", "Nowhereland"])
        empty_schedule = pd.DataFrame(
            columns=["home_team", "away_team", "tournament", "date"]
        )

        with pytest.raises(ValueError):
            build_prob_dataframe(
                wc,
                matchups=[("Brazil", "Nowhereland", "")],
                results_path=empty_schedule,
            )


class TestBuildAllMatchupsDataframe:
    def test_covers_every_unique_pair(self) -> None:
        teams = ["T1", "T2", "T3", "T4"]
        wc = make_fake_wc(teams)
        empty_schedule = pd.DataFrame(
            columns=["home_team", "away_team", "tournament", "date"]
        )

        df = build_all_matchups_dataframe(wc, results_path=empty_schedule)

        assert list(df.columns) == ALL_MATCHUPS_EXPORT_COLS
        assert len(df) == len(list(combinations(teams, 2)))


class TestSaveMatchesToProd:
    def test_creates_new_file(self, tmp_path) -> None:
        wc = make_fake_wc(["Brazil", "Argentina"])
        empty_schedule = pd.DataFrame(
            columns=["home_team", "away_team", "tournament", "date"]
        )
        df = build_prob_dataframe(
            wc, [("Brazil", "Argentina", "A")], results_path=empty_schedule
        )
        prod_path = tmp_path / "partidas.csv"

        save_matches_to_prod(df, prod_path=str(prod_path))

        assert prod_path.exists()
        assert len(pd.read_csv(prod_path)) == 1

    def test_updates_existing_row_instead_of_duplicating(self, tmp_path) -> None:
        wc = make_fake_wc(["Brazil", "Argentina"])
        empty_schedule = pd.DataFrame(
            columns=["home_team", "away_team", "tournament", "date"]
        )
        prod_path = tmp_path / "partidas.csv"

        first = build_prob_dataframe(
            wc, [("Brazil", "Argentina", "A")], results_path=empty_schedule
        )
        save_matches_to_prod(first, prod_path=str(prod_path))

        second = first.copy()
        second["home_win"] = 999.0
        save_matches_to_prod(second, prod_path=str(prod_path))

        saved = pd.read_csv(prod_path)
        assert len(saved) == 1
        assert saved.loc[0, "home_win"] == 999.0


class TestUpdateHtmlFromSummary:
    def _summary_df(self, team_to_champion: dict[str, float]) -> pd.DataFrame:
        rows = [
            {
                "position": i + 1,
                "team": team,
                "champion": champ,
                "final": champ * 2,
                "semifinals": champ * 3,
                "quarterfinals": champ * 4,
                "round_of_16": champ * 5,
                "round_of_32": champ * 6,
            }
            for i, (team, champ) in enumerate(team_to_champion.items())
        ]
        return pd.DataFrame(rows)

    def test_writes_new_file_sorted_by_champion_desc(self, tmp_path) -> None:
        path = tmp_path / "tabela_chances.csv"
        df = self._summary_df({"Brazil": 10.0, "Argentina": 25.0})

        update_html_from_summary(df, tabela_csv=str(path), version="Antes da Copa")

        saved = pd.read_csv(path)
        assert list(saved["team"]) == ["Argentina", "Brazil"]
        assert list(saved["pos"]) == [1, 2]

    def test_replaces_rows_for_the_same_version_but_keeps_others(
        self, tmp_path
    ) -> None:
        path = tmp_path / "tabela_chances.csv"
        update_html_from_summary(
            self._summary_df({"Brazil": 10.0}), tabela_csv=str(path), version="V1"
        )
        update_html_from_summary(
            self._summary_df({"Argentina": 5.0}), tabela_csv=str(path), version="V2"
        )
        # Re-writing V1 with new data should not duplicate or drop V2's rows.
        update_html_from_summary(
            self._summary_df({"Brazil": 50.0}), tabela_csv=str(path), version="V1"
        )

        saved = pd.read_csv(path)
        assert set(saved["versão"]) == {"V1", "V2"}
        v1_row = saved[saved["versão"] == "V1"].iloc[0]
        assert v1_row["champ"] == pytest.approx(50.0)


class TestUpdateChaveamentoProbs:
    def _bracket_df(self) -> pd.DataFrame:
        return pd.DataFrame(
            [
                {
                    "side": "left",
                    "round_index": 0,
                    "round_label": "R32",
                    "order": 0,
                    "id": "m1",
                    "home_team": "Brazil",
                    "prob_home": 0.6,
                    "away_team": "Argentina",
                    "prob_away": 0.4,
                    "winner": "",
                },
                {
                    "side": "left",
                    "round_index": 1,
                    "round_label": "R16",
                    "order": 0,
                    "id": "m2",
                    "home_team": "France",
                    "prob_home": 0.55,
                    "away_team": "Germany",
                    "prob_away": 0.45,
                    "winner": "",
                },
            ]
        )

    def test_writes_all_rounds_for_a_fresh_version(self, tmp_path) -> None:
        path = tmp_path / "chaveamento_probs.csv"

        update_chaveamento_probs(
            self._bracket_df(), version="Antes da Copa", chaveamento_csv=str(path)
        )

        saved = pd.read_csv(path)
        assert len(saved) == 2

    def test_drops_already_completed_rounds_for_later_versions(self, tmp_path) -> None:
        path = tmp_path / "chaveamento_probs.csv"

        # "Após os 16-Avos" means round_index 0 (R32) is already in the past.
        update_chaveamento_probs(
            self._bracket_df(), version="Após os 16-Avos", chaveamento_csv=str(path)
        )

        saved = pd.read_csv(path)
        assert list(saved["round_index"]) == [1]


class TestGetFlag:
    def test_known_team_returns_a_url(self) -> None:
        assert get_flag("Brasil").startswith("http")

    def test_unknown_team_returns_placeholder(self) -> None:
        assert get_flag("Nowhereland") == "🏳️"
