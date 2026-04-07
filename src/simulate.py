"""Run the full FIFA World Cup 2026 Monte Carlo simulation."""

from __future__ import annotations

import argparse
import time

from src.constants import (
    DEFAULT_HALF_LIFE_WEEKS,
    DEFAULT_HOST_BOOST,
    DEFAULT_MIN_DATE,
    DEFAULT_REG_LAMBDA,
    DEFAULT_SEED,
    GROUPS,
    TEAM_NAME_MAP,
)
from src.export_probs import export_phase_probs
from src.model import build_model
from src.tournament import WorldCup2026
from src.utils import load_wc_results, resolve_team_name


def print_top_n(
    results: dict[str, dict[str, int]],
    n_sims: int,
    top_n: int = 20,
) -> None:
    """Print a summary table of the top N teams."""
    header = (
        f"{'Pos':>3}  {'Seleção':<22}"
        f"{'Campeão':>8}  {'Final':>8}  {'Semi':>8}  "
        f"{'Quartas':>8}  {'R16':>8}  {'R32':>8}"
    )
    print("\n" + "=" * len(header))
    print(header)
    print("=" * len(header))

    ranked = sorted(results["champion"].items(), key=lambda x: x[1], reverse=True)[
        :top_n
    ]

    for pos, (team, _) in enumerate(ranked, 1):
        champ = results["champion"][team] / n_sims * 100
        final = results["final"][team] / n_sims * 100
        semi = results["semifinals"][team] / n_sims * 100
        qf = results["quarterfinals"][team] / n_sims * 100
        r16 = results["round_of_16"][team] / n_sims * 100
        r32 = results["round_of_32"][team] / n_sims * 100
        print(
            f"{pos:>3}  {team:<22}"
            f"{champ:>7.2f}%  {final:>7.2f}%  {semi:>7.2f}%  "
            f"{qf:>7.2f}%  {r16:>7.2f}%  {r32:>7.2f}%"
        )
    print()


def print_group_probs(
    results: dict[str, dict[str, int]],
    n_sims: int,
) -> None:
    """Print qualification probabilities by group."""
    print("\n" + "=" * 70)
    print("PROBABILIDADES POR GRUPO (classificação para o mata-mata)")
    print("=" * 70)

    known = list(results["round_of_32"].keys())
    for gname, teams in GROUPS.items():
        print(f"\n  Grupo {gname}:")
        for team in teams:
            try:
                resolved = resolve_team_name(team, known)
            except ValueError:
                resolved = TEAM_NAME_MAP.get(team, team)

            prob = results["round_of_32"].get(resolved, 0) / n_sims * 100
            print(f"    {team:<22} {prob:>6.2f}%")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Simulação Monte Carlo da Copa do Mundo 2026"
    )
    parser.add_argument(
        "-n",
        "--num-simulations",
        type=int,
        default=10_000,
        help="Número de simulações (padrão: 10000)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=DEFAULT_SEED,
        help=f"Seed do gerador aleatório (padrão: {DEFAULT_SEED})",
    )
    parser.add_argument(
        "--min-date",
        type=str,
        default=DEFAULT_MIN_DATE,
        help=f"Data mínima para dados de treino (padrão: {DEFAULT_MIN_DATE})",
    )
    parser.add_argument(
        "--top",
        type=int,
        default=20,
        help="Número de seleções no ranking (padrão: 20)",
    )
    parser.add_argument(
        "--half-life",
        type=float,
        default=DEFAULT_HALF_LIFE_WEEKS,
        help=(
            "Meia-vida em semanas para o peso temporal "
            f"(padrão: {DEFAULT_HALF_LIFE_WEEKS})"
        ),
    )
    parser.add_argument(
        "--reg-lambda",
        type=float,
        default=DEFAULT_REG_LAMBDA,
        help=(
            "Força da regularização L2 em log-espaço " f"(padrão: {DEFAULT_REG_LAMBDA})"
        ),
    )
    parser.add_argument(
        "--host-boost",
        type=float,
        default=DEFAULT_HOST_BOOST,
        help=(
            "Fração da vantagem de mandante para sedes "
            f"(padrão: {DEFAULT_HOST_BOOST})"
        ),
    )
    parser.add_argument(
        "--wc-results",
        type=str,
        default=None,
        help="Caminho para CSV com resultados já ocorridos na Copa",
    )
    args = parser.parse_args()

    wc_df, known = None, None
    if args.wc_results:
        wc_df, known = load_wc_results(args.wc_results)

    print("=" * 60)
    print("  SIMULAÇÃO DA COPA DO MUNDO FIFA 2026")
    print("=" * 60)
    print(f"  Simulações: {args.num_simulations:,}")
    print(f"  Seed: {args.seed}")
    print(f"  Dados desde: {args.min_date}")
    print(f"  Meia-vida: {args.half_life:.0f} semanas")
    print(f"  Regularização: {args.reg_lambda}")
    print(f"  Host boost: {args.host_boost}")
    if known:
        print(f"  Resultados da Copa fixados: {len(known)} jogos")
    print()

    print("Ajustando modelo Dixon-Coles (ataque/defesa)...")
    t0 = time.time()
    model = build_model(
        min_date=args.min_date,
        half_life_weeks=args.half_life,
        reg_lambda=args.reg_lambda,
        extra_data=wc_df,
    )
    t_fit = time.time() - t0
    print(f"  Modelo ajustado em {t_fit:.1f}s ({len(model.teams)} seleções)")
    print(f"  Home effect (γ): {model.home_effect:.4f}")
    print(f"  Rho (Dixon-Coles): {model.rho:.4f}")

    print(f"\nSimulando {args.num_simulations:,} torneios...")
    t0 = time.time()
    wc = WorldCup2026(
        model,
        seed=args.seed,
        known_results=known,
        host_boost=args.host_boost,
    )
    tr = wc.simulate(n=args.num_simulations)
    t_sim = time.time() - t0
    print(f"  Simulação concluída em {t_sim:.1f}s")

    stage_results = {
        "champion": tr.champion,
        "final": tr.final,
        "semifinals": tr.semifinals,
        "quarterfinals": tr.quarterfinals,
        "round_of_16": tr.round_of_16,
        "round_of_32": tr.round_of_32,
    }

    print_top_n(stage_results, args.num_simulations, top_n=args.top)
    # print_group_probs(stage_results, args.num_simulations)

    print("Exportando matrizes de probabilidade...")
    prob_path = export_phase_probs(wc, known)
    print(f"  Salvo em: {prob_path}")


if __name__ == "__main__":
    main()
