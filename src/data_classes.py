"""Strength snapshots for World Cup simulation (fixed draw or per-replicate draws)."""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from numpy.typing import NDArray

from src.constants import MAX_GOALS
from src.utils import effective_home_gamma, score_probability_matrix


@dataclass
class TournamentModelParams:
    """Single fitted Dixon–Coles snapshot for tournament simulation (no training)."""

    teams: list[str]
    attack: NDArray[np.floating]
    defense: NDArray[np.floating]
    rho: float
    home_effect: float
    _idx: dict[str, int] = field(init=False, repr=False, compare=False)

    def __post_init__(self) -> None:
        self._idx = {t: i for i, t in enumerate(self.teams)}

    def get_attack(self, team: str) -> float:
        return float(self.attack[self._idx[team]])

    def get_defense(self, team: str) -> float:
        return float(self.defense[self._idx[team]])

    def match_probs(
        self,
        home: str,
        away: str,
        neutral: bool = True,
        max_goals: int = MAX_GOALS,
        lambda_scale: float = 1.0,
        home_boost: float = 0.0,
    ) -> NDArray[np.floating]:
        att_h = self.get_attack(home)
        def_h = self.get_defense(home)
        att_a = self.get_attack(away)
        def_a = self.get_defense(away)
        gamma = effective_home_gamma(self.home_effect, neutral, home_boost)
        hl = att_h * def_a * gamma * lambda_scale
        al = att_a * def_h * lambda_scale
        return score_probability_matrix(hl, al, self.rho, max_goals)

    def simulate_match(
        self,
        home: str,
        away: str,
        neutral: bool = True,
        home_boost: float = 0.0,
        rng: np.random.Generator | None = None,
    ) -> tuple[int, int]:
        if rng is None:
            rng = np.random.default_rng()
        prob = self.match_probs(home, away, neutral=neutral, home_boost=home_boost)
        mg = prob.shape[0]
        idx = rng.choice(mg * mg, p=prob.ravel())
        return int(idx // mg), int(idx % mg)


@dataclass
class TournamentParamsSeries:
    """Attack/defense (and optional rho, home_effect) varying by Monte Carlo draw.

    attack[r, k] is the attack strength for team_order[k] in replication r.
    Use the same team_order as WorldCup2026.all_teams.
    """

    team_order: list[str]
    attack: NDArray[np.floating]
    defense: NDArray[np.floating]
    rho: float | NDArray[np.floating] = 0.0
    home_effect: float | NDArray[np.floating] = 1.0
    _idx: dict[str, int] = field(init=False, repr=False, compare=False)

    def __post_init__(self) -> None:
        self._idx = {t: i for i, t in enumerate(self.team_order)}
        a = np.asarray(self.attack, dtype=float)
        d = np.asarray(self.defense, dtype=float)
        if a.shape != d.shape or a.ndim != 2:
            raise ValueError(
                "attack and defense must be 2-D arrays with the same shape."
            )
        self.attack = a
        self.defense = d
        self.n_replications, n_t = a.shape
        if n_t != len(self.team_order):
            raise ValueError(
                "attack.shape[1] must match len(team_order) "
                f"({n_t} != {len(self.team_order)})."
            )
        self.rho = self._broadcast_to_rows(self.rho, "rho")
        self.home_effect = self._broadcast_to_rows(self.home_effect, "home_effect")

    def _broadcast_to_rows(
        self, x: float | NDArray[np.floating], name: str
    ) -> NDArray[np.floating]:
        arr = np.asarray(x, dtype=float)
        if arr.ndim == 0:
            return np.full(self.n_replications, float(arr))
        if arr.shape != (self.n_replications,):
            raise ValueError(
                f"{name} must be a scalar or a 1-D array of length "
                f"{self.n_replications} (number of replications)."
            )
        return arr

    def match_probs(
        self,
        row: int,
        home: str,
        away: str,
        neutral: bool = True,
        max_goals: int = MAX_GOALS,
        lambda_scale: float = 1.0,
        home_boost: float = 0.0,
    ) -> NDArray[np.floating]:
        att_h = float(self.attack[row, self._idx[home]])
        def_h = float(self.defense[row, self._idx[home]])
        att_a = float(self.attack[row, self._idx[away]])
        def_a = float(self.defense[row, self._idx[away]])
        gamma = effective_home_gamma(float(self.home_effect[row]), neutral, home_boost)
        hl = att_h * def_a * gamma * lambda_scale
        al = att_a * def_h * lambda_scale
        return score_probability_matrix(hl, al, float(self.rho[row]), max_goals)

    def simulate_match(
        self,
        row: int,
        home: str,
        away: str,
        neutral: bool = True,
        home_boost: float = 0.0,
        rng: np.random.Generator | None = None,
    ) -> tuple[int, int]:
        if rng is None:
            rng = np.random.default_rng()
        prob = self.match_probs(row, home, away, neutral=neutral, home_boost=home_boost)
        mg = prob.shape[0]
        idx = rng.choice(mg * mg, p=prob.ravel())
        return int(idx // mg), int(idx % mg)

    @classmethod
    def repeat_fixed(
        cls,
        fixed: TournamentModelParams,
        team_order: list[str],
        n_rows: int,
    ) -> TournamentParamsSeries:
        """Repeat the same attack/defense snapshot n_rows times (e.g. baseline MC)."""
        if n_rows < 1:
            raise ValueError("n_rows must be at least 1.")
        idx = [fixed._idx[t] for t in team_order]
        att = np.tile(fixed.attack[idx], (n_rows, 1))
        defense = np.tile(fixed.defense[idx], (n_rows, 1))
        return cls(
            team_order=list(team_order),
            attack=att,
            defense=defense,
            rho=fixed.rho,
            home_effect=fixed.home_effect,
        )
