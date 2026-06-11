"""Update HTML date stamps after a simulation run."""

from __future__ import annotations

import re
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from src.constants import (
    WC_2026_FINAL,
    WC_2026_QF_START,
    WC_2026_R16_START,
    WC_2026_R32_START,
    WC_2026_SF_START,
)

_BRAZIL_TZ = ZoneInfo("America/Sao_Paulo")
_DOCS_DIR = Path("docs")

# Matches both <!ATUALIZADO EM: DD/MM/YYYY> and <!--ATUALIZADO EM: DD/MM/YYYY-->
_COMMENT_RE = re.compile(r"(<!-*ATUALIZADO EM: )\d{2}/\d{2}/\d{4}(-*>)")

# Maps each phase anchor (in modelos.html) to the date range when it is active.
# None for start means "from the beginning"; None for end means "until the end".
_PHASE_ANCHORS: list[tuple[str, date | None, date | None]] = [
    ("previsoes.html#grupos", None, WC_2026_R32_START),
    ("previsoes.html#r32", WC_2026_R32_START, WC_2026_R16_START),
    ("previsoes.html#oitavas", WC_2026_R16_START, WC_2026_QF_START),
    ("previsoes.html#quartas", WC_2026_QF_START, WC_2026_SF_START),
    ("previsoes.html#semis", WC_2026_SF_START, WC_2026_FINAL),
    ("previsoes.html#final", WC_2026_FINAL, None),
]

_INLINE_DATE_RE = re.compile(r"atualizado em [^)]+")


def _active_anchor(today: date) -> str:
    for anchor, start, end in _PHASE_ANCHORS:
        after_start = start is None or today >= start
        before_end = end is None or today < end
        if after_start and before_end:
            return anchor
    return _PHASE_ANCHORS[-1][0]


def update_docs_dates(docs_dir: Path = _DOCS_DIR) -> None:
    """Update top-level date comments and phase-specific inline dates in HTML files."""
    now = datetime.now(_BRAZIL_TZ)
    date_full = now.strftime("%d/%m/%Y")
    date_short = now.strftime("%d/%m/%y")
    today = now.date()
    anchor = _active_anchor(today)

    for filename in ("previsoes.html", "modelos.html"):
        path = docs_dir / filename
        if not path.exists():
            continue

        content = path.read_text(encoding="utf-8")
        updated = _COMMENT_RE.sub(rf"\g<1>{date_full}\g<2>", content, count=1)

        if filename == "modelos.html":

            def _replace_inline(m: re.Match) -> str:
                return _INLINE_DATE_RE.sub(f"atualizado em {date_short}", m.group(0))

            updated = re.sub(
                rf"^.*{re.escape(anchor)}.*$",
                _replace_inline,
                updated,
                flags=re.MULTILINE,
            )

        if updated != content:
            path.write_text(updated, encoding="utf-8")
            print(f"Datas atualizadas em {path.name} ({date_full})")


if __name__ == "__main__":
    update_docs_dates()
