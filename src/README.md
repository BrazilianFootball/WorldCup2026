# Source Code Guide

`src/` is the main Python package for the World Cup forecasting workflow.
The code is organized into subpackages covering data loading, modeling,
tournament simulation, output generation, analysis, and simulation entry points.

All imports use the `src.*` namespace (e.g., `from src.model.frequentist import DixonColesModel`).

## Package Overview

| Subpackage | Purpose |
| --- | --- |
| `constants.py` | Shared paths, 2026 groups, bracket rules, score labels, team-name mappings, and display labels. |
| `data/` | Kaggle dataset download, data loading, training-frame preparation, and time-decay/importance weighting. |
| `model/` | Abstract model interface, Bayesian (Stan) model wrapper, and frequentist Dixon-Coles model. |
| `tournament/` | Group-stage logic, best-third allocation, knockout bracket, and Monte Carlo simulation classes. |
| `simulations/` | Entry points for training and simulating the 2018, 2022, and 2026 tournaments. |
| `model_sel/` | Stan model training helper and Brier-score evaluation scripts for 2018/2022 validation. |
| `output/` | Score probability export, site HTML update, and D3 dashboard generation. |
| `analysis/` | Brier-score calculation, team-strength visualization, and match-weight utilities. |

## `src/data/`

| Module | Key Symbols |
| --- | --- |
| `loader.py` | `get_data()`, `data_pipeline()` — Kaggle download and CSV refresh; `load_data()` — returns `(results, shootouts)` DataFrames; `prepare_cycle_data()` — builds the weighted training frame for Stan; `load_ranking_priors()` — loads normalized FIFA ranking priors; `resolve_team_name()` — fuzzy team-name resolution. |

## `src/model/`

| Module | Key Symbols |
| --- | --- |
| `base.py` | `BaseDixonColesMatchModel` — abstract base class with `match_probs()`, `simulate_match()`, `win_draw_loss()`, and `get_strength()`. |
| `params.py` | `TournamentModelParams` — single-point parameter container; `TournamentParamsSeries` — vectorized posterior series with batched `match_probs()` and `simulate_match()`. |
| `frequentist.py` | `DixonColesModel` — L-BFGS-B fitting of attack/defense/home/rho parameters; `build_model()` convenience constructor; `load_and_prepare_data()` — data weighting for frequentist fitting. |
| `bayesian.py` | `BayesianDixonColesModel` — wraps `.npz` Stan posterior draws in the shared interface; `load_draws()` — raw draw loader. |
| `utils.py` | `score_probability_matrix()`, `score_probability_matrix_batched()`, `effective_home_gamma()`, `effective_home_gamma_vec()`. |

## `src/tournament/`

| Module | Key Symbols |
| --- | --- |
| `base.py` | `GroupStanding`, `TournamentResult` dataclasses; `TournamentSimulator` abstract base class with `simulate(n)`. |
| `frequentist.py` | `WorldCup2026` — 48-team tournament simulator driven by a fitted `DixonColesModel`. Handles group standings, best-third allocation, round-of-32 bracket, and knockout rounds. Supports vectorized (`TournamentParamsSeries`) and single-point simulation. |
| `bayesian.py` | `BayesianWorldCup2026` — vectorized Monte Carlo simulator driven by Stan posterior draws (default 100 000 runs). `simulate_stage_and_remaining()` — partial simulation from a given tournament phase. |

## `src/simulations/`

Entry points for the full pipeline. Run as modules with `uv run python -m src.simulations.<name>`.

| Module | What it does |
| --- | --- |
| `train_2026.py` | Compiles Stan models and trains the 2026 posterior in parallel; saves draws to `data/outputs/models/draws_2026_n_poisson_ranking.npz`. |
| `sim_2026.py` | Loads saved draws, runs 100 000 simulations, and writes `data/outputs/results/sim_results_2026.json`, `docs/csv/previsoes/summary.csv`, `docs/csv/previsoes/partidas.csv`, `docs/csv/previsoes/chaveamento_probs.csv`, `docs/csv/previsoes/all_matchups.csv`, `docs/csv/previsoes/tabela_chances.csv`, and `data/outputs/dashboards/dashboard_2026.html`. |
| `export_all_matchups.py` | Standalone export of all-vs-all match probability tables. |
| `sim_2022.py`, `sim_2018.py` | Historical simulation entry points for 2022 and 2018. |
| `utils.py` | `build_all_matchups_dataframe_mc()` — Monte Carlo all-vs-all match probability builder. |

## `src/model_sel/`

| Module | Key Symbols |
| --- | --- |
| `validate.py` | `train_and_save()` — compiles and samples a Stan model, saves posterior draws. Can also be run directly: `uv run python -m src.model_sel.validate`. |
| `evaluate_2018.py` | Brier-score evaluation of saved draws against 2018 World Cup results. |
| `evaluate_2022.py` | Brier-score evaluation of saved draws against 2022 World Cup results. |

## `src/output/`

| Module | Key Symbols |
| --- | --- |
| `export.py` | `export_phase_probs()` — orchestrates full probability export for a tournament phase; `build_prob_dataframe()` — phase-specific match probabilities; `build_stage_dataframe()` — tournament-stage advancement probabilities; `build_all_matchups_dataframe()` — all team-pair probabilities; `update_html_from_summary()` — appends a versioned snapshot to `docs/csv/previsoes/tabela_chances.csv`; `update_chaveamento_probs()` — appends a versioned snapshot to `docs/csv/previsoes/chaveamento_probs.csv`; `main()` / `if __name__ == "__main__"` — CLI entry point accepting `--wc-results`, `--min-date`, and `--seed`. |
| `dashboard.py` | `generate_dashboard()` — builds a standalone D3 HTML dashboard from a simulation JSON file. |

## `src/analysis/`

| Module | Key Symbols |
| --- | --- |
| `evaluation.py` | `calculate_model_brier()` — computes Brier-score summaries for saved posterior draws against known match results. |
| `forces.py` | Plots posterior team-strength distributions from Stan draws. |
| `weights.py` | Match importance and time-decay weight helpers. |

## Data Flow

1. `src.data.loader.data_pipeline()` (or `make run-data`) refreshes the match-result CSVs from Kaggle.
2. `src.data.loader.prepare_cycle_data()` builds the weighted training frame; `src.model.frequentist.load_and_prepare_data()` does the same for the frequentist path.
3. `src.simulations.train_2026` fits the Stan model and saves posterior draws.
4. `src.simulations.sim_2026` runs Monte Carlo tournament simulations.
5. `src.output.export.main()` writes public CSVs and updates the static website.

## Maintenance Notes

- All module-level symbols use English names. Portuguese labels, output filenames,
  and website-facing paths (e.g., `docs/csv/previsoes/`) remain unchanged as part
  of the public static-site contract.
- When adding a new tournament phase, update `src/constants.py`, the tournament
  simulators in `src/tournament/`, the export logic in `src/output/export.py`, and
  the website CSV expectations together.
- Keep generated CSV/JSON/HTML outputs out of source modules; write public CSVs
  only to `docs/csv/previsoes/` and internal artifacts (JSON, HTML dashboard,
  model draws) to `data/outputs/`.
