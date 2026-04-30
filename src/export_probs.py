"""Export score probability matrices for the current tournament phase."""

from __future__ import annotations

import argparse
from collections import defaultdict
from itertools import combinations
from pathlib import Path

import pandas as pd

from src.constants import (
    ALL_SCORE_COLS,
    DATA_DIR,
    DEFAULT_MIN_DATE,
    DEFAULT_SEED,
    MAX_GOALS,
    PHASE_LABELS,
    QUARTERFINAL_PAIRS,
    ROUND_OF_16_PAIRS,
    SCORE_MAP,
    SEMIFINAL_PAIRS,
    TEAM_MAP_EN_TO_PT,
)
from src.model import build_model
from src.tournament import WorldCup2026
from src.utils import detect_phase, load_wc_results


def _knockout_winner(
    ta: str,
    tb: str,
    known: dict[tuple[str, str], tuple[int, int]],
) -> str:
    """Return the winner of a knockout match from known results."""
    for a, b in [(ta, tb), (tb, ta)]:
        if (a, b) in known:
            sa, sb = known[(a, b)]
            if sa > sb:
                return a
            if sb > sa:
                return b
            raise ValueError(
                f"Empate em {ta} vs {tb} ({sa}-{sb}). "
                "Para jogos eliminatórios com empate no tempo regulamentar, "
                "registre o placar agregado (incluindo prorrogação) ou "
                "adicione uma coluna 'winner' no CSV."
            )
    raise KeyError(f"Resultado não encontrado para {ta} vs {tb}")


def _get_ko_winners(
    matchups: list[tuple[str, str]],
    known: dict[tuple[str, str], tuple[int, int]],
) -> list[str]:
    return [_knockout_winner(a, b, known) for a, b in matchups]


def get_phase_matchups(
    wc: WorldCup2026,
    known: dict[tuple[str, str], tuple[int, int]] | None,
    phase: str,
) -> list[tuple[str, str, str]]:
    """Return (home, away, group_label) for every match in the given phase."""
    if phase == "group_stage":
        return [
            (ta, tb, gname)
            for gname, teams in wc.groups.items()
            for ta, tb in combinations(teams, 2)
        ]

    assert known is not None
    standings = wc.simulate_group_stage()
    r32 = wc._resolve_round_of_32(standings)

    if phase == "round_of_32":
        return [(a, b, "") for a, b in r32]

    r32w = _get_ko_winners(r32, known)
    r16 = [(r32w[a], r32w[b]) for a, b in ROUND_OF_16_PAIRS]

    if phase == "round_of_16":
        return [(a, b, "") for a, b in r16]

    r16w = _get_ko_winners(r16, known)
    qf = [(r16w[a], r16w[b]) for a, b in QUARTERFINAL_PAIRS]

    if phase == "quarterfinals":
        return [(a, b, "") for a, b in qf]

    qfw = _get_ko_winners(qf, known)
    sf = [(qfw[a], qfw[b]) for a, b in SEMIFINAL_PAIRS]

    if phase == "semifinals":
        return [(a, b, "") for a, b in sf]

    sfw = _get_ko_winners(sf, known)
    return [(sfw[0], sfw[1], "")]


def build_prob_dataframe(
    wc,
    matchups,
    max_goals=4,
    results_path="data/world_cup_results.csv",
):
    results_df = pd.read_csv(results_path)
    for col in ["home_team", "away_team", "group"]:
        results_df[col] = results_df[col].astype(str).str.strip()

    rows = []

    for home_en, away_en, group in matchups:
        home = TEAM_MAP_EN_TO_PT.get(home_en)
        away = TEAM_MAP_EN_TO_PT.get(away_en)

        if home is None or away is None:
            raise ValueError(f"Time sem mapeamento: {home_en} vs {away_en}")

        prob = wc.params.match_probs(
            home_en, away_en, neutral=True, max_goals=max_goals
        )

        match_info = results_df[
            (results_df["group"] == group)
            & (results_df["home_team"] == home)
            & (results_df["away_team"] == away)
        ]

        flipped = False

        if match_info.empty:
            match_info = results_df[
                (results_df["group"] == group)
                & (results_df["home_team"] == away)
                & (results_df["away_team"] == home)
            ]
            flipped = True

        if len(match_info) != 1:
            date = None
            home_real = None
            away_real = None
        else:
            date = match_info["date"].values[0]
            home_real = match_info["home_real"].values[0]
            away_real = match_info["away_real"].values[0]

        if flipped:
            prob = prob.T
            home, away = away, home

        row = {
            "group": group,
            "home_team": home,
            "away_team": away,
            "date": date,
            **dict.fromkeys(ALL_SCORE_COLS, 0.0),
            "home_real": home_real,
            "away_real": away_real,
        }

        for i in range(prob.shape[0]):
            for j in range(prob.shape[1]):
                if (i, j) in SCORE_MAP:
                    row[SCORE_MAP[(i, j)]] = round(100 * prob[i, j], 4)

        rows.append(row)

    df = pd.DataFrame(rows)
    df = df[
        ["group", "home_team", "away_team", "date"]
        + ALL_SCORE_COLS
        + ["home_real", "away_real"]
    ]

    return df


