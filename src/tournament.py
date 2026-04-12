"""FIFA World Cup 2026 tournament structure and Monte Carlo simulation."""

from __future__ import annotations

from dataclasses import dataclass, field
from itertools import combinations

import numpy as np
from numpy.typing import NDArray

from src.constants import (
    DEFAULT_HOST_BOOST,
    GROUPS,
    HOST_TEAMS,
    MAX_GOALS,
    QUARTERFINAL_PAIRS,
    ROUND_OF_16_PAIRS,
    ROUND_OF_32_FIXED,
    SEMIFINAL_PAIRS,
)
from src.data_classes import (
    TournamentModelParams,
    TournamentParamsSeries,
)
from src.utils import (
    effective_home_gamma_vec,
    resolve_team_name,
    score_probability_matrix_batched,
)


@dataclass
class GroupStanding:
    team: str
    points: int = 0
    goals_for: int = 0
    goals_against: int = 0
    wins: int = 0
    draws: int = 0
    losses: int = 0

    @property
    def goal_diff(self) -> int:
        return self.goals_for - self.goals_against

    @property
    def sort_key(self) -> tuple[int, int, int]:
        """Higher is better for all components."""
        return (self.points, self.goal_diff, self.goals_for)


@dataclass
class TournamentResult:
    """Accumulated results across many simulations."""

    counts: int = 0
    group_stage: dict[str, int] = field(default_factory=dict)
    round_of_32: dict[str, int] = field(default_factory=dict)
    round_of_16: dict[str, int] = field(default_factory=dict)
    quarterfinals: dict[str, int] = field(default_factory=dict)
    semifinals: dict[str, int] = field(default_factory=dict)
    final: dict[str, int] = field(default_factory=dict)
    champion: dict[str, int] = field(default_factory=dict)


