"""Centralized constants for the World Cup 2026 simulation project."""

from datetime import date as _date
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# ──────────────────────────────────────────────
# 2026 World Cup phase dates
# ──────────────────────────────────────────────

WC_2026_FIFA_DATE_START = _date(2026, 5, 29)
WC_2026_FIFA_DATE_END = _date(2026, 6, 6)
WC_2026_FREEZE_DATE = _date(2026, 6, 10)

WC_2026_START = _date(2026, 6, 11)
WC_2026_R32_START = _date(2026, 6, 28)
WC_2026_R16_START = _date(2026, 7, 4)
WC_2026_QF_START = _date(2026, 7, 9)
WC_2026_SF_START = _date(2026, 7, 14)
WC_2026_THIRD_PLACE = _date(2026, 7, 18)
WC_2026_FINAL = _date(2026, 7, 19)

WC_YEAR: int = WC_2026_START.year
REFERENCE_DATE: _date = _date.today()
REFERENCE_DATE: _date = _date(2026, 5, 20)
CUP_STARTED: bool = REFERENCE_DATE >= WC_2026_FREEZE_DATE


def get_pre_tournament_version(reference_date: _date | None = None) -> str:
    """Return the tabela_chances.csv version label based on the current date.

    Pre-tournament:
    - < 29/05  → 'Antes da Data FIFA'
    - 29/05–06/06 → 'Antes da Copa - pós data FIFA'

    During the Cup (date-based approximation):
    - 28/06–03/07 → 'Após a Fase de Grupos'
    - 04/07–08/07 → 'Após os 16-Avos'
    - 09/07–13/07 → 'Após as Oitavas'
    - 14/07–18/07 → 'Após as Quartas'
    - ≥ 19/07    → 'Após as Semifinais'
    """
    if reference_date is None:
        reference_date = REFERENCE_DATE
    if reference_date < WC_2026_FIFA_DATE_START:
        return "Antes da Data FIFA"
    if reference_date <= WC_2026_START:
        return "Antes da Copa - pós data FIFA"
    if reference_date < WC_2026_R16_START:
        return "Após a Fase de Grupos"
    if reference_date < WC_2026_QF_START:
        return "Após os 16-Avos"
    if reference_date < WC_2026_SF_START:
        return "Após as Oitavas"
    if reference_date < WC_2026_FINAL:
        return "Após as Quartas"
    return "Após as Semifinais"


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
    "E": ["Germany", "Ecuador", "Ivory Coast", "Curaçao"],
    "F": ["Netherlands", "Japan", "Tunisia", "Sweden"],
    "G": ["Belgium", "Egypt", "Iran", "New Zealand"],
    "H": ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"],
    "I": ["France", "Senegal", "Norway", "Iraq"],
    "J": ["Argentina", "Austria", "Algeria", "Jordan"],
    "K": ["Portugal", "Colombia", "Uzbekistan", "DR Congo"],
    "L": ["England", "Croatia", "Ghana", "Panama"],
}

TEAM_NAME_MAP: dict[str, str] = {
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
    "group_stage": ["fase_de_grupos", ""],
    "round_of_32": ["rodada_de_32", "16s"],
    "round_of_16": ["oitavas_de_final", "8s"],
    "quarterfinals": ["quartas_de_final", "4s"],
    "semifinals": ["semifinais", "SF"],
    "final": ["final", "F"],
}

SCORE_MAP = {
    (1, 0): "one_zero",
    (2, 0): "two_zero",
    (3, 0): "three_zero",
    (4, 0): "four_zero",
    (4, 1): "four_one",
    (2, 1): "two_one",
    (3, 1): "three_one",
    (3, 2): "three_two",
    (4, 2): "four_two",
    (4, 3): "four_three",
    (0, 0): "zero_zero",
    (1, 1): "one_one",
    (2, 2): "two_two",
    (3, 3): "three_three",
    (4, 4): "four_four",
    (0, 1): "zero_one",
    (0, 2): "zero_two",
    (0, 3): "zero_three",
    (0, 4): "zero_four",
    (1, 2): "one_two",
    (1, 3): "one_three",
    (1, 4): "one_four",
    (2, 3): "two_three",
    (2, 4): "two_four",
    (3, 4): "three_four",
}

ALL_SCORE_COLS = list(SCORE_MAP.values())

_GOAL_WORDS = ("zero", "one", "two", "three", "four")
PARTIDAS_SCORE_COLS = [
    f"{_GOAL_WORDS[h]}_{_GOAL_WORDS[a]}" for h in range(5) for a in range(5)
]

