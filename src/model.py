"""Dixon-Coles model for international football match prediction."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from numpy.typing import NDArray
from scipy.optimize import minimize
from scipy.special import gammaln
from scipy.stats import poisson

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

COLUMNS = [
    "date",
    "home_team",
    "away_team",
    "home_score",
    "away_score",
    "tournament",
    "neutral",
]


def load_and_prepare_data(
    min_date: str = "2023-01-01",
    min_opponents: int = 1,
    min_games: int = 1,
) -> tuple[pd.DataFrame, list[str]]:
    """Load match data, apply temporal weights, and filter teams via BFS."""
    data = pd.read_csv(DATA_DIR / "results.csv")
    data = data[data["date"] >= min_date][COLUMNS]

    data["date"] = pd.to_datetime(data["date"])
    data["weeks_since_min_date"] = (
        data["date"] - pd.to_datetime(min_date)
    ).dt.days // 7
    max_date = data["date"].max()
    weeks_size = (max_date - pd.to_datetime(min_date)).days // 7
    data["game_weight"] = 0.3 + 0.7 * (data["weeks_since_min_date"] / weeks_size)

    teams_to_evaluate = {"Brazil"}
    teams_to_consider: set[str] = set()
    while teams_to_evaluate:
        team = teams_to_evaluate.pop()
        teams_to_consider.add(team)
        matches = data[(data["home_team"] == team) | (data["away_team"] == team)]
        unique_opponents = set(matches["home_team"].unique()) | set(
            matches["away_team"].unique()
        )
        unique_opponents.discard(team)
        if len(unique_opponents) <= min_opponents:
            teams_to_consider.discard(team)
            continue
        teams_to_evaluate.update(unique_opponents - teams_to_consider)

    data = data[
        data["home_team"].isin(teams_to_consider)
        & data["away_team"].isin(teams_to_consider)
    ]

    home_games = (
        data.groupby("home_team")
        .agg(home_games=("home_score", "size"), home_goals=("home_score", "sum"))
        .reset_index()
    )
    away_games = (
        data.groupby("away_team")
        .agg(away_games=("away_score", "size"), away_goals=("away_score", "sum"))
        .reset_index()
    )
    games = away_games.merge(
        home_games, left_on="away_team", right_on="home_team", how="outer"
    )
    for col in ("home_games", "away_games", "home_goals", "away_goals"):
        games[col] = games[col].fillna(0).astype(int)
    games["total_games"] = games["home_games"] + games["away_games"]
    games = games.sort_values("total_games", ascending=False, ignore_index=True)
    games["team"] = np.where(
        games["home_team"].isna(), games["away_team"], games["home_team"]
    )
    games = games[games["total_games"] >= min_games]
    teams = games["team"].tolist()

    data = data[data["home_team"].isin(teams) & data["away_team"].isin(teams)]
    return data, teams


class DixonColesModel:
    """Dixon-Coles bivariate Poisson model with analytical gradient."""

    def __init__(self) -> None:
        self.teams: list[str] = []
        self.strengths: NDArray[np.floating] = np.array([])
        self.home_effect: float = 0.0
        self.rho: float = 0.0
        self._fitted = False

    def fit(self, data: pd.DataFrame, teams: list[str]) -> None:
        self.teams = teams
        team_idx = {t: i for i, t in enumerate(teams)}
        n_teams = len(teams)

        home_idx = data["home_team"].map(team_idx).values
        away_idx = data["away_team"].map(team_idx).values
        home_score = data["home_score"].values.astype(float)
        away_score = data["away_score"].values.astype(float)
        has_home = ~data["neutral"].values
        weight = data["game_weight"].values

        home_log_fact = gammaln(home_score + 1)
        away_log_fact = gammaln(away_score + 1)

        m00 = (home_score == 0) & (away_score == 0)
        m10 = (home_score == 1) & (away_score == 0)
        m01 = (home_score == 0) & (away_score == 1)
        m11 = (home_score == 1) & (away_score == 1)

        def nll_and_grad(params: NDArray) -> tuple[float, NDArray]:
            he = params[-2]
            rho = params[-1]
            s = np.empty(n_teams)
            s[0] = 1.0
            s[1:] = params[:-2]

            hf = s[home_idx] + he * has_home
            af = s[away_idx]
            hl = hf / af
            al = af / hf
            log_r = np.log(hl)

            ll_h = home_score * log_r - hl - home_log_fact
            ll_a = -away_score * log_r - al - away_log_fact

            tau = np.ones(len(home_score))
            tau[m00] = 1 - rho
            tau[m10] = 1 + al[m10] * rho
            tau[m01] = 1 + hl[m01] * rho
            tau[m11] = 1 - rho

            if np.any(tau <= 0):
                return 1e10, np.zeros(len(params))

            nll = -float((weight * (ll_h + ll_a + np.log(tau))).sum())

            dt_dfh = np.zeros(len(home_score))
            dt_dfh[m10] = -al[m10] * rho / (hf[m10] * tau[m10])
            dt_dfh[m01] = rho / (af[m01] * tau[m01])

            dt_dfa = np.zeros(len(home_score))
            dt_dfa[m10] = rho / (hf[m10] * tau[m10])
            dt_dfa[m01] = -hl[m01] * rho / (af[m01] * tau[m01])

            sd = home_score - away_score
            dnll_dfh = -weight * (sd / hf - 1 / af + af / hf**2 + dt_dfh)
            dnll_dfa = -weight * (-sd / af + hf / af**2 - 1 / hf + dt_dfa)

            sg = np.zeros(n_teams)
            np.add.at(sg, home_idx, dnll_dfh)
            np.add.at(sg, away_idx, dnll_dfa)

            grad = np.empty(len(params))
            grad[:-2] = sg[1:]
            grad[-2] = (dnll_dfh * has_home).sum()

            dt_drho = np.zeros(len(home_score))
            dt_drho[m00] = -1 / tau[m00]
            dt_drho[m10] = al[m10] / tau[m10]
            dt_drho[m01] = hl[m01] / tau[m01]
            dt_drho[m11] = -1 / tau[m11]
            grad[-1] = -(weight * dt_drho).sum()

            return nll, grad

        bounds = [(1e-6, None)] * (n_teams - 1)
        bounds.append((1e-6, None))
        bounds.append((-1.0 + 1e-6, 1.0 - 1e-6))

        x0 = np.ones(n_teams + 1)
        x0[-1] = 0.0

        res = minimize(
            nll_and_grad,
            x0,
            method="L-BFGS-B",
            jac=True,
            bounds=bounds,
            options={"maxiter": 10_000, "maxfun": 500_000},
        )
        if not res.success:
            raise RuntimeError(f"Optimization failed: {res.message}")

        self.strengths = np.concatenate([[1.0], res.x[:-2]])
        self.home_effect = float(res.x[-2])
        self.rho = float(res.x[-1])
        self._fitted = True

    def get_strength(self, team: str) -> float:
        return float(self.strengths[self.teams.index(team)])

    def match_probs(
        self,
        home: str,
        away: str,
        neutral: bool = True,
        max_goals: int = 10,
        lambda_scale: float = 1.0,
    ) -> NDArray[np.floating]:
        """Return (max_goals+1) x (max_goals+1) score probability matrix."""
        hs = self.get_strength(home)
        as_ = self.get_strength(away)
        if not neutral:
            hs += self.home_effect

        hl = hs / as_ * lambda_scale
        al = as_ / hs * lambda_scale
        goals = np.arange(max_goals + 1)
        prob = np.outer(poisson.pmf(goals, hl), poisson.pmf(goals, al))

        prob[0, 0] *= 1 - hl * al * self.rho
        prob[1, 0] *= 1 + al * self.rho
        prob[0, 1] *= 1 + hl * self.rho
        prob[1, 1] *= 1 - self.rho
        prob /= prob.sum()
        return prob

    def simulate_match(
        self,
        home: str,
        away: str,
        neutral: bool = True,
        rng: np.random.Generator | None = None,
    ) -> tuple[int, int]:
        """Simulate a single match, returning (home_goals, away_goals)."""
        if rng is None:
            rng = np.random.default_rng()
        prob = self.match_probs(home, away, neutral=neutral)
        mg = prob.shape[0]
        idx = rng.choice(mg * mg, p=prob.ravel())
        return int(idx // mg), int(idx % mg)

    def win_draw_loss(
        self,
        home: str,
        away: str,
        neutral: bool = True,
    ) -> tuple[float, float, float]:
        """Return (home_win_prob, draw_prob, away_win_prob)."""
        prob = self.match_probs(home, away, neutral=neutral)
        hw = float(np.tril(prob, k=-1).sum())
        d = float(np.trace(prob))
        aw = float(np.triu(prob, k=1).sum())
        return hw, d, aw


def build_model(min_date: str = "2023-01-01") -> DixonColesModel:
    """Convenience function: load data, fit model, return it."""
    data, teams = load_and_prepare_data(min_date=min_date)
    model = DixonColesModel()
    model.fit(data, teams)
    return model