def save_matches_to_prod(
    df: pd.DataFrame, prod_path="docs/csv/placares/partidas.csv"
) -> None:
    path = Path(prod_path)
    key_cols = ["group", "home_team", "away_team"]
    if path.exists():
        existing = pd.read_csv(path)
        combined = pd.concat([existing, df], ignore_index=True)
        combined = combined.drop_duplicates(subset=key_cols, keep="last")
    else:
        combined = df.copy()
        combined = combined.drop_duplicates(subset=key_cols, keep="last")

    combined.to_csv(path, index=False)


def export_phase_probs(
    wc: WorldCup2026,
    known: dict[tuple[str, str], tuple[int, int]] | None,
    max_goals: int = MAX_GOALS,
) -> Path:
    """Detect current phase, compute probability matrices, save to CSV."""
    phase = detect_phase(known, wc.groups)
    label = PHASE_LABELS[phase][0]
    matchups = get_phase_matchups(wc, known, phase)
    df = build_prob_dataframe(wc, matchups, max_goals=max_goals)
    if df["group"].values[0] == "":
        df["group"] = PHASE_LABELS[phase][1]

    save_matches_to_prod(df)
    output_path = DATA_DIR / f"probs_{label}.csv"
    df.to_csv(output_path, index=False)
    return output_path


def build_stage_dataframe(
    results: dict[str, dict[str, int]],
    n_sims: int,
    output_path: str = "data/summary.csv",
) -> pd.DataFrame:
    stages = [
        "champion",
        "final",
        "semifinals",
        "quarterfinals",
        "round_of_16",
        "round_of_32",
        "group_first_place",
        "group_second_place",
        "group_third_place",
    ]

    mapped_results = {stage: defaultdict(int) for stage in stages}

    for stage in stages:
        for team_en, value in results[stage].items():
            team_pt = TEAM_MAP_EN_TO_PT.get(team_en, team_en)
            mapped_results[stage][team_pt] += value

    all_teams = mapped_results["champion"].keys()

    ranked = sorted(
        all_teams,
        key=lambda t: tuple(mapped_results[s].get(t, 0) for s in stages),
        reverse=True,
    )

    rows = []

    for pos, team in enumerate(ranked, 1):
        rows.append(
            {
                "position": pos,
                "team": team,
                "champion": mapped_results["champion"].get(team, 0) / n_sims * 100,
                "final": mapped_results["final"].get(team, 0) / n_sims * 100,
                "semifinals": mapped_results["semifinals"].get(team, 0) / n_sims * 100,
                "quarterfinals": mapped_results["quarterfinals"].get(team, 0)
                / n_sims
                * 100,
                "round_of_16": mapped_results["round_of_16"].get(team, 0)
                / n_sims
                * 100,
                "round_of_32": mapped_results["round_of_32"].get(team, 0)
                / n_sims
                * 100,
                "group_first_place": mapped_results["group_first_place"].get(team, 0)
                / n_sims
                * 100,
                "group_second_place": mapped_results["group_second_place"].get(team, 0)
                / n_sims
                * 100,
                "group_third_place": mapped_results["group_third_place"].get(team, 0)
                / n_sims
                * 100,
            }
        )

    df = pd.DataFrame(rows)

    df = df[
        [
            "position",
            "team",
            "champion",
            "final",
            "semifinals",
            "quarterfinals",
            "round_of_16",
            "round_of_32",
            "group_first_place",
            "group_second_place",
            "group_third_place",
        ]
    ]

    df = df.round(2)
    df.to_csv(output_path, index=False)

    return df


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Exportar matrizes de probabilidade de resultados por fase"
    )
    parser.add_argument(
        "--wc-results",
        type=str,
        default=None,
        help="Caminho para CSV com resultados já ocorridos na Copa",
    )
    parser.add_argument(
        "--min-date",
        type=str,
        default=DEFAULT_MIN_DATE,
        help=f"Data mínima para dados de treino (padrão: {DEFAULT_MIN_DATE})",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=DEFAULT_SEED,
        help=f"Seed do gerador aleatório (padrão: {DEFAULT_SEED})",
    )
    parser.add_argument(
        "--max-goals",
        type=int,
        default=MAX_GOALS,
        help=f"Máximo de gols por time na matriz (padrão: {MAX_GOALS})",
    )
    args = parser.parse_args()

    wc_df, known = None, None
    if args.wc_results:
        wc_df, known = load_wc_results(args.wc_results)

    print("Ajustando modelo...")
    model = build_model(min_date=args.min_date, extra_data=wc_df)
    wc = WorldCup2026(model.fitted_parameters(), seed=args.seed, known_results=known)

    phase = detect_phase(known, wc.groups)
    label = PHASE_LABELS[phase][0]
    print(f"Fase detectada: {label}")

    matchups = get_phase_matchups(wc, known, phase)
    print(f"Jogos na fase: {len(matchups)}")

    df = build_prob_dataframe(wc, matchups, max_goals=args.max_goals)

    filename = f"probs_{label}.csv"
    output_path = DATA_DIR / filename
    df.to_csv(output_path, index=False)
    print(f"Arquivo salvo em: {output_path}")


if __name__ == "__main__":
    main()
