"""Centralized constants for the World Cup 2026 simulation project."""

from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

DEFAULT_MIN_DATE = "2021-01-01"
DEFAULT_SEED = 42
DEFAULT_HALF_LIFE_WEEKS = 52
DEFAULT_REG_LAMBDA = 0.1
MAX_GOALS = 5

HOST_TEAMS: set[str] = {"United States", "Canada", "Mexico"}
DEFAULT_HOST_BOOST = 0.5

# ──────────────────────────────────────────────
# Tournament importance weights
# ──────────────────────────────────────────────
DEFAULT_TOURNAMENT_WEIGHT = 0.5

TOURNAMENT_WEIGHT: dict[str, float] = {
    # Major finals
    "FIFA World Cup": 1.0,
    "Confederations Cup": 1.0,
    "UEFA Euro": 1.0,
    "Copa América": 1.0,
    "African Cup of Nations": 1.0,
    "AFC Asian Cup": 1.0,
    "Gold Cup": 0.9,
    "Oceania Nations Cup": 0.9,
    # Qualifiers
    "FIFA World Cup qualification": 0.85,
    "UEFA Euro qualification": 0.85,
    "Copa América qualification": 0.85,
    "African Cup of Nations qualification": 0.8,
    "AFC Asian Cup qualification": 0.8,
    "Gold Cup qualification": 0.7,
    "Oceania Nations Cup qualification": 0.7,
    # Nations Leagues
    "UEFA Nations League": 0.85,
    "CONCACAF Nations League": 0.8,
    # Minor continental
    "COSAFA Cup": 0.6,
    "SAFF Cup": 0.6,
    "ASEAN Championship": 0.6,
    "AFF Championship": 0.6,
    "EAFF Championship qualification": 0.6,
    "CAFA Nations Cup": 0.6,
    "Arab Cup": 0.6,
    "Gulf Cup": 0.6,
    "Baltic Cup": 0.6,
    "Pacific Games": 0.6,
    "Island Games": 0.6,
}

COLUMNS = [
    "date",
    "home_team",
    "away_team",
    "home_score",
    "away_score",
    "tournament",
    "neutral",
]

# ──────────────────────────────────────────────
# Kaggle dataset
# ──────────────────────────────────────────────
KAGGLE_DATASET = "martj42/international-football-results-from-1872-to-2017"
DATASET_FILES = ("results.csv", "shootouts.csv", "goalscorers.csv")

# ──────────────────────────────────────────────
# Groups (draw Dec 5 2025 + playoffs Mar 31 2026)
# All 48 teams confirmed
# ──────────────────────────────────────────────
GROUPS: dict[str, list[str]] = {
    "A": ["Mexico", "South Korea", "South Africa", "Czech Republic"],
    "B": ["Canada", "Switzerland", "Qatar", "Bosnia and Herzegovina"],
    "C": ["Brazil", "Morocco", "Scotland", "Haiti"],
    "D": ["United States", "Australia", "Paraguay", "Turkey"],
    "E": ["Germany", "Ecuador", "Ivory Coast", "Curacao"],
    "F": ["Netherlands", "Japan", "Tunisia", "Sweden"],
    "G": ["Belgium", "Egypt", "Iran", "New Zealand"],
    "H": ["Spain", "Uruguay", "Saudi Arabia", "Cabo Verde"],
    "I": ["France", "Senegal", "Norway", "Iraq"],
    "J": ["Argentina", "Austria", "Algeria", "Jordan"],
    "K": ["Portugal", "Colombia", "Uzbekistan", "DR Congo"],
    "L": ["England", "Croatia", "Ghana", "Panama"],
}

TEAM_NAME_MAP: dict[str, str] = {
    "United States": "United States",
    "South Korea": "South Korea",
    "Ivory Coast": "Côte d'Ivoire",
    "Curacao": "Curaçao",
    "Cabo Verde": "Cape Verde",
    "DR Congo": "DR Congo",
}

# ──────────────────────────────────────────────
# Round-of-32 fixed slots (FIFA regulations)
# 1X = winner of group X, 2X = runner-up of group X
# 3{...} = best 3rd-place from one of the listed groups
# ──────────────────────────────────────────────
ROUND_OF_32_FIXED: list[tuple[str, str]] = [
    ("1E", "3_ABCDF"),  # Match 74
    ("1I", "3_CDFGH"),  # Match 77
    ("2A", "2B"),  # Match 73
    ("1F", "2C"),  # Match 75
    ("1C", "2F"),  # Match 76
    ("2E", "2I"),  # Match 78
    ("1A", "3_CEFHI"),  # Match 79
    ("1L", "3_EHIJK"),  # Match 80
    ("1D", "3_BEFIJ"),  # Match 81
    ("1G", "3_AEHIJ"),  # Match 82
    ("2K", "2L"),  # Match 83
    ("1H", "2J"),  # Match 84
    ("1B", "3_EFGIJ"),  # Match 85
    ("1J", "2H"),  # Match 86
    ("1K", "3_DEIJL"),  # Match 87
    ("2D", "2G"),  # Match 88
]

# Bracket from Round of 16 onward (indices into ROUND_OF_32_FIXED results)
ROUND_OF_16_PAIRS: list[tuple[int, int]] = [
    (0, 1),  # W74 vs W77  → Match 89
    (2, 3),  # W73 vs W75  → Match 90
    (4, 5),  # W76 vs W78  → Match 91
    (6, 7),  # W79 vs W80  → Match 92
    (10, 11),  # W83 vs W84  → Match 93
    (8, 9),  # W81 vs W82  → Match 94
    (13, 15),  # W86 vs W88  → Match 95
    (12, 14),  # W85 vs W87  → Match 96
]

QUARTERFINAL_PAIRS: list[tuple[int, int]] = [
    (0, 1),  # W89 vs W90  → Match 97
    (4, 5),  # W93 vs W94  → Match 98
    (2, 3),  # W91 vs W92  → Match 99
    (6, 7),  # W95 vs W96  → Match 100
]

SEMIFINAL_PAIRS: list[tuple[int, int]] = [
    (0, 1),  # W97 vs W98  → Match 101
    (2, 3),  # W99 vs W100 → Match 102
]

GROUP_STAGE_MATCHES = 72  # 12 groups × C(4,2)

# ──────────────────────────────────────────────
# Display labels
# ──────────────────────────────────────────────
STAGE_LABELS = [
    ("champion", "Campeão"),
    ("final", "Final"),
    ("semifinals", "Semifinal"),
    ("quarterfinals", "Quartas"),
    ("round_of_16", "Oitavas (R16)"),
    ("round_of_32", "Fase eliminatória (R32)"),
]

PHASE_LABELS = {
    "group_stage": "fase_de_grupos",
    "round_of_32": "rodada_de_32",
    "round_of_16": "oitavas_de_final",
    "quarterfinals": "quartas_de_final",
    "semifinals": "semifinais",
    "final": "final",
}
