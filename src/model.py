"""Dixon-Coles model for international football match prediction."""

from __future__ import annotations

import numpy as np
import pandas as pd
from numpy.typing import NDArray
from scipy.optimize import minimize
from scipy.special import gammaln

from src.constants import (
    COLUMNS,
    DATA_DIR,
    DEFAULT_HALF_LIFE_WEEKS,
    DEFAULT_MIN_DATE,
    DEFAULT_REG_LAMBDA,
    DEFAULT_TOURNAMENT_WEIGHT,
    TOURNAMENT_WEIGHT,
)
from src.data_classes import TournamentModelParams
from src.dixon_coles_base import BaseDixonColesMatchModel


def load_and_prepare_data(
    min_date: str = DEFAULT_MIN_DATE,
    min_opponents: int = 1,
    min_games: int = 1,
    half_life_weeks: float = DEFAULT_HALF_LIFE_WEEKS,
    extra_data: pd.DataFrame | None = None,
) -> tuple[pd.DataFrame, list[str]]:
    """Load match data, apply temporal weights, and filter teams via BFS."""
    data = pd.read_csv(DATA_DIR / "results.csv")
    data = data[data["date"] >= min_date][COLUMNS]

    if extra_data is not None:
        data = pd.concat([data, extra_data[COLUMNS]], ignore_index=True)

    # Scheduled fixtures (e.g. future World Cup games) often have empty scores.
    data = data.dropna(subset=["home_score", "away_score"])

    data["date"] = pd.to_datetime(data["date"])
    max_date = data["date"].max()
    weeks_ago = (max_date - data["date"]).dt.days / 7.0

    time_weight = 0.3 + 0.7 * np.power(2.0, -weeks_ago / half_life_weeks)
    tourn_weight = (
        data["tournament"].map(TOURNAMENT_WEIGHT).fillna(DEFAULT_TOURNAMENT_WEIGHT)
    )
    data["game_weight"] = time_weight * tourn_weight

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


