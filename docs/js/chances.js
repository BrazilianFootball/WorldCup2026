// Chances page: table, version filter and view switching.
// The full table data is loaded from tabela_chances.csv.

(function () {
    const TABLE_CSV_URL = 'csv/previsoes/tabela_chances.csv';

    const PLANNED_VERSIONS = [
        'Antes da data FIFA',
        'Antes da Copa - pós data FIFA',
        'Após primeira rodada da fase de grupos',
        'Após segunda rodada da fase de grupos',
        'Após a Fase de Grupos',
        'Após os 16-Avos',
        'Após as Oitavas',
        'Após as Quartas',
        'Após as Semifinais'
    ];

    const COLS = ['pos', 'team', 'champ', 'final', 'semi', 'qf', 'r16', 'r32'];

    let data = [];
    let currentSortCol = 2;
    let currentSortAsc = false;
    let selectedVersion = null;

    const RANKING_COLLAPSED_LIMIT = 15;
    let rankingExpanded = false;

    function escapeHTML(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
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

    function parseNumber(value) {
        if (value === undefined || value === null || value === '') return 0;
        const n = Number(String(value).trim().replace('%', '').replace(',', '.'));
        return Number.isFinite(n) ? n : 0;
    }

    function normalizeText(value) {
        return String(value ?? '')
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    function formatPercent(val) {
        if (val === 0) return "-";
        if (val < 0.01) return "<0.01%";
        return val.toFixed(2) + "%";
    }

    function getVersion(row) {
        return row.version || row.versao || row['versão'] || '';
    }

    function mapCSVRow(row) {
        return {
            version: getVersion(row),
            pos: parseNumber(row.pos),
            team: row.team || '',
            flag: row.flag || '',
            champ: parseNumber(row.champ),
            final: parseNumber(row.final),
            semi: parseNumber(row.semi),
            qf: parseNumber(row.qf),
            r16: parseNumber(row.r16),
            r32: parseNumber(row.r32)
        };
    }

    function availableVersions() {
        return [...new Set(data.map(row => row.version).filter(Boolean))];
    }

    function updateVersionButton() {
        const button = document.querySelector('.ranking-version-btn');
        if (!button) return;
        button.innerHTML = `Versão ${escapeHTML(selectedVersion)} <span>▾</span>`;
    }

    function updateGroupsVersionButton() {
        const button = document.querySelector('.groups-version-btn');
        if (!button) return;
        button.innerHTML = `Versão ${escapeHTML(selectedVersion)} <span>▾</span>`;
    }

    function getSummaryRowsForVersion(version) {
        return data
            .filter(row => row.version === version)
            .map(row => ({ team: row.team, round_of_32: String(row.r32) }));
    }

    function applyGroupsVersion() {
        if (!data.length) return;
        const summaryRows = getSummaryRowsForVersion(selectedVersion);
        window.PrevisoesActions?.rebuildGroupsCards?.(summaryRows);
    }

    function renderGroupsVersionDropdown() {
        const dropdown = document.querySelector('.groups-version-dropdown');
        const menu = document.querySelector('.groups-version-menu');
        const button = document.querySelector('.groups-version-btn');
        if (!dropdown || !menu || !button) return;

        const versions = availableVersions();

        menu.innerHTML = PLANNED_VERSIONS.map(version => {
            const available = versions.includes(version);
            const checked = version === selectedVersion;
            const disabledAttrs = available ? '' : ' disabled aria-disabled="true"';
            const disabledStyle = available ? '' : ' style="opacity:.45; cursor:not-allowed;"';
            return `
                <label class="date-option ranking-version-option"${disabledStyle}>
                    <input type="radio" name="groups-version" value="${escapeHTML(version)}"${checked ? ' checked' : ''}${disabledAttrs}>
                    <span>${escapeHTML(version)}</span>
                </label>
            `;
        }).join('');

        updateGroupsVersionButton();
        if (dropdown.dataset.groupsVersionBound === '1') return;
            dropdown.dataset.groupsVersionBound = '1';

        button.addEventListener('click', event => {
            event.stopPropagation();
            document.querySelectorAll('.date-dropdown.open').forEach(openDropdown => {
                if (openDropdown !== dropdown) openDropdown.classList.remove('open');
            });
            dropdown.classList.toggle('open');
        });

        menu.addEventListener('change', event => {
            const input = event.target;
            if (!input.matches('input[name="groups-version"]') || input.disabled) return;
            selectedVersion = input.value;
            rankingExpanded = false;
            updateVersionButton();
            dropdown.classList.remove('open');
            applyRankingFilters();
            document.dispatchEvent(new CustomEvent('chancesVersionChange', { detail: { version: selectedVersion } }));
        });

        document.addEventListener('click', event => {
            if (!event.target.closest('.groups-version-dropdown')) {
                dropdown.classList.remove('open');
            }
        });
    }

    function renderVersionDropdown() {
        const dropdown = document.querySelector('.ranking-version-dropdown');
        const menu = document.querySelector('.ranking-version-menu');
        const button = document.querySelector('.ranking-version-btn');

        if (!dropdown || !menu || !button) return;

        const versions = availableVersions();

        if (!selectedVersion || !versions.includes(selectedVersion)) {
            selectedVersion = [...PLANNED_VERSIONS].reverse().find(v => versions.includes(v)) || versions[versions.length - 1] || '';
        }

        menu.innerHTML = PLANNED_VERSIONS.map(version => {
            const available = versions.includes(version);
            const checked = version === selectedVersion;
            const disabledAttrs = available
                ? ''
                : ' disabled aria-disabled="true"';
            const disabledStyle = available
                ? ''
                : ' style="opacity:.45; cursor:not-allowed;"';

            return `
                <label class="date-option ranking-version-option"${disabledStyle}>
                    <input type="radio" name="ranking-version" value="${escapeHTML(version)}"${checked ? ' checked' : ''}${disabledAttrs}>
                    <span>${escapeHTML(version)}</span>
                </label>
            `;
        }).join('');

        updateVersionButton();

        button.addEventListener('click', event => {
            event.stopPropagation();
            document.querySelectorAll('.date-dropdown.open').forEach(openDropdown => {
                if (openDropdown !== dropdown) openDropdown.classList.remove('open');
            });
            dropdown.classList.toggle('open');
        });

        menu.addEventListener('change', event => {
            const input = event.target;
            if (!input.matches('input[name="ranking-version"]') || input.disabled) return;

            selectedVersion = input.value;
            rankingExpanded = false;
            updateGroupsVersionButton();
            updateVersionButton();
            dropdown.classList.remove('open');
            applyRankingFilters();
            applyGroupsVersion();
        });

        document.addEventListener('click', event => {
            if (!event.target.closest('.ranking-version-dropdown')) {
                dropdown.classList.remove('open');
            }
        });
    }

    function getFilteredRows() {
        const input = document.getElementById('searchCountry');
        const query = normalizeText(input?.value || '');
        const key = COLS[currentSortCol];

        return data
            .filter(row => !selectedVersion || row.version === selectedVersion)
            .filter(row => !query || normalizeText(row.team).includes(query))
            .slice()
            .sort((a, b) => {
                const valA = a[key];
                const valB = b[key];

                if (typeof valA === 'string') {
                    const cmp = currentSortAsc
                        ? valA.localeCompare(valB)
                        : valB.localeCompare(valA);

                    if (cmp === 0 && key !== 'r32') {
                        return currentSortAsc ? a.r32 - b.r32 : b.r32 - a.r32;
                    }

                    return cmp;
                }

                if (valA === valB && key !== 'r32') {
                    return currentSortAsc ? a.r32 - b.r32 : b.r32 - a.r32;
                }

                return currentSortAsc ? valA - valB : valB - valA;
            });
    }

    function getFilteredRows() {
        const input = document.getElementById('searchCountry');
        const query = normalizeText(input?.value || '');
        const key = COLS[currentSortCol];

        return data
            .filter(row => !selectedVersion || row.version === selectedVersion)
            .filter(row => !query || normalizeText(row.team).includes(query))
            .slice()
            .sort((a, b) => {
                const valA = a[key];
                const valB = b[key];

                if (typeof valA === 'string') {
                    const cmp = currentSortAsc
                        ? valA.localeCompare(valB)
                        : valB.localeCompare(valA);

                    if (cmp === 0 && key !== 'r32') {
                        return currentSortAsc ? a.r32 - b.r32 : b.r32 - a.r32;
                    }

                    return cmp;
                }

                if (valA === valB && key !== 'r32') {
                    return currentSortAsc ? a.r32 - b.r32 : b.r32 - a.r32;
                }

                return currentSortAsc ? valA - valB : valB - valA;
            });
    }

    function getPreviousVersion(version) {
        const index = PLANNED_VERSIONS.indexOf(version);

        if (index <= 0) return null;

        return PLANNED_VERSIONS[index - 1];
    }

    function getMovementKey() {
        const key = COLS[currentSortCol];

        // Se a coluna "Seleção" estiver selecionada, mantém a comparação pelo título.
        // Para #, usa a própria posição.
        return key === 'team' ? 'champ' : key;
    }

    function buildRankMap(version, key) {
        const rows = data
            .filter(row => row.version === version)
            .slice()
            .sort((a, b) => {
                if (key === 'pos') {
                    return a.pos - b.pos;
                }

                if (a[key] === b[key]) {
                    return b.r32 - a.r32;
                }

                return b[key] - a[key];
            });

        const map = new Map();

        rows.forEach((row, index) => {
            map.set(normalizeText(row.team), index + 1);
        });

        return map;
    }

    function getRankMovementMaps() {
        const previousVersion = getPreviousVersion(selectedVersion);

        // Primeira versão não compara com nada.
        if (!previousVersion) return null;

        const key = getMovementKey();

        return {
            current: buildRankMap(selectedVersion, key),
            previous: buildRankMap(previousVersion, key)
        };
    }

    function getRankMovementHTML(item, movementMaps) {
        const emptySlot = `
            <span class="rank-movement rank-neutral" aria-hidden="true"></span>
        `;

        if (!movementMaps) return emptySlot;

        const teamKey = normalizeText(item.team);
        const currentRank = movementMaps.current.get(teamKey);
        const previousRank = movementMaps.previous.get(teamKey);

        if (!currentRank || !previousRank) return emptySlot;

        const diff = previousRank - currentRank;

        if (diff === 0) return emptySlot;

        const amount = Math.abs(diff);
        const directionClass = diff > 0 ? 'rank-up' : 'rank-down';
        const icon = diff > 0 ? 'arrow_upward' : 'arrow_downward';
        const label = diff > 0
            ? `Subiu ${amount} posição${amount > 1 ? 'ões' : ''}`
            : `Caiu ${amount} posição${amount > 1 ? 'ões' : ''}`;

        return `
            <span class="rank-movement ${directionClass}" title="${label}" aria-label="${label}">
                <span class="material-icons">${icon}</span>
                <span>${amount}</span>
            </span>
        `;
    }

    function ensureRankingExpandControl() {
        const tableContainer = document.getElementById('chances-table-container');
        if (!tableContainer) return null;

        let wrap = document.querySelector('.ranking-expand-wrap');

        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'ranking-expand-wrap';

            const text = document.createElement('span');
            text.className = 'ranking-expand-info';

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ranking-expand-link';

            wrap.appendChild(text);
            wrap.appendChild(button);

            tableContainer.insertAdjacentElement('afterend', wrap);
        }

        return {
            wrap,
            text: wrap.querySelector('.ranking-expand-info'),
            button: wrap.querySelector('.ranking-expand-link')
        };
    }

    function updateRankingExpandControl(totalItems) {
        const control = ensureRankingExpandControl();
        const tableContainer = document.getElementById('chances-table-container');

        if (!control || !tableContainer) return;

        const { wrap, text, button } = control;

        if (totalItems <= RANKING_COLLAPSED_LIMIT) {
            wrap.style.display = 'none';
            tableContainer.classList.remove('ranking-table-collapsed');
            return;
        }

        wrap.style.display = 'flex';

        tableContainer.classList.toggle(
            'ranking-table-collapsed',
            !rankingExpanded
        );

        const visibleCount = rankingExpanded
            ? totalItems
            : RANKING_COLLAPSED_LIMIT;

        text.textContent = `Exibindo ${visibleCount} de ${totalItems} seleções`;

        button.textContent = rankingExpanded
            ? 'Mostrar menos'
            : 'Ver tabela completa';

        button.setAttribute('aria-expanded', rankingExpanded ? 'true' : 'false');

        button.onclick = () => {
            rankingExpanded = !rankingExpanded;
            applyRankingFilters();

            if (!rankingExpanded) {
                tableContainer.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        };
    }


    function renderTable(items) {
        const tbody = document.getElementById('chancesTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const movementMaps = getRankMovementMaps();

        const visibleItems = rankingExpanded
            ? items
            : items.slice(0, RANKING_COLLAPSED_LIMIT);

        updateRankingExpandControl(items.length);

        visibleItems.forEach((item, index) => {
            const isBrasil = item.team === 'Brasil';
            const defaultBg = isBrasil ? 'rgba(0, 155, 58, 0.15)' : 'transparent';
            const hoverBg = isBrasil ? 'rgba(0, 155, 58, 0.25)' : '#f4f8fa';

            const tr = document.createElement('tr');
            tr.className = 'animated-row';
            tr.style.animationDelay = `${index * 0.03}s`;
            tr.style.borderBottom = isBrasil ? '2px solid #009b3a' : '1px solid #eee';
            tr.style.backgroundColor = defaultBg;
            tr.onmouseover = () => tr.style.backgroundColor = hoverBg;
            tr.onmouseout = () => tr.style.backgroundColor = defaultBg;

            const getCellClass = colIdx => {
                return currentSortCol === colIdx ? 'number-cell sorted-column' : 'number-cell';
            };

            const multiLineTeams = {
                'Bósnia e Herzegovina': 'Bósnia e<br>Herzegovina',
                'República Democrática do Congo': 'República<br>Democrática do Congo'
            };

            const hasMultiLineName = !!multiLineTeams[item.team];

            const teamNameHtml = hasMultiLineName
                ? multiLineTeams[item.team]
                : escapeHTML(item.team);

            const teamNameClass = hasMultiLineName
                ? 'team-name team-name-two-lines'
                : 'team-name';

            tr.innerHTML = `
                <td style="padding: 12px; color: #666;">${item.pos}</td>
                <td style="padding: 12px; text-align: left; font-weight: bold; font-family: 'gotham-bold';">
                    <div class="team-cell-inner">
                        ${getRankMovementHTML(item, movementMaps)}
                        <img src="${escapeHTML(item.flag)}" class="animated-flag">
                        <span class="${teamNameClass}">${teamNameHtml}</span>
                    </div>
                </td>
                <td class="${getCellClass(2)}" style="padding: 12px; font-weight: bold;">${formatPercent(item.champ)}</td>
                <td class="${getCellClass(3)}" style="padding: 12px; color: #444;">${formatPercent(item.final)}</td>
                <td class="${getCellClass(4)}" style="padding: 12px; color: #444;">${formatPercent(item.semi)}</td>
                <td class="${getCellClass(5)}" style="padding: 12px; color: #444;">${formatPercent(item.qf)}</td>
                <td class="${getCellClass(6)}" style="padding: 12px; color: #444;">${formatPercent(item.r16)}</td>
                <td class="${getCellClass(7)}" style="padding: 12px; color: #444;">${formatPercent(item.r32)}</td>
            `;

            tbody.appendChild(tr);
        });
    }

    function updateHeaders() {
        const ths = document.querySelectorAll('#chancesTable th');

        ths.forEach((th, index) => {
            const iconSpan = th.querySelector('.sort-icon');
            if (!iconSpan) return;

            if (index === currentSortCol) {
                iconSpan.textContent = currentSortAsc ? 'arrow_upward' : 'arrow_downward';
                iconSpan.style.opacity = '1';
                th.classList.add('sorted-column');
                th.style.borderBottom = '3px solid #ffd700';
            } else {
                iconSpan.textContent = 'swap_vert';
                iconSpan.style.opacity = '0.5';
                th.classList.remove('sorted-column');
                th.style.borderBottom = '';
            }
        });
    }

    function applyRankingFilters() {
        renderTable(getFilteredRows());
        updateHeaders();
    }

    function sortTable(colIndex) {
        if (currentSortCol === colIndex) {
            currentSortAsc = !currentSortAsc;
        } else {
            currentSortCol = colIndex;
            currentSortAsc = false;
            if (colIndex === 1) currentSortAsc = true;
        }

        applyRankingFilters();
    }

    window.sortTable = sortTable;

    async function initRankingTable() {
        const tbody = document.getElementById('chancesTableBody');
        if (!tbody) return;

        try {
            data = (await loadCSV(TABLE_CSV_URL)).map(mapCSVRow);

            currentSortCol = 2;
            currentSortAsc = false;

            renderVersionDropdown();
            applyRankingFilters();
            applyGroupsVersion(); /* Cria a barra da Fase de Grupos */
            renderGroupsVersionDropdown(); /* Ativa o dropdown depois que a barra foi criada */

            const searchInput = document.getElementById('searchCountry');
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    rankingExpanded = false;
                    applyRankingFilters();
                });
            }
        } catch (error) {
            console.error(error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="padding: 16px; color: #666;">
                        Não foi possível carregar a tabela de chances.
                    </td>
                </tr>
            `;
        }
    }

    function initChancesTabs() {
        const buttons = document.querySelectorAll('.chances-section-tab');
        const panels = {
            ranking: document.getElementById('ranking-view'),
            'groups-phase': document.getElementById('groups-phase-view'),
            bracket: document.getElementById('bracket-view')
        };

        function setChancesView(view) {
            buttons.forEach(button => {
                const active = button.dataset.chancesView === view;
                button.classList.toggle('active', active);
                button.setAttribute('aria-selected', active ? 'true' : 'false');
            });

            Object.entries(panels).forEach(([key, panel]) => {
                if (panel) panel.classList.toggle('active', key === view);
            });

            document.body.classList.toggle('chances-bracket-active', view === 'bracket');

            if (view === 'bracket' && typeof window.drawLines === 'function') {
                requestAnimationFrame(() => requestAnimationFrame(window.drawLines));
            }
        }

        function checkHash() {
            const hash = window.location.hash.replace('#', '');
            if (panels[hash]) {
                setChancesView(hash);
            }
        }

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const view = button.dataset.chancesView;
                window.location.hash = view;
            });
        });

        // Executa a checagem no carregamento inicial da página
        checkHash();

        // Escuta mudanças de hash (navegação via links ou histórico)
        window.addEventListener('hashchange', checkHash);
    }

    function init() {
        initChancesTabs();
        initRankingTable();

        document.addEventListener('groupsPhaseReady', () => {
            applyGroupsVersion();
            renderGroupsVersionDropdown();
        });

        document.addEventListener('chancesVersionChange', e => {
            if (e.detail.version === selectedVersion) return;
            selectedVersion = e.detail.version;
            const rankingMenu = document.querySelector('.ranking-version-menu');
            if (rankingMenu) {
                rankingMenu.querySelectorAll('input[name="ranking-version"]').forEach(input => {
                    input.checked = input.value === selectedVersion;
                });
            }
            const groupsMenu = document.querySelector('.groups-version-menu');
            if (groupsMenu) {
                groupsMenu.querySelectorAll('input[name="groups-version"]').forEach(input => {
                    input.checked = input.value === selectedVersion;
                });
            }
            updateVersionButton();
            updateGroupsVersionButton();
            applyRankingFilters();
            applyGroupsVersion();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
