"""Utilities for historical backtesting and all-matchup probability generation."""

from __future__ import annotations

import gc
from itertools import combinations
from pathlib import Path

import numpy as np
import pandas as pd
from numpy.typing import NDArray

from src.constants import (
    ALL_MATCHUPS_EXPORT_COLS,
    PARTIDAS_EXPORT_COLS,
    TEAM_MAP_EN_TO_PT,
)
from src.tournament.bayesian import (
    _aggregate_batch_probs,
    _load_schedule_orientations,
    _match_lambdas,
    _resolve_fixture_orientation,
    simulate_matches,
)

ALL_MATCHUPS_BATCH_SIZE = 128


def _simulate_match_goals(
    atk: NDArray[np.floating],
    dfn: NDArray[np.floating],
    rho: NDArray[np.floating] | None,
    et: NDArray[np.floating],
    home_idx: int | NDArray[np.intp],
    away_idx: int | NDArray[np.intp],
    n_sim: int,
) -> tuple[NDArray[np.intp], NDArray[np.intp]]:
    n_pairs = 1 if np.isscalar(home_idx) else len(home_idx)
    l1, l2 = _match_lambdas(atk, dfn, home_idx, away_idx, et)
    rho_exp = np.repeat(rho[:, None], n_pairs, axis=1) if rho is not None else None
    return simulate_matches(l1, l2, rho_exp, n_sim)


def build_all_matchups_dataframe_mc(
    teams_list: list[str],
    wc_teams: list[str],
    atk: NDArray[np.floating],
    dfn: NDArray[np.floating],
    rho: NDArray[np.floating] | None,
    et: NDArray[np.floating],
    n_sim: int,
    pair_goals_cache: dict[tuple[str, str], tuple[NDArray, NDArray]] | None = None,
    results_path: str | Path = "data/results.csv",
    batch_size: int = ALL_MATCHUPS_BATCH_SIZE,
) -> pd.DataFrame:
    """Monte Carlo match probabilities for every WC team pair using Stan draws."""
    t_to_idx = {name: i for i, name in enumerate(teams_list)}
    schedule = _load_schedule_orientations(results_path)
    cache = pair_goals_cache or {}

    pairs: list[tuple[str, str]] = list(combinations(wc_teams, 2))
    rows: list[dict] = []
    pending: list[tuple[str, str, str, str, int, int]] = []
    cached_entries: list[tuple[str, str, NDArray, NDArray]] = []

    def flush_pending() -> None:
        if not pending:
            return
        home_idxs = np.array([item[4] for item in pending], dtype=int)
        away_idxs = np.array([item[5] for item in pending], dtype=int)
        g1, g2 = _simulate_match_goals(atk, dfn, rho, et, home_idxs, away_idxs, n_sim)
        batch_stats = _aggregate_batch_probs(g1, g2)
        for (home_pt, away_pt, *_), stats in zip(pending, batch_stats, strict=False):
            rows.append({"home_team": home_pt, "away_team": away_pt, **stats})
        pending.clear()

    for team_a_en, team_b_en in pairs:
        home_en, away_en, _, _ = _resolve_fixture_orientation(
            team_a_en, team_b_en, schedule
        )
        home_pt = TEAM_MAP_EN_TO_PT.get(home_en, home_en)
        away_pt = TEAM_MAP_EN_TO_PT.get(away_en, away_en)
        cache_key = (home_en, away_en)

        if cache_key in cache:
            hg, ag = cache[cache_key]
            cached_entries.append((home_pt, away_pt, hg, ag))
            continue

        pending.append(
            (home_pt, away_pt, home_en, away_en, t_to_idx[home_en], t_to_idx[away_en])
        )
        if len(pending) >= batch_size:
            flush_pending()

    flush_pending()

    if cached_entries:
        g1_c = np.stack([e[2] for e in cached_entries], axis=1)
        g2_c = np.stack([e[3] for e in cached_entries], axis=1)
        for (home_pt, away_pt, _, _), stats in zip(
            cached_entries, _aggregate_batch_probs(g1_c, g2_c), strict=False
        ):
            rows.append({"home_team": home_pt, "away_team": away_pt, **stats})

    df = pd.DataFrame(rows).round(4)
    return df[ALL_MATCHUPS_EXPORT_COLS]


def export_stan_match_csvs(
    teams_list: list[str],
    wc_teams: list[str],
    partidas_df: pd.DataFrame,
    atk: NDArray[np.floating],
    dfn: NDArray[np.floating],
    rho: NDArray[np.floating] | None,
    et: NDArray[np.floating],
    n_sim: int,
    pair_goals_cache: dict[tuple[str, str], tuple[NDArray, NDArray]] | None = None,
    export_all_matchups: bool = True,
    partidas_path: str | Path = "docs/csv/previsoes/partidas.csv",
    all_matchups_path: str | Path = "docs/csv/previsoes/all_matchups.csv",
) -> None:
    """Write ``partidas.csv`` and optionally ``all_matchups.csv`` from Stan draws."""
    partidas_out = partidas_df[PARTIDAS_EXPORT_COLS].round(4)
    partidas_out.to_csv(partidas_path, index=False)

    if not export_all_matchups:
        return

    print("Gerando all_matchups.csv (Monte Carlo Stan)...")
    all_df = build_all_matchups_dataframe_mc(
        teams_list,
        wc_teams,
        atk,
        dfn,
        rho,
        et,
        n_sim=n_sim,
        pair_goals_cache=pair_goals_cache,
    )
    all_df.to_csv(all_matchups_path, index=False)
    print(f"  Salvo em: {all_matchups_path} ({len(all_df)} confrontos)")
    del all_df
    gc.collect()


