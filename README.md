# World Cup 2026

Predictive modeling, simulation, evaluation, and static-site assets for the FIFA
World Cup 2026 project developed around EMAp/FGV work on football forecasting.

The repository covers the full pipeline from international match data to published
probability tables: data download and preparation, Bayesian Stan models,
frequentist Dixon-Coles models, Monte Carlo tournament simulators, validation
scripts for the 2018 and 2022 World Cups, generated CSV/JSON/HTML outputs, and
the public static website under `docs/`.

## What This Repository Does

This project estimates national-team strength from recent international match
results and uses those estimates to simulate World Cup tournaments. The main
outputs are:

- qualification and title probabilities by team;
- match-level scoreline probabilities;
- bracket probability exports for each knockout phase;
- model comparison outputs such as Brier score tables and plots;
- HTML dashboards and a Portuguese static site for the public-facing project.

There are two modeling tracks in the repo:

- **Bayesian (Stan)**: `stan_models/` + `src/data/loader.py` + `src/model/bayesian.py`
  + `src/tournament/bayesian.py` + `src/simulations/` — full Bayesian posterior
  workflow with CmdStan, draws saved as compressed NumPy files.
- **Frequentist (Dixon-Coles)**: `src/model/frequentist.py` + `src/tournament/frequentist.py`
  — maximum-likelihood fitting with L-BFGS-B for fast iteration and export.

## Repository Layout

| Path | Description |
| --- | --- |
| `README.md` | This guide. |
| `pyproject.toml` | Python package metadata, core dependencies, Ruff, mypy, pytest, and coverage configuration. |
| `uv.lock` | Locked dependency resolution for `uv`. |
| `.python-version` | Python version pinned for the project tooling. |
| `.pre-commit-config.yaml` | Pre-commit hook configuration. |
| `Makefile` | Common setup, lint, formatting, data download, and cleanup commands for macOS/Linux. |
| `setup.ps1` | Windows PowerShell setup helper. |
| `LICENSE` | MIT license. |
| `.github/` | GitHub repository configuration. |
| `data/` | Current datasets, derived probability tables, simulation summaries, and generated outputs. |
| `data/raw/` | Raw historical match and FIFA ranking inputs used for training and validation. |
| `data/outputs/models/` | Saved Stan posterior draws as `.npz` files. These can be large generated artifacts. |
| `data/outputs/results/` | JSON simulation results and evaluation tables/plots. |
| `data/outputs/dashboards/` | Generated standalone HTML dashboards. |
| `docs/` | Static website served by GitHub Pages or any static file server. |
| `docs/csv/` | CSV files consumed by the website pages and JavaScript visualizations. |
| `docs/css/`, `docs/js/`, `docs/images/` | Website styling, client-side behavior, fonts, flags, team photos, mascots, shirts, and visual assets. |
| `notebooks/` | Exploratory notebooks for data cleaning, model experimentation, and examples. |
| `src/` | Main Python source package: data loading, modeling, simulation, export, analysis, and dashboards. |
| `src/analysis/` | Brier-score evaluation and team-strength visualization. |
| `src/data/` | Kaggle dataset download, time-decay weighting, and training-frame preparation. |
| `src/model/` | Abstract base class, Bayesian wrapper, and frequentist Dixon-Coles model. |
| `src/model_sel/` | Model validation and Brier-score evaluation scripts for 2018 and 2022 tournaments. |
| `src/output/` | Score probability export, site HTML update, and D3 dashboard generation. |
| `src/simulations/` | Entry points for training and simulating the 2018, 2022, and 2026 tournaments. |
| `src/tournament/` | Group-stage, best-third allocation, knockout bracket, and Monte Carlo simulation logic. |
| `stan_models/` | Stan model source files (`.stan`) and compiled binaries. |

## Source Package Structure

`src/` is a proper Python package. All imports use the `src.*` namespace.

### `src/constants.py`

Central constants: data paths, tournament weights, 2026 groups, bracket rules,
score labels, team-name mappings (`TEAM_MAP_EN_TO_PT`, `TEAM_MAP_PT_TO_EN`), and
display labels.

### `src/data/`

| Module | Purpose |
| --- | --- |
| `loader.py` | Kaggle dataset download (`get_data()`, `data_pipeline()`), time-decay and importance weighting (`prepare_cycle_data()`), ranking prior loading (`load_ranking_priors()`), team-name resolution, and `load_data()` for general use. |

### `src/model/`

