// ════════════════════════════════════════
// TEAM DATABASE
// Keys match team names used throughout match data.
// wc: [gold, silver, bronze] World Cup medals
// prob: estimated 2026 title probability (%)
// ════════════════════════════════════════
const CHAVEAMENTO_HIST_CSV_URL = 'csv/previsoes/chaveamento_hist.csv';
const CHAVEAMENTO_PROBS_CSV_URL = 'csv/previsoes/chaveamento_probs.csv';
const FLAGS_URL = 'images/flags/flag.csv';
let TD = {};

// Mapa: nome normalizado do país (PT) -> URL do SVG da bandeira
let flagMap = new Map();

// Normaliza nomes de países para comparação (minúsculas, sem acentos e sem espaços extras).
function normalizeName(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');
}

// Normaliza URLs de SVG para uso direto em <img src="...">.
function normalizeFlagUrl(value) {
    const url = String(value || '').trim();
    if (!url) return '';
    // Converte link "github.com/.../blob/..." em "raw.githubusercontent.com/..."
    if (url.includes('github.com') && url.includes('/blob/')) {
        return url
            .replace('https://github.com/', 'https://raw.githubusercontent.com/')
            .replace('/blob/', '/');
    }
    return url;
}

// Busca a URL da bandeira (SVG) para um país em português.
const getFlag = country => flagMap.get(normalizeName(country)) || '';

// HTML da bandeira: usa SVG se existir; caso contrário, cai para um placeholder simples.
function flagHTML(country) {
    const url = getFlag(country);
    if (!url) return '🏳️';
    return `<img class="flag-img" src="${url}" alt="${country}">`;
}

// Lê um CSV simples, detectando vírgula ou ponto e vírgula e preservando campos entre aspas.
function parseCSV(text) {
    const firstLine = text.split(/\r?\n/)[0] || '';
    const delimiter =
        (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length
            ? ';'
            : ',';

    const rows = [];
    let row = [];
    let cell = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && next === '"') {
            cell += '"';
            i++;
            continue;
        }

        if (char === '"') {
            insideQuotes = !insideQuotes;
            continue;
        }

        if (char === delimiter && !insideQuotes) {
            row.push(cell.trim());
            cell = '';
            continue;
        }

        if ((char === '\n' || char === '\r') && !insideQuotes) {
            if (cell !== '' || row.length) {
                row.push(cell.trim());
                rows.push(row);
                row = [];
                cell = '';
            }
            if (char === '\r' && next === '\n') i++;
            continue;
        }

        cell += char;
    }

    if (cell !== '' || row.length) {
        row.push(cell.trim());
        rows.push(row);
    }

    if (!rows.length) return [];

    const headers = rows[0].map(h => h.trim());

    return rows.slice(1)
        .filter(r => r.some(Boolean))
        .map(r => {
            const obj = {};
            headers.forEach((h, i) => {
                obj[h] = (r[i] ?? '').trim();
            });
            return obj;
        });
}

