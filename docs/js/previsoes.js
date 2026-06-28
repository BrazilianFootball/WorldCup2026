// Mapeia cada painel de mata-mata para o texto exibido quando ainda não há confronto definido.
const PLACEHOLDERS = {
    'panel-r32': 'da <b>R32</b>',
    'panel-16-avos': 'da <b>16-Avos</b>',
    'panel-oitavas': 'das <b>Oitavas de Final</b>',
    'panel-quartas': 'das <b>Quartas de Final</b>',
    'panel-semis': 'da <b>Semifinal</b>',
    'panel-final': 'da <b>Final e Disputa pelo 3º lugar</b>'
};

// Monta o HTML do aviso usado quando as probabilidades daquela fase ainda não estão disponíveis.
function makePlaceholder(panelId, stageLabel) {
    return `
        <div class="placeholder-box">
            <div class="placeholder-icon-wrap">
                🛠️
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


// Insere o placeholder no painel informado, se ele existir na página.
function renderPlaceholder(panelId, stageLabel) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.innerHTML = makePlaceholder(panelId, stageLabel);
}

const MATCHES_CSV_URL = 'csv/previsoes/partidas.csv';
const SIMULATOR_CSV_URL = 'csv/previsoes/all_matchups.csv';
const FLAGS_CSV_URL = 'images/flags/flag.csv';
const SCORE_STAGES = [
    {panelId: 'panel-r32',     groupValue: 'R32',       showFilters: true,  gridClass: 'scorecards-grid'},
    {panelId: 'panel-16-avos', groupValue: '16-avos',   showFilters: true,  gridClass: 'scorecards-grid'},
    {panelId: 'panel-oitavas', groupValue: 'oitavas',   showFilters: true,  gridClass: 'scorecards-grid'},
    {panelId: 'panel-quartas', groupValue: 'quartas',   showFilters: false, gridClass: 'scorecards-grid scorecards-grid-two'},
    {panelId: 'panel-semis',   groupValue: 'semifinal', showFilters: false, gridClass: 'scorecards-grid scorecards-grid-two'},
    {panelId: 'panel-final',   groupValue: 'final',     showFilters: false, gridClass: 'scorecards-grid scorecards-grid-two'}
];

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four'];

function scoreKey(h, a) {
    return `${NUMBER_WORDS[h]}_${NUMBER_WORDS[a]}`;
}

const SCORES = Array.from({ length: 25 }, (_, i) => {
    const h = Math.floor(i / 5);
    const a = i % 5;
    return {
        h,
        a,
        key: scoreKey(h, a),
        label: `${h}x${a}`
    };
});

function escapeHTML(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Normaliza textos para busca: remove acentos e ignora maiúsculas/minúsculas.
function normalizeName(value) {
    return String(value ?? '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

// Converte valores percentuais do CSV em número, aceitando vírgula decimal e símbolo %.
function parseNumber(value) {
    if (value === undefined || value === null || value === '') return null;
    const n = Number(String(value).trim().replace('%', '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
}

function formatPct(value) {
    return Number(value).toFixed(1);
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

function getSelectedValues(menu) {
    return menu
        ? [...menu.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value)
        : [];
}

function pluralLabel(count, singular, plural, emptyLabel) {
    if (!count) return emptyLabel;
    return `${count} ${count === 1 ? singular : plural}`;
}

function updateDateButton(button, selectedDates) {
    if (!button) return;
    const label = pluralLabel(
        selectedDates.length,'data selecionada','datas selecionadas','Todas as datas'
    );
    button.innerHTML = `${label}<span>▾</span>`;
}

function parsePrevisoesDate(value) {
    const [day, month, year] = String(value).trim().split('/').map(Number);

    if (!Number.isFinite(day) || !Number.isFinite(month)) {
        return Number.POSITIVE_INFINITY;
    }

    const fullYear = Number.isFinite(year)
        ? (year < 100 ? 2000 + year : year)
        : 2026;

    return new Date(fullYear, month - 1, day, 12, 0, 0).getTime();
}

function getTodayPrevisoesDate() {
    const today = new Date();
    return new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        12,
        0,
        0
    ).getTime();
}

function buildDateOptionHTML(date, isPast = false) {
    return `
        <label class="date-option ${isPast ? 'date-option-past' : ''}">
            <input type="checkbox" value="${escapeHTML(date)}">
            <span class="date-option-text">
                ${escapeHTML(date)}
                ${isPast ? '<small class="date-option-status">Já passou</small>' : ''}
            </span>
        </label>
    `;
}

function buildGroupedDateDropdownHTML(dates) {
    const today = getTodayPrevisoesDate();

    const parsedDates = dates.map(date => ({
        value: date,
        time: parsePrevisoesDate(date)
    }));

    const futureDates = parsedDates
        .filter(item => item.time >= today)
        .sort((a, b) => a.time - b.time);

    const pastDates = parsedDates
        .filter(item => item.time < today)
        .sort((a, b) => b.time - a.time);

    return [
        futureDates.length ? `
            <div class="date-options-title">Próximas datas</div>
            ${futureDates.map(item => buildDateOptionHTML(item.value)).join('')}
        ` : '',

        pastDates.length ? `
            <div class="date-options-title date-options-title-past">Datas anteriores</div>
            ${pastDates.map(item => buildDateOptionHTML(item.value, true)).join('')}
        ` : ''
    ].join('');
}

function closeOpenDropdowns(except = null) {
    document.querySelectorAll('.date-dropdown.open').forEach(dropdown => {
        if (dropdown !== except) dropdown.classList.remove('open');
    });
}

function getFilterPanel(target) {
    return target.closest('#panel-grupos, #panel-r32, #panel-16-avos, #panel-oitavas, #panel-quartas, #panel-semis, #panel-final');
}

function applyUnifiedFilters(panel) {
    if (!panel) return;
    if (panel.id === 'panel-grupos') {
        applyGroupFilters(panel);
        return;
    }
    applyScoreFilters(panel);
}

function handleFilterEvent(event) {
    const target = event.target?.closest ? event.target : event.target?.parentElement;
    if (!target) return;

    if (event.type === 'click') {
        const scoreModeButton = target.closest('.score-mode .groups-mode-btn');

        if (scoreModeButton) {
            const panel = getFilterPanel(scoreModeButton);
            window.PrevisoesActions?.setScoreMode?.(panel, scoreModeButton.dataset.mode);
            return;
        }

        const modeButton = target.closest('.groups-mode-btn');

        if (modeButton) {
            window.PrevisoesActions?.setGroupsMode?.(modeButton.dataset.mode);
            return;
        }

        const dropdownButton = target.closest('.date-dropdown-btn');

        if (dropdownButton) {
            const dropdown = dropdownButton.closest('.date-dropdown');
            const willOpen = dropdown && !dropdown.classList.contains('open');
            closeOpenDropdowns(dropdown);
            if (dropdown) dropdown.classList.toggle('open', willOpen);
            return;
        }

        // fechar ao clicar fora (só 1 listener global, mas não duplica)
        if (!target.closest('.date-dropdown')) {
            closeOpenDropdowns();
        }

        return;
    }

    if (event.type === 'input' && target.matches('.country-filter')) {
        applyUnifiedFilters(getFilterPanel(target));
        return;
    }

    // Datas (modo "Partidas"): ao marcar/desmarcar, aplica filtros
    if (event.type === 'change' && target.matches('.date-dropdown-menu input[type="checkbox"]')) {
        applyUnifiedFilters(getFilterPanel(target));
    }
}

function installFilterDelegationOnce() {
    if (document.documentElement.dataset.previsoesFiltersBound) return;
    ['click', 'input', 'change'].forEach(type => {
        document.addEventListener(type, handleFilterEvent);
    });
    document.documentElement.dataset.previsoesFiltersBound = '1';
}

// Aplica filtros de texto, grupo e data conforme o modo atual da aba de grupos.
function applyGroupFilters(panel = document.getElementById('panel-grupos')) {
    if (!panel) return;

    const input = panel.querySelector('.group-country-filter');
    const menu = panel.querySelector('.group-dropdown-menu');
    const btn = panel.querySelector('.group-dropdown-btn');
    const noResults = panel.querySelector('.groups-no-results');
    const dateMenu = panel.querySelector('.groups-date-dropdown-menu');
    const dateBtn = panel.querySelector('.groups-date-dropdown-btn');
    const q = normalizeName(input?.value || '');

    const selectedGroups = getSelectedValues(menu);

    // label do botão
    if (btn) {
        const label = pluralLabel(
            selectedGroups.length,'grupo selecionado','grupos selecionados','Todos os grupos'
        );
        btn.innerHTML = `${label}<span>▾</span>`;
    }

    const mode = panel.dataset.groupsMode || (panel.dataset.groupsSource === 'previsoes' ? 'stickers' : 'games');

    let visible = 0;

    if (mode === 'games') {
        if (noResults) noResults.textContent = 'Nenhum grupo encontrado com os filtros selecionados.';

        panel.querySelectorAll('#gg .group-card').forEach(card => {
            const matchGroup = !selectedGroups.length || selectedGroups.includes(card.dataset.group);
            const matchText = !q || (card.dataset.search || '').includes(q);

            const show = matchGroup && matchText;
            card.style.display = show ? '' : 'none';
            if (show) visible++;
        });
    } else {
        if (noResults) noResults.textContent = 'Nenhuma partida encontrada com os filtros selecionados.';

        const selectedDates = getSelectedValues(dateMenu);

        updateDateButton(dateBtn, selectedDates);

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

function applyScoreFilters(panel) {
    const countryInput = panel.querySelector('.country-filter');
    const dateMenu = panel.querySelector('.date-dropdown-menu');
    const dateButton = panel.querySelector('.date-dropdown-btn');
    const noResults = panel.querySelector('.no-results');

    const countryQuery = normalizeName(countryInput?.value || '');

    const selectedDates = getSelectedValues(dateMenu);

    updateDateButton(dateButton, selectedDates);

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

// ════════════════════════════════════════
// GROUP STAGE
// ════════════════════════════════════════

// Bloco isolado da fase de grupos para evitar variáveis globais desnecessárias.
(function () {
    let GROUP_STAGE_ROWS = [];

    // Busca um valor em uma linha de CSV aceitando variações de nome de coluna.
    function compactHeader(value) {
        return normalizeName(value).replace(/[^a-z0-9]/g, '');
    }

    function getCSVValue(row, possibleHeaders) {
        const wanted = new Set(possibleHeaders.map(compactHeader));

        for (const key of Object.keys(row || {})) {
            if (wanted.has(compactHeader(key))) return row[key];
        }

        return '';
    }

    function getSummaryTeam(row) {
        return getCSVValue(row, [
            'team',
            'team_name',
            'country',
            'country_pt',
            'country_name',
            'name',
            'selection',
            'selecao',
            'seleção',
            'time',
            'equipe'
        ]);
    }

    function getSummary32(row) {
        return getCSVValue(row, ['round_of_32']);
    }

    function getSummaryProbabilityPercent(row) {
        const value = parseNumber(getSummary32(row));
        if (value === null) return null;

        // Aceita tanto fração (0.335) quanto percentual (33.5).
        return value <= 1 ? value * 100 : value;
    }

    function computeGroupStandings(rows) {
        const stats = new Map();
        rows.forEach(r => {
            const h = r.home_team, a = r.away_team;
            const hg = parseInt(r.home_real, 10), ag = parseInt(r.away_real, 10);
            if (!h || !a || isNaN(hg) || isNaN(ag)) return;
            if (!stats.has(h)) stats.set(h, { pts: 0, gd: 0, gf: 0 });
            if (!stats.has(a)) stats.set(a, { pts: 0, gd: 0, gf: 0 });
            const hs = stats.get(h), as_ = stats.get(a);
            hs.gf += hg; hs.gd += hg - ag;
            as_.gf += ag; as_.gd += ag - hg;
            if (hg > ag) { hs.pts += 3; }
            else if (hg === ag) { hs.pts += 1; as_.pts += 1; }
            else { as_.pts += 3; }
        });
        return stats;
    }

    function buildGroup32Map(summaryRows) {
        const map = new Map();

        summaryRows.forEach(row => {
            const team = getSummaryTeam(row);
            const pct = getSummaryProbabilityPercent(row);

            if (!team || pct === null) return;
            map.set(normalizeName(team), pct);
        });

        return map;
    }

    function getGroupFirstPlaceProbability(team, group32Map) {
        return group32Map.get(normalizeName(team)) ?? 0;
    }

    function getGroupLetters(matchRows) {
        return [...new Set(matchRows.map(r => String(r.group ?? '').trim()))]
            .filter(g => /^[A-L]$/.test(g))
            .sort();
    }

    function ensureGroupsPhaseShell(panel, includeViewToggle) {
        if (!panel || panel.querySelector('.groups-filterbar')) return;

        const modeHTML = includeViewToggle ? `
                <div class="groups-mode">
                    <button type="button" class="groups-mode-btn active" data-mode="stickers">Figurinhas</button>
                    <button type="button" class="groups-mode-btn" data-mode="charts">Gráficos</button>
                </div>
        ` : '';

        const dateHTML = includeViewToggle ? `
                <div class="date-dropdown groups-date-dropdown">
                    <button type="button" class="date-dropdown-btn groups-date-dropdown-btn">
                        Todas as datas <span>▾</span>
                    </button>
                    <div class="date-dropdown-menu groups-date-dropdown-menu"></div>
                </div>
        ` : '';

        const versionHTML = !includeViewToggle ? `
                <div class="date-dropdown groups-version-dropdown">
                    <button type="button" class="date-dropdown-btn groups-version-btn">
                        Versão <span>▾</span>
                    </button>
                    <div class="date-dropdown-menu groups-version-menu"></div>
                </div>
        ` : '';

        const filterbarClasses = includeViewToggle
            ? 'filterbar groups-filterbar has-date'
            : 'filterbar groups-filterbar chances-groups-filterbar';

        const noteHTML = includeViewToggle
            ? `
                <p class="disc groups-prob-note">
                    <span class="groups-prob-note-text">% = Probabilidade estimada de cada placar. Clique para visualizar.</span>
                </p>
            `
            : `
                <div class="texto max-780 font-16" style="margin-bottom: 16px;">
                    <span class="groups-prob-note-text">Chances das seleções de passar a fase de grupos.</span>
                </div>
            `;

        const filterHTML = `
            ${noteHTML}
            <div class="${filterbarClasses}">
                <div class="search-wrap">
                    <span class="search-icon">🔎</span>
                    <input class="country-filter group-country-filter" type="text" placeholder="Buscar Seleção..." autocomplete="off">
                </div>


                ${dateHTML}

                <div class="date-dropdown group-dropdown">
                    <button type="button" class="date-dropdown-btn group-dropdown-btn">
                        Todos os grupos <span>▾</span>
                    </button>
                    <div class="date-dropdown-menu group-dropdown-menu"></div>
                </div>

                ${versionHTML}

                ${modeHTML}
            </div>
            <div class="no-results groups-no-results">${includeViewToggle ? 'Nenhuma partida encontrada com os filtros selecionados.' : 'Nenhum grupo encontrado com os filtros selecionados.'}</div>
        `;

        panel.insertAdjacentHTML('afterbegin', filterHTML);
    }

    // Preenche o dropdown com as letras dos grupos disponíveis no CSV.
    function populateGroupDropdown(groups) {
        const panel = document.getElementById('panel-grupos');
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

    // Preenche o dropdown de datas usando apenas jogos da fase de grupos.
    function populateGroupsDateDropdown(matchRows) {
        const panel = document.getElementById('panel-grupos');
        const menu = panel?.querySelector('.groups-date-dropdown-menu');
        if (!menu) return;

        const dates = matchRows.filter(row => /^[A-L]$/.test(String(row.group ?? '').trim()))
            .map(row => String(row.date ?? '').trim()).filter(Boolean);

        const uniqueDates = [...new Set(dates)].sort((a, b) => parsePrevisoesDate(a) - parsePrevisoesDate(b));
        menu.innerHTML = buildGroupedDateDropdownHTML(uniqueDates);
    }

    // Cria os cards de classificação da fase de grupos para a página de Chances.
    function buildChancesGroupCards(matchRows, summaryRows) {
        const grid = document.getElementById('gg');
        if (!grid) return;

        const panel = document.getElementById('panel-grupos');
        if (!panel) return;

        panel.dataset.groupsMode = 'games';
        ensureGroupsPhaseShell(panel, false);

        grid.innerHTML = '';

        const group32Map = buildGroup32Map(summaryRows);
        const groups = getGroupLetters(matchRows);

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
            const teams = [...new Set(rows.flatMap(r => [r.home_team, r.away_team]).filter(Boolean))];

            const standings = computeGroupStandings(rows);
            const ranking = teams
                .map(t => ({
                    name: t,
                    pct: getGroupFirstPlaceProbability(t, group32Map),
                    ...( standings.get(t) || { pts: 0, gd: 0, gf: 0 } )
                }))
                .sort((a, b) => {
                    if (b.pct !== a.pct) return b.pct - a.pct;
                    if (b.pts !== a.pts) return b.pts - a.pts;
                    if (b.gd !== a.gd) return b.gd - a.gd;
                    return b.gf - a.gf;
                });

            const card = document.createElement('div');
            card.className = 'g-card group-card';
            card.dataset.group = letter;
            card.dataset.search = normalizeName(teams.join(' '));
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
                const probDisplay = Math.round(t.pct * 10) / 10;
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

                if (typeof showStats === 'function' && typeof selectTeam === 'function') {
                    row.addEventListener('mouseenter', () => showStats(t.name));
                    row.addEventListener('mouseleave', () => {
                        const back = (typeof window.selectedTeam !== 'undefined' && window.selectedTeam) ? window.selectedTeam : favorite;
                        showStats(back);
                    });
                    row.addEventListener('click', () => selectTeam(t.name));
                }

                card.appendChild(row);
            });

            grid.appendChild(card);
        });

        populateGroupDropdown(groups);
        installFilterDelegationOnce();
        applyGroupFilters(panel);

        setTimeout(() => {
            document.querySelectorAll('#gg .g-fill').forEach(el => {
                el.style.width = el.dataset.width + '%';
            });
        }, 100);
    }

    // Renderiza os cards de partidas da fase de grupos para Previsões, separados em Figurinhas e Gráficos.
    async function ensurePrevisoesGroupMatchCardsRendered() {
        const panel = document.getElementById('panel-grupos');
        const container = panel?.querySelector('#groups-scorecards');
        if (!panel || !container) return;
        if (container.dataset.ready === '1') return;

        const stageRows = GROUP_STAGE_ROWS.filter(r => /^[A-L]$/.test(String(r.group ?? '').trim()));

        if (!window.ScoreCards?.renderScoreCardHTML || !window.ScoreCards?.getFlagGetterOnce) {
            container.innerHTML = '';
            container.dataset.ready = '1';
            return;
        }

        const getFlag = await window.ScoreCards.getFlagGetterOnce();
        const stickersCards = stageRows.map((r, i) => window.ScoreCards.renderStickerCard(r, getFlag, i)).join('');
        const scorecards = stageRows.map(r => window.ScoreCards.renderScoreCardHTML(r, getFlag)).join('');
        // <div class="section-title">Figurinhas</div> <div class="section-title">Gráficos Detalhados</div>
        container.innerHTML = `
            <div id="groups-stickers-view" class="groups-display-view">
                <div class="stickers-carousel">
                    <button class="scroll-btn left" onclick="this.nextElementSibling.scrollBy({left: -300, behavior: 'smooth'})">❮</button>
                    <div class="stickers-grid">
                        ${stickersCards}
                    </div>
                    <button class="scroll-btn right" onclick="this.previousElementSibling.scrollBy({left: 300, behavior: 'smooth'})">❯</button>
                </div>
            </div>

            <div id="groups-charts-view" class="groups-display-view" style="display: none;">
                <div class="scorecards-grid">
                    ${scorecards}
                </div>
            </div>
        `;

        window.ScoreCards.adjustScoreTotalHeights?.(container);
        container.dataset.ready = '1';
    }

    function buildPrevisoesGroupMatchViews(matchRows) {
        const panel = document.getElementById('panel-grupos');
        if (!panel) return;

        panel.dataset.groupsSource = 'previsoes';
        if (!panel.dataset.groupsMode) panel.dataset.groupsMode = 'stickers';

        ensureGroupsPhaseShell(panel, true);

        let grid = document.getElementById('gg');
        if (grid) grid.style.display = 'none';

        if (!panel.querySelector('#groups-scorecards')) {
            panel.insertAdjacentHTML('beforeend', `<div id="groups-scorecards"></div>`);
        }

        const groups = getGroupLetters(matchRows);
        populateGroupDropdown(groups);
        populateGroupsDateDropdown(matchRows);
        installFilterDelegationOnce();
        setGroupsMode(panel.dataset.groupsMode || 'stickers');
    }

    async function setGroupsMode(mode) {
        const panel = document.getElementById('panel-grupos');
        if (!panel) return;

        // A página de Chances usa apenas a visualização de grupos.
        if (panel.dataset.groupsSource === 'chances') {
            panel.dataset.groupsMode = 'games';
            applyGroupFilters(panel);
            return;
        }

        panel.dataset.groupsMode = mode;

        const filterbar = panel.querySelector('.groups-filterbar');
        if (filterbar) filterbar.classList.add('has-date');

        const probNoteText = panel.querySelector('.groups-prob-note-text');
        if (probNoteText) {
            probNoteText.textContent = '% = Probabilidade estimada de cada placar. Clique para visualizar.';
        }

        panel.querySelectorAll('.groups-mode-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === mode);
        });

        await ensurePrevisoesGroupMatchCardsRendered();

        const stickersView = panel.querySelector('#groups-stickers-view');
        const chartsView = panel.querySelector('#groups-charts-view');

        if (stickersView) stickersView.style.display = (mode === 'stickers') ? '' : 'none';
        if (chartsView) chartsView.style.display = (mode === 'charts') ? '' : 'none';

        applyGroupFilters(panel);
    }

    window.PrevisoesActions = window.PrevisoesActions || {};
    window.PrevisoesActions.setGroupsMode = setGroupsMode;

    window.PrevisoesActions.rebuildGroupsCards = function(summaryRows) {
        const panel = document.getElementById('panel-grupos');
        if (!GROUP_STAGE_ROWS.length || !panel || panel.dataset.groupsSource !== 'chances') return;
        buildChancesGroupCards(GROUP_STAGE_ROWS, summaryRows);
    };

    // Ponto de entrada da fase de grupos: carrega o CSV e chama a montagem correspondente.
    async function renderGroupStage() {
        const panel = document.getElementById('panel-grupos');
        if (!panel) return;

        try {
            const matchRows = await loadCSV(MATCHES_CSV_URL);

            GROUP_STAGE_ROWS = matchRows;

            if (panel.dataset.groupsSource === 'chances') {
                // Sinaliza que as linhas de partidas estão prontas; chances.js fornece as probabilidades.
                document.dispatchEvent(new CustomEvent('groupsPhaseReady'));
            } else {
                buildPrevisoesGroupMatchViews(matchRows);
            }
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
    function getOutcomeGroups(row) {
        const homeWin = [];
        const draw = [];
        const awayWin = [];

        SCORES.forEach(({ h, a, key, label }) => {
            const value = parseNumber(row[key]);

            if (value === null) return;

            const item = {
                key,
                label,
                homeGoals: h,
                awayGoals: a,
                value
            };

            if (h > a) homeWin.push(item);
            else if (h === a) draw.push(item);
            else awayWin.push(item);
        });

        const byProbability = (a, b) => b.value - a.value;

        homeWin.sort(byProbability);
        draw.sort(byProbability);
        awayWin.sort(byProbability);

        return { homeWin, draw, awayWin };
    }

    function sumOutcomes(outcomes) {
        return outcomes.reduce((sum, item) => sum + item.value, 0);
    }

    function getOutcomeTotalFromColumn(row, columnName, fallbackOutcomes) {
        const value = parseNumber(row[columnName]);

        if (value === null) {
            return sumOutcomes(fallbackOutcomes);
        }

        return value <= 1 ? value * 100 : value;
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
                    <div class="score-value">${formatPct(item.value)}%</div>
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

    function renderScoreCard(row, getFlag) {
        const homeCountry = getHomeCountry(row);
        const awayCountry = getAwayCountry(row);

        const { homeWin, draw, awayWin } = getOutcomeGroups(row);

        const best = getBestScore(homeWin, draw, awayWin) || {
            label: '0x0',
            homeGoals: 0,
            awayGoals: 0,
            value: 0
        };

        const rawHomeTotal = getOutcomeTotalFromColumn(row, 'home_win', homeWin);
        const rawAwayTotal = getOutcomeTotalFromColumn(row, 'away_win', awayWin);

        const homeTotal = Number(rawHomeTotal.toFixed(1));
        const awayTotal = Number(rawAwayTotal.toFixed(1));
        const drawTotal = Number((100 - homeTotal - awayTotal).toFixed(1));

        const homeFlag = getFlag(homeCountry);
        const awayFlag = getFlag(awayCountry);

        const matchTitle = `${homeCountry} X ${awayCountry}`;
        const matchDate = row.date || '';

        const homeReal = row.home_real || '—';
        const awayReal = row.away_real || '—';

        const searchText = normalizeName(`${homeCountry} ${awayCountry}`);

        return `
            <section
                class="match-card g-card scorecard-preview"
                onclick="if(window.openMatchCardModal) window.openMatchCardModal(this)"
                onkeydown="if((event.key === 'Enter' || event.key === ' ') && window.openMatchCardModal){event.preventDefault();window.openMatchCardModal(this)}"
                role="button"
                tabindex="0"
                style="cursor: pointer;"
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

    function renderStickerCard(row, getFlag, index = 0) {
        const homeCountry = getHomeCountry(row);
        const awayCountry = getAwayCountry(row);
        const { homeWin, draw, awayWin } = getOutcomeGroups(row);
        const best = getBestScore(homeWin, draw, awayWin) || { label: '0x0', homeGoals: 0, awayGoals: 0, value: 0 };

        const rawHomeTotal = getOutcomeTotalFromColumn(row, 'home_win', homeWin);
        const rawAwayTotal = getOutcomeTotalFromColumn(row, 'away_win', awayWin);

        const homeTotal = Number(rawHomeTotal.toFixed(1));
        const awayTotal = Number(rawAwayTotal.toFixed(1));
        const drawTotal = Number((100 - homeTotal - awayTotal).toFixed(1));

        const homeFlag = getFlag(homeCountry);
        const awayFlag = getFlag(awayCountry);
        const matchDate = row.date || '';
        let matchGroup = getMatchGroup(row);
        if (matchGroup && matchGroup.length === 1) {
            matchGroup = 'Grupo ' + matchGroup;
        }
        const searchText = normalizeName(`${homeCountry} ${awayCountry}`);

        const randomRot = (Math.random() * 10 - 5).toFixed(1); // -5 to +5 degrees
        const randomY = (Math.random() * 16 - 8).toFixed(1);   // -8 to +8 px

        return `
            <div class="match-card sticker-wrapper"
                onclick="if(window.openStickerModal) window.openStickerModal(this, '${escapeHTML(homeCountry)}', '${escapeHTML(awayCountry)}')"
                style="--rand-rot: ${randomRot}deg; --rand-y: ${randomY}px; cursor: pointer;"
                data-home="${escapeHTML(homeCountry)}"
                data-away="${escapeHTML(awayCountry)}"
                data-search="${escapeHTML(searchText)}"
                data-date="${escapeHTML(matchDate)}"
                data-group="${escapeHTML(getMatchGroup(row))}">
                ${renderSticker(row, best, homeFlag, awayFlag, homeTotal, drawTotal, awayTotal, homeCountry, awayCountry, matchDate, matchGroup)}
            </div>
        `;
    }

    function renderSticker(row, best, homeFlag, awayFlag, homeTotal, drawTotal, awayTotal, homeCountry, awayCountry, matchDate, matchGroup) {
        let gridHtml = '';
        let maxProb = 0;

        for (let a = 4; a >= 0; a--) {
            for (let h = 4; h >= 0; h--) {
                const key = `${NUMBER_WORDS[h]}_${NUMBER_WORDS[a]}`;
                const val = parseNumber(row[key]) || 0;
                if (val > maxProb) maxProb = val;
            }
        }
        maxProb = Math.max(maxProb, 1);

        for (let h = 4; h >= 0; h--) {
            for (let a = 0; a <= 4; a++) {
                const key = `${NUMBER_WORDS[h]}_${NUMBER_WORDS[a]}`;
                const prob = parseNumber(row[key]) || 0;
                const alpha = Math.min(1, (prob / maxProb) * 0.7 + 0.1);
                const isBest = (h === best.homeGoals && a === best.awayGoals);
                const bg = isBest ? 'rgba(255, 255, 255, 0.95)' : (prob === 0 ? 'rgba(255, 255, 255, 0.04)' : `rgba(255, 255, 255, ${alpha})`);
                const probText = prob < 0.1 ? (prob > 0 ? '&lt;0.1%' : '0%') : `${formatPct(prob)}%`;

                gridHtml += `
                    <div class="heatmap-cell ${isBest ? 'best' : ''}" style="background: ${bg}">
                        <div class="prob">${probText}</div>
                        <div class="score">${h}x${a}</div>
                    </div>
                `;
            }
        }

        const maxGoals = Math.max(best.homeGoals, best.awayGoals);
        let borderClass = '';
        if (maxGoals === 2) {
            borderClass = 'border-orange';
        } else if (maxGoals >= 3) {
            borderClass = 'border-purple';
        }

        return `
        <div class="sticker-container ${borderClass}">
            <div class="sticker-bg-blur">
                <div class="blur-flag" style="background-image: url('${homeFlag}')"></div>
                <div class="blur-flag" style="background-image: url('${awayFlag}')"></div>
            </div>

            <div class="sticker-glass">
                <div class="sticker-top-info">
                    <span class="info-group">${escapeHTML(matchGroup)}</span>
                    ${matchDate ? `<span class="info-dot">•</span><span class="info-date">${escapeHTML(matchDate)}</span>` : ''}
                </div>

                <div class="sticker-header">
                    <div class="team">
                        <div class="sticker-flag">
                            ${renderFlag(homeCountry, homeFlag)}
                        </div>
                        <div class="team-name">${escapeHTML(homeCountry)}</div>
                    </div>

                    <div class="score-center">
                        <div class="most-likely">${escapeHTML(best.label.replace('x', ' - '))}</div>
                        <div class="most-likely-prob">${formatPct(best.value)}%</div>
                    </div>

                    <div class="team">
                        <div class="sticker-flag">
                            ${renderFlag(awayCountry, awayFlag)}
                        </div>
                        <div class="team-name">${escapeHTML(awayCountry)}</div>
                    </div>
                </div>

                <div class="heatmap-wrapper">
                    <div class="heatmap-grid">
                        ${gridHtml}
                    </div>
                </div>

                <div class="sticker-footer">
                    <div class="footer-bar-container">
                        <div class="f-bar home" style="width: ${homeTotal}%"></div>
                        <div class="f-bar draw" style="width: ${drawTotal}%"></div>
                        <div class="f-bar away" style="width: ${awayTotal}%"></div>
                    </div>
                    <div class="footer-stats-row">
                        <div class="f-stat home">${formatPct(homeTotal)}%</div>
                        <div class="f-stat draw">${formatPct(drawTotal)}%</div>
                        <div class="f-stat away">${formatPct(awayTotal)}%</div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    let __flagRowsPromise = null;
    let __flagGetterPromise = null;
    function getFlagRowsOnce() {
    if (!__flagRowsPromise) __flagRowsPromise = loadCSV(FLAGS_CSV_URL);
    return __flagRowsPromise;
    }

    function getFlagGetterOnce() {
    if (!__flagGetterPromise) {
        __flagGetterPromise = getFlagRowsOnce().then(flagRows => {
            const flagMap = new Map(
              flagRows.map(row => [normalizeName(row.country_pt), normalizeFlagUrl(row.svg_github)])
            );

            const getFlag = country => flagMap.get(normalizeName(country)) || '';
            return getFlag;
        });
    }
    return __flagGetterPromise;
    }

    window.ScoreCards = window.ScoreCards || {};
    window.ScoreCards.renderScoreCardHTML = renderScoreCard;
    window.ScoreCards.renderStickerCard = renderStickerCard;
    window.ScoreCards.getFlagRowsOnce = getFlagRowsOnce;
    window.ScoreCards.getFlagGetterOnce = getFlagGetterOnce;
    window.ScoreCards.adjustScoreTotalHeights = adjustScoreTotalHeights;

    function renderScorePanelShell(panel, stage) {
        const filtersHTML = stage.showFilters === false ? '' : `
            <p class="disc groups-prob-note">
                <span class="groups-prob-note-text">
                    % = Probabilidade estimada de cada placar. Clique para visualizar.
                </span>
            </p>

            <div class="filterbar score-filterbar">
                <div class="filter-field search-field">
                    <div class="search-wrap">
                        <span class="search-icon">🔎</span>
                        <input
                            id="${stage.panelId}-country-filter"
                            class="country-filter"
                            type="text"
                            placeholder="Buscar Seleção..."
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

                <div class="groups-mode score-mode">
                    <button type="button" class="groups-mode-btn active" data-mode="stickers">
                        Figurinhas
                    </button>
                    <button type="button" class="groups-mode-btn" data-mode="charts">
                        Gráficos
                    </button>
                </div>
            </div>
        `;

        panel.innerHTML = `
            ${filtersHTML}

            <div class="stage-content-wrapper"></div>

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

        const uniqueDates = [...new Set(dates)]
            .sort((a, b) => parsePrevisoesDate(a) - parsePrevisoesDate(b));

        dateMenu.innerHTML = buildGroupedDateDropdownHTML(uniqueDates);
    }

    function setScoreMode(panelOrId, mode = 'stickers') {
        const panel = typeof panelOrId === 'string'
            ? document.getElementById(panelOrId)
            : panelOrId;

        if (!panel) return;

        panel.dataset.scoreMode = mode;

        panel.querySelectorAll('.score-mode .groups-mode-btn').forEach(button => {
            button.classList.toggle('active', button.dataset.mode === mode);
        });

        const stickersView = panel.querySelector('.score-stage-stickers-view');
        const chartsView = panel.querySelector('.score-stage-charts-view');

        if (stickersView) {
            stickersView.style.display = mode === 'stickers' ? '' : 'none';
        }

        if (chartsView) {
            chartsView.style.display = mode === 'charts' ? '' : 'none';
        }

        applyScoreFilters(panel);
    }

    window.PrevisoesActions = window.PrevisoesActions || {};
    window.PrevisoesActions.setScoreMode = setScoreMode;

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

    function renderScoreStage(stage, matchRows, getFlag) {
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

        const container = panel.querySelector('.stage-content-wrapper');
        const stickersCards = stageRows.map((row, i) => window.ScoreCards.renderStickerCard(row, getFlag, i)).join('');
        const scorecards = stageRows.map(row => window.ScoreCards.renderScoreCardHTML(row, getFlag)).join('');

        container.innerHTML = stickersCards || scorecards ? `
            <div class="score-stage-display-view score-stage-stickers-view">
                <div class="stickers-carousel">
                    <button class="scroll-btn left" onclick="this.nextElementSibling.scrollBy({left: -300, behavior: 'smooth'})">❮</button>
                    <div class="stickers-grid">
                        ${stickersCards}
                    </div>
                    <button class="scroll-btn right" onclick="this.previousElementSibling.scrollBy({left: 300, behavior: 'smooth'})">❯</button>
                </div>
            </div>

            <div class="score-stage-display-view score-stage-charts-view" style="display: none;">
                <div class="${stage.gridClass || 'scorecards-grid'}">
                    ${scorecards}
                </div>
            </div>
        ` : `
            <div class="score-empty">
                Nenhum confronto encontrado para esta fase.
            </div>
        `;

        if (stage.showFilters !== false) {
            populateDateFilter(panel);
            installFilterDelegationOnce();
        }
        adjustScoreTotalHeights(panel);
        setScoreMode(panel, panel.dataset.scoreMode || 'stickers');
    }

    async function renderScoreStagePanels() {
        try {
            const [matchRows, getFlag] = await Promise.all([
                loadCSV(MATCHES_CSV_URL),
                getFlagGetterOnce()
            ]);

            window.ScoreCards.matchesData = matchRows;

            SCORE_STAGES.forEach(stage => {
                renderScoreStage(stage, matchRows, getFlag);
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



// ════════════════════════════════════════
// SIMULADOR DE CONFRONTOS
// Uses csv/confrontos.csv
// ════════════════════════════════════════
(function () {
    let simulatorRows = [];
    let simulatorCountries = [];
    let activeSimulations = [];
    let cardCounter = 0;
    let getFlag = null;
    let activeIntervals = new Map(); // Store HUD interval IDs for calculating cards

    function resolveSimulatorCountry(value) {
        const normalized = normalizeName(value);
        if (!normalized) return '';
        return simulatorCountries.find(country => normalizeName(country) === normalized) || '';
    }

    function getSimulatorCountries(rows) {
        return [...new Set(rows
            .flatMap(row => [getHomeCountry(row), getAwayCountry(row)])
            .map(country => String(country || '').trim())
            .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }

    function findSimulatorRow(homeCountry, awayCountry) {
        const homeKey = normalizeName(homeCountry);
        const awayKey = normalizeName(awayCountry);

        const exact = simulatorRows.find(row =>
            normalizeName(getHomeCountry(row)) === homeKey &&
            normalizeName(getAwayCountry(row)) === awayKey
        );

        if (exact) {
            return {
                ...exact,
                home_team: homeCountry,
                away_team: awayCountry,
                group: 'Simulação',
                date: ''
            };
        }

        const reversed = simulatorRows.find(row =>
            normalizeName(getHomeCountry(row)) === awayKey &&
            normalizeName(getAwayCountry(row)) === homeKey
        );

        if (!reversed) return null;

        const swapped = {
            ...reversed,
            home_team: homeCountry,
            away_team: awayCountry,
            home_win: reversed.away_win,
            away_win: reversed.home_win,
            draw: reversed.draw,
            group: 'Simulação',
            date: ''
        };

        SCORES.forEach(({ h, a, key }) => {
            swapped[key] = reversed[scoreKey(a, h)] ?? reversed[key];
        });

        return swapped;
    }
    window.findSimulatorRow = findSimulatorRow;

    // Dynamic state management & rendering
    function addSimulationCard(home = '', away = '', triggerAnim = false) {
        cardCounter++;
        const cardId = `sim-card-${cardCounter}`;

        const validatedHome = resolveSimulatorCountry(home);
        const validatedAway = resolveSimulatorCountry(away);

        const sim = {
            id: cardId,
            homeTeam: validatedHome,
            awayTeam: validatedAway,
            status: 'empty'
        };

        if (validatedHome && validatedAway && validatedHome !== validatedAway) {
            if (triggerAnim) {
                sim.status = 'calculating';
                startCalculationSequence(sim);
            } else {
                sim.status = 'ready';
            }
        }

        activeSimulations.push(sim);
        updateSimulationsURL();
        renderSimulatorDashboard();

        // Scroll to the end of the carousel to reveal the new card
        setTimeout(() => {
            const grid = document.getElementById('simulator-cards-grid');
            if (grid) {
                grid.scrollLeft = grid.scrollWidth;
            }
        }, 100);
    }

    function removeSimulationCard(id) {
        // Clear HUD cycle interval if active
        if (activeIntervals.has(id)) {
            clearInterval(activeIntervals.get(id));
            activeIntervals.delete(id);
        }

        activeSimulations = activeSimulations.filter(sim => sim.id !== id);
        updateSimulationsURL();
        renderSimulatorDashboard();
    }

    function startCalculationSequence(sim) {
        const duration = 1500;
        const tickRate = 80;

        // Start the HUD random scorelines/probs cycling interval
        const intervalId = setInterval(() => {
            const hudEl = document.querySelector(`#hud-${sim.id}`);
            if (hudEl) {
                const randomHome = Math.floor(Math.random() * 4);
                const randomAway = Math.floor(Math.random() * 4);
                const randomPct = (Math.random() * 30 + 5).toFixed(1);
                hudEl.textContent = `${randomHome}x${randomAway} | ${randomPct}%`;
            }
        }, tickRate);

        activeIntervals.set(sim.id, intervalId);

        setTimeout(() => {
            clearInterval(intervalId);
            activeIntervals.delete(sim.id);
            sim.status = 'ready';
            renderSimulatorDashboard();
        }, duration);
    }

    function updateSimulationsURL() {
        const url = new URL(window.location.href);
        const simsEncoded = activeSimulations
            .filter(sim => sim.homeTeam && sim.awayTeam)
            .map(sim => `${sim.homeTeam}-${sim.awayTeam}`)
            .join(',');

        if (simsEncoded) {
            url.searchParams.set('sims', simsEncoded);
            url.searchParams.delete('sticker'); // remove legacy param if present
        } else {
            url.searchParams.delete('sims');
        }

        window.history.replaceState({}, '', url.toString());
    }

    window.copySimulatorDashboardLink = function() {
        const url = new URL(window.location.href);
        navigator.clipboard.writeText(url.toString()).then(() => {
            showToast('O link da comparação foi copiado para a área de transferência!');
        });
    };

    function renderSimulatorDashboard() {
        const grid = document.getElementById('simulator-cards-grid');
        const shareBtn = document.getElementById('simulator-share-btn');
        if (!grid) return;

        grid.innerHTML = '';

        // Update Share button status
        if (shareBtn) {
            const hasMatches = activeSimulations.some(sim => sim.homeTeam && sim.awayTeam);
            shareBtn.disabled = !hasMatches;
        }

        // Render each card
        activeSimulations.forEach((sim, idx) => {
            const card = document.createElement('div');
            card.className = `simulator-card ${sim.status === 'ready' ? 'ready' : ''}`;
            card.id = sim.id;

            // HTML content structure of the card
            let resultHTML = '';
            let hasResultClass = '';
            if (sim.status === 'empty') {
                resultHTML = `
                    <div class="card-result-placeholder">
                        <div class="placeholder-icon">⚽</div>
                        <div class="placeholder-text">
                            Escolha duas seleções acima para iniciar a simulação.
                        </div>
                    </div>
                `;
            } else if (sim.status === 'calculating') {
                const flagHome = getFlag ? getFlag(sim.homeTeam) : '';
                const flagAway = getFlag ? getFlag(sim.awayTeam) : '';
                resultHTML = `
                    <div class="simulator-hologram-loader">
                        <div class="hologram-scanner">
                            <div class="hologram-ring outer"></div>
                            <div class="hologram-ring inner"></div>
                            <div class="hologram-core">
                                <div class="hologram-laser-line"></div>
                                <div class="hologram-beam"></div>
                                <div class="hologram-flag-pulsar">
                                    ${flagHome ? `<img src="${flagHome}" alt="">` : ''}
                                    ${flagAway ? `<img src="${flagAway}" alt="">` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="hologram-hud" id="hud-${sim.id}">0x0 | --.-%</div>
                        <div class="hologram-progress-track">
                            <div class="hologram-progress-fill"></div>
                        </div>
                    </div>
                `;
            } else if (sim.status === 'ready') {
                const row = findSimulatorRow(sim.homeTeam, sim.awayTeam);
                if (row && getFlag) {
                    resultHTML = window.ScoreCards.renderStickerCard(row, getFlag, idx);
                    hasResultClass = 'has-result';
                } else {
                    resultHTML = `
                        <div class="card-result-placeholder" style="color: #ef4444;">
                            <div class="placeholder-icon">⚠️</div>
                            <div class="placeholder-text" style="color: #ef4444;">
                                Confronto não disponível no simulador.
                            </div>
                        </div>
                    `;
                }
            }

            card.innerHTML = `
                <button class="card-delete-btn" title="Fechar simulação" onclick="if(window.removeSimulationCard) window.removeSimulationCard('${sim.id}')">×</button>
                <div class="card-title">Simulação #${idx + 1}</div>
                <div class="card-team-selectors">
                    <!-- Home Country Dropdown -->
                    <div class="custom-select-container" id="selector-home-${sim.id}" data-type="home">
                        <div class="custom-select-trigger ${sim.homeTeam ? 'active' : ''}">
                            ${sim.homeTeam ? `
                                <img class="trigger-flag" src="${getFlag ? getFlag(sim.homeTeam) : ''}" alt="">
                                <span class="trigger-label">${escapeHTML(sim.homeTeam)}</span>
                            ` : `
                                <div class="trigger-flag-placeholder">?</div>
                                <span class="trigger-label">Seleção 1</span>
                            `}
                        </div>
                        <div class="custom-select-dropdown">
                            <div class="custom-select-search">
                                <input type="text" placeholder="Buscar..." class="custom-select-search-input" autocomplete="off">
                            </div>
                            <div class="custom-select-list">
                                ${generateDropdownOptions(sim.awayTeam)}
                            </div>
                        </div>
                    </div>

                    <div class="card-versus">×</div>

                    <!-- Away Country Dropdown -->
                    <div class="custom-select-container" id="selector-away-${sim.id}" data-type="away">
                        <div class="custom-select-trigger ${sim.awayTeam ? 'active' : ''}">
                            ${sim.awayTeam ? `
                                <img class="trigger-flag" src="${getFlag ? getFlag(sim.awayTeam) : ''}" alt="">
                                <span class="trigger-label">${escapeHTML(sim.awayTeam)}</span>
                            ` : `
                                <div class="trigger-flag-placeholder">?</div>
                                <span class="trigger-label">Seleção 2</span>
                            `}
                        </div>
                        <div class="custom-select-dropdown">
                            <div class="custom-select-search">
                                <input type="text" placeholder="Buscar..." class="custom-select-search-input" autocomplete="off">
                            </div>
                            <div class="custom-select-list">
                                ${generateDropdownOptions(sim.homeTeam)}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card-result-container ${hasResultClass}">
                    ${resultHTML}
                </div>
            `;

            grid.appendChild(card);

            // Bind click handlers to dropdown trigger buttons
            const bindTrigger = (selectorId, type) => {
                const container = card.querySelector(`#${selectorId}`);
                if (!container) return;

                const trigger = container.querySelector('.custom-select-trigger');
                const dropdown = container.querySelector('.custom-select-dropdown');
                const searchInput = container.querySelector('.custom-select-search-input');
                const options = container.querySelectorAll('.custom-select-option');

                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Close all other dropdowns
                    document.querySelectorAll('.custom-select-dropdown.open').forEach(d => {
                        if (d !== dropdown) d.classList.remove('open');
                    });

                    dropdown.classList.toggle('open');
                    if (dropdown.classList.contains('open')) {
                        searchInput.value = '';
                        filterDropdownOptions(container, '');
                        searchInput.focus();
                    }
                });

                searchInput.addEventListener('input', (e) => {
                    filterDropdownOptions(container, e.target.value);
                });

                searchInput.addEventListener('click', (e) => {
                    e.stopPropagation(); // prevent closing dropdown
                });

                options.forEach(opt => {
                    opt.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const val = opt.getAttribute('data-value');

                        if (type === 'home') {
                            sim.homeTeam = val;
                        } else {
                            sim.awayTeam = val;
                        }

                        dropdown.classList.remove('open');

                        // If both selected, run animation, else empty
                        if (sim.homeTeam && sim.awayTeam && sim.homeTeam !== sim.awayTeam) {
                            sim.status = 'calculating';
                            startCalculationSequence(sim);
                        } else {
                            sim.status = 'empty';
                        }

                        updateSimulationsURL();
                        renderSimulatorDashboard();
                    });
                });
            };

            bindTrigger(`selector-home-${sim.id}`, 'home');
            bindTrigger(`selector-away-${sim.id}`, 'away');
        });

        // Append trailing "+" button
        const addBtnCard = document.createElement('div');
        addBtnCard.className = 'add-card-placeholder';
        addBtnCard.onclick = () => {
            addSimulationCard('', '', false);
        };
        addBtnCard.innerHTML = `
            <div class="add-card-plus-icon"></div>
            <div class="add-card-label">Nova Simulação</div>
        `;
        grid.appendChild(addBtnCard);
    }

    function generateDropdownOptions(excludeCountry = '') {
        const normalizedExclude = normalizeName(excludeCountry);
        return simulatorCountries
            .filter(country => !normalizedExclude || normalizeName(country) !== normalizedExclude)
            .map(country => {
                const flagUrl = getFlag ? getFlag(country) : '';
                return `
                    <div class="custom-select-option" data-value="${escapeHTML(country)}">
                        ${flagUrl ? `<img class="option-flag" src="${flagUrl}" alt="">` : ''}
                        <span>${escapeHTML(country)}</span>
                    </div>
                `;
            }).join('');
    }

    function filterDropdownOptions(container, query) {
        const normalizedQuery = normalizeName(query);
        const options = container.querySelectorAll('.custom-select-option');
        options.forEach(opt => {
            const val = normalizeName(opt.getAttribute('data-value'));
            if (!normalizedQuery || val.includes(normalizedQuery)) {
                opt.style.display = 'flex';
            } else {
                opt.style.display = 'none';
            }
        });
    }

    // Close any open dropdown on click outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select-dropdown.open').forEach(dropdown => {
            dropdown.classList.remove('open');
        });
    });

    // Make global handlers available to HTML controls
    window.removeSimulationCard = removeSimulationCard;

    async function loadSimulationsFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const simsParam = urlParams.get('sims');
        const stickerParam = urlParams.get('sticker'); // legacy single matchup fallback
        const scorecardParam = urlParams.get('scorecard');

        let matchups = [];
        let shouldSwitchToSimulado = false;

        if (simsParam) {
            matchups = simsParam.split(',').map(m => m.split('-'));
            shouldSwitchToSimulado = true;
        } else if (stickerParam) {
            const parts = stickerParam.split('-');
            const home = parts[0];
            const away = parts[1];

            if (home && away) {
                // Wait for matchesData to be loaded to see if it's an official match or custom simulation
                let attempts = 0;
                while ((!window.ScoreCards || !window.ScoreCards.matchesData) && attempts < 20) {
                    await new Promise(r => setTimeout(r, 50));
                    attempts++;
                }

                const isOfficial = window.ScoreCards?.matchesData?.some(
                    r => (r.home_team === home && r.away_team === away)
                );

                if (isOfficial) {
                    // If it is an official matchup, do not add as simulation card
                    // and keep on confrontos tab
                    matchups = [];
                } else {
                    // Custom simulation: load it on simulator and switch to simulado tab!
                    matchups = [[home, away]];
                    shouldSwitchToSimulado = true;
                }

                // Schedule opening the sticker in full screen (modal)
                setTimeout(() => {
                    if (window.openStickerFromData) {
                        window.openStickerFromData(home, away);
                    }
                }, 500);
            }
        } else if (scorecardParam) {
            const parts = scorecardParam.split('|');
            const home = parts[0];
            const away = parts[1];

            if (home && away) {
                let attempts = 0;

                while ((!window.ScoreCards || !window.ScoreCards.matchesData) && attempts < 30) {
                    await new Promise(r => setTimeout(r, 50));
                    attempts++;
                }

                if (window.PrevisoesActions?.setSectionView) {
                    window.PrevisoesActions.setSectionView('confrontos');
                }

                if (window.PrevisoesActions?.setGroupsMode) {
                    window.PrevisoesActions.setGroupsMode('charts');
                }

                setTimeout(() => {
                    if (window.openMatchCardFromData) {
                        window.openMatchCardFromData(home, away);
                    }
                }, 500);
            }
        }

        if (matchups.length) {
            // Load and animate with a staggered visual delay
            matchups.forEach(([home, away], idx) => {
                if (home && away) {
                    setTimeout(() => {
                        addSimulationCard(home, away, true);
                    }, idx * 250);
                }
            });
        } else {
            // No URL configurations: show only a single "+" button
            renderSimulatorDashboard();
        }

        if (shouldSwitchToSimulado) {
            // Ensure window.PrevisoesActions is fully defined
            let actionAttempts = 0;
            while ((!window.PrevisoesActions || !window.PrevisoesActions.setSectionView) && actionAttempts < 20) {
                await new Promise(r => setTimeout(r, 50));
                actionAttempts++;
            }
            if (window.PrevisoesActions && typeof window.PrevisoesActions.setSectionView === 'function') {
                window.PrevisoesActions.setSectionView('simulado');
            }
        }
    }

    async function initConfrontoSimulator() {
        const panel = document.getElementById('simulado-view');
        if (!panel) return;

        try {
            simulatorRows = await loadCSV(SIMULATOR_CSV_URL);
            simulatorCountries = getSimulatorCountries(simulatorRows);
            getFlag = await window.ScoreCards.getFlagGetterOnce();

            if (!simulatorCountries.length) {
                console.error('Nenhuma seleção encontrada em csv/previsoes/all_matchups.csv.');
                return;
            }

            // Read state and load deep link
            await loadSimulationsFromURL();
        } catch (error) {
            console.error(error);
        }
    }

    document.addEventListener('DOMContentLoaded', initConfrontoSimulator);
})();