| Module | Purpose |
| --- | --- |
| `base.py` | `BaseDixonColesMatchModel` abstract base class: `match_probs()`, `simulate_match()`, `win_draw_loss()`. |
| `params.py` | `TournamentModelParams` (single-point parameters) and `TournamentParamsSeries` (vectorized posterior series) dataclasses. |
| `frequentist.py` | `DixonColesModel`: L-BFGS-B fitting of attack/defense/home/rho parameters. `build_model()` convenience constructor. |
| `bayesian.py` | `BayesianDixonColesModel`: loads `.npz` posterior draws and wraps them in the shared match-probability interface. `load_draws()` helper. |
| `utils.py` | `score_probability_matrix()`, `score_probability_matrix_batched()`, and home-advantage helpers. |

### `src/tournament/`

| Module | Purpose |
| --- | --- |
| `base.py` | `GroupStanding`, `TournamentResult` dataclasses, and `TournamentSimulator` abstract base class. |
| `frequentist.py` | `WorldCup2026`: 48-team tournament simulator using a fitted `DixonColesModel`. Handles group standings, best-third allocation, round-of-32 bracket, and knockout rounds. |
| `bayesian.py` | `BayesianWorldCup2026`: vectorized Monte Carlo simulator (default 100 000 runs) driven by Stan posterior draws. `simulate_stage_and_remaining()` for in-tournament phase updates. |

### `src/simulations/`

| Module | Purpose |
| --- | --- |
| `train_2026.py` | Compiles Stan models and trains the 2026 posterior; saves draws to `data/outputs/models/`. |
| `sim_2026.py` | Runs 100 000 tournament simulations from saved draws; writes JSON, CSVs, and the dashboard. |
| `export_all_matchups.py` | Exports all-vs-all match probability tables. |
| `sim_2022.py`, `sim_2018.py` | Historical simulation entry points for 2022 and 2018. |
| `utils.py` | `build_all_matchups_dataframe_mc()` — Monte Carlo all-vs-all match probabilities. |

### `src/model_sel/`

| Module | Purpose |
| --- | --- |
| `validate.py` | `train_and_save()`: trains a Stan model and saves posterior draws. |
| `evaluate_2018.py` | Brier-score evaluation against 2018 World Cup results. |
| `evaluate_2022.py` | Brier-score evaluation against 2022 World Cup results. |

### `src/output/`

| Module | Purpose |
| --- | --- |
| `export.py` | `export_phase_probs()`, `build_prob_dataframe()`, `build_stage_dataframe()`, `build_all_matchups_dataframe()`, `update_html_from_summary()`, `update_chaveamento_probs()`, and a `main()` CLI. |
| `dashboard.py` | `generate_dashboard()`: builds a standalone D3 HTML dashboard from simulation JSON. |

### `src/analysis/`

| Module | Purpose |
| --- | --- |
| `evaluation.py` | `calculate_model_brier()`: computes Brier-score summaries for saved posterior draws. |
| `forces.py` | Generates posterior team-strength distribution plots from Stan draws. |
| `weights.py` | Match importance and time-decay weight helpers. |

## Stan Model Track

The Bayesian workflow uses `.stan` files in `stan_models/`, prepares weighted
match data with `src.data.loader`, runs CmdStan through `cmdstanpy`, saves
posterior draws to `data/outputs/models/`, and simulates tournaments from those
draws using `BayesianWorldCup2026`.

The model names encode two choices:

- `poisson` vs. `dc`: independent Poisson scoring vs. Dixon-Coles low-score correction.
- `ranking` vs. `noranking`: whether FIFA ranking information is included as a prior-strength feature.
- `n_` vs. `st_`: normal vs. Student-t style parameterization in the Stan model family.

The production model for 2026 is `n_poisson_ranking`.

## Data