PARTIDAS_EXPORT_COLS = [
    "group",
    "home_team",
    "away_team",
    "date",
    "home_win",
    "draw",
    "away_win",
    *PARTIDAS_SCORE_COLS,
]

ALL_MATCHUPS_EXPORT_COLS = [
    "home_team",
    "away_team",
    "home_win",
    "draw",
    "away_win",
    *PARTIDAS_SCORE_COLS,
]

TEAM_MAP_EN_TO_PT = {
    # Group A
    "Mexico": "México",
    "South Korea": "Coreia do Sul",
    "South Africa": "África do Sul",
    "Czech Republic": "Tchéquia",
    # Group B
    "Canada": "Canadá",
    "Switzerland": "Suíça",
    "Qatar": "Catar",
    "Bosnia and Herzegovina": "Bósnia e Herzegovina",
    # Group C
    "Brazil": "Brasil",
    "Morocco": "Marrocos",
    "Scotland": "Escócia",
    "Haiti": "Haiti",
    # Group D
    "United States": "EUA",
    "Australia": "Austrália",
    "Paraguay": "Paraguai",
    "Turkey": "Turquia",
    # Group E
    "Germany": "Alemanha",
    "Ecuador": "Equador",
    "Ivory Coast": "Costa do Marfim",
    "Curaçao": "Curaçao",
    # Group F
    "Netherlands": "Países Baixos",
    "Japan": "Japão",
    "Tunisia": "Tunísia",
    "Sweden": "Suécia",
    # Group G
    "Belgium": "Bélgica",
    "Egypt": "Egito",
    "Iran": "Irã",
    "New Zealand": "Nova Zelândia",
    # Group H
    "Spain": "Espanha",
    "Uruguay": "Uruguai",
    "Saudi Arabia": "Arábia Saudita",
    "Cape Verde": "Cabo Verde",
    # Group I
    "France": "França",
    "Senegal": "Senegal",
    "Norway": "Noruega",
    "Iraq": "Iraque",
    # Group J
    "Argentina": "Argentina",
    "Austria": "Áustria",
    "Algeria": "Argélia",
    "Jordan": "Jordânia",
    # Group K
    "Portugal": "Portugal",
    "Colombia": "Colômbia",
    "Uzbekistan": "Uzbequistão",
    "DR Congo": "República Democrática do Congo",
    # Group L
    "England": "Inglaterra",
    "Croatia": "Croácia",
    "Ghana": "Gana",
    "Panama": "Panamá",
}

TEAM_MAP_PT_TO_EN = {v: k for k, v in TEAM_MAP_EN_TO_PT.items()}

FLAG_MAPPING = {
    "Argentina": "🇦🇷",
    "Espanha": "🇪🇸",
    "Brasil": "🇧🇷",
    "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "França": "🇫🇷",
    "Colômbia": "🇨🇴",
    "Marrocos": "🇲🇦",
    "Portugal": "🇵🇹",
    "Alemanha": "🇩🇪",
    "Japão": "🇯🇵",
    "Uruguai": "🇺🇾",
    "Países Baixos": "🇳🇱",
    "Equador": "🇪🇨",
    "Bélgica": "🇧🇪",
    "Noruega": "🇳🇴",
    "Croácia": "🇭🇷",
    "Suíça": "🇨🇭",
    "Senegal": "🇸🇳",
    "México": "🇲🇽",
    "Canadá": "🇨🇦",
    "Austrália": "🇦🇺",
    "Áustria": "🇦🇹",
    "Argélia": "🇩🇿",
    "Irã": "🇮🇷",
    "Paraguai": "🇵🇾",
    "Egito": "🇪🇬",
    "Turquia": "🇹🇷",
    "Costa do Marfim": "🇨🇮",
    "EUA": "🇺🇸",
    "Escócia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "Coreia do Sul": "🇰🇷",
    "Tchéquia": "🇨🇿",
    "Uzbequistão": "🇺🇿",
    "Tunísia": "🇹🇳",
    "Suécia": "🇸🇪",
    "República Democrática do Congo": "🇨🇩",
    "Jordânia": "🇯🇴",
    "Gana": "🇬🇭",
    "Arábia Saudita": "🇸🇦",
    "Panamá": "🇵🇦",
    "Bósnia e Herzegovina": "🇧🇦",
    "Iraque": "🇮🇶",
    "Nova Zelândia": "🇳🇿",
    "África do Sul": "🇿🇦",
    "Cabo Verde": "🇨🇻",
    "Catar": "🇶🇦",
    "Curaçao": "🇨🇼",
    "Haiti": "🇭🇹",
}
