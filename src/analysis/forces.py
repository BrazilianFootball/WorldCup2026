import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

from src.constants import CYCLE_CUTOFFS
from src.data import prepare_cycle_data

_, teams_26, _ = prepare_cycle_data(
    "data/raw/results.csv", CYCLE_CUTOFFS[2026][0], apply_decay=True
)
npz_path = "data/outputs/models/draws_2026_n_poisson_ranking.npz"
stan_data = np.load(npz_path)
atk_samples = stan_data["attack"]
def_samples = stan_data["defense"]

strength_samples = atk_samples + def_samples

mean_strengths = np.mean(strength_samples, axis=0)
top_indices = np.argsort(mean_strengths)[::-1][:20]

plot_data = []
for idx in top_indices:
    team = teams_26[idx]
    # Use all posterior samples for this team.
    team_samples = strength_samples[:, idx]

    for val in team_samples:
        plot_data.append({"Time": team, "Strength": val})

df_plot = pd.DataFrame(plot_data)

plt.figure(figsize=(14, 8))

sns.violinplot(
    x="Strength",
    y="Time",
    data=df_plot,
    palette="viridis",
    inner="quartile",  # Desenha as linhas dos quartis dentro do violino
    linewidth=1.2,
)

plt.title(
    "Distribuição da Força (Strength) - Top 20 Seleções", fontsize=16, fontweight="bold"
)
plt.xlabel("Força Total (Atk + Def)", fontsize=12)
plt.ylabel("Seleção", fontsize=12)
plt.grid(axis="x", linestyle="--", alpha=0.5)

plt.tight_layout()
plt.savefig("data/outputs/results/distribuicao_strength.png", dpi=150)