def simulate_world_cup_2022(
    post_draws: dict[str, NDArray[np.floating]],
    teams_list: list[str],
    groups: dict[str, list[str]],
    n_sim: int = 100_000,
) -> dict[str, NDArray[np.floating]]:
    """Simulate the 32-team 2018/2022 World Cup bracket for backtesting."""
    atk_draws = post_draws["attack"]
    dfn_draws = post_draws["defense"]
    eta_draws = post_draws["eta"]
    uses_dc = "rho" in post_draws
    rho_draws = post_draws["rho"] if uses_dc else None

    n_samples = len(eta_draws)
    n_teams = len(teams_list)
    t_idx = {name: i for i, name in enumerate(teams_list)}
    g_indices = np.array([[t_idx[t] for t in ts] for ts in groups.values()])

    sample_idx = np.random.choice(n_samples, n_sim)
    atk = atk_draws[sample_idx]
    dfn = dfn_draws[sample_idx]
    et = eta_draws[sample_idx].reshape(-1, 1)
    rho = rho_draws[sample_idx] if uses_dc else None

    stats: dict[str, NDArray[np.floating]] = {
        stage: np.zeros(n_teams)
        for stage in [
            "avancou_grupos",
            "quarter_finalists",
            "semi_finalists",
            "finalists",
            "champion",
        ]
    }

    pairs = [(0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)]
    pts = np.zeros((n_sim, 8, 4))
    sg = np.zeros((n_sim, 8, 4))
    gp = np.zeros((n_sim, 8, 4))

    for p1, p2 in pairs:
        i1, i2 = g_indices[:, p1], g_indices[:, p2]
        l1 = np.exp(atk[:, i1] - dfn[:, i2] + et)
        l2 = np.exp(atk[:, i2] - dfn[:, i1] + et)
        rho_exp = np.repeat(rho[:, None], 8, axis=1) if uses_dc else None
        g1, g2 = simulate_matches(l1, l2, rho_exp, n_sim)
        pts[:, :, p1] += (g1 > g2) * 3 + (g1 == g2)
        pts[:, :, p2] += (g2 > g1) * 3 + (g1 == g2)
        sg[:, :, p1] += g1 - g2
        sg[:, :, p2] += g2 - g1
        gp[:, :, p1] += g1
        gp[:, :, p2] += g2

    sort_val = pts * 1_000_000 + sg * 1_000 + gp
    ranks = np.argsort(-sort_val, axis=2)
    c1 = np.array([g_indices[g, ranks[:, g, 0]] for g in range(8)]).T
    c2 = np.array([g_indices[g, ranks[:, g, 1]] for g in range(8)]).T

    def count_stage(arr: NDArray, name: str) -> None:
        unique, counts = np.unique(arr, return_counts=True)
        stats[name][unique] += counts

    count_stage(c1, "avancou_grupos")
    count_stage(c2, "avancou_grupos")

    def play_round(ta: NDArray, tb: NDArray) -> NDArray:
        n_matches = ta.shape[1]
        row_idx = np.arange(n_sim)[:, None]
        la = np.exp(atk[row_idx, ta] - dfn[row_idx, tb] + et)
        lb = np.exp(atk[row_idx, tb] - dfn[row_idx, ta] + et)
        rho_exp = np.repeat(rho[:, None], n_matches, axis=1) if uses_dc else None
        ga, gb = simulate_matches(la, lb, rho_exp, n_sim)
        wins = (ga > gb) | ((ga == gb) & (np.random.rand(n_sim, n_matches) < 0.5))
        return np.where(wins, ta, tb)

    # Round-of-16 bracket ordering for the 2018/2022 format.
    first_place_idx = [0, 2, 4, 6, 1, 3, 5, 7]
    second_place_idx = [1, 3, 5, 7, 0, 2, 4, 6]
    qf = play_round(c1[:, first_place_idx], c2[:, second_place_idx])
    count_stage(qf, "quarter_finalists")
    sf = play_round(qf[:, 0::2], qf[:, 1::2])
    count_stage(sf, "semi_finalists")
    fin = play_round(sf[:, 0::2], sf[:, 1::2])
    count_stage(fin, "finalists")
    champ = play_round(fin[:, [0]], fin[:, [1]])
    count_stage(champ, "champion")

    return {stage: stats[stage] / n_sim for stage in stats}
