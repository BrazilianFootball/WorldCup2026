from __future__ import annotations

from concurrent.futures import ProcessPoolExecutor, as_completed

from cmdstanpy import CmdStanModel

from src.constants import REFERENCE_DATE
from src.data import load_ranking_priors, prepare_cycle_data
from src.model_sel.validate import train_and_save

if __name__ == "__main__":
    # Enable additional model variants here when the 2026 training run should
    # compare more than the selected production model.
    stan_model_files = {
        # "n_poisson_noranking": "stan_models/n_poisson_noranking.stan",
        # "st_dc_ranking": "stan_models/st_dc_ranking.stan",
        # "st_dc_noranking": "stan_models/st_dc_noranking.stan",
        # "n_dc_ranking": "stan_models/n_dc_ranking.stan",
        # "n_dc_noranking": "stan_models/n_dc_noranking.stan",
        # "st_poisson_ranking": "stan_models/st_poisson_ranking.stan",
        # "st_poisson_noranking": "stan_models/st_poisson_noranking.stan",
        "n_poisson_ranking": "stan_models/n_poisson_ranking.stan"
    }

    print("=" * 50)
    print("PRECOMPILANDO MODELOS STAN")
    print("=" * 50)

    compiled_models = {}

    for model_key, stan_file in stan_model_files.items():
        print(f"Compilando {model_key} ...")

        model = CmdStanModel(stan_file=stan_file)

        compiled_models[model_key] = {
            "stan_file": stan_file,
            "exe_file": model.exe_file,
        }

    print("\nTodos os modelos compilados!")

    cycles = []

    print("=" * 50)
    print("PREPARANDO DADOS DO CICLO 2026")
    print("=" * 50)

    df_26, teams_26, team_map_26 = prepare_cycle_data(
        "data/results.csv", "2022-11-19", end_date=REFERENCE_DATE, apply_decay=True
    )

    ranking_priors_26 = load_ranking_priors("data/raw/fifa_ranking_2022.csv", teams_26)

    cycles.append(("2026", df_26, teams_26, team_map_26, ranking_priors_26))

    # One parallel job per configured 2026 model.
    jobs = []

    for cycle_name, df, teams, team_map, ranking_priors in cycles:
        for model_key in stan_model_files:
            jobs.append(
                (
                    cycle_name,
                    model_key,
                    compiled_models[model_key]["stan_file"],
                    compiled_models[model_key]["exe_file"],
                    df,
                    teams,
                    team_map,
                    ranking_priors,
                )
            )

    print("\n" + "=" * 50)
    print("INICIANDO TREINAMENTO PARALELO")
    print("=" * 50)

    # Keep worker count conservative because Stan chains are CPU-heavy.
    MAX_WORKERS = 3

    with ProcessPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(train_and_save, *job) for job in jobs]

        for future in as_completed(futures):
            future.result()

    print("\nTodos os modelos foram treinados e salvos!")
