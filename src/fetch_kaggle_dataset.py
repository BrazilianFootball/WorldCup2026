import shutil
from pathlib import Path

import kagglehub
import pandas as pd

KAGGLE_DATASET = "martj42/international-football-results-from-1872-to-2017"
ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"

DATASET_FILES = ("results.csv", "shootouts.csv", "goalscorers.csv")


def get_data() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = Path(kagglehub.dataset_download(KAGGLE_DATASET, force_download=True))
    for name in DATASET_FILES:
        found = next(path.rglob(name), None)
        if found is not None and found.is_file():
            shutil.copy2(found, DATA_DIR / name)


def treat_dates(results: pd.DataFrame) -> pd.DataFrame:
    results["date"] = pd.to_datetime(results["date"])
    results.sort_values("date", ascending=True, inplace=True, ignore_index=True)
    return results


def data_pipeline() -> None:
    get_data()
    results = pd.read_csv(DATA_DIR / "results.csv")
    results = treat_dates(results)
    results.to_csv(DATA_DIR / "results.csv", index=False)


def load_data() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    results_path = DATA_DIR / "results.csv"
    shootouts_path = DATA_DIR / "shootouts.csv"
    goalscorers_path = DATA_DIR / "goalscorers.csv"

    if not all(p.is_file() for p in (results_path, shootouts_path, goalscorers_path)):
        data_pipeline()

    results = pd.read_csv(results_path, parse_dates=["date"])
    shootouts = pd.read_csv(shootouts_path, parse_dates=["date"])
    goalscorers = pd.read_csv(goalscorers_path, parse_dates=["date"])
    return results, shootouts, goalscorers


if __name__ == "__main__":
    results, shootouts, goalscorers = load_data()
    print("=== Results ===")
    print(results.head())
    print("\n=== Shootouts ===")
    print(shootouts.head())
    print("\n=== Goalscorers ===")
    print(goalscorers.head())
