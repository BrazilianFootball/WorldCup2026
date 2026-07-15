"""Train the 2026 model with data available up to a cutoff date, simulate the
World Cup many times, and count how often specific matchups occur at a given
knockout stage.

This answers questions like: "as of a given date, if I train the model on
everything known up to then and simulate the rest of the Cup, how many times
out of N simulations do I get Spain vs France in the semifinal? How many
times do I get Spain vs France AND England vs Argentina in the same
semifinal draw?"

Usage
-----
    python -m src.simulations.analyze_matchup_events --cutoff-date 2026-06-20

Edit ``EVENTS`` below to add/remove the matchups you want to track, and
``CUTOFF_DATE`` (or pass ``--cutoff-date``) to change the "as of" date.

Notes
-----
- Only matches with a known result on or before ``cutoff_date`` are treated
  as fixed; everything else (including WC matches that, in real life, may
  already have been played after that date) is simulated by the model. This
  lets you rewind to an earlier point in the tournament.
- Training re-runs Stan sampling (same as ``src/simulations/train_2026.py``),
  so the first run for a given cutoff date can take a while. Results are
  cached to ``data/outputs/models/draws_2026_<cutoff_date>_<model_name>.npz``
  and reused on subsequent runs unless ``--force-retrain`` is passed.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd
from cmdstanpy import CmdStanModel

from src.analysis.matchup_events import analyze_events, top_matchups_all_stages
from src.constants import DEFAULT_SEED, WC_YEAR
from src.data import load_ranking_priors, prepare_cycle_data
from src.model.bayesian import BayesianDixonColesModel
from src.model_sel.validate import train_and_save
from src.tournament.bayesian import BayesianWorldCup2026

# ── Configure the matchups you want to analyze here ──────────────────────────
# Each event is {"stage": ..., "matchups": [(team_a, team_b), ...]}.
#   - A single pair -> "how often does this exact matchup happen at this
#     stage" (either order, anywhere among that stage's matches).
#   - Multiple pairs -> a joint event: how often do ALL of those matchups
#     happen simultaneously in the same simulation (e.g. both semifinal
#     pairings landing exactly as specified).
# Valid stages: "round_of_32", "round_of_16", "quarterfinals", "semifinals",
# "final". Team names must match src.constants.GROUPS spelling (English).
EVENTS: list[dict] = [
    {"stage": "semifinals", "matchups": [("Spain", "France")]},
    {"stage": "semifinals", "matchups": [("England", "Argentina")]},
    {
        "stage": "semifinals",
        "matchups": [("Spain", "France"), ("England", "Argentina")],
    },
    {"stage": "final", "matchups": [("Spain", "Argentina")]},
    {"stage": "final", "matchups": [("France", "England")]},
    {"stage": "final", "matchups": [("Spain", "England")]},
    {"stage": "final", "matchups": [("France", "Argentina")]},
]

CUTOFF_DATE = "2026-07-15"  # overridden by --cutoff-date
MODEL_NAME = "n_poisson_ranking"
STAN_FILE = "stan_models/n_poisson_ranking.stan"
N_SIM = 100_000

# Stages to report top matchups for, in bracket order. Overridden by --stages.
STAGES = ["round_of_32", "round_of_16", "quarterfinals", "semifinals", "final"]
TOP_N = 3  # overridden by --top-n


def train_model_up_to(
    cutoff_date: str,
    model_name: str = MODEL_NAME,
    stan_file: str = STAN_FILE,
    force_retrain: bool = False,
) -> str:
    """Train (or reuse a cached) Stan model using only matches on/before cutoff_date.

    Returns the path to the saved posterior-draws .npz file.
    """
    cycle_name = f"2026_{cutoff_date}"
    output_path = f"data/outputs/models/draws_{cycle_name}_{model_name}.npz"

    if Path(output_path).exists() and not force_retrain:
        print(f"Modelo já treinado para {cutoff_date}, reaproveitando: {output_path}")
        return output_path

    print(f"Preparando dados do ciclo 2026 até {cutoff_date} ...")
    df, teams, team_map = prepare_cycle_data(
        "data/results.csv", "2022-11-19", end_date=cutoff_date, apply_decay=True
    )
    ranking_priors = load_ranking_priors("data/raw/fifa_ranking_2022.csv", teams)

    print(f"Compilando e treinando {model_name} ...")
    stan_model = CmdStanModel(stan_file=stan_file)
    train_and_save(
        cycle_name,
        model_name,
        stan_file,
        stan_model.exe_file,
        df,
        teams,
        team_map,
        ranking_priors,
    )
    return output_path


def load_known_state(cutoff_date: str) -> tuple[dict | None, dict | None]:
    """Build known_results / known_ko_winners dicts using only data on/before
    cutoff_date.

    Mirrors the logic in src/simulations/sim_2026.py, parameterized by an
    arbitrary cutoff instead of always using "today".
    """
    res = pd.read_csv("data/results.csv")
    wc = res[
        (res["tournament"] == "FIFA World Cup")
        & (pd.to_datetime(res["date"]).dt.year == WC_YEAR)
        & (pd.to_datetime(res["date"]) <= pd.Timestamp(cutoff_date))
        & res["home_score"].notna()
        & res["away_score"].notna()
    ]
    known_results = {
        (r["home_team"], r["away_team"]): (int(r["home_score"]), int(r["away_score"]))
        for _, r in wc.iterrows()
    } or None

    shootouts = pd.read_csv("data/shootouts.csv")
    draws = wc[wc["home_score"] == wc["away_score"]].copy()
    # results.csv dates are "M/D/YYYY" while shootouts.csv dates are ISO
    # "YYYY-MM-DD" -- normalize both before merging.
    draws["date"] = pd.to_datetime(draws["date"]).dt.strftime("%Y-%m-%d")
    shootouts["date"] = pd.to_datetime(shootouts["date"]).dt.strftime("%Y-%m-%d")
    merged = draws.merge(
        shootouts[["date", "home_team", "away_team", "winner"]],
        on=["date", "home_team", "away_team"],
        how="inner",
    )
    known_ko_winners = {
        (r["home_team"], r["away_team"]): r["winner"] for _, r in merged.iterrows()
    }

    aet_path = Path("data/aet_winners.csv")
    if aet_path.exists():
        aet = pd.read_csv(aet_path)
        aet["date"] = pd.to_datetime(aet["date"]).dt.strftime("%Y-%m-%d")
        aet = aet[pd.to_datetime(aet["date"]) <= pd.Timestamp(cutoff_date)]
        merged_aet = draws.merge(
            aet[["date", "home_team", "away_team", "winner"]],
            on=["date", "home_team", "away_team"],
            how="inner",
        )
        for _, r in merged_aet.iterrows():
            known_ko_winners[(r["home_team"], r["away_team"])] = r["winner"]

    return known_results, (known_ko_winners or None)


def run(
    cutoff_date: str,
    n_sim: int = N_SIM,
    events: list[dict] | None = None,
    force_retrain: bool = False,
    output_csv: str | None = None,
    top_n: int = TOP_N,
    stages: list[str] | None = None,
    top_matchups_csv: str | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Train up to cutoff_date, simulate n_sim tournaments, and report:

    1. The user-configured EVENTS (exact/joint matchup counts).
    2. The top-``top_n`` most probable matchups for each stage in ``stages``
       (e.g. the 3 most likely semifinal or final pairings), with no need to
       name teams upfront.

    Returns ``(df_events, df_top_matchups)``.
    """
    events = events if events is not None else EVENTS
    stages = stages if stages is not None else STAGES

    model_path = train_model_up_to(cutoff_date, force_retrain=force_retrain)
    print(f"Carregando modelo: {model_path}")
    model = BayesianDixonColesModel(model_path)

    known_results, known_ko_winners = load_known_state(cutoff_date)

    simulator = BayesianWorldCup2026(
        model,
        seed=DEFAULT_SEED,
        known_results=known_results,
        known_ko_winners=known_ko_winners,
    )
    print(f"Simulando {n_sim:,} vezes a Copa (estado em {cutoff_date}) ...")
    simulator.simulate(n=n_sim)

    stage_arrays = simulator.last_stage_arrays
    if stage_arrays is None:
        raise RuntimeError("simulate() não populou last_stage_arrays.")

    df_events = analyze_events(stage_arrays, model.teams, events)
    df_events.insert(0, "cutoff_date", cutoff_date)

    print("\n=== FREQUÊNCIA DOS EVENTOS ===\n")
    print(df_events.to_string(index=False))

    if output_csv:
        Path(output_csv).parent.mkdir(parents=True, exist_ok=True)
        df_events.to_csv(output_csv, index=False)
        print(f"\nSalvo em: {output_csv}")

    df_top = top_matchups_all_stages(
        stage_arrays, model.teams, top_n=top_n, stages=stages
    )
    df_top.insert(0, "cutoff_date", cutoff_date)

    print(f"\n=== TOP {top_n} COMBINAÇÕES MAIS PROVÁVEIS POR FASE ===\n")
    print(
        "(para fases com mais de um jogo simultâneo -- tudo antes da final --\n"
        " cada linha é a probabilidade CONJUNTA de todos os jogos daquela\n"
        " linha acontecerem juntos na mesma simulação)"
    )
    for stage in stages:
        stage_rows = df_top[df_top["stage"] == stage]
        print(f"\n-- {stage} --")
        for _, row in stage_rows.iterrows():
            print(
                f"  {int(row.rank)}. {row.games}: "
                f"{row.probability_pct:.2f}% "
                f"({int(row.count)}/{n_sim:,} simulações)"
            )

    if top_matchups_csv:
        Path(top_matchups_csv).parent.mkdir(parents=True, exist_ok=True)
        df_top.to_csv(top_matchups_csv, index=False)
        print(f"\nSalvo em: {top_matchups_csv}")

    return df_events, df_top


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--cutoff-date",
        default=CUTOFF_DATE,
        help="Treat only matches on/before this date (YYYY-MM-DD) as known; "
        "everything else is simulated. Also used as the training data cutoff.",
    )
    parser.add_argument("--n-sim", type=int, default=N_SIM)
    parser.add_argument(
        "--force-retrain",
        action="store_true",
        help="Retrain even if a cached model for this cutoff date already exists.",
    )
    parser.add_argument(
        "--output-csv",
        default=None,
        help="Optional path to save the event-frequency table as CSV.",
    )
    parser.add_argument(
        "--top-n",
        type=int,
        default=TOP_N,
        help="How many top matchups to report per stage (default: 3).",
    )
    parser.add_argument(
        "--stages",
        default=None,
        help="Comma-separated list of stages to report top matchups for "
        f"(default: all of {','.join(STAGES)}).",
    )
    parser.add_argument(
        "--top-matchups-csv",
        default=None,
        help="Optional path to save the top-matchups-per-stage table as CSV.",
    )
    args = parser.parse_args()

    run(
        cutoff_date=args.cutoff_date,
        n_sim=args.n_sim,
        force_retrain=args.force_retrain,
        output_csv=args.output_csv,
        top_n=args.top_n,
        stages=args.stages.split(",") if args.stages else None,
        top_matchups_csv=args.top_matchups_csv,
    )
