const PLACEHOLDERS = {
    'panel-r32': 'das <b>Eliminatórias</b>',
    'panel-oitavas': 'das <b>Oitavas de Final</b>',
    'panel-quartas': 'das <b>Quartas de Final</b>',
    'panel-semis': 'da <b>Semifinal</b>',
    'panel-final': 'da <b>Final e Disputa pelo 3º lugar</b>'
};


function makePlaceholder(panelId, stageLabel) {
    return `
        <div class="placeholder-box">
            <div class="placeholder-icon-wrap">
                ⚙️
            </div>
            <div class="placeholder-title">
                Probabilidades de placares em breve!
            </div>
            <div class="placeholder-text">
                As probabilidades de placares ${stageLabel} serão disponibilizadas quando os confrontos forem definidos.
            </div>
        </div>
    `;
}

function renderPlaceholder(panelId, stageLabel) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.innerHTML = makePlaceholder(panelId, stageLabel);
}
// ════════════════════════════════════════
// TEAM DATABASE
// Keys match team names used throughout match data.
// wc: [gold, silver, bronze] World Cup medals
// prob: estimated 2026 title probability (%)
// ════════════════════════════════════════
const TD = {
    'Brasil':        { flag:'🇧🇷', rank:6,  apps:22, best:'Campeão 5× (1958,62,70,94,2002)',         last:'Quartas 2022 — eliminado pela Croácia nos pênaltis', players:'Neymar Jr., Casemiro., Estevão,',              prob:14.2, wc:[5,0,2] },
    'Marrocos':      { flag:'🇲🇦', rank:11, apps:6,  best:'Semifinal 2022 — primeiro africano',       last:'Semifinal 2022 — eliminado pela França',             players:'Hakimi, En-Nesyri, Ziyech, Ounahi',            prob:3.2,  wc:[0,0,0] },
    'França':        { flag:'🇫🇷', rank:1,  apps:16, best:'Campeão 2× (1998, 2018)',                  last:'Vice-campeão 2022 — derrota para Argentina na final', players:'Mbappé, Griezmann, Camavinga, Tchouaméni',     prob:12.8, wc:[2,2,2] },
    'Senegal':       { flag:'🇸🇳', rank:14, apps:4,  best:'Quartas de final (2002)',                   last:'Oitavas 2022 — eliminado pela Inglaterra',           players:'Mané, Koulibaly, Sarr, Diatta',                prob:1.5,  wc:[0,0,0] },
    'Espanha':       { flag:'🇪🇸', rank:2,  apps:16, best:'Campeão 1× (2010) + Euro 2024',            last:'Oitavas 2022 — eliminada pelo Marrocos nos pênaltis', players:'Yamal, Pedri, Rodri, Morata, Williams',        prob:11.5, wc:[1,1,0] },
    'Alemanha':      { flag:'🇩🇪', rank:12, apps:20, best:'Campeão 4× (1954,74,90,2014)',             last:'Fase de grupos 2022 — eliminação precoce',            players:'Musiala, Wirtz, Havertz, Kimmich, Rüdiger',    prob:8.8,  wc:[4,4,4] },
    'Países Baixos': { flag:'🇳🇱', rank:7,  apps:11, best:'Vice-campeão 3× (1974,78,2010)',           last:'Quartas 2022 — eliminado pela Argentina',             players:'Van Dijk, De Jong, Gakpo, Depay',              prob:6.2,  wc:[0,3,1] },
    'Bélgica':       { flag:'🇧🇪', rank:9,  apps:14, best:'3º lugar (1986)',                          last:'Oitavas 2022 — eliminada pelo Marrocos',              players:'De Bruyne, Lukaku, Tielemans',                 prob:5.5,  wc:[0,0,1] },
    'Argentina':     { flag:'🇦🇷', rank:3,  apps:18, best:'Campeão 3× (1978,1986,2022)',             last:'Campeão 2022 — venceu a França na final',             players:'Messi, L.Martínez, Mac Allister, De Paul',     prob:11.0, wc:[3,3,0] },
    'Portugal':      { flag:'🇵🇹', rank:5,  apps:9,  best:'3º lugar 1966 / Euro 2016',               last:'Quartas 2022 — eliminado pelo Marrocos',              players:'Cristiano Ronaldo, Bruno Fernandes, G.Ramos',  prob:7.5,  wc:[0,0,1] },
    'Inglaterra':    { flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', rank:4,  apps:17, best:'Campeão 1× (1966)',                        last:'Quartas 2022 — eliminada pela França',                players:'Bellingham, Kane, Saka, Foden',                prob:9.5,  wc:[1,0,0] },
    'EUA':           { flag:'🇺🇸', rank:14, apps:11, best:'3º lugar (1930)',                          last:'Oitavas 2022 — eliminado pelos Países Baixos',        players:'Pulisic, McKennie, Adams, Turner, Reyna',      prob:3.2,  wc:[0,0,1] },
    'Coreia Sul':    { flag:'🇰🇷', rank:25, apps:11, best:'4º lugar / Semifinal (2002)',              last:'Oitavas 2022 — eliminada pelo Brasil',                players:'Son, Kim Min-Jae, Lee Kang-In',                prob:1.2,  wc:[0,0,1] },
    'Austrália':     { flag:'🇦🇺', rank:22, apps:6,  best:'Quartas de final (2006)',                  last:'Oitavas 2022 — eliminada pela Argentina',            players:'Leckie, Ryan, Irvine, Duke',                   prob:1.0,  wc:[0,0,0] },
    'Noruega':       { flag:'🇳🇴', rank:31, apps:3,  best:'Quartas de final (1938)',                  last:'Não se classificou para 2022',                       players:'Haaland, Ödegaard, Ajer',                      prob:1.8,  wc:[0,0,0] },
    'Suíça':         { flag:'🇨🇭', rank:19, apps:12, best:'Quartas (1934,38,54)',                     last:'Quartas 2022 — eliminada por Portugal',              players:'Xhaka, Embolo, Sommer, Shaqiri',               prob:1.8,  wc:[0,0,0] },
    'C.Marfim':      { flag:'🇨🇮', rank:46, apps:4,  best:'Fase de grupos (múltiplas)',               last:'Não se classificou para 2022',                       players:'Haller, Zaha, Pépé, Seri',                     prob:0.5,  wc:[0,0,0] },
    'Turquia':       { flag:'🇹🇷', rank:37, apps:5,  best:'3º lugar (2002)',                          last:'Não se classificou para 2022',                       players:'Çalhanoglu, Demiral, Yıldız, Güler',           prob:1.0,  wc:[0,0,1] },
    'Equador':       { flag:'🇪🇨', rank:44, apps:4,  best:'Oitavas de final (2006)',                  last:'Fase de grupos 2022',                                players:'Valencia, Caicedo, Plata',                     prob:1.0,  wc:[0,0,0] },
    'Iraque':        { flag:'🇮🇶', rank:57, apps:2,  best:'Fase de grupos (1986)',                    last:'Retorno histórico após 40 anos',                     players:'Amjed, Shahin, Abbas',                         prob:0.1,  wc:[0,0,0] },
    'Jordânia':      { flag:'🇯🇴', rank:63, apps:0,  best:'Estreia na Copa do Mundo',                 last:'Primeira participação na história',                   players:'Baha Faisal, Sahel',                           prob:0.1,  wc:[0,0,0] },
    'Áustria':       { flag:'🇦🇹', rank:24, apps:7,  best:'3º lugar (1954)',                          last:'Não se classificou para 2022',                       players:'Alaba, Arnautovic, Baumgartner',               prob:0.8,  wc:[0,0,1] },
    'Argélia':       { flag:'🇩🇿', rank:28, apps:4,  best:'Oitavas de final (2014)',                  last:'Não se classificou para 2022',                       players:'Mahrez, Belaïli, Slimani',                     prob:0.5,  wc:[0,0,0] },
    'Congo':         { flag:'🇨🇩', rank:46, apps:1,  best:'Fase de grupos 1974 (Zaire)',              last:'Retorno histórico após 52 anos',                     players:'Kakuta, Meschack, Inonga',                     prob:0.2,  wc:[0,0,0] },
    'Colômbia':      { flag:'🇨🇴', rank:13, apps:7,  best:'Quartas de final (2014)',                  last:'Não se classificou para 2022',                       players:'Díaz, Arias, Borja, Cuesta',                   prob:2.5,  wc:[0,0,0] },
    'Uzbequistão':   { flag:'🇺🇿', rank:50, apps:0,  best:'Estreia na Copa do Mundo',                 last:'Primeira participação na história',                   players:'Shorakhmedov, Shodiev',                        prob:0.1,  wc:[0,0,0] },
    'Panamá':        { flag:'🇵🇦', rank:33, apps:2,  best:'Fase de grupos (2018)',                    last:'Não se classificou para 2022',                       players:'Godoy, Murillo, Davis',                        prob:0.3,  wc:[0,0,0] },
    'Gana':          { flag:'🇬🇭', rank:74, apps:4,  best:'Quartas de final (2010)',                  last:'Fase de grupos 2022',                                players:'Kudus, Ayew, Djiku',                           prob:0.4,  wc:[0,0,0] },
    'Croácia':       { flag:'🇭🇷', rank:10, apps:7,  best:'Vice-campeão 2018 / 3º 2022',             last:'3º lugar 2022',                                      players:'Modrić, Kovačić, Gvardiol',                    prob:3.8,  wc:[0,1,2] },
    'Paraguai':      { flag:'🇵🇾', rank:33, apps:9,  best:'Quartas de final (1986)',                  last:'Não se classificou para 2022',                       players:'Sanabria, Almirón, Villasanti',                prob:0.5,  wc:[0,0,0] },
    'Uruguai':       { flag:'🇺🇾', rank:18, apps:14, best:'Campeão 2× (1930,1950)',                   last:'Fase de grupos 2022',                                players:'Valverde, Bentancur, Núñez, Suárez',           prob:3.5,  wc:[2,0,2] },
    'Japão':         { flag:'🇯🇵', rank:17, apps:7,  best:'Oitavas de final (múltiplas)',             last:'Oitavas 2022 — eliminado pela Croácia nos pênaltis', players:'Minamino, Doan, Morita, Ueda',                 prob:2.2,  wc:[0,0,0] },
};

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
const ML = [
    [
    { id:'L1', a:'Brasil',        pa:82, b:'Coreia Sul',   pb:18, w:'a' },
    { id:'L2', a:'Marrocos',      pa:56, b:'Suíça',        pb:44, w:'a' },
    { id:'L3', a:'França',        pa:86, b:'Iraque',       pb:14, w:'a' },
    { id:'L4', a:'Senegal',       pa:44, b:'Noruega',      pb:56, w:'b' },
    { id:'L5', a:'Espanha',       pa:85, b:'C.Marfim',     pb:15, w:'a' },
    { id:'L6', a:'Alemanha',      pa:63, b:'Turquia',      pb:37, w:'a' },
    { id:'L7', a:'Países Baixos', pa:66, b:'Equador',      pb:34, w:'a' },
    { id:'L8', a:'Bélgica',       pa:88, b:'Austrália',    pb:12, w:'a' },
    ],
    [
    { id:'RL1', a:'Brasil',        pa:63, b:'Marrocos',     pb:37, w:'a' },
    { id:'RL2', a:'França',        pa:68, b:'Noruega',      pb:32, w:'a' },
    { id:'RL3', a:'Espanha',       pa:56, b:'Alemanha',     pb:44, w:'a' },
    { id:'RL4', a:'Países Baixos', pa:53, b:'Bélgica',      pb:47, w:'a' },
    ],
    [
    { id:'QL1', a:'Brasil',  pa:54, b:'França',        pb:46, w:'a' },
    { id:'QL2', a:'Espanha', pa:56, b:'Países Baixos', pb:44, w:'a' },
    ],
    [
    { id:'SL', a:'Brasil', pa:58, b:'Espanha', pb:42, w:'a' },
    ],
];

// Right bracket half
const MR = [
    [
    { id:'R1', a:'Argentina', pa:94, b:'Jordânia',    pb:6,  w:'a' },
    { id:'R2', a:'Áustria',   pa:54, b:'Argélia',     pb:46, w:'a' },
    { id:'R3', a:'Portugal',  pa:86, b:'Congo',       pb:14, w:'a' },
    { id:'R4', a:'Colômbia',  pa:77, b:'Uzbequistão', pb:23, w:'a' },
    { id:'R5', a:'Inglaterra',pa:82, b:'Gana',        pb:18, w:'a' },
    { id:'R6', a:'Croácia',   pa:63, b:'Panamá',      pb:37, w:'a' },
    { id:'R7', a:'EUA',       pa:62, b:'Paraguai',    pb:38, w:'a' },
    { id:'R8', a:'Uruguai',   pa:54, b:'Japão',       pb:46, w:'a' },
    ],
    [
    { id:'RR1', a:'Argentina', pa:75, b:'Áustria',   pb:25, w:'a' },
    { id:'RR2', a:'Portugal',  pa:53, b:'Colômbia',  pb:47, w:'a' },
    { id:'RR3', a:'Inglaterra',pa:57, b:'Croácia',   pb:43, w:'a' },
    { id:'RR4', a:'EUA',       pa:56, b:'Uruguai',   pb:44, w:'a' },
    ],
    [
    { id:'QR1', a:'Argentina', pa:52, b:'Portugal',  pb:48, w:'a' },
    { id:'QR2', a:'Inglaterra',pa:48, b:'EUA',       pb:52, w:'b' },
    ],
    [
    { id:'SR', a:'Argentina', pa:64, b:'EUA', pb:36, w:'a' },
    ],
];

// Final match
const MF = { id:'F', a:'Brasil', pa:55, b:'Argentina', pb:45, w:'a' };

// Projected champion
const CHAMP = 'Brasil';

// Flat list of all matches — used for path lookups
const ALL = [...ML.flat(), ...MR.flat(), MF];

// Currently selected (pinned) team
let selectedTeam = CHAMP;


// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════

// Returns a Set of match IDs in which a given team participates
function teamMatchIds(team) {
    return new Set(ALL.filter(m => m.a === team || m.b === team).map(m => m.id));
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

    row.addEventListener('mouseenter', () => {
    applyHov(name);
    showStats(name);
    showPath(name);
    });

    row.addEventListener('mouseleave', () => {
    // Restore the pinned team when the cursor leaves
    applyHov(selectedTeam);
    showStats(selectedTeam);
    showPath(selectedTeam);
    });

    row.addEventListener('click', () => selectTeam(name));

    return row;
}

/**
* Creates a match card (<div class="mc">) containing two team rows.
* Cards involving the projected champion get an extra "cp" class.
*/
function mkCard(m) {
    const inCP = m.a === CHAMP || m.b === CHAMP;
    const card = document.createElement('div');
    card.className  = 'mc' + (inCP ? ' cp' : '');
    card.dataset.id = m.id;
    card.appendChild(mkRow(m.a, m.pa, m.w === 'a', m.id));
    card.appendChild(mkRow(m.b, m.pb, m.w === 'b', m.id));
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

    ['a', 'b'].forEach(sl => {
    const name = MF[sl];
    const prob = sl === 'a' ? MF.pa : MF.pb;
    const won  = MF.w === sl;
    const t2   = gt(name);

    const row = document.createElement('div');
    row.className   = 'tr' + (won ? ' won' : '');
    row.dataset.team = name;
    row.dataset.mid  = 'F';
    row.innerHTML = `
        <span class="tp">${prob}%</span>
        <span class="tf">${t2.flag}</span>
        <span class="tn">${name}</span>
    `;

    row.addEventListener('mouseenter', () => {
        applyHov(name);
        showStats(name);
        showPath(name);
    });

    row.addEventListener('mouseleave', () => {
        applyHov(selectedTeam);
        showStats(selectedTeam);
        showPath(selectedTeam);
    });

    row.addEventListener('click', () => selectTeam(name));

    fmc.appendChild(row);
    });

    // Champion summary below the Final card
    const cbox = document.createElement('div');
    cbox.innerHTML = `
    <div class="champ-n">${t.flag} ${CHAMP}</div>
    <div class="champ-p">${t.prob}% Prob. de Título</div>
    `;

    fc.appendChild(lbl);
    fc.appendChild(fmc);
    fc.appendChild(cbox);
}

//Versão Antiga:
//<div class="champ-n">${t.flag} ${CHAMP}</div>
// <div class="champ-l">Campeão Projetado</div>
//<div class="champ-p">${t.prob}% prob. de título</div>

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
        const winner = m.w === 'a' ? m.a : m.b;
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
        const winner = slMatch.w === 'a' ? slMatch.a : slMatch.b;
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
        const winner = srMatch.w === 'a' ? srMatch.a : srMatch.b;
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
    const bw  = Math.min(100, (d.prob / 15) * 100);
    const wc  = d.wc || [0, 0, 0];
    const medals = [
    wc[0] ? `<span class="med g">🥇 ${wc[0]}×</span>` : '',
    wc[1] ? `<span class="med s">🥈 ${wc[1]}×</span>` : '',
    wc[2] ? `<span class="med b">🥉 ${wc[2]}×</span>` : '',
    ].filter(Boolean).join('');

    const tt = document.getElementById('tt');
    tt.innerHTML = `
    <div class="tt-h">
        <div class="tt-flag">${d.flag}</div>
        <div>
        <div class="tt-name">${name}</div>
        <div class="tt-rank">Ranking FIFA: #${d.rank} · ${d.apps} Copa(s)</div>
        </div>
    </div>
    ${medals ? `<div class="medals">${medals}</div>` : ''}
    <div class="tt-div"></div>
    <div class="tt-row"><span class="tt-lbl">Melhor Resultado</span><div class="tt-val">${d.best}</div></div>
    <div class="tt-row"><span class="tt-lbl">Copa 2022</span><div class="tt-val it">${d.last}</div></div>
    <div class="tt-row"><span class="tt-lbl">Jogadores Destaque</span><div class="tt-val">${d.players}</div></div>
    <div class="tt-div"></div>
    <div>
        <div class="tt-ph">
        <span class="tt-pl">Prob. Título 2026</span>
        <span class="tt-pv">${d.prob}%</span>
        </div>
        <div class="pb-bg"><div class="pb-f" style="width:${bw}%"></div></div>
    </div>
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
        <div class="sp-box">
        <div class="sp-label">Jogadores</div>
        <div class="sp-value">${d.players}</div>
        </div>
        <div class="sp-box">
        <div class="sp-label">Prob. título</div>
        <div class="sp-value">${d.prob}%</div>
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

    const matches = ALL.filter(m => m.a === name || m.b === name);
    cards.innerHTML = '';

    if (!matches.length) {
    cards.innerHTML = '<p class="pc-empty">Nenhum confronto encontrado.</p>';
    return;
    }

    matches.forEach(m => {
    const isA      = m.a === name;
    const opp      = isA ? m.b : m.a;
    const myProb   = isA ? m.pa : m.pb;
    const oppProb  = isA ? m.pb : m.pa;
    const oData    = gt(opp);
    const myData   = gt(name);
    const rCls     = RND_CLS[m.id] || 'r32';
    const rLbl     = RND_LBL[m.id] || '—';
    const city     = CITIES[m.id]  || '';

    const card = document.createElement('div');
    card.className = `pc ${rCls}`;
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
// GROUP STAGE BUILDER
// ════════════════════════════════════════

// Group data: each entry has a host city and four teams.
// p[]: [prob 1st, prob 2nd, prob 3rd, prob 4th] (should sum to 100)
const GD = {
    A: { host:'México',        teams:[{n:'México',       f:'🇲🇽', p:[55,25,14,6]}, {n:'Coreia Sul', f:'🇰🇷', p:[24,36,26,14]}, {n:'Rep.Tcheca', f:'🇨🇿', p:[15,28,35,22]}, {n:'África Sul',    f:'🇿🇦', p:[6,11,25,58]}] },
    B: { host:'Canadá',        teams:[{n:'Canadá',       f:'🇨🇦', p:[44,30,18,8]}, {n:'Suíça',      f:'🇨🇭', p:[28,32,26,14]}, {n:'Bósnia',     f:'🇧🇦', p:[22,30,30,18]}, {n:'Catar',         f:'🇶🇦', p:[6,8,26,60]}]  },
    C: { host:'Brasil',        teams:[{n:'Brasil',       f:'🇧🇷', p:[75,18,6,1]},  {n:'Marrocos',   f:'🇲🇦', p:[18,45,28,9]},  {n:'Escócia',    f:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', p:[6,28,42,24]},  {n:'Haiti',         f:'🇭🇹', p:[1,9,24,66]}]  },
    D: { host:'EUA',           teams:[{n:'EUA',          f:'🇺🇸', p:[46,28,18,8]}, {n:'Turquia',    f:'🇹🇷', p:[24,24,18,34]}, {n:'Austrália',  f:'🇦🇺', p:[20,30,30,20]}, {n:'Paraguai',      f:'🇵🇾', p:[10,18,34,38]}] },
    E: { host:'Alemanha',      teams:[{n:'Alemanha',     f:'🇩🇪', p:[70,20,8,2]},  {n:'Equador',    f:'🇪🇨', p:[16,36,32,16]}, {n:'C.Marfim',   f:'🇨🇮', p:[10,28,38,24]}, {n:'Curaçao',       f:'🇨🇼', p:[4,16,22,58]}]  },
    F: { host:'Países Baixos', teams:[{n:'P.Baixos',     f:'🇳🇱', p:[42,30,18,10]},{n:'Japão',      f:'🇯🇵', p:[25,28,28,19]}, {n:'Suécia',     f:'🇸🇪', p:[26,30,28,16]}, {n:'Tunísia',       f:'🇹🇳', p:[7,12,26,55]}]  },
    G: { host:'Bélgica',       teams:[{n:'Bélgica',      f:'🇧🇪', p:[58,26,12,4]}, {n:'Egito',      f:'🇪🇬', p:[20,36,32,12]}, {n:'Irã',        f:'🇮🇷', p:[16,26,36,22]}, {n:'Nova Zelândia', f:'🇳🇿', p:[6,12,20,62]}]  },
    H: { host:'Espanha',       teams:[{n:'Espanha',      f:'🇪🇸', p:[74,18,6,2]},  {n:'Uruguai',    f:'🇺🇾', p:[18,40,30,12]}, {n:'Ar.Saudita', f:'🇸🇦', p:[5,26,40,29]},  {n:'Cabo Verde',    f:'🇨🇻', p:[3,16,24,57]}]  },
    I: { host:'França',        teams:[{n:'França',       f:'🇫🇷', p:[72,20,7,1]},  {n:'Senegal',    f:'🇸🇳', p:[18,38,30,14]}, {n:'Noruega',    f:'🇳🇴', p:[8,30,38,24]},  {n:'Iraque',        f:'🇮🇶', p:[2,12,25,61]}]  },
    J: { host:'Argentina',     teams:[{n:'Argentina',    f:'🇦🇷', p:[76,17,6,1]},  {n:'Áustria',    f:'🇦🇹', p:[15,36,31,18]}, {n:'Argélia',    f:'🇩🇿', p:[7,32,38,23]},  {n:'Jordânia',      f:'🇯🇴', p:[2,15,25,58]}]  },
    K: { host:'Portugal',      teams:[{n:'Portugal',     f:'🇵🇹', p:[62,26,10,2]}, {n:'Colômbia',   f:'🇨🇴', p:[26,38,26,10]}, {n:'Congo',      f:'🇨🇩', p:[8,22,38,32]},  {n:'Uzbequistão',   f:'🇺🇿', p:[4,14,26,56]}]  },
    L: { host:'Inglaterra',    teams:[{n:'Inglaterra',   f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', p:[62,24,10,4]}, {n:'Croácia',    f:'🇭🇷', p:[26,38,26,10]}, {n:'Panamá',     f:'🇵🇦', p:[6,20,38,36]},  {n:'Gana',          f:'🇬🇭', p:[6,18,26,50]}]  },
};

/**
* Builds and injects all group cards into #gg.
* Progress bar widths start at 0 and animate to their target after a short delay.
*/
function buildGroups() {
    const grid = document.getElementById('gg');

    Object.entries(GD).forEach(([letter, g]) => {
    const card = document.createElement('div');
    card.className = 'g-card';

    // Team with the highest probability of finishing 1st is the group favorite
    const favorite = g.teams.reduce((a, b) => a.p[0] > b.p[0] ? a : b);

    card.innerHTML = `
        <div class="g-head">
        Grupo ${letter}
        <span>${g.host}</span>
        </div>
    `;

    g.teams.forEach((t, i) => {
        // Determine which probability to display and which status class to apply
        let probDisplay, statusClass, badgeClass, label;

        if (i === 0) {
        probDisplay = t.p[0] + t.p[1]; // combined Q1+Q2 displayed for 1st
        statusClass = 'qualify';
        badgeClass  = 'b1';
        label       = '1º';
        } else if (i === 1) {
        probDisplay = t.p[0] + t.p[1];
        statusClass = 'qualify';
        badgeClass  = 'b2';
        label       = '2º';
        } else if (i === 2) {
        probDisplay = t.p[2]; // best 3rd probability
        statusClass = 'playoff';
        badgeClass  = 'b3';
        label       = '3º';
        } else {
        probDisplay = t.p[3]; // elimination probability
        statusClass = 'elim';
        badgeClass  = 'b4';
        label       = '4º';
        }

        const isFav = t.n === favorite.n;
        const row   = document.createElement('div');
        row.className = `g-team ${statusClass}`;
        row.innerHTML = `
        <div class="g-row">
            <div class="g-badge ${badgeClass}">${label}</div>
            <div class="g-name">
            ${t.f} ${t.n}
            ${isFav ? '<span class="g-fav">🔥</span>' : ''}
            </div>
            <div class="g-prob">${probDisplay}%</div>
        </div>
        <div class="g-progress">
            <div class="g-fill" data-width="${probDisplay}"></div>
        </div>
        `;

        // Group panel interactions mirror the bracket panel
        row.addEventListener('mouseenter', () => showStats(t.n));
        row.addEventListener('mouseleave', () => showStats(selectedTeam));
        row.addEventListener('click',      () => selectTeam(t.n));

        card.appendChild(row);

        // Render the Top-2 cutoff divider after the 2nd team row
        if (i === 1) {
        const cut = document.createElement('div');
        cut.className = 'g-cut';
        card.appendChild(cut);
        }
    });

    grid.appendChild(card);
    });

    // Trigger CSS transition — setting width after a brief delay ensures the
    // animation runs even if the element was just inserted into the DOM
    setTimeout(() => {
    document.querySelectorAll('.g-fill').forEach(el => {
        el.style.width = el.dataset.width + '%';
    });
    }, 100);
}


// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════

// Set the pinned team before building the UI so the first render is correct
selectedTeam = CHAMP;

buildHalf(ML, 'lh');
buildHalf(MR, 'rh');
buildFinal();
buildGroups();

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

// ════════════════════════════════════════
// SCORE PROBABILITY CARDS
// Uses partidas.csv
// one_zero = home 1 x 0 away
// ════════════════════════════════════════

const MATCHES_CSV_URL = 'csv/placares/partidas.csv';
const FLAGS_CSV_URL = 'images/flags/flag.csv';
const SCORE_STAGES = [
    {panelId: 'panel-r32',     groupValue: 'R32',       showFilters: true,  gridClass: 'scorecards-grid', showPlaceholder: false},
    {panelId: 'panel-oitavas', groupValue: 'oitavas',   showFilters: true,  gridClass: 'scorecards-grid', showPlaceholder: false},
    {panelId: 'panel-quartas', groupValue: 'quartas',   showFilters: false, gridClass: 'scorecards-grid scorecards-grid-two', showPlaceholder: false},
    {panelId: 'panel-semis',   groupValue: 'semifinal', showFilters: false, gridClass: 'scorecards-grid scorecards-grid-two', showPlaceholder: false},
    {panelId: 'panel-final',   groupValue: 'final',     showFilters: false, gridClass: 'scorecards-grid scorecards-grid-two', showPlaceholder: true}
];



(function () {
    const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four'];

    function scoreKey(homeGoals, awayGoals) {
        return `${NUMBER_WORDS[homeGoals]}_${NUMBER_WORDS[awayGoals]}`;
    }

    function escapeHTML(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function normalizeName(value) {
        return String(value ?? '')
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    function parseNumber(value) {
        if (value === undefined || value === null || value === '') return null;

        const n = Number(
            String(value)
                .trim()
                .replace('%', '')
                .replace(',', '.')
        );

        return Number.isFinite(n) ? n : null;
    }

    function formatPct(value) {
        const rounded = Math.round(value * 10) / 10;
        return Number.isInteger(rounded) ? String(rounded) : String(rounded);
    }

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

    async function loadCSV(url) {
        const response = await fetch(url, { cache: 'no-store' });

        if (!response.ok) {
            throw new Error(`Não foi possível carregar ${url}`);
        }

        return parseCSV(await response.text());
    }

    function normalizeFlagUrl(url) {
        if (!url) return '';

        let value = String(url).trim();

        if (value.includes('github.com') && value.includes('/blob/')) {
            value = value
                .replace('https://github.com/', 'https://raw.githubusercontent.com/')
                .replace('/blob/', '/');
        }

        return value;
    }

    function getHomeCountry(row) {
        return row.home_country || row.home_team || row.home || '';
    }

    function getAwayCountry(row) {
        return row.away_country || row.away_team || row.away || '';
    }

    function getMatchGroup(row) {
        return row.group || row.stage || row.round || '';
    }

    function findFlagUrl(flagRows, countryName) {
        const country = normalizeName(countryName);

        const row = flagRows.find(item =>
            normalizeName(item.country_pt) === country
        );

        return row ? normalizeFlagUrl(row.svg_github) : '';
    }

    function getOutcomeGroups(row) {
        const homeWin = [];
        const draw = [];
        const awayWin = [];

        for (let h = 0; h <= 4; h++) {
            for (let a = 0; a <= 4; a++) {
                const key = scoreKey(h, a);
                const value = parseNumber(row[key]);

                if (value === null) continue;

                const item = {
                    key,
                    label: `${h}x${a}`,
                    homeGoals: h,
                    awayGoals: a,
                    value
                };

                if (h > a) homeWin.push(item);
                else if (h === a) draw.push(item);
                else awayWin.push(item);
            }
        }

        const byProbability = (a, b) => b.value - a.value;

        homeWin.sort(byProbability);
        draw.sort(byProbability);
        awayWin.sort(byProbability);

        return { homeWin, draw, awayWin };
    }

    function sumOutcomes(outcomes) {
        return outcomes.reduce((sum, item) => sum + item.value, 0);
    }

    function getBestScore(...groups) {
        return groups
            .flat()
            .slice()
            .sort((a, b) => b.value - a.value)[0];
    }

    function renderOutcomeRows(outcomes) {
        const maxValue = Math.max(...outcomes.map(item => item.value), 1);

        return outcomes.map(item => {
            const width = Math.max(2, (item.value / maxValue) * 100);

            return `
                <div class="score-row">
                    <div class="score-label">${escapeHTML(item.label)}</div>
                    <div class="score-bar-space">
                        <div class="score-bar" style="--w:${width}%"></div>
                    </div>
                    <div class="score-value">${formatPct(item.value)}</div>
                </div>
            `;
        }).join('');
    }

    function renderOutcomeCard(type, title, totalLabel, totalValue, outcomes) {
        return `
            <div class="score-outcome-card ${type}">
                <div class="score-outcome-title">${escapeHTML(title)}</div>

                <div class="score-outcome-list">
                    ${renderOutcomeRows(outcomes)}
                </div>

                <div class="score-total">
                    <span class="score-total-label">${escapeHTML(totalLabel)}</span>
                    <span class="score-total-value">${formatPct(totalValue)}%</span>
                </div>
            </div>
        `;
    }

    function renderFlag(country, flagUrl) {
        if (flagUrl) {
            return `<img src="${escapeHTML(flagUrl)}" alt="${escapeHTML(country)}">`;
        }

        return `<div class="score-flag-fallback">${escapeHTML(country)}</div>`;
    }

    function renderScoreCard(row, flagRows) {
        const homeCountry = getHomeCountry(row);
        const awayCountry = getAwayCountry(row);

        const { homeWin, draw, awayWin } = getOutcomeGroups(row);

        const best = getBestScore(homeWin, draw, awayWin) || {
            label: '0x0',
            value: 0
        };

        const homeTotal = sumOutcomes(homeWin);
        const drawTotal = sumOutcomes(draw);
        const awayTotal = sumOutcomes(awayWin);

        const homeFlag = findFlagUrl(flagRows, homeCountry);
        const awayFlag = findFlagUrl(flagRows, awayCountry);

        const matchTitle = `${homeCountry} X ${awayCountry}`;
        const matchDate = row.date || '';

        const homeReal = row.home_real || '—';
        const awayReal = row.away_real || '—';

        const searchText = normalizeName(`${homeCountry} ${awayCountry}`);

        return `
            <section 
                class="match-card g-card"
                data-home="${escapeHTML(homeCountry)}"
                data-away="${escapeHTML(awayCountry)}"
                data-search="${escapeHTML(searchText)}"
                data-date="${escapeHTML(matchDate)}"
            >
                <div class="g-head">
                    <div>${escapeHTML(matchTitle)}</div>
                    <span>${escapeHTML(matchDate)}</span>
                </div>

                <article class="score-card">
                    <div class="score-card-top">
                        <div class="score-flag-wrap">
                            <div class="score-flag">
                                ${renderFlag(homeCountry, homeFlag)}
                            </div>
                        </div>

                        <div class="score-main">
                            <div class="score-main-result">${escapeHTML(best.label.replace('x', ' x '))}</div>
                            <div class="score-main-prob">Probabilidade: ${formatPct(best.value)}%</div>
                        </div>

                        <div class="score-flag-wrap">
                            <div class="score-flag">
                                ${renderFlag(awayCountry, awayFlag)}
                            </div>
                        </div>
                    </div>

                    <div class="score-columns">
                        ${renderOutcomeCard(
                            'home',
                            `${homeCountry} vence`,
                            homeCountry,
                            homeTotal,
                            homeWin
                        )}

                        ${renderOutcomeCard(
                            'draw',
                            'Empate',
                            'Empate',
                            drawTotal,
                            draw
                        )}

                        ${renderOutcomeCard(
                            'away',
                            `${awayCountry} vence`,
                            awayCountry,
                            awayTotal,
                            awayWin
                        )}
                    </div>
                </article>

                <div class="real-result">
                    Resultado Real: <span>${escapeHTML(homeReal)} x ${escapeHTML(awayReal)}</span>
                </div>
            </section>
        `;
    }

    function renderScorePanelShell(panel, stage) {
        const filtersHTML = stage.showFilters === false ? '' : `
            <div class="filterbar">
                <div class="filter-field search-field">
                    <div class="search-wrap">
                        <span class="search-icon">🔎</span>
                        <input 
                            class="country-filter" 
                            type="text" 
                            placeholder="Pesquisar país..."
                            autocomplete="off"
                        >
                    </div>
                </div>

                <div class="filter-field date-field">
                    <div class="date-dropdown">
                        <button type="button" class="date-dropdown-btn">
                            Todas as datas
                            <span>▾</span>
                        </button>

                        <div class="date-dropdown-menu"></div>
                    </div>
                </div>
            </div>
        `;

        panel.innerHTML = `
            ${filtersHTML}

            <div class="${stage.gridClass || 'scorecards-grid'}"></div>

            <div class="no-results">
                Nenhum confronto encontrado com os filtros selecionados.
            </div>
        `;
    }

    function populateDateFilter(panel) {
        const dateMenu = panel.querySelector('.date-dropdown-menu');
        if (!dateMenu) return;

        const dates = [...panel.querySelectorAll('.match-card')]
            .map(card => card.dataset.date)
            .filter(Boolean);

        const uniqueDates = [...new Set(dates)];

        dateMenu.innerHTML = uniqueDates
            .map(date => `
                <label class="date-option">
                    <input type="checkbox" value="${escapeHTML(date)}">
                    <span>${escapeHTML(date)}</span>
                </label>
            `)
            .join('');
    }

    function attachScoreFilters(panel) {
        const countryInput = panel.querySelector('.country-filter');
        const dateButton = panel.querySelector('.date-dropdown-btn');
        const dateMenu = panel.querySelector('.date-dropdown-menu');
        const dateDropdown = panel.querySelector('.date-dropdown');

        if (countryInput) {
            countryInput.addEventListener('input', () => applyScoreFilters(panel));
        }

        if (dateButton && dateMenu && dateDropdown) {
            dateButton.addEventListener('click', function (event) {
                event.stopPropagation();
                dateDropdown.classList.toggle('open');
            });

            dateMenu.querySelectorAll('input[type="checkbox"]').forEach(input => {
                input.addEventListener('change', () => applyScoreFilters(panel));
            });

            document.addEventListener('click', function (event) {
                if (!dateDropdown.contains(event.target)) {
                    dateDropdown.classList.remove('open');
                }
            });
        }
    }

    function applyScoreFilters(panel) {
        const countryInput = panel.querySelector('.country-filter');
        const dateMenu = panel.querySelector('.date-dropdown-menu');
        const dateButton = panel.querySelector('.date-dropdown-btn');
        const noResults = panel.querySelector('.no-results');

        const countryQuery = normalizeName(countryInput?.value || '');

        const selectedDates = dateMenu
            ? [...dateMenu.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value)
            : [];

        if (dateButton) {
            const label = selectedDates.length
                ? `${selectedDates.length} data${selectedDates.length > 1 ? 's' : ''} selecionada${selectedDates.length > 1 ? 's' : ''}`
                : 'Todas as datas';

            dateButton.innerHTML = `${label}<span>▾</span>`;
        }

        let visibleCount = 0;

        panel.querySelectorAll('.match-card').forEach(card => {
            const matchesCountry =
                !countryQuery ||
                card.dataset.search.includes(countryQuery);

            const matchesDate =
                !selectedDates.length ||
                selectedDates.includes(card.dataset.date);

            const shouldShow = matchesCountry && matchesDate;

            card.style.display = shouldShow ? '' : 'none';

            if (shouldShow) visibleCount++;
        });

        if (noResults) {
            noResults.style.display = visibleCount ? 'none' : 'block';
        }
    }

    function adjustScoreTotalHeights(panel) {
        panel.querySelectorAll('.score-total').forEach(total => {
            const label = total.querySelector('.score-total-label');
            if (!label) return;

            total.classList.remove('tall');

            requestAnimationFrame(() => {
                const isTwoLines = label.scrollHeight > 10;
                total.classList.toggle('tall', isTwoLines);
            });
        });
    }

    function renderScoreStage(stage, matchRows, flagRows) {
        if (stage.showPlaceholder) {
            renderPlaceholder(stage.panelId,PLACEHOLDERS[stage.panelId] || 'desta fase');
            return;
        }

        const panel = document.getElementById(stage.panelId);
        if (!panel) return;

        renderScorePanelShell(panel, stage);

        const container = panel.querySelector('.scorecards-grid');

        const stageRows = matchRows.filter(row =>
            normalizeName(getMatchGroup(row)) === normalizeName(stage.groupValue)
        );

        const cards = stageRows
            .map(row => renderScoreCard(row, flagRows))
            .join('');

        container.innerHTML = cards || `
            <div class="score-empty">
                Nenhum confronto encontrado para esta fase.
            </div>
        `;

        if (stage.showFilters !== false) {
            populateDateFilter(panel);
            attachScoreFilters(panel);
        }
        adjustScoreTotalHeights(panel);
    }

    async function renderScoreStagePanels() {
        try {
            const [matchRows, flagRows] = await Promise.all([
                loadCSV(MATCHES_CSV_URL),
                loadCSV(FLAGS_CSV_URL)
            ]);

            SCORE_STAGES.forEach(stage => {
                renderScoreStage(stage, matchRows, flagRows);
            });
        } catch (error) {
            SCORE_STAGES.forEach(stage => {
                const panel = document.getElementById(stage.panelId);
                if (!panel) return;

                panel.innerHTML = `
                    <div class="score-error">
                        Erro ao carregar os arquivos CSV.<br>
                        Verifique:<br>
                        ${escapeHTML(MATCHES_CSV_URL)}<br>
                        ${escapeHTML(FLAGS_CSV_URL)}
                    </div>
                `;
            });

            console.error(error);
        }
    }

    document.addEventListener('DOMContentLoaded', renderScoreStagePanels);
})();