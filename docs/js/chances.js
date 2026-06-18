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
            updateGroupsVersionButton();
            updateVersionButton();
            dropdown.classList.remove('open');
            applyRankingFilters();
            applyGroupsVersion();
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
            updateVersionButton();
            dropdown.classList.remove('open');
            applyRankingFilters();
            document.dispatchEvent(new CustomEvent('chancesVersionChange', { detail: { version: selectedVersion } }));
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

    function renderTable(items) {
        const tbody = document.getElementById('chancesTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        items.forEach((item, index) => {
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
            renderGroupsVersionDropdown();
            applyRankingFilters();
            applyGroupsVersion();

            const searchInput = document.getElementById('searchCountry');
            if (searchInput) {
                searchInput.addEventListener('input', applyRankingFilters);
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