class WorldCup2026:
    """Simulate the entire FIFA World Cup 2026 tournament."""

    _THIRD_SLOTS: list[tuple[int, str]] = [
        (i, sb) for i, (_, sb) in enumerate(ROUND_OF_32_FIXED) if sb.startswith("3_")
    ]

    _SERIES_CHUNK = 512

    def __init__(
        self,
        params: TournamentModelParams | TournamentParamsSeries,
        seed: int = 42,
        known_results: dict[tuple[str, str], tuple[int, int]] | None = None,
        host_boost: float = DEFAULT_HOST_BOOST,
    ) -> None:
        self.rng = np.random.default_rng(seed)
        self._host_boost = host_boost
        self._strength_row: int | None = None

        if isinstance(params, TournamentParamsSeries):
            self.fixed_params: TournamentModelParams | None = None
            self.series_params = params
            universe = params.team_order
        else:
            self.fixed_params = params
            self.series_params = None
            universe = params.teams

        self.groups: dict[str, list[str]] = {}
        for gname, teams in GROUPS.items():
            self.groups[gname] = [resolve_team_name(t, universe) for t in teams]

        self.all_teams: list[str] = []
        for teams in self.groups.values():
            self.all_teams.extend(teams)

        self._team_idx = {t: i for i, t in enumerate(self.all_teams)}
        self._group_names = list(self.groups.keys())
        self._n_groups = len(self._group_names)
        self._third_cache: dict[frozenset[str], dict[int, str]] = {}

        self._host_indices: set[int] = set()
        for ht in HOST_TEAMS:
            try:
                resolved = resolve_team_name(ht, universe)
                self._host_indices.add(self._team_idx[resolved])
            except (ValueError, KeyError):
                pass

        self._known: dict[tuple[int, int], tuple[int, int]] = {}
        if known_results:
            for (ta, tb), (sa, sb) in known_results.items():
                ra = resolve_team_name(ta, universe)
                rb = resolve_team_name(tb, universe)
                ia = self._team_idx[ra]
                ib = self._team_idx[rb]
                self._known[(ia, ib)] = (sa, sb)
                self._known[(ib, ia)] = (sb, sa)

        self._mg = MAX_GOALS + 1
        self._mg2 = self._mg * self._mg

        if self.series_params is not None:
            if list(self.series_params.team_order) != self.all_teams:
                raise ValueError(
                    "TournamentParamsSeries.team_order must equal the resolved "
                    "World Cup list WorldCup2026.all_teams (same order as GROUPS)."
                )
            self._flat_probs = None
            self._flat_probs_et = None
        else:
            self._precompute_probs()

    @property
    def params(self) -> TournamentModelParams:
        """Fitted snapshot used for exports; unavailable in series-param mode."""
        if self.fixed_params is None:
            raise TypeError(
                "WorldCup2026 was constructed with TournamentParamsSeries; "
                "there is no single TournamentModelParams. Use export helpers "
                "with an explicit TournamentModelParams if needed."
            )
        return self.fixed_params

    # ── fast-path helpers (index-based) ──────────────────────────

    def _precompute_probs(self) -> None:
        """Precompute flattened score-probability vectors for every team pair."""
        assert self.fixed_params is not None
        nt = len(self.all_teams)
        mg2 = self._mg2
        self._flat_probs = np.zeros((nt, nt, mg2))
        self._flat_probs_et = np.zeros((nt, nt, mg2))
        hb = self._host_boost
        hi = self._host_indices
        fp = self.fixed_params
        for i in range(nt):
            for j in range(i + 1, nt):
                ti, tj = self.all_teams[i], self.all_teams[j]
                i_host = i in hi and j not in hi
                j_host = j in hi and i not in hi

                if i_host:
                    p = fp.match_probs(ti, tj, home_boost=hb)
                    pe = fp.match_probs(ti, tj, home_boost=hb, lambda_scale=1 / 3)
                    self._flat_probs[i, j] = p.ravel()
                    self._flat_probs[j, i] = p.T.ravel()
                    self._flat_probs_et[i, j] = pe.ravel()
                    self._flat_probs_et[j, i] = pe.T.ravel()
                elif j_host:
                    p = fp.match_probs(tj, ti, home_boost=hb)
                    pe = fp.match_probs(tj, ti, home_boost=hb, lambda_scale=1 / 3)
                    self._flat_probs[j, i] = p.ravel()
                    self._flat_probs[i, j] = p.T.ravel()
                    self._flat_probs_et[j, i] = pe.ravel()
                    self._flat_probs_et[i, j] = pe.T.ravel()
                else:
                    p = fp.match_probs(ti, tj, neutral=True)
                    pe = fp.match_probs(ti, tj, neutral=True, lambda_scale=1 / 3)
                    self._flat_probs[i, j] = p.ravel()
                    self._flat_probs[j, i] = p.T.ravel()
                    self._flat_probs_et[i, j] = pe.ravel()
                    self._flat_probs_et[j, i] = pe.T.ravel()

    def _batch_flat_probs_group(
        self,
        attack_c: NDArray[np.floating],
        defense_c: NDArray[np.floating],
        rho_c: NDArray[np.floating],
        he_c: NDArray[np.floating],
        ia: int,
        ib: int,
        lambda_scale: float,
    ) -> np.ndarray:
        """Score distributions for (ia, ib) with ia < ib; shape (chunk, mg*mg)."""
        hb = self._host_boost
        hi = self._host_indices
        i_host = ia in hi and ib not in hi
        j_host = ib in hi and ia not in hi
        if i_host:
            gamma = effective_home_gamma_vec(he_c, True, hb)
            hl = attack_c[:, ia] * defense_c[:, ib] * gamma * lambda_scale
            al = attack_c[:, ib] * defense_c[:, ia] * lambda_scale
            m = score_probability_matrix_batched(hl, al, rho_c, MAX_GOALS)
            return m.reshape(m.shape[0], -1)
        if j_host:
            gamma = effective_home_gamma_vec(he_c, True, hb)
            hl = attack_c[:, ib] * defense_c[:, ia] * gamma * lambda_scale
            al = attack_c[:, ia] * defense_c[:, ib] * lambda_scale
            m = score_probability_matrix_batched(hl, al, rho_c, MAX_GOALS)
            m = np.transpose(m, (0, 2, 1))
            return m.reshape(m.shape[0], -1)
        hl = attack_c[:, ia] * defense_c[:, ib] * lambda_scale
        al = attack_c[:, ib] * defense_c[:, ia] * lambda_scale
        m = score_probability_matrix_batched(hl, al, rho_c, MAX_GOALS)
        return m.reshape(m.shape[0], -1)

    def _sample_from_probs_rows(self, flat: np.ndarray, mg2: int) -> np.ndarray:
        """Sample one category per row from distributions flat (C, mg2)."""
        c = flat.shape[0]
        out = np.empty(c, dtype=np.int32)
        for r in range(c):
            out[r] = int(self.rng.choice(mg2, p=flat[r]))
        return out

    def _reg_et_flats_for_pair(
        self, sim: int, i: int, j: int
    ) -> tuple[np.ndarray, np.ndarray]:
        """Flattened (regular, extra-time) probs with first axis = goals for team i."""
        assert self.series_params is not None
        sp = self.series_params
        att = sp.attack[sim : sim + 1]
        def_ = sp.defense[sim : sim + 1]
        rho = sp.rho[sim : sim + 1]
        he = sp.home_effect[sim : sim + 1]
        lo_idx, hi_idx = (i, j) if i < j else (j, i)
        reg = self._batch_flat_probs_group(
            att, def_, rho, he, lo_idx, hi_idx, 1.0
        ).ravel()
        et = self._batch_flat_probs_group(
            att, def_, rho, he, lo_idx, hi_idx, 1.0 / 3
        ).ravel()
        if i > j:
            mg = self._mg
            reg = reg.reshape(mg, mg).T.ravel()
            et = et.reshape(mg, mg).T.ravel()
        return reg, et

    @staticmethod
    def _knockout_winner_pair(
        rng: np.random.Generator,
        flat: np.ndarray,
        flat_et: np.ndarray,
        mg: int,
        mg2: int,
        i: int,
        j: int,
    ) -> int:
        """Mata-mata a partir de vetores de probabilidade já alinhados (i vs j)."""
        idx = int(rng.choice(mg2, p=flat))
        hg, ag = idx // mg, idx % mg
        if hg != ag:
            return i if hg > ag else j

        idx = int(rng.choice(mg2, p=flat_et))
        eth, eta = idx // mg, idx % mg
        if eth != eta:
            return i if eth > eta else j

        return i if rng.random() < 0.5 else j

    def _ko(self, i: int, j: int, *, sim: int | None = None) -> int:
        """Knockout match; ``sim`` selects the parameter row when using a series."""
        mg, mg2 = self._mg, self._mg2
        if sim is None:
            assert self._flat_probs is not None
            flat = self._flat_probs[i, j]
            flat_et = self._flat_probs_et[i, j]
        else:
            flat, flat_et = self._reg_et_flats_for_pair(sim, i, j)
        return WorldCup2026._knockout_winner_pair(
            self.rng, flat, flat_et, mg, mg2, i, j
        )

    def _resolve_r32_fast(
        self,
        winners: dict[str, int],
        runners: dict[str, int],
        thirds: dict[str, int],
    ) -> list[tuple[int, int]]:
        """Resolve R32 matchups (index-based) with cached 3rd-place assignment."""
        key = frozenset(thirds.keys())
        if key not in self._third_cache:
            self._third_cache[key] = self._match_thirds(
                self._THIRD_SLOTS, set(thirds.keys())
            )
        assignment = self._third_cache[key]

        matchups: list[tuple[int, int]] = []
        for i, (sa, sb) in enumerate(ROUND_OF_32_FIXED):
            a = winners[sa[1]] if sa[0] == "1" else runners[sa[1]]
            if sb.startswith("3_"):
                b = thirds[assignment[i]]
            elif sb[0] == "1":
                b = winners[sb[1]]
            else:
                b = runners[sb[1]]
            matchups.append((a, b))
        return matchups

    def _simulate_group_match(self, team_a: str, team_b: str) -> tuple[int, int]:
        key = (self._team_idx[team_a], self._team_idx[team_b])
        if key in self._known:
            return self._known[key]
        if self.series_params is not None:
            row = self._strength_row
            if row is None:
                raise TypeError(
                    "Group-stage single draw with TournamentParamsSeries requires "
                    "simulate_once(strength_row=...)."
                )
            return self.series_params.simulate_match(
                row, team_a, team_b, neutral=True, rng=self.rng
            )
        assert self.fixed_params is not None
        return self.fixed_params.simulate_match(
            team_a, team_b, neutral=True, rng=self.rng
        )

    def _simulate_knockout_match(self, team_a: str, team_b: str) -> str:
        """Simulate a knockout match: extra time → penalties if drawn."""
        if self.series_params is not None:
            row = self._strength_row
            if row is None:
                raise TypeError(
                    "Knockout single draw with TournamentParamsSeries requires "
                    "simulate_once(strength_row=...)."
                )
            ga, gb = self.series_params.simulate_match(
                row, team_a, team_b, neutral=True, rng=self.rng
            )
            et_prob = self.series_params.match_probs(
                row, team_a, team_b, neutral=True, lambda_scale=1 / 3
            )
        else:
            assert self.fixed_params is not None
            ga, gb = self.fixed_params.simulate_match(
                team_a, team_b, neutral=True, rng=self.rng
            )
            et_prob = self.fixed_params.match_probs(
                team_a, team_b, neutral=True, lambda_scale=1 / 3
            )
        if ga != gb:
            return team_a if ga > gb else team_b

        # Extra time: Poisson with λ/3
        mg = et_prob.shape[0]
        idx = self.rng.choice(mg * mg, p=et_prob.ravel())
        et_a, et_b = int(idx // mg), int(idx % mg)
        ga += et_a
        gb += et_b
        if ga != gb:
            return team_a if ga > gb else team_b

        # Penalties: 50/50
        return team_a if self.rng.random() < 0.5 else team_b

    def simulate_group_stage(self) -> dict[str, list[GroupStanding]]:
        """Simulate all group matches; return sorted standings per group."""
        if self.series_params is not None and self._strength_row is None:
            raise TypeError(
                "simulate_group_stage() is not supported with TournamentParamsSeries "
                "unless called from simulate_once(strength_row=...). "
                "Use simulate(n) for Monte Carlo or switch to TournamentModelParams."
            )
        standings: dict[str, list[GroupStanding]] = {}
        for gname, teams in self.groups.items():
            table = {t: GroupStanding(team=t) for t in teams}
            for i, j in combinations(range(len(teams)), 2):
                ta, tb = teams[i], teams[j]
                ga, gb = self._simulate_group_match(ta, tb)
                table[ta].goals_for += ga
                table[ta].goals_against += gb
                table[tb].goals_for += gb
                table[tb].goals_against += ga
                if ga > gb:
                    table[ta].points += 3
                    table[ta].wins += 1
                    table[tb].losses += 1
                elif ga < gb:
                    table[tb].points += 3
                    table[tb].wins += 1
                    table[ta].losses += 1
                else:
                    table[ta].points += 1
                    table[tb].points += 1
                    table[ta].draws += 1
                    table[tb].draws += 1

            ordered = sorted(table.values(), key=lambda s: s.sort_key, reverse=True)
            standings[gname] = ordered
        return standings

    @staticmethod
    def _pick_best_thirds(
        standings: dict[str, list[GroupStanding]],
    ) -> list[tuple[str, str]]:
        """Select the 8 best third-placed teams. Return [(group, team), ...]."""
        thirds = []
        for gname, table in standings.items():
            t = table[2]
            thirds.append((gname, t.team, t.sort_key))

        thirds.sort(key=lambda x: x[2], reverse=True)
        return [(g, team) for g, team, _ in thirds[:8]]

    def _resolve_round_of_32(
        self,
        standings: dict[str, list[GroupStanding]],
    ) -> list[tuple[str, str]]:
        """Build the 16 Round-of-32 matchups from group results."""
        winners = {g: table[0].team for g, table in standings.items()}
        runners = {g: table[1].team for g, table in standings.items()}

        best_thirds = self._pick_best_thirds(standings)
        third_group_to_team: dict[str, str] = dict(best_thirds)

        third_slots: list[tuple[int, str]] = [
            (i, slot_b)
            for i, (_, slot_b) in enumerate(ROUND_OF_32_FIXED)
            if slot_b.startswith("3_")
        ]

        assignment = self._match_thirds(third_slots, set(third_group_to_team.keys()))

        matchups: list[tuple[str, str]] = []
        for i, (slot_a, slot_b) in enumerate(ROUND_OF_32_FIXED):
            team_a = self._resolve_simple_slot(slot_a, winners, runners)
            if slot_b.startswith("3_"):
                assigned_group = assignment[i]
                team_b = third_group_to_team[assigned_group]
            else:
                team_b = self._resolve_simple_slot(slot_b, winners, runners)
            matchups.append((team_a, team_b))
        return matchups

    @staticmethod
    def _resolve_simple_slot(
        slot: str,
        winners: dict[str, str],
        runners: dict[str, str],
    ) -> str:
        if slot.startswith("1"):
            return winners[slot[1]]
        if slot.startswith("2"):
            return runners[slot[1]]
        raise ValueError(f"Unknown slot format: {slot}")

    @staticmethod
    def _match_thirds(
        slots: list[tuple[int, str]],
        qualified_groups: set[str],
    ) -> dict[int, str]:
        """Bipartite matching: assign each qualified 3rd-place group to a slot.

        Uses backtracking to find a valid assignment where each slot gets
        exactly one group from its allowed set.
        """
        allowed: list[tuple[int, list[str]]] = []
        for idx, slot_label in slots:
            groups_in_slot = [
                g for g in slot_label.replace("3_", "") if g in qualified_groups
            ]
            allowed.append((idx, groups_in_slot))

        allowed.sort(key=lambda x: len(x[1]))

        assignment: dict[int, str] = {}
        used: set[str] = set()

        def backtrack(pos: int) -> bool:
            if pos == len(allowed):
                return True
            idx, candidates = allowed[pos]
            for g in candidates:
                if g not in used:
                    assignment[idx] = g
                    used.add(g)
                    if backtrack(pos + 1):
                        return True
                    used.discard(g)
                    del assignment[idx]
            return False

        if not backtrack(0):
            raise RuntimeError(
                f"No valid 3rd-place assignment for groups {qualified_groups}"
            )
        return assignment

    def simulate_once(self, strength_row: int = 0) -> dict[str, int]:
        """Run one full tournament. Return {team: stage_reached}.

        Stage values: 0=group, 1=R32, 2=R16, 3=QF, 4=SF, 5=final, 6=champion.

        With ``TournamentParamsSeries``, pick the parameter row via ``strength_row``.
        """
        if self.series_params is not None:
            if not (0 <= strength_row < self.series_params.n_replications):
                raise ValueError(
                    f"strength_row={strength_row} out of range for "
                    f"{self.series_params.n_replications} replications."
                )
            self._strength_row = strength_row
            try:
                return self._simulate_once_core()
            finally:
                self._strength_row = None
        return self._simulate_once_core()

    def _simulate_once_core(self) -> dict[str, int]:
        result = dict.fromkeys(self.all_teams, 0)

        standings = self.simulate_group_stage()
        advancing: set[str] = set()
        for table in standings.values():
            advancing.add(table[0].team)
            advancing.add(table[1].team)
        best_thirds = self._pick_best_thirds(standings)
        for _, team in best_thirds:
            advancing.add(team)

        for t in advancing:
            result[t] = 1

        r32_matchups = self._resolve_round_of_32(standings)
        r32_winners = [self._simulate_knockout_match(a, b) for a, b in r32_matchups]
        for t in r32_winners:
            result[t] = 2

        r16_winners = []
        for ia, ib in ROUND_OF_16_PAIRS:
            w = self._simulate_knockout_match(r32_winners[ia], r32_winners[ib])
            r16_winners.append(w)
            result[w] = 3

        qf_winners = []
        for ia, ib in QUARTERFINAL_PAIRS:
            w = self._simulate_knockout_match(r16_winners[ia], r16_winners[ib])
            qf_winners.append(w)
            result[w] = 4

        sf_winners = []
        for ia, ib in SEMIFINAL_PAIRS:
            w = self._simulate_knockout_match(qf_winners[ia], qf_winners[ib])
            sf_winners.append(w)
            result[w] = 5

        champion = self._simulate_knockout_match(sf_winners[0], sf_winners[1])
        result[champion] = 6

        return result

    def simulate(self, n: int = 100_000) -> TournamentResult:
        """Run *n* tournament simulations with vectorised group stage."""
        if self.series_params is not None:
            r = self.series_params.n_replications
            if n > r:
                raise ValueError(
                    f"n={n} exceeds TournamentParamsSeries rows ({r}). "
                    "Provide at least as many parameter rows as simulations."
                )
            return self._simulate_with_series(n)
        return self._simulate_fixed_params(n)

    def _simulate_fixed_params(self, n: int) -> TournamentResult:
        gnames = self._group_names
        ng = self._n_groups
        mg = self._mg
        mg2 = self._mg2
        nt = len(self.all_teams)
        match_pairs = list(combinations(range(4), 2))
        n_mp = len(match_pairs)

        assert self._flat_probs is not None

        # ── Phase 1: batch-sample all 72 group matches ──────────
        group_hg = np.empty((ng, n_mp, n), dtype=np.int8)
        group_ag = np.empty((ng, n_mp, n), dtype=np.int8)
        rng = self.rng
        fp = self._flat_probs
        if not self._known:
            for gi in range(ng):
                base = gi * 4
                for mi, (li, lj) in enumerate(match_pairs):
                    flat = fp[base + li, base + lj]
                    samples = rng.choice(mg2, size=n, p=flat)
                    group_hg[gi, mi] = samples // mg
                    group_ag[gi, mi] = samples % mg
        else:
            for gi in range(ng):
                base = gi * 4
                for mi, (li, lj) in enumerate(match_pairs):
                    ia, ib = base + li, base + lj
                    known = self._known.get((ia, ib))
                    if known is not None:
                        group_hg[gi, mi, :] = known[0]
                        group_ag[gi, mi, :] = known[1]
                    else:
                        flat = fp[ia, ib]
                        samples = rng.choice(mg2, size=n, p=flat)
                        group_hg[gi, mi] = samples // mg
                        group_ag[gi, mi] = samples % mg

        # ── Phase 2: vectorised standings ────────────────────────
        pts = np.zeros((ng, n, 4), dtype=np.int16)
        gf = np.zeros((ng, n, 4), dtype=np.int16)
        ga = np.zeros((ng, n, 4), dtype=np.int16)
        for mi, (li, lj) in enumerate(match_pairs):
            hg = group_hg[:, mi, :]
            ag = group_ag[:, mi, :]
            gf[:, :, li] += hg
            ga[:, :, li] += ag
            gf[:, :, lj] += ag
            ga[:, :, lj] += hg
            hw = hg > ag
            aw = hg < ag
            dr = hg == ag
            pts[:, :, li] += 3 * hw + dr
            pts[:, :, lj] += 3 * aw + dr
        gd = gf - ga

        # ── Phase 3: group rankings ─────────────────────────────
        noise = rng.random((ng, n, 4)) * 0.01
        composite = pts * 10_000.0 + (gd + 100) * 100.0 + gf + noise
        order = np.argsort(-composite, axis=2)

        first_local = order[:, :, 0]
        second_local = order[:, :, 1]
        third_local = order[:, :, 2]

        bases = (np.arange(ng) * 4)[:, None]
        w_global = bases + first_local
        r_global = bases + second_local
        t_global = bases + third_local

        # ── Phase 4: best 8 thirds ──────────────────────────────
        gi_ax = np.arange(ng)[:, None]
        sim_ax = np.arange(n)[None, :]
        t_pts = pts[gi_ax, sim_ax, third_local]
        t_gd = gd[gi_ax, sim_ax, third_local]
        t_gf = gf[gi_ax, sim_ax, third_local]
        t_noise = rng.random((ng, n)) * 0.01
        t_comp = t_pts * 10_000.0 + (t_gd + 100) * 100.0 + t_gf + t_noise
        best_8 = np.argsort(-t_comp.T, axis=1)[:, :8]

        # ── Phase 5: per-simulation knockout ─────────────────────
        r32_c = np.zeros(nt, dtype=np.int32)
        r16_c = np.zeros(nt, dtype=np.int32)
        qf_c = np.zeros(nt, dtype=np.int32)
        sf_c = np.zeros(nt, dtype=np.int32)
        final_c = np.zeros(nt, dtype=np.int32)
        champ_c = np.zeros(nt, dtype=np.int32)

        fet = self._flat_probs_et
        kwp = WorldCup2026._knockout_winner_pair

        for sim in range(n):
            w: dict[str, int] = {}
            r: dict[str, int] = {}
            q3: dict[str, int] = {}
            for gi, g in enumerate(gnames):
                wi = int(w_global[gi, sim])
                ri = int(r_global[gi, sim])
                w[g] = wi
                r[g] = ri
                r32_c[wi] += 1
                r32_c[ri] += 1

            for k in range(8):
                gi = int(best_8[sim, k])
                ti = int(t_global[gi, sim])
                q3[gnames[gi]] = ti
                r32_c[ti] += 1

            r32 = self._resolve_r32_fast(w, r, q3)
            r32w = [kwp(rng, fp[a, b], fet[a, b], mg, mg2, a, b) for a, b in r32]
            for x in r32w:
                r16_c[x] += 1

            r16w = [
                kwp(
                    rng,
                    fp[r32w[a], r32w[b]],
                    fet[r32w[a], r32w[b]],
                    mg,
                    mg2,
                    r32w[a],
                    r32w[b],
                )
                for a, b in ROUND_OF_16_PAIRS
            ]
            for x in r16w:
                qf_c[x] += 1

            qfw = [
                kwp(
                    rng,
                    fp[r16w[a], r16w[b]],
                    fet[r16w[a], r16w[b]],
                    mg,
                    mg2,
                    r16w[a],
                    r16w[b],
                )
                for a, b in QUARTERFINAL_PAIRS
            ]
            for x in qfw:
                sf_c[x] += 1

            sfw = [
                kwp(
                    rng,
                    fp[qfw[a], qfw[b]],
                    fet[qfw[a], qfw[b]],
                    mg,
                    mg2,
                    qfw[a],
                    qfw[b],
                )
                for a, b in SEMIFINAL_PAIRS
            ]
            for x in sfw:
                final_c[x] += 1

            champ_c[
                kwp(
                    rng,
                    fp[sfw[0], sfw[1]],
                    fet[sfw[0], sfw[1]],
                    mg,
                    mg2,
                    sfw[0],
                    sfw[1],
                )
            ] += 1

        return self._accumulate_counts(n, r32_c, r16_c, qf_c, sf_c, final_c, champ_c)

    def _simulate_with_series(self, n: int) -> TournamentResult:
        assert self.series_params is not None
        sp = self.series_params
        gnames = self._group_names
        ng = self._n_groups
        mg = self._mg
        mg2 = self._mg2
        nt = len(self.all_teams)
        match_pairs = list(combinations(range(4), 2))
        n_mp = len(match_pairs)
        chunk = self._SERIES_CHUNK

        group_hg = np.empty((ng, n_mp, n), dtype=np.int8)
        group_ag = np.empty((ng, n_mp, n), dtype=np.int8)

        for c0 in range(0, n, chunk):
            c1 = min(c0 + chunk, n)
            att = sp.attack[c0:c1]
            def_ = sp.defense[c0:c1]
            rho_c = sp.rho[c0:c1]
            he_c = sp.home_effect[c0:c1]
            for gi in range(ng):
                base = gi * 4
                for mi, (li, lj) in enumerate(match_pairs):
                    ia, ib = base + li, base + lj
                    known = self._known.get((ia, ib))
                    if known is not None:
                        group_hg[gi, mi, c0:c1] = known[0]
                        group_ag[gi, mi, c0:c1] = known[1]
                    else:
                        flat = self._batch_flat_probs_group(
                            att, def_, rho_c, he_c, ia, ib, 1.0
                        )
                        idx = self._sample_from_probs_rows(flat, mg2)
                        group_hg[gi, mi, c0:c1] = (idx // mg).astype(np.int8)
                        group_ag[gi, mi, c0:c1] = (idx % mg).astype(np.int8)

        pts = np.zeros((ng, n, 4), dtype=np.int16)
        gf = np.zeros((ng, n, 4), dtype=np.int16)
        ga_m = np.zeros((ng, n, 4), dtype=np.int16)
        for mi, (li, lj) in enumerate(match_pairs):
            hg = group_hg[:, mi, :]
            ag = group_ag[:, mi, :]
            gf[:, :, li] += hg
            ga_m[:, :, li] += ag
            gf[:, :, lj] += ag
            ga_m[:, :, lj] += hg
            hw = hg > ag
            aw = hg < ag
            dr = hg == ag
            pts[:, :, li] += 3 * hw + dr
            pts[:, :, lj] += 3 * aw + dr
        gd = gf - ga_m

        noise = self.rng.random((ng, n, 4)) * 0.01
        composite = pts * 10_000.0 + (gd + 100) * 100.0 + gf + noise
        order = np.argsort(-composite, axis=2)

        first_local = order[:, :, 0]
        second_local = order[:, :, 1]
        third_local = order[:, :, 2]

        bases = (np.arange(ng) * 4)[:, None]
        w_global = bases + first_local
        r_global = bases + second_local
        t_global = bases + third_local

        gi_ax = np.arange(ng)[:, None]
        sim_ax = np.arange(n)[None, :]
        t_pts = pts[gi_ax, sim_ax, third_local]
        t_gd = gd[gi_ax, sim_ax, third_local]
        t_gf = gf[gi_ax, sim_ax, third_local]
        t_noise = self.rng.random((ng, n)) * 0.01
        t_comp = t_pts * 10_000.0 + (t_gd + 100) * 100.0 + t_gf + t_noise
        best_8 = np.argsort(-t_comp.T, axis=1)[:, :8]

        r32_c = np.zeros(nt, dtype=np.int32)
        r16_c = np.zeros(nt, dtype=np.int32)
        qf_c = np.zeros(nt, dtype=np.int32)
        sf_c = np.zeros(nt, dtype=np.int32)
        final_c = np.zeros(nt, dtype=np.int32)
        champ_c = np.zeros(nt, dtype=np.int32)

        for sim in range(n):
            w: dict[str, int] = {}
            r: dict[str, int] = {}
            q3: dict[str, int] = {}
            for gi, g in enumerate(gnames):
                wi = int(w_global[gi, sim])
                ri = int(r_global[gi, sim])
                w[g] = wi
                r[g] = ri
                r32_c[wi] += 1
                r32_c[ri] += 1

            for k in range(8):
                gi = int(best_8[sim, k])
                ti = int(t_global[gi, sim])
                q3[gnames[gi]] = ti
                r32_c[ti] += 1

            r32 = self._resolve_r32_fast(w, r, q3)
            r32w = [self._ko(a, b, sim=sim) for a, b in r32]
            for x in r32w:
                r16_c[x] += 1

            r16w = [self._ko(r32w[a], r32w[b], sim=sim) for a, b in ROUND_OF_16_PAIRS]
            for x in r16w:
                qf_c[x] += 1

            qfw = [self._ko(r16w[a], r16w[b], sim=sim) for a, b in QUARTERFINAL_PAIRS]
            for x in qfw:
                sf_c[x] += 1

            sfw = [self._ko(qfw[a], qfw[b], sim=sim) for a, b in SEMIFINAL_PAIRS]
            for x in sfw:
                final_c[x] += 1

            champ_c[self._ko(sfw[0], sfw[1], sim=sim)] += 1

        return self._accumulate_counts(n, r32_c, r16_c, qf_c, sf_c, final_c, champ_c)

    def _accumulate_counts(
        self,
        n: int,
        r32_c: np.ndarray,
        r16_c: np.ndarray,
        qf_c: np.ndarray,
        sf_c: np.ndarray,
        final_c: np.ndarray,
        champ_c: np.ndarray,
    ) -> TournamentResult:
        tr = TournamentResult(counts=n)
        for i, t in enumerate(self.all_teams):
            tr.group_stage[t] = n
            tr.round_of_32[t] = int(r32_c[i])
            tr.round_of_16[t] = int(r16_c[i])
            tr.quarterfinals[t] = int(qf_c[i])
            tr.semifinals[t] = int(sf_c[i])
            tr.final[t] = int(final_c[i])
            tr.champion[t] = int(champ_c[i])
        return tr
