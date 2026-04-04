"""FIFA World Cup 2026 tournament structure and simulation."""

from __future__ import annotations

from dataclasses import dataclass, field
from itertools import combinations

import numpy as np

from src.model import DixonColesModel

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

# Map of team name variants the model might use
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
# Format: (slot_description, team_source)
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
# Each tuple is (idx_match_A, idx_match_B)
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


def resolve_team_name(name: str, known_teams: list[str]) -> str:
    """Try to match a team name to the model's team list."""
    if name in known_teams:
        return name
    mapped = TEAM_NAME_MAP.get(name)
    if mapped and mapped in known_teams:
        return mapped
    raise ValueError(
        f"Team '{name}' not found in model (tried alias '{mapped}'). "
        f"Add it to TEAM_NAME_MAP or check the spelling."
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

    def __init__(self, model: DixonColesModel, seed: int = 42) -> None:
        self.model = model
        self.rng = np.random.default_rng(seed)

        self.groups: dict[str, list[str]] = {}
        for gname, teams in GROUPS.items():
            self.groups[gname] = [resolve_team_name(t, model.teams) for t in teams]

        self.all_teams: list[str] = []
        for teams in self.groups.values():
            self.all_teams.extend(teams)

        self._group_names = list(self.groups.keys())
        self._n_groups = len(self._group_names)
        self._third_cache: dict[frozenset[str], dict[int, str]] = {}
        self._precompute_probs()

    # ── fast-path helpers (index-based) ──────────────────────────

    def _precompute_probs(self) -> None:
        """Precompute flattened score-probability vectors for every team pair."""
        nt = len(self.all_teams)
        mg = 11
        self._mg = mg
        self._mg2 = mg * mg
        self._flat_probs = np.zeros((nt, nt, self._mg2))
        self._flat_probs_et = np.zeros((nt, nt, self._mg2))
        self._strengths = np.array([self.model.get_strength(t) for t in self.all_teams])
        for i in range(nt):
            for j in range(i + 1, nt):
                ti, tj = self.all_teams[i], self.all_teams[j]
                prob = self.model.match_probs(ti, tj, neutral=True)
                self._flat_probs[i, j] = prob.ravel()
                self._flat_probs[j, i] = prob.T.ravel()

                prob_et = self.model.match_probs(
                    ti, tj, neutral=True, lambda_scale=1 / 3
                )
                self._flat_probs_et[i, j] = prob_et.ravel()
                self._flat_probs_et[j, i] = prob_et.T.ravel()

    def _ko(self, i: int, j: int) -> int:
        """Fast knockout match using precomputed flat-prob lookup."""
        mg = self._mg
        mg2 = self._mg2

        idx = self.rng.choice(mg2, p=self._flat_probs[i, j])
        hg, ag = idx // mg, idx % mg
        if hg != ag:
            return i if hg > ag else j

        # Extra time: Poisson with λ/3
        idx = self.rng.choice(mg2, p=self._flat_probs_et[i, j])
        eth, eta = idx // mg, idx % mg
        if eth != eta:
            return i if eth > eta else j

        # Penalties: 50/50
        return i if self.rng.random() < 0.5 else j

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
        return self.model.simulate_match(team_a, team_b, neutral=True, rng=self.rng)

    def _simulate_knockout_match(self, team_a: str, team_b: str) -> str:
        """Simulate a knockout match: extra time → penalties if drawn."""
        ga, gb = self.model.simulate_match(team_a, team_b, neutral=True, rng=self.rng)
        if ga != gb:
            return team_a if ga > gb else team_b

        # Extra time: Poisson with λ/3
        et_prob = self.model.match_probs(
            team_a, team_b, neutral=True, lambda_scale=1 / 3
        )
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

    def simulate_once(self) -> dict[str, int]:
        """Run one full tournament. Return {team: stage_reached}.

        Stage values: 0=group, 1=R32, 2=R16, 3=QF, 4=SF, 5=final, 6=champion.
        """
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
        gnames = self._group_names
        ng = self._n_groups
        mg = self._mg
        mg2 = self._mg2
        nt = len(self.all_teams)
        match_pairs = list(combinations(range(4), 2))
        n_mp = len(match_pairs)

        # ── Phase 1: batch-sample all 72 group matches ──────────
        group_hg = np.empty((ng, n_mp, n), dtype=np.int8)
        group_ag = np.empty((ng, n_mp, n), dtype=np.int8)
        for gi in range(ng):
            base = gi * 4
            for mi, (li, lj) in enumerate(match_pairs):
                flat = self._flat_probs[base + li, base + lj]
                samples = self.rng.choice(mg2, size=n, p=flat)
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

        # ── Phase 4: best 8 thirds ──────────────────────────────
        gi_ax = np.arange(ng)[:, None]
        sim_ax = np.arange(n)[None, :]
        t_pts = pts[gi_ax, sim_ax, third_local]
        t_gd = gd[gi_ax, sim_ax, third_local]
        t_gf = gf[gi_ax, sim_ax, third_local]
        t_noise = self.rng.random((ng, n)) * 0.01
        t_comp = t_pts * 10_000.0 + (t_gd + 100) * 100.0 + t_gf + t_noise
        best_8 = np.argsort(-t_comp.T, axis=1)[:, :8]

        # ── Phase 5: per-simulation knockout ─────────────────────
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
            r32w = [self._ko(a, b) for a, b in r32]
            for x in r32w:
                r16_c[x] += 1

            r16w = [self._ko(r32w[a], r32w[b]) for a, b in ROUND_OF_16_PAIRS]
            for x in r16w:
                qf_c[x] += 1

            qfw = [self._ko(r16w[a], r16w[b]) for a, b in QUARTERFINAL_PAIRS]
            for x in qfw:
                sf_c[x] += 1

            sfw = [self._ko(qfw[a], qfw[b]) for a, b in SEMIFINAL_PAIRS]
            for x in sfw:
                final_c[x] += 1

            champ_c[self._ko(sfw[0], sfw[1])] += 1

        # ── Build result ─────────────────────────────────────────
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
