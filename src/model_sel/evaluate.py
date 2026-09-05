"""Shared Brier-score evaluation for historical backtest cycles (2018/2022)."""

from __future__ import annotations

import os

import matplotlib.pyplot as plt
import pandas as pd

from src.analysis import calculate_model_brier
from src.data import prepare_cycle_data
from src.model.bayesian import load_draws


def evaluate_brier(
    year: int,
    cutoff_start: str,
    cutoff_end: str,
    results_file: str | None = None,
    csv_path: str = "data/raw/results.csv",
    models_dir: str = "data/outputs/models/",
    output_dir: str = "data/outputs/backtesting/results",
) -> pd.DataFrame | None:
    """Evaluate every saved posterior-draw model for one historical cycle.

    Shared by evaluate_2018.py/evaluate_2022.py, which only differ in the
    year, training cutoff dates, and (for 2018) an explicit answer-key path.
    Writes a ranked Brier-score CSV and a credible-interval comparison plot;
    returns the ranked DataFrame, or None if no matching models were found.
    """
    print("\n" + "=" * 45)
    print(f"AVALIAÇÃO DE PERFORMANCE: BRIER SCORE {year}")
    print("=" * 45)

    if results_file is None:
        results_file = f"data/raw/jogos_{year}.csv"

    # Rebuild the training team order so draw columns line up with teams.
    _, teams, _ = prepare_cycle_data(
        csv_path, cutoff_start, cutoff_end, apply_decay=True
    )

    if not os.path.exists(models_dir):
        print(
            "Pasta de modelos não encontrada. Certifique-se de rodar train.py primeiro."
        )
        return None

    npz_files = [
        f
        for f in os.listdir(models_dir)
        if f.startswith(f"draws_{year}_") and f.endswith(".npz")
    ]
    if not npz_files:
        print(f"Nenhum modelo de {year} treinado encontrado em {models_dir}.")
        return None

    results = []
    for file_name in npz_files:
        model_name = file_name.replace(f"draws_{year}_", "").replace(".npz", "")
        print(f"Avaliando: {model_name} ...")

        draws = load_draws(os.path.join(models_dir, file_name))
        metrics = calculate_model_brier(draws, teams, results_file)

        results.append(
            {
                "Modelo": model_name.replace("_", " ").title(),
                "Brier Mediana": metrics["Brier Mediana"],
                "IC Inferior": metrics["IC 2.5%"],
                "IC Superior": metrics["IC 97.5%"],
                "IC 95%": f"[{metrics['IC 2.5%']:.4f}  -  {metrics['IC 97.5%']:.4f}]",
            }
        )

    # Lower Brier scores indicate better calibrated three-outcome predictions.
    results_df = (
        pd.DataFrame(results).sort_values("Brier Mediana").reset_index(drop=True)
    )

    print("\n--- RANKING FINAL DE PRECISÃO ---")
    print(results_df.to_string())

    print("\nGerando gráfico de sobreposição...")
    plt.figure(figsize=(10, 6))
    plt.style.use("ggplot")

    # Reverse the order so the best model appears at the top of the plot.
    df_plot = results_df.sort_values("Brier Mediana", ascending=False).reset_index(
        drop=True
    )

    for i in range(len(df_plot)):
        median = df_plot.loc[i, "Brier Mediana"]
        lower = df_plot.loc[i, "IC Inferior"]
        upper = df_plot.loc[i, "IC Superior"]

        plt.plot([lower, upper], [i, i], color="#3498db", linewidth=5, alpha=0.8)
        plt.plot(median, i, "ko", markersize=8)

    # Reference line for the best median score.
    best_median = df_plot["Brier Mediana"].min()
    plt.axvline(
        best_median,
        color="red",
        linestyle="--",
        alpha=0.6,
        label="Mediana do Melhor Modelo",
    )

    plt.yticks(range(len(df_plot)), df_plot["Modelo"], fontsize=10)
    plt.xlabel("Brier Score (Menor é Melhor)", fontsize=12)
    plt.title("Comparação de Modelos: Intervalos de Credibilidade (95%)", fontsize=14)
    plt.legend()
    plt.tight_layout()

    os.makedirs(output_dir, exist_ok=True)

    plot_path = os.path.join(output_dir, f"comparacao_brier_{year}.png")
    plt.savefig(plot_path, dpi=300)
    plt.close()
    print(f"Gráfico salvo com sucesso em: {plot_path}")

    csv_output_path = os.path.join(output_dir, f"brier_score_{year}.csv")
    results_df.to_csv(csv_output_path, index=False)
    print(f"\nResultados salvos em: {csv_output_path}")

    return results_df