The project uses the
[International Football Results from 1872 to 2026](https://www.kaggle.com/datasets/martj42/international-football-results-from-1872-to-2017)
dataset from Kaggle. The upstream dataset name mentions 2017, but the dataset is
updated over time. Three files are expected:

| File | Description |
| --- | --- |
| `results.csv` | International match results with teams, scores, tournament, venue, and neutrality fields. |
| `shootouts.csv` | Penalty shootout outcomes. |
| `goalscorers.csv` | Individual goal-scoring records. |

Additional project data includes:

- `data/world_cup_results.csv`: 2026 schedule/results file used to fix known
  World Cup results and detect the current phase.
- `data/summary.csv`: current public probability summary by team.
- `data/probs_*.csv`: match-level probability exports for the current or named phase.
- `data/chaveamento_probs.csv`: bracket probability export.
- `data/raw/fifa_ranking_*.csv`: ranking inputs used as Stan priors.
- `docs/csv/previsoes/*.csv`: website-facing copies of prediction and bracket data.

## Setup

### macOS / Linux

```bash
git clone <repo-url>
cd WorldCup2026
make local
```

### Windows PowerShell

```powershell
git clone <repo-url>
cd WorldCup2026
.\setup.ps1
```

Both setup paths install `uv`, install the Python version from `.python-version`,
create a virtual environment, install dependencies, and set up pre-commit hooks.

For Stan workflows, ensure CmdStan is installed and accessible to `cmdstanpy`.
The repository includes a compiled binary for `n_poisson_ranking` in `stan_models/`,
but it is a platform-specific artifact and may need to be rebuilt locally.

## Common Commands

| Task | macOS/Linux | Windows PowerShell |
| --- | --- | --- |
| Setup | `make local` | `.\setup.ps1` |
| Lint and typecheck | `make check` | `uv run ruff check src/; uv run mypy src/` |
| Format | `make format` | `uv run ruff format src/` |
| Run pre-commit hooks | `make test` | `uv run pre-commit run --all-files` |
| Download Kaggle data | `make run-data` | `uv run python -c "from src.data.loader import data_pipeline; data_pipeline()"` |
| Update chances page | `make update-chances` | `uv run python src/output/export.py --wc-results data/world_cup_results.csv` |
| Clean generated caches | `make clean` | Remove `.venv`, cache folders, and build artifacts manually |

## Key Entry Points

```bash
# 1. Download / refresh Kaggle match data
make run-data

# 2. Train the 2026 Bayesian (Stan) model
uv run python -m src.simulations.train_2026

# 3. Simulate 2026 from saved Stan posterior draws (writes JSON, CSVs, dashboard)
uv run python -m src.simulations.sim_2026

# 4. Export current-phase score probabilities and update docs/chances.html
uv run python src/output/export.py --wc-results data/world_cup_results.csv

# 5. Train / evaluate Stan models for 2018 and 2022 validation cycles
uv run python -m src.model_sel.validate
uv run python -m src.model_sel.evaluate_2018
uv run python -m src.model_sel.evaluate_2022
```

The active Stan scripts and shared modules use standardized English variable and
function names. Portuguese labels, output filenames, and website-facing paths
such as `docs/csv/previsoes/` are kept as part of the public static-site contract.

## Website

The public site lives in `docs/` and is written as static HTML/CSS/JavaScript in
Portuguese. It includes:

- `docs/index.html`: project landing page;
- `docs/modelos.html`: model descriptions;
- `docs/previsoes.html`: match predictions;
- `docs/chances.html`: team advancement/title chances;
- `docs/calendario.html`: schedule page;
- `docs/vis.html`: retrospective visualizations;
- `docs/equipe.html`: team page;
- `docs/midia.html`: media page;
- `docs/album.html`: team album page;
- `docs/css/`, `docs/js/`, `docs/images/`, and `docs/csv/`: styling, behavior,
  assets, and data consumed by the pages.

Because the site is static, it can be viewed by opening `docs/index.html` in a
browser or by serving `docs/` with any static server.

## Generated Outputs

Several files in `data/`, `docs/csv/`, and `data/outputs/` are generated by the
training and simulation scripts. In particular:

- model draw files: `data/outputs/models/*.npz`;
- simulation JSON: `data/outputs/results/sim_results_*.json`;
- dashboards: `data/outputs/dashboards/dashboard_*.html`;
- public probability tables: `data/summary.csv`,
  `docs/csv/previsoes/partidas.csv`, `docs/csv/previsoes/summary.csv`,
  `docs/csv/previsoes/chaveamento_probs.csv` (versioned bracket snapshots), and
  `docs/csv/previsoes/tabela_chances.csv` (versioned advancement-probability snapshots);
- evaluation tables and plots: `data/outputs/results/brier_score_*.csv` and
  `data/outputs/results/comparacao_brier_*.png`.

When changing the modeling code, regenerate the relevant outputs before updating
the website.

## Notes for Contributors

- Keep source changes in `src/` and `stan_models/` separate from generated
  output changes when possible.
- Use `data/world_cup_results.csv` to add known 2026 match results and then run
  `uv run python src/output/export.py --wc-results data/world_cup_results.csv` to propagate changes into summaries and site files.
- Run formatting and checks (`make check`) before committing source changes.
- Treat `2022Cup/` as an archive unless intentionally maintaining the legacy
  2022 site or simulations.
