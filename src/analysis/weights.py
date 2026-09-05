import os

import matplotlib.pyplot as plt
import pandas as pd

from src.constants import CYCLE_CUTOFFS
from src.data import prepare_cycle_data

# Create the output directory if it doesn't exist
output_dir = "data/outputs/results"
os.makedirs(output_dir, exist_ok=True)

# Load data with weights and dates
df_cycle, _, _ = prepare_cycle_data(
    "data/raw/results.csv", CYCLE_CUTOFFS[2026][0], apply_decay=True
)

# Convert date column to datetime type and set it as index
df_cycle["date"] = pd.to_datetime(df_cycle["date"])
df_plot = df_cycle.set_index("date")

# Group by week ('W') and calculate the mean for both weights
weekly_total_weights = df_plot["game_weight"].resample("W").mean().dropna()
weekly_time_weights = df_plot["time_weight"].resample("W").mean().dropna()


# Total Game Weight
plt.figure(figsize=(10, 5))
plt.plot(weekly_total_weights.index, weekly_total_weights.values, marker="o")
plt.title("Weekly Average: Total Game Weight")
plt.ylabel("Game Weight")
plt.grid(True, linestyle="--", alpha=0.6)
plt.tight_layout()

# Save and close the first chart
path_total = os.path.join(output_dir, "weekly_total_weight.png")
plt.savefig(path_total, dpi=150)
plt.close()
print(f"Saved: {path_total}")


# Time Weight (Decay Only)
plt.figure(figsize=(10, 5))
plt.plot(weekly_time_weights.index, weekly_time_weights.values, marker="o")
plt.title("Weekly Average: Time Weight (Decay)")
plt.xlabel("Date")
plt.ylabel("Time Weight")
plt.grid(True, linestyle="--", alpha=0.6)
plt.tight_layout()

# Save and close the second chart
path_time = os.path.join(output_dir, "weekly_time_weight.png")
plt.savefig(path_time, dpi=150)
plt.close()
print(f"Saved: {path_time}")

# hist weights
plt.hist(df_cycle["game_weight"])
path_time = os.path.join(output_dir, "hist_total_weight.png")
plt.savefig(path_time, dpi=150)
plt.close()
print(f"Saved: {path_time}")
