"""Abstract Dixon–Coles match model (shared by MLE and future Bayesian fits)."""

from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np
from numpy.typing import NDArray

from src.constants import MAX_GOALS
from src.utils import effective_home_gamma, score_probability_matrix


class BaseDixonColesMatchModel(ABC):
    """Match-level API for Dixon–Coles–style models.

    Subclasses implement strength and global-parameter accessors;
    :meth:`match_probs` and related helpers are defined here.
    """

    @abstractmethod
    def get_attack(self, team: str) -> float:
        """Expected-goals scaling for *team* when attacking."""

    @abstractmethod
    def get_defense(self, team: str) -> float:
        """Conceding scaling for *team* when defending."""

    @abstractmethod
    def get_rho(self) -> float:
        """Dixon–Coles low-score correlation."""

    @abstractmethod
    def get_home_effect(self) -> float:
        """Home-advantage multiplier (strict home matches)."""

    def match_probs(
        self,
        home: str,
        away: str,
        neutral: bool = True,
        max_goals: int = MAX_GOALS,
        lambda_scale: float = 1.0,
        home_boost: float = 0.0,
    ) -> NDArray[np.floating]:
        """Return ``(max_goals+1) x (max_goals+1)`` score probability matrix.

        ``home_boost``: fraction of home effect at neutral venues (0 = none, 1 = full).
        Ignored when ``neutral=False`` (uses full home effect).
        """
        att_h = self.get_attack(home)
        def_h = self.get_defense(home)
        att_a = self.get_attack(away)
        def_a = self.get_defense(away)
        gamma = effective_home_gamma(self.get_home_effect(), neutral, home_boost)
        hl = att_h * def_a * gamma * lambda_scale
        al = att_a * def_h * lambda_scale
        return score_probability_matrix(hl, al, self.get_rho(), max_goals)

    def simulate_match(
        self,
        home: str,
        away: str,
        neutral: bool = True,
        home_boost: float = 0.0,
        rng: np.random.Generator | None = None,
    ) -> tuple[int, int]:
        """Simulate one match; returns ``(home_goals, away_goals)``."""
        if rng is None:
            rng = np.random.default_rng()
        prob = self.match_probs(home, away, neutral=neutral, home_boost=home_boost)
        mg = prob.shape[0]
        idx = rng.choice(mg * mg, p=prob.ravel())
        return int(idx // mg), int(idx % mg)

    def win_draw_loss(
        self,
        home: str,
        away: str,
        neutral: bool = True,
        home_boost: float = 0.0,
    ) -> tuple[float, float, float]:
        """Return ``(home_win_prob, draw_prob, away_win_prob)``."""
        prob = self.match_probs(home, away, neutral=neutral, home_boost=home_boost)
        hw = float(np.tril(prob, k=-1).sum())
        d = float(np.trace(prob))
        aw = float(np.triu(prob, k=1).sum())
        return hw, d, aw

    def get_strength(self, team: str) -> float:
        """Overall strength (attack / defense). Higher is better."""
        return float(self.get_attack(team) / self.get_defense(team))
