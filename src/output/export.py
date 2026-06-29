"""Export score probability matrices for the current tournament phase."""

from __future__ import annotations

import argparse
import csv
from itertools import combinations
from pathlib import Path

import numpy as np
import pandas as pd

from src.constants import (
    ALL_MATCHUPS_EXPORT_COLS,
    DATA_DIR,
    DEFAULT_MIN_DATE,
    DEFAULT_SEED,
    MAX_GOALS,
    PARTIDAS_EXPORT_COLS,
    PARTIDAS_SCORE_COLS,
    PHASE_LABELS,
    QUARTERFINAL_PAIRS,
    ROUND_OF_16_PAIRS,
    SEMIFINAL_PAIRS,
    TEAM_MAP_EN_TO_PT,
)
from src.data import detect_phase, load_wc_results
from src.model.frequentist import build_model
from src.tournament.bayesian import (
    _load_schedule_orientations,
    _resolve_fixture_orientation,
)
from src.tournament.frequentist import WorldCup2026


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


def _match_prob_matrix(
    wc: WorldCup2026,
    home_en: str,
    away_en: str,
    max_goals: int,
) -> np.ndarray:
    """Return score probability matrix with rows = home goals, cols = away goals."""
    return wc.params.match_probs(home_en, away_en, neutral=True, max_goals=max_goals)


def _outcome_probs(prob: np.ndarray) -> tuple[float, float, float]:
    home_win = float(np.tril(prob, k=-1).sum()) * 100
    draw = float(np.trace(prob)) * 100
    away_win = float(np.triu(prob, k=1).sum()) * 100
    return home_win, draw, away_win


def _score_probs(prob: np.ndarray, score_cols: int = 5) -> dict[str, float]:
    scores: dict[str, float] = {}
    for h in range(score_cols):
        for a in range(score_cols):
            if h < prob.shape[0] and a < prob.shape[1]:
                key = PARTIDAS_SCORE_COLS[h * score_cols + a]
                scores[key] = round(100 * prob[h, a], 4)
    return scores


def _build_match_prob_row(
    wc: WorldCup2026,
    home_en: str,
    away_en: str,
    max_goals: int,
) -> dict[str, float]:
    """Shared Dixon–Coles export for one fixture orientation (home_en vs away_en)."""
    prob = _match_prob_matrix(wc, home_en, away_en, max_goals=max_goals)
    home_win, draw, away_win = _outcome_probs(prob)
    return {
        "home_win": round(home_win, 4),
        "draw": round(draw, 4),
        "away_win": round(away_win, 4),
        **_score_probs(prob),
    }


def build_all_matchups_dataframe(
    wc: WorldCup2026,
    max_goals: int = MAX_GOALS,
    results_path: str = "data/results.csv",
) -> pd.DataFrame:
    """Build score probabilities for every unique pair (C(48,2) rows).

    Scheduled fixtures use the same home/away orientation as ``partidas.csv`` so
    overlapping rows share identical probabilities.
    """
    schedule = _load_schedule_orientations(results_path)
    rows = []

    for team_a_en, team_b_en in combinations(wc.all_teams, 2):
        home_en, away_en, _, _ = _resolve_fixture_orientation(
            team_a_en, team_b_en, schedule
        )
        home_pt = TEAM_MAP_EN_TO_PT.get(home_en, home_en)
        away_pt = TEAM_MAP_EN_TO_PT.get(away_en, away_en)

        row = {
            "home_team": home_pt,
            "away_team": away_pt,
            **_build_match_prob_row(wc, home_en, away_en, max_goals=max_goals),
        }
        rows.append(row)

    return pd.DataFrame(rows)[ALL_MATCHUPS_EXPORT_COLS]


def build_prob_dataframe(
    wc: WorldCup2026,
    matchups: list[tuple[str, str, str]],
    max_goals: int = MAX_GOALS,
    results_path: str = "data/results.csv",
) -> pd.DataFrame:
    schedule = _load_schedule_orientations(results_path)
    rows = []

    for home_en, away_en, group in matchups:
        home_pt = TEAM_MAP_EN_TO_PT.get(home_en)
        away_pt = TEAM_MAP_EN_TO_PT.get(away_en)

        if home_pt is None or away_pt is None:
            raise ValueError(f"Time sem mapeamento: {home_en} vs {away_en}")

        resolved_home_en, resolved_away_en, sched_group, date = (
            _resolve_fixture_orientation(home_en, away_en, schedule)
        )
        home_pt = TEAM_MAP_EN_TO_PT.get(resolved_home_en, resolved_home_en)
        away_pt = TEAM_MAP_EN_TO_PT.get(resolved_away_en, resolved_away_en)

        if group == "" and sched_group is not None:
            group = sched_group

        row = {
            "group": group,
            "home_team": home_pt,
            "away_team": away_pt,
            "date": date,
            **_build_match_prob_row(
                wc, resolved_home_en, resolved_away_en, max_goals=max_goals
            ),
        }
        rows.append(row)

    return pd.DataFrame(rows)[PARTIDAS_EXPORT_COLS]


