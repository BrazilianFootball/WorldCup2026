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

const MATCHES_CSV_URL = 'csv/placares/partidas.csv';
const FLAGS_CSV_URL = 'images/flags/flag.csv';
const SCORE_STAGES = [
    {panelId: 'panel-r32',     groupValue: 'R32',       showFilters: true,  gridClass: 'scorecards-grid'},
    {panelId: 'panel-oitavas', groupValue: 'oitavas',   showFilters: true,  gridClass: 'scorecards-grid'},
    {panelId: 'panel-quartas', groupValue: 'quartas',   showFilters: false, gridClass: 'scorecards-grid scorecards-grid-two'},
    {panelId: 'panel-semis',   groupValue: 'semifinal', showFilters: false, gridClass: 'scorecards-grid scorecards-grid-two'},
    {panelId: 'panel-final',   groupValue: 'final',     showFilters: false, gridClass: 'scorecards-grid scorecards-grid-two'}
];

// ════════════════════════════════════════
// GROUP STAGE
// ════════════════════════════════════════

(function () {
    const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four'];
    let GROUP_STAGE_ROWS = [];

    function scoreKey(h, a) {
        return `${NUMBER_WORDS[h]}_${NUMBER_WORDS[a]}`;
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
        const n = Number(String(value).trim().replace('%', '').replace(',', '.'));
        return Number.isFinite(n) ? n : null;
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
        if (!response.ok) throw new Error(`Não foi possível carregar ${url}`);
        return parseCSV(await response.text());
    }

    function getOutcomeProbs(row) {
        let pHomeWin = 0;
        let pDraw = 0;
        let pAwayWin = 0;

        for (let h = 0; h <= 4; h++) {
            for (let a = 0; a <= 4; a++) {
                const key = scoreKey(h, a);
                const v = parseNumber(row[key]);
                if (v === null) continue;

                if (h > a) pHomeWin += v;
                else if (h === a) pDraw += v;
                else pAwayWin += v;
            }
        }

        // valores em fração (0..1)
        return {
            pHomeWin: pHomeWin / 100,
            pDraw: pDraw / 100,
            pAwayWin: pAwayWin / 100
        };
    }

    function expectedPointsForMatch(row) {
        const { pHomeWin, pDraw, pAwayWin } = getOutcomeProbs(row);

        return {
            home: (3 * pHomeWin) + (1 * pDraw),
            away: (3 * pAwayWin) + (1 * pDraw)
        };
    }

    function buildGroupCards(matchRows) {
        const grid = document.getElementById('gg');
        if (!grid) return;

        const panel = document.getElementById('panel-groups');
        if (!panel) return;

        // cria a barra só uma vez (se já existir, não duplica)
        if (!panel.querySelector('.groups-filterbar')) {
            const note = panel.querySelector('.g-note');

            const filterHTML = `
            <div class="filterbar groups-filterbar">
                <div class="search-wrap">
                <span class="search-icon">🔎</span>
                <input class="country-filter group-country-filter" type="text" placeholder="Pesquisar país..." autocomplete="off">
                </div>

                <div class="groups-mode">
                <button type="button" class="groups-mode-btn active" data-mode="games">Grupos</button>
                <button type="button" class="groups-mode-btn" data-mode="matches">Partidas</button>
                </div>

                <div class="date-dropdown group-dropdown">
                <button type="button" class="date-dropdown-btn group-dropdown-btn">
                    Todos os grupos <span>▾</span>
                </button>
                <div class="date-dropdown-menu group-dropdown-menu"></div>
                </div>

                <!-- Aparece só no modo Partidas -->
                <div class="date-dropdown groups-date-dropdown">
                <button type="button" class="date-dropdown-btn groups-date-dropdown-btn">
                    Todas as datas <span>▾</span>
                </button>
                <div class="date-dropdown-menu groups-date-dropdown-menu"></div>
                </div>
            </div>

            <div class="no-results groups-no-results">Nenhum grupo encontrado com os filtros selecionados.</div>
            `;

            if (note) note.insertAdjacentHTML('afterend', filterHTML);
            else panel.insertAdjacentHTML('afterbegin', filterHTML);
        }

        // container para "Partidas" (scorecards) — cria uma vez
        if (!panel.querySelector('#groups-scorecards')) {
        grid.insertAdjacentHTML(
            'afterend',
            `<div id="groups-scorecards" class="scorecards-grid" style="display:none"></div>`
        );
        }

        // modo default
        if (!panel.dataset.groupsMode) panel.dataset.groupsMode = 'games';

        grid.innerHTML = '';

        // grupos “A..L” (apenas 1 letra)
        const groups = [...new Set(matchRows.map(r => String(r.group ?? '').trim()))]
            .filter(g => /^[A-L]$/.test(g))
            .sort();

        if (!groups.length) {
            grid.innerHTML = `
                <div class="g-card">
                    <div class="g-head">Fase de grupos<span>—</span></div>
                    <div class="g-team"><div class="g-name">Nenhum jogo de fase de grupos encontrado no CSV.</div></div>
                </div>
            `;
            return;
        }

        groups.forEach(letter => {
            const rows = matchRows.filter(r => String(r.group ?? '').trim() === letter);

            // times do grupo
            const teams = [...new Set(rows.flatMap(r => [r.home_team, r.away_team]).filter(Boolean))];

            // pontos esperados por time
            const pts = {};
            teams.forEach(t => (pts[t] = 0));

            rows.forEach(r => {
                const home = r.home_team;
                const away = r.away_team;
                const ep = expectedPointsForMatch(r);

                if (home in pts) pts[home] += ep.home;
                if (away in pts) pts[away] += ep.away;
            });

            const totalPts = teams.reduce((s, t) => s + pts[t], 0) || 1;

            // normaliza em %
            const ranking = teams
                .map(t => ({
                    name: t,
                    expPts: pts[t],
                    pct: (pts[t] / totalPts) * 100
                }))
                .sort((a, b) => b.pct - a.pct);

            const card = document.createElement('div');
            card.className = 'g-card';
            card.classList.add('group-card');
            card.dataset.group = letter;
            card.dataset.search = normalizeName(teams.join(' ')); // times do grupo
            const favorite = ranking[0]?.name || '';
            card.innerHTML = `
                <div class="g-head">
                    Grupo ${letter}
                    <span>${favorite}</span>
                </div>
            `;

            ranking.forEach((t, idx) => {
                const position = idx + 1;

                const label = position === 1 ? '1º' : position === 2 ? '2º' : position === 3 ? '3º' : '4º';
                const badgeClass = position === 1 ? 'b1' : position === 2 ? 'b2' : position === 3 ? 'b3' : 'b4';
                const statusClass = position <= 2 ? 'qualify' : position === 3 ? 'playoff' : 'elim';
                const probDisplay = Math.round(t.pct * 10) / 10; // 1 casa
                const probText = Number.isInteger(probDisplay) ? `${probDisplay.toFixed(0)}%` : `${probDisplay}%`;

                const row = document.createElement('div');
                row.className = `g-team ${statusClass}`;

                row.innerHTML = `
                    <div class="g-row">
                        <div class="g-badge ${badgeClass}">${label}</div>
                        <div class="g-name">
                            ${t.name}
                            ${t.name === favorite ? '<span class="g-fav">🔥</span>' : ''}
                        </div>
                        <div class="g-prob">${probText}</div>
                    </div>
                    <div class="g-progress">
                        <div class="g-fill" data-width="${probDisplay}"></div>
                    </div>
                `;

                // Interação opcional com o chaveamento (se existir)
                if (typeof showStats === 'function' && typeof selectTeam === 'function') {
                    row.addEventListener('mouseenter', () => showStats(t.name));
                    row.addEventListener('mouseleave', () => {
                        // selectedTeam existe no chaveamento.js; se não existir, volta pro favorito
                        const back = (typeof window.selectedTeam !== 'undefined' && window.selectedTeam) ? window.selectedTeam : favorite;
                        showStats(back);
                    });
                    row.addEventListener('click', () => selectTeam(t.name));
                }

                card.appendChild(row);

                if (position === 2) {
                    const cut = document.createElement('div');
                    cut.className = 'g-cut';
                    card.appendChild(cut);
                }
            });

            grid.appendChild(card);
        });

        populateGroupDropdown(groups);
        populateGroupsDateDropdown(matchRows);
        attachGroupFilters();
        applyGroupFilters();

        // anima as barras
        setTimeout(() => {
            document.querySelectorAll('#gg .g-fill').forEach(el => {
                el.style.width = el.dataset.width + '%';
            });
        }, 100);

        setGroupsMode(panel.dataset.groupsMode || 'games');
    }

    function populateGroupDropdown(groups) {
        const panel = document.getElementById('panel-groups');
        if (!panel) return;

        const menu = panel.querySelector('.group-dropdown-menu');
        if (!menu) return;

        menu.innerHTML = groups.map(g => `
            <label class="date-option">
                <input type="checkbox" value="${g}">
                <span>Grupo ${g}</span>
            </label>
        `).join('');
    }

    function populateGroupsDateDropdown(matchRows) {
        const panel = document.getElementById('panel-groups');
        if (!panel) return;

        const menu = panel.querySelector('.groups-date-dropdown-menu');
        if (!menu) return;

        const stageRows = matchRows.filter(r => /^[A-L]$/.test(String(r.group ?? '').trim()));
        const dates = stageRows.map(r => String(r.date ?? '').trim()).filter(Boolean);
        const uniqueDates = [...new Set(dates)];

        menu.innerHTML = uniqueDates.map(d => `
            <label class="date-option">
            <input type="checkbox" value="${d}">
            <span>${d}</span>
            </label>
        `).join('');
    }

    function attachGroupFilters() {
        const panel = document.getElementById('panel-groups');
        if (!panel) return;

        const input = panel.querySelector('.group-country-filter');
        const dropdown = panel.querySelector('.group-dropdown');
        const btn = panel.querySelector('.group-dropdown-btn');
        const menu = panel.querySelector('.group-dropdown-menu');
        const dateDropdown = panel.querySelector('.groups-date-dropdown');
        const dateBtn = panel.querySelector('.groups-date-dropdown-btn');
        const dateMenu = panel.querySelector('.groups-date-dropdown-menu');

        if (dateBtn && dateDropdown && !dateBtn.dataset.bound)
            { dateBtn.addEventListener('click', (e) => { e.stopPropagation(); dateDropdown.classList.toggle('open'); });
            dateBtn.dataset.bound = '1'; }

        const modeWrap = panel.querySelector('.groups-mode');
        if (modeWrap && !modeWrap.dataset.bound) {
        modeWrap.addEventListener('click', (ev) => {
            const btnMode = ev.target.closest('.groups-mode-btn');
            if (!btnMode) return;
            setGroupsMode(btnMode.dataset.mode);
        });
        modeWrap.dataset.bound = '1';
        }

        if (input && !input.dataset.bound) {
            input.addEventListener('input', applyGroupFilters);
            input.dataset.bound = '1';
        }

        if (btn && dropdown && !btn.dataset.bound) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('open');
            });
            btn.dataset.bound = '1';
        }

        if (menu && !menu.dataset.bound) {
            menu.addEventListener('change', (e) => {
                const checks = [...menu.querySelectorAll('input[type="checkbox"]')];
                const checked = checks.filter(c => c.checked);
                applyGroupFilters();
            });
            menu.dataset.bound = '1';

            // Datas (modo "Partidas"): ao marcar/desmarcar, aplica filtros
            if (dateMenu && !dateMenu.dataset.bound) {
            dateMenu.addEventListener('change', applyGroupFilters);
            dateMenu.dataset.bound = '1';
            }
        }

        // fechar ao clicar fora (só 1 listener global, mas não duplica)
        if (!document.documentElement.dataset.groupsDropdownBound) {
            document.addEventListener('click', (ev) => {
            document.querySelectorAll('#panel-groups .group-dropdown.open, #panel-groups .groups-date-dropdown.open')
                .forEach(dd => { if (!dd.contains(ev.target)) dd.classList.remove('open'); });
            });
            document.documentElement.dataset.groupsDropdownBound = '1';
        }

        
    }

    async function ensureGroupMatchCardsRendered() {
        const panel = document.getElementById('panel-groups');
        const container = panel?.querySelector('#groups-scorecards');
        if (!panel || !container) return;
        if (container.dataset.ready === '1') return;

        // só partidas da fase de grupos (A..L)
        const stageRows = GROUP_STAGE_ROWS.filter(r => /^[A-L]$/.test(String(r.group ?? '').trim()));

        // usa o renderer existente dos cards de placares
        if (!window.ScoreCards?.renderScoreCardHTML || !window.ScoreCards?.getFlagRowsOnce) {
            container.innerHTML = '';
            container.dataset.ready = '1';
            return;
        }

        const flagRows = await window.ScoreCards.getFlagRowsOnce();
        container.innerHTML = stageRows.map(r => window.ScoreCards.renderScoreCardHTML(r, flagRows)).join('');
        /* aplica a regra do .score-total.tall também na Fase de Grupos */
        window.ScoreCards.adjustScoreTotalHeights?.(container);
        container.dataset.ready = '1';
        }

        async function setGroupsMode(mode) {
        const panel = document.getElementById('panel-groups');
        if (!panel) return;

        panel.dataset.groupsMode = mode;

        const filterbar = panel.querySelector('.groups-filterbar');
        if (filterbar) filterbar.classList.toggle('has-date', mode === 'matches');

        // se saiu de "matches", limpa seleção de datas
        if (mode !== 'matches') {
        panel.querySelectorAll('.groups-date-dropdown-menu input[type="checkbox"]').forEach(i => (i.checked = false));
        const dateBtn = panel.querySelector('.groups-date-dropdown-btn');
        if (dateBtn) dateBtn.innerHTML = `Todas as datas <span>▾</span>`;
        }

        panel.querySelectorAll('.groups-mode-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === mode);
        });

        const gg = panel.querySelector('#gg');
        const sc = panel.querySelector('#groups-scorecards');

        if (gg) gg.style.display = (mode === 'games') ? '' : 'none';
        if (sc) sc.style.display = (mode === 'matches') ? '' : 'none';

        if (mode === 'matches') await ensureGroupMatchCardsRendered();

        applyGroupFilters();
    }

    function applyGroupFilters() {
        const panel = document.getElementById('panel-groups');
        if (!panel) return;

        const input = panel.querySelector('.group-country-filter');
        const menu = panel.querySelector('.group-dropdown-menu');
        const btn = panel.querySelector('.group-dropdown-btn');
        const noResults = panel.querySelector('.groups-no-results');
        const dateMenu = panel.querySelector('.groups-date-dropdown-menu');
        const dateBtn = panel.querySelector('.groups-date-dropdown-btn');
        const q = normalizeName(input?.value || '');

        const selectedGroups = menu
            ? [...menu.querySelectorAll('input[type="checkbox"]:checked')].map(i => i.value)
            : [];

        // label do botão
        if (btn) {
            const all = menu ? menu.querySelectorAll('input[type="checkbox"]').length : 0;
            const n = selectedGroups.length;

            let label;
            if (n === 0) {label = 'Todos os grupos';} 
            else {label = `${n} grupo${n > 1 ? 's' : ''} selecionado${n > 1 ? 's' : ''}`;}
            btn.innerHTML = `${label}<span>▾</span>`;
        }

        const mode = panel.dataset.groupsMode || 'games';

        let visible = 0;

        if (mode === 'games') {
        if (noResults) noResults.textContent = 'Nenhum grupo encontrado com os filtros selecionados.';

        panel.querySelectorAll('#gg .group-card').forEach(card => {
            const matchGroup =!selectedGroups.length || selectedGroups.includes(card.dataset.group);
            const matchText = !q || (card.dataset.search || '').includes(q);

            const show = matchGroup && matchText;
            card.style.display = show ? '' : 'none';
            if (show) visible++;
        });
        } else {
        if (noResults) noResults.textContent = 'Nenhuma partida encontrada com os filtros selecionados.';

        const selectedDates = dateMenu
        ? [...dateMenu.querySelectorAll('input[type="checkbox"]:checked')].map(i => i.value)
        : [];

        if (dateBtn) {
        const label = selectedDates.length
            ? `${selectedDates.length} data${selectedDates.length > 1 ? 's' : ''} selecionada${selectedDates.length > 1 ? 's' : ''}`
            : 'Todas as datas';
        dateBtn.innerHTML = `${label}<span>▾</span>`;
        }

        panel.querySelectorAll('#groups-scorecards .match-card').forEach(card => {
            const matchGroup = !selectedGroups.length || selectedGroups.includes(card.dataset.group);
            const matchText = !q || (card.dataset.search || '').includes(q);
            const matchDate = !selectedDates.length || selectedDates.includes(card.dataset.date);
            const show = matchGroup && matchText && matchDate;
            card.style.display = show ? '' : 'none';
            if (show) visible++;
        });
        }

        if (noResults) noResults.style.display = visible ? 'none' : 'block';
    }

    async function renderGroupStage() {
        try {
            const rows = await loadCSV(MATCHES_CSV_URL);
            GROUP_STAGE_ROWS = rows;
            buildGroupCards(rows);
        } catch (e) {
            const grid = document.getElementById('gg');
            if (grid) {
                grid.innerHTML = `
                    <div class="g-card">
                        <div class="g-head">Fase de grupos<span>erro</span></div>
                        <div class="g-team"><div class="g-name">Erro ao carregar ${MATCHES_CSV_URL}.</div></div>
                    </div>
                `;
            }
            console.error(e);
        }
    }

    document.addEventListener('DOMContentLoaded', renderGroupStage);
})();


