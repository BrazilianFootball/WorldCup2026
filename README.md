# World Cup 2026

Predictive models and data analysis for the 2026 FIFA World Cup.

## Setup

### macOS / Linux

```bash
git clone <repo-url>
cd WorldCup2026
make local
```

### Windows (PowerShell)

```powershell
git clone <repo-url>
cd WorldCup2026
.\setup.ps1
```

Both options will:

1. Install [uv](https://docs.astral.sh/uv/) if not already available
2. Install the required Python version (see `.python-version`)
3. Create a virtual environment and install all dependencies
4. Set up pre-commit hooks

## Data

The project uses the
[International Football Results from 1872 to 2026](https://www.kaggle.com/datasets/martj42/international-football-results-from-1872-to-2017)
dataset from Kaggle (updated continuously despite the name). It contains three
CSV files:

| File              | Description                          |
| ----------------- | ------------------------------------ |
| `results.csv`     | Match results (teams, scores, venue) |
| `shootouts.csv`   | Penalty shootout outcomes            |
| `goalscorers.csv` | Individual goal-scoring records      |

To download the data into the `data/` directory:

```bash
make run-data            # macOS / Linux
uv run python src/fetch_kaggle_dataset.py   # Windows
```

The script downloads the dataset via `kagglehub`, copies the CSV files to
`data/`, and sorts `results.csv` by date.

## Available Commands

Run `make help` (macOS/Linux) to see all available commands. On Windows, run
the equivalent `uv` commands directly.

| Task             | macOS / Linux    | Windows (PowerShell)                        |
| ---------------- | ---------------- | ------------------------------------------- |
| Setup            | `make local`     | `.\setup.ps1`                               |
| Lint + typecheck | `make check`     | `uv run ruff check src/; uv run mypy src/`  |
| Format           | `make format`    | `uv run ruff format src/`                   |
| Pre-commit       | `make test`      | `uv run pre-commit run --all-files`          |
| Download data    | `make run-data`  | `uv run python src/fetch_kaggle_dataset.py`  |
| Clean            | `make clean`     | Remove `.venv`, `__pycache__`, cache folders |
