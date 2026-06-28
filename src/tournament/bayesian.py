"""Bayesian World Cup 2026 tournament simulation using Stan posterior draws."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from src.constants import (
    DEFAULT_HOST_BOOST,
    DEFAULT_SEED,
    FIFA_THIRD_PLACE_TABLE,
    GROUPS,
    TEAM_MAP_EN_TO_PT,
    WC_YEAR,
)
from src.model.bayesian import BayesianDixonColesModel
from src.tournament.base import TournamentResult, TournamentSimulator

# Precomputed factorials for score probabilities from 0 to 10 goals.
_FACTORIALS = np.array(
    [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800], dtype=np.float32
)
_NUM_TO_WORD = {0: "zero", 1: "one", 2: "two", 3: "three", 4: "four"}

_GROUP_LETTERS = "".join(GROUPS.keys())
_LETTER_TO_IDX = {c: i for i, c in enumerate(_GROUP_LETTERS)}


# ── Module-level simulation primitives ───────────────────────────────────────


def simulate_matches(
    mu1: np.ndarray,
    mu2: np.ndarray,
    rho_draws: np.ndarray | None = None,
    n_sim: int = 100_000,
    max_goals: int = 10,
) -> tuple[np.ndarray, np.ndarray]:
    """Vectorized Poisson match simulation with optional Dixon-Coles correction."""
    if rho_draws is None:
        return np.random.poisson(mu1), np.random.poisson(mu2)

    if mu1.ndim == 1:
        mu1, mu2, rho_draws = mu1[:, None], mu2[:, None], rho_draws[:, None]

    mu1 = np.asarray(mu1, dtype=np.float32)
    mu2 = np.asarray(mu2, dtype=np.float32)
    rho_draws = np.asarray(rho_draws, dtype=np.float32)

    n_matches = mu1.shape[1]
    goals = np.arange(max_goals + 1, dtype=np.float32)

    mu1_exp = mu1[:, :, None, None]
    mu2_exp = mu2[:, :, None, None]

    p1 = (
        np.exp(-mu1_exp)
        * (mu1_exp ** goals[None, None, :, None])
        / _FACTORIALS[None, None, :, None]
    )
    p2 = (
        np.exp(-mu2_exp)
        * (mu2_exp ** goals[None, None, None, :])
        / _FACTORIALS[None, None, None, :]
    )

    p_matrix = p1 * p2

    rho_exp = rho_draws[:, :, None, None]
    p_matrix[:, :, 0, 0] *= (1 - mu1_exp * mu2_exp * rho_exp)[:, :, 0, 0]
    p_matrix[:, :, 1, 0] *= (1 + mu2_exp * rho_exp)[:, :, 0, 0]
    p_matrix[:, :, 0, 1] *= (1 + mu1_exp * rho_exp)[:, :, 0, 0]
    p_matrix[:, :, 1, 1] *= (1 - rho_exp)[:, :, 0, 0]

    p_matrix = np.clip(p_matrix, a_min=0, a_max=None)

    p_flat = p_matrix.reshape(n_sim, n_matches, -1)
    p_flat /= p_flat.sum(axis=2, keepdims=True)

    cum_p = np.cumsum(p_flat, axis=2)
    rand_vals = np.random.rand(n_sim, n_matches, 1).astype(np.float32)

    score_idx = np.argmax(cum_p > rand_vals, axis=2)
    return score_idx // (max_goals + 1), score_idx % (max_goals + 1)


def _match_lambdas(
    atk: np.ndarray,
    dfn: np.ndarray,
    home_idx: int | np.ndarray,
    away_idx: int | np.ndarray,
    et: np.ndarray,
) -> tuple[np.ndarray, np.ndarray]:
    """Poisson intensities with Stan ``eta`` added on both sides (log-scale)."""
    n_sim = atk.shape[0]
    if np.isscalar(home_idx):
        # et shape (n_sim,) — no reshape needed; scalar column index keeps (n_sim,)
        return (
            np.exp(atk[:, home_idx] - dfn[:, away_idx] + et),
            np.exp(atk[:, away_idx] - dfn[:, home_idx] + et),
        )
    et = et.reshape(-1, 1)
    if isinstance(home_idx, np.ndarray) and home_idx.ndim == 1:
        # 1-D index array → result shape (n_sim, len(idx))
        return (
            np.exp(atk[:, home_idx] - dfn[:, away_idx] + et),
            np.exp(atk[:, away_idx] - dfn[:, home_idx] + et),
        )
    row_idx = np.arange(n_sim)[:, None]
    return (
        np.exp(atk[row_idx, home_idx] - dfn[row_idx, away_idx] + et),
        np.exp(atk[row_idx, away_idx] - dfn[row_idx, home_idx] + et),
    )


def _aggregate_match_probs(g1: np.ndarray, g2: np.ndarray) -> dict[str, float]:
    """Empirical outcome and scoreline probabilities (%) from simulated goals."""
    row: dict[str, float] = {
        "home_win": float(np.mean(g1 > g2) * 100),
        "draw": float(np.mean(g1 == g2) * 100),
        "away_win": float(np.mean(g1 < g2) * 100),
    }
    for i in range(5):
        for j in range(5):
            row[f"{_NUM_TO_WORD[i]}_{_NUM_TO_WORD[j]}"] = float(
                np.mean((g1 == i) & (g2 == j)) * 100
            )
    return row


def _aggregate_batch_probs(g1: np.ndarray, g2: np.ndarray) -> list[dict[str, float]]:
    """Vectorized version of _aggregate_match_probs for a batch of matches.

    g1, g2: shape (n_sim, n_pairs)
    Returns a list of n_pairs dicts, same keys as _aggregate_match_probs.
    """
    n_sim, n_pairs = g1.shape

    home_win = np.mean(g1 > g2, axis=0) * 100
    draw = np.mean(g1 == g2, axis=0) * 100
    away_win = np.mean(g1 < g2, axis=0) * 100

    # One-pass 2D histogram via offset bincount.
    # Goals > 4 are routed to a discard bucket at index n_pairs * 25.
    waste = n_pairs * 25
    score_idx = np.where(
        (g1 <= 4) & (g2 <= 4),
        g1 * 5 + g2 + np.arange(n_pairs, dtype=np.intp)[None, :] * 25,
        waste,
    )
    counts = np.bincount(score_idx.ravel(), minlength=waste + 1)[:-1]
    scorelines = counts.reshape(n_pairs, 5, 5) * (100.0 / n_sim)

    results: list[dict[str, float]] = []
    for m in range(n_pairs):
        row: dict[str, float] = {
            "home_win": float(home_win[m]),
            "draw": float(draw[m]),
            "away_win": float(away_win[m]),
        }
        for i in range(5):
            for j in range(5):
                row[f"{_NUM_TO_WORD[i]}_{_NUM_TO_WORD[j]}"] = float(scorelines[m, i, j])
        results.append(row)
    return results


def _load_schedule_orientations(
    results_path: str | Path = "data/results.csv",
    wc_year: int = WC_YEAR,
) -> dict[frozenset[str], tuple[str, str, str, object]]:
    """Map unordered EN pair -> (home_en, away_en, group, date) from results.csv."""
    results_df = (
        pd.read_csv(results_path)
        if not isinstance(results_path, pd.DataFrame)
        else results_path.copy()
    )
    wc = results_df[
        (results_df["tournament"] == "FIFA World Cup")
        & (pd.to_datetime(results_df["date"]).dt.year == wc_year)
    ]
    team_to_group: dict[str, str] = {t: g for g, teams in GROUPS.items() for t in teams}
    orientations: dict[frozenset[str], tuple[str, str, str, object]] = {}
    for row in wc.itertuples(index=False):
        home_en, away_en = row.home_team, row.away_team
        group = team_to_group.get(home_en, team_to_group.get(away_en, ""))
        orientations[frozenset({home_en, away_en})] = (
            home_en,
            away_en,
            group,
            row.date,
        )
    return orientations


def _resolve_fixture_orientation(
    team_a_en: str,
    team_b_en: str,
    schedule: dict[frozenset[str], tuple[str, str, str, object]],
) -> tuple[str, str, str | None, object | None]:
    scheduled = schedule.get(frozenset({team_a_en, team_b_en}))
    if scheduled is None:
        return team_a_en, team_b_en, None, None
    return scheduled


def _sample_posterior(
    post_draws: dict[str, np.ndarray],
    n_sim: int,
    seed: int | None = None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray | None, np.ndarray]:
    if seed is not None:
        np.random.seed(seed)
    n_samples = len(post_draws["attack"])
    sample_idx = np.random.choice(n_samples, n_sim)
    atk = post_draws["attack"][sample_idx].astype(np.float32)
    dfn = post_draws["defense"][sample_idx].astype(np.float32)
    rho = (
        post_draws["rho"][sample_idx].astype(np.float32)
        if "rho" in post_draws
        else None
    )
    et = post_draws["eta"][sample_idx].astype(np.float32)
    return atk, dfn, rho, et


# ── Bayesian tournament class ─────────────────────────────────────────────────


class BayesianWorldCup2026(TournamentSimulator):
    """Simulate the FIFA World Cup 2026 using Stan posterior draws.

    Implements :class:`TournamentSimulator`; ``simulate(n)`` returns a
    :class:`TournamentResult`.  Group-stage match probabilities and the
    deterministic bracket are cached after each call and accessible via
    ``last_group_matches`` and ``last_bracket``.
    """

    def __init__(
        self,
        model: BayesianDixonColesModel,
        *,
        seed: int = DEFAULT_SEED,
        known_results: dict[tuple[str, str], tuple[int, int]] | None = None,
        host_boost: float = DEFAULT_HOST_BOOST,
        schedule_path: str | Path = "data/results.csv",
        export_all_matchups: bool = True,
    ) -> None:
        self._model = model
        self._seed = seed
        self._known_results = known_results
        self._host_boost = host_boost
        self._schedule_path = schedule_path
        self._export_all_matchups = export_all_matchups

        self._last_group_matches: pd.DataFrame | None = None
        self._last_bracket: pd.DataFrame | None = None
        self._last_pair_goals_cache: (
            dict[tuple[str, str], tuple[np.ndarray, np.ndarray]] | None
        ) = None

        # Resolve WC group teams using the model's team list.
        self.groups: dict[str, list[str]] = {}
        for gname, teams in GROUPS.items():
            resolved = []
            for t in teams:
                if t in model.teams or t in model._team_idx:
                    resolved.append(t)
                else:
                    resolved.append(t)
            self.groups[gname] = resolved

    @property
    def last_group_matches(self) -> pd.DataFrame | None:
        """Group-stage match probability DataFrame from the last simulate() call."""
        return self._last_group_matches

    @property
    def last_bracket(self) -> pd.DataFrame | None:
        """Bracket probability DataFrame from the last simulate() call."""
        return self._last_bracket

    @property
    def last_pair_goals_cache(self) -> dict | None:
        return self._last_pair_goals_cache

    def simulate(self, n: int = 100_000) -> TournamentResult:
        """Run *n* simulations; populate ``last_group_matches`` and ``last_bracket``."""
        draws = self._model.draws
        atk, dfn, rho, et = _sample_posterior(draws, n, seed=self._seed)

        uses_dc = rho is not None
        t_to_idx = {name: i for i, name in enumerate(self._model.teams)}
        g_indices = np.array([[t_to_idx[t] for t in ts] for ts in self.groups.values()])
        schedule = _load_schedule_orientations(self._schedule_path)

        n_teams = len(self._model.teams)
        original_stages = [
            "avancou_grupos",
            "round_of_32",
            "round_of_16",
            "quarter_finalists",
            "semi_finalists",
            "finalists",
            "champion",
        ]
        extra_stages = ["group_first_place", "group_second_place", "group_third_place"]
        stats = {f: np.zeros(n_teams) for f in original_stages + extra_stages}

        # Build date lookup from results.csv (WC matches, English names).
        date_map: dict[frozenset, object] = {}
        for pair, (_, _, _, date) in schedule.items():
            ids = [t_to_idx.get(t) for t in pair]
            if all(i is not None for i in ids):
                date_map[frozenset(ids)] = date

        # ── Group stage ──────────────────────────────────────────────────────
        match_stats: list[dict] = []
        pair_goals_cache: dict[tuple[str, str], tuple[np.ndarray, np.ndarray]] = {}

        pairs = [(0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)]
        pts = np.zeros((n, 12, 4))
        sg = np.zeros((n, 12, 4))
        gp = np.zeros((n, 12, 4))
        pair_goals: dict[tuple[int, int], tuple[np.ndarray, np.ndarray]] = {}

        for p1, p2 in pairs:
            i1, i2 = g_indices[:, p1], g_indices[:, p2]
            l1, l2 = _match_lambdas(atk, dfn, i1, i2, et)
            rho_exp = np.repeat(rho[:, None], 12, axis=1) if uses_dc else None
            g1, g2 = simulate_matches(l1, l2, rho_exp, n)

            for g in range(12):
                t1_idx, t2_idx = g_indices[g, p1], g_indices[g, p2]
                team1, team2 = self._model.teams[t1_idx], self._model.teams[t2_idx]
                match_date = date_map.get(
                    frozenset([t1_idx, t2_idx]), "Data não encontrada"
                )
                home_en, away_en, sched_group, sched_date = (
                    _resolve_fixture_orientation(team1, team2, schedule)
                )
                if self._known_results and (home_en, away_en) in self._known_results:
                    kh, ka = self._known_results[(home_en, away_en)]
                    if team1 == home_en:
                        g1[:, g] = kh
                        g2[:, g] = ka
                    else:
                        g1[:, g] = ka
                        g2[:, g] = kh
                g1_g, g2_g = g1[:, g], g2[:, g]
                hg, ag = (g1_g, g2_g) if team1 == home_en else (g2_g, g1_g)
                pair_goals_cache[(home_en, away_en)] = (hg, ag)

                group_names = list(self.groups.keys())
                match_stats.append(
                    {
                        "group": sched_group or group_names[g],
                        "home_team": home_en,
                        "away_team": away_en,
                        "date": sched_date if sched_date is not None else match_date,
                        **_aggregate_match_probs(hg, ag),
                    }
                )

            pts[:, :, p1] += (g1 > g2) * 3 + (g1 == g2)
            pts[:, :, p2] += (g2 > g1) * 3 + (g1 == g2)
            sg[:, :, p1] += g1 - g2
            sg[:, :, p2] += g2 - g1
            gp[:, :, p1] += g1
            gp[:, :, p2] += g2
            pair_goals[(p1, p2)] = (g1, g2)

        # Tiebreaker 1: head-to-head record among pts-tied teams within the group.
        # For each pair (p1, p2), h2h stats are added only when both teams share
        # the same overall points total (the FIFA rule: "among tied teams only").
        h2h_pts_sum = np.zeros((n, 12, 4))
        h2h_sg_sum = np.zeros((n, 12, 4))
        h2h_gp_sum = np.zeros((n, 12, 4))
        for (p1, p2), (g1_h, g2_h) in pair_goals.items():
            tied = pts[:, :, p1] == pts[:, :, p2]
            h2h_pts_sum[:, :, p1] += ((g1_h > g2_h) * 3 + (g1_h == g2_h)) * tied
            h2h_pts_sum[:, :, p2] += ((g2_h > g1_h) * 3 + (g1_h == g2_h)) * tied
            h2h_sg_sum[:, :, p1] += (g1_h - g2_h) * tied
            h2h_sg_sum[:, :, p2] += (g2_h - g1_h) * tied
            h2h_gp_sum[:, :, p1] += g1_h * tied
            h2h_gp_sum[:, :, p2] += g2_h * tied

        # Composite sort key: pts → h2h pts → h2h GD → h2h GF → overall GD → overall GF.
        sort_val = (
            pts * 1e12
            + h2h_pts_sum * 1e10
            + (h2h_sg_sum + 90) * 1e7
            + h2h_gp_sum * 1e5
            + (sg + 90) * 1e2
            + gp
        )
        # Cross-group sort for best-third comparison: h2h is irrelevant across groups.
        cross_group_sort_val = pts * 1_000_000 + sg * 1_000 + gp
        ranks = np.argsort(-sort_val, axis=2)

        def count_stage(stage_array: np.ndarray, stage_name: str) -> None:
            unique, counts = np.unique(stage_array, return_counts=True)
            stats[stage_name][unique] += counts

        firsts = np.zeros((n, 12), dtype=int)
        seconds = np.zeros((n, 12), dtype=int)
        all_thirds = np.zeros((n, 12), dtype=int)
        third_place_scores = np.zeros((n, 12))

        for g in range(12):
            firsts[:, g] = g_indices[g, ranks[:, g, 0]]
            seconds[:, g] = g_indices[g, ranks[:, g, 1]]
            all_thirds[:, g] = g_indices[g, ranks[:, g, 2]]
            third_place_scores[:, g] = cross_group_sort_val[
                np.arange(n), g, ranks[:, g, 2]
            ]
            count_stage(firsts[:, g], "group_first_place")
            count_stage(seconds[:, g], "group_second_place")
            count_stage(all_thirds[:, g], "group_third_place")

        best_3rd_group_idx = np.argsort(-third_place_scores, axis=1)[:, :8]
        sorted_thirds = np.sort(best_3rd_group_idx, axis=1)

        # Third-place slot allocation (same rules as frequentist path).
        valid_groups_for_1st_idx = {
            4: [0, 1, 2, 3, 5],
            8: [2, 3, 5, 6, 7],
            3: [1, 4, 5, 8, 9],
            6: [0, 4, 7, 8, 9],
            0: [2, 4, 5, 7, 8],
            11: [4, 7, 8, 9, 10],
            1: [4, 5, 6, 8, 9],
            10: [3, 4, 8, 9, 11],
        }
        slots_idx = [4, 8, 3, 6, 0, 11, 1, 10]
        allocation_cache: dict[tuple, list] = {}

        def get_allocation(thirds_tuple: tuple) -> list:
            if thirds_tuple in allocation_cache:
                return allocation_cache[thirds_tuple]

            # Use FIFA official table when the combination is known.
            thirds_key = frozenset(_GROUP_LETTERS[i] for i in thirds_tuple)
            if thirds_key in FIFA_THIRD_PLACE_TABLE:
                fifa = FIFA_THIRD_PLACE_TABLE[thirds_key]
                alloc_map = {
                    _LETTER_TO_IDX[slot]: _LETTER_TO_IDX[grp]
                    for slot, grp in fifa.items()
                }
                res = [alloc_map[s] for s in slots_idx]
                allocation_cache[thirds_tuple] = res
                return res

            # Fall back to backtracking for unrecognized combinations.
            thirds_list = list(thirds_tuple)
            alloc: dict = {}

            def backtrack(idx: int, available: list) -> bool:
                if idx == 8:
                    return True
                slot = slots_idx[idx]
                for t in available:
                    if t in valid_groups_for_1st_idx[slot]:
                        alloc[slot] = t
                        new_avail = available.copy()
                        new_avail.remove(t)
                        if backtrack(idx + 1, new_avail):
                            return True
                        del alloc[slot]
                return False

            if backtrack(0, thirds_list):
                res = [alloc[s] for s in slots_idx]
            else:
                res = thirds_list.copy()
            allocation_cache[thirds_tuple] = res
            return res

        allocated_thirds = np.zeros((n, 8), dtype=int)
        for i in range(n):
            allocated_thirds[i] = get_allocation(tuple(sorted_thirds[i]))

        # ── Build R32 bracket ─────────────────────────────────────────────────
        row_idx = np.arange(n)
        r32 = np.zeros((n, 32), dtype=int)
        r32[:, 0], r32[:, 1] = firsts[:, 4], all_thirds[row_idx, allocated_thirds[:, 0]]
        r32[:, 2], r32[:, 3] = firsts[:, 8], all_thirds[row_idx, allocated_thirds[:, 1]]
        r32[:, 4], r32[:, 5] = seconds[:, 0], seconds[:, 1]
        r32[:, 6], r32[:, 7] = firsts[:, 5], seconds[:, 2]
        r32[:, 8], r32[:, 9] = seconds[:, 10], seconds[:, 11]
        r32[:, 10], r32[:, 11] = firsts[:, 7], seconds[:, 9]
        r32[:, 12], r32[:, 13] = (
            firsts[:, 3],
            all_thirds[row_idx, allocated_thirds[:, 2]],
        )
        r32[:, 14], r32[:, 15] = (
            firsts[:, 6],
            all_thirds[row_idx, allocated_thirds[:, 3]],
        )
        r32[:, 16], r32[:, 17] = firsts[:, 2], seconds[:, 5]
        r32[:, 18], r32[:, 19] = seconds[:, 4], seconds[:, 8]
        r32[:, 20], r32[:, 21] = (
            firsts[:, 0],
            all_thirds[row_idx, allocated_thirds[:, 4]],
        )
        r32[:, 22], r32[:, 23] = (
            firsts[:, 11],
            all_thirds[row_idx, allocated_thirds[:, 5]],
        )
        r32[:, 24], r32[:, 25] = firsts[:, 9], seconds[:, 7]
        r32[:, 26], r32[:, 27] = seconds[:, 3], seconds[:, 6]
        r32[:, 28], r32[:, 29] = (
            firsts[:, 1],
            all_thirds[row_idx, allocated_thirds[:, 6]],
        )
        r32[:, 30], r32[:, 31] = (
            firsts[:, 10],
            all_thirds[row_idx, allocated_thirds[:, 7]],
        )

        count_stage(r32, "avancou_grupos")
        count_stage(r32, "round_of_32")

        # ── Knockout rounds ──────────────────────────────────────────────────
        def play_round(competitors: np.ndarray) -> np.ndarray:
            k = competitors.shape[1] // 2
            a, b = competitors[:, 0::2], competitors[:, 1::2]
            la, lb = _match_lambdas(atk, dfn, a, b, et)
            rho_r = np.repeat(rho[:, None], k, axis=1) if uses_dc else None
            ga, gb = simulate_matches(la, lb, rho_r, n)
            wins = (ga > gb) | ((ga == gb) & (np.random.rand(n, k) < 0.5))
            return np.where(wins, a, b)

        r16 = play_round(r32)
        count_stage(r16, "round_of_16")
        qf = play_round(r16)
        count_stage(qf, "quarter_finalists")
        sf = play_round(qf)
        count_stage(sf, "semi_finalists")
        fin = play_round(sf)
        count_stage(fin, "finalists")
        champ = play_round(fin)
        count_stage(champ, "champion")

        # ── Build group-match and bracket DataFrames ─────────────────────────
        df_matches = pd.DataFrame(match_stats)
        df_matches["home_team"] = df_matches["home_team"].replace(TEAM_MAP_EN_TO_PT)
        df_matches["away_team"] = df_matches["away_team"].replace(TEAM_MAP_EN_TO_PT)
        self._last_group_matches = df_matches
        self._last_pair_goals_cache = pair_goals_cache

        bracket_df = self._build_bracket_df(
            stats, n, t_to_idx, atk, dfn, rho, et, uses_dc
        )
        self._last_bracket = bracket_df

        # ── Convert to TournamentResult ───────────────────────────────────────
        wc_teams = [t for ts in self.groups.values() for t in ts]
        tr = TournamentResult(counts=n)
        for team in wc_teams:
            if team not in t_to_idx:
                continue
            i = t_to_idx[team]
            tr.group_stage[team] = n
            tr.first_place[team] = int(stats["group_first_place"][i])
            tr.second_place[team] = int(stats["group_second_place"][i])
            tr.third_place[team] = int(stats["group_third_place"][i])
            tr.round_of_32[team] = int(stats["avancou_grupos"][i])
            tr.round_of_16[team] = int(stats["round_of_16"][i])
            tr.quarterfinals[team] = int(stats["quarter_finalists"][i])
            tr.semifinals[team] = int(stats["semi_finalists"][i])
            tr.final[team] = int(stats["finalists"][i])
            tr.champion[team] = int(stats["champion"][i])
        return tr

    def _build_bracket_df(
        self,
        stats: dict,
        n: int,
        t_to_idx: dict,
        atk: np.ndarray,
        dfn: np.ndarray,
        rho: np.ndarray | None,
        et: np.ndarray,
        uses_dc: bool,
    ) -> pd.DataFrame:
        """Build the deterministic display bracket from most-likely paths."""
        df_summary_map = {
            self._model.teams[i]: {
                "champion": stats["champion"][i] / n * 100,
                "group_first_place": stats["group_first_place"][i] / n * 100,
                "group_second_place": stats["group_second_place"][i] / n * 100,
                "group_third_place": stats["group_third_place"][i] / n * 100,
                "round_of_32": stats["avancou_grupos"][i] / n * 100,
            }
            for i in range(len(self._model.teams))
        }

        group_winners: dict[str, str] = {}
        group_runners: dict[str, str] = {}
        third_places: list[dict] = []

        for g_name, g_teams in self.groups.items():
            first = max(
                g_teams,
                key=lambda t: df_summary_map.get(t, {}).get("group_first_place", 0),
            )
            group_winners[g_name] = first
            rest = [t for t in g_teams if t != first]
            second = max(
                rest,
                key=lambda t: df_summary_map.get(t, {}).get("group_second_place", 0),
            )
            group_runners[g_name] = second
            remaining = [t for t in rest if t != second]
            third = max(
                remaining,
                key=lambda t: df_summary_map.get(t, {}).get("group_third_place", 0),
            )
            prob_adv = df_summary_map.get(third, {}).get("round_of_32", 0.0)
            third_places.append({"g_name": g_name, "team": third, "prob": prob_adv})

        best_thirds = sorted(third_places, key=lambda x: x["prob"], reverse=True)[:8]
        best_thirds_groups = [t["g_name"] for t in best_thirds]

        valid_groups_for_1st = {
            "E": ["A", "B", "C", "D", "F"],
            "I": ["C", "D", "F", "G", "H"],
            "D": ["B", "E", "F", "I", "J"],
            "G": ["A", "E", "H", "I", "J"],
            "A": ["C", "E", "F", "H", "I"],
            "L": ["E", "H", "I", "J", "K"],
            "B": ["E", "F", "G", "I", "J"],
            "K": ["D", "E", "I", "J", "L"],
        }

        assigned_thirds: dict[str, str] = dict.fromkeys(valid_groups_for_1st, "TBD")
        slots = list(valid_groups_for_1st)
        allocation: dict[str, str] = {}

        def allocate_thirds(index: int, available: list) -> bool:
            if index == len(slots):
                return True
            slot = slots[index]
            for t_group in available:
                if t_group in valid_groups_for_1st[slot]:
                    allocation[slot] = t_group
                    new_available = available.copy()
                    new_available.remove(t_group)
                    if allocate_thirds(index + 1, new_available):
                        return True
                    del allocation[slot]
            return False

        thirds_key = frozenset(best_thirds_groups)
        if thirds_key in FIFA_THIRD_PLACE_TABLE:
            for slot, group_letter in FIFA_THIRD_PLACE_TABLE[thirds_key].items():
                team_name = next(
                    t["team"] for t in best_thirds if t["g_name"] == group_letter
                )
                assigned_thirds[slot] = team_name
        elif allocate_thirds(0, best_thirds_groups):
            for slot, group_letter in allocation.items():
                team_name = next(
                    t["team"] for t in best_thirds if t["g_name"] == group_letter
                )
                assigned_thirds[slot] = team_name

        r32_matches = [
            # ── Left half ──────────────────────────────────────────────────
            (group_winners["E"], assigned_thirds["E"]),  # L1: M74 → R16 M89
            (group_winners["I"], assigned_thirds["I"]),  # L2: M77 → R16 M89
            (group_runners["A"], group_runners["B"]),  # L3: M73 → R16 M90
            (group_winners["F"], group_runners["C"]),  # L4: M75 → R16 M90
            (group_runners["K"], group_runners["L"]),  # L5: M83 → R16 M93
            (group_winners["H"], group_runners["J"]),  # L6: M84 → R16 M93
            (group_winners["D"], assigned_thirds["D"]),  # L7: M81 → R16 M94
            (group_winners["G"], assigned_thirds["G"]),  # L8: M82 → R16 M94
            # ── Right half ─────────────────────────────────────────────────
            (group_winners["C"], group_runners["F"]),  # R1: M76 → R16 M91
            (group_runners["E"], group_runners["I"]),  # R2: M78 → R16 M91
            (group_winners["A"], assigned_thirds["A"]),  # R3: M79 → R16 M92
            (group_winners["L"], assigned_thirds["L"]),  # R4: M80 → R16 M92
            (group_winners["J"], group_runners["H"]),  # R5: M86 → R16 M95
            (group_runners["D"], group_runners["G"]),  # R6: M88 → R16 M95
            (group_winners["B"], assigned_thirds["B"]),  # R7: M85 → R16 M96
            (group_winners["K"], assigned_thirds["K"]),  # R8: M87 → R16 M96
        ]

        order_map = {
            "L1": 1,
            "L2": 2,
            "L3": 3,
            "L4": 4,
            "L5": 5,
            "L6": 6,
            "L7": 7,
            "L8": 8,
            "RL1": 9,
            "RL2": 10,
            "RL3": 11,
            "RL4": 12,
            "QL1": 13,
            "QL2": 14,
            "SL": 15,
            "R1": 16,
            "R2": 17,
            "R3": 18,
            "R4": 19,
            "R5": 20,
            "R6": 21,
            "R7": 22,
            "R8": 23,
            "RR1": 24,
            "RR2": 25,
            "RR3": 26,
            "RR4": 27,
            "QR1": 28,
            "QR2": 29,
            "SR": 30,
            "F": 31,
            "T": 32,
        }

        final_rounds = [
            (
                "R32",
                0,
                r32_matches,
                [
                    "L1",
                    "L2",
                    "L3",
                    "L4",
                    "L5",
                    "L6",
                    "L7",
                    "L8",
                    "R1",
                    "R2",
                    "R3",
                    "R4",
                    "R5",
                    "R6",
                    "R7",
                    "R8",
                ],
            ),
            (
                "Oitavas",
                1,
                [],
                ["RL1", "RL2", "RL3", "RL4", "RR1", "RR2", "RR3", "RR4"],
            ),
            ("Quartas", 2, [], ["QL1", "QL2", "QR1", "QR2"]),
            ("Semifinal", 3, [], ["SL", "SR"]),
            ("3º Lugar", 4, [], ["T"]),
            ("Final", 4, [], ["F"]),
        ]

        bracket_data = []

        for i, (round_label, round_index, matches, ids) in enumerate(final_rounds):
            next_teams: list[str] = []
            next_losers: list[str] = []

            for m_idx, match in enumerate(matches):
                t1, t2 = match
                match_id = ids[m_idx]
                side = (
                    "terceiro"
                    if match_id == "T"
                    else "left"
                    if "L" in match_id
                    else "right"
                    if "R" in match_id
                    else "final"
                )

                if t1 == "TBD" or t2 == "TBD":
                    prob_t1 = 100.0 if t1 != "TBD" else 0.0
                    prob_t2 = 100.0 - prob_t1
                    winner = t1 if t1 != "TBD" else t2
                    loser = t2 if winner == t1 else t1
                    prob_adv_t1, prob_adv_t2 = prob_t1, prob_t2
                else:
                    idx1 = t_to_idx.get(t1)
                    idx2 = t_to_idx.get(t2)
                    if idx1 is None or idx2 is None:
                        prob_adv_t1, prob_adv_t2 = 50.0, 50.0
                        winner, loser = t1, t2
                    else:
                        la, lb = _match_lambdas(atk, dfn, idx1, idx2, et)
                        la = la.reshape(-1, 1)
                        lb = lb.reshape(-1, 1)
                        rho_exp = rho.reshape(-1, 1) if uses_dc else None
                        ga, gb = simulate_matches(la, lb, rho_exp, len(atk))
                        prob_t1 = float(np.mean(ga > gb) * 100)
                        prob_draw = float(np.mean(ga == gb) * 100)
                        prob_t2 = float(np.mean(gb > ga) * 100)
                        prob_adv_t1 = prob_t1 + prob_draw * 0.5
                        prob_adv_t2 = 100.0 - prob_adv_t1
                        winner = t1 if prob_adv_t1 >= prob_adv_t2 else t2
                        loser = t2 if winner == t1 else t1

                next_teams.append(winner)
                next_losers.append(loser)
                winner_side = "home" if prob_adv_t1 >= prob_adv_t2 else "away"

                bracket_data.append(
                    {
                        "side": side,
                        "round_index": round_index,
                        "round_label": round_label,
                        "order": order_map[match_id],
                        "id": match_id,
                        "home_team": t1,
                        "prob_home": round(prob_adv_t1, 2),
                        "away_team": t2,
                        "prob_away": round(prob_adv_t2, 2),
                        "winner": winner_side,
                    }
                )

            if round_label == "Semifinal":
                final_rounds[i + 1][2].append((next_losers[0], next_losers[1]))
                final_rounds[i + 2][2].append((next_teams[0], next_teams[1]))
            elif round_label not in ("Semifinal", "3º Lugar", "Final"):
                final_rounds[i + 1][2].extend(
                    list(zip(next_teams[0::2], next_teams[1::2], strict=False))
                )

        bracket_df = (
            pd.DataFrame(bracket_data)
            .sort_values("order")
            .reset_index(drop=True)[
                [
                    "side",
                    "round_index",
                    "round_label",
                    "order",
                    "id",
                    "home_team",
                    "prob_home",
                    "away_team",
                    "prob_away",
                    "winner",
                ]
            ]
        )
        bracket_df["home_team"] = bracket_df["home_team"].replace(TEAM_MAP_EN_TO_PT)
        bracket_df["away_team"] = bracket_df["away_team"].replace(TEAM_MAP_EN_TO_PT)
        return bracket_df


def simulate_stage_and_remaining(
    post_draws: dict,
    teams_list: list[str],
    matches_df: pd.DataFrame,
    stage_names: list[str] | None = None,
    n_sim: int = 100_000,
) -> tuple[dict, pd.DataFrame, pd.DataFrame]:
    """Simulate a specific knockout stage and all subsequent rounds.

    ``matches_df`` must be ordered as a bracket (0 vs 1, 2 vs 3, …).
    Returns ``(probs, stage_summary_df, match_stats_df)``.
    """
    atk_draws = post_draws["attack"]
    dfn_draws = post_draws["defense"]
    eta_draws = post_draws["eta"]
    uses_dc = "rho" in post_draws
    rho_draws = post_draws["rho"] if uses_dc else None

    n_samples = len(eta_draws)
    n_teams_total = len(teams_list)
    t_to_idx = {name: i for i, name in enumerate(teams_list)}

    sample_idx = np.random.choice(n_samples, n_sim)
    atk = atk_draws[sample_idx]
    dfn = dfn_draws[sample_idx]
    et = eta_draws[sample_idx].reshape(-1, 1)
    rho = rho_draws[sample_idx] if uses_dc else None

    num_matches = len(matches_df)

    if stage_names is None:
        stage_mapping = {
            16: [
                "round_of_32",
                "round_of_16",
                "quarter_finalists",
                "semi_finalists",
                "finalists",
                "champion",
            ],
            8: [
                "round_of_16",
                "quarter_finalists",
                "semi_finalists",
                "finalists",
                "champion",
            ],
            4: ["quarter_finalists", "semi_finalists", "finalists", "champion"],
            2: ["semi_finalists", "finalists", "champion"],
            1: ["finalists", "champion"],
        }
        stage_names = stage_mapping.get(
            num_matches,
            ["fase_atual"]
            + [f"avanco_{i}" for i in range(1, int(np.log2(num_matches)) + 2)],
        )

    stats = {f: np.zeros(n_teams_total) for f in stage_names}
    match_stats: list[dict] = []

    competitors = np.zeros((n_sim, num_matches * 2), dtype=int)
    involved_teams: list[str] = []

    for m in range(num_matches):
        row = matches_df.iloc[m]
        t1, t2 = row["home_team"], row["away_team"]
        involved_teams.extend([t1, t2])
        i1, i2 = t_to_idx[t1], t_to_idx[t2]
        competitors[:, m * 2] = i1
        competitors[:, m * 2 + 1] = i2
        stats[stage_names[0]][i1] = n_sim
        stats[stage_names[0]][i2] = n_sim

    stage_idx = 1
    is_first_round = True

    while competitors.shape[1] > 1:
        k = competitors.shape[1] // 2
        a, b = competitors[:, 0::2], competitors[:, 1::2]
        la = np.exp(
            atk[np.arange(n_sim)[:, None], a] - dfn[np.arange(n_sim)[:, None], b] + et
        )
        lb = np.exp(
            atk[np.arange(n_sim)[:, None], b] - dfn[np.arange(n_sim)[:, None], a] + et
        )
        rho_exp = np.repeat(rho[:, None], k, axis=1) if uses_dc else None
        ga, gb = simulate_matches(la, lb, rho_exp, n_sim)
        wins = (ga > gb) | ((ga == gb) & (np.random.rand(n_sim, k) < 0.5))

        if is_first_round:
            for m in range(num_matches):
                g1, g2 = ga[:, m], gb[:, m]
                match_info = {
                    "home_team": matches_df.iloc[m]["home_team"],
                    "away_team": matches_df.iloc[m]["away_team"],
                    "date": matches_df.iloc[m].get("date", "Data não encontrada"),
                    "home_win": float(np.mean(g1 > g2) * 100),
                    "draw": float(np.mean(g1 == g2) * 100),
                    "away_win": float(np.mean(g1 < g2) * 100),
                }
                for i in range(5):
                    for j in range(5):
                        match_info[f"{_NUM_TO_WORD[i]}_{_NUM_TO_WORD[j]}"] = float(
                            np.mean((g1 == i) & (g2 == j)) * 100
                        )
                match_stats.append(match_info)
            is_first_round = False

        competitors = np.where(wins, a, b)

        if stage_idx < len(stage_names):
            unique, counts = np.unique(competitors, return_counts=True)
            stats[stage_names[stage_idx]][unique] += counts
        stage_idx += 1

    probs = {stage: stats[stage] / n_sim for stage in stage_names}

    df_summary = pd.DataFrame(stats)
    df_summary = (df_summary / n_sim * 100).round(2)
    df_summary.insert(0, "team", teams_list)
    df_summary = df_summary[df_summary["team"].isin(involved_teams)]
    sort_col = stage_names[-1]
    df_summary = df_summary.sort_values(by=sort_col, ascending=False).reset_index(
        drop=True
    )
    df_summary.insert(0, "position", df_summary.index + 1)

    df_csv = pd.DataFrame(
        {
            "position": df_summary["position"],
            "team": df_summary["team"],
            "champion": df_summary.get(
                "champion", pd.Series([100.0] * len(df_summary))
            ),
            "final": df_summary.get("finalists", pd.Series([100.0] * len(df_summary))),
            "semifinals": df_summary.get(
                "semi_finalists", pd.Series([100.0] * len(df_summary))
            ),
            "quarterfinals": df_summary.get(
                "quarter_finalists", pd.Series([100.0] * len(df_summary))
            ),
            "round_of_16": df_summary.get(
                "round_of_16", pd.Series([100.0] * len(df_summary))
            ),
            "round_of_32": df_summary.get(
                "round_of_32", pd.Series([100.0] * len(df_summary))
            ),
        }
    )
    df_csv["team"] = df_csv["team"].replace(TEAM_MAP_EN_TO_PT)

    df_matches = pd.DataFrame(match_stats).round(2)
    df_matches.reset_index(drop=True, inplace=True)
    df_matches["home_team"] = df_matches["home_team"].replace(TEAM_MAP_EN_TO_PT)
    df_matches["away_team"] = df_matches["away_team"].replace(TEAM_MAP_EN_TO_PT)

    return probs, df_csv, df_matches