class DixonColesModel(BaseDixonColesMatchModel):
    """Dixon-Coles model with separate attack/defense and regularization (MLE)."""

    def __init__(self, reg_lambda: float = DEFAULT_REG_LAMBDA) -> None:
        self.teams: list[str] = []
        self.attack: NDArray[np.floating] = np.array([])
        self.defense: NDArray[np.floating] = np.array([])
        self.home_effect: float = 1.0
        self.rho: float = 0.0
        self.reg_lambda = reg_lambda
        self._fitted = False

    def get_rho(self) -> float:
        return float(self.rho)

    def get_home_effect(self) -> float:
        return float(self.home_effect)

    def fit(self, data: pd.DataFrame, teams: list[str]) -> None:
        self.teams = teams
        team_idx = {t: i for i, t in enumerate(teams)}
        n = len(teams)
        reg = self.reg_lambda

        hi = data["home_team"].map(team_idx).values
        ai = data["away_team"].map(team_idx).values
        hs = data["home_score"].values.astype(float)
        a_s = data["away_score"].values.astype(float)
        has_home = (~data["neutral"].values).astype(float)
        w = data["game_weight"].values
        hs_lf = gammaln(hs + 1)
        as_lf = gammaln(a_s + 1)

        m00 = (hs == 0) & (a_s == 0)
        m10 = (hs == 1) & (a_s == 0)
        m01 = (hs == 0) & (a_s == 1)
        m11 = (hs == 1) & (a_s == 1)

        # params: [a[0..n-1], d[0..n-1], gamma, rho]
        # att = exp(a - mean(a)), def_ = exp(d - mean(d))
        def nll_and_grad(params: NDArray) -> tuple[float, NDArray]:
            a_raw = params[:n]
            d_raw = params[n : 2 * n]
            gamma = params[-2]
            rho = params[-1]

            ac = a_raw - a_raw.mean()
            dc = d_raw - d_raw.mean()
            att = np.exp(ac)
            df = np.exp(dc)

            g = np.where(has_home, gamma, 1.0)
            hl = att[hi] * df[ai] * g
            al = att[ai] * df[hi]

            ll_h = hs * np.log(hl) - hl - hs_lf
            ll_a = a_s * np.log(al) - al - as_lf

            tau = np.ones_like(hl)
            tau[m00] = 1 - hl[m00] * al[m00] * rho
            tau[m10] = 1 + al[m10] * rho
            tau[m01] = 1 + hl[m01] * rho
            tau[m11] = 1 - rho

            if np.any(tau <= 0):
                return 1e10, np.zeros(len(params))

            nll = -float((w * (ll_h + ll_a + np.log(tau))).sum())
            nll += reg * float((ac**2).sum() + (dc**2).sum())

            # ∂log(τ)/∂hl and ∂log(τ)/∂al
            dtau_dhl = np.zeros_like(hl)
            dtau_dhl[m00] = -al[m00] * rho
            dtau_dhl[m01] = rho
            dlt_dhl = dtau_dhl / tau

            dtau_dal = np.zeros_like(al)
            dtau_dal[m00] = -hl[m00] * rho
            dtau_dal[m10] = rho
            dlt_dal = dtau_dal / tau

            dll_dhl = hs / hl - 1 + dlt_dhl
            dll_dal = a_s / al - 1 + dlt_dal

            # Gradient w.r.t. centered log-attack (a_c)
            ac_g = np.zeros(n)
            np.add.at(ac_g, hi, w * dll_dhl * hl)
            np.add.at(ac_g, ai, w * dll_dal * al)
            ac_g = -ac_g + 2 * reg * ac

            # Gradient w.r.t. centered log-defense (d_c)
            dc_g = np.zeros(n)
            np.add.at(dc_g, ai, w * dll_dhl * hl)
            np.add.at(dc_g, hi, w * dll_dal * al)
            dc_g = -dc_g + 2 * reg * dc

            # Chain rule: ∂f/∂a[k] = ∂f/∂ac[k] - mean(∂f/∂ac)
            a_g = ac_g - ac_g.mean()
            d_g = dc_g - dc_g.mean()

            # Home-effect gradient
            mask = has_home.astype(bool)
            gamma_g = -float((w[mask] * dll_dhl[mask] * hl[mask] / gamma).sum())

            # Rho gradient
            dt_drho = np.zeros_like(hl)
            dt_drho[m00] = -hl[m00] * al[m00]
            dt_drho[m10] = al[m10]
            dt_drho[m01] = hl[m01]
            dt_drho[m11] = -1
            rho_g = -float((w * dt_drho / tau).sum())

            grad = np.empty(len(params))
            grad[:n] = a_g
            grad[n : 2 * n] = d_g
            grad[-2] = gamma_g
            grad[-1] = rho_g
            return nll, grad

        bounds: list[tuple[float | None, float | None]] = []
        bounds += [(None, None)] * (2 * n)  # a, d unconstrained
        bounds += [(0.5, 3.0)]  # gamma
        bounds += [(-1.0 + 1e-6, 1.0 - 1e-6)]  # rho

        x0 = np.zeros(2 * n + 2)
        x0[-2] = 1.2
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

        ac = res.x[:n] - res.x[:n].mean()
        dc = res.x[n : 2 * n] - res.x[n : 2 * n].mean()
        self.attack = np.exp(ac)
        self.defense = np.exp(dc)
        self.home_effect = float(res.x[-2])
        self.rho = float(res.x[-1])
        self._fitted = True

    def fitted_parameters(self) -> TournamentModelParams:
        """Snapshot of fitted parameters for tournament simulation."""
        if not self._fitted:
            raise RuntimeError("Call fit() before fitted_parameters().")
        return TournamentModelParams(
            teams=list(self.teams),
            attack=np.asarray(self.attack, dtype=float).copy(),
            defense=np.asarray(self.defense, dtype=float).copy(),
            rho=float(self.rho),
            home_effect=float(self.home_effect),
        )

    def get_attack(self, team: str) -> float:
        return float(self.attack[self.teams.index(team)])

    def get_defense(self, team: str) -> float:
        return float(self.defense[self.teams.index(team)])


def build_model(
    min_date: str = DEFAULT_MIN_DATE,
    half_life_weeks: float = DEFAULT_HALF_LIFE_WEEKS,
    reg_lambda: float = DEFAULT_REG_LAMBDA,
    extra_data: pd.DataFrame | None = None,
) -> DixonColesModel:
    """Convenience function: load data, fit model, return it."""
    data, teams = load_and_prepare_data(
        min_date=min_date,
        half_life_weeks=half_life_weeks,
        extra_data=extra_data,
    )
    model = DixonColesModel(reg_lambda=reg_lambda)
    model.fit(data, teams)
    return model