// Carrega um arquivo CSV por fetch e devolve as linhas como objetos.
async function loadCSV(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Não foi possível carregar ${url}`);
    return parseCSV(await response.text());
}

function parseNumber(value) {
    if (value === undefined || value === null || value === '') return 0;
    const n = Number(String(value).trim().replace('%', '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
}

function parseTeamDatabase(rows) {
    return rows.reduce((acc, row) => {
        if (!row.team) return acc;
        acc[row.team] = {
            flag: row.flag || '🏳️',
            rank: row.rank === '?' ? '?' : parseNumber(row.rank),
            apps: parseNumber(row.apps),
            best: row.best || '—',
            last: row.last || '—',
            players: row.players || '—',
            prob: parseNumber(row.prob),
            wc: [parseNumber(row.wc_gold), parseNumber(row.wc_silver), parseNumber(row.wc_bronze)]
        };
        return acc;
    }, {});
}

function parseMatchDatabase(rows) {
    const bySide = { left: [], right: [] };
    let finalMatch = null;

    rows
        .slice()
        .sort((a, b) => parseNumber(a.order) - parseNumber(b.order))
        .forEach(row => {
            const match = {
                id: row.id,
                home: row.home_team,
                pa: parseNumber(row.prob_home),
                away: row.away_team,
                pb: parseNumber(row.prob_away),
                w: row.winner === 'home' ? 'a' : 'b'
            };

            if (row.side === 'final') {
                finalMatch = match;
                return;
            }

            const side = bySide[row.side];
            if (!side) return;

            const roundIndex = parseNumber(row.round_index);
            if (!side[roundIndex]) side[roundIndex] = [];
            side[roundIndex].push(match);
        });

    return {
        ML: bySide.left,
        MR: bySide.right,
        MF: finalMatch
    };
}

async function loadBracketData() {
    const [teamRows, matchRows, flagRows] = await Promise.all([
        loadCSV(CHAVEAMENTO_HIST_CSV_URL),
        loadCSV(CHAVEAMENTO_PROBS_CSV_URL),
        loadCSV(FLAGS_URL).catch(() => [])
    ]);

    // Pré-processa bandeiras para lookup rápido.
    flagMap = new Map(
        flagRows.map(row => [normalizeName(row.country_pt), normalizeFlagUrl(row.svg_github)])
    );

    TD = parseTeamDatabase(teamRows);

    const matchData = parseMatchDatabase(matchRows);
    ML = matchData.ML;
    MR = matchData.MR;
    MF = matchData.MF;
    ALL = [...ML.flat(), ...MR.flat(), MF].filter(Boolean);
}

// Safe accessor — returns a blank placeholder for unknown teams
function gt(name) {
    return TD[name] || { flag:'🏳️', rank:'?', apps:0, best:'—', last:'—', players:'—', prob:0, wc:[0,0,0] };
}


// ════════════════════════════════════════
// VENUE / ROUND METADATA
// ════════════════════════════════════════

// Host city for each match ID
const CITIES = {
    L1:'Houston',   L2:'Miami',        L3:'Los Angeles',  L4:'Seattle',    L5:'Dallas',
    L6:'Boston',    L7:'NJ/NY',        L8:'Atlanta',
    RL1:'Houston',  RL2:'Seattle',     RL3:'Philadelphia', RL4:'Dallas',
    QL1:'Miami',    QL2:'Los Angeles', SL:'Dallas',
    R1:'Toronto',   R2:'Kansas City',  R3:'San Francisco', R4:'Vancouver',
    R5:'Atlanta',   R6:'Miami',        R7:'Seattle',        R8:'Dallas',
    RR1:'Boston',   RR2:'Los Angeles', RR3:'Houston',       RR4:'Kansas City',
    QR1:'Dallas',   QR2:'San Francisco', SR:'Atlanta',       F:'Nova York / NJ',
};

// Human-readable round label for each match ID
const RND_LBL = {
    L1:'R32',  L2:'R32',  L3:'R32',  L4:'R32',  L5:'R32',  L6:'R32',  L7:'R32',  L8:'R32',
    R1:'R32',  R2:'R32',  R3:'R32',  R4:'R32',  R5:'R32',  R6:'R32',  R7:'R32',  R8:'R32',
    RL1:'Oitavas', RL2:'Oitavas', RL3:'Oitavas', RL4:'Oitavas',
    RR1:'Oitavas', RR2:'Oitavas', RR3:'Oitavas', RR4:'Oitavas',
    QL1:'Quartas', QL2:'Quartas', QR1:'Quartas', QR2:'Quartas',
    SL:'Semifinal', SR:'Semifinal', F:'Final · 19 Jul',
};

// CSS class applied to path cards, controlling the top-stripe color
const RND_CLS = {
    L1:'r32', L2:'r32', L3:'r32', L4:'r32', L5:'r32', L6:'r32', L7:'r32', L8:'r32',
    R1:'r32', R2:'r32', R3:'r32', R4:'r32', R5:'r32', R6:'r32', R7:'r32', R8:'r32',
    RL1:'r16', RL2:'r16', RL3:'r16', RL4:'r16',
    RR1:'r16', RR2:'r16', RR3:'r16', RR4:'r16',
    QL1:'qf',  QL2:'qf',  QR1:'qf',  QR2:'qf',
    SL:'sf',  SR:'sf',  F:'fin',
};

// ════════════════════════════════════════
// MATCH DATA
// Each match: { id, a, pa, b, pb, w }
//   a/b  — team names
//   pa/pb — win probabilities (%)
//   w    — 'a' or 'b' (projected winner)
// ════════════════════════════════════════

const RL = ['R32', 'Oitavas', 'Quartas', 'Semifinal'];

// Left bracket half (rounds from R32 to SF)
let ML = [];

// Right bracket half
let MR = [];

// Final match
let MF = null;

// Projected champion
const CHAMP = 'Brasil';

// Flat list of all matches — used for path lookups
let ALL = [];

// Currently selected (pinned) team
let selectedTeam = CHAMP;

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════

// Returns a Set of match IDs in which a given team participates
function teamMatchIds(team) {
    return new Set(ALL.filter(m => m.home === team || m.away === team).map(m => m.id));
}

// Unified handler: select a team and update all UI sections at once
function selectTeam(team) {
    selectedTeam = team;
    applyHov(team);
    showStats(team);
    showPath(team);
}

// ════════════════════════════════════════
// TAB SWITCHING
// ════════════════════════════════════════
function switchTab(id, btn) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.getElementById('panel-' + id).classList.add('active');
    btn.classList.add('active');

    // SVG lines must be re-measured after the panel becomes visible
    if (id === 'bracket') {
    requestAnimationFrame(() => requestAnimationFrame(drawLines));
    }
}


// ════════════════════════════════════════
// BRACKET BUILDER
// ════════════════════════════════════════

/**
* Creates a single team row (<div class="tr">) inside a match card.
* Attaches hover / click handlers that drive the whole UI.
*/
function mkRow(name, prob, won, mid) {
    const t = gt(name);
    const row = document.createElement('div');
    row.className = 'tr' + (won ? ' won' : '');
    row.dataset.team = name;
    row.dataset.mid  = mid;
    row.innerHTML = `
    <span class="tp">${prob}%</span>
    <span class="tf">${t.flag}</span>
    <span class="tn">${name}</span>
    `;

    row.addEventListener('mouseenter', (e) => {
    applyHov(name);
    showStats(name);
    showPath(name);
    showTT(name, e);
    });

    row.addEventListener('mousemove', moveTT);

    row.addEventListener('mouseleave', () => {
    // Restore the pinned team when the cursor leaves
    applyHov(selectedTeam);
    showStats(selectedTeam);
    showPath(selectedTeam);
    hideTT();
    });

    row.addEventListener('click', () => selectTeam(name));

    return row;
}

/**
* Creates a match card (<div class="mc">) containing two team rows.
* Cards involving the projected champion get an extra "cp" class.
*/
function mkCard(m) {
    const inCP = m.home === CHAMP || m.away === CHAMP;
    const card = document.createElement('div');
    card.className  = 'mc' + (inCP ? ' cp' : '');
    card.dataset.id = m.id;
    card.appendChild(mkRow(m.home, m.pa, m.w === 'a', m.id));
    card.appendChild(mkRow(m.away, m.pb, m.w === 'b', m.id));
    return card;
}

/**
* Builds one bracket half (left or right).
* @param {Array}  rounds  - Array of round arrays, each containing match objects
* @param {string} contId  - ID of the container element ('lh' or 'rh')
*/
function buildHalf(rounds, contId) {
    const cont = document.getElementById(contId);
    rounds.forEach((matches, ri) => {
    const col = document.createElement('div');
    col.className = 'rc';
    col.setAttribute('data-l', RL[ri]);
    matches.forEach(m => col.appendChild(mkCard(m)));
    cont.appendChild(col);
    });
}

/**
* Builds the center Final column with the match card and champion summary.
*/
function buildFinal() {
    const fc  = document.getElementById('fc');
    const t   = gt(CHAMP);

    const lbl = document.createElement('div');
    lbl.className   = 'fc-lbl';
    lbl.textContent = 'FINAL · 19/Jul · NJ';

    const fmc = document.createElement('div');
    fmc.className = 'fmc';
    fmc.id        = 'fmc';

    [{ key: 'a', name: MF.home, prob: MF.pa },
    { key: 'b', name: MF.away, prob: MF.pb }]
    .forEach(team => {
        const won = MF.w === team.key;
        const t2 = gt(team.name);

        const row = document.createElement('div');
        row.className = 'tr' + (won ? ' won' : '');
        row.dataset.team = team.name;
        row.dataset.mid = 'F';
        // PAÍSES DA FINAL
        row.innerHTML = `
            <span class="tp">${team.prob}%</span> 
            <span class="tf">${flagHTML(team.name)}</span>
            <span class="tn">${team.name}</span>
        `; //<span class="tf">${t2.flag}</span>

        row.addEventListener('mouseenter', (e) => {
            applyHov(team.name);
            showStats(team.name);
            showPath(team.name);
            showTT(team.name, e);
        });

        row.addEventListener('mousemove', moveTT);

        row.addEventListener('mouseleave', () => {
            applyHov(selectedTeam);
            showStats(selectedTeam);
            showPath(selectedTeam);
            hideTT();
        });

        row.addEventListener('click', () => selectTeam(team.name));

        fmc.appendChild(row);
    });

    // Campeão em Baixo da FINAL
    const cbox = document.createElement('div');
    cbox.innerHTML = `
    <div class="champ-n">${t.flag} ${CHAMP}</div>
    `; //<div class="champ-n">${flagHTML(CHAMP)} ${CHAMP}</div>
    fc.appendChild(lbl);
    fc.appendChild(fmc);
    fc.appendChild(cbox);
}

// ════════════════════════════════════════
// SVG CONNECTOR LINES
// ════════════════════════════════════════

// Map from matchId → { path, winner, isCP }
const LR = {};

/**
* Returns bounding-box coordinates relative to the bracket wrapper (#bw).
*/
function rp(el) {
    const bw = document.getElementById('bw');
    const er = el.getBoundingClientRect();
    const cr = bw.getBoundingClientRect();
    return {
    left:  er.left  - cr.left,
    right: er.right - cr.left,
    cy:    er.top   - cr.top + er.height / 2,
    };
}

/**
* Applies stroke styling to an SVG path based on its context:
*   isHovPath — part of the hovered/selected team's path → bright gold
*   isCP      — part of the champion's default path      → muted gold
*   default   — inactive connector                       → dark blue
*/
function setLS(p, isCP, isHovPath) {
    if (isHovPath) {
    p.setAttribute('stroke',       '#FFD700');
    p.setAttribute('stroke-width', '3.5');
    p.setAttribute('opacity',      '1');
    } else if (isCP) {
    p.setAttribute('stroke',       '#d4af37');
    p.setAttribute('stroke-width', '2');
    p.setAttribute('opacity',      '.8');
    } else {
    p.setAttribute('stroke',       '#2a4a6a');
    p.setAttribute('stroke-width', '1.4');
    p.setAttribute('opacity',      '.6');
    }
}

/**
* Creates an SVG <path> element for a single connector.
*/
function mkPathEl(d, isCP) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d',                d);
    p.setAttribute('fill',             'none');
    p.setAttribute('stroke-linecap',   'round');
    p.setAttribute('stroke-linejoin',  'round');
    setLS(p, isCP, false);
    return p;
}

/**
* Draws all connector lines for one bracket half.
* Each line goes from the center of a match card to the target team row
* in the next round's card.
*/
function connectHalf(rounds, contId, side) {
    const svg  = document.getElementById('bsv');
    const cols = document.getElementById(contId).querySelectorAll('.rc');

    rounds.forEach((matches, ri) => {
    if (ri >= rounds.length - 1) return; // no next column for the last round

    const srcCards = cols[ri].querySelectorAll('.mc');
    const tgtCards = cols[ri + 1].querySelectorAll('.mc');

    matches.forEach((m, mi) => {
        const nextMatchIdx = Math.floor(mi / 2);
        const isTopSlot    = mi % 2 === 0;

        const src = srcCards[mi];
        const tgt = tgtCards[nextMatchIdx];
        if (!src || !tgt) return;

        const sr   = rp(src);
        const tr   = rp(tgt);
        const rows = tgt.querySelectorAll('.tr');
        const tr2  = rows[isTopSlot ? 0 : 1];
        if (!tr2) return;

        const ty     = rp(tr2).cy;
        const winner = m.w === 'a' ? m.home : m.away;
        const isCP   = winner === CHAMP;

        let d;
        if (side === 'left') {
        const mx = sr.right + (tr.left  - sr.right) * .5;
        d = `M ${sr.right} ${sr.cy} H ${mx} V ${ty} H ${tr.left}`;
        } else {
        const mx = sr.left  + (tr.right - sr.left)  * .5;
        d = `M ${sr.left}  ${sr.cy} H ${mx} V ${ty} H ${tr.right}`;
        }

        const path = mkPathEl(d, isCP);
        LR[m.id] = { path, winner, isCP };
        svg.appendChild(path);
    });
    });
}

/**
* (Re)draws the entire SVG overlay.
* Called on initial render and on window resize.
*/
function drawLines() {
    const bw  = document.getElementById('bw');
    const svg = document.getElementById('bsv');
    if (!bw || !svg) return;

    svg.setAttribute('width',  bw.scrollWidth);
    svg.setAttribute('height', bw.offsetHeight);
    svg.innerHTML = '';
    Object.keys(LR).forEach(k => delete LR[k]);

    connectHalf(ML, 'lh', 'left');
    connectHalf(MR, 'rh', 'right');

    // Connect the two semifinal cards to the Final card (runs after DOM settles)
    setTimeout(() => {
    const lCols = document.getElementById('lh').querySelectorAll('.rc');
    const rCols = document.getElementById('rh').querySelectorAll('.rc');
    const fRows = document.getElementById('fmc')?.querySelectorAll('.tr');

    const lSF = lCols[lCols.length - 1]?.querySelector('.mc');
    const rSF = rCols[rCols.length - 1]?.querySelector('.mc');

    if (lSF && fRows?.[0]) {
        const sr     = rp(lSF);
        const tr     = rp(fRows[0]);
        const mx     = sr.right + (tr.left - sr.right) * .5;
        const slMatch = ML[ML.length - 1][0];
        const winner = slMatch.w === 'a' ? slMatch.home : slMatch.away;
        const p = mkPathEl(
        `M ${sr.right} ${sr.cy} H ${mx} V ${tr.cy} H ${tr.left}`,
        winner === CHAMP
        );
        LR['SL-F'] = { path: p, winner, isCP: winner === CHAMP };
        svg.appendChild(p);
    }

    if (rSF && fRows?.[1]) {
        const sr     = rp(rSF);
        const tr     = rp(fRows[1]);
        const mx     = tr.right + (sr.left - tr.right) * .5;
        const srMatch = MR[MR.length - 1][0];
        const winner = srMatch.w === 'a' ? srMatch.home : srMatch.away;
        const p = mkPathEl(
        `M ${sr.left} ${sr.cy} H ${mx} V ${tr.cy} H ${tr.right}`,
        winner === CHAMP
        );
        LR['SR-F'] = { path: p, winner, isCP: winner === CHAMP };
        svg.appendChild(p);
    }
    }, 0);
}


// ════════════════════════════════════════
// HOVER / SELECTION EFFECT
// ════════════════════════════════════════

/**
* Highlights all match cards, rows, and SVG lines that belong to `team`.
* Everything else is left at normal opacity (no dimming).
*/
function applyHov(team) {
    const pids = teamMatchIds(team);

    // Highlight match cards that include this team
    document.querySelectorAll('.mc').forEach(c => {
    c.classList.toggle('lit', pids.has(c.dataset.id));
    });

    // Highlight the Final card border
    const fmc = document.getElementById('fmc');
    if (fmc) {
    fmc.style.borderColor = pids.has('F') ? '#f0c040' : '';
    }

    // Re-style all SVG connector lines
    Object.values(LR).forEach(({ path, winner, isCP }) => {
    setLS(path, isCP, winner === team);
    });

    // Highlight individual team name rows
    document.querySelectorAll('.tr').forEach(r => {
    r.classList.toggle('hl', r.dataset.team === team);
    });
}

/**
* Resets all visual highlights to the default state.
*/
function clearHov() {
    document.querySelectorAll('.mc').forEach(c => c.classList.remove('dim', 'lit'));

    const fmc = document.getElementById('fmc');
    if (fmc) {
    fmc.classList.remove('dim-f');
    fmc.style.borderColor = '';
    }

    document.querySelectorAll('.tr').forEach(r => r.classList.remove('hl'));
    Object.values(LR).forEach(({ path, isCP }) => setLS(path, isCP, false));
}

// ════════════════════════════════════════
// TOOLTIP
// ════════════════════════════════════════

function showTT(name, e) {
    const d   = gt(name);
    const svgUrl = getFlag(name);
    const ttFlag = svgUrl ? `<img class="flag-img" src="${svgUrl}" alt="${name}">`: d.flag;
    const bw  = Math.min(100, (d.prob / 15) * 100);
    const wc  = d.wc || [0, 0, 0];

    let medals;

    if (!wc[0] && !wc[1] && !wc[2]) {
    medals = `<div class="medals"><span class="med">Sem títulos ou pódios</span></div>`;
    } else {
    medals = `
        <div class="medals">
        ${wc[0] ? `<span class="med g">🥇 ${wc[0]}×</span>` : ''}
        ${wc[1] ? `<span class="med s">🥈 ${wc[1]}×</span>` : ''}
        ${wc[2] ? `<span class="med b">🥉 ${wc[2]}×</span>` : ''}
        </div>
    `;
    }

    
    const tt = document.getElementById('tt');
    tt.innerHTML = `
    <div class="tt-h">
        <div class="tt-flag">${ttFlag}</div>
        <div class="tt-name">${name}</div>
    </div>
    ${medals}
    <div class="tt-div"></div>
    `;

    tt.classList.add('on');
    moveTT(e);
}

function moveTT(e) {
    const tt = document.getElementById('tt');
    const x  = e.clientX + 14;
    const y  = e.clientY - 115;
    tt.style.left = Math.min(x, window.innerWidth  - 252) + 'px';
    tt.style.top  = Math.max(6, Math.min(y, window.innerHeight - 370)) + 'px';
}

function hideTT() {
    document.getElementById('tt').classList.remove('on');
}

// ════════════════════════════════════════
// STATS PANEL
// ════════════════════════════════════════

/**
* Populates the #stats-panel with key data for the given team.
*/
function showStats(name) {
    const d     = gt(name);
    const panel = document.getElementById('stats-panel');
    panel.innerHTML = `
    <div class="sp-header">
        <div class="sp-flag">${d.flag}</div>
        <div class="sp-name">${name}</div>
    </div>
    <div class="sp-grid">
        <div class="sp-box">
        <div class="sp-label">Ranking FIFA</div>
        <div class="sp-value">#${d.rank}</div>
        </div>

        <div class="sp-box">
        <div class="sp-label">Copas disputadas</div>
        <div class="sp-value">${d.apps}</div>
        </div>

        <div class="sp-box">
        <div class="sp-label">Melhor resultado</div>
        <div class="sp-value">${d.best}</div>
        </div>

        <div class="sp-box">
        <div class="sp-label">Última Copa</div>
        <div class="sp-value">${d.last}</div>
        </div>
    </div>
    `;
}

// ════════════════════════════════════════
// PATH PANEL
// ════════════════════════════════════════

/**
* Renders the journey summary cards for every match the given team appears in.
*/
function showPath(name) {
    const title = document.getElementById('bk-pathTitle');
    const cards = document.getElementById('bk-pathCards');

    title.innerHTML = `TRAJETÓRIA — ${name.toUpperCase()} <span></span>`;

    const matches = ALL.filter(m => m.home === name || m.away === name);
    cards.innerHTML = '';

    if (!matches.length) {
    cards.innerHTML = '<p class="pc-empty">Nenhum confronto encontrado.</p>';
    return;
    }

    matches.forEach(m => {
    const isA      = m.home === name;
    const opp      = isA ? m.away : m.home;
    const myProb   = isA ? m.pa : m.pb;
    const oppProb  = isA ? m.pb : m.pa;
    const oData    = gt(opp);
    const myData   = gt(name);
    const rCls     = RND_CLS[m.id] || 'r32';
    const rLbl     = RND_LBL[m.id] || '—';
    const city     = CITIES[m.id]  || '';

    const card = document.createElement('div');
    card.className = `pc ${rCls}`;
    // <span class="pc-wf">${flagHTML(name)}</span>
    // <span class="pc-lf">${flagHTML(opp)}</span>
    card.innerHTML = `
        <div class="pc-rnd">${rLbl}</div>
        <div class="pc-w">
        <span class="pc-wf">${myData.flag}</span>
        <span class="pc-wn">${name}</span>
        <span class="pc-ws">${myProb}%</span>
        </div>
        <div class="pc-sep"></div>
        <div class="pc-l">
        <span class="pc-lf">${oData.flag}</span>
        <span class="pc-ln">${opp}</span>
        <span class="pc-ls">${oppProb}%</span>
        </div>
        ${city ? `<div class="pc-city">📍 ${city}</div>` : ''}
    `;
    cards.appendChild(card);
    });
}

// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════

async function initChaveamento() {
    try {
        await loadBracketData();

        // Set the pinned team before building the UI so the first render is correct
        selectedTeam = CHAMP;

        buildHalf(ML, 'lh');
        buildHalf(MR, 'rh');
        buildFinal();

        // First render: draw lines and apply champion highlight
        requestAnimationFrame(() => {
            drawLines();
            applyHov(selectedTeam);
            showStats(selectedTeam);
            showPath(selectedTeam);
        });

        // Re-draw SVG lines whenever the viewport is resized
        window.addEventListener('resize', () => requestAnimationFrame(drawLines));

        // Clicking outside any match card resets the selection to the champion
        document.addEventListener('click', e => {
            const clickedInside = e.target.closest('.mc') || e.target.closest('.tr');
            if (!clickedInside) {
            selectedTeam = CHAMP;
            clearHov();
            drawLines();
            applyHov(selectedTeam);
            showStats(selectedTeam);
            showPath(selectedTeam);
            }
        });
    } catch (error) {
        console.error(error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChaveamento);
} else {
    initChaveamento();
}