// Global Modal Functions for Stickers
window.openStickerModal = function(element, home, away) {
    let modal = document.getElementById('sticker-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'sticker-modal';
        modal.className = 'sticker-modal';
        modal.innerHTML = `
            <div class="sticker-modal-overlay" onclick="closeStickerModal()"></div>
            <div class="sticker-modal-content">
                <div id="sticker-modal-card-container"></div>
                <div class="sticker-modal-actions">
                    <button class="sticker-modal-btn" onclick="copyStickerLink('${home}', '${away}')">🔗 Compartilhar</button>
                    <button class="sticker-modal-btn" onclick="closeStickerModal()">✖ Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        const shareBtn = modal.querySelector('.sticker-modal-btn');
        shareBtn.setAttribute('onclick', `copyStickerLink('${home}', '${away}')`);
    }

    const container = modal.querySelector('#sticker-modal-card-container');
    container.innerHTML = '';

    if (element) {
        const sticker = element.querySelector('.sticker-container').cloneNode(true);
        // Reset transformations on the clone so it displays perfectly in the modal
        sticker.style.transform = 'none';
        container.appendChild(sticker);
    }

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
};

window.openStickerFromData = async function(home, away) {
    if (!window.ScoreCards) return;

    let row = null;
    if (window.ScoreCards.matchesData) {
        row = window.ScoreCards.matchesData.find(r => r.home_team === home && r.away_team === away);
    }

    if (!row && typeof window.findSimulatorRow === 'function') {
        row = window.findSimulatorRow(home, away);
    }

    if (!row) return;

    const getFlag = await window.ScoreCards.getFlagGetterOnce();
    const temp = document.createElement('div');
    temp.innerHTML = window.ScoreCards.renderStickerCard(row, getFlag);
    const card = temp.firstElementChild;
    window.openStickerModal(card, home, away);
};

window.closeStickerModal = function() {
    const modal = document.getElementById('sticker-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
};

window.copyStickerLink = function(home, away) {
    const url = new URL(window.location.href);
    url.search = ''; // Clear other parameters like sims so only this card is shared!
    url.searchParams.set('sticker', `${home}-${away}`);
    navigator.clipboard.writeText(url.toString()).then(() => {
        showToast('O link foi copiado para a área de transferência!');
    });
};

// Modal para os cards da aba "Gráficos"
window.openMatchCardModal = function(element) {
    if (!element) return;

    const home = element.dataset.home || '';
    const away = element.dataset.away || '';

    let modal = document.getElementById('match-card-modal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'match-card-modal';
        modal.className = 'sticker-modal match-card-modal';
        modal.innerHTML = `
            <div class="sticker-modal-overlay" onclick="closeMatchCardModal()"></div>
            <div class="sticker-modal-content">
                <div id="match-card-modal-card-container" class="dash"></div>
                <div class="sticker-modal-actions">
                    <button class="sticker-modal-btn" id="match-card-modal-share-btn" type="button">
                        🔗 Compartilhar
                    </button>
                    <button class="sticker-modal-btn" onclick="closeMatchCardModal()" type="button">
                        ✖ Fechar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    const container = modal.querySelector('#match-card-modal-card-container');
    const shareBtn = modal.querySelector('#match-card-modal-share-btn');

    container.innerHTML = '';

    const clone = element.cloneNode(true);

    clone.classList.add('match-card-modal-clone');
    clone.removeAttribute('onclick');
    clone.removeAttribute('onkeydown');
    clone.removeAttribute('tabindex');
    clone.removeAttribute('role');
    clone.style.cursor = 'default';
    clone.style.transform = 'none';

    container.appendChild(clone);

    if (shareBtn) {
        shareBtn.onclick = function () {
            copyMatchCardLink(home, away);
        };
    }

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
};

window.closeMatchCardModal = function() {
    const modal = document.getElementById('match-card-modal');

    if (modal) {
        modal.classList.remove('active');

        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
};

window.copyMatchCardLink = function(home, away) {
    const url = new URL(window.location.href);

    url.search = '';
    url.hash = 'confrontos';
    url.searchParams.set('scorecard', `${home}|${away}`);

    navigator.clipboard.writeText(url.toString()).then(() => {
        showToast('O link foi copiado para a área de transferência!');
    });
};

window.openMatchCardFromData = async function(home, away) {
    if (!window.ScoreCards?.matchesData || !window.ScoreCards?.renderScoreCardHTML) return;

    const row = window.ScoreCards.matchesData.find(r =>
        r.home_team === home &&
        r.away_team === away
    );

    if (!row) return;

    const getFlag = await window.ScoreCards.getFlagGetterOnce();

    const temp = document.createElement('div');
    temp.innerHTML = window.ScoreCards.renderScoreCardHTML(row, getFlag);

    const card = temp.firstElementChild;

    if (card) {
        window.openMatchCardModal(card);
    }
};

function showToast(msg) {
    let toast = document.getElementById('sticker-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'sticker-toast';
        toast.className = 'toast-message';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function initPrevisoesSectionTabs() {
    const buttons = [...document.querySelectorAll('.chances-section-tab')];

    const panels = {
        confrontos: document.getElementById('confrontos-view'),
        simulado: document.getElementById('simulado-view')
    };

    if (!buttons.length) return;

    function setPrevisoesSectionView(view) {
        if (!panels[view]) return;

        buttons.forEach(button => {
            const active = button.dataset.chancesView === view;
            button.classList.toggle('active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        });

        Object.entries(panels).forEach(([key, panel]) => {
            if (panel) panel.classList.toggle('active', key === view);
        });

        document.body.classList.toggle('previsoes-simulado-active', view === 'simulado');

        if (view === 'confrontos') {
            requestAnimationFrame(() => {
                window.dispatchEvent(new Event('resize'));
                window.ScoreCards?.adjustScoreTotalHeights?.(document.getElementById('confrontos-view'));
            });
        }
    }

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            setPrevisoesSectionView(button.dataset.chancesView);
        });
    });

    window.PrevisoesActions = window.PrevisoesActions || {};
    window.PrevisoesActions.setSectionView = setPrevisoesSectionView;

    const activeButton =
        buttons.find(button => button.classList.contains('active')) ||
        buttons[0];

    setPrevisoesSectionView(activeButton.dataset.chancesView);
}

function abrirTabPelaURL() {
    const tabName = window.location.hash.replace('#', '').trim();

    if (!tabName) return;

    const sectionTabs = ['confrontos', 'simulado'];

    if (sectionTabs.includes(tabName)) {
        window.PrevisoesActions?.setSectionView?.(tabName);

        document.querySelector('.chances-section-tabs')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        return;
    }

    const tabsValidas = ['grupos', 'r32', '16-avos', 'oitavas', 'quartas', 'semis', 'final'];

    if (!tabsValidas.includes(tabName)) return;

    window.PrevisoesActions?.setSectionView?.('confrontos');

    const botao = [...document.querySelectorAll('.tabs .tab')]
        .find(btn => {
            const onclick = btn.getAttribute('onclick') || '';
            return onclick.includes(`'${tabName}'`) || onclick.includes(`"${tabName}"`);
        });

    if (botao && typeof switchTab === 'function') {
        switchTab(tabName, botao);

        document.querySelector('.dash')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initPrevisoesSectionTabs();
    abrirTabPelaURL();
});

window.addEventListener('hashchange', abrirTabPelaURL);