// ════════════════════════════════════════
// SCORE PROBABILITY CARDS
// Uses partidas.csv
// one_zero = home 1 x 0 away
// ════════════════════════════════════════


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
                data-group="${escapeHTML(getMatchGroup(row))}"
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

    let __flagRowsPromise = null;
    function getFlagRowsOnce() {
    if (!__flagRowsPromise) __flagRowsPromise = loadCSV(FLAGS_CSV_URL);
    return __flagRowsPromise;
    }

    window.ScoreCards = window.ScoreCards || {};
    window.ScoreCards.renderScoreCardHTML = renderScoreCard;
    window.ScoreCards.getFlagRowsOnce = getFlagRowsOnce;
    window.ScoreCards.adjustScoreTotalHeights = adjustScoreTotalHeights;
    
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

            const textLength = label.textContent.trim().length;

            total.classList.remove('tall', 'tallest');
            if (textLength > 20) {
                total.classList.add('tallest');
            } else if (textLength > 10) {
                total.classList.add('tall');
            }
        });
    }

    function renderScoreStage(stage, matchRows, flagRows) {
        const stageRows = matchRows.filter(row =>
            normalizeName(getMatchGroup(row)) === normalizeName(stage.groupValue)
        );

        // Se não houver partidas → mostrar placeholder automaticamente
        if (!stageRows.length) {
            renderPlaceholder(
                stage.panelId,
                PLACEHOLDERS[stage.panelId] || 'desta fase'
            );
            return;
        }

        const panel = document.getElementById(stage.panelId);
        if (!panel) return;

        renderScorePanelShell(panel, stage);

        const container = panel.querySelector('.scorecards-grid');
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