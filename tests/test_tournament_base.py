"""Unit tests for src.tournament.base (shared dataclasses used by simulators)."""

from __future__ import annotations

from src.tournament.base import GroupStanding, TournamentResult


class TestGroupStanding:
    def test_goal_diff_is_for_minus_against(self) -> None:
        standing = GroupStanding(team="Brazil", goals_for=7, goals_against=2)
        assert standing.goal_diff == 5

    def test_sort_key_orders_by_points_then_goal_diff_then_goals_for(self) -> None:
        leader = GroupStanding(team="A", points=6, goals_for=4, goals_against=1)
        chaser = GroupStanding(team="B", points=6, goals_for=3, goals_against=2)
        weaker = GroupStanding(team="C", points=3, goals_for=10, goals_against=0)
        ranking = sorted(
            [weaker, chaser, leader], key=lambda s: s.sort_key, reverse=True
        )
        assert [s.team for s in ranking] == ["A", "B", "C"]

    def test_defaults_are_zero(self) -> None:
        standing = GroupStanding(team="Brazil")
        assert standing.points == 0
        assert standing.goal_diff == 0
        assert standing.sort_key == (0, 0, 0)


class TestTournamentResult:
    def test_default_factories_are_independent_between_instances(self) -> None:
        first = TournamentResult()
        second = TournamentResult()
        first.champion["Brazil"] = 100
        assert second.champion == {}

    def test_counts_defaults_to_zero(self) -> None:
        assert TournamentResult().counts == 0
