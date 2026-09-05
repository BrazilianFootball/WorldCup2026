"""Generic CLI entry point for every 32-team/8-group tournament cycle.

Replaces one-file-per-competition scripts (formerly sim_2018.py, sim_2022.py,
sim_wwc2027.py) with a single script plus a registry of competition configs
in COMPETITIONS below. Adding a new cycle that fits this bracket shape --
8 groups of 4, top 2 per group advancing straight to the round of 16, same
as simulate_world_cup_2022() already handles -- means adding one entry to
COMPETITIONS, not a new file.

Usage:
    python -m src.simulations.run_cycle wc2018
    python -m src.simulations.run_cycle wc2022 --n-sim 50000
    python -m src.simulations.run_cycle wwc2027

Two kinds of entries:
- Backtest cycles (wc2018, wc2022): a real Stan-trained model exists for a
  completed cycle. Delegates to run_backtest_simulation(), which writes the
  usual sim_results_<year>.json + dashboard_<year>.html under
  data/outputs/backtesting/.
- Placeholder cycles (wwc2027): no trained model and/or no official groups
  yet (see the competition's `placeholder_note`). Simulated with uniform
  team strength instead, and only prints a summary -- nothing is persisted,
  so a provisional run can't be mistaken for a real prediction later.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from src.constants import (
    CYCLE_CUTOFFS,
    GROUPS_2018,
    GROUPS_2022,
    GROUPS_WWC2027_PLACEHOLDER,
    STAGE_LABELS_2018,
    STAGE_LABELS_2022,
    STAGE_LABELS_WWC2027,
)
from src.simulations.utils import run_backtest_simulation, simulate_world_cup_2022


@dataclass(frozen=True)
class CompetitionConfig:
    groups: dict[str, list[str]]
    stage_labels: dict[str, str]
    dashboard_title: str
    # Set for backtest cycles (a trained model exists for a completed cycle).
    year: int | None = None
    cutoff_start: str | None = None
    cutoff_end: str | None = None
    # Set for placeholder cycles (no trained model / no official groups yet).
    placeholder_note: str | None = None


def _backtest_config(
    year: int, groups: dict, stage_labels: dict, title: str
) -> CompetitionConfig:
    cutoff_start, cutoff_end = CYCLE_CUTOFFS[year]
    return CompetitionConfig(
        groups=groups,
        stage_labels=stage_labels,
        dashboard_title=title,
        year=year,
        cutoff_start=cutoff_start,
        cutoff_end=cutoff_end,
    )


COMPETITIONS: dict[str, CompetitionConfig] = {
    "wc2018": _backtest_config(
        2018, GROUPS_2018, STAGE_LABELS_2018, "Copa do Mundo 2018"
    ),
    "wc2022": _backtest_config(2022, GROUPS_2022, STAGE_LABELS_2022, "Copa 2022"),
    "wwc2027": CompetitionConfig(
        groups=GROUPS_WWC2027_PLACEHOLDER,
        stage_labels=STAGE_LABELS_WWC2027,
        dashboard_title="Copa do Mundo Feminina 2027 (provisório)",
        placeholder_note=(
            "grupos/vagas provisórios (18/32 confirmados, sorteio oficial "
            "ainda não agendado) e força uniforme entre seleções (sem base "
            "de resultados do futebol feminino no repositório)"
        ),
    ),
}


def uniform_posterior_draws(
    n_teams: int, n_draws: int = 200, avg_goals: float = 1.3
) -> dict[str, NDArray[np.floating]]:
    """Every team gets equal attack/defense (0 in log-space); ``eta`` sets a
    plausible baseline scoring rate. No ``rho`` -- plain Poisson, no
    Dixon-Coles low-score correction.
    """
    return {
        "attack": np.zeros((n_draws, n_teams)),
        "defense": np.zeros((n_draws, n_teams)),
        "eta": np.full(n_draws, np.log(avg_goals)),
    }


def run_placeholder_scaffold(
    config: CompetitionConfig, n_sim: int
) -> dict[str, NDArray[np.floating]]:
    """Simulate a placeholder competition with uniform team strength.

    Returns the same stage -> per-team-probability-array mapping as
    simulate_world_cup_2022 (index-aligned with the flattened team list).
    Does not persist anything -- see module docstring.
    """
    teams = [t for group_teams in config.groups.values() for t in group_teams]
    draws = uniform_posterior_draws(len(teams))
    return simulate_world_cup_2022(draws, teams, config.groups, n_sim=n_sim)


def _print_placeholder_summary(
    name: str,
    config: CompetitionConfig,
    probs: dict[str, NDArray[np.floating]],
    n_sim: int,
) -> None:
    teams = [t for ts in config.groups.values() for t in ts]
    team_to_group = {t: g for g, ts in config.groups.items() for t in ts}

    print(f"PROVISIONAL scaffold ({name}) -- {config.placeholder_note}.")
    print("Not a real prediction.\n")
    print(f"{len(teams)} teams, {len(config.groups)} groups, {n_sim:,} simulations.\n")

    champion_order = sorted(
        range(len(teams)), key=lambda i: probs["champion"][i], reverse=True
    )
    print(f"{'Team':<15}{'Group':<8}{'Champion %':<12}{'Semifinal %':<13}")
    for i in champion_order:
        team = teams[i]
        print(
            f"{team:<15}{team_to_group[team]:<8}"
            f"{probs['champion'][i] * 100:<12.3f}"
            f"{probs['semi_finalists'][i] * 100:<13.2f}"
        )


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        description="Run a 32-team/8-group tournament cycle (backtest or placeholder)."
    )
    parser.add_argument("competition", choices=sorted(COMPETITIONS))
    parser.add_argument(
        "--n-sim", type=int, default=100_000, help="Number of Monte Carlo simulations."
    )
    args = parser.parse_args(argv)
    config = COMPETITIONS[args.competition]

    if config.placeholder_note is not None:
        probs = run_placeholder_scaffold(config, n_sim=args.n_sim)
        _print_placeholder_summary(args.competition, config, probs, args.n_sim)
        return

    assert config.year is not None
    assert config.cutoff_start is not None
    assert config.cutoff_end is not None
    run_backtest_simulation(
        year=config.year,
        groups=config.groups,
        cutoff_start=config.cutoff_start,
        cutoff_end=config.cutoff_end,
        stage_labels=config.stage_labels,
        dashboard_title=config.dashboard_title,
        n_sim=args.n_sim,
    )


if __name__ == "__main__":
    main()
