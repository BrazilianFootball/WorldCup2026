"""Export score probability matrices for the current tournament phase."""

from __future__ import annotations

import argparse
from itertools import combinations
from pathlib import Path

import pandas as pd

from src.constants import (
    DATA_DIR,
    DEFAULT_MIN_DATE,
    DEFAULT_SEED,
    MAX_GOALS,
    PHASE_LABELS,
    QUARTERFINAL_PAIRS,
    ROUND_OF_16_PAIRS,
    SEMIFINAL_PAIRS,
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
    wc: WorldCup2026,
    matchups: list[tuple[str, str, str]],
    max_goals: int = MAX_GOALS,
) -> pd.DataFrame:
    """Compute probability matrices and return a flat DataFrame."""
    rows: list[dict] = []
    for home, away, group in matchups:
        prob = wc.params.match_probs(home, away, neutral=True, max_goals=max_goals)
        for i in range(prob.shape[0]):
            for j in range(prob.shape[1]):
                p = prob[i, j]
                if p > 1e-10:
                    rows.append(
                        {
                            "group": group,
                            "home_team": home,
                            "away_team": away,
                            "home_score": i,
                            "away_score": j,
                            "probability": round(p, 8),
                        }
                    )
    return pd.DataFrame(rows)


def export_phase_probs(
    wc: WorldCup2026,
    known: dict[tuple[str, str], tuple[int, int]] | None,
    max_goals: int = MAX_GOALS,
) -> Path:
    """Detect current phase, compute probability matrices, save to CSV."""
    phase = detect_phase(known, wc.groups)
    label = PHASE_LABELS[phase]
    matchups = get_phase_matchups(wc, known, phase)
    df = build_prob_dataframe(wc, matchups, max_goals=max_goals)
    output_path = DATA_DIR / f"probs_{label}.csv"
    df.to_csv(output_path, index=False)
    return output_path


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
    label = PHASE_LABELS[phase]
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
