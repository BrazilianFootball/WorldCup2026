"""PROVISIONAL structural scaffold for the 2027 FIFA Women's World Cup.

This is NOT a prediction. Two things are missing before it could be one:

1. GROUPS_WWC2027_PLACEHOLDER (src/constants.py) has only 18 of 32 real
   teams -- the rest are "TBD n" placeholders, and the group assignments
   are not the official draw (FIFA hasn't held it yet as of writing).
2. This repo has no women's-football results dataset, so there is no way
   to fit real attack/defense strengths. Every team below is simulated
   with identical (uniform) strength -- a pure structural smoke test.

What this proves: simulate_world_cup_2022() -- the same 32-team/8-group
bracket engine already used to backtest the men's 2018/2022 World Cups --
runs unmodified for a different competition, producing a valid stage
breakdown for every team. That reuse is the point; the numbers are not
meaningful until items 1 and 2 above are real.

Deliberately does not write to data/outputs/results|dashboards/ (reserved
for the live 2026 cycle) or data/outputs/backtesting/ (reserved for
completed-cycle validation) -- this is neither. Run it directly to inspect
the output; nothing is persisted.
"""

from __future__ import annotations

import numpy as np

from src.constants import GROUPS_WWC2027_PLACEHOLDER
from src.simulations.utils import simulate_world_cup_2022

N_SIM = 100_000
N_UNIFORM_DRAWS = 200  # arbitrary -- every draw is identical (uniform strength)


def uniform_posterior_draws(n_teams: int) -> dict[str, np.ndarray]:
    """Every team gets equal attack/defense (0 in log-space); ``eta`` sets a
    plausible baseline scoring rate. No ``rho`` -- plain Poisson, no
    Dixon-Coles low-score correction.
    """
    return {
        "attack": np.zeros((N_UNIFORM_DRAWS, n_teams)),
        "defense": np.zeros((N_UNIFORM_DRAWS, n_teams)),
        "eta": np.full(N_UNIFORM_DRAWS, np.log(1.3)),
    }


def run_uniform_strength_scaffold(
    groups: dict[str, list[str]] = GROUPS_WWC2027_PLACEHOLDER,
    n_sim: int = N_SIM,
) -> dict[str, np.ndarray]:
    """Simulate the placeholder bracket with uniform team strength.

    Returns the same stage -> per-team-probability-array mapping as
    simulate_world_cup_2022 (index-aligned with the flattened team list).
    """
    teams = [t for group_teams in groups.values() for t in group_teams]
    draws = uniform_posterior_draws(len(teams))
    return simulate_world_cup_2022(draws, teams, groups, n_sim=n_sim)


if __name__ == "__main__":
    groups = GROUPS_WWC2027_PLACEHOLDER
    teams = [t for group_teams in groups.values() for t in group_teams]
    probs = run_uniform_strength_scaffold(groups)

    print(
        "PROVISIONAL scaffold -- placeholder groups, uniform team strength. "
        "Not a real prediction (see module docstring)."
    )
    print(f"\n{len(teams)} teams, {len(groups)} groups, {N_SIM:,} simulations.\n")

    champion_order = sorted(
        range(len(teams)), key=lambda i: probs["champion"][i], reverse=True
    )
    print(f"{'Team':<15}{'Group':<8}{'Champion %':<12}{'Semifinal %':<13}")
    team_to_group = {t: g for g, ts in groups.items() for t in ts}
    for i in champion_order:
        team = teams[i]
        print(
            f"{team:<15}{team_to_group[team]:<8}"
            f"{probs['champion'][i] * 100:<12.3f}"
            f"{probs['semi_finalists'][i] * 100:<13.2f}"
        )