def save_matches_to_prod(
    df: pd.DataFrame, prod_path: str = "docs/csv/previsoes/partidas.csv"
) -> None:
    path = Path(prod_path)
    export_df = df[PARTIDAS_EXPORT_COLS]
    key_cols = ["group", "home_team", "away_team"]
    if path.exists():
        existing = pd.read_csv(path)
        combined = pd.concat([existing, export_df], ignore_index=True)
        combined = combined.drop_duplicates(subset=key_cols, keep="last")
    else:
        combined = export_df.copy()
        combined = combined.drop_duplicates(subset=key_cols, keep="last")

    combined[PARTIDAS_EXPORT_COLS].to_csv(path, index=False)


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

    output_path = DATA_DIR / f"probs_{label}.csv"
    df.to_csv(output_path, index=False)
    return output_path


def get_flags():
    flags = {}
    try:
        with open("docs/images/flags/flag.csv", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader)
            col_pt = header.index([h for h in header if "country_pt" in h][0])
            col_svg = header.index([h for h in header if "svg_github" in h][0])
            for row in reader:
                flags[row[col_pt].strip()] = row[col_svg].strip()
    except Exception as e:
        print("Could not load flags", e)
    return flags


FLAGS = get_flags()


def get_flag(team_name):
    return FLAGS.get(team_name, "🏳️")


def update_html_from_summary(
    df: pd.DataFrame,
    tabela_csv: str = "docs/csv/previsoes/tabela_chances.csv",
    version: str = "Antes da Copa",
):
    new_rows = []
    for _, row in df.iterrows():
        team = row["team"]
        new_rows.append(
            {
                "versão": version,
                "pos": int(row["position"]),
                "team": team,
                "flag": get_flag(team),
                "champ": float(row["champion"]),
                "final": float(row["final"]),
                "semi": float(row["semifinals"]),
                "qf": float(row["quarterfinals"]),
                "r16": float(row["round_of_16"]),
                "r32": float(row["round_of_32"]),
            }
        )

    tabela_path = Path(tabela_csv)
    fieldnames = [
        "versão",
        "pos",
        "team",
        "flag",
        "champ",
        "final",
        "semi",
        "qf",
        "r16",
        "r32",
    ]

    existing_rows = []
    if tabela_path.exists():
        with open(tabela_path, encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                v = row.get("versão") or row.get("versao") or row.get("version", "")
                if v != version:
                    existing_rows.append({k: row.get(k, "") for k in fieldnames})

    combined = existing_rows + new_rows

    # Sort within each version: champ → final → semi → qf → r16 → r32 DESC, team ASC
    sort_cols = ["champ", "final", "semi", "qf", "r16", "r32"]
    version_order = list(dict.fromkeys(r["versão"] for r in combined))
    combined_df = pd.DataFrame(combined)
    for col in sort_cols:
        combined_df[col] = pd.to_numeric(combined_df[col], errors="coerce").fillna(0.0)
    combined_df["_vorder"] = combined_df["versão"].map(
        {v: i for i, v in enumerate(version_order)}
    )
    combined_df = combined_df.sort_values(
        by=["_vorder", *sort_cols, "team"],
        ascending=[True, *[False] * len(sort_cols), True],
    ).drop(columns=["_vorder"])
    combined_df["pos"] = combined_df.groupby("versão", sort=False).cumcount() + 1
    combined = combined_df[fieldnames].to_dict("records")

    tabela_path.parent.mkdir(parents=True, exist_ok=True)
    with open(tabela_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(combined)

    print(f"tabela_chances.csv atualizado com versão '{version}'.")


def update_chaveamento_probs(
    bracket_df,
    version,
    chaveamento_csv="docs/csv/previsoes/chaveamento_probs.csv",
):
    """Versiona chaveamento_probs.csv de forma análoga a update_html_from_summary."""
    fieldnames = [
        "versão",
        "side",
        "round_index",
        "round_label",
        "order",
        "id",
        "home_team",
        "prob_home",
        "away_team",
        "prob_away",
        "winner",
    ]

    new_df = bracket_df.copy()
    new_df.insert(0, "versão", version)
    new_rows = new_df[fieldnames].to_dict(orient="records")

    path = Path(chaveamento_csv)
    existing_rows = []
    if path.exists():
        with open(path, encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                v = row.get("versão") or row.get("version", "")
                if v != version:
                    existing_rows.append({k: row.get(k, "") for k in fieldnames})

    combined = existing_rows + new_rows
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(combined)

    print(f"chaveamento_probs.csv atualizado com versão '{version}'.")


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
    if len(df) and df["group"].values[0] == "":
        df["group"] = PHASE_LABELS[phase][1]

    filename = f"probs_{label}.csv"
    output_path = DATA_DIR / filename
    df.to_csv(output_path, index=False)
    print(f"Arquivo salvo em: {output_path}")
    print(
        "Nota: partidas.csv e all_matchups.csv são gerados pelo pipeline Stan "
        "(uv run python -m src.simulations.sim_2026)."
    )


if __name__ == "__main__":
    main()
