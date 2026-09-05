"""Unit tests for src.data.loader (team resolution, data prep, decay weights)."""

from __future__ import annotations

from itertools import combinations

import numpy as np
import pandas as pd
import pytest

from src.data.loader import (
    detect_phase,
    filter_low_volume_teams,
    get_importance_factor,
    load_ranking_priors,
    load_wc_results,
    prepare_cycle_data,
    resolve_team_name,
)


class TestResolveTeamName:
    def test_returns_name_unchanged_when_already_known(self) -> None:
        assert resolve_team_name("Brazil", ["Brazil", "Argentina"]) == "Brazil"

    def test_maps_known_alias_to_model_name(self) -> None:
        assert (
            resolve_team_name("Ivory Coast", ["Côte d'Ivoire", "Brazil"])
            == "Côte d'Ivoire"
        )

    def test_raises_for_completely_unknown_team(self) -> None:
        with pytest.raises(ValueError):
            resolve_team_name("Narnia", ["Brazil", "Argentina"])

    def test_raises_when_alias_target_is_also_unknown(self) -> None:
        with pytest.raises(ValueError):
            resolve_team_name("Ivory Coast", ["Brazil", "Argentina"])


class TestDetectPhase:
    def test_empty_or_none_is_group_stage(self) -> None:
        groups = {"A": ["Brazil", "Argentina"]}
        assert detect_phase(None, groups) == "group_stage"
        assert detect_phase({}, groups) == "group_stage"

    def test_group_matches_below_threshold_is_group_stage(self) -> None:
        groups = {"A": ["Brazil", "Argentina"]}
        known = {("Brazil", "Argentina"): (2, 1)}
        assert detect_phase(known, groups) == "group_stage"

    @staticmethod
    def _groups_and_72_group_matches() -> tuple[dict, dict]:
        # GROUP_STAGE_MATCHES == 72; a 13-team group has C(13, 2) == 78
        # possible pairs, so the first 72 give exactly the group-stage count.
        teams = [f"G{i}" for i in range(13)]
        groups = {"BigGroup": teams}
        pairs = list(combinations(teams, 2))[:72]
        known = dict.fromkeys(pairs, (1, 0))
        return groups, known

    def test_counts_only_matches_within_the_same_group(self) -> None:
        groups, known = self._groups_and_72_group_matches()
        # Neither team below belongs to any group, so this shouldn't count
        # towards group_matches -- it should instead push the phase into the
        # knockout stage (ko=1) now that the group stage is complete.
        known[("Brazil", "France")] = (1, 0)

        assert detect_phase(known, groups) == "round_of_32"

    def test_knockout_stage_thresholds(self) -> None:
        groups, base_known = self._groups_and_72_group_matches()

        def make_known(n_knockout: int) -> dict:
            known = dict(base_known)
            for i in range(n_knockout):
                known[(f"KO{i}", f"opp{i}")] = (1, 0)
            return known

        assert detect_phase(make_known(0), groups) == "round_of_32"
        assert detect_phase(make_known(15), groups) == "round_of_32"
        assert detect_phase(make_known(16), groups) == "round_of_16"
        assert detect_phase(make_known(23), groups) == "round_of_16"
        assert detect_phase(make_known(24), groups) == "quarterfinals"
        assert detect_phase(make_known(27), groups) == "quarterfinals"
        assert detect_phase(make_known(28), groups) == "semifinals"
        assert detect_phase(make_known(29), groups) == "semifinals"
        assert detect_phase(make_known(30), groups) == "final"


class TestLoadWcResults:
    def test_renames_and_fills_defaults(self, tmp_path) -> None:
        csv_path = tmp_path / "wc.csv"
        pd.DataFrame(
            [
                {
                    "home_team": "México",
                    "away_team": "Brazil",
                    "home_real": 2,
                    "away_real": 1,
                }
            ]
        ).to_csv(csv_path, index=False)

        df, known = load_wc_results(csv_path)

        assert "home_score" in df.columns and "away_score" in df.columns
        assert df.loc[0, "home_team"] == "Mexico"
        assert df.loc[0, "tournament"] == "FIFA World Cup"
        assert bool(df.loc[0, "neutral"]) is True
        assert known[("Mexico", "Brazil")] == (2, 1)

    def test_drops_rows_with_missing_scores(self, tmp_path) -> None:
        csv_path = tmp_path / "wc.csv"
        pd.DataFrame(
            [
                {
                    "home_team": "Brazil",
                    "away_team": "Argentina",
                    "home_real": 1,
                    "away_real": 1,
                },
                {
                    "home_team": "France",
                    "away_team": "Germany",
                    "home_real": None,
                    "away_real": 2,
                },
            ]
        ).to_csv(csv_path, index=False)

        df, known = load_wc_results(csv_path)

        assert len(df) == 1
        assert ("France", "Germany") not in known

    def test_parses_dd_mm_date_and_appends_current_year(self, tmp_path) -> None:
        csv_path = tmp_path / "wc.csv"
        pd.DataFrame(
            [
                {
                    "home_team": "Brazil",
                    "away_team": "Argentina",
                    "home_real": 2,
                    "away_real": 0,
                    "date": "15/06",
                }
            ]
        ).to_csv(csv_path, index=False)

        df, _ = load_wc_results(csv_path)

        assert df.loc[0, "date"] == pd.Timestamp("2026-06-15")


class TestFilterLowVolumeTeams:
    def test_keeps_teams_above_threshold_and_drops_the_rest(self) -> None:
        rows = []
        # "Frequent" appears in 25 matches (home); "Rare" only in 2.
        for i in range(25):
            rows.append({"home_team": "Frequent", "away_team": f"Opp{i}"})
        rows.append({"home_team": "Rare", "away_team": "Opp0"})
        rows.append({"home_team": "Opp0", "away_team": "Rare"})
        df = pd.DataFrame(rows)

        clean_df, team_list = filter_low_volume_teams(df, min_matches=20)

        assert "Frequent" in team_list
        assert "Rare" not in team_list
        assert not (clean_df["home_team"] == "Rare").any()
        assert not (clean_df["away_team"] == "Rare").any()

    def test_team_list_is_sorted(self) -> None:
        rows = [{"home_team": "Zeta", "away_team": "Alpha"}] * 25
        df = pd.DataFrame(rows)

        _, team_list = filter_low_volume_teams(df, min_matches=20)

        assert team_list == sorted(team_list)


class TestGetImportanceFactor:
    @pytest.mark.parametrize(
        ("tournament", "expected"),
        [
            ("FIFA World Cup", 60),
            ("FIFA World Cup qualification", 25),
            ("UEFA Euro", 40),
            ("Copa América", 40),
            ("UEFA Nations League Final", 35),
            ("UEFA Nations League", 20),
            ("Friendly", 10),
            ("Some Random Cup", 20),
        ],
    )
    def test_importance_by_tournament_name(self, tournament, expected) -> None:
        row = pd.Series({"tournament": tournament})
        assert get_importance_factor(row) == expected


class TestPrepareCycleData:
    def _write_csv(self, tmp_path) -> str:
        rows = []
        # 25 matches between A and B, spread across two "cycles" of dates, so
        # both the whole-history filter (min_matches=20, hardcoded inside
        # prepare_cycle_data) and the cycle-restricted filter pass.
        for i in range(25):
            year = 2020 if i < 15 else 2024
            rows.append(
                {
                    "home_team": "A",
                    "away_team": "B",
                    "home_score": 2,
                    "away_score": 1,
                    "date": f"{year}-01-{(i % 27) + 1:02d}",
                    "tournament": "Friendly",
                }
            )
        path = tmp_path / "results.csv"
        pd.DataFrame(rows).to_csv(path, index=False)
        return str(path)

    def test_raises_for_missing_file(self) -> None:
        with pytest.raises(FileNotFoundError):
            prepare_cycle_data("/no/such/file.csv", start_date="2024-01-01")

    def test_filters_to_the_requested_cycle(self, tmp_path) -> None:
        csv_path = self._write_csv(tmp_path)

        df_cycle, teams_list, team_map = prepare_cycle_data(
            csv_path, start_date="2023-01-01", min_matches=5
        )

        assert (df_cycle["date"] >= pd.Timestamp("2023-01-01")).all()
        assert len(df_cycle) == 10
        assert teams_list == ["A", "B"]
        assert team_map == {"A": 1, "B": 2}

    def test_game_weight_without_decay_is_tournament_weight_over_ten(
        self, tmp_path
    ) -> None:
        csv_path = self._write_csv(tmp_path)

        df_cycle, _, _ = prepare_cycle_data(
            csv_path, start_date="2023-01-01", min_matches=5, apply_decay=False
        )

        np.testing.assert_allclose(df_cycle["game_weight"].to_numpy(), 1.0)

    def test_decay_gives_more_recent_matches_higher_weight(self, tmp_path) -> None:
        csv_path = self._write_csv(tmp_path)

        df_cycle, _, _ = prepare_cycle_data(
            csv_path, start_date="2023-01-01", min_matches=5, apply_decay=True
        )

        most_recent = df_cycle.loc[df_cycle["date"].idxmax(), "game_weight"]
        oldest = df_cycle.loc[df_cycle["date"].idxmin(), "game_weight"]
        assert most_recent >= oldest


class TestLoadRankingPriors:
    def test_normalizes_points_with_pt_headers_and_comma_decimals(
        self, tmp_path
    ) -> None:
        path = tmp_path / "ranking.csv"
        pd.DataFrame(
            {
                "Seleção": ["Brazil", "Argentina", "France"],
                "Pontos": ["1800,5", "1900,0", "1700,0"],
            }
        ).to_csv(path, index=False)

        result = load_ranking_priors(str(path), ["Brazil", "Argentina", "France"])

        pts = np.array([1800.5, 1900.0, 1700.0])
        expected = (pts - pts.mean()) / pts.std()
        np.testing.assert_allclose(result, expected)

    def test_missing_team_gets_mean_score_normalized_to_zero(self, tmp_path) -> None:
        path = tmp_path / "ranking.csv"
        pd.DataFrame(
            {"Seleção": ["Brazil", "Argentina"], "Pontos": [1800, 1900]}
        ).to_csv(path, index=False)

        result = load_ranking_priors(str(path), ["Brazil", "Nowhereland"])

        assert result[1] == pytest.approx(0.0)

    def test_unreadable_file_returns_zeros(self) -> None:
        result = load_ranking_priors("/no/such/ranking.csv", ["Brazil", "Argentina"])

        np.testing.assert_array_equal(result, np.zeros(2))
